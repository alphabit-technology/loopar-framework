import { lazy, Suspense, memo, useState, useEffect } from "react";
import { ComponentDefaults } from "./base/ComponentDefaults";
import { loopar } from "loopar";
import { cn } from "@cn/lib/utils";

import { PiXLogo, PiXLogoBold, PiXLogoFill, PiXLogoThin } from "react-icons/pi";
import * as preloadedIcons from "@app/auto/preloaded-icons";
let iconsCache = {}

const extraIcons = {
  PiXLogo,
  PiXLogoBold,
  PiXLogoFill,
  PiXLogoThin
}

const iconCache = new Map();

Object.entries(preloadedIcons).forEach(([name, IconComponent]) => {
  //if (IconComponent && typeof IconComponent === 'function') {
    iconCache.set(name, IconComponent);
  //}
});

const toKebabCase = (str) => {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
};

const IconPlaceholder = memo(({ className }) => (
  <div className={cn(className, "opacity-0")} aria-hidden="true">
    <svg viewBox="0 0 24 24" className="w-full h-full" xmlns="http://www.w3.org/2000/svg" />
  </div>
));

IconPlaceholder.displayName = 'IconPlaceholder';


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
    <DynamicIcon icon={{value: data.icon}} className={containerClassName}/>
  )
};

MetaIcon.displayName = 'MetaIcon';

MetaIcon.metaFields = () => {
  return [{
    group: "form",
    elements: {
      icon: {
        element: ICON_INPUT,
      },
      rounded: {
        element: SWITCH,
      },
    }
  }];
};

export default MetaIcon;