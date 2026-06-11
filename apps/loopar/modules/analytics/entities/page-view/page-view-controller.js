
'use strict';

import { BaseController, loopar } from 'loopar';
import { createHash, randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { UAParser } from 'ua-parser-js';
import { isbot } from 'isbot';
import { geoLookup } from './geo-lookup.js';

const ENGAGED_THRESHOLD_MS = 10000;

let cachedSalt = null;
function trackingSalt() {
  if (cachedSalt) return cachedSalt;
  if (process.env.TRACKING_SALT) return (cachedSalt = process.env.TRACKING_SALT);
  try {
    // Lives in sites/ — runtime state dir, already gitignored.
    const dir = path.join(loopar.pathRoot, 'sites');
    const file = path.join(dir, '.tracking-salt');
    if (fs.existsSync(file)) cachedSalt = fs.readFileSync(file, 'utf8').trim();
    if (!cachedSalt) {
      cachedSalt = randomBytes(32).toString('hex');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(file, cachedSalt, { mode: 0o600 });
    }
  } catch (error) {
    console.warn(['Can not persist tracking salt, using ephemeral one', error]);
    cachedSalt = randomBytes(32).toString('hex');
  }
  return cachedSalt;
}

const RATE_LIMITS = {
  track: { max: 30, windowMs: 60000 },
  ping: { max: 120, windowMs: 60000 },
};
const rateBuckets = new Map();

function rateLimited(key, { max, windowMs }) {
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || now - bucket.start >= windowMs) {
    rateBuckets.set(key, { start: now, count: 1 });
    return false;
  }
  return ++bucket.count > max;
}

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of rateBuckets) {
    if (now - bucket.start >= 120000) rateBuckets.delete(key);
  }
}, 300000).unref();

const BOT_UA_RE = /headless|lighthouse|phantomjs|electron/i;
const isBotUA = (ua) => !ua || isbot(ua) || BOT_UA_RE.test(ua);

export default class PageViewController extends BaseController {
  constructor(props) {
    super(props);
  }

  #clientIp() {
    const req = this.req || {};
    return (req.headers?.["x-forwarded-for"] || "").split(",")[0].trim() || req.ip || "";
  }

  async publicActionTrack() {
    const body = this.data || {};
    const viewId = String(body.viewId || "").slice(0, 64);
    const document = String(body.document || "").slice(0, 255);

    if (!viewId || !document) {
      return this.error("Missing viewId or document", { notify: false }, 400);
    }

    const req = this.req || {};
    const ip = this.#clientIp();

    if (rateLimited(`t:${ip}`, RATE_LIMITS.track)) {
      return this.error("Too many requests", { notify: false }, 429);
    }

    const ipHash = createHash("sha256")
      .update(ip + trackingSalt())
      .digest("hex")
      .slice(0, 16);

    const userAgent = req.headers?.["user-agent"] || "";
    if (isBotUA(userAgent)) {
      return this.success("ok", { notify: false });
    }

    const utm = (v) => String(v || "").slice(0, 100);
    const { country, city, region, timezone, isp } = await geoLookup(ip);
    const ua = new UAParser(userAgent).getResult();

    try {
      await loopar.db.insertRow("Page View", {
        name: viewId,
        document,
        workspace: "web",
        ip_hash: ipHash,
        country,
        city,
        region,
        timezone,
        isp,
        browser: ua.browser.name || "",
        os: ua.os.name || "",
        device_type: ua.device.type || "desktop",
        user_agent: userAgent.slice(0, 255),
        referrer: String(body.referrer || req.headers?.["referer"] || "").slice(0, 255),
        language: (body.language || req.headers?.["accept-language"] || "").split(",")[0].slice(0, 32),
        session_id: String(body.sessionId || "").slice(0, 64),
        viewport: String(body.viewport || "").slice(0, 16),
        utm_source: utm(body.utmSource),
        utm_medium: utm(body.utmMedium),
        utm_campaign: utm(body.utmCampaign),
        is_internal: loopar.currentUser?.name ? 1 : 0,
        scroll_depth: 0,
        active_ms: 0,
        visit_date: new Date().toISOString().split("T")[0],
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.warn(["Can not record Page View", error]);
      return this.error("Tracking failed", { notify: false }, 500);
    }

    return this.success("ok", { notify: false });
  }

  async publicActionPing() {
    const body = this.data || {};
    const viewId = String(body.viewId || "").slice(0, 64);
    const activeMs = Math.max(0, Math.min(Number(body.activeMs) || 0, 86400000));
    const scrollDepth = Math.max(0, Math.min(100, Math.round(Number(body.scrollDepth) || 0)));

    if (!viewId) {
      return this.error("Missing viewId", { notify: false }, 400);
    }

    if (rateLimited(`p:${this.#clientIp()}`, RATE_LIMITS.ping)) {
      return this.error("Too many requests", { notify: false }, 429);
    }

    try {
      await loopar.db.updateRow("Page View", viewId, { active_ms: activeMs, scroll_depth: scrollDepth });
    } catch (error) {
      console.warn(["Can not update Page View ping", error]);
      return this.error("Ping failed", { notify: false }, 500);
    }

    return this.success("ok", { notify: false });
  }
}

export { ENGAGED_THRESHOLD_MS };
