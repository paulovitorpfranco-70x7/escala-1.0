// @ts-nocheck
import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2, UserCircle } from "lucide-react";

import { db } from "@/API/base44Client";
import { Button } from "@/components/ui/button";
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

const roles = ["Farmacêutico", "Atendente", "Gerente", "Caixa", "Outro"];

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [form, setForm] = useState({ name: "", role: "Atendente" });
  const { toast } = useToast();

  async function load() {
    try {
      const employeeList = await db.entities.Employee.list();
      setEmployees(employeeList);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function openNew() {
    setEditingEmployee(null);
    setForm({ name: "", role: "Atendente" });
    setDialogOpen(true);
  }

  function openEdit(employee) {
    setEditingEmployee(employee);
    setForm({ name: employee.name, role: employee.role || "Atendente" });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      return;
    }

    try {
      const payload = {
        name: form.name.trim().toUpperCase(),
        role: form.role,
      };

      if (editingEmployee) {
        await db.entities.Employee.update(editingEmployee.id, payload);
        toast({ title: "Colaborador atualizado" });
      } else {
        await db.entities.Employee.create({ ...payload, active: true });
        toast({ title: "Colaborador adicionado" });
      }

      setDialogOpen(false);
      await load();
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: error?.message || "Nao foi possivel salvar o colaborador.",
        variant: "destructive",
      });
    }
  }

  async function handleDelete(employee) {
    if (!window.confirm(`Remover ${employee.name}?`)) {
      return;
    }

    try {
      await db.entities.Employee.delete(employee.id);
      toast({ title: "Colaborador removido" });
      await load();
    } catch (error) {
      toast({
        title: "Erro ao remover",
        description: error?.message || "Nao foi possivel remover o colaborador.",
        variant: "destructive",
      });
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
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

      <Dialog onOpenChange={setDialogOpen} open={dialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingEmployee ? "Editar colaborador" : "Novo colaborador"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Nome</label>
              <Input
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Nome do colaborador"
                value={form.name}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Cargo</label>
              <Select
                onValueChange={(value) =>
                  setForm((current) => ({ ...current, role: value }))
                }
                value={form.role}
              >
                <SelectTrigger>
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
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setDialogOpen(false)} variant="outline">
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
