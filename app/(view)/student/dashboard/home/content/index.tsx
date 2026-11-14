"use client";

import {
  Badge,
  Button,
  Card,
  Col,
  Empty,
  Row,
  Space,
  Steps,
  Tag,
  Typography,
} from "antd";
import {
  ArrowRightOutlined,
  CalendarOutlined,
  CheckOutlined,
  DownOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  HomeOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useUser } from "@/app/hooks/use-users";
import { useAuth } from "@/app/utils/use-auth";
import { useMemo, useState } from "react";
import { useAnswerDocumentApprovals } from "@/app/hooks/use-answer-document-approvals";
import { useAnswerApprovals } from "@/app/hooks/use-answer-approvals";
import { useAnswerDocuments } from "@/app/hooks/use-answer-documents";
import { useAnswerQuestions } from "@/app/hooks/use-answer-questions";
import { useStagesManagement } from "@/app/hooks/use-stages-management";
import { useVisaTypes } from "@/app/hooks/use-visa-type-management";
import { useDocuments } from "@/app/hooks/use-documents-management";
import { getCountryName } from "@/app/utils/student-helpers";
import LoadingSplash from "@/app/components/common/loading";
import PageHeader from "@/app/components/common/page-header";
import StudentCvCard from "./StudentCvCard";
import styles from "./home.module.css";

const { Title, Text, Paragraph } = Typography;

type StudentStepChild = {
  id: string;
  label: string;
};

type StudentStep = {
  id: string;
  label: string;
  child_ids?: string[];
  children?: StudentStepChild[];
  created_at?: string;
  updated_at?: string;
};

type StudentCountry = {
  id: string;
  name: string;
  steps?: StudentStep[];
};

type StudentDocument = {
  id: string;
  label: string;
  internal_code?: string;
  file_type?: string;
  category?: string;
  translation_needed?: string;
  required?: boolean;
  auto_rename_pattern?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
};

type StudentStage = {
  id: string;
  country_id?: string;
  document_id?: string;
  country?: StudentCountry;
  document?: StudentDocument;
  created_at?: string;
  updated_at?: string;
};

type StudentUser = {
  id: string;
  name: string;
  email?: string;
  role?: string;
  no_phone?: string;
  stage_id?: string;
  current_step_id?: string;
  visa_status?: string;
  visa_granted_at?: string;
  visa_grant_duration_days?: number;
  visa_grant_duration_label?: string;
  student_status?: string;
  student_status_updated_by_id?: string;
  student_status_updated_by_name?: string;
  student_status_updated_at?: string;
  student_status_updated_at_label?: string;
  stage?: StudentStage;
  name_campus?: string;
  visa_type?: string;
  visa_type_name?: string;
  degree?: string;
  name_degree?: string;
  translation_quota?: number;
  joined_at?: string;
  created_at?: string;
  updated_at?: string;
  document_consent_signature_url?: string;
  statement_letter_file_url?: string;
  workflow_checked_ids?: string | null;
};

type RejectedFeedbackItem = {
  id: string;
  type: "document" | "form";
  title: string;
  note: string;
  reviewed_at?: string | null;
};

type StudentTaskPriority =
  | "Current Step"
  | "Upcoming Step"
  | "Required Document"
  | "Revision Required";

type StudentTaskItem = {
  id: string;
  title: string;
  subtitle?: string;
  priority: StudentTaskPriority;
  link?: string;
  actionLabel?: string;
};

function getTaskBadgeMeta(priority: StudentTaskPriority) {
  switch (priority) {
    case "Revision Required":
      return {
        label: "Perlu Revisi",
        color: "error" as const,
      };
    case "Required Document":
      return {
        label: "Required",
        color: "warning" as const,
      };
    case "Current Step":
      return {
        label: "Tahap Saat Ini",
        color: "processing" as const,
      };
    default:
      return null;
  }
}

function extractStepNumber(label: string): number {
  const match = label.match(/(\d+)/);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

function formatDegree(value?: string): string {
  if (!value) return "-";
  return value
    .split("_")
    .join(" ")
    .split(" ")
    .filter(Boolean)
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1).toLowerCase())
    .join(" ");
}

function formatVisaType(value?: string): string {
  if (!value) return "-";
  return value
    .split("_")
    .join(" ")
    .split(" ")
    .filter(Boolean)
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
    .join(" ");
}

function resolveVisaTypeLabel(
  student: StudentUser | undefined,
  visaTypeNameById: Map<string, string>,
): string {
  const visaTypeName = String(student?.visa_type_name ?? "").trim();
  if (visaTypeName) {
    return visaTypeName;
  }

  const visaTypeValue = String(student?.visa_type ?? "").trim();
  if (!visaTypeValue) {
    return "-";
  }

  const mappedName = visaTypeNameById.get(visaTypeValue);
  if (mappedName) {
    return mappedName;
  }

  return formatVisaType(visaTypeValue);
}

