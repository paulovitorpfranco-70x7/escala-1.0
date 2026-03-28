import ShiftCell from "@/components/schedule/ShiftCell";
import {
  countShifts,
  getDayOfWeekFull,
  getDaysInMonth,
  isWeekend,
} from "@/lib/scheduleUtils";

export default function ScheduleGrid({
  schedules,
  month,
  year,
  onCellClick,
  readonly = false,
  isCellPending,
}) {
  const totalDays = getDaysInMonth(month, year);
  const days = Array.from({ length: totalDays }, (_, index) => index + 1);

  return (
    <div
      className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm"
      data-export-scroll
    >
      <table className="w-full text-xs" data-export-table>
        <thead>
          <tr className="bg-primary/5">
            <th
              className="sticky left-0 z-10 min-w-[140px] bg-primary/5 px-4 py-3 text-left font-heading font-semibold text-foreground"
              data-export-sticky
            >
              Colaborador
            </th>
            {days.map((day) => {
              const weekend = isWeekend(day, month, year);
              const weekday = getDayOfWeekFull(day, month, year);

              return (
                <th
                  key={day}
                  className={`min-w-[36px] px-1 py-2 text-center font-medium ${
                    weekend ? "bg-accent/5" : ""
                  }`}
                >
                  <div className="text-[10px] uppercase text-muted-foreground">
                    {weekday}
                  </div>
                  <div
                    className={`text-sm font-semibold ${
                      weekend ? "text-accent" : "text-foreground"
                    }`}
                  >
                    {day}
                  </div>
                </th>
              );
            })}
            <th
              className="sticky right-0 z-10 min-w-[60px] bg-primary/5 px-3 py-3 text-center font-heading font-semibold text-foreground"
              data-export-sticky
            >
              Folgas
            </th>
          </tr>
        </thead>
        <tbody>
          {schedules.map((schedule, index) => (
            <tr
              key={schedule.id || index}
              className="border-t border-border/50 transition-colors hover:bg-muted/30"
            >
              <td
                className="sticky left-0 z-10 whitespace-nowrap bg-card px-4 py-2 text-sm font-semibold text-foreground"
                data-export-sticky
              >
                {schedule.employee_name}
              </td>
              {days.map((day) => {
                const shift = schedule.days?.[String(day)] || "T";
                const weekend = isWeekend(day, month, year);
                const cellPending = isCellPending?.(schedule.id, day) || false;

                return (
                  <td
                    key={day}
                    className={`px-0.5 py-1 text-center ${
                      weekend ? "bg-accent/5" : ""
                    }`}
                  >
                    <ShiftCell
                      disabled={readonly || cellPending}
                      onClick={() => {
                        if (!readonly && !cellPending) {
                          onCellClick?.(schedule, day);
                        }
                      }}
                      shift={shift}
                    />
                  </td>
                );
              })}
              <td
                className="sticky right-0 z-10 bg-card px-3 py-2 text-center"
                data-export-sticky
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                  {countShifts(schedule.days, "F")}
                </span>
              </td>
            </tr>
          ))}
          {schedules.length === 0 ? (
            <tr>
              <td
                className="py-12 text-center text-muted-foreground"
                colSpan={totalDays + 2}
              >
                Nenhuma escala cadastrada. Adicione colaboradores e gere a escala.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
