// @ts-nocheck
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";

import { db } from "@/API/base44Client";
import ExportButton from "@/components/schedule/ExportButton";
import MonthSelector from "@/components/schedule/MonthSelector";
import ScheduleGrid from "@/components/schedule/ScheduleGrid";
import ScheduleLegend from "@/components/schedule/ScheduleLegend";
import { Button } from "@/components/ui/button";
import PageState from "@/components/ui/page-state";
import { useToast } from "@/components/ui/use-toast";
import {
  generateEmptySchedule,
  getMonthName,
  getNextShift,
  normalizeScheduleDays,
  validateScheduleDayChange,
} from "@/lib/scheduleUtils";

function buildSchedulePayload(employee, month, year) {
  return {
    employee_id: employee.id,
    employee_name: employee.name,
    month,
    year,
    days: generateEmptySchedule(month, year),
  };
}

function getScheduleSnapshot(schedule) {
  return {
    employee_id: schedule.employee_id,
    employee_name: schedule.employee_name,
    month: schedule.month,
    year: schedule.year,
    days: { ...(schedule.days || {}) },
  };
}

function dedupeSchedulesForCleanup(schedules) {
  const seen = new Set();

  return schedules.filter((schedule) => {
    if (!schedule?.id || seen.has(schedule.id)) {
      return false;
    }

    seen.add(schedule.id);
    return true;
  });
}

function analyzeSchedulesForMonth(schedules, activeEmployees) {
  const activeEmployeeIds = new Set(activeEmployees.map((employee) => employee.id));
  const primaryByEmployeeId = new Map();
  const duplicates = [];
  const stale = [];

  for (const schedule of schedules) {
    if (!schedule.employee_id || !activeEmployeeIds.has(schedule.employee_id)) {
      stale.push(schedule);
      continue;
    }

    if (primaryByEmployeeId.has(schedule.employee_id)) {
      duplicates.push(schedule);
      continue;
    }

    primaryByEmployeeId.set(schedule.employee_id, schedule);
  }

  return {
    primaryByEmployeeId,
    duplicates,
    stale,
  };
}

