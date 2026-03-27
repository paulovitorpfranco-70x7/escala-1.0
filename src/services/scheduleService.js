import { db } from "@/API/base44Client";

export function listSchedulesByPeriod({ month, year }) {
  return db.entities.Schedule.filter({ month, year });
}

export function createSchedule(payload) {
  return db.entities.Schedule.create(payload);
}

export function updateSchedule(scheduleId, payload) {
  return db.entities.Schedule.update(scheduleId, payload);
}

export function updateScheduleDays(scheduleId, days) {
  return updateSchedule(scheduleId, { days });
}

export function deleteSchedule(scheduleId) {
  return db.entities.Schedule.delete(scheduleId);
}
