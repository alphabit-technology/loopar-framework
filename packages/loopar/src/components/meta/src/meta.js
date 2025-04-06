import elementManage from "@@tools/element-manage";
import fileManager from "@@file/file-manager";
import {loopar} from "loopar";

export function designElementProps(el) {
  if (!el.data) {
    const names = elementManage.elementName(el.element);
    el.data = {
      label: names.label,
      key: names.id
    }
  }

  const newProps = {
    ...{
      ...el,
      key: 'design-element' + el.data.key
    }
  }

  return newProps;
};

export function prepareMeta(metaProps, parent, image) {
  const data = metaProps.data || {};

  if (image && (!data || !data.background_image || data.background_image === '[]')) {
    metaProps.src = "/uploads/empty-image.svg"
  }

  const getSrc = () => {
    if (data) {
      return fileManager.getMappedFiles(data.background_image, data.name);
    }
    return [];
  }

  if (data) {
    const backgroundColor = {};
    if (data?.background_color) {
      const color = loopar.utils.objToRGBA(data.background_color);

      if (color) {
        Object.assign(backgroundColor, {
          backgroundColor: color,
          backgroundBlendMode: data.background_blend_mode || 'normal',
        });
      }
    }

    if (data.background_image && data.background_image !== '[]') {
      const src = getSrc();

      if (src && src.length > 0) {
        const imageUrl = src[0].src || "/uploads/empty-image.svg";

        const backgroundImage = {
          backgroundImage: `url("${imageUrl}")`,
          backgroundSize: data.background_size || "cover",
          backgroundPosition: data.background_position || "center",
          backgroundRepeat: data.background_repeat || "no-repeat",

          ...backgroundColor
        }

        metaProps.imageProps = {
          src: imageUrl
        }

        if (metaProps.element === "image") {
          Object.assign(metaProps.imageProps, {
            alt: data.label || "",
            title: data.description || "",
          });

          metaProps.coverProps = {
            style: {
              ...backgroundImage
            }
          }

          if (data.aspect_ratio) {
            metaProps.style = {
              ...metaProps.style || {}
            }
          }
        } else {
          metaProps.style = {
            ...metaProps.style || {},
            ...backgroundImage
          };
        }
      }
    }

    if (metaProps.element != "image") {
      metaProps.style = {
        ...metaProps.style || {},
        ...backgroundColor
      };
    }
  }
}

export const buildMetaProps = ({ metaProps, parent = {}, isDesigner }) => {
  prepareMeta(metaProps, parent, false);

  if (isDesigner) return designElementProps(metaProps, parent);
  metaProps.data ??= {};
  const data = metaProps.data;

  return {
    element: metaProps.element,
    ...{
      key: metaProps.key || "element" + data.key,
    },
    ...metaProps,
  };
};


export function evaluateCondition(condition, values) {
  let sanitizedCondition = condition.replace(/and/g, '&&').replace(/or/g, '||').replace(/=/g, '==');

  const keys = Object.keys(values);
  keys.forEach(key => {
    const value = values[key];
    const regex = new RegExp(`\\b${key}\\b`, 'g');
    sanitizedCondition = sanitizedCondition.replace(regex, `'${value}'`);
  });

  try {
    return new Function(`return ${sanitizedCondition};`)();
  } catch (error) {
    console.error("Error evaluating condition:", error);
    return false;
  }
}

export function extractFieldNames(condition) {
  const sanitizedCondition = condition.replace(/and/g, '&&').replace(/or/g, '||');
  const regex = /\b([a-zA-Z_]\w*)\b(?=\s*[=!><])/g;
  const matches = new Set();
  let match;

  while ((match = regex.exec(sanitizedCondition)) !== null) {
    matches.add(match[1]);
  }

  return Array.from(matches);
}

export const Animations = {
  "fade-up": {
    initial: "opacity-0 translate-y-10",
    visible: "opacity-100 translate-y-0",
  },
  "fade-down": {
    initial: "opacity-0 -translate-y-10",
    visible: "opacity-100 translate-y-0",
  },
  "fade-left": {
    initial: "opacity-0 translate-x-10",
    visible: "opacity-100 translate-x-0",
  },
  "fade-right": {
    initial: "opacity-0 -translate-x-10",
    visible: "opacity-100 translate-x-0",
  },
  "slide-up": {
    initial: "translate-y-10",
    visible: "translate-y-0",
  },
  "slide-down": {
    initial: "-translate-y-10",
    visible: "translate-y-0",
  },
  "slide-left": {
    initial: "translate-x-10",
    visible: "translate-x-0",
  },
  "slide-right": {
    initial: "-translate-x-10",
    visible: "translate-x-0",
  },
  "zoom-in": {
    initial: "scale-90 opacity-0",
    visible: "scale-100 opacity-100",
  },
  "zoom-out": {
    initial: "scale-110 opacity-0",
    visible: "scale-100 opacity-100",
  },
  "flip-up": {
    initial: "opacity-0 rotateX-90",
    visible: "opacity-100 rotateX-0",
  },
  "flip-down": {
    initial: "opacity-0 rotateX--90",
    visible: "opacity-100 rotateX-0",
  },
};