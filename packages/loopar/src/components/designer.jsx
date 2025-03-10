import React from "react";
import BaseInput from "@base-input";
import { Designer } from "./designer/base-designer";

export default function MetaDesigner(props) {
  const { renderInput, data } = BaseInput(props);

  return renderInput((field) => {
    return (
      <Designer
        metaComponents={field.value}
        data={data}
        onChange={field.onChange}
      />
    )
  });
}
