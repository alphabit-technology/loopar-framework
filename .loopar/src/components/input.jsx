import BaseInput from "$base-input";
import { Input as FormInput } from "@/components/ui/input";
import loopar from "$loopar";
import {
  FormControl,
  FormDescription,
  FormLabel
} from "@/components/ui/form";

export default function Input(props){
  const {renderInput, data} = BaseInput(props);
  const type = props.type || data?.type || "input";
  const parsedData = JSON.parse(JSON.stringify(data));

  const attributtes = ["readonly", "hidden", "mandatory", "disabled"];
  const _props = Object.entries(parsedData).reduce((acc, [key, value]) => {
    if(attributtes.includes(key)) {
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
          type={type} {...field}
          onChange={field.onChange}
        />
      </FormControl>
      {data.description && <FormDescription>
        {data.description}
      </FormDescription>}
    </>
  )});
}

Input.metaFields = () => {return BaseInput.metaFields()}