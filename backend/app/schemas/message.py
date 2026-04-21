from pydantic import BaseModel, ConfigDict


class MessageCrete(BaseModel):
    chat_id: int
    text: str


class SendMessageResponse(BaseModel):
    id: int
    chat_id: int
    sender_id: int
    text: str

    model_config = ConfigDict(from_attributes=True)