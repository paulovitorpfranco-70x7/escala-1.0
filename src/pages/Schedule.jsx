// @ts-nocheck
import { useRef } from "react";
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";

import ExportButton from "@/components/schedule/ExportButton";
import MonthSelector from "@/components/schedule/MonthSelector";
import ScheduleGrid from "@/components/schedule/ScheduleGrid";
import ScheduleLegend from "@/components/schedule/ScheduleLegend";
import { Button } from "@/components/ui/button";
import PageState from "@/components/ui/page-state";
import { useSchedulePage } from "@/hooks/useSchedulePage";
import { getMonthName } from "@/lib/scheduleUtils";

export default function Schedule() {
  const gridRef = useRef(null);
  const {
    month,
    year,
    schedules,
    employees,
    loading,
    loadError,
    generating,
    monthAnalysis,
    isCellPending,
    handleGenerate,
    handleCellClick,
    handleMonthChange,
    reloadSchedulePage,
  } = useSchedulePage();

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-2xl font-bold">
            Escala de revezamento
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Clique nas celulas para alternar entre Trabalho, Folga e Madrugada
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <MonthSelector month={month} onChange={handleMonthChange} year={year} />
        </div>
      </div>
      {loading ? (
        <PageState
          description="Buscando colaboradores ativos e escalas do periodo selecionado."
          state="loading"
          title="Carregando escala"
        />
      ) : loadError ? (
        <PageState
          action={
            <Button
              onClick={() => {
                void reloadSchedulePage();
              }}
            >
              Tentar novamente
            </Button>
          }
          description={loadError}
          state="error"
          title="Falha ao carregar escala"
        />
      ) : employees.length === 0 ? (
        <PageState
          action={
            <Button asChild>
              <Link to="/colaboradores">Gerenciar colaboradores</Link>
            </Button>
          }
          description="Cadastre ou reative colaboradores antes de gerar a escala deste periodo."
          state="empty"
          title="Nenhum colaborador ativo"
        />
      ) : schedules.length === 0 ? (
        <PageState
          action={
            <Button
              className="gap-2"
              disabled={generating}
              onClick={() => {
                void handleGenerate();
              }}
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Gerar escala
            </Button>
          }
          description={`Ainda nao existe escala para ${getMonthName(
            month,
            year
          )} ${year}. Gere o periodo para iniciar a distribuicao dos turnos.`}
          state="empty"
          title="Nenhuma escala neste periodo"
        />
      ) : (
        <>
          <div className="flex flex-wrap items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div className="space-y-1">
              <p>
                Este periodo ja possui {schedules.length} escala(s). Regenerar vai
                resetar os turnos do mes para todos os colaboradores ativos.
              </p>
              {monthAnalysis.duplicates.length > 0 ? (
                <p>
                  Foram detectados {monthAnalysis.duplicates.length} registro(s)
                  duplicado(s) e eles serao limpos ao final da regeneracao.
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <ScheduleLegend />
            <div className="flex gap-2">
              <Button
                className="gap-2"
                disabled={generating}
                onClick={() => {
                  void handleGenerate();
                }}
                variant="outline"
              >
                {generating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Regenerar
              </Button>
              <ExportButton
                fileName={`escala-${getMonthName(month, year)}-${year}`}
                targetRef={gridRef}
              />
            </div>
          </div>

          <div ref={gridRef}>
            <div className="rounded-xl bg-white p-4">
              <div className="mb-4 text-center">
                <h2 className="font-heading text-lg font-bold text-foreground">
                  ESCALA DE REVEZAMENTO - {getMonthName(month, year).toUpperCase()}{" "}
                  {year}
                </h2>
              </div>
              <ScheduleGrid
                isCellPending={isCellPending}
                month={month}
                onCellClick={handleCellClick}
                readonly={generating}
                schedules={schedules}
                year={year}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
