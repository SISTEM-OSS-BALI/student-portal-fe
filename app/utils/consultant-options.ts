// Pilihan "Consultant Name" untuk siswa (form Add Student, detail siswa, dan ubah konsultan penanggung jawab).
//
// Siswa terhubung ke konsultan lewat NAMA akun (users.name_consultant). Yang boleh dipilih adalah akun berperan Consultant dan Director: Director yang juga memegang
// siswa (mis. Ayu dan Astina, yang di hub tercatat sebagai konsultan) harus bisa dipilih, dan siswa kiriman hub atas nama mereka tercatat dengan nama akun Director-nya.
// Admission dan Student tidak termasuk.

export type ConsultantOption = { label: string; value: string };

export const CONSULTANT_ASSIGNABLE_ROLES = ["CONSULTANT", "DIRECTOR"] as const;

export function isAssignableConsultantRole(role?: string | null): boolean {
  const normalized = (role ?? "").trim().toUpperCase();
  return (CONSULTANT_ASSIGNABLE_ROLES as readonly string[]).includes(normalized);
}

/** Satu pilihan per nama (huruf besar-kecil diabaikan), terurut abjad. Akun tanpa nama dilewati. */
export function buildConsultantOptions(users: ReadonlyArray<{ name?: string | null; role?: string | null }> | null | undefined): ConsultantOption[] {
  const options: ConsultantOption[] = [];
  const seen = new Set<string>();
  for (const user of users ?? []) {
    if (!isAssignableConsultantRole(user.role)) continue;
    const name = (user.name ?? "").trim();
    if (!name || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());
    options.push({ label: name, value: name });
  }
  return options.sort((a, b) => a.label.localeCompare(b.label));
}
