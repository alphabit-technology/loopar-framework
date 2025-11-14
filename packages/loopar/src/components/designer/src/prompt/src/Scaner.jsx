import { useState, useEffect, useRef, useCallback } from "react";

export const Scaner = ({ text }) => {
  const [animKey, setAnimKey] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [lineHeight, setLineHeight] = useState(4); // in rem
  const [duration, setDuration] = useState(5000); // in ms

  const contentRef = useRef(null);
  const containerRef = useRef(null);

  const measureContent = useCallback(() => {
    if (contentRef.current && containerRef.current) {
      const contentRect = contentRef.current.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();

      const realHeight = contentRect.height;
      const safeHeight = Math.max(realHeight - (lineHeight * 16 * 0.5), realHeight * 0.85);

      setContentHeight(safeHeight);

      const container = containerRef.current;
      container.style.setProperty('--content-height', `${safeHeight}px`);
      container.style.setProperty('--scan-line', `${lineHeight}rem`);
      container.style.setProperty('--scan-duration', `${duration}ms`);
    }
  }, [lineHeight, duration]);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        measureContent();
        setAnimKey(k => k + 1);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [open, text, measureContent]);

  useEffect(() => {
    if (!open) return;

    const handleResize = () => {
      measureContent();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [open, measureContent]);

  if (!open) return null;


  const paragraphs = String(text || "")
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  return(
    <div
      ref={containerRef}
      className="scan-container relative w-full overflow-hidden rounded-xl"
      style={{
        minHeight: '200px',
      }}
    >
      <div
        ref={contentRef}
        className="absolute opacity-20 pointer-events-none inset-0 p-4"
        aria-hidden="true"
      >
        {paragraphs.map((p, i) => (
          <p
            key={`ref-${i}`}
            className="mb-4 leading-relaxed text-base sm:text-lg last:mb-0"
          >
            {p}
          </p>
        ))}
      </div>

      <div className="filter blur-sm opacity-60 select-none pointer-events-none p-4">
        {paragraphs.map((p, i) => (
          <p
            key={`blur-${i}`}
            className="mb-4 leading-relaxed text-base sm:text-lg text-slate-700 dark:text-slate-300 last:mb-0"
          >
            {p}
          </p>
        ))}
      </div>

        <div className="absolute inset-0 pointer-events-none">
            <div
            key={`mask-${animKey}`}
            className="w-full h-full scan-mask"
            style={{
                opacity: 1,
            }}
            >
            {paragraphs.map((p, i) => (
                <p
                key={`clear-${i}`}
                className="mb-4 leading-relaxed text-base sm:text-xl text-slate-900 dark:text-slate-100 last:mb-0 p-2"
                >
                {p}
                </p>
            ))}
            </div>

            <div
            key={`band-${animKey}`}
            className="scan-band absolute left-0 w-full pointer-events-none"
            style={{
                zIndex: 30,
            }}
            />

            <div
            key={`glow-${animKey}`}
            className="scan-glow absolute left-0 w-full pointer-events-none"
            style={{
                zIndex: 40,
            }}
            />
        </div>
        
      <style jsx>{`
        .scan-container {
          --scan-duration: ${duration}ms;
          --scan-line: ${lineHeight}rem;
          --content-height: ${contentHeight}px;
          --total-travel: calc(var(--content-height) + var(--scan-line));
        }

        .scan-mask {
          -webkit-mask-image: linear-gradient(
            to bottom, 
            transparent 0%, 
            transparent 30%, 
            black 40%, 
            black 60%, 
            transparent 70%, 
            transparent 100%
          );
          mask-image: linear-gradient(
            to bottom, 
            transparent 0%, 
            transparent 30%, 
            black 40%, 
            black 60%, 
            transparent 70%, 
            transparent 100%
          );
          -webkit-mask-repeat: no-repeat;
          mask-repeat: no-repeat;
          -webkit-mask-size: 100% var(--scan-line);
          mask-size: 100% var(--scan-line);
          -webkit-animation: maskMove var(--scan-duration) cubic-bezier(0.4, 0, 0.2, 1) infinite alternate;
          animation: maskMove var(--scan-duration) cubic-bezier(0.4, 0, 0.2, 1) infinite alternate;
          animation-play-state: 'running';
          -webkit-animation-play-state: 'running';
        }

        .scan-band {
          height: var(--scan-line);
          top: calc(-1 * var(--scan-line));
          background: linear-gradient(
            to bottom,
            rgba(255, 255, 255, 0),
            rgba(135, 206, 250, 0.2),
            rgba(135, 206, 250, 0.1),
            rgba(255, 255, 255, 0.0),
            rgba(135, 206, 250, 0.1),
            rgba(135, 206, 250, 0.2),
            rgba(255, 255, 255, 0)
          );
          border-radius: 2px;
          animation: bandMove var(--scan-duration) cubic-bezier(0.4, 0, 0.2, 1) infinite alternate;
          animation-play-state: 'running';
        }

        .scan-glow {
          height: calc(var(--scan-line) * 0.6);
          top: calc(-1 * var(--scan-line) + var(--scan-line) * 0.2);
          background: linear-gradient(
            180deg, 
            rgba(135, 206, 250, 0.2) 0%,
            rgba(255, 255, 255, 0.6) 50%,
            rgba(135, 206, 250, 0.2) 100%
          );
          mix-blend-mode: screen;
          filter: blur(1px);
          animation: bandMove var(--scan-duration) cubic-bezier(0.4, 0, 0.2, 1) infinite alternate;
          animation-play-state: 'running';
        }

        @keyframes maskMove {
          0% {
            -webkit-mask-position: 0 calc(-1 * var(--scan-line));
            mask-position: 0 calc(-1 * var(--scan-line));
          }
          100% {
            -webkit-mask-position: 0 var(--content-height);
            mask-position: 0 var(--content-height);
          }
        }

        @keyframes bandMove {
          0% { 
            transform: translateY(0); 
          }
          100% { 
            transform: translateY(var(--total-travel)); 
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .scan-mask,
          .scan-band,
          .scan-glow {
            animation: none !important;
            -webkit-animation: none !important;
          }
        }

        @media (max-width: 640px) {
          .scan-container {
            --scan-line: ${lineHeight * 0.8}rem;
          }
        }
      `}</style>
    </div>
  )
}