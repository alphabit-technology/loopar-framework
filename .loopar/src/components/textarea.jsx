import BaseInput from "$base-input";
import {
  FormControl,
  FormDescription,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea"

export default class TextArea extends BaseInput {
  render() {
    const data = this.data;
    const type = this.props.type || data.type || "input";

    return this.renderInput((field) => (
      <>
        <FormLabel>{data.label}</FormLabel>
        <FormControl className="p-2">
          <Textarea
            {...data} placeholder={data.placeholder || data.label} type={type} {...field}
            className="bg-transparent border border-input rounded-sm"
            rows={6}
          />
        </FormControl>
        <FormDescription>
          {data.description}
        </FormDescription>
        <FormMessage />
      </>
    ));
  }
}