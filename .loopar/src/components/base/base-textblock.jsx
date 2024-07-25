import Component from "$component";
import { useEffect } from "react";
import ComponentDefaults from "@component-defaults";

export default function BaseTextBlock(props) {
  const {set} = ComponentDefaults(props);
  const defaultLabel = "Text block";
  const defaultText = "I'm a awesome Text Block widget, you can customize in edit button in design mode.";

  useEffect(() => {
    const data = props;
    if (!data.text) {
      set({
        label: defaultLabel,
        text: defaultText,
      })
    }
  }
  , [props.data])

  return (
    <>{props.children}</>
  )
}

BaseTextBlock.dontHaveMetaElements = [];