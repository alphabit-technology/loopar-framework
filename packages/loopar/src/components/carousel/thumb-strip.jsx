import { getSlideThumbnail } from "./utils.js";

export default function ThumbStrip({ items = [], current = 0, onSelect }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 mt-3">
      {items.map((item, i) => {
        const thumb = getSlideThumbnail(item);
        const active = i === current;
        return (
          <button
            type="button"
            key={item.node || `thumb-${i}`}
            onClick={() => onSelect?.(i)}
            className={`relative shrink-0 w-20 h-14 rounded-md overflow-hidden border-2 transition-all bg-secondary ${
              active ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
            }`}
            aria-label={`Show slide ${i + 1}`}
          >
            {thumb ? (
              <img
                src={thumb}
                alt={`Thumbnail ${i + 1}`}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                {i + 1}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
