import { useState, useMemo, useCallback } from "react";
import loopar from "loopar";
import { useDesigner } from "@context/@/designer-context";
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from "lucide-react";
import { Droppable } from "@droppable";
import { Button } from "@cn/components/ui/button";
import { DEFAULTS } from "@@tools/meta-fields";
import CarouselBase from "./carousel.jsx";

const CONTENT_EXIT_DURATION = 300;

const BaseCarousel = (props) => {
  const { data = {}, node, elements, children, content } = props;
  const { designerMode } = useDesigner();
  const [index, setIndex] = useState(() => {
    const fromData = data?._cookie_index;
    if (fromData != null && fromData !== "") {
      const n = parseInt(fromData, 10);
      if (!Number.isNaN(n)) return n;
    }
    const saved = loopar.cookie.get(node);
    const n = saved ? parseInt(saved, 10) : 0;
    return Number.isNaN(n) ? 0 : n;
  });

  const handleChange = useCallback((next) => {
    setIndex(next);
    loopar.cookie.set(node, next);
  }, [node]);

  const items = useMemo(() => children || elements || [], [children, elements]);
  const itemCount = items.length;
  const transitionDurationMs = parseInt(data.animation_duration, 10) || 500;

  const viewMode = data.view_mode === "gallery" ? "gallery" : "slides";

  if (!itemCount && !content) {
    return (
      <div
        className={`relative w-full overflow-hidden`}
        style={makeContainerStyle(data)}
      >
        <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
          <p className="text-muted-foreground">No slides available</p>
        </div>
      </div>
    );
  }

  const renderSlide = (item, ctx) => {
    if (!item) return null;
    if (item.$$typeof === Symbol.for("react.transitional.element")) {
      return ctx.isCurrent ? item : null;
    }

    if (designerMode) {
      if (!ctx.isCurrent) return null;
    } else {
      if (!ctx.isCurrent && !ctx.isPrev) return null;
    }

    const slideData = {
      ...item.data,
      ...(!ctx.isPrev && !designerMode ? {
        animation: data.animation,
        animation_duration: data.animation_duration,
        animation_delay: data.animation_delay,
      } : {}),
      isActive: ctx.isCurrent && !ctx.isExiting,
      static_content: data.static_content,
      background_color: item.data?.background_color || data.background_color,
      background_blend_mode: item.data?.background_blend_mode || data.background_blend_mode,
      node,
    };

    return (
      <Droppable
        key={`${item.node || ctx.index}-${ctx.isPrev ? "prev" : "current"}`}
        className={`absolute inset-0 w-full h-full ${ctx.isPrev ? "z-0" : "z-10"} ${designerMode ? "pt-3" : ""}`}
        data={slideData}
        index={ctx.index}
        elements={[
          {
            ...item,
            element: item.element || "banner",
            data: slideData,
            haveCarousel: true,
            elements: item.elements,
          },
        ]}
      />
    );
  };

  const renderArrowLeft = ({ onClick, hovered }) =>
    data.arrows === false || itemCount <= 1 ? null : (
      <ArrowButton variant={viewMode} direction="left" onClick={onClick} hovered={hovered} />
    );

  const renderArrowRight = ({ onClick, hovered }) =>
    data.arrows === false || itemCount <= 1 ? null : (
      <ArrowButton variant={viewMode} direction="right" onClick={onClick} hovered={hovered} />
    );

  const renderIndicators = ({ current, count, goTo }) => {
    if (data.indicators === false || count <= 1) return null;
    const isGallery = viewMode === "gallery";
    return (
      <div className="absolute bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
        {Array.from({ length: count }, (_, i) => {
          const active = i === current;
          const cls = isGallery
            ? `h-2 rounded-full transition-all ${
                active ? "bg-primary w-5" : "bg-background/70 hover:bg-background w-2"
              }`
            : `w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                active ? "bg-white scale-110" : "bg-white/50 hover:bg-white/75"
              }`;
          return (
            <button
              key={`indicator-${i}`}
              type="button"
              className={`${cls} focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
              onClick={(e) => { e.preventDefault(); goTo(i); }}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={active ? "true" : "false"}
            />
          );
        })}
      </div>
    );
  };

  const renderCounter = ({ index: i, count }) =>
    viewMode === "gallery" && count > 1 ? (
      <div className="absolute top-2 right-2 z-20 text-xs px-2 py-1 rounded-md bg-background/70 text-foreground backdrop-blur">
        {i + 1} / {count}
      </div>
    ) : null;

  const renderBefore = (slots) => (
    <>
      {renderCounter(slots)}
      {designerMode ? (
        <div className="absolute bottom-4 left-4 z-30 flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="h-8 px-3 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              props.addSlide?.();
              setTimeout(() => handleChange(Math.max(0, (elements || []).length)), 0);
            }}
          >
            <PlusIcon className="w-4 h-4 mr-1" />
            Add Slide
          </Button>

          <div className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-background/80 backdrop-blur-sm text-sm font-medium shadow-lg">
            <span className="text-foreground">{index + 1}</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-muted-foreground">{itemCount || 0}</span>
          </div>
        </div>
      ) : null}
    </>
  );

  const showThumbs = viewMode === "gallery" && itemCount > 1 && data.thumbs !== false;
  const thumbStrip = showThumbs ? (
    <div className="flex gap-2 overflow-x-auto pb-1 mt-3">
      {items.map((item, i) => {
        const thumb = getSlideThumbnail(item);
        const active = i === index;
        return (
          <button
            type="button"
            key={item.node || `thumb-${i}`}
            onClick={() => handleChange(i)}
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
  ) : null;

  const carouselNode = (
    <div
      className={`relative w-full overflow-hidden ${viewMode === "gallery" ? "rounded-xl bg-card" : ""} ${data.touch && !designerMode ? "cursor-grab active:cursor-grabbing" : ""}`}
      style={makeContainerStyle(data)}
    >
      {content ? (
        <div className="absolute inset-0 w-full h-full">{content}</div>
      ) : (
        <CarouselBase
          slides={items}
          renderSlide={renderSlide}
          renderArrowLeft={renderArrowLeft}
          renderArrowRight={renderArrowRight}
          renderIndicators={renderIndicators}
          renderBefore={renderBefore}
          current={index}
          onChange={handleChange}
          autoplay={!designerMode && !data.pause}
          intervalMs={(parseInt(data.interval, 10) || 5) * 1000}
          pauseOnHover={!!data.pause}
          loop={data.loop !== false}
          keyboard={!!data.keyboard && !designerMode}
          touch={!!data.touch && !designerMode}
          exitDurationMs={CONTENT_EXIT_DURATION}
          transitionDurationMs={transitionDurationMs}
          containerClassName="absolute inset-0 w-full h-full select-none group"
        />
      )}
    </div>
  );

  if (viewMode === "gallery") {
    return (
      <div className="flex flex-col gap-3 w-full">
        {carouselNode}
        {thumbStrip}
      </div>
    );
  }

  return carouselNode;
};

function makeContainerStyle(data) {
  const style = {};
  if (data.full_height) {
    style.height = "100vh";
  } else {
    style.paddingTop = data.aspect_ratio || "56.25%";
  }
  return style;
}

function ArrowButton({ direction, onClick, hovered, variant = "slides" }) {
  const isLeft = direction === "left";
  const Icon = isLeft ? ChevronLeftIcon : ChevronRightIcon;
  const isGallery = variant === "gallery";

  const sizeCls = isGallery
    ? "w-9 h-9 md:w-10 md:h-10"
    : "h-10 w-10 md:h-14 md:w-14 lg:h-16 lg:w-16 xl:h-20 xl:w-20";
  const iconCls = isGallery
    ? "w-5 h-5"
    : "w-5 h-5 md:w-7 md:h-7 lg:w-8 lg:h-8 xl:w-10 xl:h-10";
  const sideCls = isGallery
    ? (isLeft ? "left-2" : "right-2")
    : (isLeft ? "left-2 md:left-4 lg:left-6" : "right-2 md:right-4 lg:right-6");
  const hoverCls = isGallery
    ? (hovered ? "opacity-100" : "opacity-0")
    : (hovered ? "opacity-100 scale-100" : "opacity-0 md:opacity-60 scale-95");

  return (
    <button
      type="button"
      className={`
        absolute top-1/2 -translate-y-1/2 z-20
        ${sideCls}
        ${isGallery ? "inline-flex" : "hidden md:inline-flex"}
        items-center justify-center
        ${sizeCls}
        rounded-full
        bg-background/70 backdrop-blur
        hover:bg-background
        text-foreground/80 hover:text-foreground
        transition-all duration-200
        focus:outline-none focus-visible:ring-2 focus-visible:ring-ring
        disabled:pointer-events-none disabled:opacity-50
        ${hoverCls}
        ${isGallery ? "" : "hover:scale-110"}
      `}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick?.(); }}
      aria-label={isLeft ? "Previous slide" : "Next slide"}
    >
      <Icon className={iconCls} />
    </button>
  );
}

function getSlideThumbnail(slide) {
  if (!slide || typeof slide !== "object") return null;
  const d = slide.data || {};
  const candidates = [d.background_image, d.cover_image, d.image, d.src];
  for (const c of candidates) {
    if (!c) continue;
    if (typeof c === "string") return c;
    if (Array.isArray(c)) {
      const first = c.find(x => x && (x.src || x.url || x.name));
      if (first) return first.src || first.url || null;
    }
    if (typeof c === "object") return c.src || c.url || null;
  }

  if (Array.isArray(slide.elements)) {
    for (const child of slide.elements) {
      const nested = getSlideThumbnail(child);
      if (nested) return nested;
    }
  }
  return null;
}

export default BaseCarousel;

BaseCarousel.droppable = true;
BaseCarousel.metaFields = () => {
  return [
    {
      group: "appearance",
      elements: {
        view_mode: {
          element: SELECT,
          data: {
            label: "View mode",
            description:
              "slides: full-bleed, big overlay arrows, white dots (banner stacks). " +
              "gallery: compact arrows, primary dots, counter top-right, thumbnail strip below.",
            options: [
              { option: "Slides (banners, full bleed)", value: "slides" },
              { option: "Gallery (thumbs strip below)", value: "gallery" },
            ],
            selected: "slides",
          },
        },
        thumbs: {
          element: SWITCH,
          data: {
            label: "Show thumbnails (gallery mode)",
            description: "Only applies when View mode is Gallery.",
            selected: true,
          },
        },
      },
    },
    {
      group: "animation",
      elements: {
        animation: {
          element: SELECT,
          data: {
            label: "Transition Effect",
            options: Object.keys(loopar.animation.animations()),
            selected: "",
          },
        },
        animation_duration: {
          element: INPUT,
          data: {
            label: "Duration (ms)",
            format: "number",
            default_value: DEFAULTS.animation_duration,
          },
        },
        animation_delay: {
          element: INPUT,
          data: {
            label: "Delay (ms)",
            format: "number",
            default_value: DEFAULTS.animation_delay,
          },
        },
        interval: {
          element: SELECT,
          data: {
            label: "Auto-play Interval",
            options: [
              { label: "3 Seconds", value: "3" },
              { label: "5 Seconds", value: "5" },
              { label: "7 Seconds", value: "7" },
              { label: "10 Seconds", value: "10" },
              { label: "15 Seconds", value: "15" },
              { label: "20 Seconds", value: "20" },
              { label: "30 Seconds", value: "30" },
              { label: "50 Seconds", value: "50" },
              { label: "100 Seconds", value: "100" },
            ],
            selected: "5",
          },
        },
        static_content: {
          element: SWITCH,
          data: {
            description:
              "If enabled the content will remain static even when there are animations in the slide.",
          },
        },
        full_height: {
          element: SWITCH,
          data: {
            label: "Full Screen Height",
            description: "Slider will occupy the full viewport height",
          },
        },
        aspect_ratio: {
          element: SELECT,
          data: {
            label: "Aspect Ratio",
            description: "Only applies when Full Screen Height is disabled",
            options: [
              { option: "16:9 (Widescreen)", value: "56.25%" },
              { option: "4:3 (Standard)", value: "75%" },
              { option: "21:9 (Ultrawide)", value: "42.85%" },
              { option: "1:1 (Square)", value: "100%" },
              { option: "60% (Default)", value: "60%" },
            ],
            selected: "56.25%",
          },
        },
        loop: {
          element: SWITCH,
          data: {
            label: "Loop Slides",
            description: "Continue to first slide after last",
          },
        },
        pause: {
          element: SWITCH,
          data: {
            label: "Pause on Hover",
            description: "Stop auto-play when mouse is over the slider",
          },
        },
        keyboard: {
          element: SWITCH,
          data: {
            label: "Keyboard Navigation",
            description: "Use arrow keys to navigate slides",
          },
        },
        touch: {
          element: SWITCH,
          data: {
            label: "Touch/Swipe",
            description: "Enable swipe gestures on touch devices",
          },
        },
        indicators: {
          element: SWITCH,
          data: {
            label: "Show Indicators",
            description: "Display navigation dots at bottom",
            selected: true,
          },
        },
        arrows: {
          element: SWITCH,
          data: {
            label: "Show Arrows",
            description: "Display navigation arrows on sides",
            selected: true,
          },
        },
      },
    },
  ];
};
