import { jsx } from "react/jsx-runtime";
import { u as useFormContext } from "./form-context-8n26Uc_0.js";
import { u as useDesigner } from "./base-component-BnGRdg1n.js";
import React__default from "react";
import { e as FormField$1 } from "./form-z4zN6fsS.js";
const FormField = ({ render, onChange, data = {}, ...props }) => {
  const isDesigner = useDesigner().designerMode;
  const control = useFormContext().control;
  const dontHaveForm = props.dontHaveForm;
  const [value, setValue] = React__default.useState(data.value || null);
  const handleChange = (e) => {
    setValue(e && e.target ? e.target.files || e.target.value : e);
    onChange && onChange(e);
  };
  const field = {
    name: props.name,
    value,
    required: 0,
    onChange: handleChange
  };
  return isDesigner || dontHaveForm ? render({
    field
  }) : /* @__PURE__ */ jsx(
    FormField$1,
    {
      ...props,
      control,
      render
    }
  );
};
export {
  FormField as F
};
