import BaseInput from "@base-input";
import Select from "@select";
import * as LucideIcons from "lucide-react";
import { PiXLogo, PiXLogoBold, PiXLogoFill, PiXLogoThin } from "react-icons/pi";
//import { iconNames } from 'lucide-react/dynamic.mjs';

//import {iconNames} from "lucide-react/dynamic.js";

const BaseIcons1 = {
  XLogo: PiXLogo,
  XLogoBold: PiXLogoBold,
  XLogoFill: PiXLogoFill,
  XlogoThin: PiXLogoThin,
  ...LucideIcons
};

/* iconNames.forEach(i => {
  BaseIcons1[i] = i
})

console.log(iconNames); */

const BaseIcons = Object.keys(BaseIcons1).filter(icon => !icon.includes("Icon") && !icon.includes("Lucide"));

export const BaseIcon = ({ icon, className }) => {
  const Icon = BaseIcons1[icon] || null;
  if(!Icon) return null;
  return <Icon className={className} />;
}

export default function IconInput(props) {
  const { renderInput, data={ label: "Icon", name: "icon", value: ""} } = BaseInput(props);
  
  const options = BaseIcons.map((icon) => {
    return {
      value: icon,
      formattedValue: <div className="flex align-middle"><BaseIcon icon={icon} className="w-7 h-7"/><div className="pl-2 my-1">{icon}</div></div>,
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
        formattedValue={<div className="flex align-middle"><BaseIcon icon={field.value} className="w-7 h-7"/><div className="pl-2 my-1">{field.value}</div></div>}
        dontHaveLabel={props.dontHaveLabel}
        simpleInput={props.simpleInput}
      />
    )
  });
}

IconInput.metaFields = () => {return BaseInput.metaFields()}