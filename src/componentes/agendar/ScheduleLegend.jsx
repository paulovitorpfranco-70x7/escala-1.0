import { SHIFT_TYPES } from "../../lib/scheduleUtils";

export default function ScheduleLegend() {
  return (
    <div className="flex items-center gap-4 text-xs">
      {Object.entries(SHIFT_TYPES).map(([key, val]) => (
        <div key={key} className="flex items-center gap-1.5">
          <div className={`w-6 h-6 rounded-md border flex items-center justify-center font-bold text-[10px] ${val.color}`}>
            {val.short}
          </div>
          <span className="text-muted-foreground">{val.label}</span>
        </div>
      ))}
    </div>
  );
}