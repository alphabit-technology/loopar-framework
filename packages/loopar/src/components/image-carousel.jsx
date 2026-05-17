import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import fileManager from "@@file/file-manager";

export default function ImageCarousel({
  images,
  aspect = "aspect-[16/10]",
  rounded = "rounded-xl",
  autoplay = false,
  intervalMs = 5000,
  showThumbs = true,
  showCounter = true,
  onImageClick,
  className = "",
}) {
  const slides = useMemo(() => {
    const mapped = fileManager.getMappedFiles(images) || [];
    return mapped
      .filter(f => f && (f.type === "image" || /^image\//.test(f.type || "")))
      .map(f => ({ src: f.src, thumb: f.previewSrc || f.src, name: f.name }));
  }, [images]);

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchRef = useRef({ x: 0, dragging: false });

  useEffect(() => { setIndex(0); }, [slides.length]);

  const goTo = useCallback((i) => {
    if (slides.length === 0) return;
    const wrapped = ((i % slides.length) + slides.length) % slides.length;
    setIndex(wrapped);
  }, [slides.length]);

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  useEffect(() => {
    if (!autoplay || paused || slides.length < 2) return;
    const t = setInterval(() => {
      setIndex(i => (i + 1) % slides.length);
    }, Math.max(1500, intervalMs));
    return () => clearInterval(t);
  }, [autoplay, paused, slides.length, intervalMs]);

  const onKeyDown = (e) => {
    if (slides.length < 2) return;
    if (e.key === "ArrowRight") { e.preventDefault(); next(); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
  };

  const onTouchStart = (e) => {
    touchRef.current.x = e.touches?.[0]?.clientX ?? 0;
    touchRef.current.dragging = true;
  };
  const onTouchEnd = (e) => {
    if (!touchRef.current.dragging) return;
    touchRef.current.dragging = false;
    const endX = e.changedTouches?.[0]?.clientX ?? 0;
    const dx = endX - touchRef.current.x;
    if (Math.abs(dx) < 40) return;
    if (dx < 0) next(); else prev();
  };

  if (slides.length === 0) {
    return (
      <div className={`bg-secondary text-secondary-foreground ${rounded} ${aspect} flex items-center justify-center text-sm opacity-60 ${className}`}>
        No images
      </div>
    );
  }

  const current = slides[index];

  return (
    <div
      className={`flex flex-col gap-3 ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onKeyDown={onKeyDown}
      tabIndex={0}
    >
      <div
        className={`relative bg-card ${rounded} overflow-hidden ${aspect} group select-none`}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {slides.map((s, i) => (
          <img
            key={s.src + i}
            src={s.src}
            alt={s.name || `Image ${i + 1}`}
            loading={i === 0 ? "eager" : "lazy"}
            draggable={false}
            onClick={() => onImageClick?.(s, i)}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
              i === index ? "opacity-100" : "opacity-0 pointer-events-none"
            } ${onImageClick ? "cursor-zoom-in" : ""}`}
          />
        ))}

        {slides.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/70 text-foreground backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/70 text-foreground backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {slides.map((_, i) => (
                <button
                  type="button"
                  key={i}
                  aria-label={`Go to image ${i + 1}`}
                  onClick={() => goTo(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === index
                      ? "bg-primary w-5"
                      : "bg-background/70 hover:bg-background"
                  }`}
                />
              ))}
            </div>

            {showCounter && (
              <div className="absolute top-2 right-2 text-xs px-2 py-1 rounded-md bg-background/70 text-foreground backdrop-blur">
                {index + 1} / {slides.length}
              </div>
            )}
          </>
        )}
      </div>

      {showThumbs && slides.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {slides.map((s, i) => (
            <button
              type="button"
              key={s.src + i}
              onClick={() => goTo(i)}
              className={`relative shrink-0 w-20 h-14 rounded-md overflow-hidden border-2 transition-all ${
                i === index ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
              }`}
              aria-label={`Show image ${i + 1}`}
            >
              <img
                src={s.thumb || s.src}
                alt={s.name || `Thumbnail ${i + 1}`}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
