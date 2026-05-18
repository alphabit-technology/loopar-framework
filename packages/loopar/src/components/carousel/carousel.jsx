import { useState, useEffect, useRef, useCallback } from "react";

export default function CarouselBase({
  slides = [],
  renderSlide,

  defaultIndex = 0,
  current,
  onChange,

  autoplay = false,
  intervalMs = 5000,
  pauseOnHover = true,
  loop = true,
  keyboard = false,
  touch = true,
  swipeThreshold = 50,
  swipeVelocity = 0.3,

  exitDurationMs = 0,
  transitionDurationMs = 500,

  containerClassName = "",
  containerStyle,
  ariaLabel,

  renderArrowLeft,
  renderArrowRight,
  renderIndicators,
  renderBefore,
  renderAfter,

  onSlideEnter,
}) {
  const itemCount = slides.length;
  const isControlled = typeof current === "number";

  const [internalIndex, setInternalIndex] = useState(() => clampIndex(defaultIndex, itemCount));
  const [prevIndex, setPrevIndex] = useState(() => clampIndex(defaultIndex, itemCount));
  const [isExiting, setIsExiting] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const indexRef = useRef(internalIndex);
  const isExitingRef = useRef(false);
  const isTransitioningRef = useRef(false);

  const exitTimeoutRef = useRef(null);
  const transitionTimeoutRef = useRef(null);
  const intervalRef = useRef(null);
  const touchRef = useRef({ startX: 0, startY: 0, endX: 0, endY: 0, isDragging: false, startTime: 0 });
  const containerRef = useRef(null);

  const index = isControlled ? clampIndex(current, itemCount) : internalIndex;

  useEffect(() => { indexRef.current = index; }, [index]);
  useEffect(() => { isExitingRef.current = isExiting; }, [isExiting]);
  useEffect(() => { isTransitioningRef.current = isTransitioning; }, [isTransitioning]);

  const goTo = useCallback((nextIndex) => {
    if (itemCount === 0) return;
    const wrapped = wrapIndex(nextIndex, itemCount, loop);
    if (wrapped === null) return;
    if (wrapped === indexRef.current) return;

    const commit = () => {
      const previous = indexRef.current;
      setPrevIndex(previous);
      if (!isControlled) setInternalIndex(wrapped);
      indexRef.current = wrapped;
      onChange?.(wrapped, previous);
      onSlideEnter?.(wrapped);

      if (transitionDurationMs > 0) {
        setIsTransitioning(true);
        if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
        transitionTimeoutRef.current = setTimeout(() => {
          setIsTransitioning(false);
        }, transitionDurationMs);
      }
    };

    if (exitDurationMs > 0) {
      if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
      setIsTransitioning(false);
      setIsExiting(true);
      exitTimeoutRef.current = setTimeout(() => {
        setIsExiting(false);
        commit();
      }, exitDurationMs);
      return;
    }

    commit();
  }, [itemCount, loop, isControlled, onChange, onSlideEnter, exitDurationMs, transitionDurationMs]);

  const next = useCallback(() => goTo(indexRef.current + 1), [goTo]);
  const prev = useCallback(() => goTo(indexRef.current - 1), [goTo]);

  useEffect(() => {
    if (isControlled) indexRef.current = current;
  }, [isControlled, current]);

  const clearAutoplay = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const nextRef = useRef(next);
  useEffect(() => { nextRef.current = next; }, [next]);

  const startAutoplay = useCallback(() => {
    if (!autoplay || itemCount <= 1) return;
    clearAutoplay();
    intervalRef.current = setInterval(() => {
      nextRef.current();
    }, Math.max(1000, intervalMs));
  }, [autoplay, itemCount, intervalMs, clearAutoplay]);

  useEffect(() => {
    startAutoplay();
    return () => {
      clearAutoplay();
      if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
    };
  }, [startAutoplay, clearAutoplay]);

  useEffect(() => {
    if (!pauseOnHover) return;
    if (isHovered) clearAutoplay();
    else startAutoplay();
  }, [isHovered, pauseOnHover, clearAutoplay, startAutoplay]);

  useEffect(() => {
    if (!keyboard) return;
    const handler = (e) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
      else if (e.key === "ArrowRight") { e.preventDefault(); next(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [keyboard, prev, next]);

  const handlePointerStart = useCallback((x, y) => {
    if (!touch || itemCount <= 1) return;
    touchRef.current = {
      startX: x, startY: y, endX: x, endY: y,
      isDragging: true,
      startTime: Date.now(),
    };
    clearAutoplay();
  }, [touch, itemCount, clearAutoplay]);

  const handlePointerMove = useCallback((x, y, e) => {
    if (!touchRef.current.isDragging) return;
    touchRef.current.endX = x;
    touchRef.current.endY = y;
    if (e?.preventDefault) {
      const dx = Math.abs(x - touchRef.current.startX);
      const dy = Math.abs(y - touchRef.current.startY);
      if (dx > dy && dx > 10) e.preventDefault();
    }
  }, []);

  const handlePointerEnd = useCallback(() => {
    if (!touchRef.current.isDragging) return;
    const { startX, endX, startY, endY, startTime } = touchRef.current;
    const dx = endX - startX;
    const dy = endY - startY;
    const dt = Math.max(1, Date.now() - startTime);
    const velocity = Math.abs(dx) / dt;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > swipeThreshold || velocity > swipeVelocity) {
        if (dx > 0) prev(); else next();
      }
    }
    touchRef.current.isDragging = false;
    startAutoplay();
  }, [prev, next, startAutoplay, swipeThreshold, swipeVelocity]);

  const onTouchStart = (e) => { const t = e.touches?.[0]; if (t) handlePointerStart(t.clientX, t.clientY); };
  const onTouchMove = (e) => { const t = e.touches?.[0]; if (t) handlePointerMove(t.clientX, t.clientY, e); };
  const onTouchEnd = () => handlePointerEnd();

  const onMouseDown  = (e) => handlePointerStart(e.clientX, e.clientY);
  const onMouseMove  = (e) => {
    if (!touchRef.current.isDragging) return;
    handlePointerMove(e.clientX, e.clientY);
  };
  const onMouseUp    = () => handlePointerEnd();
  const onMouseLeave = () => {
    if (touchRef.current.isDragging) {
      touchRef.current.isDragging = false;
      startAutoplay();
    }
    setIsHovered(false);
  };

  const slideCtx = useCallback((i) => ({
    index: i,
    isCurrent: i === index,
    isPrev: i === prevIndex && i !== index,
    isActive: i === index && !isExiting,
    isExiting,
    isTransitioning,
  }), [index, prevIndex, isExiting, isTransitioning]);

  if (itemCount === 0) {
    return (
      <div
        className={containerClassName}
        style={containerStyle}
        role={ariaLabel ? "region" : undefined}
        aria-label={ariaLabel}
        ref={containerRef}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className={containerClassName}
      style={containerStyle}
      role={ariaLabel ? "region" : undefined}
      aria-label={ariaLabel}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={onMouseLeave}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
    >
      {renderBefore?.({ index, prevIndex, count: itemCount, hovered: isHovered, goTo, next, prev })}

      {slides.map((slide, i) => renderSlide(slide, slideCtx(i)))}

      {renderArrowLeft?.({ onClick: prev, hovered: isHovered, count: itemCount, disabled: !loop && index === 0 })}
      {renderArrowRight?.({ onClick: next, hovered: isHovered, count: itemCount, disabled: !loop && index === itemCount - 1 })}
      {renderIndicators?.({ current: index, count: itemCount, goTo })}

      {renderAfter?.({ current: index, count: itemCount, goTo, slides })}
    </div>
  );
}

function clampIndex(i, count) {
  if (count <= 0) return 0;
  const n = Math.floor(Number(i) || 0);
  return Math.max(0, Math.min(count - 1, n));
}

function wrapIndex(i, count, loop) {
  if (count <= 0) return null;
  if (loop) {
    return ((i % count) + count) % count;
  }
  if (i < 0 || i >= count) return null;
  return i;
}
