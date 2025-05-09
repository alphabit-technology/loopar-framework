import React from "react";
import BaseInput from "@base-input";
import { Designer } from "./designer/base-designer";
import { useDesigner } from "@context/@/designer-context";

export default function MetaDesigner(props) {
  const { renderInput, data } = BaseInput(props);
  const {designerMode} = useDesigner();

  return renderInput((field) => {
    return (
      <Designer
        key={designerMode ? data.key : data.key + "_designer"}
        metaComponents={field.value}
        data={{
          ...data,
          key: designerMode ? data.key : data.key + "_designer",
        }}
        onChange={field.onChange}
      />
    )
  });
}
