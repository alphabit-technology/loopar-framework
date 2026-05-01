import { Minus, X } from "lucide-react";

export function Checkbox({ checked, partial, na, inherited, denied, onClick }) {
  if (na) return (
    <div className="inline-flex items-center justify-center w-8 h-8 cursor-default">
      <Minus size={11} className="text-border" strokeWidth={1.5} />
    </div>
  );

  return (
    <div onClick={onClick}
      className="inline-flex items-center justify-center w-8 h-8 rounded-md cursor-pointer hover:bg-accent transition-colors group">
      {denied ? (
        <div className="w-4 h-4 rounded-[4px] border-[1.5px] border-destructive bg-destructive/15 flex items-center justify-center">
          <X size={9} className="text-destructive" strokeWidth={2.5} />
        </div>
      ) : checked ? (
        <div className="w-4 h-4 rounded-[4px] bg-primary flex items-center justify-center shadow-sm">
          <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
            <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      ) : inherited ? (
        <div className="w-4 h-4 rounded-[4px] border-[1.5px] border-primary/40 bg-primary/10 flex items-center justify-center">
          <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
            <path d="M1 3.5L3.5 6L8 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary/50"/>
          </svg>
        </div>
      ) : partial ? (
        <div className="w-4 h-4 rounded-[4px] border-[1.5px] border-warning bg-warning/15 flex items-center justify-center">
          <span className="text-[9px] text-warning font-bold leading-none">—</span>
        </div>
      ) : (
        <div className="w-4 h-4 rounded-[4px] border-[1.5px] border-border group-hover:border-primary/50 transition-colors bg-primary/70" />
      )}
    </div>
  );
}