from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime


class SendMessageRequest(BaseModel):
    content: str = Field(min_length=1, max_length=5000)
    mode: str = "General"  # General, Routine help, Product research, Ingredient check


class MessageOut(BaseModel):
    id: UUID
    role: str
    content: str
    metadata_: dict | None = Field(None, alias="metadata_")
    created_at: datetime

    model_config = {"from_attributes": True, "populate_by_name": True}


class ConversationOut(BaseModel):
    id: UUID
    title: str | None
    created_at: datetime
    updated_at: datetime
    message_count: int = 0
    last_message_preview: str | None = None

    model_config = {"from_attributes": True}


class ConversationDetailOut(BaseModel):
    id: UUID
    title: str | None
    created_at: datetime
    messages: list[MessageOut]

    model_config = {"from_attributes": True}
