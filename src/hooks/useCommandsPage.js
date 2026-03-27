// @ts-nocheck
import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

import { useToast } from "@/components/ui/use-toast";
import { getDaysInMonth, getMonthName, isValidShift, normalizeScheduleDays } from "@/lib/scheduleUtils";
import { listEmployees } from "@/services/employeeService";
import { invokeLlm } from "@/services/llmService";
import {
  createScheduleRule,
  deleteScheduleRule,
  listScheduleRules,
} from "@/services/scheduleRuleService";
import { listSchedulesByPeriod, updateScheduleDays } from "@/services/scheduleService";

const MIN_COMMAND_LENGTH = 8;

function normalizeCommandText(value) {
  return value.trim().replace(/\s+/g, " ");
}

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateCommandInput(commandText, employees, schedules) {
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

function validateLlmPayload(result) {
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

function collectApplicableChanges(changes, schedules, month, year) {
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

function buildOutcomeMessage({
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

function getOutcomeState(appliedSchedules, failedUpdates) {
  if (appliedSchedules > 0 && failedUpdates === 0) {
    return {
      icon: CheckCircle2,
      tone: "success",
      title: "Comando aplicado",
    };
  }

  if (appliedSchedules > 0 || failedUpdates > 0) {
    return {
      icon: AlertTriangle,
      tone: "warning",
      title: "Comando aplicado com ressalvas",
    };
  }

  return {
    icon: Info,
    tone: "neutral",
    title: "Nenhuma alteracao aplicada",
  };
}

export function useCommandsPage() {
  const now = new Date();
  const [month] = useState(now.getMonth() + 1);
  const [year] = useState(now.getFullYear());
  const [command, setCommand] = useState("");
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [history, setHistory] = useState([]);
  const [commandError, setCommandError] = useState("");
  const [lastOutcome, setLastOutcome] = useState(null);
  const [loadError, setLoadError] = useState("");
  const { toast } = useToast();

  async function loadCommandsPage() {
    setLoading(true);

    try {
      setLoadError("");
      const [employeeList, ruleList, scheduleList] = await Promise.all([
        listEmployees(),
        listScheduleRules("-created_date", 20),
        listSchedulesByPeriod({ month, year }),
      ]);

      setEmployees(employeeList);
      setRules(ruleList);
      setSchedules(scheduleList);
    } catch (error) {
      setLoadError(
        error?.message || "Nao foi possivel carregar os dados de comandos."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCommandsPage();
  }, [month, year]);

  async function reloadRulesAndSchedules() {
    try {
      const [ruleList, scheduleList] = await Promise.all([
        listScheduleRules("-created_date", 20),
        listSchedulesByPeriod({ month, year }),
      ]);

      setRules(ruleList);
      setSchedules(scheduleList);
    } catch (error) {
      toast({
        title: "Falha ao atualizar a pagina",
        description:
          error?.message || "Nao foi possivel recarregar regras e escalas.",
        variant: "destructive",
      });
    }
  }

  function handleCommandChange(value) {
    setCommand(value);
    setCommandError("");
  }

  function applyExampleCommand(value) {
    setCommand(value);
    setCommandError("");
  }

  async function handleSend() {
    const normalizedCommand = normalizeCommandText(command);
    const inputError = validateCommandInput(
      normalizedCommand,
      employees,
      schedules
    );

    if (inputError) {
      setCommandError(inputError);
      setLastOutcome(null);
      toast({
        title: "Comando invalido",
        description: inputError,
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    setCommandError("");
    setLastOutcome(null);

    try {
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

      const prompt = `Voce e um assistente de escalas de trabalho. O mes e ${getMonthName(
        month,
        year
      )} ${year} com ${getDaysInMonth(month, year)} dias.

Colaboradores: ${employeeNames}

Escalas atuais:
${scheduleInfo || "Nenhuma escala gerada ainda."}

O usuario enviou o seguinte comando:
"${normalizedCommand}"

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

      const result = await invokeLlm({
        prompt,
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
        setCommandError(payloadError);
        setLastOutcome(null);
        toast({
          title: "Erro no processamento da IA",
          description: payloadError,
          variant: "destructive",
        });
        return;
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
          await updateScheduleDays(change.scheduleId, change.newDays);
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

      setLastOutcome({
        ...outcomeState,
        description:
          outcomeMessage || "A IA nao retornou alteracoes aplicaveis para o periodo.",
      });

      if (appliedSchedules > 0) {
        await createScheduleRule({
          rule_text: normalizedCommand,
          active: true,
          employee_name: applicableChanges[0]?.employeeName || "Geral",
        });
      }

      setHistory((current) => [
        {
          command: normalizedCommand,
          result:
            outcomeMessage || "A IA nao retornou alteracoes aplicaveis para o periodo.",
          status: outcomeState.title,
          time: new Date().toLocaleTimeString("pt-BR"),
        },
        ...current,
      ]);

      toast({
        title: outcomeState.title,
        description:
          outcomeMessage || "A IA nao retornou alteracoes aplicaveis para o periodo.",
        variant: failedUpdates > 0 ? "destructive" : undefined,
      });

      if (appliedSchedules > 0) {
        setCommand("");
        await reloadRulesAndSchedules();
        return;
      }

      await reloadRulesAndSchedules();
    } catch (error) {
      const message =
        error?.message || "Nao foi possivel processar o comando.";

      setCommandError(message);
      setLastOutcome(null);
      toast({
        title: "Falha ao aplicar comando",
        description: message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  }

  async function handleDeleteRule(rule) {
    try {
      await deleteScheduleRule(rule.id);
      setRules((current) => current.filter((item) => item.id !== rule.id));
      toast({ title: "Regra removida" });
    } catch (error) {
      toast({
        title: "Erro ao remover regra",
        description: error?.message || "Nao foi possivel remover a regra.",
        variant: "destructive",
      });
    }
  }

  const commandPrerequisite =
    employees.length === 0
      ? {
          title: "Nenhum colaborador disponivel",
          description:
            "Cadastre colaboradores antes de enviar comandos em linguagem natural.",
          actionLabel: "Cadastrar colaboradores",
          actionPath: "/colaboradores",
          actionVariant: "default",
        }
      : schedules.length === 0
        ? {
            title: "Nenhuma escala neste periodo",
            description: `Gere a escala de ${getMonthName(
              month,
              year
            )} ${year} antes de aplicar comandos da IA.`,
            actionLabel: "Abrir escala",
            actionPath: "/escala",
            actionVariant: "outline",
          }
        : null;

  return {
    month,
    year,
    command,
    processing,
    loading,
    rules,
    history,
    commandError,
    lastOutcome,
    loadError,
    commandPrerequisite,
    handleCommandChange,
    applyExampleCommand,
    handleSend,
    handleDeleteRule,
    reloadCommandsPage: loadCommandsPage,
  };
}
