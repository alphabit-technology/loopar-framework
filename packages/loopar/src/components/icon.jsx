import { memo } from "react";
import { ComponentDefaults } from "./base/ComponentDefaults";
import { loopar } from "loopar";
import { cn } from "@cn/lib/utils";
import * as preloadedIcons from "@app/auto/preloaded-icons";
import iconManager, { useDynamicIcon } from "@services/icon-manager";

const isSimpleIcon = (name) => /^Si[A-Z]/.test(name ?? '');

const IconPlaceholder = memo(({ className }) => (
  <div className={cn(className, "opacity-0")} aria-hidden="true">
    <svg viewBox="0 0 24 24" className="w-full h-full" xmlns="http://www.w3.org/2000/svg" />
  </div>
));

IconPlaceholder.displayName = 'IconPlaceholder';

/**
 * Renders an icon by name. Resolution order:
 *   1. Preloaded React component (no network).
 *   2. Cached SVG from IconManager (shared across the whole app).
 *   3. Network fetch via IconManager (deduped).
 *
 * Color props (mutually compatible):
 *   - useBrandColor: boolean. If true and the icon has a brand hex
 *     (simple-icons), fill with `#<hex>`.
 *   - brandColor: string. Explicit color override; wins over useBrandColor.
 */
export const DynamicIcon = ({ icon, className, useBrandColor = false, brandColor }) => {
  const svgData = useDynamicIcon(icon);
  const value = icon?.value;

  if (!value) return <div className={className} />;

  if (iconManager.isPreloaded(value)) {
    const PIcon = preloadedIcons[value];
    return <PIcon className={className} />;
  }

  if (svgData?.svg) {
    const isSimple = svgData.source === 'simple-icons' || isSimpleIcon(value);
    if (isSimple) {
      const fill = brandColor
        ?? (useBrandColor && svgData.hex ? `#${svgData.hex}` : 'currentColor');
      const processed = svgData.svg.replace(
        '<svg ',
        `<svg class="${className || ''} simple-icon" style="fill:${fill};" `
      );
      return <span dangerouslySetInnerHTML={{ __html: processed }} />;
    }
    const processed = svgData.svg.replace(
      /class="[^"]*"/,
      `class="${className || ''} lucide-icon"`
    );
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
