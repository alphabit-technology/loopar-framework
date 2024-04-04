import DefaultCheckbox from "$default-checkbox";
import { Switch } from "@/components/ui/switch";
import BaseInput from "$base-input";

import {
  FormControl,
  FormDescription,
  FormLabel,
} from "@/components/ui/form";

export default class SwitchClass extends DefaultCheckbox {
  dontHaveContainer = true;

  render() {
    const data = this.data;

    return this.renderInput((field) => (
      <div className="gap-2">
        <div className="flex items-center">
          <FormControl>
            <Switch
              onCheckedChange={field.onChange}
              checked={field.value}
            />
          </FormControl>
          <FormLabel className="pl-2">{data.label}</FormLabel>
        </div>
        {data.description && (
          <FormDescription>{data.description}</FormDescription>
        )}
      </div>
    ), "flex flex-row gap-2");
  }
}
