import loopar from "loopar";
import { DEFAULTS } from "@@tools/meta-fields";

/**
 * Designer meta-fields for BaseCarousel (shared by carousel, slider and
 * gallery elements). Element-type tokens (SELECT, SWITCH, INPUT) are
 * loopar globals.
 */
export default function carouselMetaFields() {
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
              "gallery: compact arrows, primary dots, counter top-right, thumbnail strip below. " +
              "grid: all items at once as cards (great with Lightbox).",
            options: [
              { option: "Slides (banners, full bleed)", value: "slides" },
              { option: "Gallery (thumbs strip below)", value: "gallery" },
              { option: "Grid (cards, all at once)", value: "grid" },
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
        lightbox: {
          element: SWITCH,
          data: {
            label: "Lightbox",
            description:
              "Click a slide (expand button) or a grid card to open a fullscreen, swipeable viewer. Works in any view mode.",
            selected: false,
          },
        },
        grid_layout: {
          element: SELECT,
          data: {
            label: "Grid layout",
            description:
              "uniform: equal cards. masonry: organic columns with varied heights (Pinterest-like). " +
              "quilted: mosaic where some tiles span 2x. Only applies when View mode is Grid.",
            options: [
              { option: "Uniform (equal cards)", value: "uniform" },
              { option: "Masonry (varied heights)", value: "masonry" },
              { option: "Quilted (mosaic / bento)", value: "quilted" },
            ],
            selected: "uniform",
          },
        },
        grid_columns: {
          element: SELECT,
          data: {
            label: "Grid columns",
            description: "Number of columns on large screens (grid mode). Responsive on smaller screens.",
            options: [
              { option: "2 columns", value: "2" },
              { option: "3 columns", value: "3" },
              { option: "4 columns", value: "4" },
              { option: "5 columns", value: "5" },
            ],
            selected: "3",
          },
        },
        quilt_row_height: {
          element: SELECT,
          data: {
            label: "Quilted row height",
            description: "Base row height for the quilted mosaic. Spanning tiles are multiples of this.",
            options: [
              { option: "Compact (9rem)", value: "9rem" },
              { option: "Medium (11rem)", value: "11rem" },
              { option: "Tall (14rem)", value: "14rem" },
            ],
            selected: "11rem",
          },
        },
        auto_ratio: {
          element: SWITCH,
          data: {
            label: "Auto ratio (from image)",
            description:
              "Grid mode: size each card from the real image's natural aspect ratio (measured on load). " +
              "Masonry/uniform use the measured height; quilted spans landscape images 2 cols and portraits 2 rows. " +
              "Overrides the fixed card ratio below.",
            selected: false,
          },
        },
        cell_aspect_ratio: {
          element: SELECT,
          data: {
            label: "Grid card ratio",
            description: "Aspect ratio of each card in grid mode. Ignored when Auto ratio is on.",
            options: [
              { option: "4:3 (Standard)", value: "75%" },
              { option: "1:1 (Square)", value: "100%" },
              { option: "16:9 (Widescreen)", value: "56.25%" },
              { option: "3:4 (Portrait)", value: "133%" },
            ],
            selected: "75%",
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
}
