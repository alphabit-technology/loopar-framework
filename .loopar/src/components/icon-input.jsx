import BaseInput from "@base-input";
import Select from "@select";
import * as LucideIcons from "lucide-react";
import { PiXLogo, PiXLogoBold, PiXLogoFill, PiXLogoThin } from "react-icons/pi";

const BaseIcons1 = {
  XLogo: PiXLogo,
  XLogoBold: PiXLogoBold,
  XLogoFill: PiXLogoFill,
  XlogoThin: PiXLogoThin,
  ...LucideIcons
};

const BaseIcons = Object.keys(BaseIcons1).filter(icon => !icon.includes("Icon") && !icon.includes("Lucide"));

const BaseIcon = ({ icon, className }) => {
  const Icon = BaseIcons1[icon] || null;
  if(!Icon) return null;
  return <Icon className={className} />;
}

export default function IconInput(props) {
  const { renderInput, data={ label: "Icon", name: "icon", value: ""}, value } = BaseInput(props);
  
  const options = BaseIcons.map((icon) => {
    return {
      value: icon,
      formattedValue: <><BaseIcon icon={icon} className="w-7 h-7"/><span className="pl-2">{icon}</span></>,
    }
  });

  return renderInput(field => {
    return (
      <Select
        data={{
          ...data,
          options: options,
          description: <label>Powered by <a className="text-blue-600 visited:text-purple-600" href="https://lucide.dev/icons/" target="_blank">Lucide React</a></label>,
        }}
        value={field.value}
        onChange={field.onChange}
        formattedValue={<div className="flex align-middle"><BaseIcon icon={field.value} className="w-7 h-7"/><div className="pl-2 my-1">{field.value}</div></div>}
        dontHaveLabel={props.dontHaveLabel}
        simpleInput={props.simpleInput}
      />
    )
  });
}

IconInput.metaFields = () => {return BaseInput.metaFields()}