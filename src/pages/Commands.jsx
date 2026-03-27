import { useEffect, useState } from "react";
import { Clock, Loader2, Send, Sparkles, Trash2 } from "lucide-react";

import { db } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { getDaysInMonth, getMonthName } from "@/lib/scheduleUtils";

export default function Commands() {
  const now = new Date();
  const [month] = useState(now.getMonth() + 1);
  const [year] = useState(now.getFullYear());
  const [command, setCommand] = useState("");
  const [processing, setProcessing] = useState(false);
  const [rules, setRules] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [history, setHistory] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    async function load() {
      const [employeeList, ruleList, scheduleList] = await Promise.all([
        db.entities.Employee.list(),
        db.entities.ScheduleRule.list("-created_date", 20),
        db.entities.Schedule.filter({ month, year }),
      ]);

      setEmployees(employeeList);
      setRules(ruleList);
      setSchedules(scheduleList);
    }

    void load();
  }, [month, year]);

  async function reloadRulesAndSchedules() {
    const [ruleList, scheduleList] = await Promise.all([
      db.entities.ScheduleRule.list("-created_date", 20),
      db.entities.Schedule.filter({ month, year }),
    ]);

    setRules(ruleList);
    setSchedules(scheduleList);
  }

  async function handleSend() {
    if (!command.trim()) {
      return;
    }

    setProcessing(true);

    try {
      const employeeNames = employees
        .map((employee) => `${employee.name} (id: ${employee.id})`)
        .join(", ");

      const scheduleInfo = schedules
        .map(
          (schedule) =>
            `${schedule.employee_name} (schedule_id: ${schedule.id}): ${JSON.stringify(
              schedule.days
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
"${command}"

Analise o comando e retorne as modificacoes necessarias nas escalas.
Use "T" para Trabalho, "F" para Folga e "M" para Madrugada.

Regras importantes:
- Domingo e dia 0
- "Ultimo domingo do mes" significa o ultimo dia do mes que cai em domingo
- "Toda quarta" significa todos os dias que sao quarta-feira no mes
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

      if (result.error) {
        toast({
          title: "Erro",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      let appliedCount = 0;

      for (const change of result.changes || []) {
        const schedule = schedules.find(
          (currentSchedule) => currentSchedule.id === change.schedule_id
        );

        if (schedule && change.day_changes) {
          const newDays = { ...schedule.days, ...change.day_changes };
          await db.entities.Schedule.update(schedule.id, { days: newDays });
          appliedCount += 1;
        }
      }

      await db.entities.ScheduleRule.create({
        rule_text: command,
        active: true,
        employee_name: result.changes?.[0]?.employee_name || "Geral",
      });

      setHistory((current) => [
        {
          command,
          result:
            result.explanation || `${appliedCount} escala(s) modificada(s)`,
          time: new Date().toLocaleTimeString("pt-BR"),
        },
        ...current,
      ]);

      toast({
        title: "Comando aplicado",
        description: result.explanation || "Alteracoes persistidas com sucesso.",
      });

      setCommand("");
      await reloadRulesAndSchedules();
    } catch (error) {
      toast({
        title: "Falha ao aplicar comando",
        description: error?.message || "Nao foi possivel processar o comando.",
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

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Comandos IA</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Escreva regras em linguagem natural para modificar escalas de{" "}
          {getMonthName(month, year)} {year}
        </p>
      </div>

      <div className="space-y-4 rounded-xl border border-border bg-card p-6">
        <div className="mb-2 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="font-heading font-semibold">Novo comando</h2>
        </div>
        <Textarea
          className="min-h-[100px] resize-none"
          onChange={(event) => setCommand(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              void handleSend();
            }
          }}
          placeholder="Ex: RENAN folga toda quarta-feira, mas trabalha no ultimo domingo do mes..."
          value={command}
        />
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
              onClick={() => setCommand(example)}
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {history.length > 0 ? (
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="mb-3 flex items-center gap-2 font-heading text-sm font-semibold">
            <Clock className="h-4 w-4" /> Historico da sessao
          </h3>
          <div className="space-y-3">
            {history.map((item, index) => (
              <div key={`${item.time}-${index}`} className="rounded-lg bg-muted/50 p-3">
                <p className="text-sm font-medium">"{item.command}"</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.result}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {item.time}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-3 font-heading text-sm font-semibold">Regras salvas</h3>
        {rules.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma regra salva ainda.
          </p>
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
    </div>
  );
}
