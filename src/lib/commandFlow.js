import {
  getDaysInMonth,
  getMonthName,
  isValidShift,
  normalizeScheduleDays,
} from "./scheduleUtils.js";

const MIN_COMMAND_LENGTH = 8;

export function normalizeCommandText(value) {
  return value.trim().replace(/\s+/g, " ");
}

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateCommandInput(commandText, employees, schedules) {
  if (!commandText) {
    return "Escreva um comando antes de enviar.";
  }

  if (commandText.length < MIN_COMMAND_LENGTH) {
    return `O comando precisa ter pelo menos ${MIN_COMMAND_LENGTH} caracteres.`;
  }

  if (employees.length === 0) {
    return "Nao ha colaboradores cadastrados para interpretar o comando.";
  }

  if (schedules.length === 0) {
    return "Gere a escala do periodo antes de aplicar comandos de IA.";
  }

  return null;
}

export function validateLlmPayload(result) {
  if (!isPlainObject(result)) {
    return "A IA retornou uma resposta em formato invalido.";
  }

  if (result.error && typeof result.error === "string") {
    return result.error;
  }

  if (result.changes !== undefined && !Array.isArray(result.changes)) {
    return "A IA retornou alteracoes em formato invalido.";
  }

  if (
    result.explanation !== undefined &&
    typeof result.explanation !== "string"
  ) {
    return "A IA retornou uma explicacao em formato invalido.";
  }

  return null;
}

export function collectApplicableChanges(changes, schedules, month, year) {
  const totalDays = getDaysInMonth(month, year);
  const schedulesById = new Map(
    schedules.filter((schedule) => schedule?.id).map((schedule) => [schedule.id, schedule])
  );

  const applicableChanges = [];
  const summary = {
    invalidEntries: 0,
    unknownSchedules: 0,
    invalidDays: 0,
    invalidShifts: 0,
    emptyChanges: 0,
  };

  for (const change of changes || []) {
    if (!isPlainObject(change) || typeof change.schedule_id !== "string") {
      summary.invalidEntries += 1;
      continue;
    }

    const schedule = schedulesById.get(change.schedule_id);
    if (!schedule) {
      summary.unknownSchedules += 1;
      continue;
    }

    if (!isPlainObject(change.day_changes)) {
      summary.invalidEntries += 1;
      continue;
    }

    const normalizedDays = normalizeScheduleDays(schedule.days, month, year);
    const validDayChanges = {};

    for (const [rawDay, rawShift] of Object.entries(change.day_changes)) {
      const day = Number(rawDay);

      if (!Number.isInteger(day) || day < 1 || day > totalDays) {
        summary.invalidDays += 1;
        continue;
      }

      if (!isValidShift(rawShift)) {
        summary.invalidShifts += 1;
        continue;
      }

      validDayChanges[String(day)] = rawShift;
    }

    if (Object.keys(validDayChanges).length === 0) {
      summary.emptyChanges += 1;
      continue;
    }

    applicableChanges.push({
      schedule,
      employeeName: change.employee_name || schedule.employee_name,
      scheduleId: change.schedule_id,
      newDays: { ...normalizedDays, ...validDayChanges },
      validDayChanges,
    });
  }

  return {
    applicableChanges,
    summary,
  };
}

export function buildOutcomeMessage({
  appliedSchedules,
  appliedDays,
  failedUpdates,
  explanation,
  summary,
}) {
  const details = [];

  if (explanation) {
    details.push(explanation);
  }

  if (appliedSchedules > 0) {
    details.push(
      `${appliedSchedules} escala(s) atualizada(s) com ${appliedDays} alteracao(oes) de dia.`
    );
  }

  if (summary.unknownSchedules > 0) {
    details.push(
      `${summary.unknownSchedules} alteracao(oes) foram ignoradas por apontarem para escalas inexistentes.`
    );
  }

  if (summary.invalidDays > 0) {
    details.push(
      `${summary.invalidDays} dia(s) invalido(s) foram descartados na resposta da IA.`
    );
  }

  if (summary.invalidShifts > 0) {
    details.push(
      `${summary.invalidShifts} turno(s) invalido(s) foram descartados na resposta da IA.`
    );
  }

  if (summary.invalidEntries > 0 || summary.emptyChanges > 0) {
    details.push(
      `${summary.invalidEntries + summary.emptyChanges} bloco(s) de alteracao nao puderam ser aproveitados.`
    );
  }

  if (failedUpdates > 0) {
    details.push(
      `${failedUpdates} atualizacao(oes) falharam durante a persistencia.`
    );
  }

  return details.join(" ");
}

