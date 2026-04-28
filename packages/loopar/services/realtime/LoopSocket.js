import { io } from "socket.io-client";

class _LoopSocket {
  constructor() {
    this._socket = null;
    this._siteName = null;
  }

  onReady(callback) {
    if (this._socket?.connected) {
      callback(this._socket);
    } else if (this._socket) {
      this._socket.once("connect", () => callback(this._socket));
    } else {
      this._queue = this._queue || [];
      this._queue.push(callback);
    }
  }

  /**
   * Connects to the given site (or returns an existing connection).
   * @param {string} siteName  Site name (namespace)
   * @param {object} options
   * @param {string} options.userId  Current user id for auth
   * @returns {import("socket.io-client").Socket}
   */
  connect(siteName, { userId } = {}) {
    if (this._socket && this._siteName === siteName) {
      return this._socket;
    }

    if (this._socket) {
      this._socket.disconnect();
      this._socket = null;
    }

    this._siteName = siteName;

    const url = window.location.origin;

    this._socket = io(`${url}/${siteName}`, {
      path: "/ws/socket.io",
      transports: ["websocket", "polling"],
      auth: {
        userId,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
    });

    this._socket.on("connect", () => {
      console.log(`[LoopSocket] connected  site=${siteName}  id=${this._socket.id}`);
      (this._queue || []).forEach(cb => cb(this._socket));
      this._queue = [];
    });

    this._socket.on("disconnect", (reason) => {
      console.log(`[LoopSocket] disconnected  reason=${reason}`);
    });

    this._socket.on("connect_error", (err) => {
      console.warn("[LoopSocket] connection error:", err.message);
    });

    return this._socket;
  }

  get() {
    return this._socket;
  }

  /**
   * Joins the socket to one or more rooms.
   * @param {string|string[]} channels
   */
  join(channels) {
    this.get()?.emit("join", channels);
  }
  
  leave(channels) {
    this.get()?.emit("leave", channels);
  }

  disconnect() {
    this._socket?.disconnect();
    this._socket = null;
    this._siteName = null;
  }
}

export const LoopSocket = new _LoopSocket();