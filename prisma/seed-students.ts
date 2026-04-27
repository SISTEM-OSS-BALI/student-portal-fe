import { PrismaClient } from "@prisma/client";
// import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_STAGE_ID = "cmm0chywh000hjqjebo1f7ggd";

type StudentSeed = {
  name: string;
  email: string;
  no_phone: string;
  visa_type: string;
  degree: string;
  name_degree: string;
  name_campus: string;
  student_status: string;
  translation_quota: number;
};

const students: StudentSeed[] = [
  {
    name: "Manik Mahardika",
    email: "manik.student01@example.com",
    no_phone: "081234560001",
    visa_type: "student_visa_500",
    degree: "bachelor",
    name_degree: "Computer Science",
    name_campus: "University of Toronto",
    student_status: "ON GOING",
    translation_quota: 10,
  },
  {
    name: "Nerea Stanley",
    email: "nerea.student02@example.com",
    no_phone: "081234560002",
    visa_type: "visitor_600",
    degree: "bachelor",
    name_degree: "Business Management",
    name_campus: "Seneca College",
    student_status: "ON GOING",
    translation_quota: 8,
  },
  {
    name: "Ayu Prameswari",
    email: "ayu.student03@example.com",
    no_phone: "081234560003",
    visa_type: "student_visa_500",
    degree: "master",
    name_degree: "Data Science",
    name_campus: "University of Melbourne",
    student_status: "ON GOING",
    translation_quota: 12,
  },
  {
    name: "Dewa Putra",
    email: "dewa.student04@example.com",
    no_phone: "081234560004",
    visa_type: "student_visa_500",
    degree: "diploma",
    name_degree: "Hospitality Management",
    name_campus: "TAFE Queensland",
    student_status: "POSTPONE",
    translation_quota: 6,
  },
  {
    name: "Kadek Lestari",
    email: "kadek.student05@example.com",
    no_phone: "081234560005",
    visa_type: "visitor_600",
    degree: "bachelor",
    name_degree: "Tourism",
    name_campus: "Griffith University",
    student_status: "ON GOING",
    translation_quota: 7,
  },
  {
    name: "Komang Wirawan",
    email: "komang.student06@example.com",
    no_phone: "081234560006",
    visa_type: "student_visa_500",
    degree: "master",
    name_degree: "Information Technology",
    name_campus: "Monash University",
    student_status: "ON GOING",
    translation_quota: 11,
  },
  {
    name: "Made Sari",
    email: "made.student07@example.com",
    no_phone: "081234560007",
    visa_type: "student_visa_500",
    degree: "bachelor",
    name_degree: "Accounting",
    name_campus: "Deakin University",
    student_status: "CANCEL",
    translation_quota: 5,
  },
  {
    name: "Putu Aditya",
    email: "putu.student08@example.com",
    no_phone: "081234560008",
    visa_type: "student_visa_500",
    degree: "diploma",
    name_degree: "Commercial Cookery",
    name_campus: "William Angliss Institute",
    student_status: "ON GOING",
    translation_quota: 9,
  },
  {
    name: "Ni Luh Anjani",
    email: "anjani.student09@example.com",
    no_phone: "081234560009",
    visa_type: "visitor_600",
    degree: "bachelor",
    name_degree: "English Course",
    name_campus: "ILSC Education Group",
    student_status: "ON GOING",
    translation_quota: 4,
  },
  {
    name: "Gede Mahendra",
    email: "gede.student10@example.com",
    no_phone: "081234560010",
    visa_type: "student_visa_500",
    degree: "master",
    name_degree: "Cyber Security",
    name_campus: "RMIT University",
    student_status: "POSTPONE",
    translation_quota: 10,
  },
  {
    name: "Wayan Paramita",
    email: "wayan.student11@example.com",
    no_phone: "081234560011",
    visa_type: "student_visa_500",
    degree: "bachelor",
    name_degree: "Nursing",
    name_campus: "University of Adelaide",
    student_status: "ON GOING",
    translation_quota: 13,
  },
  {
    name: "Ketut Arimbawa",
    email: "ketut.student12@example.com",
    no_phone: "081234560012",
    visa_type: "visitor_600",
    degree: "diploma",
    name_degree: "General English",
    name_campus: "Navitas English",
    student_status: "ON GOING",
    translation_quota: 3,
  },
  {
    name: "Rai Anggreni",
    email: "rai.student13@example.com",
    no_phone: "081234560013",
    visa_type: "student_visa_500",
    degree: "master",
    name_degree: "Marketing",
    name_campus: "University of Sydney",
    student_status: "ON GOING",
    translation_quota: 8,
  },
  {
    name: "Agus Saputra",
    email: "agus.student14@example.com",
    no_phone: "081234560014",
    visa_type: "student_visa_500",
    degree: "bachelor",
    name_degree: "Software Engineering",
    name_campus: "Swinburne University",
    student_status: "ON GOING",
    translation_quota: 10,
  },
  {
    name: "Citra Dewi",
    email: "citra.student15@example.com",
    no_phone: "081234560015",
    visa_type: "student_visa_500",
    degree: "diploma",
    name_degree: "Early Childhood Education",
    name_campus: "Box Hill Institute",
    student_status: "CANCEL",
    translation_quota: 5,
  },
  {
    name: "Bayu Pratama",
    email: "bayu.student16@example.com",
    no_phone: "081234560016",
    visa_type: "visitor_600",
    degree: "bachelor",
    name_degree: "Business English",
    name_campus: "Kaplan International",
    student_status: "ON GOING",
    translation_quota: 6,
  },
  {
    name: "Diah Permatasari",
    email: "diah.student17@example.com",
    no_phone: "081234560017",
    visa_type: "student_visa_500",
    degree: "master",
    name_degree: "Education",
    name_campus: "University of Queensland",
    student_status: "ON GOING",
    translation_quota: 12,
  },
  {
    name: "Bagus Arya",
    email: "bagus.student18@example.com",
    no_phone: "081234560018",
    visa_type: "student_visa_500",
    degree: "bachelor",
    name_degree: "Architecture",
    name_campus: "UNSW Sydney",
    student_status: "POSTPONE",
    translation_quota: 7,
  },
  {
    name: "Sintya Maharani",
    email: "sintya.student19@example.com",
    no_phone: "081234560019",
    visa_type: "student_visa_500",
    degree: "diploma",
    name_degree: "Aged Care",
    name_campus: "Kangan Institute",
    student_status: "ON GOING",
    translation_quota: 8,
  },
  {
    name: "Rama Wijaya",
    email: "rama.student20@example.com",
    no_phone: "081234560020",
    visa_type: "visitor_600",
    degree: "bachelor",
    name_degree: "Short Course",
    name_campus: "Melbourne Language Centre",
    student_status: "ON GOING",
    translation_quota: 4,
  },
  {
    name: "Tari Kusuma",
    email: "tari.student21@example.com",
    no_phone: "081234560021",
    visa_type: "student_visa_500",
    degree: "master",
    name_degree: "Public Health",
    name_campus: "Curtin University",
    student_status: "ON GOING",
    translation_quota: 9,
  },
  {
    name: "Yoga Pramana",
    email: "yoga.student22@example.com",
    no_phone: "081234560022",
    visa_type: "student_visa_500",
    degree: "bachelor",
    name_degree: "Engineering",
    name_campus: "University of Western Australia",
    student_status: "ON GOING",
    translation_quota: 10,
  },
  {
    name: "Lia Kartika",
    email: "lia.student23@example.com",
    no_phone: "081234560023",
    visa_type: "student_visa_500",
    degree: "diploma",
    name_degree: "Graphic Design",
    name_campus: "Billy Blue College of Design",
    student_status: "POSTPONE",
    translation_quota: 6,
  },
  {
    name: "Surya Darma",
    email: "surya.student24@example.com",
    no_phone: "081234560024",
    visa_type: "visitor_600",
    degree: "bachelor",
    name_degree: "English Preparation",
    name_campus: "ELS Language Centers",
    student_status: "ON GOING",
    translation_quota: 5,
  },
  {
    name: "Mira Puspita",
    email: "mira.student25@example.com",
    no_phone: "081234560025",
    visa_type: "student_visa_500",
    degree: "master",
    name_degree: "International Business",
    name_campus: "Macquarie University",
    student_status: "ON GOING",
    translation_quota: 11,
  },
];

