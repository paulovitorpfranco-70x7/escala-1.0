const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { RefreshCw, Loader2 } from "lucide-react";
import ScheduleGrid from "../components/schedule/ScheduleGrid";
import MonthSelector from "../components/schedule/MonthSelector";
import ScheduleLegend from "../components/schedule/ScheduleLegend";
import ExportButton from "../components/schedule/ExportButton";
import { generateEmptySchedule, getMonthName } from "../lib/scheduleUtils";

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

  const load = async () => {
    setLoading(true);
    const [scheds, emps] = await Promise.all([
      db.entities.Schedule.filter({ month, year }),
      db.entities.Employee.filter({ active: true }),
    ]);
    setSchedules(scheds);
    setEmployees(emps);
    setLoading(false);
  };

  useEffect(() => { load(); }, [month, year]);

  const handleGenerate = async () => {
    if (employees.length === 0) {
      toast({ title: "Adicione colaboradores primeiro", variant: "destructive" });
      return;
    }
    setGenerating(true);

    // Delete existing schedules for this month
    for (const s of schedules) {
      await db.entities.Schedule.delete(s.id);
    }

    // Create new schedules for each employee
    const newSchedules = employees.map((emp) => ({
      employee_id: emp.id,
      employee_name: emp.name,
      month,
      year,
      days: generateEmptySchedule(month, year),
    }));

    await db.entities.Schedule.bulkCreate(newSchedules);
    toast({ title: "Escala gerada com sucesso!" });
    setGenerating(false);
    load();
  };

  const handleCellClick = async (schedule, day) => {
    const currentShift = schedule.days?.[String(day)] || "T";
    const cycle = ["T", "F", "M"];
    const nextIdx = (cycle.indexOf(currentShift) + 1) % cycle.length;
    const newDays = { ...schedule.days, [String(day)]: cycle[nextIdx] };

    await db.entities.Schedule.update(schedule.id, { days: newDays });
    setSchedules((prev) =>
      prev.map((s) => (s.id === schedule.id ? { ...s, days: newDays } : s))
    );
  };

  const handleMonthChange = (m, y) => {
    setMonth(m);
    setYear(y);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Escala de Revezamento</h1>
          <p className="text-muted-foreground text-sm mt-1">Clique nas células para alternar entre Trabalho, Folga e Madrugada</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <MonthSelector month={month} year={year} onChange={handleMonthChange} />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <ScheduleLegend />
        <div className="flex gap-2">
          <Button onClick={handleGenerate} variant="outline" className="gap-2" disabled={generating}>
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {schedules.length > 0 ? "Regenerar" : "Gerar Escala"}
          </Button>
          <ExportButton targetRef={gridRef} fileName={`escala-${getMonthName(month)}-${year}`} />
        </div>
      </div>

      <div ref={gridRef}>
        <div className="p-4 bg-white rounded-xl">
          <div className="text-center mb-4">
            <h2 className="font-heading text-lg font-bold text-foreground">
              ESCALA DE REVEZAMENTO — {getMonthName(month).toUpperCase()} {year}
            </h2>
          </div>
          <ScheduleGrid
            schedules={schedules}
            month={month}
            year={year}
            onCellClick={handleCellClick}
          />
        </div>
      </div>
    </div>
  );
}