export default function Schedule() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [schedules, setSchedules] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [pendingCellUpdates, setPendingCellUpdates] = useState({});
  const gridRef = useRef(null);
  const { toast } = useToast();

  const monthAnalysis = useMemo(
    () => analyzeSchedulesForMonth(schedules, employees),
    [employees, schedules]
  );

  async function load({ showLoading = true } = {}) {
    if (showLoading) {
      setLoading(true);
    }

    try {
      setLoadError("");
      const [scheduleList, employeeList] = await Promise.all([
        db.entities.Schedule.filter({ month, year }),
        db.entities.Employee.filter({ active: true }),
      ]);

      setSchedules(scheduleList);
      setEmployees(employeeList);
    } catch (error) {
      setLoadError(
        error?.message || "Nao foi possivel carregar a escala deste periodo."
      );
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    void load();
  }, [month, year]);

  async function rollbackScheduleChanges(createdScheduleIds, updatedSchedules) {
    for (const scheduleId of createdScheduleIds) {
      if (!scheduleId) {
        continue;
      }

      try {
        await db.entities.Schedule.delete(scheduleId);
      } catch {
        // Best-effort rollback for partial create failures.
      }
    }

    for (const schedule of updatedSchedules.reverse()) {
      try {
        await db.entities.Schedule.update(schedule.id, schedule.snapshot);
      } catch {
        // Best-effort rollback for partial update failures.
      }
    }
  }

  async function handleGenerate() {
    const createdScheduleIds = [];
    const updatedSchedules = [];

    if (employees.length === 0) {
      toast({
        title: "Adicione colaboradores primeiro",
        variant: "destructive",
      });
      return;
    }

    if (schedules.length > 0) {
      const confirmed = window.confirm(
        `Ja existem ${schedules.length} escala(s) em ${getMonthName(
          month,
          year
        )} ${year}. Regenerar vai resetar os turnos desse periodo. Deseja continuar?`
      );

      if (!confirmed) {
        return;
      }
    }

    setGenerating(true);

    try {
      const [currentSchedules, activeEmployees] = await Promise.all([
        db.entities.Schedule.filter({ month, year }),
        db.entities.Employee.filter({ active: true }),
      ]);

      if (activeEmployees.length === 0) {
        toast({
          title: "Nenhum colaborador ativo",
          description: "Nao ha colaboradores ativos para gerar a escala.",
          variant: "destructive",
        });
        return;
      }

      const analysis = analyzeSchedulesForMonth(currentSchedules, activeEmployees);
      const cleanupTargets = dedupeSchedulesForCleanup([
        ...analysis.duplicates,
        ...analysis.stale,
      ]);

      for (const employee of activeEmployees) {
        const existingSchedule = analysis.primaryByEmployeeId.get(employee.id);
        const nextPayload = buildSchedulePayload(employee, month, year);

        if (existingSchedule) {
          updatedSchedules.push({
            id: existingSchedule.id,
            snapshot: getScheduleSnapshot(existingSchedule),
          });

          await db.entities.Schedule.update(existingSchedule.id, nextPayload);
          continue;
        }

        const createdSchedule = await db.entities.Schedule.create(nextPayload);
        createdScheduleIds.push(createdSchedule?.id || null);
      }

      let cleanupFailures = 0;

      for (const schedule of cleanupTargets) {
        try {
          await db.entities.Schedule.delete(schedule.id);
        } catch {
          cleanupFailures += 1;
        }
      }

      if (cleanupFailures > 0) {
        toast({
          title: "Escala regenerada com ressalvas",
          description:
            "Os turnos foram recriados, mas alguns registros antigos nao puderam ser limpos.",
          variant: "destructive",
        });
      } else if (currentSchedules.length > 0) {
        toast({
          title: "Escala regenerada com sucesso",
          description: "O periodo foi resetado sem duplicar registros.",
        });
      } else {
        toast({
          title: "Escala gerada com sucesso",
          description: "As escalas do periodo foram criadas para os colaboradores ativos.",
        });
      }

      await load({ showLoading: false });
    } catch (error) {
      await rollbackScheduleChanges(createdScheduleIds, updatedSchedules);

      toast({
        title: "Falha ao gerar escala",
        description:
          error?.message ||
          "Nao foi possivel gerar a escala sem comprometer o periodo.",
        variant: "destructive",
      });

      await load({ showLoading: false });
    } finally {
      setGenerating(false);
    }
  }

  async function handleCellClick(schedule, day) {
    const validationError = validateScheduleDayChange(schedule, day, month, year);

    if (validationError) {
      toast({
        title: "Edicao invalida",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    const cellKey = `${schedule.id}:${day}`;
    if (pendingCellUpdates[cellKey]) {
      return;
    }

    const normalizedDays = normalizeScheduleDays(schedule.days, month, year);
    const currentShift = normalizedDays[String(day)];
    const nextShift = getNextShift(currentShift);
    const newDays = { ...normalizedDays, [String(day)]: nextShift };

    setPendingCellUpdates((current) => ({ ...current, [cellKey]: true }));
    setSchedules((current) =>
      current.map((item) =>
        item.id === schedule.id ? { ...item, days: newDays } : item
      )
    );

    try {
      await db.entities.Schedule.update(schedule.id, { days: newDays });
    } catch (error) {
      setSchedules((current) =>
        current.map((item) =>
          item.id === schedule.id ? { ...item, days: normalizedDays } : item
        )
      );
      toast({
        title: "Falha ao atualizar turno",
        description:
          error?.message || "Nao foi possivel salvar a alteracao deste dia.",
        variant: "destructive",
      });
    } finally {
      setPendingCellUpdates((current) => {
        const next = { ...current };
        delete next[cellKey];
        return next;
      });
    }
  }

  function isCellPending(scheduleId, day) {
    return Boolean(pendingCellUpdates[`${scheduleId}:${day}`]);
  }

  function handleMonthChange(nextMonth, nextYear) {
    setMonth(nextMonth);
    setYear(nextYear);
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
      {loading ? (
        <PageState
          description="Buscando colaboradores ativos e escalas do periodo selecionado."
          state="loading"
          title="Carregando escala"
        />
      ) : loadError ? (
        <PageState
          action={
            <Button
              onClick={() => {
                void load();
              }}
            >
              Tentar novamente
            </Button>
          }
          description={loadError}
          state="error"
          title="Falha ao carregar escala"
        />
      ) : employees.length === 0 ? (
        <PageState
          action={
            <Button asChild>
              <Link to="/colaboradores">Gerenciar colaboradores</Link>
            </Button>
          }
          description="Cadastre ou reative colaboradores antes de gerar a escala deste periodo."
          state="empty"
          title="Nenhum colaborador ativo"
        />
      ) : schedules.length === 0 ? (
        <PageState
          action={
            <Button
              className="gap-2"
              disabled={generating}
              onClick={() => {
                void handleGenerate();
              }}
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Gerar escala
            </Button>
          }
          description={`Ainda nao existe escala para ${getMonthName(
            month,
            year
          )} ${year}. Gere o periodo para iniciar a distribuicao dos turnos.`}
          state="empty"
          title="Nenhuma escala neste periodo"
        />
      ) : (
        <>
          <div className="flex flex-wrap items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div className="space-y-1">
              <p>
                Este periodo ja possui {schedules.length} escala(s). Regenerar vai
                resetar os turnos do mes para todos os colaboradores ativos.
              </p>
              {monthAnalysis.duplicates.length > 0 ? (
                <p>
                  Foram detectados {monthAnalysis.duplicates.length} registro(s)
                  duplicado(s) e eles serao limpos ao final da regeneracao.
                </p>
              ) : null}
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
                Regenerar
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
                isCellPending={isCellPending}
                month={month}
                onCellClick={handleCellClick}
                readonly={generating}
                schedules={schedules}
                year={year}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
