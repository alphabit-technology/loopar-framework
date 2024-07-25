
import fileManager from "$tools/file-manager";
import {useDesigner} from "@custom-hooks";

export default function ComponentDefaults(props) {
  const data = props.data || {};
  const {updateElement, designerRef} = useDesigner();

  const getSrc = () => {
    if (data) {
      return fileManager.getMappedFiles(data.background_image || props.src, data.name);
    }
    return [];
  }

  const getTextSize = (size = data.size) =>{
    return {
      xm: "text-xs",
      sm: "text-sm",
      md: "text-md",
      lg: "text-lg",
      xl: "text-xl",
      "2xl": "text-2xl",
      "3xl": "text-3xl",
      "4xl": "text-4xl",
      "5xl": "text-5xl",
    }[size] || 5;
  }

  const getSize = (size = data.size) => {
    return {
      xs: "w-1/12",
      sm: "w-2/12",
      md: "w-3/12",
      lg: "w-4/12",
      xl: "w-5/12",
      "2xl": "w-6/12",
      "3xl": "w-7/12",
      "4xl": "w-8/12",
      "5xl": "w-9/12",
      "6xl": "w-10/12",
      "7xl": "w-11/12",
      full: "w-full",
    }[size] || "w-1/12";
  }

  const getTextAlign = (align = data.align) => {
    return {
      left: "text-left",
      center: "text-center",
      right: "text-right"
    }[align] || "text-left";
  }

  const set = (key, value) => {
    if (typeof key == "object") {
      Object.assign(data, key);
    } else {
      data[key] = value;
    }

    designerRef.updateElement(data.key, data);
  }

  const elementsDict = () => {
    return props.elements || [];
  }

  const setElements = (elements, callback, merge = true)=>{
    const newElements = (merge ? [...elementsDict(), ...elements] : elements);

    function removeDuplicates(array) {
      const seen = new Set();
      return array.filter(obj => {
        const value = obj.data.key;
        if (!seen.has(value)) {
          seen.add(value);
          return true;
        }
        return false;
      });
    }

    designerRef.updateElements(props, removeDuplicates(newElements), null, callback);
  }

  return {
    getSrc,
    getTextSize,
    getTextAlign,
    set,
    setElements,
    getSize,
    data
  }
}