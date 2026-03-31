from typing import Annotated
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db, async_session_factory
from app.auth import AuthenticatedUser
from . import service
from .schemas import SendMessageRequest, MessageOut, ConversationOut

router = APIRouter()
DbSession = Annotated[AsyncSession, Depends(get_db)]


@router.post("/conversations", response_model=ConversationOut, status_code=201)
async def create_conversation(user: AuthenticatedUser, db: DbSession):
    conv = await service.create_conversation(user, db)
    return ConversationOut(
        id=conv.id, title=conv.title,
        created_at=conv.created_at, updated_at=conv.updated_at,
        message_count=0, last_message_preview=None,
    )


@router.get("/conversations", response_model=list[ConversationOut])
async def list_conversations(
    user: AuthenticatedUser, db: DbSession,
    limit: int = Query(20, ge=1, le=50),
):
    return await service.list_conversations(user, db, limit=limit)


@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageOut])
async def get_messages(
    conversation_id: UUID, user: AuthenticatedUser, db: DbSession,
    limit: int = Query(50, ge=1, le=200),
):
    return await service.get_conversation_messages(conversation_id, user, db, limit=limit)


@router.post("/conversations/{conversation_id}/stream")
async def stream_message(
    conversation_id: UUID, data: SendMessageRequest,
    user: AuthenticatedUser, db: DbSession,
):
    """Send a message and stream JAY's response via SSE.

    DB work (save user msg, build context) happens first.
    Then streaming happens independently of the DB session.
    After streaming, response is saved in a new DB session.
    """
    # Phase 1: Do all DB work and commit
    prep = await service.prepare_stream(
        conversation_id=conversation_id,
        user_message=data.content, user=user, db=db,
        mode=data.mode,
    )

    async def event_generator():
        full_response = ""
        try:
            from app.ai.providers.gemini import GeminiProvider
            provider = GeminiProvider()
            response_stream = await provider.get_stream(
                system_prompt=prep["system_prompt"],
                messages=prep["ai_messages"],
                temperature=0.7, max_tokens=2048,
            )
            async for chunk in response_stream:
                if chunk.text:
                    full_response += chunk.text
                    yield f"data: {chunk.text}\n\n"
        except RuntimeError:
            fallback = (
                f"Hey {prep['user_full_name'] or 'there'}! I'm JAY. "
                f"My AI brain is being configured (GEMINI_API_KEY needs to be set in .env)."
            )
            full_response = fallback
            yield f"data: {fallback}\n\n"
        except Exception as e:
            error_msg = f"Sorry, I ran into an issue: {str(e)}. Please try again."
            full_response = error_msg
            yield f"data: {error_msg}\n\n"

        yield "data: [DONE]\n\n"

        # Phase 2: Save response in a new DB session (old one is closed)
        if full_response:
            async with async_session_factory() as save_db:
                await service.save_assistant_message(
                    prep["conversation_id"], full_response, save_db
                )

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/conversations/{conversation_id}/messages", response_model=MessageOut)
async def send_message(
    conversation_id: UUID, data: SendMessageRequest,
    user: AuthenticatedUser, db: DbSession,
):
    return await service.send_message_sync(
        conversation_id=conversation_id,
        user_message=data.content, user=user, db=db,
        mode=data.mode,
    )


@router.delete("/conversations/{conversation_id}", status_code=204)
async def delete_conversation(
    conversation_id: UUID, user: AuthenticatedUser, db: DbSession,
):
    await service.delete_conversation(conversation_id, user, db)
