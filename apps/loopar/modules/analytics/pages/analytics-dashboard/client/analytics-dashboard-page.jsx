'use strict';

import PageContext from '@context/page-context';
import { loopar } from "loopar";
import {
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend
} from "recharts";
import { useState, useEffect, useCallback } from "react";

const C = {
  primary: "var(--color-primary)",
  ring: "var(--color-ring)",
  muted: "var(--color-muted-foreground)",
};

const PALETTE = [
  "var(--color-primary)", 
  "var(--color-success, #1D9E75)", 
  "var(--color-warning, #BA7517)", 
  "var(--color-destructive)", 
  "#3B82F6",
  "#EC4899",
  "#14B8A6",
  "var(--color-ring)",
];

const DAYS_OPTIONS = [
  { label: "7d",  value: 7  },
  { label: "30d", value: 30 },
  { label: "90d", value: 90 },
];

function diffLabel(diff) {
  if (!diff || diff === 0) return null;
  return { text: `${diff > 0 ? "+" : ""}${diff}% vs previous period`, positive: diff > 0 };
}

function fmtDuration(seconds) {
  const s = Math.max(0, Math.round(seconds || 0));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem ? `${m}m ${rem}s` : `${m}m`;
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg px-3 py-2 text-xs shadow-md">
      <div className="font-semibold text-popover-foreground mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>
          {p.name}: <span className="font-semibold">{Number(p.value).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

function KpiCard({ label, value, diff, display }) {
  const d = diffLabel(diff);
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-1.5">
      <span className="text-xs text-muted-foreground uppercase tracking-widest">{label}</span>
      <span className="text-3xl font-bold text-card-foreground">
        {display != null ? display : Number(value || 0).toLocaleString()}
      </span>
      {d && (
        <span className={`text-xs font-medium ${d.positive ? "text-success" : "text-destructive"}`}>
          {d.text}
        </span>
      )}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
      {children}
    </h3>
  );
}

function Panel({ children, className = "" }) {
  return (
    <div className={`bg-card border border-border rounded-xl p-5 ${className}`}>
      {children}
    </div>
  );
}

function HBar({ label, value, max, color }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="mb-2.5">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-card-foreground truncate max-w-[70%]">{label}</span>
        <span className="font-semibold text-card-foreground">{Number(value).toLocaleString()}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color || "var(--color-primary)" }}
        />
      </div>
    </div>
  );
}

