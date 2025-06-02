import asyncio
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import json
import sys
import time

# Use absolute imports for Vercel compatibility
try:
    from api.services.leadership_coach import LeadershipCoachService
except ImportError:
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
    CRITICAL: This endpoint MUST flush every chunk immediately with zero buffering.
    """
    try:

        async def generate_response():
            print(
                f"[FASTAPI] Starting stream for message: {chat_message.message[:50]}...",
                flush=True,
            )

            chunk_count = 0
            async for chunk in coach_service.chat_stream(chat_message.message):
                chunk_count += 1
                timestamp = time.time()

                # CRITICAL: Create SSE data and yield immediately
                sse_data = f"data: {json.dumps({'chunk': chunk, 'timestamp': timestamp, 'chunk_num': chunk_count})}\n\n"

                print(
                    f"[FASTAPI] Yielding chunk #{chunk_count} at {timestamp}: '{chunk[:20]}...'",
                    flush=True,
                )

                # FORCE immediate flush - this is critical
                yield sse_data

                # Small delay to ensure no buffering accumulation
                await asyncio.sleep(0.001)

            # Send completion signal
            final_timestamp = time.time()
            yield f"data: {json.dumps({'done': True, 'timestamp': final_timestamp, 'total_chunks': chunk_count})}\n\n"
            print(f"[FASTAPI] Stream complete. Total chunks: {chunk_count}", flush=True)

        return StreamingResponse(
            generate_response(),
            media_type="text/event-stream",
            headers={
                # CRITICAL ANTI-BUFFERING HEADERS
                "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
                "Pragma": "no-cache",
                "Expires": "0",
                "Connection": "keep-alive",
                "Content-Type": "text/event-stream",
                "X-Accel-Buffering": "no",  # Disable nginx buffering
                "X-Content-Type-Options": "nosniff",
                "Transfer-Encoding": "chunked",
                # CORS headers
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Expose-Headers": "*",
            },
        )

    except Exception as e:
        print(f"[FASTAPI ERROR] {str(e)}", flush=True)
        raise HTTPException(status_code=500, detail=f"Error processing chat: {str(e)}")


print("**********************")
print("**********************")
print("**********************")


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
