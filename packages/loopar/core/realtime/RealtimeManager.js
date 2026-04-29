import { Server } from "socket.io";
import jwt from "jsonwebtoken";

function parseCookies(rawCookie = "") {
  const out = {};
  if (!rawCookie) return out;
  for (const part of rawCookie.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const name = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (!name) continue;
    try { out[name] = decodeURIComponent(value); }
    catch { out[name] = value; }
  }
  return out;
}

class _RealtimeManager {
  constructor() {
    this.io = null;
    this._namespaces = new Map();
    this._tenantId = null;
    this._getJwtSecret = null;
  }

  /**
   * @param {import("http").Server} httpServer
   * @param {object} options
   * @param {string} options.tenantId        Active tenant id (namespace must match).
   * @param {() => string} options.getJwtSecret  Resolver for the JWT signing secret.
   */
  attach(httpServer, options = {}) {
    if (this.io) return this;

    const { tenantId, getJwtSecret, ...ioOptions } = options;
    this._tenantId = tenantId || null;
    this._getJwtSecret = typeof getJwtSecret === "function" ? getJwtSecret : null;

    this.io = new Server(httpServer, {
      path: "/ws/socket.io",
      cors: {
        origin: process.env.SOCKET_CORS_ORIGIN || "*",
        credentials: true,
      },
      transports: ["websocket", "polling"],
      ...ioOptions,
    });

    const dynamicNs = this.io.of(/^\/[a-zA-Z0-9_-]+$/);

    dynamicNs.use((socket, next) => this._authMiddleware(socket, next));

    dynamicNs.on("connection", (socket) => {
      const siteName = socket.data.siteName;
      if (!this._namespaces.has(siteName)) {
        this._namespaces.set(siteName, socket.nsp);
      }
      this._onConnection(socket, siteName);
    });

    console.log("[Realtime] Socket.IO attached to HTTP server");
    return this;
  }

  namespace(siteName) {
    return this._namespaces.get(siteName);
  }

  emit(siteName, channel, event, payload) {
    const ns = this.namespace(siteName);

    if (!ns) {
      console.warn(`[Realtime] namespace ${siteName} not found`);
      return;
    }
    ns.to(channel).emit(event, payload);
  }

  broadcast(siteName, event, payload) {
    if (!this.io) return;
    const ns = this.namespace(siteName);
    ns.emit(event, payload);
  }

  _authMiddleware(socket, next) {
    const siteName = socket.nsp.name.slice(1);

    if (this._tenantId && siteName !== this._tenantId) {
      return next(new Error("invalid namespace"));
    }

    socket.data.siteName = siteName;
    socket.data.userId = null;
    socket.data.user = null;

    const cookies = parseCookies(socket.handshake.headers?.cookie);
    const token = cookies[`loopar_token_${siteName}`];
    const secret = this._getJwtSecret?.();

    if (token && secret) {
      try {
        const userData = jwt.verify(token, secret);
        if (userData && (!userData.tenant || userData.tenant === siteName)) {
          socket.data.userId = userData.name || null;
          socket.data.user = userData;
        }
      } catch {
        // Invalid/expired token — connect as guest (userId stays null).
      }
    }

    next();
  }

  _onConnection(socket, siteName) {
    const userId = socket.data.userId;
    console.log(`[Realtime] connected  site=${siteName}  socket=${socket.id}  user=${userId ?? "guest"}`);

    if (userId) {
      socket.join(`user:${userId}`);
    }

    socket.on("join", (channels) => {
      const list = Array.isArray(channels) ? channels : [channels];
      list.forEach((ch) => {
        if (this._isAllowedChannel(ch, socket)) {
          socket.join(ch);
          console.log(`[Realtime] join  socket=${socket.id}  channel=${ch}`);
        } else {
          console.warn(`[Realtime] join denied  socket=${socket.id}  channel=${ch}  user=${socket.data.userId ?? "guest"}`);
        }
      });
    });

    socket.on("leave", (channels) => {
      const list = Array.isArray(channels) ? channels : [channels];
      list.forEach((ch) => socket.leave(ch));
    });

    socket.on("disconnect", (reason) => {
      console.log(`[Realtime] disconnected  socket=${socket.id}  reason=${reason}`);
    });
  }

  _isAllowedChannel(channel, socket) {
    if (channel === "__global__") return true;

    if (channel.startsWith("user:")) {
      const targetUserId = channel.slice("user:".length);
      return !!socket.data.userId && targetUserId === socket.data.userId;
    }

    const authedPrefixes = ["list:", "doc:", "chat:", "site:"];
    if (authedPrefixes.some((p) => channel.startsWith(p))) {
      return !!socket.data.userId;
    }

    return false;
  }
}

export const RealtimeManager = new _RealtimeManager();
