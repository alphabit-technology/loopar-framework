'use strict';

import Redis from 'ioredis';
import { redisConfig } from '../config/core-config.js';

/**
 * Shared Redis client factory for the core (the "generator"). Redis is the
 * coherence layer that makes multi-worker (PM2 cluster) safe: the shared cache,
 * the socket.io cross-worker adapter, and the global rate-limit store all ride
 * on it. With no Redis host configured (single-process deployments) these
 * callers fall back to in-process behavior — correct for ONE worker, not many.
 */

/** True when a Redis host is configured (config/core.json -> redis, or env). */
export function redisEnabled() {
  return !!redisConfig().host;
}

/**
 * A fresh ioredis client from core config, or null when Redis isn't configured.
 * Callers needing their own connection (socket.io pub + sub, rate-limit) call
 * this independently.
 */
export function createRedisClient(overrides = {}) {
  const c = redisConfig();
  if (!c.host) return null;
  const client = new Redis({
    host: c.host,
    port: c.port,
    password: c.password || undefined,
    retryStrategy: (times) => Math.min(times * 200, 5000),
    ...overrides,
  });
  // A configured-but-unreachable Redis must not crash the core: ioredis emits
  // 'error' on a dead connection, and an unhandled 'error' would throw.
  client.on('error', (err) => console.warn('[Redis] client error:', err.message));
  return client;
}
