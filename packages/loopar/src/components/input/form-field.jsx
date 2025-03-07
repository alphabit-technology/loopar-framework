import { useFormContext } from "@context/form-provider";
import { useDesigner } from "@context/@/designer-context";
import React from "react";

import {
  FormField as BaseFormField,
} from "@cn/components/ui/form"

export const FormField = ({ render, onChange, ...props }) => {
  const { designerMode } = useDesigner();
  const control = useFormContext().control;

  /**If fields is not controller by Form */
  const dontHaveForm = props.dontHaveForm;
  const [value, setValue] = React.useState(props.value || null);

  const handleChange = (e) => {
    setValue(e && e.target ? (e.target.files || e.target.value) : e);
    onChange && onChange(e);
  }

  /**
   * If field is not controller by Form
   */
  const field = {
    name: props.name,
    value,
    required: 0,
    onChange: handleChange,
  }

  return (
    designerMode || dontHaveForm ? (
      render({
        field: field
      })
    ) : (
      <BaseFormField
        //{...props}
        name={props.name}
        value={props.value}
        control={control}
        render={render}
      />
    )
  )
}
