import {
  generateEmptySchedule,
  getNextShift,
  normalizeScheduleDays,
  validateScheduleDayChange,
} from "./scheduleUtils.js";

export function buildSchedulePayload(employee, month, year) {
  return {
    employee_id: employee.id,
    employee_name: employee.name,
    month,
    year,
    days: generateEmptySchedule(month, year),
  };
}

export function getScheduleSnapshot(schedule) {
  return {
    employee_id: schedule.employee_id,
    employee_name: schedule.employee_name,
    month: schedule.month,
    year: schedule.year,
    days: { ...(schedule.days || {}) },
  };
}

export function dedupeSchedulesForCleanup(schedules) {
  const seen = new Set();

  return schedules.filter((schedule) => {
    if (!schedule?.id || seen.has(schedule.id)) {
      return false;
    }

    seen.add(schedule.id);
    return true;
  });
}

export function analyzeSchedulesForMonth(schedules, activeEmployees) {
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

async function rollbackScheduleChanges(createdScheduleIds, updatedSchedules, services) {
  for (const scheduleId of createdScheduleIds) {
    if (!scheduleId) {
      continue;
    }

    try {
      await services.deleteSchedule(scheduleId);
    } catch {
      // Best-effort rollback for partial create failures.
    }
  }

  for (const schedule of updatedSchedules.reverse()) {
    try {
      await services.updateSchedule(schedule.id, schedule.snapshot);
    } catch {
      // Best-effort rollback for partial update failures.
    }
  }
}

export async function generateSchedulesForPeriod({
  month,
  year,
  currentSchedules,
  activeEmployees,
  services,
}) {
  const createdScheduleIds = [];
  const updatedSchedules = [];

  if (activeEmployees.length === 0) {
    return {
      kind: "no-employees",
      cleanupFailures: 0,
      createdScheduleIds,
      updatedSchedules,
    };
  }

  try {
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

        await services.updateSchedule(existingSchedule.id, nextPayload);
        continue;
      }

      const createdSchedule = await services.createSchedule(nextPayload);
      createdScheduleIds.push(createdSchedule?.id || null);
    }

    let cleanupFailures = 0;

    for (const schedule of cleanupTargets) {
      try {
        await services.deleteSchedule(schedule.id);
      } catch {
        cleanupFailures += 1;
      }
    }

    return {
      kind:
        cleanupFailures > 0
          ? "regenerated-with-cleanup-failures"
          : currentSchedules.length > 0
            ? "regenerated"
            : "generated",
      cleanupFailures,
      createdScheduleIds,
      updatedSchedules,
      analysis,
    };
  } catch (error) {
    await rollbackScheduleChanges(createdScheduleIds, updatedSchedules, services);
    throw error;
  }
}

export function prepareScheduleDayUpdate({ schedule, day, month, year }) {
  const validationError = validateScheduleDayChange(schedule, day, month, year);

  if (validationError) {
    return {
      error: validationError,
    };
  }

  const normalizedDays = normalizeScheduleDays(schedule.days, month, year);
  const currentShift = normalizedDays[String(day)];
  const nextShift = getNextShift(currentShift);
  const newDays = { ...normalizedDays, [String(day)]: nextShift };

  return {
    normalizedDays,
    currentShift,
    nextShift,
    newDays,
  };
}

export async function applyScheduleDayUpdate({
  schedule,
  day,
  month,
  year,
  services,
}) {
  const prepared = prepareScheduleDayUpdate({ schedule, day, month, year });

  if (prepared.error) {
    return {
      ok: false,
      error: prepared.error,
    };
  }

  await services.updateScheduleDays(schedule.id, prepared.newDays);

  return {
    ok: true,
    ...prepared,
  };
}
