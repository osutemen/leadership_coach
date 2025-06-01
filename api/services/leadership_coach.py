from openai import OpenAI
import os
from dotenv import load_dotenv
from typing import List, Dict, Any, AsyncGenerator
from ..utils.prompt import TOOLS, SYSTEM_PROMPT

load_dotenv()


class LeadershipCoachService:
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.conversation_history = [{"role": "system", "content": SYSTEM_PROMPT}]

    async def chat_stream(self, message: str) -> AsyncGenerator[str, None]:
        """
        Stream chat responses from the leadership coach.
        """
        # Append user message to history
        self.conversation_history.append(
            {"role": "user", "content": [{"type": "input_text", "text": message}]}
        )

        # Collect the response content for history
        response_content = []

        try:
            # Query the OpenAI responses.stream endpoint with tools enabled
            with self.client.responses.stream(
                model="gpt-4.1",
                input=self.conversation_history,
                text={"format": {"type": "text"}},
                reasoning={},
                tools=TOOLS,
                temperature=0.6,
                tool_choice="auto",
                max_output_tokens=2048,
                top_p=1,
                store=True,
            ) as stream:
                for event in stream:
                    if event.type == "response.refusal.delta":
                        yield event.delta
                        response_content.append({"type": "text", "text": event.delta})
                    elif event.type == "response.output_text.delta":
                        yield event.delta
                        response_content.append({"type": "text", "text": event.delta})
                    elif event.type == "response.error":
                        yield f"Error: {event.error}"

                # Add assistant reply to the conversation history
                if response_content:
                    # Combine all text content into a single block
                    combined_text = "".join(
                        block["text"]
                        for block in response_content
                        if block.get("type") == "text"
                    )
                    self.conversation_history.append(
                        {
                            "role": "assistant",
                            "content": [{"type": "output_text", "text": combined_text}],
                        }
                    )

        except Exception as e:
            yield f"Error occurred: {str(e)}"

    def reset_conversation(self):
        """Reset the conversation history to start fresh."""
        self.conversation_history = [{"role": "system", "content": SYSTEM_PROMPT}]

    def get_conversation_history(self) -> List[Dict[str, Any]]:
        """Get the current conversation history."""
        return self.conversation_history
