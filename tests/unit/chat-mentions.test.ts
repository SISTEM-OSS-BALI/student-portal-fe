import { describe, it } from "node:test";
import assert from "node:assert/strict";

const normalizeHandle = (value: string) => {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ".")
    .replace(/[^a-z0-9._-]/g, "");
};

const getLegacyEmailHandle = (user: { name?: string | null; email?: string | null }) => {
  const email = user.email ?? "";
  return normalizeHandle(email.split("@")[0] ?? "");
};

const getUserHandle = (user: { name?: string | null; email?: string | null }) => {
  const fromName = normalizeHandle(user.name ?? "");
  if (fromName) return fromName;
  return getLegacyEmailHandle(user);
};

const buildMentionMap = (users: Array<{ id: string; name: string; email?: string; role: string }>) => {
  const map = new Map<string, { id: string; name: string; role: string }>();
  users.forEach((user) => {
    const preferredHandle = getUserHandle(user);
    const legacyHandle = getLegacyEmailHandle(user);
    const rawName = normalizeHandle(user.name ?? "");
    if (preferredHandle) map.set(preferredHandle, user);
    if (legacyHandle) map.set(legacyHandle, user);
    if (rawName) map.set(rawName, user);
  });
  return map;
};

const extractMentionUserIds = (
  text: string,
  mentionMap: Map<string, { id: string; name: string; role: string }>,
) => {
  const matches = text.match(/@([a-zA-Z0-9._-]+)/g) ?? [];
  const ids = new Set<string>();

  matches.forEach((raw) => {
    const handle = raw.slice(1).toLowerCase();
    const user = mentionMap.get(handle);
    if (user) {
      ids.add(String(user.id));
    }
  });

  return Array.from(ids);
};

