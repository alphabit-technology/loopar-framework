import { Server } from "socket.io";

class _RealtimeManager {
  constructor() {
    this.io = null;
    this._namespaces = new Map();
  }

  /**
   * @param {import("http").Server} httpServer
   * @param {object} options
   */
  attach(httpServer, options = {}) {
    if (this.io) return this;
  
    this.io = new Server(httpServer, {
      path: "/ws/socket.io",
      cors: {
        origin: process.env.SOCKET_CORS_ORIGIN || "*",
        credentials: true,
      },
      transports: ["websocket", "polling"],
      ...options,
    });
  
    this.io.of(/^\/[a-zA-Z0-9_-]+$/).on("connection", (socket) => {
      const siteName = socket.nsp.name.slice(1);
      socket.data.siteName = siteName;
      socket.data.userId = socket.handshake.auth?.userId || null;
  
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

  _authMiddleware(socket, next, siteName) {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.cookie;

    socket.data.siteName = siteName;
    socket.data.userId = socket.handshake.auth?.userId || null;

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
    const validPrefixes = ["list:", "doc:", "chat:", "user:", "site:"];
    return validPrefixes.some((p) => channel.startsWith(p));
  }
}

export const RealtimeManager = new _RealtimeManager();