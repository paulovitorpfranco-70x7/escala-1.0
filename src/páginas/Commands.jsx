const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Send, Loader2, Sparkles, Trash2, Clock } from "lucide-react";
import { getMonthName, getDaysInMonth } from "../lib/scheduleUtils";
import moment from "moment";

export default function Commands() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [command, setCommand] = useState("");
  const [processing, setProcessing] = useState(false);
  const [rules, setRules] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [history, setHistory] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    async function load() {
      const [emps, rls, scheds] = await Promise.all([
        db.entities.Employee.list(),
        db.entities.ScheduleRule.list("-created_date", 20),
        db.entities.Schedule.filter({ month, year }),
      ]);
      setEmployees(emps);
      setRules(rls);
      setSchedules(scheds);
    }
    load();
  }, [month, year]);

  const handleSend = async () => {
    if (!command.trim()) return;
    setProcessing(true);

    const employeeNames = employees.map(e => `${e.name} (id: ${e.id})`).join(", ");
    const scheduleInfo = schedules.map(s => `${s.employee_name} (schedule_id: ${s.id}): ${JSON.stringify(s.days)}`).join("\n");

    const prompt = `Você é um assistente de escalas de trabalho. O mês é ${getMonthName(month)} ${year} com ${getDaysInMonth(month, year)} dias.

Colaboradores: ${employeeNames}

Escalas atuais:
${scheduleInfo || "Nenhuma escala gerada ainda."}

O usuário enviou o seguinte comando:
"${command}"

Analise o comando e retorne as modificações necessárias nas escalas. 
Use "T" para Trabalho, "F" para Folga, "M" para Madrugada.

Regras importantes:
- Domingo é dia 0 no moment.js (0=dom, 1=seg, 2=ter, 3=qua, 4=qui, 5=sex, 6=sab)
- "Último domingo do mês" = encontre o último dia do mês que cai em domingo
- "Toda quarta" = todos os dias que são quarta-feira no mês
- Se o colaborador não tem escala ainda, não modifique

Retorne um JSON com as modificações.`;

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
                  additionalProperties: { type: "string" }
                }
              }
            }
          },
          explanation: { type: "string" },
          error: { type: "string" }
        }
      }
    });

    if (result.error) {
      toast({ title: "Erro", description: result.error, variant: "destructive" });
      setProcessing(false);
      return;
    }

    // Apply changes
    let appliedCount = 0;
    for (const change of (result.changes || [])) {
      const schedule = schedules.find(s => s.id === change.schedule_id);
      if (schedule && change.day_changes) {
        const newDays = { ...schedule.days, ...change.day_changes };
        await db.entities.Schedule.update(schedule.id, { days: newDays });
        appliedCount++;
      }
    }

    // Save rule
    await db.entities.ScheduleRule.create({
      rule_text: command,
      active: true,
      employee_name: result.changes?.[0]?.employee_name || "Geral",
    });

    setHistory(prev => [{
      command,
      result: result.explanation || `${appliedCount} escala(s) modificada(s)`,
      time: new Date().toLocaleTimeString(),
    }, ...prev]);

    toast({ title: "Comando aplicado!", description: result.explanation });
    setCommand("");
    setProcessing(false);

    // Reload schedules
    const updatedScheds = await db.entities.Schedule.filter({ month, year });
    setSchedules(updatedScheds);
  };

  const handleDeleteRule = async (rule) => {
    await db.entities.ScheduleRule.delete(rule.id);
    setRules(prev => prev.filter(r => r.id !== rule.id));
    toast({ title: "Regra removida" });
  };

  const examples = [
    "RENAN folga toda quarta-feira",
    "BRUNO folga nos dias 6 e 20",
    "ANDRESSA trabalha de madrugada todo sábado",
    "PAULO folga todo último domingo do mês",
    "Todos folgam no dia 25",
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Comandos IA</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Escreva regras em linguagem natural para criar e modificar escalas — {getMonthName(month)} {year}
        </p>
      </div>

      {/* Command Input */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="font-heading font-semibold">Novo Comando</h2>
        </div>
        <Textarea
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="Ex: RENAN folga toda quarta-feira, mas trabalha no último domingo do mês..."
          className="min-h-[100px] resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSend();
          }}
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Pressione Ctrl+Enter para enviar</p>
          <Button onClick={handleSend} disabled={processing || !command.trim()} className="gap-2">
            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Aplicar Comando
          </Button>
        </div>
      </div>

      {/* Examples */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-heading font-semibold text-sm mb-3">Exemplos de Comandos</h3>
        <div className="flex flex-wrap gap-2">
          {examples.map((ex) => (
            <button
              key={ex}
              onClick={() => setCommand(ex)}
              className="text-xs px-3 py-2 bg-primary/5 hover:bg-primary/10 text-primary rounded-lg transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-heading font-semibold text-sm mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Histórico da Sessão
          </h3>
          <div className="space-y-3">
            {history.map((h, i) => (
              <div key={i} className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium">"{h.command}"</p>
                <p className="text-xs text-muted-foreground mt-1">{h.result}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{h.time}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Saved Rules */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-heading font-semibold text-sm mb-3">Regras Salvas</h3>
        {rules.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma regra salva ainda.</p>
        ) : (
          <div className="space-y-2">
            {rules.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-sm">{rule.rule_text}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {rule.employee_name || "Geral"} • {new Date(rule.created_date).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteRule(rule)}
                  className="p-1.5 hover:bg-destructive/10 rounded-md transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}