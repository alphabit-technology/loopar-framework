
import loopar from "$loopar";

export const getMetaFields = (data) => {
  return [
    {
      group: 'form',
      elements: {
        label: { element: INPUT },
        name: { element: INPUT },
      }
    },
    {
      group: 'general',
      elements: {
        id: {
          element: INPUT,
          data: {
            description: "Is a unique identifier for element"
          }
        },
        text: {
          element: TEXTAREA,
          data: {
            description: "Is a value for inner text of element"
          }
        },
        background_image: {
          element: IMAGE_INPUT,
          height: 200
        },
        background_color: { element: COLOR_PICKER },
        background_blend_mode: {
          element: SELECT, data: {
            options: [
              { option: 'normal', value: 'Normal' },
              { option: 'multiply', value: 'Multiply' },
              { option: 'screen', value: 'Screen' },
              { option: 'overlay', value: 'Overlay' },
              { option: 'darken', value: 'Darken' },
              { option: 'lighten', value: 'Lighten' },
              { option: 'color-dodge', value: 'Color Dodge' },
              { option: 'color-burn', value: 'Color Burn' },
              { option: 'hard-light', value: 'Hard Light' },
              { option: 'soft-light', value: 'Soft Light' },
              { option: 'difference', value: 'Difference' },
              { option: 'exclusion', value: 'Exclusion' },
              { option: 'hue', value: 'Hue' },
              { option: 'saturation', value: 'Saturation' },
              { option: 'color', value: 'Color' },
              { option: 'luminosity', value: 'Luminosity' },
            ],
            selected: 'overlay'
          }
        },
        background_size: {
          element: SELECT,
          data: {
            options: [
              { option: 'cover', value: 'Cover' },
              { option: 'contain', value: 'Contain' },
              { option: 'auto', value: 'Auto' },
            ],
            selected: 'cover'
          }
        },
        text_align: {
          element: SELECT,
          data: {
            options: [
              { option: 'left', value: 'Left' },
              { option: 'center', value: 'Center' },
              { option: 'right', value: 'Right' },
            ],
            selected: 'left'
          }
        },
        size: {
          element: SELECT,
          data: {
            options: [
              { option: 'xs', value: 'Extra Small' },
              { option: 'sm', value: 'Small' },
              { option: 'md', value: 'Medium' },
              { option: 'lg', value: 'Large' },
              { option: 'xl', value: 'Extra Large' },
            ],
            selected: 'md'
          }
        },
        class: {
          element: TAILWIND,
          data: {
            rows: 10,
            to_element: data.key,
            label: "Tailwind"
          }
        },
        style: {
          element: TEXTAREA,
          data: {
            description: "You can use raw css code here",
          }
        },
        display_on: {
          element: TEXTAREA,
          data: {
            description: "Define where the element will be displayed",
          }
        },
        hidden: { element: SWITCH },
        disabled: { element: SWITCH },
        collapsed: { element: SWITCH }
      }
    },
    {
      group: 'animation',
      elements: {
        info: <label
          style={{ paddingTop: 10 }}
          className="text-danger"
        >Animations allowed in Website Only</label>,
        animation: {
          element: "select",
          data: {
            options: loopar.animations(),
          }
        },
        animation_duration: { element: INPUT, data: { format: 'number' } },
        animation_delay: { element: INPUT, data: { format: 'number' } }
      }
    }
  ]
};
