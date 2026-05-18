import { useState, useEffect, useMemo, useCallback, useTransition, useRef } from "react";
import { loopar } from "loopar";

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Loader2,
} from "lucide-react";

const cardModules = import.meta.glob("./*-card.jsx", { eager: true });
const detailModules = import.meta.glob("./*-detail.jsx", { eager: true });

import DefaultCard from "./collection/default-card.jsx";
import DefaultDetail from "./collection/default-detail.jsx";

function lookupView(entityName) {
  if (!entityName) return { Card: DefaultCard, Detail: DefaultDetail };
  const slug = String(entityName)
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
  return {
    Card: cardModules[`./${slug}-card.jsx`]?.default || DefaultCard,
    Detail: detailModules[`./${slug}-detail.jsx`]?.default || DefaultDetail,
  };
}

function readDetailSlugFromUrl() {
  if (typeof window === "undefined") return null;
  try {
    const parts = window.location.pathname.split("/").filter(Boolean);
    return parts.length >= 2 ? decodeURIComponent(parts[parts.length - 1]) : null;
  } catch {
    return null;
  }
}

function buildDetailHref(slug) {
  if (typeof window === "undefined") return `./${encodeURIComponent(slug)}`;
  const path = window.location.pathname.replace(/\/$/, "");
  const segments = path.split("/").filter(Boolean);
  const base = segments.length >= 2 ? "/" + segments.slice(0, -1).join("/") : "/" + segments.join("/");
  return `${base}/${encodeURIComponent(slug)}`;
}

function buildListHref() {
  if (typeof window === "undefined") return ".";
  const segments = window.location.pathname.split("/").filter(Boolean);
  return "/" + (segments.length >= 2 ? segments.slice(0, -1).join("/") : segments.join("/"));
}

function spaNavigate(href, e) {
  if (e?.defaultPrevented) return;
  if (e?.button !== undefined && e.button !== 0) return;
  if (e?.metaKey || e?.ctrlKey || e?.shiftKey || e?.altKey) return;
  if (/^https?:\/\//i.test(href)) return;
  if (e) e.preventDefault();
  if (typeof window !== "undefined") {
    window.history.pushState({}, "", href);
    window.dispatchEvent(new PopStateEvent("popstate"));
    window.scrollTo({ top: 0, behavior: "instant" });
  }
}

function Spinner() {
  return (
    <div
      className="flex items-center justify-center py-16 text-muted-foreground"
      aria-busy="true"
      aria-live="polite"
    >
      <Loader2 className="w-6 h-6 animate-spin opacity-70" />
    </div>
  );
}

function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const pages = useMemo(() => {
    const out = [];
    const push = (p) => { if (!out.includes(p)) out.push(p); };
    push(1);
    for (let p = page - 1; p <= page + 1; p++) {
      if (p > 1 && p < totalPages) push(p);
    }
    push(totalPages);
    const withGaps = [];
    for (let i = 0; i < out.length; i++) {
      withGaps.push(out[i]);
      if (i < out.length - 1 && out[i + 1] - out[i] > 1) withGaps.push("…");
    }
    return withGaps;
  }, [page, totalPages]);

  const btn = (active) =>
    `min-w-9 h-9 px-3 rounded-md text-sm transition-colors ${
      active
        ? "bg-primary text-primary-foreground"
        : "bg-secondary text-secondary-foreground hover:bg-primary/10"
    }`;

  return (
    <div className="flex items-center justify-center gap-1 mt-8">
      <button type="button" onClick={() => onChange(Math.max(1, page - 1))} disabled={page <= 1} className={`${btn(false)} disabled:opacity-40 disabled:cursor-not-allowed`} aria-label="Previous page">
        <ChevronLeftIcon className="w-4 h-4 inline" />
      </button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="px-2 text-muted-foreground">…</span>
        ) : (
          <button type="button" key={p} onClick={() => onChange(p)} className={btn(p === page)}>{p}</button>
        )
      )}
      <button type="button" onClick={() => onChange(Math.min(totalPages, page + 1))} disabled={page >= totalPages} className={`${btn(false)} disabled:opacity-40 disabled:cursor-not-allowed`} aria-label="Next page">
        <ChevronRightIcon className="w-4 h-4 inline" />
      </button>
    </div>
  );
}

