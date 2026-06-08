
'use strict';

import { BaseController, loopar } from 'loopar';
import { createHash } from 'node:crypto';
import { UAParser } from 'ua-parser-js';
import { geoLookup } from './geo-lookup.js';

const ENGAGED_THRESHOLD_MS = 10000;

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
    const ipHash = createHash("sha256")
      .update(ip + (process.env.TRACKING_SALT || "loopar"))
      .digest("hex")
      .slice(0, 16);

    const { country, city, region, timezone, isp } = await geoLookup(ip);
    const ua = new UAParser(req.headers?.["user-agent"] || "").getResult();

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
        user_agent: req.headers?.["user-agent"] || "",
        referrer: body.referrer || req.headers?.["referer"] || "",
        language: (body.language || req.headers?.["accept-language"] || "").split(",")[0],
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

    if (!viewId) {
      return this.error("Missing viewId", { notify: false }, 400);
    }

    try {
      await loopar.db.updateRow("Page View", viewId, { active_ms: activeMs });
    } catch (error) {
      console.warn(["Can not update Page View ping", error]);
      return this.error("Ping failed", { notify: false }, 500);
    }

    return this.success("ok", { notify: false });
  }
}

export { ENGAGED_THRESHOLD_MS };
