'use strict';

import { BaseDocument, loopar } from 'loopar';

const ENTITY = 'Page View';
const WORKSPACE = 'web';

function getFromDate(days = 30) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
}

function hourExpr(dialect) {
  if (dialect.includes('sqlite')) return `CAST(strftime('%H', created_at) AS INTEGER)`;
  if (dialect.includes('postgres')) return `EXTRACT(HOUR FROM created_at)::int`;
  return 'HOUR(created_at)';
}

export default class AnalyticsDashboard extends BaseDocument {
  constructor(props) { super(props); }

  async data() {
    const [kpis, visits, pages, countries, devices, browsers, referrers, hourly] =
      await Promise.all([
        this.getKpis(),
        this.getVisitStats(),
        this.getTopPages(),
        this.getTopCountries(),
        this.getDevices(),
        this.getBrowsers(),
        this.getReferrers(),
        this.getHourly(),
      ]);

    return { kpis, visits, pages, countries, devices, browsers, referrers, hourly };
  }

  async __meta__() {
    return { ...await super.__meta__(), data: await this.data() };
  }

  get from() { return getFromDate(this.days); }

  #baseQuery(from = this.from) {
    return loopar.db.query(ENTITY)
      .where('workspace', WORKSPACE)
      .andWhere('visit_date', '>=', from);
  }

  async getVisitStats() {
    return await this.#baseQuery()
      .select('visit_date as stat_date')
      .count('* as total_views')
      .countDistinct('ip_hash as unique_visitors')
      .groupBy('visit_date')
      .orderBy('visit_date', 'asc');
  }

  async getKpis() {
    const days = this.days;
    const from = this.from;
    const prevFrom = getFromDate(days * 2);

    const [current, previous] = await Promise.all([
      this.#baseQuery(from)
        .count('* as total_views')
        .countDistinct('ip_hash as unique_visitors')
        .countDistinct('document as unique_pages')
        .first(),
      this.#baseQuery(prevFrom)
        .andWhere('visit_date', '<', from)
        .count('* as total_views')
        .countDistinct('ip_hash as unique_visitors')
        .first(),
    ]);

    const num = (v) => +v || 0;
    const cur  = {
      total_views: num(current?.total_views),
      unique_visitors: num(current?.unique_visitors),
      unique_pages: num(current?.unique_pages),
    };
    const prev = {
      total_views: num(previous?.total_views),
      unique_visitors: num(previous?.unique_visitors),
    };
    const pct = (now, was) => was > 0 ? Math.round(((now - was) / was) * 100) : 0;

    return {
      total_views: cur.total_views,
      unique_visitors: cur.unique_visitors,
      unique_pages: cur.unique_pages,
      views_diff: pct(cur.total_views,     prev.total_views),
      visitors_diff: pct(cur.unique_visitors, prev.unique_visitors),
    };
  }

  async getTopPages() {
    return await this.#baseQuery()
      .select('document as page')
      .count('* as views')
      .countDistinct('ip_hash as unique_visitors')
      .groupBy('document')
      .orderBy('views', 'desc')
      .limit(10);
  }

  async getTopCountries() {
    const knex = loopar.db.knex;
    return await this.#baseQuery()
      .select(knex.raw('COALESCE(??, ?) AS country', ['country', 'Unknown']))
      .count('* as views')
      .countDistinct('ip_hash as unique_visitors')
      .groupBy('country')
      .orderBy('views', 'desc')
      .limit(10);
  }

  async getDevices() {
    const knex = loopar.db.knex;
    return await this.#baseQuery()
      .select(knex.raw('COALESCE(??, ?) AS device_type', ['device_type', 'desktop']))
      .count('* as views')
      .groupBy('device_type')
      .orderBy('views', 'desc');
  }

  async getBrowsers() {
    const knex = loopar.db.knex;
    return await this.#baseQuery()
      .select(knex.raw('COALESCE(??, ?) AS browser', ['browser', 'Unknown']))
      .count('* as views')
      .groupBy('browser')
      .orderBy('views', 'desc')
      .limit(6);
  }

  async getReferrers() {
    const knex = loopar.db.knex;
    const rows = await this.#baseQuery()
      .select(knex.raw(`COALESCE(NULLIF(??, ''), ?) AS source`, ['referrer', 'Direct']))
      .count('* as views')
      .groupBy('referrer')
      .orderBy('views', 'desc')
      .limit(8);

    return rows.map(r => ({
      ...r,
      source: r.source !== 'Direct'
        ? new URL(r.source).hostname.replace('www.', '')
        : 'Direct',
    })).reduce((acc, row) => {
      const existing = acc.find(r => r.source === row.source);
      if (existing) existing.views += row.views;
      else acc.push(row);
      return acc;
    }, []).sort((a, b) => b.views - a.views);
  }

  async getHourly() {
    const knex = loopar.db.knex;
    const expr = hourExpr(loopar.db.dialect);

    return await this.#baseQuery()
      .select(knex.raw(`${expr} AS hour`))
      .count('* as views')
      .groupByRaw(expr)
      .orderBy('hour', 'asc');
  }
}
