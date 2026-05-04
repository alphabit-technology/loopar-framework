import elementManage from "@@tools/element-manage";

import fileManager from "@global/file-manager.js";
import {loopar} from "loopar";
import {useMemo} from "react";

import { useDesigner } from "@context/@/designer-context";

export function designElementProps(el) {
  if (!el.data) {
    const names = elementManage.elementName(el.element);
    el.node ??= names.key;
    el.data = {
      label: names.label,
    }
  }

  return el;
};

const hasOwnKeys = (o) => o && typeof o === "object" && Object.keys(o).length > 0;
const mergeStyle = (target, addition) => {
  if (!hasOwnKeys(addition)) return target;
  const base = hasOwnKeys(target) ? target : {};
  return { ...base, ...addition };
};

export function prepareMeta(metaProps) {
  metaProps.data ??= {};
  const data = metaProps.data;
  metaProps.elements = metaProps.elements || [];

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

    if (data.background_image && data.background_image.length > 0) {
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
            style: { ...backgroundImage }
          }

          if (data.aspect_ratio) {
            const merged = mergeStyle(metaProps.style, {});
            if (hasOwnKeys(merged)) metaProps.style = merged;
          }
        } else {
          const merged = mergeStyle(metaProps.style, backgroundImage);
          if (hasOwnKeys(merged)) metaProps.style = merged;
        }
      }
    }
    if (metaProps.element != "image") {
      const merged = mergeStyle(metaProps.style, backgroundColor);
      if (hasOwnKeys(merged)) metaProps.style = merged;
    }
  }

  return metaProps
}

export const useBuildMetaProps = (props) => {
  const { designerMode } = useDesigner();

  return useMemo(() => {
    const mp = prepareMeta(props.meta);
    if (designerMode) {
      return designElementProps(mp);
    }
 
    return mp;
  }, [designerMode, props.meta]);
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