export function getOutcomeState(appliedSchedules, failedUpdates) {
  if (appliedSchedules > 0 && failedUpdates === 0) {
    return {
      tone: "success",
      title: "Comando aplicado",
    };
  }

  if (appliedSchedules > 0 || failedUpdates > 0) {
    return {
      tone: "warning",
      title: "Comando aplicado com ressalvas",
    };
  }

  return {
    tone: "neutral",
    title: "Nenhuma alteracao aplicada",
  };
}

export function buildCommandPrompt({
  command,
  employees,
  schedules,
  month,
  year,
}) {
  const employeeNames = employees
    .map((employee) => `${employee.name} (id: ${employee.id})`)
    .join(", ");

  const scheduleInfo = schedules
    .map(
      (schedule) =>
        `${schedule.employee_name} (schedule_id: ${schedule.id}): ${JSON.stringify(
          normalizeScheduleDays(schedule.days, month, year)
        )}`
    )
    .join("\n");

  return `Voce e um assistente de escalas de trabalho. O mes e ${getMonthName(
    month,
    year
  )} ${year} com ${getDaysInMonth(month, year)} dias.

Colaboradores: ${employeeNames}

Escalas atuais:
${scheduleInfo || "Nenhuma escala gerada ainda."}

O usuario enviou o seguinte comando:
"${command}"

Analise o comando e retorne apenas modificacoes validas para as escalas existentes.
Use "T" para Trabalho, "F" para Folga e "M" para Madrugada.

Regras importantes:
- Domingo e dia 0
- "Ultimo domingo do mes" significa o ultimo dia do mes que cai em domingo
- "Toda quarta" significa todos os dias que sao quarta-feira no mes
- Nunca invente schedule_id
- Nunca altere dias fora do mes informado
- Se o colaborador nao tem escala ainda, nao modifique

Retorne um JSON com as modificacoes.`;
}

export async function applyCommandFlow({
  command,
  employees,
  schedules,
  month,
  year,
  services,
}) {
  const normalizedCommand = normalizeCommandText(command);
  const inputError = validateCommandInput(normalizedCommand, employees, schedules);

  if (inputError) {
    return {
      ok: false,
      error: inputError,
      errorPhase: "input",
    };
  }

  const result = await services.invokeLlm({
    prompt: buildCommandPrompt({
      command: normalizedCommand,
      employees,
      schedules,
      month,
      year,
    }),
    responseJsonSchema: {
      type: "object",
      properties: {
        changes: {
          type: "array",
          items: {
            type: "object",
            properties: {
              schedule_id: { type: "string" },
              employee_name: { type: "string" },
              day_changes: {
                type: "object",
                additionalProperties: { type: "string" },
              },
            },
          },
        },
        explanation: { type: "string" },
        error: { type: "string" },
      },
    },
  });

  const payloadError = validateLlmPayload(result);
  if (payloadError) {
    return {
      ok: false,
      error: payloadError,
      errorPhase: "llm",
    };
  }

  const { applicableChanges, summary } = collectApplicableChanges(
    result.changes || [],
    schedules,
    month,
    year
  );

  let appliedSchedules = 0;
  let appliedDays = 0;
  let failedUpdates = 0;

  for (const change of applicableChanges) {
    try {
      await services.updateScheduleDays(change.scheduleId, change.newDays);
      appliedSchedules += 1;
      appliedDays += Object.keys(change.validDayChanges).length;
    } catch {
      failedUpdates += 1;
    }
  }

  const outcomeState = getOutcomeState(appliedSchedules, failedUpdates);
  const outcomeMessage = buildOutcomeMessage({
    appliedSchedules,
    appliedDays,
    failedUpdates,
    explanation: result.explanation,
    summary,
  });

  if (appliedSchedules > 0) {
    await services.createScheduleRule({
      rule_text: normalizedCommand,
      active: true,
      employee_name: applicableChanges[0]?.employeeName || "Geral",
    });
  }

  return {
    ok: true,
    normalizedCommand,
    summary,
    applicableChanges,
    appliedSchedules,
    appliedDays,
    failedUpdates,
    outcomeState,
    outcomeMessage,
    rules: await services.listScheduleRules("-created_date", 20),
    schedules: await services.listSchedulesByPeriod({ month, year }),
  };
}

export async function deleteRuleFlow({ rule, services }) {
  await services.deleteScheduleRule(rule.id);

  return {
    rules: await services.listScheduleRules("-created_date", 20),
  };
}
