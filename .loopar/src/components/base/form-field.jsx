import { useFormContext } from "@context/form-context";
import { useDesigner } from "@custom-hooks";
import React from "react";

import {
  FormField as BaseFormField,
} from "@/components/ui/form"

/*const fieldInterface = {
  onChange: () => {},
  onBlur: () => {},
  onFocus: () => {},
  value: null,
  name: null,
}*/

export const FormField = ({render, onChange, data={}, ...props}) => {
  const {designerMode} = useDesigner();
  const control = useFormContext().control;

  /**If fields is not controller by Form */
  const dontHaveForm = props.dontHaveForm;
  const [value, setValue] = React.useState(data.value || null);

  const handleChange = (e) => {
    setValue(e && e.target ? (e.target.files || e.target.value) : e);
    onChange && onChange(e);
  }

  /**
   * If field is not controller by Form
   */
  const field = {
    name: props.name, value, required: 0,
    onChange: handleChange,
  }

  return (
    designerMode || dontHaveForm ? (
      render({
        field: field
      })
    ) : (
      <BaseFormField
        {...props}
        control={control}
        render={render}
      />
    )
  )
}
