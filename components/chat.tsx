"use client";

import { PreviewMessage, ThinkingMessage } from "@/components/message";
import { MultimodalInput } from "@/components/multimodal-input";
import { Overview } from "@/components/overview";
import { useScrollToBottom } from "@/hooks/use-scroll-to-bottom";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { Message } from "ai";
import { Button } from "@/components/ui/button";
import { BroomIcon } from "@/components/icons";

export function Chat() {
  const chatId = "leadership-coach";
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

  const handleSubmit = async (e?: { preventDefault?: () => void }) => {
    e?.preventDefault?.();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Create abort controller for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      console.log("[FRONTEND] Starting fetch to /api/chat...");
      const startTime = Date.now();

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input.trim(),
        }),
        signal: abortController.signal,
      });

      console.log(`[FRONTEND] Fetch response received after ${Date.now() - startTime}ms, status:`, response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setStreamingMessageId(assistantMessage.id);

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No reader available");
      }

      console.log("[FRONTEND] Starting to read stream...");
      const decoder = new TextDecoder();
      let rawBuffer = ""; // Raw text buffer
      let chunkCount = 0;
      const firstChunkTime = Date.now();

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          console.log(`[FRONTEND] Stream reading completed after ${chunkCount} chunks`);
          break;
        }

        chunkCount++;
        const chunkTime = Date.now();
        const timeSinceStart = chunkTime - firstChunkTime;

        // Decode the chunk immediately
        const rawChunk = decoder.decode(value, { stream: true });
        console.log(`[FRONTEND] Chunk #${chunkCount} at +${timeSinceStart}ms: ${rawChunk.length} chars - "${rawChunk.slice(0, 30).replace(/\n/g, '\\n')}..."`);

        rawBuffer += rawChunk;

        // CRITICAL: Process ALL complete SSE events in buffer immediately
        let eventEndIndex;
        let eventsProcessed = 0;

        while ((eventEndIndex = rawBuffer.indexOf("\n\n")) !== -1) {
          const sseEvent = rawBuffer.substring(0, eventEndIndex);
          rawBuffer = rawBuffer.substring(eventEndIndex + 2);
          eventsProcessed++;

          console.log(`[FRONTEND] Processing SSE event #${eventsProcessed}: "${sseEvent.replace(/\n/g, '\\n')}"`);

          // Parse each line in the SSE event
          const lines = sseEvent.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const jsonData = JSON.parse(line.slice(6));
                console.log(`[FRONTEND] Parsed JSON:`, jsonData);

                if (jsonData.chunk) {
                  const updateTime = Date.now();
                  console.log(`[FRONTEND] Adding text chunk at +${updateTime - firstChunkTime}ms: "${jsonData.chunk}"`);

                  // CRITICAL: Update React state immediately for each chunk
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessage.id
                        ? { ...msg, content: msg.content + jsonData.chunk }
                        : msg
                    )
                  );
                } else if (jsonData.done) {
                  console.log(`[FRONTEND] Stream complete signal received. Total chunks: ${jsonData.total_chunks || 'unknown'}`);
                  setIsLoading(false);
                  setStreamingMessageId(null);
                  return; // Exit completely
                }
              } catch (error) {
                console.error(`[FRONTEND] JSON parse error for line: "${line}"`, error);
                // Continue processing other lines - don't let one bad line stop the stream
              }
            }
          }
        }

        // Log remaining buffer content
        if (rawBuffer.length > 0) {
          console.log(`[FRONTEND] Remaining buffer (${rawBuffer.length} chars): "${rawBuffer.slice(0, 50).replace(/\n/g, '\\n')}..."`);
        }
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("[FRONTEND] Request cancelled by user");
        toast.info("Request cancelled");
      } else {
        console.error("[FRONTEND] Chat error:", error);
        toast.error("Failed to send message. Please try again.");
      }
      setMessages((prev) => prev.slice(0, -1)); // Remove the empty assistant message
    } finally {
      setIsLoading(false);
      setStreamingMessageId(null);
      abortControllerRef.current = null;
    }
  };

  const stop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      setStreamingMessageId(null);
    }
  };

  const append = async (message: Message | any) => {
    const messageToAdd: Message = {
      id: message.id || Date.now().toString(),
      role: message.role,
      content: message.content,
      createdAt: message.createdAt || new Date(),
    };
    setMessages((prev) => [...prev, messageToAdd]);
    return messageToAdd.id;
  };

  const resetChat = async () => {
    try {
      await fetch("/api/chat/reset", {
        method: "POST",
      });
      setMessages([]);
      toast("Conversation is cleared");
    } catch (error) {
      toast.error("Failed to clear conversation");
    }
  };

  return (
    <div className="flex flex-col min-w-0 h-[calc(100dvh-52px)] bg-gradient-to-b from-gray-50 to-white">
      {/* Clear button in top-right corner */}
      {messages.length > 0 && (
        <div className="flex justify-end p-4 pb-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={resetChat}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 h-14 w-14"
            title="Clear"
          >
            <BroomIcon size={28} />
          </Button>
        </div>
      )}

      {/* Messages container */}
      {messages.length > 0 && (
        <div
          ref={messagesContainerRef}
          className="flex flex-col min-w-0 gap-6 flex-1 overflow-y-scroll pt-4 chat-scroll"
        >
          {messages.map((message, index) => (
            <PreviewMessage
              key={message.id}
              chatId={chatId}
              message={message}
              isLoading={isLoading && message.id === streamingMessageId}
            />
          ))}

          {isLoading &&
            messages.length > 0 &&
            messages[messages.length - 1].role === "user" && <ThinkingMessage />}

          <div
            ref={messagesEndRef}
            className="shrink-0 min-w-[24px] min-h-[24px]"
          />
        </div>
      )}

      {/* Centered input form when no messages */}
      {messages.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center px-4" style={{ paddingBottom: "25vh" }}>
          <Overview />
          <div className="w-full md:max-w-2xl">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              className="flex gap-2 w-full"
            >
              <MultimodalInput
                chatId={chatId}
                input={input}
                setInput={setInput}
                handleSubmit={handleSubmit}
                isLoading={isLoading}
                stop={stop}
                messages={messages}
                setMessages={setMessages}
                append={append}
              />
            </form>
          </div>
        </div>
      )}

      {/* Bottom input form when there are messages */}
      {messages.length > 0 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="flex mx-auto px-4 bg-gradient-to-t from-white to-transparent pb-4 md:pb-6 gap-2 w-full md:max-w-3xl"
        >
          <MultimodalInput
            chatId={chatId}
            input={input}
            setInput={setInput}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            stop={stop}
            messages={messages}
            setMessages={setMessages}
            append={append}
          />
        </form>
      )}
    </div>
  );
}
