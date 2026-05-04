'use strict';

import fs from "fs";
import path from "pathe";
import os from "os";
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * CaddyManager — reverse proxy manager.
 *
 * Port strategy:
 *   1. Try :80 first (works in production, fails on dev if port is taken)
 *   2. Fallback to first available port from 12000
 *   3. If not on :80, set up OS-level redirect :80 → actual port
 *      so domains always work without specifying a port in the URL.
 *
 * Config write strategy:
 *   All writes go through _writeFullConfig() — a single atomic POST /config/.
 *   Partial Caddy API endpoints (POST /routes, DELETE /routes/N, etc.)
 *   trigger a hot-reload that can resurrect ghost servers with :80/:443
 *   from previous Homebrew/system starts → EADDRINUSE.
 */
export default class CaddyManager {
  constructor() {
    this.adminUrl = 'http://localhost:2019';
    this.httpPort = 80;
  }

  async ensureReady() {
    if (!await this.ensureInstalled()) {
      const installed = await this.install();
      if (!installed) throw new Error("Could not install Caddy.");
    }

    let existingRoutes = [];

    if (await this.isRunning()) {
      existingRoutes = await this._readCurrentRoutes();
      await this._stopCaddy();
    }

    this.httpPort = await this.findAvailablePort();
    const started = await this._startCaddy(this.httpPort, existingRoutes);
    if (!started) throw new Error("Failed to start Caddy.");

    // If couldn't get :80, set up OS redirect so domains work without port
    if (this.httpPort !== 80) {
      await this._ensurePort80Redirect(this.httpPort);
    }

    return true;
  }

  async isRunning() {
    try {
      const res = await fetch(`${this.adminUrl}/config/`, {
        signal: AbortSignal.timeout(3000)
      });
      return res.ok;
    } catch (_) {
      return false;
    }
  }

  async ensureInstalled() {
    try { await execAsync('caddy version'); return true; }
    catch (_) { return false; }
  }

  async install() {
    try {
      const platform = os.platform();
      if (platform === 'darwin') {
        await execAsync('brew install caddy');
        // brew may have started Caddy as a service — stop it so Loopar can manage
        try { await execAsync('brew services stop caddy'); } catch (_) {}
      } else if (platform === 'linux') {
        await execAsync('sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl');
        await execAsync('curl -1sLf "https://dl.cloudsmith.io/public/caddy/stable/gpg.key" | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg');
        await execAsync('curl -1sLf "https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt" | sudo tee /etc/apt/sources.list.d/caddy-stable.list');
        await execAsync('sudo apt update && sudo apt install -y caddy');
        // apt enables and starts caddy.service by default with the stock Caddyfile.
        // That competes with Loopar's CaddyManager (different config, no admin
        // API). Disable it so only the Loopar-managed Caddy runs.
        try { await execAsync('sudo systemctl stop caddy');    } catch (_) {}
        try { await execAsync('sudo systemctl disable caddy'); } catch (_) {}
      } else {
        throw new Error(`Unsupported platform: ${platform}`);
      }
      console.log("✅ Caddy installed (and detached from system service manager so Loopar can manage it)");
      return true;
    } catch (e) {
      console.error("Failed to install Caddy:", e);
      return false;
    }
  }

  async registerTenant(domain, tenantPort) {
    try {
      const routes  = await this._readCurrentRoutes();
      const updated = routes.filter(r =>
        !r.match?.some(m => m.host?.includes(domain)) &&
        r['@id'] !== `tenant_${domain}`
      );

      updated.push({
        "@id": `tenant_${domain}`,
        match: [{ host: [domain] }],
        handle: [{
          handler: "reverse_proxy",
          upstreams: [{ dial: `localhost:${tenantPort}` }],
          // Inform the upstream app of the real scheme/host so it builds URLs
          // correctly. Use Caddy placeholders so HTTP and HTTPS both report
          // accurately — hardcoding "http"/"80" breaks HTTPS because the
          // upstream thinks the connection is plain HTTP and can issue
          // self-redirects to HTTPS that the browser is already on.
          headers: {
            request: {
              set: {
                "X-Forwarded-Proto": ["{http.request.scheme}"],
                "X-Forwarded-Host":  [domain],
                "X-Forwarded-Port":  ["{http.request.port}"],
                "X-Real-IP":         ["{http.request.remote.host}"]
              }
            }
          }
        }]
      });

      const ok = await this._writeFullConfig(updated);
      if (ok) console.log(`✅ ${domain} → localhost:${tenantPort}`);
      return ok;
    } catch (e) {
      console.error("Failed to register tenant:", e);
      return false;
    }
  }

