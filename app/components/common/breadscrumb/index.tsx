/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo } from "react";
import { Breadcrumb } from "antd";
import type { BreadcrumbProps } from "antd";
import { RightOutlined } from "@ant-design/icons";
import { usePathname } from "next/navigation";
import { useQueries } from "@tanstack/react-query";
import api from "@/lib/api";
import Link from "next/link";
import { toCapitalized } from "@/app/utils/capitalized";

/** ===== 1) ID detector (cuid/uuid/hex/angka) ===== */
const looksLikeId = (s: string) =>
  // cuid/cuid2-ish
  /^c[a-z0-9]{20,}$/i.test(s) ||
  // uuid v4
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    s,
  ) ||
  // 24-char hex (mongo)
  /^[0-9a-f]{24}$/i.test(s) ||
  // numeric id
  /^[0-9]{6,}$/.test(s);

/** ===== 2) Resolver registry by context key =====
 * Kunci adalah "context key" = gabungan beberapa segmen sebelum ID.
 * Kamu bisa daftarkan dari yang paling spesifik (banyak segmen) sampai yang generik (1 segmen).
 * Contoh:
 *   - "admin/dashboard/evaluator/matriks-question"
 *   - "dashboard/evaluator/matriks-question"
 *   - "matriks-question"
 */
type Resolver = (
  id: string,
  ctx: { segments: string[]; index: number },
) => Promise<string | undefined>;

async function fetchName(url: string) {
  const res = await api.get(url);
  const result = res.data?.result ?? res.data ?? {};
  return (
    result?.name ??
    result?.name_country ??
    result?.nameCountry ??
    result?.title ??
    result?.label ??
    result?.text ??
    undefined
  );
}

const resolvers: Record<string, Resolver> = {
  "admission/students-management/detail": (id) =>
    fetchName(`/api/users/${id}`),

  "admission/dashboard/stages-management": (id) =>
    fetchName(`/api/countries/${id}`),
  "dashboard/stages-management": (id) => fetchName(`/api/countries/${id}`),
  "stages-management": (id) => fetchName(`/api/countries/${id}`),
};

/** ===== 3) Default resolver (fallback) =====
 * Coba beberapa endpoint umum secara berurutan.
 * Return segera bila ada yang berhasil.
 */
const defaultResolver: Resolver = async (id) => {
  const candidates = [
    `/api/admin/dashboard/base-question-matriks/${id}`,
    `/api/admin/dashboard/question-matriks/${id}`,
    `/api/admin/dashboard/contract-template/${id}`,
    `/api/admin/dashboard/question-screening/${id}`,
    `/api/admin/dashboard/base-question-screening/${id}`,
    // Tambahkan kandidat lain sesuai kebutuhanmu
  ];
  for (const url of candidates) {
    try {
      const name = await fetchName(url);
      if (name) return name;
    } catch {
      // lanjut kandidat berikutnya
    }
  }
  return undefined;
};

/** ===== 4) Build context keys =====
 * Dari posisi segmen ID, ambil N segmen sebelum-nya (maks 4), buat key dari yang paling panjang ke yang pendek.
 * Contoh:
 *   segments = ["admin","dashboard","evaluator","matriks-question",":id"]
 *   keys dicoba berurutan:
 *     "admin/dashboard/evaluator/matriks-question"
 *     "dashboard/evaluator/matriks-question"
 *     "evaluator/matriks-question"
 *     "matriks-question"
 */
function getContextKeys(segments: string[], idIndex: number, maxDepth = 4) {
  const before = segments.slice(0, idIndex); // semua sebelum ID
  const keys: string[] = [];
  for (let depth = Math.min(maxDepth, before.length); depth >= 1; depth--) {
    const key = before.slice(-depth).join("/");
    keys.push(key);
  }
  return keys;
}

/** ===== 5) Hook resolve label paralel ===== */
function useResolvedLabels(segments: string[]) {
  const targets = useMemo(() => {
    return segments
      .map((seg, idx) => ({ seg, idx }))
      .filter(({ seg }) => looksLikeId(seg));
  }, [segments]);

  const queries = useQueries({
    queries: targets.map((t) => ({
      queryKey: ["breadcrumb-label", t.idx, t.seg, ...segments.slice(0, t.idx)],
      queryFn: async () => {
        const keys = getContextKeys(segments, t.idx, 4);
        // coba resolvers dari context paling spesifik → umum
        for (const k of keys) {
          const fn = resolvers[k];
          if (!fn) continue;
          try {
            const label = await fn(t.seg, { segments, index: t.idx });
            if (label) return label;
          } catch {
            // lanjut key berikutnya
          }
        }
        // fallback
        try {
          const label = await defaultResolver(t.seg, {
            segments,
            index: t.idx,
          } as any);
          if (label) return label;
        } catch {
          /* ignore */
        }
        // ultimate fallback → tampilkan ID apa adanya
        return t.seg;
      },
      staleTime: 1000 * 60 * 5,
    })),
  });

  // map seg->label
  const map = new Map<string, string>();
  targets.forEach((t, i) => {
    const q = queries[i];
    if (q?.data) map.set(t.seg, q.data);
  });
  return map;
}

/** ===== 6) Komponen Breadcrumb ===== */
const PATH_REDIRECTS: Record<string, string> = {
  "/admin": "/admin/dashboard/recruitment",
  "/admin/dashboard": "/admin/dashboard/recruitment",
  "/admin/dashboard/evaluator": "/admin/dashboard/evaluator/list",
  "/admin/dashboard/assignment-setting":
    "/admin/dashboard/assignment-setting/screening-question",
};

export const MainBreadcrumb = () => {
  const pathname = usePathname();

  const segments = useMemo(
    () => pathname.split("/").filter(Boolean),
    [pathname],
  );
  const resolved = useResolvedLabels(segments);

  const items = useMemo(() => {
    const arr: NonNullable<BreadcrumbProps["items"]> = [
      {
        title: (
          <Link href="/" style={{ cursor: "pointer" }}>
            Home
          </Link>
        ),
      },
    ];

    segments.forEach((seg, idx) => {
      const isLast = idx === segments.length - 1;
      const rawHref = "/" + segments.slice(0, idx + 1).join("/");
      const href = PATH_REDIRECTS[rawHref] ?? rawHref;

      const label =
        resolved.get(seg) ?? (looksLikeId(seg) ? seg : toCapitalized(seg));

      arr.push({
        title: isLast ? (
          label
        ) : (
          <Link href={href} style={{ cursor: "pointer" }}>
            {label}
          </Link>
        ),
      });
    });

    return arr;
  }, [segments, resolved]);

  return (
    <Breadcrumb
      style={{ fontSize: 14 }}
      items={items}
      separator={<RightOutlined style={{ fontSize: 12, color: "#bdbdbd" }} />}
    />
  );
};