export default function Collection({ data = {} }) {
  const entityName = data.options ? String(data.options).trim() : null;
  const { Card, Detail } = useMemo(() => lookupView(entityName), [entityName]);
  const preloaded = data.preloaded;
  const isDetailOwner = preloaded?.mode === "detail";

  const [activeSlug, setActiveSlug] = useState(() => {
    if (isDetailOwner) return preloaded.item?.slug || readDetailSlugFromUrl();
    return null;
  });
  
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const sync = () => startTransition(() => {
      setActiveSlug(isDetailOwner ? readDetailSlugFromUrl() : null);
    });
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, [isDetailOwner]);

  if (!entityName) {
    return (
      <section className="w-full py-12 px-4 min-h-section-min">
        <div className="max-w-3xl mx-auto text-center text-sm text-muted-foreground">
          Collection has no entity configured. Set the <code>options</code> field.
        </div>
      </section>
    );
  }

  const schemaFields = preloaded?.fields || [];

  if (activeSlug) {
    const chosenLayout = data.detail_layout || "page";
    const ChosenDetail = chosenLayout === "page" ? DefaultDetail : Detail;

    return (
      <DetailView
        entityName={entityName}
        Detail={ChosenDetail}
        preloaded={preloaded?.mode === "detail" ? preloaded : null}
        fields={schemaFields}
        slug={activeSlug}
        appOverride={data.app}
        layout={chosenLayout}
        galleryMode={data.gallery_mode || "carousel"}
        galleryColumns={data.gallery_columns || 3}
        backLabel={data.back_label || `All ${entityName.toLowerCase()}s`}
      />
    );
  }

  return (
    <ListingView
      data={data}
      entityName={entityName}
      Card={Card}
      fields={schemaFields}
      preloaded={preloaded?.mode === "list" ? preloaded : null}
    />
  );
}

function DetailView({ entityName, Detail, preloaded, fields, slug, appOverride, layout, galleryMode, galleryColumns, backLabel }) {
  const preloadedItem = preloaded?.item || null;
  const backHref = buildListHref();

  return (
    <Detail
      slug={slug}
      app={appOverride}
      entity={entityName}
      fields={fields}
      layout={layout}
      galleryMode={galleryMode}
      galleryColumns={galleryColumns}
      preloadedItem={preloadedItem}
      backHref={backHref}
      backLabel={backLabel}
      onBack={(href, e) => spaNavigate(href, e)}
    />
  );
}

