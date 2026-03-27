// @ts-nocheck
import { useEffect, useMemo, useState } from "react";

import { useToast } from "@/components/ui/use-toast";
import {
  generateEmptySchedule,
  getMonthName,
  getNextShift,
  normalizeScheduleDays,
  validateScheduleDayChange,
} from "@/lib/scheduleUtils";
import { listActiveEmployees } from "@/services/employeeService";
import {
  createSchedule,
  deleteSchedule,
  listSchedulesByPeriod,
  updateSchedule,
  updateScheduleDays,
} from "@/services/scheduleService";

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

export function useSchedulePage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [schedules, setSchedules] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [pendingCellUpdates, setPendingCellUpdates] = useState({});
  const { toast } = useToast();

  const monthAnalysis = useMemo(
    () => analyzeSchedulesForMonth(schedules, employees),
    [employees, schedules]
  );

  async function loadSchedulePage({ showLoading = true } = {}) {
    if (showLoading) {
      setLoading(true);
    }

    try {
      setLoadError("");
      const [scheduleList, employeeList] = await Promise.all([
        listSchedulesByPeriod({ month, year }),
        listActiveEmployees(),
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
    void loadSchedulePage();
  }, [month, year]);

  async function rollbackScheduleChanges(createdScheduleIds, updatedSchedules) {
    for (const scheduleId of createdScheduleIds) {
      if (!scheduleId) {
        continue;
      }

      try {
        await deleteSchedule(scheduleId);
      } catch {
        // Best-effort rollback for partial create failures.
      }
    }

    for (const schedule of updatedSchedules.reverse()) {
      try {
        await updateSchedule(schedule.id, schedule.snapshot);
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
        listSchedulesByPeriod({ month, year }),
        listActiveEmployees(),
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

          await updateSchedule(existingSchedule.id, nextPayload);
          continue;
        }

        const createdSchedule = await createSchedule(nextPayload);
        createdScheduleIds.push(createdSchedule?.id || null);
      }

      let cleanupFailures = 0;

      for (const schedule of cleanupTargets) {
        try {
          await deleteSchedule(schedule.id);
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

      await loadSchedulePage({ showLoading: false });
    } catch (error) {
      await rollbackScheduleChanges(createdScheduleIds, updatedSchedules);

      toast({
        title: "Falha ao gerar escala",
        description:
          error?.message ||
          "Nao foi possivel gerar a escala sem comprometer o periodo.",
        variant: "destructive",
      });

      await loadSchedulePage({ showLoading: false });
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
      await updateScheduleDays(schedule.id, newDays);
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

  return {
    month,
    year,
    schedules,
    employees,
    loading,
    loadError,
    generating,
    monthAnalysis,
    isCellPending,
    handleGenerate,
    handleCellClick,
    handleMonthChange,
    reloadSchedulePage: loadSchedulePage,
  };
}
