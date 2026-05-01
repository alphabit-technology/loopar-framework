import { useEffect, useState } from "react";
import iconManager from "./icon-manager";

export function useDynamicIcon(icon) {
  const value = icon?.value;
  const formattedValue = icon?.formattedValue;

  const [svgData, setSvgData] = useState(() =>
    value ? iconManager.getCached(value) : null
  );

  useEffect(() => {
    if (!value) {
      setSvgData(null);
      return undefined;
    }
    if (iconManager.isPreloaded(value)) return undefined;

    const result = iconManager.resolve(icon);

    if (result && typeof result.then !== "function") {
      setSvgData(result);
      return undefined;
    }

    let cancelled = false;
    Promise.resolve(result).then((entry) => {
      if (!cancelled && entry) setSvgData(entry);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, formattedValue]);

  return svgData;
}

export default useDynamicIcon;
