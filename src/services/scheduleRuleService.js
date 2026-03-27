import { db } from "@/API/base44Client";

export function listScheduleRules(sort, limit) {
  if (sort === undefined && limit === undefined) {
    return db.entities.ScheduleRule.list();
  }

  if (limit === undefined) {
    return db.entities.ScheduleRule.list(sort);
  }

  return db.entities.ScheduleRule.list(sort, limit);
}

export function createScheduleRule(payload) {
  return db.entities.ScheduleRule.create(payload);
}

export function deleteScheduleRule(ruleId) {
  return db.entities.ScheduleRule.delete(ruleId);
}
