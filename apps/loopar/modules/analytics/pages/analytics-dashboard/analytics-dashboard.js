
'use strict';

import {BaseDocument, loopar} from 'loopar';

function getFromDate(days = 30) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
}

export default class AnalyticsDashboard extends BaseDocument {
    constructor(props){
        super(props);
    }

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

    async __meta__(){
      return {
        ...await super.__meta__(),
        data: await this.data()
      }
    }

    get from(){
      return getFromDate(this.days);
    }

    async getVisitStats() {
      return await loopar.db.rawQuery(`
        SELECT
          visit_date AS stat_date,
          COUNT(*) AS total_views,
          COUNT(DISTINCT \`ip_hash\`) AS unique_visitors
        FROM \`tblPage View\`
        WHERE workspace = ?
          AND visit_date >= ?
        GROUP BY visit_date
        ORDER BY visit_date ASC
      `, ["web", this.from]);
    }
  
    async getKpis() {
      const days = this.days;
      const from = this.from;
      const prevFrom = getFromDate(days * 2);
  
      const [current] = await loopar.db.rawQuery(`
        SELECT
          COUNT(*) AS total_views,
          COUNT(DISTINCT ip_hash) AS unique_visitors,
          COUNT(DISTINCT document) AS unique_pages
        FROM \`tblPage View\`
        WHERE workspace = ? AND visit_date >= ?
      `, ["web", from]);
  
      const [previous] = await loopar.db.rawQuery(`
        SELECT
          COUNT(*) AS total_views,
          COUNT(DISTINCT ip_hash) AS unique_visitors
        FROM \`tblPage View\`
        WHERE workspace = ? AND visit_date >= ? AND visit_date < ?
      `, ["web", prevFrom, from]);
  
      const viewsDiff = previous.total_views > 0
        ? Math.round(((current.total_views - previous.total_views) / previous.total_views) * 100)
        : 0;
  
      const visitorsDiff = previous.unique_visitors > 0
        ? Math.round(((current.unique_visitors - previous.unique_visitors) / previous.unique_visitors) * 100)
        : 0;
  
      return {
        total_views: current.total_views,
        unique_visitors: current.unique_visitors,
        unique_pages: current.unique_pages,
        views_diff: viewsDiff,
        visitors_diff: visitorsDiff,
      };
    }
  
    async getTopPages() {
      return await loopar.db.rawQuery(`
        SELECT
          document AS page,
          COUNT(*) AS views,
          COUNT(DISTINCT ip_hash) AS unique_visitors
        FROM \`tblPage View\`
        WHERE workspace = ? AND visit_date >= ?
        GROUP BY document
        ORDER BY views DESC
        LIMIT 10
      `, ["web", this.from]);
    }
  
    async getTopCountries() {
      return await loopar.db.rawQuery(`
        SELECT
          COALESCE(country, 'Unknown') AS country,
          COUNT(*) AS views,
          COUNT(DISTINCT ip_hash) AS unique_visitors
        FROM \`tblPage View\`
        WHERE workspace = ? AND visit_date >= ?
        GROUP BY country
        ORDER BY views DESC
        LIMIT 10
      `, ["web", this.from]);
    }
  
    async getDevices() {
      return await loopar.db.rawQuery(`
        SELECT
          COALESCE(device_type, 'desktop') AS device_type,
          COUNT(*) AS views
        FROM \`tblPage View\`
        WHERE workspace = ? AND visit_date >= ?
        GROUP BY device_type
        ORDER BY views DESC
      `, ["web", this.from]);
    }
  
    async getBrowsers() {
      return await loopar.db.rawQuery(`
        SELECT
          COALESCE(browser, 'Unknown') AS browser,
          COUNT(*) AS views
        FROM \`tblPage View\`
        WHERE workspace = ? AND visit_date >= ?
        GROUP BY browser
        ORDER BY views DESC
        LIMIT 6
      `, ["web", this.from]);
    }
  
    async getReferrers() {
      const rows = await loopar.db.rawQuery(`
        SELECT
          COALESCE(NULLIF(referrer, ''), 'Direct') AS source,
          COUNT(*) AS views
        FROM \`tblPage View\`
        WHERE workspace = ? AND visit_date >= ?
        GROUP BY referrer
        ORDER BY views DESC
        LIMIT 8
      `, ["web", this.from]);
  
      return rows.map(r => ({
        ...r,
        source: r.source !== 'Direct'
          ? new URL(r.source).hostname.replace('www.', '')
          : 'Direct'
      })).reduce((acc, row) => {
        const existing = acc.find(r => r.source === row.source);
        if (existing) existing.views += row.views;
        else acc.push(row);
        return acc;
      }, []).sort((a, b) => b.views - a.views);
    }
  
    async getHourly() {
      return await loopar.db.rawQuery(`
        SELECT
          CAST(strftime('%H', created_at) AS INTEGER) AS hour,
          COUNT(*) AS views
        FROM \`tblPage View\`
        WHERE workspace = ? AND visit_date >= ?
        GROUP BY strftime('%H', created_at)
        ORDER BY hour ASC
      `, ["web", this.from]);
    }
}