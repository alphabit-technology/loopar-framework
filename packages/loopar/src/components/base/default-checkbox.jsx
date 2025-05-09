import {loopar} from "loopar";
import { Checkbox} from "@cn/components/ui/checkbox";
import BaseInput from "@base-input";

import {
  FormControl,
  FormDescription,
  FormLabel,
} from "@cn/components/ui/form";

export default function DefaultCheckbox(props) {
  const Comp = props.Comp || Checkbox;

  return (
    <BaseInput
      {...props}
      render={(field, data) => {
        const handleCheckedChange = (checked) => {
         /*if(field.name.includes("hidden"))
        console.log(["DefaultCheckbox.checked",checked]);*/
          field.onChange(loopar.utils.trueToBinary(checked));
        };

        /*if(field.name .includes("hidden"))
        console.log(["DefaultCheckbox", field.value, loopar.utils.trueToBinary(field.value)]);*/

        return (
          <div className="gap-2">
            <div className="flex items-center">
              <FormControl className="bg-red-500">
                <Comp
                  onCheckedChange={handleCheckedChange}
                  checked={loopar.utils.trueToBinary(field.value)}
                  className="-switch- hover:border-slate-500/70"
                />
              </FormControl>
              <FormLabel className="pl-2">{data.label}</FormLabel>
            </div>
            {data.description && (
              <FormDescription>{data.description}</FormDescription>
            )}
          </div>
        );
      }}
    />
  );
}

DefaultCheckbox.metaFields = () => {
  return BaseInput.metaFields();
}