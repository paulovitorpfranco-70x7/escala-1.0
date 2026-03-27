import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Calendar,
  MessageSquare,
  TrendingUp,
  Users,
} from "lucide-react";

import { db } from "@/API/base44Client";
import { getMonthName } from "@/lib/scheduleUtils";

export default function Dashboard() {
  const [employees, setEmployees] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  useEffect(() => {
    async function load() {
      try {
        const [employeeList, scheduleList, ruleList] = await Promise.all([
          db.entities.Employee.list(),
          db.entities.Schedule.filter({
            month: currentMonth,
            year: currentYear,
          }),
          db.entities.ScheduleRule.list(),
        ]);

        setEmployees(employeeList);
        setSchedules(scheduleList);
        setRules(ruleList);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [currentMonth, currentYear]);

  const totalFolgas = schedules.reduce((sum, schedule) => {
    return (
      sum + Object.values(schedule.days || {}).filter((value) => value === "F").length
    );
  }, 0);

  const stats = [
    {
      label: "Colaboradores",
      value: employees.length,
      icon: Users,
      color: "bg-primary/10 text-primary",
      link: "/colaboradores",
    },
    {
      label: `Escalas ${getMonthName(currentMonth, currentYear)}`,
      value: schedules.length,
      icon: Calendar,
      color: "bg-accent/10 text-accent",
      link: "/escala",
    },
    {
      label: "Regras ativas",
      value: rules.filter((rule) => rule.active).length,
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

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

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
              <p className="text-xs text-muted-foreground">Gerenciar equipe</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
