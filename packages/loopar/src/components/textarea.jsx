import BaseInput from "@base-input";
import {
  FormControl,
  FormDescription,
  FormLabel,
  FormMessage
} from "@cn/components/ui/form";
import { Textarea } from "@cn/components/ui/textarea"

export default function TextArea(props) {
  const { renderInput, data } = BaseInput(props);
  const type = props.type || data.type || "input";

  return renderInput((field) => (
    <>
      <FormLabel>{data.label}</FormLabel>
      <FormControl className="p-2">
        <Textarea
          {...data}
          {...field}
          key={null}
          placeholder={data.placeholder || data.label} type={type} 
          className="border border-input rounded-xm bg-transparent"
          rows={data.rows || 6}
        />
      </FormControl>
      <FormDescription>
        {data.description}
      </FormDescription>
      <FormMessage />
    </>
  ));
}


 TextArea.metaFields = () => {
  return [
    {
      group: "form",
      elements: {
        rows: {
          element: INPUT,
          format: "number",
        },
      },
    },
  ];
}