
import { ComponentDefaults } from "./ComponentDefaults";
import { useEffect } from "react";

export default function BaseText(props) {
  const {set, data} = ComponentDefaults(props);

  useEffect(() => {
    if (!props.data.text || props.data.text === "") {
      set("text", props.defaultText || defaultText);
    }
  }, [data.text, set]);

  const defaultText = props.defaultText || "Text here";

  const getText = () => {
    return data.text || defaultText;
  }

  return {getText, defaultText: props.defaultText || defaultText}
}

BaseText.dontHaveMetaElements = ["label"];
