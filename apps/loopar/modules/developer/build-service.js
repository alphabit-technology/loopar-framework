'use strict';

/**
 * Shared build orchestrator: one build process at a time, behind a queue.
 * Jobs carry a `scope`: 'all' runs `npm run build`; '<app>' runs
 * `npm run build:app` with BUILD_APP set. Imported by both the Tenant Manager
 * and App Manager controllers, which share this module's singleton state.
 */

import { spawn } from 'child_process';
import crypto from 'node:crypto';

const queue = [];
let current = null;
let child = null;
let history = [];
let emitFn = null;

export function setEmitter(fn) {
  if (typeof fn === 'function') emitFn = fn;
}

export function snapshot() {
  return {
    build: current || { state: 'idle' },
    queue: queue.map((j) => ({ id: j.id, scope: j.scope })),
  };
}

export function getBuildStatus() {
  return { ...snapshot(), history };
}

function emit() {
  if (emitFn) emitFn('buildStatus', snapshot());
}

function runNext() {
  if (current || queue.length === 0) return;

  const job = queue.shift();
  current = { ...job, state: 'running', startedAt: Date.now() };
  emit();

  const isScoped = job.scope && job.scope !== 'all';
  const args = isScoped ? ['run', 'build:app'] : ['run', 'build'];
  const tag = isScoped ? `build:${job.scope}` : 'build';

  child = spawn('npm', args, {
    cwd: job.cwd,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      BUILD_INITIATOR: job.initiator || undefined,
      BUILD_APP: isScoped ? job.scope : undefined,
      FORCE_COLOR: '0',
      TENANT_ID: undefined,
      TENANT_PATH: undefined,
      PORT: undefined,
      DOMAIN: undefined,
      HMR_PORT: undefined,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout.on('data', (c) => process.stdout.write(`[${tag}] ${c}`));
  child.stderr.on('data', (c) => process.stderr.write(`[${tag}] ${c}`));

  const finish = (patch) => {
    const done = { ...current, ...patch, finishedAt: Date.now() };
    history.unshift(done);
    history = history.slice(0, 10);
    current = null;
    child = null;
    emit();
    runNext();
  };

  child.on('exit', (code) =>
    finish({ state: code === 0 ? 'completed' : 'failed', exitCode: code })
  );
  child.on('error', (err) => finish({ state: 'failed', error: err.message }));
}

export function enqueueBuild({ scope = 'all', cwd, initiator } = {}) {
  const fullPending =
    (current && current.scope === 'all') || queue.some((j) => j.scope === 'all');

  if (scope === 'all') {
    queue.length = 0;
    if (current && current.scope === 'all') {
      return { queued: false, reason: 'ALREADY_RUNNING', ...snapshot() };
    }
  } else {
    if (fullPending) {
      return { queued: false, reason: 'COVERED_BY_FULL', ...snapshot() };
    }
    const dup =
      (current && current.scope === scope) ||
      queue.some((j) => j.scope === scope);
    if (dup) {
      return { queued: false, reason: 'ALREADY_QUEUED', ...snapshot() };
    }
  }

  const job = { id: crypto.randomUUID(), scope, cwd, initiator };
  queue.push(job);
  emit();
  runNext();
  return { queued: true, jobId: job.id, ...snapshot() };
}
