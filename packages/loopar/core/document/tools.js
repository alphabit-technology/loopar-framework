import { fileManage } from "../file-manage.js";
import { loopar } from "../loopar.js";

// Elements that persist a per-instance slide index in a cookie keyed by
// `field.node`. The server injects the cookie value into the element's
// `data._cookie_index` so the client hydrates from `data` (consistent)
// instead of re-reading the cookie post-mount (causes a visible flash).
const CAROUSEL_LIKE_ELEMENTS = new Set([
  "carousel",
  "carrusel",
  "banner_image",
  "gallery",
]);

/**
 * Flatten an entity's doc_structure into a serialisable schema the client
 * can use to render the entity dynamically. We only keep what the default
 * card/detail need: element type, name, label, multiple, format, options.
 * Cards/containers (row, col, card, section) become section markers so the
 * detail renderer can preserve visual grouping.
 */
function buildEntitySchema(entityName) {
  const ref = loopar.getRef(entityName);
  if (!ref) return [];
  let entityConfig;
  try {
    entityConfig = fileManage.getConfigFile(entityName, ref.__ROOT__);
  } catch {
    return [];
  }
  if (!entityConfig?.doc_structure) return [];
  const tree = loopar.utils.JSONparse(entityConfig.doc_structure, []);
  return flattenSchema(tree);
}

function flattenSchema(nodes) {
  const out = [];
  for (const node of (nodes || [])) {
    const elem = node?.element;
    const data = node?.data || {};
    if (["row", "col", "card", "section", "tabs", "tab", "generic", "div"].includes(elem)) {
      // Emit a soft section marker so the detail renderer can group fields
      // visually, then descend into children.
      if (data.label && elem === "card") {
        out.push({ element: "_section", label: data.label, name: data.name || null });
      }
      if (node.elements) out.push(...flattenSchema(node.elements));
      continue;
    }
    if (!data.name) continue;
    // Skip framework-owned helper fields the editor uses to disambiguate
    // parent links etc. — they're not useful in a public render.
    if (["parent_id", "parent_document"].includes(data.name)) continue;
    out.push({
      element: elem,
      name: data.name,
      label: data.label || null,
      multiple: data.multiple ? 1 : 0,
      format: data.format || null,
      options: data.options || null,
      placeholder: data.placeholder || null,
      // Hints the editor can set on a field to control public rendering.
      show_in_card: data.show_in_card ? 1 : 0,
      show_in_detail: data.show_in_detail ? 1 : 0,
      hidden: data.hidden ? 1 : 0,
    });
  }
  return out;
}

/**
 * Pre-process a doc_structure on the server before render.
 *
 * Mutates each element's `data` in-place with whatever the element needs
 * to be SSR-renderable: MARKDOWN gets its HTML, REVIEW gets its rows, and
 * COLLECTION (a generic data-backed gallery) gets its detail item or its
 * paginated list — driven by `requestContext` from the current request.
 *
 * @param {Array}  doc_structure   Parsed doc_structure tree.
 * @param {boolean} renderMarkdown Whether to pre-render markdown values.
 * @param {string} document_name   Host document name (page). Used by some
 *                                 elements (REVIEW) as a parent reference.
 * @param {Object} [requestContext] Optional info from the active request.
 * @param {string} [requestContext.slug] Detail slug from the URL second
 *                                       segment. When present, COLLECTION
 *                                       precarga UN documento; cuando no,
 *                                       precarga la primera página del
 *                                       listado.
 * @param {string} [requestContext.app]  Scope app name. Used to filter
 *                                       COLLECTION queries.
 * @param {Object} [requestContext.query] Query string params (page, tag,
 *                                       featured_only, etc.) forwarded
 *                                       to the COLLECTION listing.
 */
export const parseDocStructure = async (
  doc_structure,
  renderMarkdown = true,
  document_name,
  requestContext = null
) => {
  doc_structure = loopar.utils.JSONparse(doc_structure, doc_structure);
  return Promise.all(
    doc_structure.map(async (field) => {
      field.data ??= {};
      field.node ??= field.key || field.data.key || loopar.getUniqueKey();

      if (field.element === MARKDOWN && renderMarkdown) {
        field.data.value = loopar.markdownRenderer(field.data.value);
      }

      if (field.element === REVIEW) {
        field.data.reviews = await loopar.db.getAll("Review", ["*"], {
          parent_id: document_name,
          approved: 1
        });
      }

      if (field.element === EXAMPLE_VIEWER && renderMarkdown) {
        field.data.rendered_value = loopar.markdownRenderer(
          loopar.utils.isJSON(field.data.value)
            ? JSON.stringify(JSON.parse(field.data.value), null, 3)
            : ""
        );
      }

      if (field.element === COLLECTION) {
        await preloadCollection(field, requestContext);
      }

      // Carousel-like elements persist their current slide in a cookie
      // keyed by their unique `node`. Hydrating from a useState() that
      // reads the cookie in-client only is fine in CSR, but in SSR the
      // server may not have access to the cookie via the same call,
      // causing a "flash to slide 0 then jump to N" on hydration. We
      // inject the cookie value into `data._cookie_index` here so the
      // component initialises from `data` — consistent across SSR and
      // hydration.
      if (CAROUSEL_LIKE_ELEMENTS.has(field.element) && field.node) {
        try {
          const saved = loopar.cookie?.get?.(field.node);
          if (saved != null && saved !== "") {
            field.data._cookie_index = String(saved);
          }
        } catch (_) { /* cookie store unavailable; client will fall back */ }
      }

      if (field.elements) {
        field.elements = await parseDocStructure(field.elements, renderMarkdown, document_name, requestContext);
      }

      return field;
    })
  );
};

