import BaseInput from "$base-input";
import { Input as FormInput } from "@/components/ui/input";
import loopar from "$loopar";
import {
  FormControl,
  FormDescription,
  FormLabel,
  FormMessage
} from "@/components/ui/form";

export default class Input extends BaseInput {
  render() {
    const data = this.data || {};
    const type = this.props.type || data?.type || "input";

    const parsedData = JSON.parse(JSON.stringify(data));

    const attributtes = ["readonly", "hidden", "mandatory", "disabled"];
    const props = Object.entries(parsedData).reduce((acc, [key, value]) => {
      if(attributtes.includes(key)) {
        loopar.utils.trueValue(value) && loopar.utils.binaryValue(value) == 1 && (acc[key] = true);
      }

      return acc;
    }, {});

    return this.renderInput((field) => {
      return (
      <>
        {!this.props.dontHaveLabel && <FormLabel>{data.label}</FormLabel>}
        <FormControl>
          <FormInput {...props} 
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
}