import BaseInput from "./input/base-input.jsx";
import Select from "@select";
import * as preloadedIcons from "@app/auto/preloaded-icons";
import loopar from "loopar";
import { useState, useEffect } from "react";

let iconsCache = {}

const isSimpleIcon = (name) => /^Si[A-Z]/.test(name ?? '');

export const DynamicIcon = ({ icon, className, brandColor }) => {
  const [svgData, setSvgData] = useState(() => iconsCache[icon?.value] ?? null);
  const value = icon?.value;

  useEffect(() => {
    if (!value) return;
    if (preloadedIcons[value]) return;
    if (iconsCache[value]) { setSvgData(iconsCache[value]); return; }

    if (icon.formattedValue && typeof icon.formattedValue === 'string') {
      const entry = { svg: icon.formattedValue, source: icon.source ?? null, hex: icon.hex ?? null };
      iconsCache[value] = entry;
      setSvgData(entry);
      return;
    }

    loopar.send({
      action: '/desk/Icon Manager/getSvg',
      query: { name: value },
      success: (r) => {
        if (r.svg) {
          const entry = { svg: r.svg, source: r.source ?? null, hex: r.hex ?? null };
          iconsCache[value] = entry;
          setSvgData(entry);
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

  if (svgData?.svg) {
    const isSimple = svgData.source === 'simple-icons' || isSimpleIcon(value);
    if (isSimple) {
      const fill = brandColor ?? 'currentColor';
      const processed = svgData.svg.replace('<svg ', `<svg class="${className || ''} simple-icon" style="fill:${fill};" `);
      return <span dangerouslySetInnerHTML={{ __html: processed }} />;
    }
    const processed = svgData.svg.replace(/class="[^"]*"/, `class="${className || ''} lucide-icon"`);
    return <span dangerouslySetInnerHTML={{ __html: processed }} />;
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
          description: <label>Powered by <a className="text-blue-600 visited:text-purple-600" href="https://lucide.dev/icons/" target="_blank">Lucide</a> & <a className="text-blue-600 visited:text-purple-600" href="https://simpleicons.org/" target="_blank">Simple Icons</a></label>,
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