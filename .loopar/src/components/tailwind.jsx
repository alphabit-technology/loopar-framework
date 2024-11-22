import BaseInput from "@base-input";
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea"
import loopar from "loopar";

let timerId;

export default function Tailwind(props){
  const { renderInput, data } = BaseInput(props);

  const type = props.type || data.type || "input";

  const handleKeyUp = (e) => {
    clearTimeout(timerId);

    timerId = setTimeout(() => {
      loopar.method("Entity", "setTailwind", {to_element: data.to_element, classes: e.target.value })
    }, 500);
  }

  return renderInput((field) => (
    <>
      <FormLabel>{data.label}</FormLabel>
      <FormControl className="p-2">
        <Textarea
          {...data} placeholder={data.placeholder || data.label} type={type} {...field}
          className="bg-transparent border border-input rounded-sm"
          onKeyUp={handleKeyUp}
          rows={6}
        />
      </FormControl>
      <FormDescription>
        Here you can set Tailwind classes to style the document, for example: bg-red-500 text-white
        if you want to set another class, you need to add your custom class in your uwn css file.
      </FormDescription>
      <FormMessage />
    </>
  ));
}