// @ts-nocheck
import { useEffect, useRef, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";

import { db } from "@/API/base44Client";
import ExportButton from "@/components/schedule/ExportButton";
import MonthSelector from "@/components/schedule/MonthSelector";
import ScheduleGrid from "@/components/schedule/ScheduleGrid";
import ScheduleLegend from "@/components/schedule/ScheduleLegend";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { generateEmptySchedule, getMonthName } from "@/lib/scheduleUtils";

export default function Schedule() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [schedules, setSchedules] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const gridRef = useRef(null);
  const { toast } = useToast();

  async function load() {
    setLoading(true);

    try {
      const [scheduleList, employeeList] = await Promise.all([
        db.entities.Schedule.filter({ month, year }),
        db.entities.Employee.filter({ active: true }),
      ]);

      setSchedules(scheduleList);
      setEmployees(employeeList);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [month, year]);

  async function handleGenerate() {
    if (employees.length === 0) {
      toast({
        title: "Adicione colaboradores primeiro",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);

    try {
      for (const schedule of schedules) {
        await db.entities.Schedule.delete(schedule.id);
      }

      const newSchedules = employees.map((employee) => ({
        employee_id: employee.id,
        employee_name: employee.name,
        month,
        year,
        days: generateEmptySchedule(month, year),
      }));

      await db.entities.Schedule.bulkCreate(newSchedules);

      toast({ title: "Escala gerada com sucesso" });
      await load();
    } catch (error) {
      toast({
        title: "Falha ao gerar escala",
        description: error?.message || "Nao foi possivel gerar a escala.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  }

  async function handleCellClick(schedule, day) {
    const currentShift = schedule.days?.[String(day)] || "T";
    const cycle = ["T", "F", "M"];
    const nextIndex = (cycle.indexOf(currentShift) + 1) % cycle.length;
    const newDays = { ...schedule.days, [String(day)]: cycle[nextIndex] };

    await db.entities.Schedule.update(schedule.id, { days: newDays });
    setSchedules((current) =>
      current.map((item) =>
        item.id === schedule.id ? { ...item, days: newDays } : item
      )
    );
  }

  function handleMonthChange(nextMonth, nextYear) {
    setMonth(nextMonth);
    setYear(nextYear);
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-2xl font-bold">
            Escala de revezamento
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Clique nas celulas para alternar entre Trabalho, Folga e Madrugada
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <MonthSelector month={month} onChange={handleMonthChange} year={year} />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <ScheduleLegend />
        <div className="flex gap-2">
          <Button
            className="gap-2"
            disabled={generating}
            onClick={() => {
              void handleGenerate();
            }}
            variant="outline"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {schedules.length > 0 ? "Regenerar" : "Gerar escala"}
          </Button>
          <ExportButton
            fileName={`escala-${getMonthName(month, year)}-${year}`}
            targetRef={gridRef}
          />
        </div>
      </div>

      <div ref={gridRef}>
        <div className="rounded-xl bg-white p-4">
          <div className="mb-4 text-center">
            <h2 className="font-heading text-lg font-bold text-foreground">
              ESCALA DE REVEZAMENTO - {getMonthName(month, year).toUpperCase()}{" "}
              {year}
            </h2>
          </div>
          <ScheduleGrid
            month={month}
            onCellClick={handleCellClick}
            schedules={schedules}
            year={year}
          />
        </div>
      </div>
    </div>
  );
}