/**
 * Internal — fills field.data.preloaded for a COLLECTION element.
 */
async function preloadCollection(field, requestContext) {
  const entityName = field.data?.options ? String(field.data.options).trim() : null;
  if (!entityName) {
    field.data.preloaded = { mode: "list", items: [], total: 0, fields: [], error: "missing_options" };
    return;
  }

  // Guard: if the entity isn't installed (or doesn't exist in refs), bail
  // gracefully so the page still renders the rest of the doc_structure.
  const ref = loopar.getRef(entityName);
  if (!ref) {
    field.data.preloaded = { mode: "list", items: [], total: 0, fields: [], error: "unknown_entity" };
    return;
  }

  // Schema for the default renderer (so a new entity needs no React code).
  const schema = buildEntitySchema(entityName);

  const ctx = requestContext || {};
  const slug = ctx.slug ? String(ctx.slug).trim() : null;
  const app = ctx.app ? String(ctx.app).trim() : null;
  const q = ctx.query || {};

  try {
    if (slug) {
      // Detail mode: one row matching slug + app + published.
      // If THIS entity doesn't have a row with that slug, it means the
      // URL belongs to another COLLECTION on the same page (e.g. /Project/
      // <slug> on a page with both Project and Service galleries — the
      // slug only matches one of them). Fall back to list mode rather
      // than rendering a misleading "not found".
      const filter = { slug, published: 1 };
      if (app) filter.app = app;
      const row = await loopar.db.qx()(entityName)
        .select("*")
        .where(filter)
        .whereNull("__deleted_at__")
        .first();
      if (row) {
        field.data.preloaded = { mode: "detail", item: parseRowTags(row), fields: schema };
        // Flag the request context so the controller knows at least one
        // collection on this page owned the detail slug. If no collection
        // ends up flagging it, the URL is bogus and the controller will
        // surface a real 404.
        if (requestContext) requestContext._anyDetailMatched = true;
        return;
      }
      // Slug present but no match for this entity → fall through to list.
    }

    // List mode: paginated query honoring the field's own metaFields +
    // anything the URL query forwarded (page, tag, featured_only).
    const pageNum = clampInt(q.page ?? field.data.page, 1, 1000, 1);
    const pageSize = clampInt(
      q.page_size ?? field.data.page_size,
      1, 48,
      field.data.page_size ? parseInt(field.data.page_size, 10) || 12 : 12
    );
    const featuredOnly =
      field.data.featured_only === 1 ||
      field.data.featured_only === "1" ||
      field.data.featured_only === true ||
      q.featured_only === "1" ||
      q.featured_only === "true";
    const tag = q.tag ?? field.data.tag;
    const category = q.category ?? field.data.category;

    const filter = { published: 1 };
    if (app) filter.app = app;
    if (featuredOnly) filter.featured = 1;
    if (category) filter.category = String(category).trim();

    let qb = loopar.db.qx()(entityName)
      .select("*")
      .where(filter)
      .whereNull("__deleted_at__");
    if (tag) qb = qb.where("tags", "like", `%${String(tag).trim()}%`);

    let countQb = loopar.db.qx()(entityName)
      .count({ count: "id" })
      .where(filter)
      .whereNull("__deleted_at__");
    if (tag) countQb = countQb.where("tags", "like", `%${String(tag).trim()}%`);

    // Ordering: feature flag → manual `order` (for catalogues like Service)
    // when the column exists; fall back to creation date.
    const orderBy = [{ column: "featured", order: "desc" }];
    const fields = ref.__FIELDS__ || [];
    const hasOrder = fields.some(f => f?.data?.name === "order");
    if (hasOrder) orderBy.push({ column: "order", order: "asc" });
    orderBy.push({ column: "__created_at__", order: "desc" });

    const [rows, countRow] = await Promise.all([
      qb.orderBy(orderBy).limit(pageSize).offset((pageNum - 1) * pageSize),
      countQb.first(),
    ]);

    const total = Number(countRow?.count || 0);

    field.data.preloaded = {
      mode: "list",
      items: rows.map(parseRowTags),
      total,
      page: pageNum,
      page_size: pageSize,
      total_pages: Math.max(1, Math.ceil(total / pageSize)),
      fields: schema,
    };
  } catch (err) {
    // Don't blow up the whole page render if the collection query fails;
    // surface the error so the client can show a graceful message.
    loopar.warn?.(`COLLECTION preload failed for entity=${entityName}: ${err?.message || err}`);
    field.data.preloaded = { mode: slug ? "detail" : "list", items: [], item: null, total: 0, fields: schema, error: "fetch_failed" };
  }
}

function clampInt(v, min, max, fallback) {
  const n = parseInt(v, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function parseRowTags(row) {
  if (!row || typeof row !== "object") return row;
  if (typeof row.tags === "string") {
    return {
      ...row,
      tags: row.tags.split(",").map(s => s.trim()).filter(Boolean),
    };
  }
  return row;
}

export const parseDocument = (entity, doc) => {
  const ref = loopar.getRef(entity);
  const structure = JSON.parse(
    fileManage.getConfigFile(entity, ref.__ROOT__).doc_structure
  );

  const fieldMap = new Map();

  const buildFieldMap = (fields) => {
    fields.forEach((field) => {
      fieldMap.set(field.data.name, field);
      if (field.elements) buildFieldMap(field.elements);
    });
  };

  buildFieldMap(structure);

  Object.entries(doc || {}).forEach(([key, value]) => {
    const field = fieldMap.get(key);
    if (field?.element === MARKDOWN_INPUT) {
      doc[key] = loopar.markdownRenderer(value);
    }
  });

  return doc;
};