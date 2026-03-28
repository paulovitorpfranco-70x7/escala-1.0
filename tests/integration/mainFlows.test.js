import test from "node:test";
import assert from "node:assert/strict";

import { applyCommandFlow, deleteRuleFlow } from "../../src/lib/commandFlow.js";
import {
  DEFAULT_ROLE,
  deleteEmployeeFlow,
  saveEmployeeFlow,
} from "../../src/lib/employeeFlow.js";
import {
  applyScheduleDayUpdate,
  generateSchedulesForPeriod,
} from "../../src/lib/scheduleFlow.js";
import { createInMemoryServices } from "../helpers/inMemoryServices.js";

test("employee flow creates, updates and deletes collaborators", async () => {
  const repository = createInMemoryServices();

  const created = await saveEmployeeFlow({
    form: {
      name: "  ana   maria ",
      role: DEFAULT_ROLE,
    },
    employees: [],
    editingEmployee: null,
    services: repository.services,
  });

  assert.equal(created.ok, true);
  assert.equal(created.action, "created");
  assert.equal(repository.snapshot().employees[0].name, "ANA MARIA");
  assert.equal(repository.snapshot().employees[0].active, true);

  const employee = repository.snapshot().employees[0];
  const updated = await saveEmployeeFlow({
    form: {
      name: "Ana Paula",
      role: "Gerente",
    },
    employees: repository.snapshot().employees,
    editingEmployee: employee,
    services: repository.services,
  });

  assert.equal(updated.ok, true);
  assert.equal(updated.action, "updated");
  assert.equal(repository.snapshot().employees[0].name, "ANA PAULA");
  assert.equal(repository.snapshot().employees[0].role, "Gerente");

  const removed = await deleteEmployeeFlow({
    employee: repository.snapshot().employees[0],
    services: repository.services,
    confirmDelete: () => true,
  });

  assert.equal(removed.ok, true);
  assert.equal(repository.snapshot().employees.length, 0);
});

test("schedule flow regenerates the month and persists manual edits", async () => {
  const month = 3;
  const year = 2025;
  const repository = createInMemoryServices({
    employees: [
      { id: "emp-1", name: "ANA", role: "Atendente", active: true },
      { id: "emp-2", name: "BRUNO", role: "Caixa", active: true },
      { id: "emp-3", name: "CARLA", role: "Gerente", active: false },
    ],
    schedules: [
      {
        id: "schedule-1",
        employee_id: "emp-1",
        employee_name: "ANA",
        month,
        year,
        days: { 1: "F" },
      },
      {
        id: "schedule-duplicate",
        employee_id: "emp-1",
        employee_name: "ANA",
        month,
        year,
        days: { 1: "M" },
      },
      {
        id: "schedule-stale",
        employee_id: "emp-3",
        employee_name: "CARLA",
        month,
        year,
        days: { 1: "F" },
      },
    ],
  });

  const generated = await generateSchedulesForPeriod({
    month,
    year,
    currentSchedules: await repository.services.listSchedulesByPeriod({ month, year }),
    activeEmployees: await repository.services.listActiveEmployees(),
    services: repository.services,
  });

  assert.equal(generated.kind, "regenerated");

  const schedulesAfterGeneration = await repository.services.listSchedulesByPeriod({
    month,
    year,
  });

  assert.equal(schedulesAfterGeneration.length, 2);
  assert.deepEqual(
    schedulesAfterGeneration.map((schedule) => schedule.employee_name).sort(),
    ["ANA", "BRUNO"]
  );
  assert.equal(
    schedulesAfterGeneration.every(
      (schedule) =>
        Object.keys(schedule.days).length === 31 &&
        Object.values(schedule.days).every((shift) => shift === "T")
    ),
    true
  );

  const anaSchedule = schedulesAfterGeneration.find(
    (schedule) => schedule.employee_name === "ANA"
  );
  const edited = await applyScheduleDayUpdate({
    schedule: anaSchedule,
    day: 5,
    month,
    year,
    services: repository.services,
  });

  assert.equal(edited.ok, true);
  assert.equal(edited.nextShift, "F");

  const updatedSchedule = (
    await repository.services.listSchedulesByPeriod({ month, year })
  ).find((schedule) => schedule.id === anaSchedule.id);

  assert.equal(updatedSchedule.days["5"], "F");
});

test("command flow applies IA changes, records the rule and allows deletion", async () => {
  const month = 3;
  const year = 2025;
  const repository = createInMemoryServices({
    employees: [
      { id: "emp-1", name: "ANA", role: "Atendente", active: true },
      { id: "emp-2", name: "BRUNO", role: "Caixa", active: true },
    ],
    schedules: [
      {
        id: "schedule-1",
        employee_id: "emp-1",
        employee_name: "ANA",
        month,
        year,
        days: { 1: "T", 2: "T", 3: "T" },
      },
      {
        id: "schedule-2",
        employee_id: "emp-2",
        employee_name: "BRUNO",
        month,
        year,
        days: { 1: "T", 2: "T", 3: "T" },
      },
    ],
    llmResult: {
      explanation: "Ajustes analisados para o periodo.",
      changes: [
        {
          schedule_id: "schedule-1",
          employee_name: "ANA",
          day_changes: {
            1: "F",
            40: "M",
          },
        },
        {
          schedule_id: "schedule-inexistente",
          employee_name: "NINGUEM",
          day_changes: {
            2: "F",
          },
        },
        {
          schedule_id: "schedule-2",
          employee_name: "BRUNO",
          day_changes: {
            3: "X",
          },
        },
      ],
    },
  });

  const applied = await applyCommandFlow({
    command: " ANA   folga no dia 1 ",
    employees: await repository.services.listEmployees(),
    schedules: await repository.services.listSchedulesByPeriod({ month, year }),
    month,
    year,
    services: repository.services,
  });

  assert.equal(applied.ok, true);
  assert.equal(applied.normalizedCommand, "ANA folga no dia 1");
  assert.equal(applied.appliedSchedules, 1);
  assert.equal(applied.appliedDays, 1);
  assert.equal(applied.summary.invalidDays, 1);
  assert.equal(applied.summary.unknownSchedules, 1);
  assert.equal(applied.summary.invalidShifts, 1);
  assert.equal(applied.outcomeState.title, "Comando aplicado");

  const snapshotAfterApply = repository.snapshot();
  const updatedSchedule = snapshotAfterApply.schedules.find(
    (schedule) => schedule.id === "schedule-1"
  );
  assert.equal(updatedSchedule.days["1"], "F");
  assert.equal(snapshotAfterApply.rules.length, 1);
  assert.equal(snapshotAfterApply.rules[0].rule_text, "ANA folga no dia 1");
  assert.equal(snapshotAfterApply.rules[0].employee_name, "ANA");

  const removed = await deleteRuleFlow({
    rule: snapshotAfterApply.rules[0],
    services: repository.services,
  });

  assert.equal(removed.rules.length, 0);
  assert.equal(repository.snapshot().rules.length, 0);
});
