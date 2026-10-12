'use strict';

import { BaseDocument, loopar } from 'loopar';

const WORDS_PER_MINUTE = 220;

function slugify(input = '') {
  return String(input)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function countMinutes(markdown = '') {
  const text = String(markdown)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#>*_`~\-\[\]\(\)!|]/g, ' ');
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default class Post extends BaseDocument {
  constructor(props) {
    super(props);
  }

  async beforeSave() {
    if ((!this.slug || !String(this.slug).trim()) && this.title) {
      this.slug = await this.#uniqueSlug(slugify(this.title));
    } else if (this.slug) {
      const normalized = slugify(this.slug);
      if (normalized !== this.slug) {
        this.slug = await this.#uniqueSlug(normalized);
      }
    }

    this.reading_time = countMinutes(this.description);

    if (Number(this.published) === 1 && !this.published_on) {
      this.published_on = today();
    }
  }

  async #uniqueSlug(base) {
    if (!base) return base;
    let candidate = base;
    let i = 2;
    while (await this.#slugTaken(candidate)) {
      candidate = `${base}-${i++}`;
      if (i > 999) break;
    }
    return candidate;
  }

  async #slugTaken(slug) {
    const rows = await loopar.db.qx()('Post')
      .select(['name'])
      .where({ slug })
      .whereNull('__deleted_at__');
    if (!rows || rows.length === 0) return false;
    return rows.some(r => r.name !== this.name);
  }
}
