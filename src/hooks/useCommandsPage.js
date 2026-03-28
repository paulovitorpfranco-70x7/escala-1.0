// @ts-nocheck
import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

import { useToast } from "@/components/ui/use-toast";
import { applyCommandFlow, deleteRuleFlow } from "@/lib/commandFlow";
import { getMonthName } from "@/lib/scheduleUtils";
import { listEmployees } from "@/services/employeeService";
import { invokeLlm } from "@/services/llmService";
import {
  createScheduleRule,
  deleteScheduleRule,
  listScheduleRules,
} from "@/services/scheduleRuleService";
import { listSchedulesByPeriod, updateScheduleDays } from "@/services/scheduleService";

function getOutcomeIcon(tone) {
  if (tone === "success") {
    return CheckCircle2;
  }

  if (tone === "warning") {
    return AlertTriangle;
  }

  return Info;
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
  const commandServices = {
    createScheduleRule,
    deleteScheduleRule,
    invokeLlm,
    listScheduleRules,
    listSchedulesByPeriod,
    updateScheduleDays,
  };

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

  function handleCommandChange(value) {
    setCommand(value);
    setCommandError("");
  }

  function applyExampleCommand(value) {
    setCommand(value);
    setCommandError("");
  }

  async function handleSend() {
    setProcessing(true);
    setCommandError("");
    setLastOutcome(null);

    try {
      const result = await applyCommandFlow({
        command,
        employees,
        schedules,
        month,
        year,
        services: commandServices,
      });

      if (!result.ok) {
        setCommandError(result.error);
        toast({
          title:
            result.errorPhase === "llm"
              ? "Erro no processamento da IA"
              : "Comando invalido",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      const outcomeDescription =
        result.outcomeMessage ||
        "A IA nao retornou alteracoes aplicaveis para o periodo.";
      const outcomeState = {
        ...result.outcomeState,
        icon: getOutcomeIcon(result.outcomeState.tone),
      };

      setLastOutcome({
        ...outcomeState,
        description: outcomeDescription,
      });
      setRules(result.rules);
      setSchedules(result.schedules);
      setHistory((current) => [
        {
          command: result.normalizedCommand,
          result: outcomeDescription,
          status: outcomeState.title,
          time: new Date().toLocaleTimeString("pt-BR"),
        },
        ...current,
      ]);

      toast({
        title: outcomeState.title,
        description: outcomeDescription,
        variant: result.failedUpdates > 0 ? "destructive" : undefined,
      });

      if (result.appliedSchedules > 0) {
        setCommand("");
      }
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
      const result = await deleteRuleFlow({
        rule,
        services: commandServices,
      });
      setRules(result.rules);
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
