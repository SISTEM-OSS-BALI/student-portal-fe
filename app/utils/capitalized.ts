export function toCapitalized(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }
  return value
    .replace(/[_-]/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
