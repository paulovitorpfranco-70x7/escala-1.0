// @ts-nocheck
import { Pencil, Plus, Trash2, UserCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import PageState from "@/components/ui/page-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEmployeesPage } from "@/hooks/useEmployeesPage";

export default function Employees() {
  const {
    employees,
    loading,
    loadError,
    dialogOpen,
    editingEmployee,
    form,
    roles,
    nameError,
    roleError,
    submitError,
    isSaving,
    openNew,
    openEdit,
    closeDialog,
    handleDialogOpenChange,
    handleNameBlur,
    handleNameChange,
    handleRoleChange,
    handleSave,
    handleDelete,
    reloadEmployees,
  } = useEmployeesPage();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Colaboradores</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {employees.length} colaboradores cadastrados
          </p>
        </div>
        <Button className="gap-2" onClick={openNew}>
          <Plus className="h-4 w-4" /> Adicionar
        </Button>
      </div>
      {loading ? (
        <PageState
          description="Buscando a equipe cadastrada para editar ou remover registros."
          state="loading"
          title="Carregando colaboradores"
        />
      ) : loadError ? (
        <PageState
          action={
            <Button
              onClick={() => {
                void reloadEmployees();
              }}
            >
              Tentar novamente
            </Button>
          }
          description={loadError}
          state="error"
          title="Falha ao carregar colaboradores"
        />
      ) : employees.length === 0 ? (
        <PageState
          action={<Button onClick={openNew}>Adicionar primeiro colaborador</Button>}
          description="Cadastre a equipe antes de gerar escalas ou aplicar comandos em linguagem natural."
          state="empty"
          title="Nenhum colaborador cadastrado"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {employees.map((employee) => (
            <div
              key={employee.id}
              className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <UserCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{employee.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {employee.role || "-"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    className="rounded-md p-1.5 transition-colors hover:bg-muted"
                    onClick={() => openEdit(employee)}
                  >
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                  <button
                    className="rounded-md p-1.5 transition-colors hover:bg-destructive/10"
                    onClick={() => {
                      void handleDelete(employee);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog onOpenChange={handleDialogOpenChange} open={dialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingEmployee ? "Editar colaborador" : "Novo colaborador"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {submitError ? (
              <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                {submitError}
              </div>
            ) : null}
            <div>
              <label className="mb-1.5 block text-sm font-medium">Nome</label>
              <Input
                aria-invalid={Boolean(nameError)}
                className={nameError ? "border-destructive focus-visible:ring-destructive" : ""}
                onBlur={handleNameBlur}
                onChange={(event) => {
                  handleNameChange(event.target.value);
                }}
                placeholder="Nome do colaborador"
                value={form.name}
              />
              {nameError ? (
                <p className="mt-1 text-xs text-destructive">{nameError}</p>
              ) : null}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Cargo</label>
              <Select
                onValueChange={handleRoleChange}
                value={form.role}
              >
                <SelectTrigger
                  className={
                    roleError ? "border-destructive focus:ring-destructive" : ""
                  }
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {roleError ? (
                <p className="mt-1 text-xs text-destructive">{roleError}</p>
              ) : null}
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={closeDialog}
              variant="outline"
            >
              Cancelar
            </Button>
            <Button disabled={isSaving} onClick={() => void handleSave()}>
              {isSaving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
