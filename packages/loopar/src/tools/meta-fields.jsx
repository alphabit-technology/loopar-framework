import loopar from "loopar";

const normalizeOptions = (options) => {
  if (!options) return [];
  
  if (!Array.isArray(options) && typeof options === 'object') {
    return Object.entries(options).map(([key, label]) => ({
      value: key,
      label: typeof value == "string" ? value : key
    }));
  }
  
  return options.map(opt => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt.charAt(0).toUpperCase() + opt.slice(1) };
    }
    if (opt.value !== undefined) return opt;
    if (opt.value !== undefined) {
      return { value: opt.value, label: opt.label || opt.value };
    }
    return opt;
  });
};

const createOptions = (...values) => {
  return values.map(v => {
    if (typeof v === 'string') {
      return { value: v, label: v.charAt(0).toUpperCase() + v.slice(1).replace(/-/g, ' ') };
    }
    if (Array.isArray(v)) {
      return { value: v[0], label: v[1] };
    }
    return v;
  });
};

const OPTIONS = {
  alignment: createOptions("left", "center", "right"),
  vertical_alignment: createOptions("top", "center", "bottom"),
  size: createOptions(
    ["xs", "Extra Small"],
    ["sm", "Small"],
    ["md", "Medium"],
    ["lg", "Large"],
    ["xl", "Extra Large"]
  ),
  background_size: createOptions("cover", "contain", "auto"),
  blend_mode: createOptions(
    "normal", "multiply", "screen", "overlay",
    "darken", "lighten", "color-dodge", "color-burn",
    "hard-light", "soft-light", "difference", "exclusion",
    "hue", "saturation", "color", "luminosity"
  ),
};

const DEFAULTS = {
  background_size: "cover",
  background_blend_mode: "overlay",
  animation_duration: 1000,
  animation_delay: 0,
};

export const getMetaFields = (data) => {
  return [
    {
      group: "content",
      elements: {
        label: {
          element: INPUT,
          data: { label: "Label" },
        },
        name: {
          element: INPUT,
          data: { label: "Name" },
        },
        text: {
          element: TEXTAREA,
          data: { label: "Text" },
        },
      },
    },
    {
      group: "style",
      elements: {
        class: {
          element: TAILWIND,
          data: {
            label: "Tailwind",
            rows: 6,
            to_element: data.key,
          },
        },
        background_image: {
          element: IMAGE_INPUT,
          data: { label: "Background", height: 150 },
        },
        background_color: {
          element: COLOR_PICKER,
          data: { label: "Color" },
        },
        background_blend_mode: {
          element: SELECT,
          data: {
            label: "Blend Mode",
            options: OPTIONS.blend_mode,
            selected: DEFAULTS.background_blend_mode,
          },
        },
        background_size: {
          element: SELECT,
          data: {
            label: "Background Size",
            options: OPTIONS.background_size,
            selected: DEFAULTS.background_size,
          },
        },
        style: {
          element: TEXTAREA,
          data: {
            label: "Custom CSS",
            rows: 3,
          },
        },
        hidden: {
          element: SWITCH,
          data: { label: "Hidden" },
        },
        disabled: {
          element: SWITCH,
          data: { label: "Disabled" },
        },
      },
    },
    {
      group: "animation",
      elements: {
        animation: {
          element: SELECT,
          data: {
            label: "Effect",
            options: [
              { value: "", label: "None" },
              ...normalizeOptions(loopar.animations()),
            ],
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
      },
    },
    {
      group: "advanced",
      elements: {
        id: {
          element: INPUT,
          data: {
            label: "ID",
            description: "Unique identifier",
          },
        },
        collapsible: {
          element: SWITCH,
          data: { label: "Collapsible" },
        },
        display_on: {
          element: TEXTAREA,
          data: {
            label: "Display Condition",
            rows: 2,
          },
        },
      },
    },
  ];
};

export { OPTIONS, DEFAULTS, createOptions, normalizeOptions };