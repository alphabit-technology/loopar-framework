import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

/**
 * Navigation arrow shared by slides/gallery/lightbox. `variant` tweaks
 * sizing and hover behavior: gallery uses compact, always-positioned
 * arrows; slides uses big overlay arrows hidden on mobile.
 */
export default function ArrowButton({ direction, onClick, hovered, variant = "slides" }) {
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
