"use client";

import type { Message } from "ai";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

import { SparklesIcon } from "./icons";
import { Markdown } from "./markdown";
import { PreviewAttachment } from "./preview-attachment";
import { cn } from "@/lib/utils";
import { Weather } from "./weather";

// Typing cursor component
const TypingCursor = ({ isVisible }: { isVisible: boolean }) => {
  return (
    <motion.span
      className={cn(
        "inline-block w-0.5 h-4 bg-gray-600 ml-1 typing-cursor",
        isVisible ? "opacity-100" : "opacity-0"
      )}
      animate={{
        opacity: isVisible ? [1, 0] : 0,
      }}
      transition={{
        duration: 0.8,
        repeat: isVisible ? Infinity : 0,
        repeatType: "reverse",
      }}
    />
  );
};

export const PreviewMessage = ({
  message,
  isLoading,
}: {
  chatId: string;
  message: Message;
  isLoading: boolean;
}) => {
  const [showCursor, setShowCursor] = useState(false);

  // Show cursor when assistant message is being streamed
  useEffect(() => {
    if (message.role === "assistant" && isLoading) {
      setShowCursor(true);
    } else {
      // Hide cursor after a brief delay when streaming completes
      const timeout = setTimeout(() => setShowCursor(false), 500);
      return () => clearTimeout(timeout);
    }
  }, [message.role, isLoading, message.content]);

  return (
    <motion.div
      className={cn(
        "w-full mx-auto max-w-3xl px-4 group/message streaming-message",
        isLoading && message.role === "assistant" && "streaming-content"
      )}
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      data-role={message.role}
    >
      <div
        className={cn(
          "group-data-[role=user]/message:bg-primary group-data-[role=user]/message:text-primary-foreground flex gap-4 group-data-[role=user]/message:px-3 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2 rounded-xl",
        )}
      >
        {message.role === "assistant" && (
          <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border">
            <SparklesIcon size={14} />
          </div>
        )}

        <div className="flex flex-col gap-2 w-full">
          {message.content && (
            <div className="flex flex-col gap-4">
              <div className={cn(
                "relative streaming-text",
                isLoading && message.role === "assistant" && "streaming-content"
              )}>
                <Markdown>{message.content as string}</Markdown>
                {message.role === "assistant" && showCursor && (
                  <TypingCursor isVisible={true} />
                )}
              </div>
            </div>
          )}

          {message.toolInvocations && message.toolInvocations.length > 0 && (
            <div className="flex flex-col gap-4">
              {message.toolInvocations.map((toolInvocation) => {
                const { toolName, toolCallId, state } = toolInvocation;

                if (state === "result") {
                  const { result } = toolInvocation;

                  return (
                    <div key={toolCallId}>
                      {toolName === "get_current_weather" ? (
                        <Weather weatherAtLocation={result} />
                      ) : (
                        <pre>{JSON.stringify(result, null, 2)}</pre>
                      )}
                    </div>
                  );
                }
                return (
                  <div
                    key={toolCallId}
                    className={cn({
                      skeleton: ["get_current_weather"].includes(toolName),
                    })}
                  >
                    {toolName === "get_current_weather" ? <Weather /> : null}
                  </div>
                );
              })}
            </div>
          )}

          {message.experimental_attachments && (
            <div className="flex flex-row gap-2">
              {message.experimental_attachments.map((attachment) => (
                <PreviewAttachment
                  key={attachment.url}
                  attachment={attachment}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const ThinkingMessage = () => {
  const role = "assistant";

  return (
    <motion.div
      className="w-full mx-auto max-w-3xl px-4 group/message thinking-animation"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 1 } }}
      data-role={role}
    >
      <div
        className={cn(
          "flex gap-4 group-data-[role=user]/message:px-3 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2 rounded-xl",
          {
            "group-data-[role=user]/message:bg-muted": true,
          },
        )}
      >
        <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <SparklesIcon size={14} />
          </motion.div>
        </div>

        <div className="flex flex-col gap-2 w-full">
          <div className="flex flex-col gap-4 text-muted-foreground">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              Thinking...
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
