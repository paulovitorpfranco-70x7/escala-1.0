export const SHIFT_TYPES = {
  T: {
    label: "Trabalho",
    short: "T",
    color: "border-primary/20 bg-primary/10 text-primary",
  },
  F: {
    label: "Folga",
    short: "F",
    color: "border-accent/20 bg-accent/10 text-accent",
  },
  M: {
    label: "Madrugada",
    short: "M",
    color: "border-purple-200 bg-purple-100 text-purple-700",
  },
};

function getDateForDay(day, month, year) {
  return new Date(year, month - 1, day);
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function getDaysInMonth(month, year) {
  return new Date(year, month, 0).getDate();
}

export function getDayOfWeek(day, month, year) {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "short" })
    .format(getDateForDay(day, month, year))
    .replace(".", "")
    .toLowerCase();
}

export function getDayOfWeekFull(day, month, year) {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "short" })
    .format(getDateForDay(day, month, year))
    .replace(".", "");
}

export function isWeekend(day, month, year) {
  const dayOfWeek = getDateForDay(day, month, year).getDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
}

export function getMonthName(month, year = new Date().getFullYear()) {
  return capitalize(
    new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(
      new Date(year, month - 1, 1)
    )
  );
}

export function countShifts(days, type) {
  return Object.values(days || {}).filter((value) => value === type).length;
}

export function generateEmptySchedule(month, year) {
  const totalDays = getDaysInMonth(month, year);
  const days = {};

  for (let day = 1; day <= totalDays; day += 1) {
    days[String(day)] = "T";
  }

  return days;
}