async function main() {
  console.log("Start seeding student users...");

  // const hashedPassword = await bcrypt.hash("password123", 10);

  for (const student of students) {
    await prisma.user.upsert({
      where: {
        email: student.email,
      },
      update: {
        name: student.name,
        role: "STUDENT",
        no_phone: student.no_phone,
        stage_id: DEFAULT_STAGE_ID,
        student_status: student.student_status,
        name_campus: student.name_campus,
        visa_type: student.visa_type,
        degree: student.degree,
        name_degree: student.name_degree,
        translation_quota: student.translation_quota,
        document_consent_signed: false,
        document_consent_signature_url: null,
        document_consent_proof_photo_url: null,
        document_consent_signed_at: null,
      },
      create: {
        name: student.name,
        email: student.email,

        // Ganti ke hashedPassword kalau schema kamu menyimpan password hash.
        password: "password123",
        // password: hashedPassword,

        role: "STUDENT",
        no_phone: student.no_phone,
        stage_id: DEFAULT_STAGE_ID,
        student_status: student.student_status,
        name_campus: student.name_campus,
        visa_type: student.visa_type,
        degree: student.degree,
        name_degree: student.name_degree,
        translation_quota: student.translation_quota,
        document_consent_signed: false,
        document_consent_signature_url: null,
        document_consent_proof_photo_url: null,
        document_consent_signed_at: null,
        joined_at: new Date(),
      },
    });
  }

  console.log("Seed student users completed.");
}

main()
  .catch((error: unknown) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });