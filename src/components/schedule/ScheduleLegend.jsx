import { SHIFT_TYPES } from "@/lib/scheduleUtils";

export default function ScheduleLegend() {
  return (
    <div className="flex items-center gap-4 text-xs">
      {Object.entries(SHIFT_TYPES).map(([key, value]) => (
        <div key={key} className="flex items-center gap-1.5">
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-md border text-[10px] font-bold ${value.color}`}
          >
            {value.short}
          </div>
          <span className="text-muted-foreground">{value.label}</span>
        </div>
      ))}
    </div>
  );
}
