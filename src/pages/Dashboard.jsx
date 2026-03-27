// @ts-nocheck
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Calendar,
  MessageSquare,
  TrendingUp,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import PageState from "@/components/ui/page-state";
import { useDashboardPage } from "@/hooks/useDashboardPage";
import { getMonthName } from "@/lib/scheduleUtils";

export default function Dashboard() {
  const {
    currentMonth,
    currentYear,
    employeeCount,
    scheduleCount,
    activeRuleCount,
    totalFolgas,
    isEmpty,
    loading,
    loadError,
    reloadDashboard,
  } = useDashboardPage();

  const stats = [
    {
      label: "Colaboradores",
      value: employeeCount,
      icon: Users,
      color: "bg-primary/10 text-primary",
      link: "/colaboradores",
    },
    {
      label: `Escalas ${getMonthName(currentMonth, currentYear)}`,
      value: scheduleCount,
      icon: Calendar,
      color: "bg-accent/10 text-accent",
      link: "/escala",
    },
    {
      label: "Regras ativas",
      value: activeRuleCount,
      icon: MessageSquare,
      color: "bg-purple-100 text-purple-700",
      link: "/comandos",
    },
    {
      label: "Total de folgas",
      value: totalFolgas,
      icon: TrendingUp,
      color: "bg-emerald-100 text-emerald-700",
      link: "/escala",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">
          Painel de controle
        </h1>
        <p className="mt-1 text-muted-foreground">
          Visao geral das escalas - {getMonthName(currentMonth, currentYear)}{" "}
          {currentYear}
        </p>
      </div>
      {loading ? (
        <PageState
          description="Buscando indicadores e atalhos do periodo atual."
          state="loading"
          title="Carregando painel"
        />
      ) : loadError ? (
        <PageState
          action={
            <Button
              onClick={() => {
                void reloadDashboard();
              }}
            >
              Tentar novamente
            </Button>
          }
          description={loadError}
          state="error"
          title="Falha ao carregar painel"
        />
      ) : isEmpty ? (
        <PageState
          action={
            <>
              <Button asChild>
                <Link to="/colaboradores">Cadastrar colaboradores</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/escala">Abrir escala</Link>
              </Button>
            </>
          }
          description="Cadastre colaboradores e gere a primeira escala para alimentar os indicadores do painel."
          state="empty"
          title="Painel sem dados iniciais"
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Link
                key={stat.label}
                className="group rounded-xl border border-border bg-card p-5 transition-all duration-300 hover:border-primary/20 hover:shadow-lg"
                to={stat.link}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.color}`}
                  >
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <div className="mt-4">
                  <p className="font-heading text-2xl font-bold text-foreground">
                    {stat.value}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 font-heading text-lg font-semibold">
              Acesso rapido
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Link
                className="flex items-center gap-3 rounded-lg bg-primary/5 p-4 transition-colors hover:bg-primary/10"
                to="/escala"
              >
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Ver escala</p>
                  <p className="text-xs text-muted-foreground">
                    Visualizar e editar a escala do mes
                  </p>
                </div>
              </Link>
              <Link
                className="flex items-center gap-3 rounded-lg bg-accent/5 p-4 transition-colors hover:bg-accent/10"
                to="/comandos"
              >
                <MessageSquare className="h-5 w-5 text-accent" />
                <div>
                  <p className="text-sm font-medium">Comandos IA</p>
                  <p className="text-xs text-muted-foreground">
                    Criar escala com texto natural
                  </p>
                </div>
              </Link>
              <Link
                className="flex items-center gap-3 rounded-lg bg-purple-50 p-4 transition-colors hover:bg-purple-100"
                to="/colaboradores"
              >
                <Users className="h-5 w-5 text-purple-700" />
                <div>
                  <p className="text-sm font-medium">Colaboradores</p>
                  <p className="text-xs text-muted-foreground">
                    Gerenciar equipe
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
