const MIN_NAME_LENGTH = 3;

export const DEFAULT_ROLE = "Atendente";
export const EMPLOYEE_ROLES = [
  "Farmac\u00eautico",
  "Atendente",
  "Gerente",
  "Caixa",
  "Outro",
];

export function normalizeEmployeeName(value) {
  return value.trim().replace(/\s+/g, " ").toUpperCase();
}

export function validateEmployeeForm(
  form,
  employees,
  editingEmployee,
  roles = EMPLOYEE_ROLES
) {
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

export async function saveEmployeeFlow({
  form,
  employees,
  editingEmployee,
  services,
}) {
  const validation = validateEmployeeForm(form, employees, editingEmployee);

  if (Object.keys(validation.errors).length > 0) {
    return {
      ok: false,
      validation,
    };
  }

  const payload = {
    name: validation.normalizedName,
    role: form.role,
  };

  if (editingEmployee) {
    const employee = await services.updateEmployee(editingEmployee.id, payload);

    return {
      ok: true,
      action: "updated",
      employee,
      employees: await services.listEmployees(),
    };
  }

  const employee = await services.createEmployee({
    ...payload,
    active: true,
  });

  return {
    ok: true,
    action: "created",
    employee,
    employees: await services.listEmployees(),
  };
}

export async function deleteEmployeeFlow({
  employee,
  services,
  confirmDelete = () => true,
}) {
  if (!confirmDelete(employee)) {
    return {
      ok: false,
      skipped: true,
    };
  }

  await services.deleteEmployee(employee.id);

  return {
    ok: true,
    employees: await services.listEmployees(),
  };
}
