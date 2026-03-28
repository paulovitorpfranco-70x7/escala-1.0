function clone(value) {
  return structuredClone(value);
}

function matchesFilter(record, filters) {
  return Object.entries(filters || {}).every(([key, value]) => record[key] === value);
}

function sortRecords(records, sort) {
  if (!sort) {
    return records;
  }

  const direction = sort.startsWith("-") ? -1 : 1;
  const field = sort.replace(/^-/, "");

  return [...records].sort((left, right) => {
    if (left[field] === right[field]) {
      return 0;
    }

    return left[field] > right[field] ? direction : -direction;
  });
}

function createCollection(entityName, initialRecords = []) {
  let counter = initialRecords.length + 1;
  let records = initialRecords.map((record) => clone(record));

  return {
    async list(sort, limit) {
      const sorted = sortRecords(records, sort);
      const result = limit === undefined ? sorted : sorted.slice(0, limit);
      return clone(result);
    },
    async filter(filters) {
      return clone(records.filter((record) => matchesFilter(record, filters)));
    },
    async create(payload = {}) {
      const record = {
        id: payload.id || `${entityName.toLowerCase()}-${counter++}`,
        created_date: payload.created_date || new Date().toISOString(),
        ...payload,
      };
      records.push(record);
      return clone(record);
    },
    async update(id, payload = {}) {
      const index = records.findIndex((record) => record.id === id);

      if (index < 0) {
        throw new Error(`${entityName} ${id} nao encontrado.`);
      }

      records[index] = {
        ...records[index],
        ...payload,
      };

      return clone(records[index]);
    },
    async delete(id) {
      const index = records.findIndex((record) => record.id === id);

      if (index < 0) {
        throw new Error(`${entityName} ${id} nao encontrado.`);
      }

      const [removed] = records.splice(index, 1);
      return clone(removed);
    },
    snapshot() {
      return clone(records);
    },
  };
}

export function createInMemoryServices({
  employees = [],
  schedules = [],
  rules = [],
  llmResult = { changes: [], explanation: "" },
} = {}) {
  const employeeCollection = createCollection("employee", employees);
  const scheduleCollection = createCollection("schedule", schedules);
  const ruleCollection = createCollection("rule", rules);
  let currentLlmResult = llmResult;

  return {
    services: {
      listEmployees: () => employeeCollection.list(),
      listActiveEmployees: () => employeeCollection.filter({ active: true }),
      createEmployee: (payload) => employeeCollection.create(payload),
      updateEmployee: (employeeId, payload) =>
        employeeCollection.update(employeeId, payload),
      deleteEmployee: (employeeId) => employeeCollection.delete(employeeId),
      listSchedulesByPeriod: ({ month, year }) =>
        scheduleCollection.filter({ month, year }),
      createSchedule: (payload) => scheduleCollection.create(payload),
      updateSchedule: (scheduleId, payload) =>
        scheduleCollection.update(scheduleId, payload),
      updateScheduleDays: (scheduleId, days) =>
        scheduleCollection.update(scheduleId, { days }),
      deleteSchedule: (scheduleId) => scheduleCollection.delete(scheduleId),
      listScheduleRules: (sort, limit) => ruleCollection.list(sort, limit),
      createScheduleRule: (payload) => ruleCollection.create(payload),
      deleteScheduleRule: (ruleId) => ruleCollection.delete(ruleId),
      invokeLlm: async () =>
        clone(
          typeof currentLlmResult === "function"
            ? await currentLlmResult()
            : currentLlmResult
        ),
    },
    setLlmResult(nextLlmResult) {
      currentLlmResult = nextLlmResult;
    },
    snapshot() {
      return {
        employees: employeeCollection.snapshot(),
        schedules: scheduleCollection.snapshot(),
        rules: ruleCollection.snapshot(),
      };
    },
  };
}
