import { useState, useEffect, useCallback } from "react";
import { loopar } from "loopar";
import {
  ArrowLeftIcon,
  ExternalLinkIcon,
  Loader2,
  CheckCircle2Icon,
  XCircleIcon,
  ClockIcon,
} from "lucide-react";
import ImageCarousel from "@image-carousel";
import Icon from "@icon";
import { Preview as MarkdownPreview } from "@markdown";
import { formatPrice } from "./service-pricing";


function DetailLoading() {
  return (
    <article
      className="w-full min-h-section-min flex items-center justify-center"
      aria-busy="true"
      aria-live="polite"
    >
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground opacity-70" />
    </article>
  );
}

function CtaButton({ label, href, variant = "primary" }) {
  if (!href || !label) return null;
  const isExternal = /^https?:\/\//i.test(href);
  const base = "inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors";
  const styles = variant === "primary"
    ? "bg-primary text-primary-foreground hover:opacity-90"
    : "bg-secondary text-secondary-foreground hover:bg-primary/10";
  return (
    <a
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className={`${base} ${styles}`}
    >
      {label}
      {isExternal ? <ExternalLinkIcon className="w-3.5 h-3.5 opacity-70" /> : null}
    </a>
  );
}

export default function ServiceDetail({
  slug,
  app,
  backHref = ".",
  backLabel = "All services",
  showBack = true,
  notFoundMessage = "Service not found, or it is no longer published.",
}) {
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!slug) {
      setService(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const query = { slug };
      if (app) query.app = String(app).trim();
      const res = await loopar.api.get("Service", "publicView", { query, freeze: false });
      setService(res && res.name ? res : null);
    } catch (e) {
      console.error("ServiceDetail load error:", e);
      setError(e?.message || "Could not load service.");
      setService(null);
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

  if (loading) return <DetailLoading />;

  if (error) {
    return (
      <article className="w-full min-h-section-min">
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      </article>
    );
  }

  if (!service) {
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

  const priceLabel = formatPrice(service);
  const hasGallery = service.images && (Array.isArray(service.images)
    ? service.images.length > 0
    : true);

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

        {/* Hero */}
        <header className="flex flex-col gap-5">
          <div className="flex items-start gap-4">
            {service.icon ? (
              <div className="shrink-0 w-14 h-14 rounded-xl bg-secondary text-primary flex items-center justify-center">
                <Icon data={{ icon: service.icon }} className="w-7 h-7" />
              </div>
            ) : null}

            <div className="flex flex-col gap-2 flex-1">
              {service.category ? (
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  {service.category}
                </span>
              ) : null}
              <h1 className="text-3xl md:text-4xl font-medium leading-tight">
                {service.title}
              </h1>
              {service.tagline ? (
                <p className="text-base text-muted-foreground leading-relaxed">
                  {service.tagline}
                </p>
              ) : null}
            </div>
          </div>

          {service.summary ? (
            <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
              {service.summary}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-4 pt-2">
            {priceLabel ? (
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Price</span>
                <span className="text-xl font-medium">{priceLabel}</span>
              </div>
            ) : null}
            {service.duration_estimate ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ClockIcon className="w-4 h-4 opacity-70" />
                <span>{service.duration_estimate}</span>
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2 ml-auto">
              <CtaButton label={service.cta_label} href={service.cta_url} variant="primary" />
              <CtaButton label={service.cta_secondary_label} href={service.cta_secondary_url} variant="secondary" />
            </div>
          </div>
        </header>

        {hasGallery ? (
          <section>
            <ImageCarousel
              images={service.images}
              aspect="aspect-[16/9]"
              showThumbs={true}
              showCounter={true}
              autoplay={false}
            />
          </section>
        ) : null}

        {service.description ? (
          <section className="prose-container">
            <MarkdownPreview source={service.description} />
          </section>
        ) : null}

        {(service.deliverables || service.not_included) ? (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {service.deliverables ? (
              <div className="flex flex-col gap-3">
                <h3 className="text-base font-medium flex items-center gap-2">
                  <CheckCircle2Icon className="w-5 h-5 text-primary" />
                  What's included
                </h3>
                <div className="prose-container text-sm">
                  <MarkdownPreview source={service.deliverables} />
                </div>
              </div>
            ) : null}
            {service.not_included ? (
              <div className="flex flex-col gap-3">
                <h3 className="text-base font-medium flex items-center gap-2 text-muted-foreground">
                  <XCircleIcon className="w-5 h-5 opacity-70" />
                  Not included
                </h3>
                <div className="prose-container text-sm text-muted-foreground">
                  <MarkdownPreview source={service.not_included} />
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        {(service.cta_url || service.cta_secondary_url) ? (
          <section className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t">
            <CtaButton label={service.cta_label} href={service.cta_url} variant="primary" />
            <CtaButton label={service.cta_secondary_label} href={service.cta_secondary_url} variant="secondary" />
          </section>
        ) : null}

      </div>
    </article>
  );
}