  async removeTenant(domain) {
    try {
      const routes  = await this._readCurrentRoutes();
      const updated = routes.filter(r =>
        !r.match?.some(m => m.host?.includes(domain)) &&
        !r['@id']?.includes(domain)
      );

      if (updated.length === routes.length) return true; // wasn't registered

      const ok = await this._writeFullConfig(updated);
      if (ok) console.log(`✅ Tenant ${domain} removed`);
      return ok;
    } catch (e) {
      console.error(`Failed to remove tenant ${domain}:`, e.message);
      return false;
    }
  }

  /**
   * Port selection strategy:
   *   - Try :80 first  → works in production, clean setup
   *   - Try :443 skip  → Caddy handles SSL internally, no need to bind manually
   *   - Fallback 12000+→ dev environments where :80 is taken
   */
  async findAvailablePort() {
    const net = await import('net');

    const isPortFree = (port) => new Promise((resolve) => {
      const server = net.default.createServer();
      server.once('error', () => resolve(false));
      server.once('listening', () => { server.close(); resolve(true); });
      server.listen(port, '0.0.0.0');
    });

    // Production: try :80 first
    if (await isPortFree(80)) {
      console.log("✅ Port 80 available — production mode");
      return 80;
    }

    console.log("⚠️  Port 80 in use — falling back to dev port (12000+)");

    // Dev fallback: find first free port from 12000
    for (let port = 12000; port < 12100; port++) {
      if (await isPortFree(port)) return port;
    }

    throw new Error("No available port found (tried :80 and 12000–12099)");
  }

  /**
   * When Caddy can't bind :80 (dev environment), set up an OS-level
   * redirect :80 → actualPort so domains work without specifying a port.
   *
   * macOS: uses pfctl (built-in, requires sudo)
   * Linux: uses iptables (requires sudo)
   *
   * To avoid sudo prompts, add a sudoers rule once:
   *   macOS: echo "$(whoami) ALL=(ALL) NOPASSWD: /sbin/pfctl" | sudo tee /etc/sudoers.d/loopar-pfctl
   *   Linux: echo "$(whoami) ALL=(ALL) NOPASSWD: /sbin/iptables" | sudo tee /etc/sudoers.d/loopar-iptables
   */
  async _ensurePort80Redirect(targetPort) {
    const platform = os.platform();

    try {
      if (platform === 'darwin') {
        await this._ensurePfctlRedirect(targetPort);
      } else if (platform === 'linux') {
        await this._ensureIptablesRedirect(targetPort);
      }
    } catch (e) {
      // Non-fatal: domains will still work with the port appended
      console.warn(`⚠️  Could not set :80 redirect: ${e.message}`);
      console.warn(`   Domains accessible at: http://yourdomain:${targetPort}`);
      console.warn(`   To fix, run once:`);
      if (platform === 'darwin') {
        console.warn(`   echo "$(whoami) ALL=(ALL) NOPASSWD: /sbin/pfctl" | sudo tee /etc/sudoers.d/loopar-pfctl`);
      } else {
        console.warn(`   echo "$(whoami) ALL=(ALL) NOPASSWD: /sbin/iptables" | sudo tee /etc/sudoers.d/loopar-iptables`);
      }
    }
  }

  async _ensurePfctlRedirect(targetPort) {
    try {
      const { stdout } = await execAsync('sudo pfctl -s nat 2>/dev/null');
      if (stdout.includes(`-> 127.0.0.1 port ${targetPort}`)) {
        console.log(`✅ :80 → :${targetPort} redirect already active (pfctl)`);
        return;
      }
    } catch (_) {}

    const ruleFile = path.join(os.tmpdir(), 'loopar-pf.conf');
    fs.writeFileSync(ruleFile,
      `rdr pass on lo0 inet proto tcp from any to 127.0.0.1 port 80 -> 127.0.0.1 port ${targetPort}\n`
    );

    await execAsync(`sudo pfctl -ef ${ruleFile}`);
    console.log(`✅ :80 → :${targetPort} redirect active (pfctl) — domains work without port`);
  }

  async _ensureIptablesRedirect(targetPort) {
    try {
      const { stdout } = await execAsync('sudo iptables -t nat -L OUTPUT --line-numbers -n 2>/dev/null');
      if (stdout.includes(`redir ports ${targetPort}`)) {
        console.log(`✅ :80 → :${targetPort} redirect already active (iptables)`);
        return;
      }
    } catch (_) {}

    await execAsync(`sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port ${targetPort}`);
    await execAsync(`sudo iptables -t nat -A OUTPUT -p tcp -d 127.0.0.1 --dport 80 -j REDIRECT --to-port ${targetPort}`);
    console.log(`✅ :80 → :${targetPort} redirect active (iptables) — domains work without port`);
  }

