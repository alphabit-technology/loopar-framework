import * as LucideIcons from "lucide-react";
import BaseInput from "$base-input";
import Select from "@select";

export default class IconInput extends BaseInput {
  render() {
    const data = this.data || { label: "Icon", name: "icon", value: ""};
    const options = Object.keys(LucideIcons).filter(icon => !icon.includes("Icon")).map((icon) => {
      const Icon = LucideIcons[icon];

      return {
        option: icon,
        value: <><Icon className="w-7 h-7"/><span className="pl-2">{icon}</span></>,
      }
    });

   
    return this.renderInput(field => {
      const Current = LucideIcons[field.value] || LucideIcons["Help"];

       options.unshift({
        option: data.value,
        title: <><Current className="w-7 h-7"/><span className="pl-2">{field.value}</span></>,
      });
      
      return (
        <>
        <Select
          data={{
            ...data,
            options: options,
            description: <label>Powered by <a className="text-blue-600 visited:text-purple-600" href="https://lucide.dev/icons/" target="_blank">Lucide Icons</a></label>,
          }}
          formattedValue={<div className="flex align-middle"><Current className="w-7 h-7"/><div className="pl-2 my-1">{field.value}</div></div>}
        />
        </>
      )}
    );
  }
}