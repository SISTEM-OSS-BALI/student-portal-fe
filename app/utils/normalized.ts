export function normalizedRole(role: string) {
  switch (role) {
    case "ADMISSION":
      return "Admission";
    case "DIRECTOR":
      return "Director";
    case "STUDENT":
      return "Student";
    default:
      return role;
  }
}
