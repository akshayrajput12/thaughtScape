
import { useCallback, useEffect, useRef, useState } from "react";

interface ScrollState {
  isAtBottom: boolean;
  autoScrollEnabled: boolean;
}

export function useAutoScroll(containerRef: React.RefObject<HTMLDivElement>, deps: any[] = []) {
  const lastContentHeight = useRef(0);
  const userHasScrolled = useRef(false);
  const [scrollState, setScrollState] = useState<ScrollState>({
    isAtBottom: true,
    autoScrollEnabled: true,
  });

  const checkIsAtBottom = useCallback((element: HTMLElement) => {
    const { scrollTop, scrollHeight, clientHeight } = element;
    const distanceToBottom = Math.abs(scrollHeight - scrollTop - clientHeight);
    return distanceToBottom <= 20; // 20px threshold
  }, []);

  const scrollToBottom = useCallback((instant?: boolean) => {
    if (!containerRef.current) return;

    const targetScrollTop = containerRef.current.scrollHeight - containerRef.current.clientHeight;

    if (instant) {
      containerRef.current.scrollTop = targetScrollTop;
    } else {
      containerRef.current.scrollTo({
        top: targetScrollTop,
        behavior: "smooth",
      });
    }

    setScrollState({
      isAtBottom: true,
      autoScrollEnabled: true,
    });
    userHasScrolled.current = false;
  }, [containerRef]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const atBottom = checkIsAtBottom(containerRef.current);

    setScrollState((prev) => ({
      isAtBottom: atBottom,
      // Re-enable auto-scroll if at the bottom
      autoScrollEnabled: atBottom ? true : prev.autoScrollEnabled,
    }));
  }, [checkIsAtBottom, containerRef]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    element.addEventListener("scroll", handleScroll, { passive: true });
    return () => element.removeEventListener("scroll", handleScroll);
  }, [handleScroll, containerRef]);

  useEffect(() => {
    const scrollElement = containerRef.current;
    if (!scrollElement) return;

    const currentHeight = scrollElement.scrollHeight;
    const hasNewContent = currentHeight !== lastContentHeight.current;

    if (hasNewContent) {
      if (scrollState.autoScrollEnabled) {
        requestAnimationFrame(() => {
          scrollToBottom(lastContentHeight.current === 0);
        });
      }
      lastContentHeight.current = currentHeight;
    }
  }, [deps, scrollState.autoScrollEnabled, scrollToBottom, containerRef]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const resizeObserver = new ResizeObserver(() => {
      if (scrollState.autoScrollEnabled) {
        scrollToBottom(true);
      }
    });

    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, [scrollState.autoScrollEnabled, scrollToBottom, containerRef]);

  const disableAutoScroll = useCallback(() => {
    const atBottom = containerRef.current
      ? checkIsAtBottom(containerRef.current)
      : false;

    // Only disable if not at bottom
    if (!atBottom) {
      userHasScrolled.current = true;
      setScrollState((prev) => ({
        ...prev,
        autoScrollEnabled: false,
      }));
    }
  }, [checkIsAtBottom, containerRef]);

  return {
    isAtBottom: scrollState.isAtBottom,
    autoScrollEnabled: scrollState.autoScrollEnabled,
    scrollToBottom: () => scrollToBottom(false),
    disableAutoScroll,
  };
}
