/**
 * Shared mutable state of the TUI. One plain object — render() draws it,
 * input handlers mutate it, actions read and update it.
 */

export const NO_PM2 = process.env.LOOPAR_TUI_NO_PM2 === "1";

export const state = {
  rows: [],            // [{ name, port, domain, env, url, status }]
  selected: 0,
  scroll: 0,
  view: "tenants",     // tenants | logs (full-screen tabs)
  mode: "list",        // list | create (wizard) | destroy | confirm
  input: "",
  wizard: null,        // { title, steps: [{ key, label, value, validate, default, mask }], idx, onDone }
  confirm: null,       // { question, onYes, onNo? }
  message: "",
  messageKind: "info", // info | ok | error
  busy: false,

  // Logs tab (managed by logs.js while view === "logs")
  logs: null,          // { name|null(=all), lines: [{s,text,at?,p?}], follow, scroll, viewH, paths, procs, live }

  // Set by render() on every frame; read by the mouse handler.
  rowRegionStart: 0,   // first terminal row (1-based) of the tenant table
  buttonRegions: [],   // [{ x1, x2, y, action }] — footer buttons AND header tabs
  urlCol: null,        // { x1, x2 } — x-range of the URL column (click → open)
  tableH: 10,          // rows per table page (set by render; PgUp/PgDn use it)
  colOff: 0,           // first non-frozen column shown (←/→ horizontal window)
};
