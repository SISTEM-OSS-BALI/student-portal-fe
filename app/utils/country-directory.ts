/**
 * Direktori dan kamus pemetaan negara internasional.
 * Mendukung pencarian dwibahasa (Bahasa Indonesia dan Bahasa Inggris)
 * serta pemetaan kode wilayah resmi ISO 3166-1 alpha-2 untuk tampilan bendera.
 */

export interface CountryDirectoryItem {
  code: string; // ISO 3166-1 alpha-2 (huruf kecil untuk CDN bendera)
  nameEn: string;
  nameId: string;
}

export const POPULAR_COUNTRIES: CountryDirectoryItem[] = [
  { code: "au", nameEn: "Australia", nameId: "Australia" },
  { code: "ca", nameEn: "Canada", nameId: "Kanada" },
  { code: "de", nameEn: "Germany", nameId: "Jerman" },
  { code: "gb", nameEn: "United Kingdom", nameId: "Inggris" },
  { code: "us", nameEn: "United States", nameId: "Amerika Serikat" },
  { code: "nz", nameEn: "New Zealand", nameId: "Selandia Baru" },
  { code: "nl", nameEn: "Netherlands", nameId: "Belanda" },
  { code: "ie", nameEn: "Ireland", nameId: "Irlandia" },
  { code: "sg", nameEn: "Singapore", nameId: "Singapura" },
  { code: "my", nameEn: "Malaysia", nameId: "Malaysia" },
  { code: "id", nameEn: "Indonesia", nameId: "Indonesia" },
  { code: "jp", nameEn: "Japan", nameId: "Jepang" },
  { code: "kr", nameEn: "South Korea", nameId: "Korea Selatan" },
  { code: "cn", nameEn: "China", nameId: "Tiongkok" },
  { code: "tw", nameEn: "Taiwan", nameId: "Taiwan" },
  { code: "hk", nameEn: "Hong Kong", nameId: "Hong Kong" },
  { code: "fr", nameEn: "France", nameId: "Prancis" },
  { code: "es", nameEn: "Spain", nameId: "Spanyol" },
  { code: "it", nameEn: "Italy", nameId: "Italia" },
  { code: "ch", nameEn: "Switzerland", nameId: "Swiss" },
  { code: "se", nameEn: "Sweden", nameId: "Swedia" },
  { code: "no", nameEn: "Norway", nameId: "Norwegia" },
  { code: "dk", nameEn: "Denmark", nameId: "Denmark" },
  { code: "fi", nameEn: "Finland", nameId: "Finlandia" },
  { code: "be", nameEn: "Belgium", nameId: "Belgia" },
  { code: "at", nameEn: "Austria", nameId: "Austria" },
  { code: "pl", nameEn: "Poland", nameId: "Polandia" },
  { code: "tr", nameEn: "Turkey", nameId: "Turki" },
  { code: "sa", nameEn: "Saudi Arabia", nameId: "Arab Saudi" },
  { code: "ae", nameEn: "United Arab Emirates", nameId: "Uni Emirat Arab" },
  { code: "th", nameEn: "Thailand", nameId: "Thailand" },
  { code: "vn", nameEn: "Vietnam", nameId: "Vietnam" },
  { code: "ph", nameEn: "Philippines", nameId: "Filipina" },
  { code: "in", nameEn: "India", nameId: "India" },
  { code: "ru", nameEn: "Russia", nameId: "Rusia" },
  { code: "br", nameEn: "Brazil", nameId: "Brasil" },
  { code: "mx", nameEn: "Mexico", nameId: "Meksiko" },
  { code: "eg", nameEn: "Egypt", nameId: "Mesir" },
  { code: "za", nameEn: "South Africa", nameId: "Afrika Selatan" },
];

/**
 * Kamus alias komprehensif untuk mendeteksi variasi ejaan nama negara.
 */
