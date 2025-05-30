from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import json
from ..services.leadership_coach import LeadershipCoachService

router = APIRouter()

# Global instance of the leadership coach service
coach_service = LeadershipCoachService()


class ChatMessage(BaseModel):
    message: str
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    session_id: Optional[str] = None


@router.post("/chat")
async def chat(chat_message: ChatMessage):
    """
    Send a message to the leadership coach and get a streaming response.
    """
    try:

        async def generate_response():
            async for chunk in coach_service.chat_stream(chat_message.message):
                # Send each chunk as Server-Sent Events format
                yield f"data: {json.dumps({'chunk': chunk})}\n\n"

            # Send end signal
            yield f"data: {json.dumps({'done': True})}\n\n"

        return StreamingResponse(
            generate_response(),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Content-Type": "text/event-stream",
            },
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing chat: {str(e)}")


@router.post("/chat/reset")
async def reset_chat():
    """
    Reset the conversation history.
    """
    try:
        coach_service.reset_conversation()
        return {"message": "Conversation reset successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error resetting chat: {str(e)}")


@router.get("/chat/history")
async def get_chat_history():
    """
    Get the current conversation history.
    """
    try:
        history = coach_service.get_conversation_history()
        return {"history": history}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error getting chat history: {str(e)}"
        )
