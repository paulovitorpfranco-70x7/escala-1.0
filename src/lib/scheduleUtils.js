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

export const SHIFT_SEQUENCE = ["T", "F", "M"];

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

export function isValidShift(value) {
  return SHIFT_SEQUENCE.includes(value);
}

export function getNextShift(currentShift) {
  const normalizedShift = isValidShift(currentShift) ? currentShift : "T";
  const currentIndex = SHIFT_SEQUENCE.indexOf(normalizedShift);

  return SHIFT_SEQUENCE[(currentIndex + 1) % SHIFT_SEQUENCE.length];
}

export function normalizeScheduleDays(days, month, year) {
  const totalDays = getDaysInMonth(month, year);
  const normalized = {};

  for (let day = 1; day <= totalDays; day += 1) {
    const dayKey = String(day);
    const currentValue = days?.[dayKey];
    normalized[dayKey] = isValidShift(currentValue) ? currentValue : "T";
  }

  return normalized;
}

export function validateScheduleDayChange(schedule, day, month, year) {
  if (!schedule?.id) {
    return "A escala selecionada nao possui identificador valido.";
  }

  if (!schedule?.employee_id) {
    return "A escala selecionada nao possui colaborador vinculado.";
  }

  if (!Number.isInteger(day)) {
    return "O dia informado para edicao e invalido.";
  }

  const totalDays = getDaysInMonth(month, year);
  if (day < 1 || day > totalDays) {
    return `O dia ${day} nao pertence a ${getMonthName(month, year)} ${year}.`;
  }

  if (schedule.month !== month || schedule.year !== year) {
    return "A escala selecionada nao corresponde ao periodo exibido.";
  }

  return null;
}

export function generateEmptySchedule(month, year) {
  const totalDays = getDaysInMonth(month, year);
  const days = {};

  for (let day = 1; day <= totalDays; day += 1) {
    days[String(day)] = "T";
  }

  return days;
}
