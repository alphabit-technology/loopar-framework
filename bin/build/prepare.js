/**
 * Build step 1/3 — Prepare a versioned release folder.
 *
 * Generates a release tag from the current UTC timestamp, writes it to
 * `.release-tag` so the rest of the build chain can pick it up, and creates
 * `build/releases/<tag>/` ready to receive the client/server bundles.
 *
 * Nothing in the live `dist` is touched here. Tenants in production keep
 * serving the previous release while the new one is being built.
 */
import fs from 'fs';
import { makeTag, releaseDir, writeTag } from './lib/release.js';

const tag = makeTag();
fs.mkdirSync(releaseDir(tag), { recursive: true });
writeTag(tag);

console.log(`\n📦 Preparing release ${tag}`);
console.log(`   → ${releaseDir(tag)}\n`);
