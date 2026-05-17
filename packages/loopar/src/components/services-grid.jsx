import { useState, useEffect, useMemo, useCallback, useTransition, useRef } from "react";
import { loopar } from "loopar";
import fileManager from "@@file/file-manager";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowRightIcon,
  ClockIcon,
  Loader2,
} from "lucide-react";
import ServiceDetail from "@service-detail";
import Icon from "@icon";
import { formatPrice } from "./service-pricing";

const SERVICE_QUERY_PARAM = "service";

function readServiceSlugFromUrl() {
  if (typeof window === "undefined") return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const v = params.get(SERVICE_QUERY_PARAM);
    return v ? v.trim() || null : null;
  } catch {
    return null;
  }
}

function buildDetailHref(slug) {
  if (typeof window === "undefined") return `?${SERVICE_QUERY_PARAM}=${encodeURIComponent(slug)}`;
  const url = new URL(window.location.href);
  url.search = "";
  url.searchParams.set(SERVICE_QUERY_PARAM, slug);
  return url.pathname + url.search;
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

function ServiceCard({ service, variant }) {
  const cover = useMemo(() => {
    if (!service.cover_image) return null;
    const files = fileManager.getMappedFiles(service.cover_image) || [];
    return files.find(f => f && f.src) || null;
  }, [service.cover_image]);

  const href = buildDetailHref(service.slug || service.name);

  const onCardClick = (e) => {
    if (e.defaultPrevented) return;
    if (e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", href);
      window.dispatchEvent(new PopStateEvent("popstate"));
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  };

  const priceLabel = formatPrice(service);
  const tags = Array.isArray(service.tags) ? service.tags.slice(0, 3) : [];

  return (
    <a
      href={href}
      onClick={onCardClick}
      className="group bg-card text-card-foreground border rounded-xl overflow-hidden flex flex-col hover:shadow-lg hover:border-primary/40 transition-all"
    >
      {cover ? (
        <div className="relative aspect-[16/10] bg-secondary overflow-hidden">
          <img
            src={cover.src}
            alt={cover.name || service.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {service.featured ? (
            <span className="absolute top-2 left-2 text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-md bg-primary text-primary-foreground">
              Featured
            </span>
          ) : null}
        </div>
      ) : service.icon ? (
        <div className="relative bg-secondary/60 px-6 pt-8 pb-4 flex items-start justify-between">
          <div className="w-14 h-14 rounded-xl bg-background text-primary flex items-center justify-center shadow-sm">
            <Icon data={{ icon: service.icon }} className="w-7 h-7" />
          </div>
          {service.featured ? (
            <span className="text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-md bg-primary text-primary-foreground">
              Featured
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="p-5 flex flex-col gap-2 flex-1">
        {service.category ? (
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {service.category}
          </span>
        ) : null}

        <h3 className="text-base font-medium leading-tight">
          {service.title}
        </h3>

        {service.tagline ? (
          <p className="text-sm text-muted-foreground leading-snug line-clamp-2">
            {service.tagline}
          </p>
        ) : service.summary ? (
          <p className="text-sm text-muted-foreground leading-snug line-clamp-3">
            {service.summary}
          </p>
        ) : null}

        <div className="flex items-end justify-between gap-3 mt-auto pt-3">
          <div className="flex flex-col gap-1">
            {priceLabel ? (
              <span className="text-sm font-medium">{priceLabel}</span>
            ) : null}
            {service.duration_estimate ? (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <ClockIcon className="w-3 h-3 opacity-70" />
                {service.duration_estimate}
              </span>
            ) : null}
          </div>
          <span className="flex items-center gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
            Learn more
            <ArrowRightIcon className="w-3.5 h-3.5" />
          </span>
        </div>

        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 pt-2 border-t mt-1">
            {tags.map(t => (
              <span
                key={t}
                className="text-xs px-2 py-0.5 rounded-md bg-secondary/60 text-secondary-foreground"
              >
                #{t}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </a>
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
      <button
        type="button"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        className={`${btn(false)} disabled:opacity-40 disabled:cursor-not-allowed`}
        aria-label="Previous page"
      >
        <ChevronLeftIcon className="w-4 h-4 inline" />
      </button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="px-2 text-muted-foreground">…</span>
        ) : (
          <button
            type="button"
            key={p}
            onClick={() => onChange(p)}
            className={btn(p === page)}
          >
            {p}
          </button>
        )
      )}
      <button
        type="button"
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        className={`${btn(false)} disabled:opacity-40 disabled:cursor-not-allowed`}
        aria-label="Next page"
      >
        <ChevronRightIcon className="w-4 h-4 inline" />
      </button>
    </div>
  );
}

export default function ServicesGrid({ data = {} }) {
  const [activeSlug, setActiveSlug] = useState(() => readServiceSlugFromUrl());
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sync = () => startTransition(() => setActiveSlug(readServiceSlugFromUrl()));
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  if (activeSlug) {
    return (
      <ServiceDetail
        slug={activeSlug}
        app={data?.app}
        backHref={typeof window !== "undefined" ? window.location.pathname : "."}
      />
    );
  }

  return <ServicesList data={data} />;
}

function ServicesList({ data = {} }) {
  const {
    app: appOverride,
    page_size = 12,
    columns = 3,
    featured_only,
    category,
    tag,
    title,
    subtitle,
    empty_message = "No services published yet.",
  } = data;

  const pageSize = Math.max(1, Math.min(48, parseInt(page_size, 10) || 12));
  const cols = Math.max(1, Math.min(4, parseInt(columns, 10) || 3));

  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);
  const [error, setError] = useState("");
  const firstLoadRef = useRef(true);

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

      const res = await loopar.api.get("Service", "publicList", { query, freeze: false });
      setItems(Array.isArray(res?.items) ? res.items : []);
      setTotalPages(Math.max(1, parseInt(res?.total_pages, 10) || 1));
    } catch (e) {
      console.error("ServicesGrid load error:", e);
      setError(e?.message || "Could not load services.");
      if (firstLoadRef.current) setItems([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
      setRefetching(false);
      firstLoadRef.current = false;
    }
  }, [appOverride, page, pageSize, featured_only, category, tag]);

  useEffect(() => { load(); }, [load]);

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
              {items.map(s => (
                <ServiceCard key={s.name} service={s} />
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </div>
    </section>
  );
}

ServicesGrid.metaFields = () => {
  return [
    {
      group: "custom",
      elements: {
        app: {
          element: INPUT,
          data: {
            label: "App",
            placeholder: "Leave empty to use current app",
            description: "Optional. Restrict listing to services of a specific app.",
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
        empty_message: {
          element: TEXTAREA,
          data: { label: "Empty state message" },
        },
      },
    },
  ];
};
