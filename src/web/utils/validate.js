export function isPresent(value) {
  return typeof value === "string" ? value.trim().length > 0 : value !== undefined && value !== null && value !== "";
}

export function isValidEmail(value) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isMarkInRange(value) {
  const mark = parseFloat(value);
  return !Number.isNaN(mark) && mark >= 0 && mark <= 100;
}

export function isNumber(value) {
  return value !== "" && value !== undefined && value !== null && !Number.isNaN(Number(value));
}