function PeriodBtn({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer
        ${active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-transparent text-muted-foreground border-border hover:border-primary hover:text-primary"
        }`}
    >
      {label}
    </button>
  );
}

function Empty() {
  return <p className="text-sm text-muted-foreground py-2">No data yet</p>;
}

function AnalyticsDashboard({data}) {
  const [analytics, setAnalytics] = useState(data)
  const [days, setDays] = useState(30);
  const {kpis={},visits=[],pages=[],countries=[],devices=[],browsers=[],referrers=[],hourly=[],campaigns=[]} = analytics || {}

  const loadAll = useCallback((d) => {
    loopar.api.get("Analytics Dashboard", "view", {
      query: { days },
      success: r => {
        setAnalytics(r.data)
      }
    });
  }, [days]);

  useEffect(() => { loadAll(days); }, [days]);

  const maxPages     = Math.max(...pages.map(p => p.views), 1);
  const maxCountries = Math.max(...countries.map(c => c.views), 1);
  const maxReferrers = Math.max(...referrers.map(r => r.views), 1);

  // Server buckets hours in UTC; shift to the viewer's timezone (rounded to
  // the nearest hour) and fill the full 0-23 axis.
  const tzOffsetH = Math.round(-new Date().getTimezoneOffset() / 60);
  const localHourly = Array.from({ length: 24 }, (_, h) => ({ hour: h, views: 0 }));
  hourly.forEach(r => {
    const h = ((Number(r.hour) + tzOffsetH) % 24 + 24) % 24;
    localHourly[h].views += +r.views || 0;
  });
  
  const hourColor = h => {
    if (h < 6)  return "#3B82F6";
    if (h < 12) return "var(--color-success, #1D9E75)";
    if (h < 18) return "var(--color-primary)";
    return "#A855F7";
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-foreground">Analytics</h2>
        <div className="flex gap-1.5">
          {DAYS_OPTIONS.map(opt => (
            <PeriodBtn
              key={opt.value}
              label={opt.label}
              active={days === opt.value}
              onClick={() => setDays(opt.value)}
            />
          ))}
        </div>
      </div>

      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="Page Views" value={kpis.total_views} diff={kpis.views_diff} />
          <KpiCard label="Unique Visitors" value={kpis.unique_visitors} diff={kpis.visitors_diff} />
          <KpiCard label="Sessions" value={kpis.sessions} diff={kpis.sessions_diff} />
          <KpiCard label="Unique Pages" value={kpis.unique_pages} diff={null} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiCard label="Engaged Visits" value={kpis.engaged_views} diff={kpis.engaged_diff} />
          <KpiCard label="Engaged Rate" display={`${kpis.engaged_rate || 0}%`} />
          <KpiCard label="Avg Active Time" display={fmtDuration(kpis.avg_active_seconds)} />
          <KpiCard label="Avg Scroll" display={`${kpis.avg_scroll_depth || 0}%`} />
          <KpiCard label="Pages / Session" display={`${kpis.pages_per_session || 0}`} />
          <KpiCard label="Bounce Rate" display={`${kpis.bounce_rate || 0}%`} />
        </div>

        <Panel>
          <SectionTitle>Daily visits</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={visits}>
              <XAxis
                dataKey="stat_date"
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                axisLine={false} tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line dataKey="total_views" name="Views" stroke={C.primary} dot={false} strokeWidth={2} />
              <Line dataKey="unique_visitors" name="Uniques" stroke={C.ring} dot={false} strokeWidth={2} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </Panel>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Panel>
            <SectionTitle>Top pages</SectionTitle>
            {pages.length === 0
              ? <Empty />
              : pages.map((p, i) => <HBar key={p.page} label={p.page} value={p.views} max={maxPages} color={PALETTE[i % PALETTE.length]} />)
            }
          </Panel>
          <Panel>
            <SectionTitle>Top countries</SectionTitle>
            {countries.length === 0
              ? <Empty />
              : countries.map((c, i) => <HBar key={c.country} label={c.country} value={c.views} max={maxCountries} color={PALETTE[i % PALETTE.length]} />)
            }
          </Panel>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

          <Panel>
            <SectionTitle>Devices</SectionTitle>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={devices}
                  dataKey="views"
                  nameKey="device_type"
                  cx="50%" cy="50%"
                  innerRadius={45} outerRadius={68}
                  paddingAngle={3}
                >
                  {devices.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </Panel>

          <Panel>
            <SectionTitle>Browsers</SectionTitle>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={browsers} layout="vertical" margin={{ left: 0, right: 8 }}>
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="browser"
                  tick={{ fontSize: 11, fill: "var(--color-card-foreground)" }}
                  width={68} axisLine={false} tickLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="views" name="Views" radius={[0, 4, 4, 0]}>
                  {browsers.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Panel>

          <Panel>
            <SectionTitle>Traffic sources</SectionTitle>
            {referrers.length === 0
              ? <Empty />
              : referrers.map((r, i) => <HBar key={r.source} label={r.source} value={r.views} max={maxReferrers} color={PALETTE[i % PALETTE.length]} />)
            }
          </Panel>
        </div>

        <Panel>
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <SectionTitle>Traffic by hour of day</SectionTitle>
            <div className="flex gap-3 text-[10px] text-muted-foreground">
              {[
                { c: "#3B82F6", l: "0-5h" },
                { c: "var(--color-success, #1D9E75)", l: "6-11h" },
                { c: "var(--color-primary)", l: "12-17h" },
                { c: "#A855F7", l: "18-23h" },
              ].map(b => (
                <span key={b.l} className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-sm" style={{ backgroundColor: b.c }} />
                  {b.l}
                </span>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={localHourly}>
              <XAxis
                dataKey="hour"
                tickFormatter={h => `${h}h`}
                tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                axisLine={false} tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} labelFormatter={h => `${h}:00`} />
              <Bar dataKey="views" name="Views" fill={C.primary} radius={[3, 3, 0, 0]}>
                {localHourly.map((h, i) => (
                  <Cell key={i} fill={hourColor(h.hour)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel>
          <SectionTitle>Campaigns (UTM)</SectionTitle>
          {campaigns.length === 0
            ? <Empty />
            : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground text-left">
                    <th className="py-1 font-medium">Source</th>
                    <th className="py-1 font-medium">Medium</th>
                    <th className="py-1 font-medium">Campaign</th>
                    <th className="py-1 font-medium text-right">Views</th>
                    <th className="py-1 font-medium text-right">Sessions</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c, i) => (
                    <tr key={i} className="border-t border-border text-card-foreground">
                      <td className="py-1.5">{c.utm_source}</td>
                      <td className="py-1.5">{c.utm_medium || "—"}</td>
                      <td className="py-1.5">{c.utm_campaign || "—"}</td>
                      <td className="py-1.5 text-right font-semibold">{Number(c.views).toLocaleString()}</td>
                      <td className="py-1.5 text-right font-semibold">{Number(c.sessions).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </Panel>
      </>
    </div>
  );
}

export default class AnalyticsDashboardPage extends PageContext {
  constructor(props) {
    super(props);
  }

  render() {
    const {Document} = this.props;
    return super.render(<AnalyticsDashboard data={Document.data}/>);
  }
}