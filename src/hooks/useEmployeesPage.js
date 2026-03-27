// @ts-nocheck
import { useEffect, useMemo, useState } from "react";

import { useToast } from "@/components/ui/use-toast";
import {
  createEmployee,
  deleteEmployee,
  listEmployees,
  updateEmployee,
} from "@/services/employeeService";

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

export function useEmployeesPage() {
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

  async function loadEmployees({ showLoading = true } = {}) {
    if (showLoading) {
      setLoading(true);
    }

    try {
      setLoadError("");
      const employeeList = await listEmployees();
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
    void loadEmployees();
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

  function handleDialogOpenChange(open) {
    if (!open) {
      closeDialog();
      return;
    }

    setDialogOpen(true);
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

  function handleNameBlur() {
    setTouched((current) => ({ ...current, name: true }));
  }

  function handleNameChange(value) {
    setSubmitError("");
    setForm((current) => ({
      ...current,
      name: value,
    }));
  }

  function handleRoleChange(value) {
    setSubmitError("");
    setTouched((current) => ({ ...current, role: true }));
    setForm((current) => ({ ...current, role: value }));
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
        await updateEmployee(editingEmployee.id, payload);
        toast({ title: "Colaborador atualizado" });
      } else {
        await createEmployee({ ...payload, active: true });
        toast({ title: "Colaborador adicionado" });
      }

      closeDialog();
      await loadEmployees({ showLoading: false });
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
      await deleteEmployee(employee.id);
      toast({ title: "Colaborador removido" });
      await loadEmployees({ showLoading: false });
    } catch (error) {
      toast({
        title: "Erro ao remover",
        description: error?.message || "Nao foi possivel remover o colaborador.",
        variant: "destructive",
      });
    }
  }

  return {
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
    reloadEmployees: loadEmployees,
  };
}
