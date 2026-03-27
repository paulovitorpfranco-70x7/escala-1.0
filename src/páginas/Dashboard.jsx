const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from "react";

import { Link } from "react-router-dom";
import { Calendar, Users, MessageSquare, ArrowRight, TrendingUp } from "lucide-react";
import { getMonthName } from "../lib/scheduleUtils";

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
      const [emps, scheds, rls] = await Promise.all([
        db.entities.Employee.list(),
        db.entities.Schedule.filter({ month: currentMonth, year: currentYear }),
        db.entities.ScheduleRule.list(),
      ]);
      setEmployees(emps);
      setSchedules(scheds);
      setRules(rls);
      setLoading(false);
    }
    load();
  }, []);

  const totalFolgas = schedules.reduce((sum, s) => {
    return sum + Object.values(s.days || {}).filter(v => v === "F").length;
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
      label: `Escalas ${getMonthName(currentMonth)}`,
      value: schedules.length,
      icon: Calendar,
      color: "bg-accent/10 text-accent",
      link: "/escala",
    },
    {
      label: "Regras Ativas",
      value: rules.filter(r => r.active).length,
      icon: MessageSquare,
      color: "bg-purple-100 text-purple-700",
      link: "/comandos",
    },
    {
      label: "Total Folgas (Mês)",
      value: totalFolgas,
      icon: TrendingUp,
      color: "bg-emerald-100 text-emerald-700",
      link: "/escala",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Painel de Controle</h1>
        <p className="text-muted-foreground mt-1">
          Visão geral das escalas — {getMonthName(currentMonth)} {currentYear}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            to={stat.link}
            className="group bg-card border border-border rounded-xl p-5 hover:shadow-lg hover:border-primary/20 transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="mt-4">
              <p className="text-2xl font-heading font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-heading text-lg font-semibold mb-4">Acesso Rápido</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            to="/escala"
            className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors"
          >
            <Calendar className="w-5 h-5 text-primary" />
            <div>
              <p className="font-medium text-sm">Ver Escala</p>
              <p className="text-xs text-muted-foreground">Visualizar e editar escala do mês</p>
            </div>
          </Link>
          <Link
            to="/comandos"
            className="flex items-center gap-3 p-4 rounded-lg bg-accent/5 hover:bg-accent/10 transition-colors"
          >
            <MessageSquare className="w-5 h-5 text-accent" />
            <div>
              <p className="font-medium text-sm">Comandos IA</p>
              <p className="text-xs text-muted-foreground">Criar escala com texto natural</p>
            </div>
          </Link>
          <Link
            to="/colaboradores"
            className="flex items-center gap-3 p-4 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors"
          >
            <Users className="w-5 h-5 text-purple-700" />
            <div>
              <p className="font-medium text-sm">Colaboradores</p>
              <p className="text-xs text-muted-foreground">Gerenciar equipe</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}