// @ts-nocheck
import { Clock, Loader2, Send, Sparkles, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import PageState from "@/components/ui/page-state";
import { Textarea } from "@/components/ui/textarea";
import { useCommandsPage } from "@/hooks/useCommandsPage";
import { getMonthName } from "@/lib/scheduleUtils";

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
  const {
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
    reloadCommandsPage,
  } = useCommandsPage();
  const OutcomeIcon = lastOutcome?.icon;

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
                void reloadCommandsPage();
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
          action={
            <Button asChild variant={commandPrerequisite.actionVariant}>
              <Link to={commandPrerequisite.actionPath}>
                {commandPrerequisite.actionLabel}
              </Link>
            </Button>
          }
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
                handleCommandChange(event.target.value);
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
                    applyExampleCommand(example);
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
