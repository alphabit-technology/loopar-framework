import { lazy, Suspense, memo } from "react";
import { ComponentDefaults } from "./base/ComponentDefaults";
import { loopar } from "loopar";
import { cn } from "@cn/lib/utils";
import * as preloadedIcons from "@app/auto/preloaded-icons";

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

const MetaIcon = memo((props) => {
  const newProps = loopar.utils.renderizableProps(props);
  const { getSize } = ComponentDefaults(props);
  const data = props.data || {};
  const iconName = data?.icon || 'HelpCircle';
  const rounded = data?.rounded ? "rounded-full" : "rounded-md";
  const size = getSize();
  
  const containerClassName = cn("p-0", size, newProps.className, rounded);
  const iconClassName = "w-full h-full";
  
  const isLoaded = iconCache.has(iconName);
  
  if (isLoaded) {
    const Icon = iconCache.get(iconName);
    return (
      <div {...newProps} className={containerClassName}>
        <Icon className={iconClassName} />
      </div>
    );
  }
  
  if (typeof window === 'undefined') {
    // Estamos en el servidor - mostrar placeholder
    return (
      <div {...newProps} className={containerClassName}>
        <IconPlaceholder className={iconClassName} />
      </div>
    );
  }
  
  if (!iconCache.has(`lazy:${iconName}`)) {
    const fileName = toKebabCase(iconName);
    
    iconCache.set(
      `lazy:${iconName}`,
      lazy(async () => {
        try {
          const module = await import(`lucide-react/dist/esm/icons/${fileName}.js`);
          return { default: module.default };
        } catch (error) {
          if (iconCache.has('HelpCircle')) {
            return { default: iconCache.get('HelpCircle') };
          }
          const fallback = await import('lucide-react/dist/esm/icons/help-circle.js');
          return { default: fallback.default };
        }
      })
    );
  }
  
  const LazyIcon = iconCache.get(`lazy:${iconName}`);
  
  return (
    <div {...newProps} className={containerClassName}>
      <Suspense fallback={<IconPlaceholder className={iconClassName} />}>
        <LazyIcon className={iconClassName} />
      </Suspense>
    </div>
  );
});

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