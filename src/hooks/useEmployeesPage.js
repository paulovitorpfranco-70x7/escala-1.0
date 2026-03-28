// @ts-nocheck
import { useEffect, useMemo, useState } from "react";

import { useToast } from "@/components/ui/use-toast";
import {
  DEFAULT_ROLE,
  deleteEmployeeFlow,
  EMPLOYEE_ROLES,
  saveEmployeeFlow,
  validateEmployeeForm,
} from "@/lib/employeeFlow";
import {
  createEmployee,
  deleteEmployee,
  listEmployees,
  updateEmployee,
} from "@/services/employeeService";

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
  const employeeServices = {
    createEmployee,
    deleteEmployee,
    listEmployees,
    updateEmployee,
  };

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
      const result = await saveEmployeeFlow({
        form,
        employees,
        editingEmployee,
        services: employeeServices,
      });

      if (!result.ok) {
        return;
      }

      setEmployees(result.employees);
      closeDialog();
      toast({
        title:
          result.action === "updated"
            ? "Colaborador atualizado"
            : "Colaborador adicionado",
      });
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
    try {
      const result = await deleteEmployeeFlow({
        employee,
        services: employeeServices,
        confirmDelete: (currentEmployee) =>
          window.confirm(`Remover ${currentEmployee.name}?`),
      });

      if (!result.ok) {
        return;
      }

      setEmployees(result.employees);
      toast({ title: "Colaborador removido" });
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
    roles: EMPLOYEE_ROLES,
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
