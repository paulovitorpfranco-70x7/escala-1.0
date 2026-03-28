// @ts-nocheck
import { useEffect, useMemo, useState } from "react";

import { useToast } from "@/components/ui/use-toast";
import {
  analyzeSchedulesForMonth,
  generateSchedulesForPeriod,
  prepareScheduleDayUpdate,
} from "@/lib/scheduleFlow";
import { getMonthName } from "@/lib/scheduleUtils";
import { listActiveEmployees } from "@/services/employeeService";
import {
  createSchedule,
  deleteSchedule,
  listSchedulesByPeriod,
  updateSchedule,
  updateScheduleDays,
} from "@/services/scheduleService";

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
  const scheduleServices = {
    createSchedule,
    deleteSchedule,
    updateSchedule,
    updateScheduleDays,
  };

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

  async function handleGenerate() {
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
      const result = await generateSchedulesForPeriod({
        month,
        year,
        currentSchedules,
        activeEmployees,
        services: scheduleServices,
      });

      if (result.kind === "no-employees") {
        toast({
          title: "Nenhum colaborador ativo",
          description: "Nao ha colaboradores ativos para gerar a escala.",
          variant: "destructive",
        });
        return;
      }

      if (result.cleanupFailures > 0) {
        toast({
          title: "Escala regenerada com ressalvas",
          description:
            "Os turnos foram recriados, mas alguns registros antigos nao puderam ser limpos.",
          variant: "destructive",
        });
      } else if (result.kind === "regenerated") {
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
    const prepared = prepareScheduleDayUpdate({ schedule, day, month, year });

    if (prepared.error) {
      toast({
        title: "Edicao invalida",
        description: prepared.error,
        variant: "destructive",
      });
      return;
    }

    const cellKey = `${schedule.id}:${day}`;
    if (pendingCellUpdates[cellKey]) {
      return;
    }

    setPendingCellUpdates((current) => ({ ...current, [cellKey]: true }));
    setSchedules((current) =>
      current.map((item) =>
        item.id === schedule.id ? { ...item, days: prepared.newDays } : item
      )
    );

    try {
      await updateScheduleDays(schedule.id, prepared.newDays);
    } catch (error) {
      setSchedules((current) =>
        current.map((item) =>
          item.id === schedule.id
            ? { ...item, days: prepared.normalizedDays }
            : item
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
