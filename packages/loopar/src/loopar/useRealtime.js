import { LoopSocket } from "@services/realtime/LoopSocket";
import { useEffect } from "react";

export function useRealtime(event, handler, { ignoreSelf = false } = {}) {
  useEffect(() => {
    if (!event || !handler) return;

    const [room, action] = event.includes(":")
      ? event.split(":")
      : ["__global__", event];

    let socket = null;
    let listener = null;
    let released = false;

    LoopSocket.onReady((s) => {
      if (released) return;
      socket = s;
      LoopSocket.join(room);

      listener = (payload) => {
        if (ignoreSelf && payload?.user === window.__user__) return;
        handler(payload);
      };

      s.on(action, listener);
    });

    return () => {
      released = true;
      if (socket) {
        if (listener) socket.off(action, listener);
        LoopSocket.leave(room);
      }
    };
  }, [event, handler, ignoreSelf]);
}