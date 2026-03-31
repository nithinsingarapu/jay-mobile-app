"""
Ask JAY chat service.
"""
import uuid
from datetime import datetime, timezone
from typing import AsyncIterator
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import CurrentUser
from app.shared.exceptions import NotFoundError
from .models import Conversation, Message


async def create_conversation(user: CurrentUser, db: AsyncSession) -> Conversation:
    conv = Conversation(user_id=user.id)
    db.add(conv)
    await db.flush()
    return conv


async def list_conversations(user: CurrentUser, db: AsyncSession, limit: int = 20) -> list[dict]:
    result = await db.execute(
        select(Conversation)
        .where(Conversation.user_id == user.id)
        .order_by(Conversation.updated_at.desc())
        .limit(limit)
    )
    conversations = result.scalars().all()

    out = []
    for conv in conversations:
        count_result = await db.execute(
            select(func.count(Message.id)).where(Message.conversation_id == conv.id)
        )
        msg_count = count_result.scalar() or 0

        last_msg_result = await db.execute(
            select(Message.content)
            .where(Message.conversation_id == conv.id)
            .order_by(Message.created_at.desc())
            .limit(1)
        )
        last_msg = last_msg_result.scalar()
        preview = last_msg[:80] + "..." if last_msg and len(last_msg) > 80 else last_msg

        out.append({
            "id": conv.id,
            "title": conv.title,
            "created_at": conv.created_at,
            "updated_at": conv.updated_at,
            "message_count": msg_count,
            "last_message_preview": preview,
        })
    return out


async def get_conversation_messages(
    conversation_id: uuid.UUID, user: CurrentUser, db: AsyncSession, limit: int = 50
) -> list[Message]:
    conv = await _get_conversation_owned_by(conversation_id, user.id, db)
    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conv.id)
        .order_by(Message.created_at.asc())
        .limit(limit)
    )
    return list(result.scalars().all())


async def delete_conversation(conversation_id: uuid.UUID, user: CurrentUser, db: AsyncSession):
    conv = await _get_conversation_owned_by(conversation_id, user.id, db)
    await db.delete(conv)


async def prepare_stream(
    conversation_id: uuid.UUID,
    user_message: str,
    user: CurrentUser,
    db: AsyncSession,
    mode: str = "General",
) -> dict:
    """
    Do all DB work upfront: save user message, build context, load history.
    Returns everything needed to stream the response.
    """
    conv = await _get_conversation_owned_by(conversation_id, user.id, db)

    # Save user message
    user_msg = Message(conversation_id=conv.id, role="user", content=user_message)
    db.add(user_msg)
    await db.flush()

    # Auto-title from first message
    if not conv.title:
        conv.title = user_message[:60] + ("..." if len(user_message) > 60 else "")
    conv.updated_at = datetime.now(timezone.utc)
    await db.flush()

    # Build context
    from app.ai.context import build_user_context
    from app.ai.prompts.chat_system import get_system_prompt
    user_context = await build_user_context(user.id, db)
    system_prompt = get_system_prompt(mode, user_context)

    # Load last 10 messages for history
    history_result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conv.id, Message.id != user_msg.id)
        .order_by(Message.created_at.desc())
        .limit(10)
    )
    history_messages = list(reversed(history_result.scalars().all()))

    ai_messages = [{"role": m.role, "content": m.content} for m in history_messages]
    ai_messages.append({"role": "user", "content": user_message})

    # Commit DB work before streaming starts
    await db.commit()

    return {
        "conversation_id": conv.id,
        "system_prompt": system_prompt,
        "ai_messages": ai_messages,
        "user_full_name": user.full_name,
    }


async def save_assistant_message(conversation_id: uuid.UUID, content: str, db: AsyncSession):
    """Save JAY's response after streaming completes."""
    msg = Message(conversation_id=conversation_id, role="assistant", content=content)
    db.add(msg)
    await db.commit()


async def send_message_sync(
    conversation_id: uuid.UUID,
    user_message: str,
    user: CurrentUser,
    db: AsyncSession,
    mode: str = "General",
) -> Message:
    conv = await _get_conversation_owned_by(conversation_id, user.id, db)

    user_msg = Message(conversation_id=conv.id, role="user", content=user_message)
    db.add(user_msg)
    await db.flush()

    if not conv.title:
        conv.title = user_message[:60] + ("..." if len(user_message) > 60 else "")
    conv.updated_at = datetime.now(timezone.utc)
    await db.flush()

    from app.ai.context import build_user_context
    from app.ai.prompts.chat_system import get_system_prompt
    user_context = await build_user_context(user.id, db)
    system_prompt = get_system_prompt(mode, user_context)

    history_result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conv.id, Message.id != user_msg.id)
        .order_by(Message.created_at.desc())
        .limit(10)
    )
    history = list(reversed(history_result.scalars().all()))
    ai_messages = [{"role": m.role, "content": m.content} for m in history]
    ai_messages.append({"role": "user", "content": user_message})

    try:
        from app.ai.providers.gemini import GeminiProvider
        provider = GeminiProvider()
        response_text = await provider.generate(system_prompt=system_prompt, messages=ai_messages)
    except Exception as e:
        response_text = f"Sorry, I ran into an issue: {str(e)}. Try again in a moment."

    assistant_msg = Message(conversation_id=conv.id, role="assistant", content=response_text)
    db.add(assistant_msg)
    await db.flush()
    return assistant_msg


async def _get_conversation_owned_by(
    conversation_id: uuid.UUID, user_id: str, db: AsyncSession
) -> Conversation:
    result = await db.execute(
        select(Conversation).where(Conversation.id == conversation_id)
    )
    conv = result.scalar_one_or_none()
    if not conv or conv.user_id != user_id:
        raise NotFoundError("Conversation", str(conversation_id))
    return conv
