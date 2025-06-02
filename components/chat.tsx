"use client";

import { PreviewMessage, ThinkingMessage } from "@/components/message";
import { MultimodalInput } from "@/components/multimodal-input";
import { Overview } from "@/components/overview";
import { useScrollToBottom } from "@/hooks/use-scroll-to-bottom";
import { useState, useRef, useCallback } from "react";
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

  // Function to force scroll to bottom
  const forceScrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
        inline: "nearest"
      });
    }
  }, [messagesEndRef]);

  // Optimized streaming update function with immediate UI updates
  const updateStreamingMessage = useCallback((messageId: string, newChunk: string) => {
    setMessages((prev) => {
      const updated = prev.map((msg) => {
        if (msg.id === messageId) {
          const updatedContent = msg.content + newChunk;
          return { ...msg, content: updatedContent };
        }
        return msg;
      });
      return updated;
    });
  }, []);

  const handleSubmit = async (e?: { preventDefault?: () => void }) => {
    e?.preventDefault?.();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      createdAt: new Date(),
    };

    const currentInput = input.trim();
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Force scroll to bottom after adding user message
    setTimeout(() => forceScrollToBottom(), 100);

    // Create abort controller for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      console.log("[FRONTEND] Starting chat request...");
      const startTime = Date.now();

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify({
          message: currentInput,
        }),
        signal: abortController.signal,
      });

      console.log(`[FRONTEND] Response received in ${Date.now() - startTime}ms, status:`, response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Create assistant message immediately for streaming
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setStreamingMessageId(assistantMessage.id);

      // Force scroll to bottom when assistant message is added
      setTimeout(() => forceScrollToBottom(), 100);

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No reader available");
      }

      console.log("[FRONTEND] Starting to read stream...");
      const decoder = new TextDecoder();
      let buffer = "";
      let chunkCount = 0;
      const streamStartTime = Date.now();

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            console.log(`[FRONTEND] Stream complete. Total chunks: ${chunkCount}`);
            break;
          }

          chunkCount++;
          const chunkReceiveTime = Date.now();

          // Decode chunk immediately
          const rawChunk = decoder.decode(value, { stream: true });
          console.log(`[FRONTEND] Chunk #${chunkCount} received (+${chunkReceiveTime - streamStartTime}ms): "${rawChunk.slice(0, 50).replace(/\n/g, '\\n')}..."`);

          buffer += rawChunk;

          // Process all complete SSE events in buffer
          let eventEnd;
          while ((eventEnd = buffer.indexOf("\n\n")) !== -1) {
            const event = buffer.substring(0, eventEnd);
            buffer = buffer.substring(eventEnd + 2);

            // Parse SSE event
            const lines = event.split("\n");
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6));

                  if (data.chunk) {
                    // IMMEDIATE UI UPDATE - This is critical for real-time display
                    const updateTime = Date.now();
                    console.log(`[FRONTEND] Displaying chunk: "${data.chunk}" (+${updateTime - streamStartTime}ms)`);

                    // Use the optimized update function
                    updateStreamingMessage(assistantMessage.id, data.chunk);

                  } else if (data.done) {
                    console.log(`[FRONTEND] Stream complete. Total chunks: ${data.total_chunks || chunkCount}`);
                    setIsLoading(false);
                    setStreamingMessageId(null);
                    return;
                  }
                } catch (parseError) {
                  console.error(`[FRONTEND] JSON parse error:`, parseError, `Line: "${line}"`);
                }
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("[FRONTEND] Request cancelled by user");
        toast.info("Request cancelled");
        // Remove the empty assistant message
        setMessages((prev) => prev.slice(0, -1));
      } else {
        console.error("[FRONTEND] Chat error:", error);
        toast.error("Failed to send message. Please try again.");
        // Remove the empty assistant message
        setMessages((prev) => prev.slice(0, -1));
      }
    } finally {
      setIsLoading(false);
      setStreamingMessageId(null);
      abortControllerRef.current = null;
    }
  };

  const stop = () => {
    if (abortControllerRef.current) {
      console.log("[FRONTEND] Stopping stream...");
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

    // Force scroll to bottom when new message is appended
    setTimeout(() => forceScrollToBottom(), 100);

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
          className="flex flex-col min-w-0 gap-6 flex-1 overflow-y-scroll pt-4 chat-scroll auto-scroll"
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
