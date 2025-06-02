import { useEffect, useRef, type RefObject } from "react";

export function useScrollToBottom<T extends HTMLElement>(): [
  RefObject<T>,
  RefObject<T>,
] {
  const containerRef = useRef<T>(null);
  const endRef = useRef<T>(null);

  useEffect(() => {
    const container = containerRef.current;
    const end = endRef.current;

    if (container && end) {
      let timeoutId: NodeJS.Timeout;

      const scrollToBottom = (immediate = false) => {
        const isNearBottom =
          container.scrollTop + container.clientHeight >=
          container.scrollHeight - 100;

        // Always scroll during streaming or if user is near bottom
        if (isNearBottom || immediate) {
          end.scrollIntoView({
            behavior: immediate ? "auto" : "smooth",
            block: "end",
            inline: "nearest"
          });
        }
      };

      const observer = new MutationObserver((mutations) => {
        clearTimeout(timeoutId);

        // Check if this is a text content change (likely streaming)
        const hasTextChanges = mutations.some(mutation =>
          mutation.type === 'characterData' ||
          (mutation.type === 'childList' && mutation.addedNodes.length > 0)
        );

        if (hasTextChanges) {
          // For text content changes (streaming), scroll immediately
          timeoutId = setTimeout(() => scrollToBottom(false), 10);
        } else {
          // For other changes (new messages), use smooth scroll
          timeoutId = setTimeout(() => scrollToBottom(false), 50);
        }
      });

      observer.observe(container, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
      });

      // Initial scroll to bottom when component mounts
      const initialTimeout = setTimeout(() => scrollToBottom(true), 100);

      return () => {
        observer.disconnect();
        clearTimeout(timeoutId);
        clearTimeout(initialTimeout);
      };
    }
  }, []);

  return [containerRef, endRef];
}
