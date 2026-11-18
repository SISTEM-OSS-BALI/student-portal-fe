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

// ---- Filter konsultan di daftar siswa ----
//
// Pilihan filter diambil dari Team Account (bukan dari nama yang tersimpan di siswa), supaya satu orang satu pilihan. Nama di siswa bisa bervariasi
// ("Jani", "Jani OSS", "Jani Antari"), jadi tiap siswa dipetakan ke TEPAT SATU akun: nama persis (huruf besar-kecil dan spasi ganda diabaikan), atau kata pertamanya
// bila hanya satu akun yang kata pertamanya sama. Dua akun dengan kata pertama sama = tidak ditebak. Nama yang tidak cocok dengan akun mana pun dikumpulkan di
// satu pilihan "Lainnya", sehingga tidak ada siswa yang hilang diam-diam dari hasil filter.

/** Nilai pilihan "Lainnya" (tidak mungkin sama dengan nama orang). */
export const UNMAPPED_CONSULTANT = "__tidak_terdaftar__";
export const UNMAPPED_CONSULTANT_LABEL = "Lainnya (tidak ada di Team Account)";

const fold = (value: unknown): string => String(value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
const firstWord = (value: unknown): string => fold(value).split(" ")[0] ?? "";

/** Nama akun Team Account yang dimaksud nama konsultan tersimpan di siswa, atau null bila tidak ada yang pasti. */
export function resolveConsultantAccount(storedName: unknown, accountNames: readonly string[]): string | null {
  const stored = fold(storedName);
  if (!stored) return null;
  const exact = accountNames.filter((account) => fold(account) === stored);
  if (exact.length === 1) return exact[0]!;
  if (exact.length > 1) return null;
  const word = firstWord(stored);
  const sameFirstWord = accountNames.filter((account) => firstWord(account) === word);
  return sameFirstWord.length === 1 ? sameFirstWord[0]! : null;
}

/** Lolos filter konsultan? `filter` kosong = semua; UNMAPPED_CONSULTANT = siswa yang bernama konsultan tetapi tidak cocok dengan akun mana pun. */
export function matchesConsultantFilter(storedName: unknown, filter: string | null | undefined, accountNames: readonly string[]): boolean {
  if (!filter) return true;
  const resolved = resolveConsultantAccount(storedName, accountNames);
  if (filter === UNMAPPED_CONSULTANT) return fold(storedName) !== "" && resolved === null;
  return resolved !== null && fold(resolved) === fold(filter);
}

/** Pilihan filter: akun Team Account (Consultant dan Director), ditambah "Lainnya" hanya bila ada siswa yang tidak cocok dengan akun mana pun. Kosong selama daftar akun belum dimuat. */
export function buildConsultantFilterOptions(users: ReadonlyArray<{ name?: string | null; role?: string | null }> | null | undefined, studentConsultantNames: readonly unknown[]): ConsultantOption[] {
  const options = buildConsultantOptions(users);
  if (options.length === 0) return options;
  const accountNames = options.map((option) => option.value);
  const hasOther = studentConsultantNames.some((name) => fold(name) !== "" && resolveConsultantAccount(name, accountNames) === null);
  return hasOther ? [...options, { label: UNMAPPED_CONSULTANT_LABEL, value: UNMAPPED_CONSULTANT }] : options;
}

/** Teks untuk ringkasan filter (nilai "Lainnya" diganti labelnya). */
export function consultantFilterLabel(filter: string | null | undefined): string | undefined {
  if (!filter) return undefined;
  return filter === UNMAPPED_CONSULTANT ? UNMAPPED_CONSULTANT_LABEL : filter;
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
