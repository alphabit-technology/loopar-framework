import { useState, useEffect, useCallback } from "react";
import { loopar } from "loopar";
import { ArrowLeftIcon, ExternalLinkIcon, CalendarIcon, UserIcon, Loader2 } from "lucide-react";
import ImageCarousel from "@image-carousel";
import { Preview as MarkdownPreview } from "@markdown";

function formatDateRange(start, end) {
  const fmt = (d) =>
    new Date(d).toLocaleDateString(undefined, { month: "short", year: "numeric" });
  if (start && end) return `${fmt(start)} — ${fmt(end)}`;
  if (start) return fmt(start);
  if (end) return fmt(end);
  return null;
}

function MetaRow({ icon: Icon, label, value, href }) {
  if (!value) return null;
  const content = (
    <>
      {Icon ? <Icon className="w-4 h-4 opacity-70" /> : null}
      <span className="text-sm">{value}</span>
      {href ? <ExternalLinkIcon className="w-3.5 h-3.5 opacity-60" /> : null}
    </>
  );
  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        aria-label={label}
      >
        {content}
      </a>
    );
  }
  return (
    <div className="flex items-center gap-2 text-muted-foreground" aria-label={label}>
      {content}
    </div>
  );
}

export default function ProjectDetail({
  slug,
  app,
  backHref = ".",
  backLabel = "All projects",
  showBack = true,
  notFoundMessage = "Project not found, or it is no longer published.",
}) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!slug) {
      setProject(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const query = { slug };
      if (app) query.app = String(app).trim();
      const res = await loopar.api.get("Project", "publicView", { query, freeze: false });
      setProject(res && res.name ? res : null);
    } catch (e) {
      console.error("ProjectDetail load error:", e);
      setError(e?.message || "Could not load project.");
      setProject(null);
    } finally {
      setLoading(false);
    }
  }, [slug, app]);

  useEffect(() => { load(); }, [load]);

  const handleBack = (e) => {
    if (typeof window !== "undefined" && backHref && !/^https?:\/\//i.test(backHref)) {
      e.preventDefault();
      window.history.pushState({}, "", backHref === "." ? window.location.pathname : backHref);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  if (loading) return <></>;

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (!project) {
    return (
      <article className="w-full min-h-section-min">
        <div className="max-w-3xl mx-auto px-4 py-16 text-center flex flex-col gap-4 items-center">
          <p className="text-sm text-muted-foreground">{notFoundMessage}</p>
          {showBack ? (
            <a
              href={backHref}
              onClick={handleBack}
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              {backLabel}
            </a>
          ) : null}
        </div>
      </article>
    );
  }

  const tags = Array.isArray(project.tags) ? project.tags : [];
  const dateLabel = formatDateRange(project.start_date, project.end_date);

  return (
    <article className="w-full min-h-section-min animate-fade-in-up">
      <div className="max-w-5xl mx-auto px-4 py-12 flex flex-col gap-10">

        {showBack ? (
          <a
            href={backHref}
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            {backLabel}
          </a>
        ) : null}

        <header className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-8 items-start">
          <div>
            <ImageCarousel
              images={project.images?.length ? project.images : project.cover_image}
              aspect="aspect-[16/10]"
              showThumbs={true}
              showCounter={true}
              autoplay={false}
            />
          </div>

          <div className="flex flex-col gap-4">
            {project.featured ? (
              <span className="text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-md bg-primary text-primary-foreground w-fit">
                Featured
              </span>
            ) : null}

            <h1 className="text-3xl md:text-4xl font-medium leading-tight">
              {project.title}
            </h1>

            {project.summary ? (
              <p className="text-base text-muted-foreground leading-relaxed">
                {project.summary}
              </p>
            ) : null}

            <div className="flex flex-col gap-2 mt-2">
              <MetaRow icon={UserIcon} label="Client" value={project.client} />
              <MetaRow icon={CalendarIcon} label="Date" value={dateLabel} />
              <MetaRow
                icon={ExternalLinkIcon}
                label="External link"
                value={project.external_url}
                href={project.external_url}
              />
            </div>

            {tags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map(t => (
                  <span
                    key={t}
                    className="text-xs px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </header>

        {project.description ? (
          <section className="prose-container">
            <MarkdownPreview source={project.description} />
          </section>
        ) : null}

      </div>
    </article>
  );
}