function ListingView({ data, entityName, Card, fields, preloaded }) {
  const {
    app: appOverride,
    page_size = 12,
    columns = 3,
    featured_only,
    category,
    tag,
    title,
    subtitle,
    card_variant = "default",
    empty_message = `No ${entityName.toLowerCase()}s to show yet.`,
  } = data;

  const pageSize = Math.max(1, Math.min(48, parseInt(page_size, 10) || 12));
  const cols = Math.max(1, Math.min(4, parseInt(columns, 10) || 3));

  const [page, setPage] = useState(preloaded?.page || 1);
  const [items, setItems] = useState(preloaded?.items || []);
  const [totalPages, setTotalPages] = useState(preloaded?.total_pages || 1);
  const [loading, setLoading] = useState(!preloaded);
  const [refetching, setRefetching] = useState(false);
  const [error, setError] = useState(preloaded?.error || "");
  const firstLoadRef = useRef(!preloaded);

  const load = useCallback(async () => {
    if (firstLoadRef.current) setLoading(true);
    else setRefetching(true);
    setError("");

    try {
      const query = {
        page: String(page),
        page_size: String(pageSize),
      };
      if (appOverride) query.app = String(appOverride).trim();
      if (featured_only) query.featured_only = "1";
      if (category) query.category = String(category).trim();
      if (tag) query.tag = String(tag).trim();

      const res = await loopar.api.get(entityName, "publicList", { query, freeze: false });
      setItems(Array.isArray(res?.items) ? res.items : []);
      setTotalPages(Math.max(1, parseInt(res?.total_pages, 10) || 1));
    } catch (e) {
      console.error(`Collection<${entityName}> load error:`, e);
      setError(e?.message || `Could not load ${entityName.toLowerCase()}s.`);
      if (firstLoadRef.current) setItems([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
      setRefetching(false);
      firstLoadRef.current = false;
    }
  }, [entityName, appOverride, page, pageSize, featured_only, category, tag]);

  useEffect(() => {
    if (preloaded && page === (preloaded.page || 1) && firstLoadRef.current) {
      firstLoadRef.current = false;
      return;
    }
    load();
  }, [load, preloaded, page]);

  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  }[cols];

  return (
    <section className="w-full py-12 px-4 min-h-section-min">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        {(title || subtitle) && (
          <div className="text-center">
            {title && <h2 className="text-2xl md:text-3xl font-medium">{title}</h2>}
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-2 max-w-2xl mx-auto">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {loading ? (
          <Spinner />
        ) : error ? (
          <div className="text-sm text-destructive text-center py-8">{error}</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-12">
            {empty_message}
          </div>
        ) : (
          <>
            <div
              className={`grid ${gridCols} gap-5 transition-opacity duration-200 ${
                refetching ? "opacity-60 pointer-events-none" : "opacity-100"
              }`}
              aria-busy={refetching || undefined}
            >
              {items.map(item => (
                  <Card
                    key={item.name}
                    item={item}
                    fields={fields}
                    variant={card_variant}
                    to={item.slug}
                    buildHref={buildDetailHref}
                    onNavigate={spaNavigate}
                  />
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </div>
    </section>
  );
}

Collection.metaFields = () => {
  return [
    {
      group: "custom",
      elements: {
        options: {
          element: INPUT,
          data: {
            label: "Entity",
            placeholder: "Project / Service / BlogPost",
            description: "The backing entity to fetch from (must have publicList / publicView actions).",
          },
        },
        app: {
          element: INPUT,
          data: {
            label: "App",
            placeholder: "Leave empty to use current app",
          },
        },
        title:        { element: TEXTAREA, data: { label: "Title" } },
        subtitle:     { element: TEXTAREA, data: { label: "Subtitle" } },
        page_size:    { element: INPUT, data: { label: "Items per page", format: "int" } },
        columns:      { element: INPUT, data: { label: "Columns (1–4)", format: "int" } },
        featured_only: { element: SWITCH, data: { label: "Featured only" } },
        category: {
          element: INPUT,
          data: {
            label: "Filter by category",
            placeholder: "Leave empty for all",
          },
        },
        tag: {
          element: INPUT,
          data: {
            label: "Filter by tag",
            placeholder: "Leave empty for all tags",
          },
        },
        card_variant: {
          element: SELECT,
          data: {
            label: "Card variant",
            options: "default\ncompact",
          },
        },
        detail_layout: {
          element: SELECT,
          data: {
            label: "Detail layout",
            options: "page\ngallery",
            description: "page: cover full-width + metadata table + gallery. gallery: hero with carousel.",
          },
        },
        gallery_mode: {
          element: SELECT,
          data: {
            label: "Gallery mode (on detail, page layout)",
            options: "carousel\ngrid",
            description: "carousel: cycling slides. grid: all images at once, responsive.",
          },
        },
        gallery_columns: {
          element: INPUT,
          data: {
            label: "Gallery columns (when grid, 1–4)",
            format: "int",
          },
        },
        back_label: {
          element: INPUT,
          data: { label: "Back link text (on detail)" },
        },
        empty_message: {
          element: TEXTAREA,
          data: { label: "Empty state message" },
        },
      },
    },
  ];
};