const cleanStepSlashText = (val?: string | null): string => {
  if (!val) return "";
  return val
    .replace(/Admin Fee\s*\/\s*Service Fee/gi, "Admin Fee")
    .replace(/student\/client/gi, "student")
    .replace(/Next of kin\/parents/gi, "Next of Kin");
};

const defaultWorkflow = [
  {
    id: "step-1",
    label: "Preparation",
    children: [
      { id: "c-1-1", label: "Pengumpulan Dokumen" },
      { id: "c-1-2", label: "English Course" },
    ],
  },
  {
    id: "step-2",
    label: "Progress",
    children: [
      { id: "c-2-1", label: "Admin Fee 1" },
      { id: "c-2-2", label: "Offer Letter Acceptance" },
      { id: "c-2-3", label: "Medical Check Up" },
      { id: "c-2-4", label: "Visa Application Submission" },
      { id: "c-2-5", label: "Pembayaran 2" },
      { id: "c-2-6", label: "Final Doc Visa" },
    ],
  },
  {
    id: "step-3",
    label: "Complete",
    children: [
      { id: "c-3-1", label: "Biometrics & Visa Grant" },
      { id: "c-3-2", label: "Admin Fee 2" },
      { id: "c-3-3", label: "Pre-Departure Briefing" },
      { id: "c-3-4", label: "Arrival & On-shore Support" },
    ],
  },
];

function getStepsData(user?: StudentUser) {
  const rawSteps = user?.stage?.country?.steps ?? [];
  const sortedSteps = [...rawSteps].sort((a, b) => {
    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;

    if (timeA !== timeB) {
      return timeA - timeB;
    }

    return extractStepNumber(a.label) - extractStepNumber(b.label);
  });

  const currentStepId = String(user?.current_step_id ?? "");
  const currentIndex = sortedSteps.findIndex((step) => {
    if (step.id === currentStepId) return true;
    return (step.children ?? []).some((child) => child.id === currentStepId);
  });

  const visaGranted = (user?.visa_status ?? "").toLowerCase() === "grant";

  const currentStep =
    visaGranted && sortedSteps.length > 0
      ? sortedSteps.length - 1
      : currentIndex >= 0
        ? currentIndex
        : 0;

  const stepItems = sortedSteps.map((step, index) => {
    const isDone = visaGranted ? true : index < currentStep;
    const isCurrent = !visaGranted && index === currentStep;

    let descText = "";
    if (isDone) {
      descText = "Tahapan selesai";
    } else if (isCurrent) {
      const activeChild = (step.children ?? []).find(
        (child) => child.id === currentStepId,
      );
      if (activeChild) {
        descText = `Berjalan: ${cleanStepSlashText(activeChild.label)}`;
      } else {
        descText = "Sedang berlangsung";
      }
    } else {
      const childCount = step.children?.length ?? 0;
      descText = childCount > 0 ? `Berikutnya (${childCount} langkah)` : "Berikutnya";
    }

    return {
      title: step.label,
      description: descText,
      status: isDone
        ? ("finish" as const)
        : isCurrent
          ? ("process" as const)
          : ("wait" as const),
    };
  });

  const allStepChildren = sortedSteps.map((step) => ({
    stepLabel: step.label,
    children: (step.children ?? []).map((child) => ({
      id: child.id,
      label: cleanStepSlashText(child.label),
      isCurrent: child.id === currentStepId,
    })),
  }));

  const pendingTasks: Array<{
    id: string;
    title: string;
    priority: "Current Step" | "Upcoming Step";
  }> = sortedSteps
    .filter((step) => {
      const index = sortedSteps.findIndex((item) => item.id === step.id);
      return visaGranted ? false : index >= currentStep;
    })
    .flatMap((step) => {
      const sortedChildren = [...(step.children ?? [])].sort(
        (a, b) => extractStepNumber(a.label) - extractStepNumber(b.label),
      );

      if (sortedChildren.length === 0) {
        return [
          {
            id: step.id,
            title: cleanStepSlashText(step.label),
            priority:
              step.id === currentStepId ||
              sortedChildren.some((child) => child.id === currentStepId)
                ? ("Current Step" as const)
                : ("Upcoming Step" as const),
          },
        ];
      }

      return sortedChildren.map((child) => ({
        id: child.id,
        title: cleanStepSlashText(child.label),
        priority:
          step.id === currentStepId ||
          sortedChildren.some((child) => child.id === currentStepId)
            ? ("Current Step" as const)
            : ("Upcoming Step" as const),
      }));
    });

  return {
    stepItems,
    currentStep,
    pendingTasks,
    allStepChildren,
  };
}

