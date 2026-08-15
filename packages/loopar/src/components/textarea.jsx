import BaseInput from "@base-input";
import {
  FormControl,
  FormDescription,
  FormLabel
} from "@cn/components/ui/form";
import { Textarea } from "@cn/components/ui/textarea"

export default function TextArea(props) {
  const { renderInput, data } = BaseInput(props);

  return renderInput((field) => {
    const { isInvalid, ...inputProps } = field;

    return (
      <>
        <FormLabel>{data.label}</FormLabel>
        <FormControl className="p-2">
          <Textarea
            {...inputProps}
            placeholder={data.placeholder || data.label}
            className="border border-input rounded-xm bg-transparent"
            rows={data.rows || 6}
          />
        </FormControl>
        {data.description && (
          <FormDescription>
            {data.description}
          </FormDescription>
        )}
      </>
    );
  });
}


 TextArea.metaFields = () => {
  return [
    ...BaseInput.metaFields(),
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
