import moment from "moment";

export const SHIFT_TYPES = {
  T: { label: "Trabalho", short: "T", color: "bg-primary/10 text-primary border-primary/20" },
  F: { label: "Folga", short: "F", color: "bg-accent/10 text-accent border-accent/20" },
  M: { label: "Madrugada", short: "M", color: "bg-purple-100 text-purple-700 border-purple-200" },
};

export function getDaysInMonth(month, year) {
  return moment({ year, month: month - 1 }).daysInMonth();
}

export function getDayOfWeek(day, month, year) {
  return moment({ year, month: month - 1, day }).format("ddd").toLowerCase();
}

export function getDayOfWeekFull(day, month, year) {
  moment.locale("pt-br");
  return moment({ year, month: month - 1, day }).format("ddd");
}

export function isWeekend(day, month, year) {
  const dow = moment({ year, month: month - 1, day }).day();
  return dow === 0 || dow === 6;
}

export function getMonthName(month) {
  const names = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  return names[month - 1];
}

export function countShifts(days, type) {
  return Object.values(days || {}).filter(v => v === type).length;
}

export function generateEmptySchedule(month, year) {
  const daysCount = getDaysInMonth(month, year);
  const days = {};
  for (let d = 1; d <= daysCount; d++) {
    days[String(d)] = "T";
  }
  return days;
}