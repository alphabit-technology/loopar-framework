export function makeContainerStyle(data) {
  const style = {};
  if (data.full_height) {
    style.height = "100vh";
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