function buildTerms(user?: StudentUser): string[] {
  const items: string[] = [];

  if (user?.stage?.document?.required) {
    const rawLabel = String(user.stage.document.label || "")
      .replace(/\s*\([^)]*\)/g, "")
      .trim();
    items.push(`Dokumen ${rawLabel} wajib diunggah.`);
  }

  if (user?.stage?.document?.file_type) {
    const rawType = String(user.stage.document.file_type).toLowerCase();
    const formattedType =
      rawType.includes("image") || rawType.includes("jpg") || rawType.includes("png")
        ? "Format berkas yang diterima adalah gambar JPG atau PNG."
        : rawType.includes("pdf")
        ? "Format berkas yang diterima adalah PDF."
        : `Format berkas yang diterima adalah ${rawType.toUpperCase()}.`;
    items.push(formattedType);
  }

  if (user?.stage?.document?.translation_needed === "YES") {
    items.push("Dokumen ini memerlukan proses penerjemahan resmi.");
  }

  if (user?.translation_quota !== undefined) {
    items.push(`Kuota penerjemahan dokumen yang tersedia berjumlah ${user.translation_quota}.`);
  }

  if (user?.stage?.document?.notes) {
    const cleanNotes = user.stage.document.notes.replace(/\s*\([^)]*\)/g, "").trim();
    if (cleanNotes) {
      items.push(cleanNotes);
    }
  }

  return items;
}

