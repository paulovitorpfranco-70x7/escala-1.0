// @ts-nocheck
import { useEffect, useState } from "react";

import { listEmployees } from "@/services/employeeService";
import { listScheduleRules } from "@/services/scheduleRuleService";
import { listSchedulesByPeriod } from "@/services/scheduleService";

export function useDashboardPage() {
  const [employees, setEmployees] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  async function loadDashboard() {
    setLoading(true);

    try {
      setLoadError("");
      const [employeeList, scheduleList, ruleList] = await Promise.all([
        listEmployees(),
        listSchedulesByPeriod({
          month: currentMonth,
          year: currentYear,
        }),
        listScheduleRules(),
      ]);

      setEmployees(employeeList);
      setSchedules(scheduleList);
      setRules(ruleList);
    } catch (error) {
      setLoadError(error?.message || "Nao foi possivel carregar o painel.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, [currentMonth, currentYear]);

  const totalFolgas = schedules.reduce((sum, schedule) => {
    return (
      sum + Object.values(schedule.days || {}).filter((value) => value === "F").length
    );
  }, 0);

  return {
    currentMonth,
    currentYear,
    employeeCount: employees.length,
    scheduleCount: schedules.length,
    activeRuleCount: rules.filter((rule) => rule.active).length,
    totalFolgas,
    isEmpty: employees.length === 0 && schedules.length === 0 && rules.length === 0,
    loading,
    loadError,
    reloadDashboard: loadDashboard,
  };
}
