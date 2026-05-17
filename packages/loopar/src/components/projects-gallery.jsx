import { useState, useEffect, useMemo, useCallback, useTransition, useRef } from "react";
import { loopar } from "loopar";
import fileManager from "@@file/file-manager";
import { ChevronLeftIcon, ChevronRightIcon, ExternalLinkIcon } from "lucide-react";
import ProjectDetail from "@project-detail";

const PROJECT_QUERY_PARAM = "project";

function readProjectSlugFromUrl() {
  if (typeof window === "undefined") return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const v = params.get(PROJECT_QUERY_PARAM);
    return v ? v.trim() || null : null;
  } catch {
    return null;
  }
}

function buildDetailHref(slug) {
  if (typeof window === "undefined") return `?${PROJECT_QUERY_PARAM}=${encodeURIComponent(slug)}`;
  const url = new URL(window.location.href);
  url.search = "";
  url.searchParams.set(PROJECT_QUERY_PARAM, slug);
  return url.pathname + url.search;
}

function ProjectCard({ project, variant }) {
  const cover = useMemo(() => {
    const files = fileManager.getMappedFiles(project.cover_image) || [];
    return files.find(f => f && f.src) || null;
  }, [project.cover_image]);

  const href = project.custom_url
    ? String(project.custom_url).trim()
    : buildDetailHref(project.slug || project.name);

  const isExternal = /^https?:\/\//i.test(href);

  const onCardClick = (e) => {
    if (isExternal) return;
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

  const tags = Array.isArray(project.tags) ? project.tags.slice(0, 3) : [];
  const dateLabel = project.start_date
    ? new Date(project.start_date).toLocaleDateString(undefined, { month: "short", year: "numeric" })
    : null;

  return (
    <a
      href={href}
      onClick={onCardClick}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className="group bg-card text-card-foreground border rounded-xl overflow-hidden flex flex-col hover:shadow-lg transition-shadow"
    >
      <div className={`relative bg-secondary overflow-hidden ${
        variant === "compact" ? "aspect-[16/10]" : "aspect-[4/3]"
      }`}>
        {cover ? (
          <img
            src={cover.src}
            alt={cover.name || project.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs opacity-60">
            No cover
          </div>
        )}

        {project.featured ? (
          <span className="absolute top-2 left-2 text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-md bg-primary text-primary-foreground">
            Featured
          </span>
        ) : null}

        {isExternal ? (
          <span className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/70 backdrop-blur flex items-center justify-center">
            <ExternalLinkIcon className="w-3.5 h-3.5" />
          </span>
        ) : null}
      </div>

      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-medium leading-tight line-clamp-2">
            {project.title}
          </h3>
          {dateLabel ? (
            <span className="text-xs text-muted-foreground whitespace-nowrap mt-0.5">
              {dateLabel}
            </span>
          ) : null}
        </div>

        {project.summary ? (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
            {project.summary}
          </p>
        ) : null}

        {(tags.length > 0 || project.client) ? (
          <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
            {project.client ? (
              <span className="text-xs px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground">
                {project.client}
              </span>
            ) : null}
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

export default function ProjectsGallery({ data = {} }) {
  const [activeSlug, setActiveSlug] = useState(() => readProjectSlugFromUrl());
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sync = () => startTransition(() => setActiveSlug(readProjectSlugFromUrl()));
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  if (activeSlug) {
    return (
      <ProjectDetail
        slug={activeSlug}
        app={data?.app}
        backHref={typeof window !== "undefined" ? window.location.pathname : "."}
      />
    );
  }

  return <ProjectsList data={data} />;
}

function ProjectsList({ data = {} }) {
  const {
    app: appOverride,
    page_size = 9,
    columns = 3,
    featured_only,
    tag,
    title,
    subtitle,
    card_variant = "default",
    empty_message = "No projects to show yet.",
  } = data;

  const pageSize = Math.max(1, Math.min(48, parseInt(page_size, 10) || 9));
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
      if (tag) query.tag = String(tag).trim();

      const res = await loopar.api.get("Project", "publicList", { query, freeze: false });
      setItems(Array.isArray(res?.items) ? res.items : []);
      setTotalPages(Math.max(1, parseInt(res?.total_pages, 10) || 1));
    } catch (e) {
      console.error("ProjectsGallery load error:", e);
      setError(e?.message || "Could not load projects.");
      if (firstLoadRef.current) setItems([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
      setRefetching(false);
      firstLoadRef.current = false;
    }
  }, [appOverride, page, pageSize, featured_only, tag]);

  useEffect(() => { load(); }, [load]);

  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  }[cols];

  return (
    <section className="w-full py-12 px-4">
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
          <></>
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
              {items.map(p => (
                <ProjectCard key={p.name} project={p} variant={card_variant} />
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </div>
    </section>
  );
}

ProjectsGallery.metaFields = () => {
  return [
    {
      group: "custom",
      elements: {
        app: {
          element: INPUT,
          data: {
            label: "App",
            placeholder: "Leave empty to use current app",
            description: "Optional. Restrict listing to projects of a specific app.",
          },
        },
        title:        { element: TEXTAREA, data: { label: "Title" } },
        subtitle:     { element: TEXTAREA, data: { label: "Subtitle" } },
        page_size:    { element: INPUT, data: { label: "Items per page", format: "int" } },
        columns:      { element: INPUT, data: { label: "Columns (1–4)", format: "int" } },
        featured_only: { element: SWITCH, data: { label: "Featured only" } },
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
        empty_message: {
          element: TEXTAREA,
          data: { label: "Empty state message" },
        },
      },
    },
  ];
};
