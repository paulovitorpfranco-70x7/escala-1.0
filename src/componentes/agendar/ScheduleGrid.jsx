import { getDaysInMonth, getDayOfWeekFull, isWeekend, SHIFT_TYPES, countShifts } from "../../lib/scheduleUtils";
import ShiftCell from "./ShiftCell";

export default function ScheduleGrid({ schedules, month, year, onCellClick, readonly }) {
  const daysCount = getDaysInMonth(month, year);
  const days = Array.from({ length: daysCount }, (_, i) => i + 1);

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-primary/5">
            <th className="sticky left-0 z-10 bg-primary/5 px-4 py-3 text-left font-heading font-semibold text-foreground min-w-[140px]">
              Colaborador
            </th>
            {days.map((d) => {
              const weekend = isWeekend(d, month, year);
              const dow = getDayOfWeekFull(d, month, year);
              return (
                <th
                  key={d}
                  className={`px-1 py-2 text-center font-medium min-w-[36px] ${
                    weekend ? "bg-accent/5" : ""
                  }`}
                >
                  <div className="text-[10px] text-muted-foreground uppercase">{dow}</div>
                  <div className={`text-sm font-semibold ${weekend ? "text-accent" : "text-foreground"}`}>
                    {d}
                  </div>
                </th>
              );
            })}
            <th className="sticky right-0 z-10 bg-primary/5 px-3 py-3 text-center font-heading font-semibold text-foreground min-w-[60px]">
              Folgas
            </th>
          </tr>
        </thead>
        <tbody>
          {schedules.map((schedule, idx) => (
            <tr
              key={schedule.id || idx}
              className="border-t border-border/50 hover:bg-muted/30 transition-colors"
            >
              <td className="sticky left-0 z-10 bg-card px-4 py-2 font-semibold text-sm text-foreground whitespace-nowrap">
                {schedule.employee_name}
              </td>
              {days.map((d) => {
                const shift = schedule.days?.[String(d)] || "T";
                const weekend = isWeekend(d, month, year);
                return (
                  <td
                    key={d}
                    className={`px-0.5 py-1 text-center ${weekend ? "bg-accent/5" : ""}`}
                  >
                    <ShiftCell
                      shift={shift}
                      onClick={() => !readonly && onCellClick?.(schedule, d)}
                    />
                  </td>
                );
              })}
              <td className="sticky right-0 z-10 bg-card px-3 py-2 text-center">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-accent/10 text-accent font-bold text-sm">
                  {countShifts(schedule.days, "F")}
                </span>
              </td>
            </tr>
          ))}
          {schedules.length === 0 && (
            <tr>
              <td colSpan={daysCount + 2} className="text-center py-12 text-muted-foreground">
                Nenhuma escala cadastrada. Adicione colaboradores e gere a escala.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}