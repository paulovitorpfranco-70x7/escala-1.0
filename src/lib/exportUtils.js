const DIACRITICS_PATTERN = /[\u0300-\u036f]/g;
const INVALID_FILENAME_PATTERN = /[^a-z0-9]+/g;
const EDGE_DASH_PATTERN = /^-+|-+$/g;

export function sanitizeExportFileName(value, fallback = "escala") {
  const normalizedValue = String(value || "")
    .normalize("NFD")
    .replace(DIACRITICS_PATTERN, "")
    .toLowerCase()
    .replace(INVALID_FILENAME_PATTERN, "-")
    .replace(EDGE_DASH_PATTERN, "");

  if (normalizedValue) {
    return normalizedValue;
  }

  return fallback;
}
