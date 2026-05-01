export function OwnChip({ action, checked, saving, onClick }) {
  return (
    <button onClick={onClick} disabled={saving}
      className={`inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all disabled:opacity-50 disabled:cursor-wait
        ${checked ? "bg-primary/10 text-primary border-primary/25 hover:bg-primary/20" : "bg-background text-muted-foreground border-border hover:border-input hover:text-foreground"}`}>
      {saving
        ? <span className="inline-block w-2 h-2 border border-current border-t-transparent rounded-full animate-spin" />
        : <span className="text-[9px]">{checked ? "✓" : "+"}</span>
      }
      {action}
    </button>
  );
}
