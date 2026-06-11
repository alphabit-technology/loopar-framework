import { useState, useEffect, useRef } from "react";
import loopar from "loopar";
import { PlusIcon, Maximize2Icon, Loader2 } from "lucide-react";
import { Droppable } from "@droppable";
import { Button } from "@cn/components/ui/button";
import { getSlideThumbnail } from "./utils.js";

export const GRID_LAYOUTS = ["uniform", "masonry", "quilted"];

const GRID_COLUMN_CLASSES = {
  "2": "grid-cols-1 sm:grid-cols-2",
  "3": "grid-cols-2 md:grid-cols-3",
  "4": "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
  "5": "grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
};

const MASONRY_COLUMN_CLASSES = {
  "2": "columns-1 sm:columns-2",
  "3": "columns-2 md:columns-3",
  "4": "columns-2 md:columns-3 lg:columns-4",
  "5": "columns-2 md:columns-3 lg:columns-5",
};

const QUILTED_COLUMN_CLASSES = {
  "2": "grid-cols-2",
  "3": "grid-cols-3",
  "4": "grid-cols-2 md:grid-cols-4",
  "5": "grid-cols-3 md:grid-cols-5",
};

const MASONRY_RATIOS = ["72%", "100%", "133%", "86%", "115%", "64%"];
const QUILTED_SPANS = [
  "md:col-span-2 md:row-span-2",
  "",
  "md:row-span-2",
  "",
  "md:col-span-2",
  "",
  "md:row-span-2",
  "",
];

function useAutoRatios(items, enabled) {
  const [autoRatios, setAutoRatios] = useState({});

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    let cancelled = false;
    items.forEach((item, i) => {
      const src = getSlideThumbnail(item);
      if (!src) return;
      const img = new window.Image();
      img.onload = () => {
        if (cancelled || !img.naturalWidth) return;
        const ratio = img.naturalHeight / img.naturalWidth;
        const orient = ratio > 1.15 ? "port" : ratio < 0.85 ? "land" : "square";
        setAutoRatios((prev) =>
          prev[i]?.src === src ? prev : { ...prev, [i]: { pt: `${(ratio * 100).toFixed(2)}%`, orient, src } }
        );
      };
      img.src = src;
    });
    return () => { cancelled = true; };
  }, [items, enabled]);

  return autoRatios;
}


function useInfiniteScroll({ hasMore, onLoadMore, isLoadingMore, itemCount }) {
  const sentinelRef = useRef(null);

  useEffect(() => {
    if (!hasMore || !onLoadMore) return;
    const el = sentinelRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) onLoadMore();
      },
      { rootMargin: "200px", threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, onLoadMore, isLoadingMore, itemCount]);

  return sentinelRef;
}

