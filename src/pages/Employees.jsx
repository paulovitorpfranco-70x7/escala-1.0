// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2, UserCircle } from "lucide-react";

import { db } from "@/API/base44Client";
import { Button } from "@/components/ui/button";
import PageState from "@/components/ui/page-state";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

const DEFAULT_ROLE = "Atendente";
const MIN_NAME_LENGTH = 3;
const roles = [
  "Farmac\u00eautico",
  "Atendente",
  "Gerente",
  "Caixa",
  "Outro",
];

function normalizeEmployeeName(value) {
  return value.trim().replace(/\s+/g, " ").toUpperCase();
}

function validateEmployeeForm(form, employees, editingEmployee) {
  const errors = {};
  const normalizedName = normalizeEmployeeName(form.name);

  if (!normalizedName) {
    errors.name = "Informe o nome do colaborador.";
  } else if (normalizedName.length < MIN_NAME_LENGTH) {
    errors.name = `O nome deve ter pelo menos ${MIN_NAME_LENGTH} caracteres.`;
  } else {
    const duplicate = employees.some((employee) => {
      if (editingEmployee?.id && employee.id === editingEmployee.id) {
        return false;
      }

      return normalizeEmployeeName(employee.name || "") === normalizedName;
    });

    if (duplicate) {
      errors.name = "Ja existe um colaborador com esse nome.";
    }
  }

  if (!roles.includes(form.role)) {
    errors.role = "Selecione um cargo valido.";
  }

  return {
    errors,
    normalizedName,
  };
}

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [form, setForm] = useState({ name: "", role: DEFAULT_ROLE });
  const [touched, setTouched] = useState({ name: false, role: false });
  const [saveAttempted, setSaveAttempted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const validation = useMemo(
    () => validateEmployeeForm(form, employees, editingEmployee),
    [editingEmployee, employees, form]
  );

  const nameError =
    touched.name || saveAttempted ? validation.errors.name : undefined;
  const roleError =
    touched.role || saveAttempted ? validation.errors.role : undefined;

  async function load({ showLoading = true } = {}) {
    if (showLoading) {
      setLoading(true);
    }

    try {
      setLoadError("");
      const employeeList = await db.entities.Employee.list();
      setEmployees(employeeList);
    } catch (error) {
      setLoadError(error?.message || "Nao foi possivel carregar os colaboradores.");
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function resetDialogState() {
    setTouched({ name: false, role: false });
    setSaveAttempted(false);
    setSubmitError("");
    setIsSaving(false);
  }

  function closeDialog() {
    setDialogOpen(false);
    resetDialogState();
  }

  function openNew() {
    setEditingEmployee(null);
    setForm({ name: "", role: DEFAULT_ROLE });
    resetDialogState();
    setDialogOpen(true);
  }

  function openEdit(employee) {
    setEditingEmployee(employee);
    setForm({ name: employee.name || "", role: employee.role || DEFAULT_ROLE });
    resetDialogState();
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaveAttempted(true);
    setSubmitError("");

    if (Object.keys(validation.errors).length > 0) {
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        name: validation.normalizedName,
        role: form.role,
      };

      if (editingEmployee) {
        await db.entities.Employee.update(editingEmployee.id, payload);
        toast({ title: "Colaborador atualizado" });
      } else {
        await db.entities.Employee.create({ ...payload, active: true });
        toast({ title: "Colaborador adicionado" });
      }

      closeDialog();
      await load({ showLoading: false });
    } catch (error) {
      const message =
        error?.message || "Nao foi possivel salvar o colaborador.";

      setSubmitError(message);
      toast({
        title: "Erro ao salvar",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(employee) {
    if (!window.confirm(`Remover ${employee.name}?`)) {
      return;
    }

    try {
      await db.entities.Employee.delete(employee.id);
      toast({ title: "Colaborador removido" });
      await load({ showLoading: false });
    } catch (error) {
      toast({
        title: "Erro ao remover",
        description: error?.message || "Nao foi possivel remover o colaborador.",
        variant: "destructive",
      });
    }
  }

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
                void load();
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
                    onClick={() => handleDelete(employee)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            closeDialog();
            return;
          }

          setDialogOpen(true);
        }}
        open={dialogOpen}
      >
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
                onBlur={() =>
                  setTouched((current) => ({ ...current, name: true }))
                }
                onChange={(event) => {
                  setSubmitError("");
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }));
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
                onValueChange={(value) => {
                  setSubmitError("");
                  setTouched((current) => ({ ...current, role: true }));
                  setForm((current) => ({ ...current, role: value }));
                }}
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
