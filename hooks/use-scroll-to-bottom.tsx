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

      const observer = new MutationObserver(() => {
        // Debounce scroll to avoid excessive scrolling during streaming
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          // Check if user is near bottom before auto-scrolling
          const isNearBottom =
            container.scrollTop + container.clientHeight >=
            container.scrollHeight - 100;

          if (isNearBottom) {
            end.scrollIntoView({
              behavior: "smooth",
              block: "end",
              inline: "nearest"
            });
          }
        }, 50);
      });

      observer.observe(container, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
      });

      return () => {
        observer.disconnect();
        clearTimeout(timeoutId);
      };
    }
  }, []);

  return [containerRef, endRef];
}