describe("Chat Tag & @Mention Feature Tests", () => {
  const mockTeamUsers = [
    {
      id: "usr_1",
      name: "Admin Director",
      email: "apply@onestepsolutionbali.com",
      role: "DIRECTOR",
    },
    {
      id: "usr_3",
      name: "Admission Staff",
      email: "admission@onestepsolutionbali.com",
      role: "ADMISSION",
    },
    {
      id: "usr_cst_jani",
      name: "Jani",
      email: "jani@onestepsolutionbali.com",
      role: "CONSULTANT",
    },
    {
      id: "usr_cst_ayu",
      name: "Ayu",
      email: "ayu@onestepsolutionbali.com",
      role: "CONSULTANT",
    },
    {
      id: "usr_cst_nadia",
      name: "Nadia",
      email: "nadia@onestepsolutionbali.com",
      role: "CONSULTANT",
    },
    {
      id: "usr_cst_rafli",
      name: "Rafli",
      email: "rafli@onestepsolutionbali.com",
      role: "CONSULTANT",
    },
  ];

  const mentionMap = buildMentionMap(mockTeamUsers);

  describe("Task 1: Handle Normalization", () => {
    it("harus mengubah nama berspasi menjadi dot handle yang aman", () => {
      assert.equal(getUserHandle({ name: "Admin Director" }), "admin.director");
      assert.equal(getUserHandle({ name: "Admission Staff" }), "admission.staff");
    });

    it("harus menjaga nama tunggal tetap bersih", () => {
      assert.equal(getUserHandle({ name: "Jani" }), "jani");
      assert.equal(getUserHandle({ name: "Ayu" }), "ayu");
      assert.equal(getUserHandle({ name: "Rafli" }), "rafli");
    });

    it("harus fallback ke prefix email jika nama kosong", () => {
      assert.equal(
        getUserHandle({ name: "", email: "consultant@example.com" }),
        "consultant",
      );
    });
  });

  describe("Task 2: Mention Extraction from Chat Message Text", () => {
    it("harus mendeteksi single mention (@jani)", () => {
      const text = "Halo @jani mohon bantu review berkas ini ya";
      const result = extractMentionUserIds(text, mentionMap);
      assert.deepEqual(result, ["usr_cst_jani"]);
    });

    it("harus mendeteksi multiple mentions (@jani dan @admin.director)", () => {
      const text = "Mohon persetujuan dari @admin.director dan tindak lanjut dari @jani";
      const result = extractMentionUserIds(text, mentionMap);
      assert.equal(result.length, 2);
      assert.ok(result.includes("usr_1"));
      assert.ok(result.includes("usr_cst_jani"));
    });

    it("harus tahan terhadap tanda baca di sekitar tag (@ayu, tolong!)", () => {
      const text = "Selamat siang @ayu, tolong cek status visa ini segera.";
      const result = extractMentionUserIds(text, mentionMap);
      assert.deepEqual(result, ["usr_cst_ayu"]);
    });

    it("harus mendukung mention via email prefix (@admission)", () => {
      const text = "Tagging @admission untuk verifikasi rekening koran.";
      const result = extractMentionUserIds(text, mentionMap);
      assert.deepEqual(result, ["usr_3"]);
    });

    it("tidak boleh mencatat user ID jika tag tidak terdaftar dalam tim", () => {
      const text = "Tolong hubungi @random_user dan @siapapun di grup.";
      const result = extractMentionUserIds(text, mentionMap);
      assert.deepEqual(result, []);
    });

    it("harus menghasilkan array kosong jika pesan tidak mengandung tag @", () => {
      const text = "Pesan obrolan biasa tanpa mention sama sekali.";
      const result = extractMentionUserIds(text, mentionMap);
      assert.deepEqual(result, []);
    });
  });

  describe("Task 3: Isolasi Data & Keamanan Tag Siswa (Student Isolation Rule)", () => {
    const rawDatabaseUsers = [
      ...mockTeamUsers,
      { id: "std_101", name: "Budi Santoso", role: "STUDENT" },
      { id: "std_102", name: "Siti Rahma", role: "STUDENT" },
      { id: "std_103", name: "Kevin Wijaya", role: "STUDENT" },
    ];

    const isMatchingConsultant = (
      consultantUser: { name: string; email?: string },
      targetName?: string | null,
    ) => {
      if (!targetName) return false;
      const cleanTarget = targetName.trim().toLowerCase();
      const cleanUser = consultantUser.name.trim().toLowerCase();
      const cleanEmail = (consultantUser.email ?? "").trim().toLowerCase();

      return (
        cleanUser === cleanTarget ||
        cleanTarget.includes(cleanUser) ||
        cleanUser.includes(cleanTarget) ||
        (Boolean(cleanEmail) && cleanTarget.includes(cleanEmail.split("@")[0]))
      );
    };

    const filterMentionableUsers = (
      users: Array<{ id: string; name: string; role: string; email?: string }>,
      currentUserId: string,
      currentTicketStudent?: { id: string; name: string; role: string },
      assignedConsultantName?: string | null,
    ) => {
      // 1. Staf Director & Admission
      const list = users.filter((u) => {
        const role = String(u.role ?? "").toUpperCase();
        return role === "DIRECTOR" || role === "ADMISSION";
      });

      // 2. HANYA 1 konsultan yang bertanggung jawab mengurus siswa ini
      const consultants = users.filter(
        (u) => String(u.role ?? "").toUpperCase() === "CONSULTANT",
      );

      if (assignedConsultantName) {
        const matched = consultants.filter((c) =>
          isMatchingConsultant(c, assignedConsultantName),
        );
        if (matched.length > 0) {
          list.push(...matched);
        }
      }

      // 3. Tambahkan HANYA 1 siswa yang bersangkutan dengan tiket ini
      if (
        currentTicketStudent?.id &&
        !list.some((u) => String(u.id) === String(currentTicketStudent.id))
      ) {
        list.push(currentTicketStudent);
      }

      // Siswa tidak boleh me-mention dirinya sendiri
      return list.filter((u) => String(u.id) !== String(currentUserId));
    };

    it("staf admisi hanya dapat melihat staf dan HANYA konsultan penanggung jawab siswa tersebut", () => {
      const activeStudent = { id: "std_101", name: "Budi Santoso", role: "STUDENT" };
      // Budi Santoso berada di bawah pantauan konsultan Jani
      const mentionable = filterMentionableUsers(
        rawDatabaseUsers,
        "usr_3", // Admisi
        activeStudent,
        "Jani",
      );

      const names = mentionable.map((u) => u.name);

      // Konsultan PIC (Jani), Director, dan Siswa bersangkutan HARUS muncul
      assert.ok(names.includes("Jani"));
      assert.ok(names.includes("Admin Director"));
      assert.ok(names.includes("Budi Santoso"));

      // Konsultan lain (Ayu, Nadia, Rafli) TIDAK BOLEH muncul
      assert.equal(names.includes("Ayu"), false);
      assert.equal(names.includes("Nadia"), false);
      assert.equal(names.includes("Rafli"), false);

      // Siswa lain (Siti Rahma, Kevin Wijaya) TIDAK BOLEH muncul
      assert.equal(names.includes("Siti Rahma"), false);
      assert.equal(names.includes("Kevin Wijaya"), false);
    });

    it("siswa yang membuka chat tiketnya sendiri hanya dapat me-mention konsultan PIC dan staf pendamping", () => {
      const activeStudent = { id: "std_101", name: "Budi Santoso", role: "STUDENT" };
      const mentionable = filterMentionableUsers(
        rawDatabaseUsers,
        "std_101", // Siswa login
        activeStudent,
        "Jani Antari",
      );

      const names = mentionable.map((u) => u.name);
      // Siswa tidak melihat dirinya sendiri
      assert.equal(names.includes("Budi Santoso"), false);
      // Siswa tidak melihat siswa lain
      assert.equal(names.includes("Siti Rahma"), false);
      assert.equal(names.includes("Kevin Wijaya"), false);
      // Siswa TIDAK melihat konsultan lain
      assert.equal(names.includes("Ayu"), false);
      assert.equal(names.includes("Nadia"), false);
      assert.equal(names.includes("Rafli"), false);
      // Siswa HANYA melihat konsultan pembimbingnya (Jani) dan tim manajemen (Director, Admission)
      assert.ok(names.includes("Admission Staff"));
      assert.ok(names.includes("Jani"));
      assert.ok(names.includes("Admin Director"));
    });
  });
});
