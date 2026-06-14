export function makeContainerStyle(data, designerMode = false) {
  const style = {};
  if (data.full_height) {
    // In design mode use minHeight so editing chrome can grow the box; in
    // preview/live keep a fixed full-screen height.
    style[designerMode ? "minHeight" : "height"] = "100vh";
  } else if (designerMode) {
    // Use the CSS aspect-ratio property instead of the padding-top trick.
    // aspect-ratio gives the box its proportional size when content is small,
    // but lets it grow taller when the (taller) editing content needs it,
    // so slide objects are no longer vertically compressed.
    const pct = parseFloat(data.aspect_ratio) || 56.25;
    style.aspectRatio = `${100 / pct}`;
  } else {
    style.paddingTop = data.aspect_ratio || "56.25%";
  }
  return style;
}

export function getSlideThumbnail(slide) {
  if (!slide || typeof slide !== "object") return null;
  const d = slide.data || {};
  const candidates = [d.background_image, d.cover_image, d.image, d.src];
  for (const c of candidates) {
    if (!c) continue;
    if (typeof c === "string") return c;
    if (Array.isArray(c)) {
      const first = c.find(x => x && (x.src || x.url || x.name));
      if (first) return first.src || first.url || null;
    }
    if (typeof c === "object") return c.src || c.url || null;
  }

  if (Array.isArray(slide.elements)) {
    for (const child of slide.elements) {
      const nested = getSlideThumbnail(child);
      if (nested) return nested;
    }
  }
  return null;
}
