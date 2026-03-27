// @ts-nocheck
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Info,
  Loader2,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";

import { db } from "@/API/base44Client";
import { Button } from "@/components/ui/button";
import PageState from "@/components/ui/page-state";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  getDaysInMonth,
  getMonthName,
  isValidShift,
  normalizeScheduleDays,
} from "@/lib/scheduleUtils";

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

function getOutcomeClasses(tone) {
  if (tone === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-900";
  }

  if (tone === "warning") {
    return "border-amber-200 bg-amber-50 text-amber-900";
  }

  return "border-slate-200 bg-slate-50 text-slate-800";
}

export default function Commands() {
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
  const OutcomeIcon = lastOutcome?.icon;

  async function loadPageData() {
    setLoading(true);

    try {
      setLoadError("");
      const [employeeList, ruleList, scheduleList] = await Promise.all([
        db.entities.Employee.list(),
        db.entities.ScheduleRule.list("-created_date", 20),
        db.entities.Schedule.filter({ month, year }),
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
    void loadPageData();
  }, [month, year]);

  async function reloadRulesAndSchedules() {
    try {
      const [ruleList, scheduleList] = await Promise.all([
        db.entities.ScheduleRule.list("-created_date", 20),
        db.entities.Schedule.filter({ month, year }),
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

      const result = await db.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
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
          await db.entities.Schedule.update(change.scheduleId, {
            days: change.newDays,
          });
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
        await db.entities.ScheduleRule.create({
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
      await db.entities.ScheduleRule.delete(rule.id);
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

  const examples = [
    "RENAN folga toda quarta-feira",
    "BRUNO folga nos dias 6 e 20",
    "ANDRESSA trabalha de madrugada todo sabado",
    "PAULO folga todo ultimo domingo do mes",
    "Todos folgam no dia 25",
  ];
  const commandPrerequisite =
    employees.length === 0
      ? {
          title: "Nenhum colaborador disponivel",
          description:
            "Cadastre colaboradores antes de enviar comandos em linguagem natural.",
          action: (
            <Button asChild>
              <Link to="/colaboradores">Cadastrar colaboradores</Link>
            </Button>
          ),
        }
      : schedules.length === 0
        ? {
            title: "Nenhuma escala neste periodo",
            description: `Gere a escala de ${getMonthName(
              month,
              year
            )} ${year} antes de aplicar comandos da IA.`,
            action: (
              <Button asChild variant="outline">
                <Link to="/escala">Abrir escala</Link>
              </Button>
            ),
          }
        : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Comandos IA</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Escreva regras em linguagem natural para modificar escalas de{" "}
          {getMonthName(month, year)} {year}
        </p>
      </div>
      {loading ? (
        <PageState
          description="Carregando colaboradores, escalas do periodo e regras salvas."
          state="loading"
          title="Carregando comandos"
        />
      ) : loadError ? (
        <PageState
          action={
            <Button
              onClick={() => {
                void loadPageData();
              }}
            >
              Tentar novamente
            </Button>
          }
          description={loadError}
          state="error"
          title="Falha ao carregar comandos"
        />
      ) : commandPrerequisite ? (
        <PageState
          action={commandPrerequisite.action}
          description={commandPrerequisite.description}
          state="empty"
          title={commandPrerequisite.title}
        />
      ) : (
        <>
          <div className="space-y-4 rounded-xl border border-border bg-card p-6">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="font-heading font-semibold">Novo comando</h2>
            </div>
            <Textarea
              className="min-h-[100px] resize-none"
              onChange={(event) => {
                setCommand(event.target.value);
                setCommandError("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                  void handleSend();
                }
              }}
              placeholder="Ex: RENAN folga toda quarta-feira, mas trabalha no ultimo domingo do mes..."
              value={command}
            />
            {commandError ? (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {commandError}
              </div>
            ) : null}
            {lastOutcome ? (
              <div
                className={`rounded-lg border px-3 py-3 text-sm ${getOutcomeClasses(
                  lastOutcome.tone
                )}`}
              >
                <div className="flex items-start gap-2">
                  <OutcomeIcon className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <div>
                    <p className="font-medium">{lastOutcome.title}</p>
                    <p className="mt-1 leading-relaxed">
                      {lastOutcome.description}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Pressione Ctrl+Enter para enviar
              </p>
              <Button
                className="gap-2"
                disabled={processing || !command.trim()}
                onClick={() => {
                  void handleSend();
                }}
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Aplicar comando
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-3 font-heading text-sm font-semibold">
              Exemplos de comandos
            </h3>
            <div className="flex flex-wrap gap-2">
              {examples.map((example) => (
                <button
                  key={example}
                  className="rounded-lg bg-primary/5 px-3 py-2 text-xs text-primary transition-colors hover:bg-primary/10"
                  onClick={() => {
                    setCommand(example);
                    setCommandError("");
                  }}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {!loading && !loadError ? (
        <>
          {history.length > 0 ? (
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-3 flex items-center gap-2 font-heading text-sm font-semibold">
                <Clock className="h-4 w-4" /> Historico da sessao
              </h3>
              <div className="space-y-3">
                {history.map((item, index) => (
                  <div
                    key={`${item.time}-${index}`}
                    className="rounded-lg bg-muted/50 p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">"{item.command}"</p>
                      <span className="text-[10px] text-muted-foreground">
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.result}
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {item.time}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-3 font-heading text-sm font-semibold">
              Regras salvas
            </h3>
            {rules.length === 0 ? (
              <PageState
                className="border-dashed bg-muted/20 shadow-none"
                compact
                description="As regras aplicadas pela IA serao registradas aqui para consulta e exclusao manual."
                state="empty"
                title="Nenhuma regra salva ainda"
              />
            ) : (
              <div className="space-y-2">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between rounded-lg bg-muted/30 p-3"
                  >
                    <div>
                      <p className="text-sm">{rule.rule_text}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {rule.employee_name || "Geral"} -{" "}
                        {new Date(rule.created_date).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <button
                      className="rounded-md p-1.5 transition-colors hover:bg-destructive/10"
                      onClick={() => {
                        void handleDeleteRule(rule);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
