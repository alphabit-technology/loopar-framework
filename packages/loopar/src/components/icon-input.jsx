import BaseInput from "./input/base-input.jsx";
import Select from "@select";
import { PiXLogo, PiXLogoBold, PiXLogoFill, PiXLogoThin } from "react-icons/pi";
import * as preloadedIcons from "@app/auto/preloaded-icons";
import loopar from "loopar";
import { useState, useEffect } from "react";
let iconsCache = {}

const extraIcons = {
  PiXLogo,
  PiXLogoBold,
  PiXLogoFill,
  PiXLogoThin
}

export const DynamicIcon = ({ icon, className }) => {
  const [svg, setSvg] = useState(iconsCache?.[icon?.value] || null);
  const value = icon?.value;

  useEffect(() => {
    if (!value) return;
    
    if (preloadedIcons[value] || extraIcons[value]) return;
    
    if (iconsCache?.[value]) {
      setSvg(iconsCache[value]);
      return;
    }

    if (icon.formattedValue && typeof icon.formattedValue === 'string') {
      iconsCache = iconsCache || {};
      iconsCache[value] = icon.formattedValue;
      setSvg(icon.formattedValue);
      return;
    }

    loopar.send({
      action: '/desk/Icon Manager/getSvg',
      params: { name: value },
      success: (r) => {
        if (r.svg) {
          iconsCache = iconsCache || {};
          iconsCache[value] = r.svg;
          setSvg(r.svg);
        }
      },
      freeze: false
    });
  }, [value, icon?.formattedValue]);

  if (!value) return <div className={className} />;

  if (preloadedIcons[value]) {
    const PIcon = preloadedIcons[value];
    return <PIcon className={className} />;
  }

  if (extraIcons[value]) {
    const PIcon = extraIcons[value];
    return <PIcon className={className} />;
  }

  if (svg) {
    const styledSvg = svg.replace(
      /class="[^"]*"/,
      `class="${className || ''} lucide-icon"`
    );
    return <span dangerouslySetInnerHTML={{ __html: styledSvg }} />;
  }

  return <div className={className} />;
};

export default function IconInput(props) {
  const { renderInput, data = { label: "Icon", name: "icon", value: "" } } = BaseInput(props);

  return renderInput(field => {
    return (
      <Select
        data={{
          ...data,
          options: "Icon Manager",
          description: <label>Powered by <a className="text-blue-600 visited:text-purple-600" href="https://lucide.dev/icons/" target="_blank">Lucide React</a></label>,
        }}
        value={field.value}
        renderOption={(option) => (
          <div className="flex align-middle">
            <DynamicIcon icon={option} className="w-7 h-7" />
            <div className="pl-2 my-1">{option.label || option.value}</div>
          </div>
        )}
        dontHaveLabel={props.dontHaveLabel}
        simpleInput={props.simpleInput}
      />
    );
  });
}

IconInput.droppable = false;
IconInput.metaFields = () => BaseInput.metaFields();