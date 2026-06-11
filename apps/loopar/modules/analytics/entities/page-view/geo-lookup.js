const FIELDS = "status,countryCode,regionName,city,timezone,isp,query";
const BASE_URL = `http://ip-api.com/json`;

const cache = new Map();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

function isPrivateIp(ip) {
  if (!ip || ip === "::1" || ip === "localhost") return true;

  const cleaned = ip.replace(/^::ffff:/, "");

  if (cleaned.startsWith("127.")) return true;
  if (cleaned.startsWith("10.")) return true;
  if (cleaned.startsWith("192.168.")) return true;
  if (cleaned.startsWith("169.254.")) return true;

  if (cleaned.startsWith("172.")) {
    const second = parseInt(cleaned.split(".")[1], 10);
    if (second >= 16 && second <= 31) return true;
  }

  return false;
}

/**
 * Async geo lookup using ip-api.com.
 * Returns empty strings on failure — never throws.
 *
 * @param {string} ip
 * @returns {Promise<{ country: string, city: string, region: string, timezone: string, isp: string }>}
 */
export async function geoLookup(ip) {
  const empty = { country: "", city: "", region: "", timezone: "", isp: "" };

  if (isPrivateIp(ip)) return empty;

  const cached = cache.get(ip);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data;
  }

  try {
    const res = await fetch(`${BASE_URL}/${ip}?fields=${FIELDS}`, {
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) return empty;

    const json = await res.json();
    if (json.status !== "success") return empty;

    const data = {
      country: json.countryCode || "",
      city: json.city || "",
      region: json.regionName || "",
      timezone: json.timezone || "",
      isp: json.isp || "",
    };

    cache.set(ip, { data, ts: Date.now() });

    if (cache.size > 5000) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }

    return data;
  } catch {
    return empty;
  }
}
