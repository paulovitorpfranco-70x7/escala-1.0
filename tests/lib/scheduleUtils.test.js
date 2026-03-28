import test from "node:test";
import assert from "node:assert/strict";

import {
  countShifts,
  generateEmptySchedule,
  getDaysInMonth,
  isWeekend,
} from "../../src/lib/scheduleUtils.js";

test("getDaysInMonth returns the correct number of days for regular and leap years", () => {
  assert.equal(getDaysInMonth(2, 2025), 28);
  assert.equal(getDaysInMonth(2, 2024), 29);
  assert.equal(getDaysInMonth(4, 2025), 30);
});

test("isWeekend identifies Saturdays and Sundays without flagging weekdays", () => {
  assert.equal(isWeekend(1, 3, 2025), true);
  assert.equal(isWeekend(2, 3, 2025), true);
  assert.equal(isWeekend(3, 3, 2025), false);
});

test("countShifts counts only the requested shift type", () => {
  const days = {
    1: "T",
    2: "F",
    3: "F",
    4: "M",
    5: "T",
  };

  assert.equal(countShifts(days, "F"), 2);
  assert.equal(countShifts(days, "T"), 2);
  assert.equal(countShifts(undefined, "M"), 0);
});

test("generateEmptySchedule creates one work shift per day for the selected month", () => {
  const schedule = generateEmptySchedule(2, 2024);

  assert.equal(Object.keys(schedule).length, 29);
  assert.equal(schedule["1"], "T");
  assert.equal(schedule["29"], "T");
  assert.equal(schedule["30"], undefined);
});
