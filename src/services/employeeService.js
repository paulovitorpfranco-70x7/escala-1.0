import { db } from "@/API/base44Client";

export function listEmployees() {
  return db.entities.Employee.list();
}

export function listActiveEmployees() {
  return db.entities.Employee.filter({ active: true });
}

export function createEmployee(payload) {
  return db.entities.Employee.create(payload);
}

export function updateEmployee(employeeId, payload) {
  return db.entities.Employee.update(employeeId, payload);
}

export function deleteEmployee(employeeId) {
  return db.entities.Employee.delete(employeeId);
}