export const COUNTRY_ALIAS_MAP: Record<string, { code: string; label: string }> = {
  // Australia & Oceania
  australia: { code: "au", label: "Australia" },
  "new zealand": { code: "nz", label: "New Zealand" },
  "selandia baru": { code: "nz", label: "New Zealand" },

  // Amerika
  "united states": { code: "us", label: "United States" },
  usa: { code: "us", label: "United States" },
  us: { code: "us", label: "United States" },
  "amerika serikat": { code: "us", label: "United States" },
  amerika: { code: "us", label: "United States" },
  canada: { code: "ca", label: "Canada" },
  kanada: { code: "ca", label: "Canada" },
  brazil: { code: "br", label: "Brazil" },
  brasil: { code: "br", label: "Brazil" },
  mexico: { code: "mx", label: "Mexico" },
  meksiko: { code: "mx", label: "Mexico" },

  // Eropa
  "united kingdom": { code: "gb", label: "United Kingdom" },
  uk: { code: "gb", label: "United Kingdom" },
  inggris: { code: "gb", label: "United Kingdom" },
  "britania raya": { code: "gb", label: "United Kingdom" },
  ireland: { code: "ie", label: "Ireland" },
  irlandia: { code: "ie", label: "Ireland" },
  germany: { code: "de", label: "Germany" },
  jerman: { code: "de", label: "Germany" },
  netherlands: { code: "nl", label: "Netherlands" },
  belanda: { code: "nl", label: "Netherlands" },
  france: { code: "fr", label: "France" },
  prancis: { code: "fr", label: "France" },
  perancis: { code: "fr", label: "France" },
  italy: { code: "it", label: "Italy" },
  italia: { code: "it", label: "Italy" },
  spain: { code: "es", label: "Spain" },
  spanyol: { code: "es", label: "Spain" },
  switzerland: { code: "ch", label: "Switzerland" },
  swiss: { code: "ch", label: "Switzerland" },
  sweden: { code: "se", label: "Sweden" },
  swedia: { code: "se", label: "Sweden" },
  norway: { code: "no", label: "Norway" },
  norwegia: { code: "no", label: "Norway" },
  denmark: { code: "dk", label: "Denmark" },
  finland: { code: "fi", label: "Finland" },
  finlandia: { code: "fi", label: "Finland" },
  belgium: { code: "be", label: "Belgium" },
  belgia: { code: "be", label: "Belgium" },
  austria: { code: "at", label: "Austria" },
  poland: { code: "pl", label: "Poland" },
  polandia: { code: "pl", label: "Poland" },
  turkey: { code: "tr", label: "Turkey" },
  turki: { code: "tr", label: "Turkey" },
  turkiye: { code: "tr", label: "Turkey" },
  russia: { code: "ru", label: "Russia" },
  rusia: { code: "ru", label: "Russia" },

  // Asia
  indonesia: { code: "id", label: "Indonesia" },
  malaysia: { code: "my", label: "Malaysia" },
  singapore: { code: "sg", label: "Singapore" },
  singapura: { code: "sg", label: "Singapore" },
  japan: { code: "jp", label: "Japan" },
  jepang: { code: "jp", label: "Japan" },
  "south korea": { code: "kr", label: "South Korea" },
  korea: { code: "kr", label: "South Korea" },
  "korea selatan": { code: "kr", label: "South Korea" },
  china: { code: "cn", label: "China" },
  tiongkok: { code: "cn", label: "China" },
  cina: { code: "cn", label: "China" },
  taiwan: { code: "tw", label: "Taiwan" },
  "hong kong": { code: "hk", label: "Hong Kong" },
  hongkong: { code: "hk", label: "Hong Kong" },
  thailand: { code: "th", label: "Thailand" },
  vietnam: { code: "vn", label: "Vietnam" },
  philippines: { code: "ph", label: "Philippines" },
  filipina: { code: "ph", label: "Philippines" },
  india: { code: "in", label: "India" },
  "saudi arabia": { code: "sa", label: "Saudi Arabia" },
  "arab saudi": { code: "sa", label: "Saudi Arabia" },
  "united arab emirates": { code: "ae", label: "United Arab Emirates" },
  uae: { code: "ae", label: "United Arab Emirates" },
  "uni emirat arab": { code: "ae", label: "United Arab Emirates" },

  // Afrika
  egypt: { code: "eg", label: "Egypt" },
  mesir: { code: "eg", label: "Egypt" },
  "south africa": { code: "za", label: "South Africa" },
  "afrika selatan": { code: "za", label: "South Africa" },
};

/**
 * Menyelesaikan kode ISO dua huruf dari nama negara apa pun secara cerdas.
 */
export function resolveCountryCode(countryName?: string | null): {
  code: string;
  label: string;
} {
  const norm = String(countryName ?? "").trim().toLowerCase();
  if (!norm) {
    return { code: "au", label: "Country" };
  }

  // 1. Pencocokan langsung pada kamus alias
  if (COUNTRY_ALIAS_MAP[norm]) {
    return COUNTRY_ALIAS_MAP[norm];
  }

  // 2. Pencocokan parsial kata kunci
  for (const [alias, data] of Object.entries(COUNTRY_ALIAS_MAP)) {
    if (norm.includes(alias) || alias.includes(norm)) {
      return data;
    }
  }

  // 3. Fallback ke 2 karakter pertama
  return {
    code: norm.slice(0, 2) || "au",
    label: countryName || "Country",
  };
}