function GridCell({
  item,
  index: i,
  data,
  node,
  gridLayout,
  auto,
  lightboxAvailable,
  designerMode,
  openLightbox,
}) {
  if (!item) return null;

  const cellData = {
    ...item.data,
    isActive: true,
    static_content: data.static_content,
    background_color: item.data?.background_color || data.background_color,
    background_blend_mode: item.data?.background_blend_mode || data.background_blend_mode,
    node,
  };

  const inner = item.$$typeof === Symbol.for("react.transitional.element") ? (
    <div className="absolute inset-0 w-full h-full">{item}</div>
  ) : (
    <Droppable
      className="absolute inset-0 w-full h-full"
      data={cellData}
      index={i}
      elements={[
        {
          ...item,
          element: item.element || "banner",
          data: cellData,
          haveCarousel: true,
          elements: item.elements,
        },
      ]}
    />
  );

  let layoutClass = "";
  let cellStyle;
  if (gridLayout === "masonry") {
    layoutClass = "mb-3 break-inside-avoid";
    cellStyle = { paddingTop: (auto && auto.pt) || MASONRY_RATIOS[i % MASONRY_RATIOS.length] };
  } else if (gridLayout === "quilted") {
    layoutClass = auto
      ? (auto.orient === "land" ? "md:col-span-2" : auto.orient === "port" ? "md:row-span-2" : "")
      : QUILTED_SPANS[i % QUILTED_SPANS.length];
    cellStyle = undefined;
  } else {
    cellStyle = { paddingTop: (auto && auto.pt) || data.cell_aspect_ratio || "75%" };
  }

  const bodyClickable = lightboxAvailable && !designerMode;
  return (
    <div
      className={`group relative w-full overflow-hidden rounded-xl bg-card ${layoutClass} ${bodyClickable ? "cursor-zoom-in" : ""}`}
      style={cellStyle}
      {...(bodyClickable
        ? {
            role: "button",
            tabIndex: 0,
            "aria-label": `Open item ${i + 1}`,
            onClick: (e) => { e.preventDefault(); openLightbox(i); },
            onKeyDown: (e) => {
              if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openLightbox(i); }
            },
          }
        : {})}
    >
      {inner}
      {bodyClickable ? (
        <span className="absolute inset-0 z-10 bg-black/0 transition-colors group-hover:bg-black/15 group-focus-visible:bg-black/15" />
      ) : null}
      {lightboxAvailable ? (
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); openLightbox(i); }}
          className="absolute top-2 right-2 z-20 inline-flex items-center justify-center w-8 h-8 rounded-full bg-background/70 backdrop-blur text-foreground/80 hover:text-foreground hover:bg-background transition-all opacity-0 group-hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Open item ${i + 1} fullscreen`}
        >
          <Maximize2Icon className="w-4 h-4" />
        </button>
      ) : null}
    </div>
  );
}

export default function GridView({
  items = [],
  data = {},
  node,
  designerMode = false,
  lightboxAvailable = false,
  openLightbox,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
  addSlide,
}) {
  const gridLayout = GRID_LAYOUTS.includes(data.grid_layout) ? data.grid_layout : "uniform";
  const autoRatio = loopar.utils.trueValue(data.auto_ratio);
  const autoRatios = useAutoRatios(items, autoRatio);
  const sentinelRef = useInfiniteScroll({
    hasMore,
    onLoadMore,
    isLoadingMore,
    itemCount: items.length,
  });

  const cols = String(data.grid_columns || "3");
  let gridContainerClass;
  let gridContainerStyle;
  if (gridLayout === "masonry") {
    gridContainerClass = `${MASONRY_COLUMN_CLASSES[cols] || MASONRY_COLUMN_CLASSES["3"]} gap-3 w-full`;
  } else if (gridLayout === "quilted") {
    gridContainerClass = `grid ${QUILTED_COLUMN_CLASSES[cols] || QUILTED_COLUMN_CLASSES["3"]} grid-flow-dense gap-3 w-full`;
    gridContainerStyle = { gridAutoRows: data.quilt_row_height || "11rem" };
  } else {
    gridContainerClass = `grid ${GRID_COLUMN_CLASSES[cols] || GRID_COLUMN_CLASSES["3"]} gap-3 w-full`;
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className={gridContainerClass} style={gridContainerStyle}>
        {items.map((item, i) => (
          <GridCell
            key={item?.node || `cell-${i}`}
            item={item}
            index={i}
            data={data}
            node={node}
            gridLayout={gridLayout}
            auto={autoRatio ? autoRatios[i] : null}
            lightboxAvailable={lightboxAvailable}
            designerMode={designerMode}
            openLightbox={openLightbox}
          />
        ))}
      </div>
      {onLoadMore && hasMore ? (
        <div
          ref={sentinelRef}
          className="w-full py-4 flex items-center justify-center"
          style={{ minHeight: 40 }}
        >
          {isLoadingMore ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <span className="text-xs text-muted-foreground">Scroll for more…</span>
          )}
        </div>
      ) : null}
      {designerMode && addSlide ? (
        <Button
          variant="secondary"
          size="sm"
          className="self-start h-8 px-3 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); addSlide(); }}
        >
          <PlusIcon className="w-4 h-4 mr-1" />
          Add Item
        </Button>
      ) : null}
    </div>
  );
}