  async _stopCaddy() {
    // Try every shutdown path because we don't know how this Caddy was started:
    //   1. caddy stop — our own admin-API-driven instance
    //   2. systemctl stop — apt-installed systemd service (Linux)
    //   3. brew services stop — Homebrew-managed (macOS)
    // All three may legitimately be no-ops; swallow errors.
    try { await execAsync('caddy stop'); } catch (_) {}
    try { await execAsync('sudo systemctl stop caddy'); } catch (_) {}
    try { await execAsync('brew services stop caddy'); } catch (_) {}
    await new Promise(r => setTimeout(r, 1000));
  }

  async _startCaddy(port, initialRoutes = []) {
    const configPath = this._getConfigPath();
    this._writeConfigFile(configPath, port, initialRoutes);

    exec(`caddy start --config ${configPath}`, (error) => {
      if (error && !error.message.includes('already running')) {
        console.error("Caddy start error:", error.message);
      }
    }).unref();

    for (let i = 0; i < 10; i++) {
      await new Promise(r => setTimeout(r, 500));
      if (await this.isRunning()) {
        this.httpPort = port;
        console.log(`✅ Caddy running on :${port}`);
        return true;
      }
    }

    console.error("❌ Caddy failed to start");
    return false;
  }

  async _readCurrentRoutes() {
    try {
      const res = await fetch(`${this.adminUrl}/config/apps/http/servers/srv0/routes`);
      if (!res.ok) return [];
      const parsed = await res.json();
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  async _writeFullConfig(routes) {
    const res = await fetch(`${this.adminUrl}/config/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this._buildConfig(this.httpPort, routes))
    });

    if (!res.ok) {
      console.error(`❌ Caddy config write failed [${res.status}]:`, await res.text());
      return false;
    }
    return true;
  }

  _writeConfigFile(filePath, port, routes = []) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(this._buildConfig(port, routes), null, 2));
  }

  /**
   * Single source of truth for the Caddy config object.
   *
   * Two modes, picked from the chosen httpPort:
   *
   *   port === 80 → PRODUCTION
   *     Caddy listens on both :80 and :443. automatic_https is left at its
   *     defaults, which means:
   *       - Real domains (alphabit.technology, etc.) get Let's Encrypt certs
   *         on first request. Storage at ~/.local/share/caddy/, persists
   *         across reboots.
   *       - .localhost / .home / .lan get self-signed certs from Caddy's
   *         internal CA (browser will warn — fine for dev-on-prod hybrid).
   *       - HTTP requests are redirected to HTTPS automatically.
   *
   *   port !== 80 → DEV FALLBACK
   *     Caddy is on a high port (12xxx) because :80 was taken. We disable
   *     automatic_https entirely so it doesn't try to bind :443 (which we
   *     also probably can't), doesn't append :12000 to redirect URLs, and
   *     doesn't attempt cert provisioning for domains that may not even
   *     resolve to this machine.
   *
   * Optional: set CADDY_ACME_EMAIL to receive Let's Encrypt renewal/expiry
   * notifications. Without it, Caddy still works but ACME registration is
   * anonymous.
   */
  _buildConfig(port, routes) {
    const isProduction = port === 80;

    const srv0 = {
      listen: isProduction ? [":80", ":443"] : [`:${port}`],
      routes
    };

    if (!isProduction) {
      srv0.automatic_https = { disable: true };
    }

    const config = {
      admin: { listen: "localhost:2019" },
      apps: {
        http: {
          servers: { srv0 }
        }
      }
    };

    if (isProduction && process.env.CADDY_ACME_EMAIL) {
      config.apps.tls = {
        automation: {
          policies: [{
            issuers: [{ module: "acme", email: process.env.CADDY_ACME_EMAIL }]
          }]
        }
      };
    }

    return config;
  }

  _getConfigPath() {
    const candidates = [
      '/etc/caddy/config.json',
      '/usr/local/etc/caddy/config.json',
      '/opt/homebrew/etc/caddy/config.json',
      path.join(process.cwd(), 'caddy-config.json')
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) return p;
    }
    const dir = os.platform() === 'darwin' ? '/opt/homebrew/etc/caddy' : '/etc/caddy';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return path.join(dir, 'config.json');
  }
}