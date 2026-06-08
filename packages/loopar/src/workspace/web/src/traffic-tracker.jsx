import { useEffect, useRef } from "react";

/**
 * Client-driven traffic tracking for the public web workspace.
 *
 * Replaces the old server-side trackVisit() that ran on every route in the
 * router. A page view is only recorded once the browser renders the page, and
 * we measure *engaged* time (visible + recent interaction) rather than raw
 * dwell time — so a bot without JS or an instant "click every menu item" self
 * test accumulates ~0ms and won't count as a real visit.
 *
 * Flow per page:
 *   1. POST /api/Page View/track  → creates the row (server adds geo/UA/ip).
 *   2. heartbeat accumulates active time while the tab is visible and the user
 *      has interacted within IDLE_MS.
 *   3. POST/sendBeacon /api/Page View/ping → updates the cumulative active_ms;
 *      the exit ping (on hide / pagehide / unmount) is the most reliable one.
 */

const HEARTBEAT_MS = 15000; // how often we tick + maybe ping
const IDLE_MS = 30000; // no interaction for this long → considered idle
const ENDPOINT = (action) => `/api/${encodeURIComponent("Page View")}/${action}`;

function uuid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function sendPing(viewId, activeMs, { beacon = false } = {}) {
  const payload = JSON.stringify({ viewId, activeMs: Math.round(activeMs) });
  if (beacon && typeof navigator !== "undefined" && navigator.sendBeacon) {
    navigator.sendBeacon(ENDPOINT("ping"), new Blob([payload], { type: "application/json" }));
    return;
  }
  fetch(ENDPOINT("ping"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => {});
}

export function TrafficTracker({ page }) {
  const ref = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined" || !page) return;

    const s = {
      viewId: uuid(),
      activeMs: 0,
      sentMs: 0,
      lastTick: Date.now(),
      lastActivity: Date.now(),
    };
    ref.current = s;

    fetch(ENDPOINT("track"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        viewId: s.viewId,
        document: page,
        referrer: document.referrer || "",
        language: navigator.language || "",
      }),
    }).catch(() => {});

    const isActive = () =>
      document.visibilityState === "visible" &&
      Date.now() - s.lastActivity < IDLE_MS;

    const accumulate = () => {
      const now = Date.now();
      if (isActive()) s.activeMs += now - s.lastTick;
      s.lastTick = now;
    };

    const flush = ({ beacon = false } = {}) => {
      accumulate();
      if (s.activeMs <= s.sentMs) return;
      s.sentMs = s.activeMs;
      sendPing(s.viewId, s.activeMs, { beacon });
    };

    const onActivity = () => { s.lastActivity = Date.now(); };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        flush({ beacon: true });
      } else {
        s.lastTick = Date.now();
        s.lastActivity = Date.now();
      }
    };
    const onPageHide = () => flush({ beacon: true });

    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"];
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);

    const hb = setInterval(() => flush(), HEARTBEAT_MS);

    return () => {
      clearInterval(hb);
      flush({ beacon: true });
      events.forEach((e) => window.removeEventListener(e, onActivity));
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [page]);

  return null;
}

export default TrafficTracker;
