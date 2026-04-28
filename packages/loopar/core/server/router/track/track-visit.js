import { createHash } from "node:crypto";
import { geoLookup } from "./geo-lookup.js";
import { UAParser } from "ua-parser-js";
import { loopar } from 'loopar';

export async function trackVisit(req, params) {
  if (req.__WORKSPACE_NAME__ !== "web") return;
  if (params.action && params.action !== "view") return;

  const ip = (req.headers["x-forwarded-for"] || "")
    .split(",")[0].trim() || req.ip || "";

  const ipHash = createHash("sha256")
    .update(ip + (process.env.TRACKING_SALT || "loopar"))
    .digest("hex")
    .slice(0, 16);

  // Geo — async, fire to ip-api.com, cached in memory
  const { country, city, region, timezone, isp } = await geoLookup(ip);

  // Device
  const ua = new UAParser(req.headers["user-agent"] || "").getResult();

  try {
    await loopar.db.insertRow("Page View", {
      name: crypto.randomUUID(),
      document: params.document,
      workspace: req.__WORKSPACE_NAME__,
      ip_hash: ipHash,
      country,
      city,
      region,
      timezone,
      isp,
      browser: ua.browser.name || "",
      os: ua.os.name || "",
      device_type: ua.device.type || "desktop",
      user_agent: req.headers["user-agent"] || "",
      referrer: req.headers["referer"] || "",
      language: (req.headers["accept-language"] || "").split(",")[0],
      visit_date: new Date().toISOString().split("T")[0],
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.warn(["Can not updated Analytics", error])
  }
}