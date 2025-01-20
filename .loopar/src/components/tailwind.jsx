import BaseInput from "@base-input";
import { useState } from "react";
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
  const [saving, setSaving] = useState(false);
  const type = props.type || data.type || "input";

  const handleKeyUp = (e) => {
    clearTimeout(timerId);
    if(e.target.value.toString().length > 0)
    setSaving(true);

    timerId = setTimeout(() => {
      loopar.method("Entity", "setTailwind", {}, {
        body: { to_element: data.to_element, classes: e.target.value },
        success: () => {
          setSaving(false);
        }
      })
    }, 1000);
  }

  return renderInput((field) => (
    <>
      <FormLabel>{data.label}</FormLabel>
      <FormControl className="p-2">
        <Textarea
          {...data} placeholder={data.placeholder || data.label} type={type} {...field}
          className="bg-transparent border border-input rounded-xm"
          onKeyUp={handleKeyUp}
          rows={6}
        />
      </FormControl>
      <FormDescription className="flex flex-col">
        {saving && <span className="bg-red-500">Saving Tailwind in the server</span>}
        Here you can set Tailwind classes to style the document, for example: bg-red-500 text-white
        if you want to set another class, you need to add your custom class in your uwn css file.
      </FormDescription>
      <FormMessage />
    </>
  ));
}