export default function DashboardContent() {
  const router = useRouter();
  const { user_id } = useAuth();
  const { data: user, fetchLoading } = useUser({
    id: user_id,
  });
  const effectiveStudentId = String(user?.id ?? user_id ?? "");
  const { data: stages } = useStagesManagement({});
  const { data: masterDocuments = [] } = useDocuments({});
  const { data: answerDocuments = [] } = useAnswerDocuments({
    queryString: effectiveStudentId ? `student_id=${effectiveStudentId}` : undefined,
    enabled: Boolean(effectiveStudentId),
  });
  const { data: answerQuestions = [] } = useAnswerQuestions({
    queryString: effectiveStudentId ? `student_id=${effectiveStudentId}` : undefined,
    enabled: Boolean(effectiveStudentId),
    withNotification: false,
  });
  const { data: answerDocumentApprovals = [] } = useAnswerDocumentApprovals({
    queryString: effectiveStudentId ? `student_id=${effectiveStudentId}` : undefined,
    enabled: Boolean(effectiveStudentId),
  });
  const { data: answerApprovals = [] } = useAnswerApprovals({
    queryString: effectiveStudentId ? `student_id=${effectiveStudentId}` : undefined,
    enabled: Boolean(effectiveStudentId),
  });
  const { data: visaTypes = [] } = useVisaTypes();

  const student = user as StudentUser | undefined;
  const visaTypeNameById = useMemo(() => {
    return new Map(
      visaTypes.map((item) => [String(item.id), String(item.name ?? "").trim()]),
    );
  }, [visaTypes]);

  const [showStepDetails, setShowStepDetails] = useState(false);
  const { stepItems, currentStep, allStepChildren } = useMemo(
    () => getStepsData(student),
    [student],
  );

  const workflowSteps = useMemo(() => {
    const rawSteps = student?.stage?.country?.steps ?? [];
    const hasDbStepsWithChildren = rawSteps.some(
      (s) => s.children && s.children.length > 0,
    );
    if (hasDbStepsWithChildren) {
      return [...rawSteps]
        .sort((a, b) => {
          const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
          if (timeA !== timeB) return timeA - timeB;
          return extractStepNumber(a.label) - extractStepNumber(b.label);
        })
        .map((s, idx) => ({
          id: String(s.id || idx),
          label: cleanStepSlashText(s.label),
          children: (s.children || []).map((c, cIdx) => ({
            id: String(c.id || `${idx}-${cIdx}`),
            label: cleanStepSlashText(c.label),
          })),
        }));
    }
    return defaultWorkflow;
  }, [student?.stage?.country?.steps]);

  const checkedItems = useMemo<Record<string, boolean>>(() => {
    if (student?.workflow_checked_ids) {
      try {
        const ids = JSON.parse(student.workflow_checked_ids);
        if (Array.isArray(ids) && ids.length > 0) {
          const map: Record<string, boolean> = {};
          ids.forEach((id: string) => {
            map[id] = true;
          });
          return map;
        }
      } catch (e) {
        // ignore
      }
    }

    const map: Record<string, boolean> = {};
    const visaGranted = (student?.visa_status ?? "").toLowerCase() === "grant";
    workflowSteps.forEach((step, sIdx) => {
      const isPastStep = visaGranted ? true : sIdx < currentStep;
      if (isPastStep) {
        step.children.forEach((c) => {
          map[c.id] = true;
        });
      }
    });
    return map;
  }, [student?.workflow_checked_ids, student?.visa_status, workflowSteps, currentStep]);

  const totalCheckable = useMemo(() => {
    return workflowSteps.reduce((acc, step) => acc + step.children.length, 0);
  }, [workflowSteps]);

  const totalChecked = useMemo(() => {
    return workflowSteps.reduce(
      (acc, step) => acc + step.children.filter((c) => checkedItems[c.id]).length,
      0,
    );
  }, [workflowSteps, checkedItems]);

  const rejectedFeedbacks = useMemo<RejectedFeedbackItem[]>(() => {
    const documentNameById = new Map<string, string>();
    (masterDocuments ?? []).forEach((doc) => {
      if (!doc?.id) return;
      documentNameById.set(
        String(doc.id),
        String(doc.label ?? doc.internal_code ?? "Document"),
      );
    });
    (stages ?? []).forEach((stage) => {
      if (!stage?.document?.id) return;
      documentNameById.set(
        String(stage.document.id),
        String(stage.document.label ?? stage.document.internal_code ?? "Document"),
      );
    });

    const answerDocumentById = new Map<string, (typeof answerDocuments)[number]>();
    const latestAnswerByDocumentId = new Map<string, (typeof answerDocuments)[number]>();
    (answerDocuments ?? []).forEach((item) => {
      const key = String(item.document_id ?? "");
      answerDocumentById.set(String(item.id), item);
      if (!key) return;
      const existing = latestAnswerByDocumentId.get(key);
      if (!existing) {
        latestAnswerByDocumentId.set(key, item);
        return;
      }
      const existingTime = Date.parse(
        String(existing.updated_at ?? existing.created_at ?? ""),
      );
      const nextTime = Date.parse(String(item.updated_at ?? item.created_at ?? ""));
      if (Number.isNaN(existingTime) || nextTime > existingTime) {
        latestAnswerByDocumentId.set(key, item);
      }
    });

    const answerQuestionById = new Map<string, (typeof answerQuestions)[number]>();
    (answerQuestions ?? []).forEach((item) => {
      answerQuestionById.set(String(item.id), item);
    });

    const documentRejects = answerDocumentApprovals
      .filter((item) => {
        if (
          String(item.status ?? "").toLowerCase() !== "rejected" ||
          !String(item.note ?? "").trim()
        ) {
          return false;
        }
        // Pastikan catatan penolakan hanya aktif jika berkas ini adalah berkas terbaru
        const ansDoc = answerDocumentById.get(String(item.answer_document_id ?? ""));
        if (!ansDoc) return false;
        const latestDoc = latestAnswerByDocumentId.get(String(ansDoc.document_id));
        return latestDoc ? String(latestDoc.id) === String(ansDoc.id) : true;
      })
      .map((item) => {
        const answerDoc = answerDocumentById.get(String(item.answer_document_id ?? ""));
        const docId = String(answerDoc?.document_id ?? "");
        const docName =
          documentNameById.get(docId) ||
          String(answerDoc?.file_name ?? "").trim() ||
          "Document";
        return {
          id: `doc-${item.id}`,
          type: "document" as const,
          title: `Dokumen ${docName}`,
          note: String(item.note ?? "").trim(),
          reviewed_at: item.reviewed_at ?? item.updated_at,
        };
      });

    const formRejects = answerApprovals
      .filter(
        (item) =>
          String(item.status ?? "").toLowerCase() === "rejected" &&
          String(item.note ?? "").trim(),
      )
      .map((item) => {
        const answer = answerQuestionById.get(String(item.answer_id ?? ""));
        const answerPreview = String(answer?.answer_text ?? "").trim();
        return {
          id: `form-${item.id}`,
          type: "form" as const,
          title: answerPreview
            ? `Formulir ${answerPreview.slice(0, 60)}${answerPreview.length > 60 ? "..." : ""}`
            : "Pengajuan formulir",
          note: String(item.note ?? "").trim(),
          reviewed_at: item.reviewed_at ?? item.updated_at,
        };
      });

    return [...documentRejects, ...formRejects].sort((a, b) => {
      const aTime = Date.parse(String(a.reviewed_at ?? ""));
      const bTime = Date.parse(String(b.reviewed_at ?? ""));
      if (Number.isNaN(aTime) && Number.isNaN(bTime)) return 0;
      if (Number.isNaN(aTime)) return 1;
      if (Number.isNaN(bTime)) return -1;
      return bTime - aTime;
    });
  }, [answerApprovals, answerDocumentApprovals, answerDocuments, answerQuestions, masterDocuments, stages]);

  const terms = useMemo(() => buildTerms(student), [student]);

  const tasksToDo = useMemo<StudentTaskItem[]>(() => {
    const tasks: StudentTaskItem[] = [];

    // 1. Tentukan target dokumen berdasarkan stage negara student (atau master dokumen required sebagai fallback)
    let countryId = String(student?.stage?.country_id ?? "").trim();
    if (!countryId && user) {
      const cName = getCountryName(user).toLowerCase();
      const matchedStage = (stages ?? []).find(
        (s) =>
          s.country?.name &&
          s.country.name.toLowerCase() === cName,
      );
      if (matchedStage?.country_id) {
        countryId = String(matchedStage.country_id);
      }
    }

    const stageDocs = countryId
      ? (stages ?? [])
          .filter((stage) => String(stage.country_id ?? "") === countryId)
          .map((stage) => stage.document)
          .filter((doc): doc is NonNullable<typeof doc> => Boolean(doc))
      : [];

    const docMap = new Map<string, (typeof masterDocuments)[number]>();
    if (stageDocs.length > 0) {
      stageDocs.forEach((doc) => {
        if (doc?.id) {
          const idStr = String(doc.id);
          const masterMatch = (masterDocuments ?? []).find(
            (d) =>
              String(d.id) === idStr ||
              (d.internal_code && doc.internal_code && d.internal_code === doc.internal_code),
          );
          const isReq =
            masterMatch !== undefined ? Boolean(masterMatch.required) : Boolean(doc.required);
          docMap.set(idStr, { ...doc, required: isReq });
        }
      });
    } else {
      (masterDocuments ?? []).forEach((doc) => {
        if (doc?.id) {
          docMap.set(String(doc.id), doc);
        }
      });
    }
    const relevantDocs = Array.from(docMap.values());

    // 2. Kumpulkan seluruh identifier dokumen yang sudah berhasil diunggah
    const completedDocIdentifiers = new Set<string>();

    (answerDocuments ?? []).forEach((item) => {
      if (!item.file_url) return;
      const docIdStr = String(item.document_id ?? "");
      if (docIdStr) completedDocIdentifiers.add(docIdStr);

      const matched = (masterDocuments ?? []).find(
        (d) =>
          String(d.id) === docIdStr ||
          (d.internal_code && d.internal_code === docIdStr),
      );
      if (matched) {
        completedDocIdentifiers.add(String(matched.id));
        if (matched.internal_code) completedDocIdentifiers.add(matched.internal_code);
      }

      // Deteksi via nama file jika format penamaan standar auto-rename dipakai
      const fileNameLower = String(item.file_name ?? "").toLowerCase();
      (masterDocuments ?? []).forEach((d) => {
        const codeLower = String(d.internal_code ?? "").toLowerCase();
        const idLower = String(d.id ?? "").toLowerCase();
        if (
          (codeLower && fileNameLower.includes(codeLower)) ||
          (idLower && fileNameLower.includes(idLower))
        ) {
          completedDocIdentifiers.add(String(d.id));
          if (d.internal_code) completedDocIdentifiers.add(d.internal_code);
        }
      });
    });

    // 3. Sinkronisasi tanda tangan digital onboarding mahasiswa
    const hasVerifiedOnboardingSignature = Boolean(
      student?.document_consent_signature_url ||
      student?.statement_letter_file_url,
    );
    if (hasVerifiedOnboardingSignature) {
      completedDocIdentifiers.add("doc_sign");
      completedDocIdentifiers.add("STUDENT_SIGN");
      completedDocIdentifiers.add("doc_signature");
    }

    // 4. Deteksi dokumen yang ditolak (Rejected) oleh tim admission
    const rejectedDocIds = new Set<string>();
    (answerDocumentApprovals ?? []).forEach((appr) => {
      if (String(appr.status ?? "").toLowerCase() === "rejected") {
        const ansDoc = (answerDocuments ?? []).find(
          (ad) => String(ad.id) === String(appr.answer_document_id),
        );
        if (ansDoc?.document_id) {
          rejectedDocIds.add(String(ansDoc.document_id));
        }
      }
    });

    // Berkas yang ditolak dicabut dari status selesai agar masuk daftar revisi
    rejectedDocIds.forEach((rejId) => {
      completedDocIdentifiers.delete(rejId);
      const matched = (masterDocuments ?? []).find(
        (d) => String(d.id) === rejId || d.internal_code === rejId,
      );
      if (matched) {
        completedDocIdentifiers.delete(String(matched.id));
        if (matched.internal_code) {
          completedDocIdentifiers.delete(matched.internal_code);
        }
      }
    });

    // 5. Masukkan task revisi dari feedback admisi ke daftar prioritas tertinggi
    rejectedFeedbacks.forEach((item) => {
      tasks.push({
        id: `revision-${item.id}`,
        title: item.title,
        subtitle: item.note || "Perlu perbaikan sesuai arahan admisi",
        priority: "Revision Required",
        link:
          item.type === "document"
            ? "/student/dashboard/upload-country-document"
            : "/student/dashboard/upload-personal-information",
        actionLabel: "Perbaiki",
      });
    });

    // 6. Masukkan dokumen wajib yang belum diunggah
    relevantDocs.forEach((doc) => {
      if (!doc.required) return;
      const isCompleted =
        completedDocIdentifiers.has(String(doc.id)) ||
        (doc.internal_code && completedDocIdentifiers.has(doc.internal_code));

      if (!isCompleted) {
        tasks.push({
          id: `required-doc-${doc.id}`,
          title: doc.label,
          subtitle: "Dokumen persyaratan pendaftaran",
          priority: "Required Document",
          link: "/student/dashboard/upload-country-document",
          actionLabel: "Unggah",
        });
      }
    });

    // 7. Hilangkan duplikasi task title
    const unique = new Map<string, StudentTaskItem>();
    tasks.forEach((task) => {
      if (!unique.has(task.title)) {
        unique.set(task.title, task);
      }
    });

    return Array.from(unique.values());
  }, [
    answerDocuments,
    answerDocumentApprovals,
    masterDocuments,
    rejectedFeedbacks,
    stages,
    student?.document_consent_signature_url,
    student?.statement_letter_file_url,
    student?.stage?.country_id,
    user,
  ]);

  if (fetchLoading) {
    return <LoadingSplash label="Loading dashboard..." />;
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title={`Halo, ${student?.name || "Mahasiswa"}!`}
        subtitle="Pantau progres pendaftaran dan kelengkapan dokumen studi Anda"
        icon={<HomeOutlined />}
      />

      <Card
        id="student-tour-progress"
        className={styles.dashboardCard}
      >
        <Space direction="vertical" size={14} style={{ width: "100%" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                className="app-heading-2"
                style={{ fontSize: 14.5, fontWeight: 700, color: "#0f172a" }}
              >
                Application Progress
              </span>
              <Tag
                color="blue"
                style={{ borderRadius: 6, fontSize: 11, fontWeight: 600, margin: 0 }}
              >
                Tahap {Math.min(currentStep + 1, workflowSteps.length)} dari{" "}
                {workflowSteps.length}
              </Tag>
            </div>
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 500 }}>
              {totalChecked} dari {totalCheckable} langkah selesai
            </Text>
          </div>

          {/* Desktop Layout: 3 Columns side-by-side */}
          <div className={styles.workflowTimelineDesktop}>
            {workflowSteps.map((step, idx) => {
              const stepCheckedCount = step.children.filter(
                (c) => checkedItems[c.id],
              ).length;
              const stepTotalCount = step.children.length;
              const isCurrent = idx === currentStep;

              return (
                <div
                  key={step.id}
                  className={`${styles.workflowStepCard} ${
                    isCurrent ? styles.workflowStepCardActive : ""
                  }`}
                >
                  <div className={styles.stepHeaderRow}>
                    <div
                      className={`${styles.stepNumberCircle} ${
                        !isCurrent &&
                        stepCheckedCount < stepTotalCount &&
                        idx > currentStep
                          ? styles.stepNumberCircleInactive
                          : ""
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <span className={styles.stepLabel}>{step.label}</span>
                    <span className={styles.stepBadgePill}>
                      {stepCheckedCount}/{stepTotalCount}
                    </span>
                  </div>

                  <div className={styles.checkboxList}>
                    {step.children.map((child) => {
                      const isChecked = Boolean(checkedItems[child.id]);
                      return (
                        <div key={child.id} className={styles.previewItem}>
                          {isChecked ? (
                            <span className={styles.previewCheckDone}>
                              <CheckOutlined
                                style={{ color: "#ffffff", fontSize: 9 }}
                              />
                            </span>
                          ) : (
                            <span className={styles.previewCheckPending} />
                          )}
                          <span
                            className={
                              isChecked
                                ? styles.previewTextDone
                                : styles.previewTextPending
                            }
                          >
                            {child.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile Layout: Continuous vertical timeline matching Image 1 */}
          <div className={styles.workflowTimelineMobile}>
            {workflowSteps.map((step, idx) => {
              const stepCheckedCount = step.children.filter(
                (c) => checkedItems[c.id],
              ).length;
              const stepTotalCount = step.children.length;
              const isLast = idx === workflowSteps.length - 1;
              const isCurrent = idx === currentStep;

              return (
                <div key={step.id} className={styles.stepBlock}>
                  <div className={styles.stepTimelineIndicator}>
                    <div
                      className={`${styles.stepNumberCircle} ${
                        !isCurrent &&
                        stepCheckedCount < stepTotalCount &&
                        idx > currentStep
                          ? styles.stepNumberCircleInactive
                          : ""
                      }`}
                    >
                      {idx + 1}
                    </div>
                    {!isLast && <div className={styles.stepTimelineLine} />}
                  </div>

                  <div className={styles.stepMainContent}>
                    <div className={styles.stepHeaderRow}>
                      <span className={styles.stepLabel}>{step.label}</span>
                      <span className={styles.stepBadgePill}>
                        {stepCheckedCount}/{stepTotalCount}
                      </span>
                    </div>

                    <div className={styles.checkboxList}>
                      {step.children.map((child) => {
                        const isChecked = Boolean(checkedItems[child.id]);
                        return (
                          <div key={child.id} className={styles.previewItem}>
                            {isChecked ? (
                              <span className={styles.previewCheckDone}>
                                <CheckOutlined
                                  style={{ color: "#ffffff", fontSize: 9 }}
                                />
                              </span>
                            ) : (
                              <span className={styles.previewCheckPending} />
                            )}
                            <span
                              className={
                                isChecked
                                  ? styles.previewTextDone
                                  : styles.previewTextPending
                              }
                            >
                              {child.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            id="student-tour-overview"
            className={styles.dashboardCard}
            title={<span className="app-heading-2" style={{ fontSize: 14.5, fontWeight: 700, color: "#0f172a" }}>Study Information</span>}
            style={{ height: "100%" }}
          >
            <Row gutter={[16, 16]}>
              <Col xs={12} md={6}>
                <Space align="start">
                  <EnvironmentOutlined
                    style={{ color: "#9ca3af", marginTop: 3 }}
                  />
                  <div>
                    <Text type="secondary" style={{ fontSize: 11.5, display: "block" }}>
                      Country
                    </Text>
                    <div>
                      <Text strong style={{ fontSize: 13, color: "#0f172a" }}>
                        {student?.stage?.country?.name || "-"}
                      </Text>
                    </div>
                  </div>
                </Space>
              </Col>

              <Col xs={12} md={6}>
                <Space align="start">
                  <CalendarOutlined
                    style={{ color: "#9ca3af", marginTop: 3 }}
                  />
                  <div>
                    <Text type="secondary" style={{ fontSize: 11.5, display: "block" }}>
                      Campus
                    </Text>
                    <div>
                      <Text strong style={{ fontSize: 13, color: "#0f172a" }}>
                        {student?.name_campus?.trim() || "-"}
                      </Text>
                    </div>
                  </div>
                </Space>
              </Col>

              <Col xs={12} md={6}>
                <Space align="start">
                  <SafetyCertificateOutlined
                    style={{ color: "#9ca3af", marginTop: 3 }}
                  />
                  <div>
                    <Text type="secondary" style={{ fontSize: 11.5, display: "block" }}>
                      Degree
                    </Text>
                    <div>
                      <Text strong style={{ fontSize: 13, color: "#0f172a" }}>
                        {formatDegree(student?.degree)}
                      </Text>
                    </div>
                  </div>
                </Space>
              </Col>

              <Col xs={12} md={6}>
                <Space align="start">
                  <FileTextOutlined
                    style={{ color: "#9ca3af", marginTop: 3 }}
                  />
                  <div>
                    <Text type="secondary" style={{ fontSize: 11.5, display: "block" }}>
                      Major
                    </Text>
                    <div>
                      <Text strong style={{ fontSize: 13, color: "#0f172a" }}>
                        {student?.name_degree || "-"}
                      </Text>
                    </div>
                  </div>
                </Space>
              </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              <Col xs={12} md={6}>
                <Space direction="vertical" size={2}>
                  <Text type="secondary" style={{ fontSize: 11.5 }}>
                    Visa Type
                  </Text>
                  <Text strong style={{ fontSize: 13, color: "#0f172a" }}>
                    {resolveVisaTypeLabel(student, visaTypeNameById)}
                  </Text>
                </Space>
              </Col>

              <Col xs={12} md={6}>
                <Space direction="vertical" size={2}>
                  <Text type="secondary" style={{ fontSize: 11.5 }}>
                    Visa Status
                  </Text>
                  <Tag
                    color={
                      (student?.visa_status ?? "").toLowerCase() === "grant"
                        ? "success"
                        : "processing"
                    }
                    style={{
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      paddingInline: 8,
                      margin: 0,
                    }}
                  >
                    {student?.visa_status || "-"}
                  </Tag>
                </Space>
              </Col>

              <Col xs={12} md={6}>
                <Space direction="vertical" size={2}>
                  <Text type="secondary" style={{ fontSize: 11.5 }}>
                    Student Status
                  </Text>
                  <Text strong style={{ fontSize: 13, color: "#0f172a" }}>
                    {student?.student_status || "-"}
                  </Text>
                </Space>
              </Col>

              <Col xs={12} md={6}>
                <Space direction="vertical" size={2}>
                  <Text type="secondary" style={{ fontSize: 11.5 }}>
                    Visa Duration
                  </Text>
                  <Text strong style={{ fontSize: 13, color: "#0f172a" }}>
                    {student?.visa_grant_duration_label || "-"}
                  </Text>
                </Space>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            id="student-tour-notes"
            className={styles.dashboardCard}
            title={<span className="app-heading-2" style={{ fontSize: 14.5, fontWeight: 700, color: "#0f172a" }}>Admission Notes</span>}
            style={{ height: "100%" }}
          >
            {rejectedFeedbacks.length > 0 ? (
              <Space direction="vertical" size={12} style={{ width: "100%" }}>
                {rejectedFeedbacks.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      borderLeft: "3px solid #dc2626",
                      paddingLeft: 10,
                    }}
                  >
                    <Text
                      strong
                      style={{
                        display: "block",
                        fontSize: 12,
                        color: "#991b1b",
                        marginBottom: 2,
                      }}
                    >
                      {item.title}
                    </Text>
                    <Text style={{ fontSize: 12.5, color: "#374151" }}>
                      {item.note}
                    </Text>
                  </div>
                ))}
              </Space>
            ) : (
              <Empty
                description={
                  <span style={{ fontSize: 12.5, color: "#64748b", fontWeight: 500 }}>
                    Belum ada catatan dari admisi
                  </span>
                }
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* CURRICULUM VITAE (CV) GENERATOR */}
      <StudentCvCard
        user={user}
        answerQuestions={answerQuestions}
        answerDocuments={answerDocuments}
      />

      <Card
        id="student-tour-tasks"
        className={styles.dashboardCard}
        title={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <Space size={8}>
              <span className="app-heading-2" style={{ fontSize: 14.5, fontWeight: 700, color: "#0f172a" }}>To-Do Tasks</span>
              {tasksToDo.length > 0 && (
                <Tag
                  color={
                    tasksToDo.some((t) => t.priority === "Revision Required")
                      ? "error"
                      : "processing"
                  }
                  style={{
                    borderRadius: 6,
                    paddingInline: 8,
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  {tasksToDo.length}
                </Tag>
              )}
            </Space>

            <Button
              type="link"
              size="small"
              onClick={() => router.push("/student/dashboard/upload-country-document")}
              style={{
                padding: 0,
                fontSize: 12,
                fontWeight: 600,
                color: "#1b3d6d",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <span>Lihat Detail Dokumen</span>
              <ArrowRightOutlined style={{ fontSize: 10 }} />
            </Button>
          </div>
        }
      >
        {tasksToDo.length > 0 ? (
          <Space direction="vertical" size={12} style={{ width: "100%" }}>
            {tasksToDo.map((task) => {
              const badgeMeta = getTaskBadgeMeta(task.priority);
              return (
                <div
                  key={task.id}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 10,
                    padding: "12px 14px",
                    background: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <Space direction="vertical" size={4} style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        minWidth: 0,
                        width: "100%",
                      }}
                    >
                      {badgeMeta && (
                        <Tag
                          color={badgeMeta.color}
                          style={{
                            borderRadius: 6,
                            paddingInline: 8,
                            fontSize: 10.5,
                            fontWeight: 600,
                            margin: 0,
                            flexShrink: 0,
                          }}
                        >
                          {badgeMeta.label}
                        </Tag>
                      )}
                      <Text
                        strong
                        style={{
                          fontSize: 13,
                          color: "#0f172a",
                          lineHeight: 1.4,
                          minWidth: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={task.title}
                      >
                        {task.title}
                      </Text>
                    </div>
                    {task.subtitle && (
                      <Text style={{ fontSize: 11.5, color: "#64748b" }}>
                        {task.subtitle}
                      </Text>
                    )}
                  </Space>
                  {task.link && (
                    <Button
                      type="primary"
                      ghost
                      size="small"
                      style={{
                        height: 28,
                        borderRadius: 7,
                        fontSize: 11.5,
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                      onClick={() => router.push(task.link!)}
                    >
                      {task.actionLabel || "Kerjakan"}
                    </Button>
                  )}
                </div>
              );
            })}

            <Button
              type="dashed"
              block
              onClick={() => router.push("/student/dashboard/upload-country-document")}
              style={{
                marginTop: 4,
                height: 34,
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: 600,
                color: "#1b3d6d",
                borderColor: "#cbd5e1",
                background: "#f8fafc",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <span>Lihat Detail Dokumen</span>
              <ArrowRightOutlined style={{ fontSize: 11 }} />
            </Button>
          </Space>
        ) : (
          <Empty
            description="Semua dokumen wajib dan tugas telah lengkap! Tidak ada tugas aktif."
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button
              type="primary"
              size="small"
              onClick={() => router.push("/student/dashboard/upload-country-document")}
              style={{
                borderRadius: 7,
                fontSize: 12,
                fontWeight: 600,
                background: "#1b3d6d",
                marginTop: 8,
              }}
            >
              Lihat Detail Dokumen
            </Button>
          </Empty>
        )}
      </Card>

      <Card
        className={styles.dashboardCard}
        title={
          <span
            className="app-heading-2"
            style={{ fontSize: 14.5, fontWeight: 700, color: "#0f172a" }}
          >
            Syarat & Ketentuan
          </span>
        }
      >
        {terms.length > 0 ? (
          <Space direction="vertical" size={8} style={{ width: "100%" }}>
            {terms.map((term, index) => (
              <div
                key={`${term}-${index}`}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  fontSize: 12.5,
                  color: "#475569",
                  lineHeight: 1.55,
                }}
              >
                <span
                  style={{
                    color: "#2563eb",
                    fontWeight: 700,
                    fontSize: 12,
                    flexShrink: 0,
                    minWidth: 16,
                  }}
                >
                  {index + 1}.
                </span>
                <span style={{ fontSize: 12.5, color: "#334155", lineHeight: 1.55 }}>
                  {term}
                </span>
              </div>
            ))}
          </Space>
        ) : (
          <Text style={{ fontSize: 12.5, color: "#94a3b8", lineHeight: 1.55 }}>
            Belum ada syarat & ketentuan tambahan.
          </Text>
        )}
      </Card>
    </div>
  );
}
