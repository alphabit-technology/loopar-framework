import * as LucideIcons from "@radix-ui/react-icons";
import BaseInput from "@base-input";
import Select from "@select";
import { CircleIcon } from "@radix-ui/react-icons";

export default function IconInput(props) {
  const { renderInput, data={ label: "Icon", name: "icon", value: ""}, value } = BaseInput(props);
  
  const options = Object.keys(LucideIcons).filter(icon => /*!icon.includes("Icon") &&*/ !icon.includes("Lucide")).map((icon) => {
    const Icon = LucideIcons[icon] || HelpCircle;

    return {
      option: Icon ? icon : "HelpCircle",
      value: <><Icon className="w-7 h-7"/><span className="pl-2">{icon}</span></>,
    }
  });

  return renderInput(field => {
    const Current = LucideIcons[field.value] || CircleIcon;

    options.unshift({
      option: field.value,
      title: <><Current className="w-7 h-7"/><span className="pl-2">{field.value}</span></>,
    });
    
    return (
      <Select
        data={{
          ...data,
          options: options,
          description: <label>Powered by <a className="text-blue-600 visited:text-purple-600" href="https://www.radix-ui.com/icons" target="_blank">Radix Icons</a></label>,
        }}
        onChange={field.onChange}
        formattedValue={<div className="flex align-middle"><Current className="w-7 h-7"/><div className="pl-2 my-1">{field.value}</div></div>}
        dontHaveLabel={props.dontHaveLabel}
        simpleInput={props.simpleInput}
      />
    )
  });
}

IconInput.metaFields = () => {return BaseInput.metaFields()}