import { memo, useState, useEffect } from "react";
import { ComponentDefaults } from "./base/ComponentDefaults";
import { loopar } from "loopar";
import { cn } from "@cn/lib/utils";
import * as preloadedIcons from "@app/auto/preloaded-icons";

let iconsCache = {}

const isSimpleIcon = (name) => /^Si[A-Z]/.test(name ?? '');

const IconPlaceholder = memo(({ className }) => (
  <div className={cn(className, "opacity-0")} aria-hidden="true">
    <svg viewBox="0 0 24 24" className="w-full h-full" xmlns="http://www.w3.org/2000/svg" />
  </div>
));

IconPlaceholder.displayName = 'IconPlaceholder';

export const DynamicIcon = ({ icon, className, useBrandColor = false }) => {
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
      freeze: false,
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
      const fill = useBrandColor && svgData.hex ? `#${svgData.hex}` : 'currentColor';
      const processed = svgData.svg.replace('<svg ', `<svg class="${className || ''} simple-icon" style="fill:${fill};" `);
      return <span dangerouslySetInnerHTML={{ __html: processed }} />;
    }
    const processed = svgData.svg.replace(/class="[^"]*"/, `class="${className || ''} lucide-icon"`);
    return <span dangerouslySetInnerHTML={{ __html: processed }} />;
  }

  return <div className={className} />;
};

const MetaIcon = (props) => {
  const newProps = loopar.utils.renderizableProps(props);
  const { getSize } = ComponentDefaults(props);
  const data = props.data || {};
  const iconName = data?.icon || 'HelpCircle';
  const rounded = data?.rounded ? "rounded-full" : "rounded-md";
  const size = getSize();
  
  const containerClassName = cn("p-0", size, newProps.className, rounded);
  const iconClassName = "w-full h-full";
  
  return (
    <DynamicIcon
      icon={{value: data.icon}}
      className={containerClassName}
      useBrandColor={data.useBrandColor ?? false}
    />
  )
};

MetaIcon.displayName = 'MetaIcon';

MetaIcon.metaFields = () => {
  return [{
    group: "form",
    elements: {
      icon: { element: ICON_INPUT },
      rounded: { element: SWITCH },
      useBrandColor: { element: SWITCH },
    }
  }];
};

export default MetaIcon;