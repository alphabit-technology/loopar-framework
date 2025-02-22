import BaseInput from "@base-input";
import { Input as FormInput } from "@cn/components/ui/input";
import loopar from "loopar";
import {
  FormControl,
  FormDescription,
  FormLabel
} from "@cn/components/ui/form";

const inputTypeMap = {
  data: "text",
  text: "text",
  email: "email",
  decimal: "number",
  percent: "number",
  currency: "text",
  int: "number",
  long_int: "number",
  password: "password",
  read_only: "text",
};


export default function Input(props) {
  const { renderInput, data } = BaseInput(props);
  const type = props.type || inputTypeMap[data?.format || "data"];
  const _type = type == "number" ? {
    type: type,
    min: typeof data.min != "undefined" ? data.min : -Infinity,
    max: typeof data.max != "undefined" ? data.max : Infinity,
  } : { type };
  const parsedData = JSON.parse(JSON.stringify(data));

  const attributtes = ["readonly", "hidden", "mandatory", "disabled"];
  const _props = Object.entries(parsedData).reduce((acc, [key, value]) => {
    if (attributtes.includes(key)) {
      loopar.utils.trueValue(value) && loopar.utils.binaryValue(value) == 1 && (acc[key] = true);
    }

    return acc;
  }, {});

  delete _props.key;

  return renderInput((field) => {
    return (
      <>
        {!props.dontHaveLabel && <FormLabel>{data.label}</FormLabel>}
        <FormControl>
          <FormInput {..._props}
            placeholder={data.placeholder || data.label}
            {...field}
            //onChange={field.onChange}
            {..._type}
          />
        </FormControl>
        {data.description && <FormDescription>
          {data.description}
        </FormDescription>}
      </>
    )
  });
}

Input.metaFields = () => {
  return [
    ...BaseInput.metaFields(),
    [
      {
        group: "form",
        elements: {
          format: {
            element: SELECT,
            data: {
              options: [
                { option: "data", value: "Data" },
                { option: "text", value: "Text" },
                { option: "email", value: "Email" },
                { option: "decimal", value: "Decimal" },
                { option: "percent", value: "Percent" },
                { option: "currency", value: "Currency" },
                { option: "int", value: "Int" },
                { option: "long_int", value: "Long Int" },
                { option: "password", value: "Password" },
                { option: "read_only", value: "Read Only" },
              ],
              selected: "data",
            },
          },
          min: {
            element: "input",
            data: {format: "int"}
          },
          max: {
            element: "input",
            data: {format: "int"}
          },
          not_validate_type: { element: SWITCH },
        }
      }
    ]
  ]
}