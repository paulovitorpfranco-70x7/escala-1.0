const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, UserCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const roles = ["Farmacêutico", "Atendente", "Gerente", "Caixa", "Outro"];

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState(null);
  const [form, setForm] = useState({ name: "", role: "Atendente" });
  const { toast } = useToast();

  const load = async () => {
    const emps = await db.entities.Employee.list();
    setEmployees(emps);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditingEmp(null);
    setForm({ name: "", role: "Atendente" });
    setDialogOpen(true);
  };

  const openEdit = (emp) => {
    setEditingEmp(emp);
    setForm({ name: emp.name, role: emp.role || "Atendente" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    if (editingEmp) {
      await db.entities.Employee.update(editingEmp.id, { name: form.name, role: form.role });
      toast({ title: "Colaborador atualizado!" });
    } else {
      await db.entities.Employee.create({ name: form.name.toUpperCase(), role: form.role, active: true });
      toast({ title: "Colaborador adicionado!" });
    }
    setDialogOpen(false);
    load();
  };

  const handleDelete = async (emp) => {
    if (!confirm(`Remover ${emp.name}?`)) return;
    await db.entities.Employee.delete(emp.id);
    toast({ title: "Colaborador removido." });
    load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Colaboradores</h1>
          <p className="text-muted-foreground text-sm mt-1">{employees.length} colaboradores cadastrados</p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="w-4 h-4" /> Adicionar
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.map((emp) => (
          <div
            key={emp.id}
            className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserCircle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{emp.name}</p>
                  <p className="text-xs text-muted-foreground">{emp.role || "—"}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(emp)} className="p-1.5 hover:bg-muted rounded-md transition-colors">
                  <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                <button onClick={() => handleDelete(emp)} className="p-1.5 hover:bg-destructive/10 rounded-md transition-colors">
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEmp ? "Editar Colaborador" : "Novo Colaborador"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Nome</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nome do colaborador"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Cargo</label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}