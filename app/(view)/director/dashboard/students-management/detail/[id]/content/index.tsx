"use client";

import {
  useUpdateStudentStatusUser,
  useUpdateUser,
  useUpdateVisaStatusUser,
  useUser,
  useUsers,
} from "@/app/hooks/use-users";
import { useStudentNotes } from "@/app/hooks/use-student-notes";
import { NoteStudentDataModel } from "@/app/models/notes-student";
import type { UserDataModel } from "@/app/models/user";
import {
  ArrowLeftOutlined,
  DeleteOutlined,
  EditOutlined,
  FolderOpenOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Card,
  DatePicker,
  Flex,
  Input,
  List,
  message,
  Modal,
  Select,
  Space,
  Steps,
  Tabs,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import ModalNotesComponent from "./ModalNotesComponent";
import OverviewComponent from "@/app/(view)/admission/dashboard/students-management/detail/[id]/content/tab-layout/OverviewComponent";
import LoadingSplash from "@/app/components/common/loading";
import DocumentsComponent from "@/app/(view)/admission/dashboard/students-management/detail/[id]/content/tab-layout/DocumentsComponent";
import CVComponents from "@/app/(view)/admission/dashboard/students-management/detail/[id]/content/tab-layout/CVComponents";
import LetterComponent from "./tab-layout/LetterComponent";
import ChatComponent from "@/app/(view)/admission/dashboard/students-management/detail/[id]/content/tab-layout/ChatComponent";
import ActivityLogComponent from "./tab-layout/ActivityLogComponent";
import TranslationComponent from "@/app/(view)/admission/dashboard/students-management/detail/[id]/content/tab-layout/TranslationComponent";
import {
  getCountryName,
  getStudentAvatarUrl,
  getVisaStatusBadgeMeta,
  normalizePipelineStatusOption,
  PIPELINE_STATUS_OPTIONS,
} from "@/app/utils/student-helpers";
import { useStepsManagement } from "@/app/hooks/use-steps-management";
import { useCountriesManagement } from "@/app/hooks/use-country-management";
import styles from "./detail.module.css";

const allowedTabKeys = new Set([
  "overview",
  "documents",
  "translation",
  "data-cv",
  "letter",
  "chat",
  "activity-log",
]);

const visaStatusOptions = PIPELINE_STATUS_OPTIONS;

type StudentDetailExtraFields = {
  student_status?: string | null;
  visa_granted_at?: string | null;
  visa_grant_duration_days?: number | null;
  visa_grant_duration_label?: string | null;
  joined_at?: string | null;
  student_status_updated_by_id?: string | number | null;
  student_status_updated_by_name?: string | null;
  student_status_updated_at?: string | null;
  student_status_updated_at_label?: string | null;
};

type StudentDetailData = UserDataModel & StudentDetailExtraFields;

function formatDisplayDate(value?: string | null): string {
  if (!value || value === "0001-01-01T00:00:00Z") return "-";

  const parsed = dayjs(value);
  if (!parsed.isValid()) return "-";

  return parsed.format("DD MMM YYYY");
}

function formatDisplayDateTime(value?: string | null): string {
  if (!value || value === "0001-01-01T00:00:00Z") return "-";

  const parsed = dayjs(value);
  if (!parsed.isValid()) return "-";

  return parsed.format("DD MMM YYYY HH:mm");
}

function getStudentProcessDuration(student?: StudentDetailData | null): string {
  if (!student) return "-";

  if (student.visa_grant_duration_label) {
    return student.visa_grant_duration_label;
  }

  const startDate = student.joined_at || student.created_at;
  const endDate = student.visa_granted_at;

  if (!startDate || !endDate) return "Not available yet";

  const start = dayjs(startDate);
  const end = dayjs(endDate);

  if (!start.isValid() || !end.isValid()) return "Not available yet";

  const totalDays = end.diff(start, "day");
  if (totalDays < 0) return "Not available yet";

  const months = Math.floor(totalDays / 30);
  const days = totalDays % 30;

  if (months > 0 && days > 0) return `${months} months ${days} days`;
  if (months > 0) return `${months} months`;
  return `${days} days`;
}

function getStudentStatusChangedInfo(
  student?: StudentDetailData | null,
): string {
  if (!student) return "No status update history";

  const updatedBy = student.student_status_updated_by_name?.trim();
  const rawDate = student.student_status_updated_at;
  const dateFormatted = rawDate ? formatDisplayDateTime(rawDate) : null;

  if (updatedBy && dateFormatted && dateFormatted !== "-") {
    return `Updated by ${updatedBy} on ${dateFormatted}`;
  }

  if (updatedBy) {
    return `Updated by ${updatedBy}`;
  }

  if (dateFormatted && dateFormatted !== "-") {
    return `Status updated on ${dateFormatted}`;
  }

  return "No status update history";
}

export default function StudentDetailContentPage() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawId = params.id;
  const studentId = Array.isArray(rawId) ? rawId[0] : rawId;

  const requestedTab = searchParams.get("tab");
  const requestedConversationId =
    searchParams.get("conversation_id") ?? undefined;

  const {
    onUpdate: onUpdateVisaStatus,
    onUpdateLoading: onUpdateVisaStatusLoading,
  } = useUpdateVisaStatusUser();

  const {
    onUpdate: onUpdateStudentStatus,
    onUpdateLoading: onUpdateStudentStatusLoading,
  } = useUpdateStudentStatusUser();

  const { data, fetchLoading } = useUser({ id: studentId as string });
  const detailStudentData = (data ?? null) as StudentDetailData | null;
  const { data: dbMasterSteps = [] } = useStepsManagement({});
  const { data: dbCountries = [] } = useCountriesManagement({});

  const { onUpdate: onUpdateUser, onUpdateLoading } = useUpdateUser();

  const {
    data: notesData,
    onCreate: onCreateNote,
    onCreateLoading: onCreateNoteLoading,
    onDelete: onDeleteNote,
    onDeleteLoading: onDeleteNoteLoading,
    onUpdate: onUpdateNote,
    onUpdateLoading: onUpdateNoteLoading,
  } = useStudentNotes({
    queryString: studentId ? `user_id=${studentId}` : undefined,
    enabled: Boolean(studentId),
  });

  const [isModalNotesOpen, setIsModalNotesOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<NoteStudentDataModel | null>(
    null,
  );
  const [manualActiveTab, setManualActiveTab] = useState("overview");
  const [visaStatusModalOpen, setVisaStatusModalOpen] = useState(false);
  const [selectedVisaStatus, setSelectedVisaStatus] = useState<string>();
  const [visaGrantModalOpen, setVisaGrantModalOpen] = useState(false);
  const [selectedVisaGrantedAt, setSelectedVisaGrantedAt] =
    useState<Dayjs | null>(null);
  const [gdriveModalOpen, setGdriveModalOpen] = useState(false);
  const [gdriveInputUrl, setGdriveInputUrl] = useState("");

  const handleOpenGdriveModal = () => {
    setGdriveInputUrl(detailStudentData?.gdrive_folder_url ?? "");
    setGdriveModalOpen(true);
  };

  const handleSaveGdriveUrl = async () => {
    if (!studentId) return;
    const trimmed = gdriveInputUrl.trim();
    await onUpdateUser({
      id: studentId,
      payload: {
        gdrive_folder_url: trimmed || null,
      },
    });
    setGdriveModalOpen(false);
  };

  const studentName = detailStudentData?.name ?? "Student";
  const studentEmail = detailStudentData?.email ?? "student@email.com";
  const studentCountry =
    detailStudentData?.stage?.country?.name ?? "Belum ada negara";
  const studentCampus = detailStudentData?.name_campus ?? "Belum ada kampus";
  const studentDegree =
    detailStudentData?.degree ??
    detailStudentData?.name_degree ??
    "Belum ada degree";
  const studentDegreeName =
    detailStudentData?.name_degree ?? "Belum ada nama degree";

  const visaTypeLabel = detailStudentData?.visa_type_name
    ? detailStudentData.visa_type_name
    : detailStudentData?.visa_type
      ? detailStudentData.visa_type.replace(/_/g, " ").toUpperCase()
    : "Belum dipilih";

  const rawStatus =
    detailStudentData?.visa_status ??
    detailStudentData?.student_status ??
    detailStudentData?.status ??
    "On Going";
  const visaBadgeMeta = getVisaStatusBadgeMeta(rawStatus);
  const statusLabel = visaBadgeMeta.label;

  const joinedAtLabel = formatDisplayDate(
    detailStudentData?.joined_at || detailStudentData?.created_at,
  );
  const visaGrantedAtLabel = formatDisplayDate(
    detailStudentData?.visa_granted_at,
  );
  const processDuration = getStudentProcessDuration(detailStudentData);
  const statusChangedInfo = getStudentStatusChangedInfo(detailStudentData);

  const notesSource = useMemo(
    () => (notesData?.length ? notesData : (detailStudentData?.notes ?? [])),
    [detailStudentData?.notes, notesData],
  );

  const handleEditNote = (note: NoteStudentDataModel) => {
    setSelectedNote(note);
    setIsModalNotesOpen(true);
  };

  const handleDeleteNote = async (note: NoteStudentDataModel) => {
    if (!note.id) return;
    await onDeleteNote(note.id);
  };

  const handleOpenModalNotes = () => {
    setSelectedNote(null);
    setIsModalNotesOpen(true);
  };

  const handleCloseModalNotes = () => {
    setSelectedNote(null);
    setIsModalNotesOpen(false);
  };

  const handleOpenVisaStatusModal = () => {
    setSelectedVisaStatus(
      normalizePipelineStatusOption(
        detailStudentData?.visa_status ??
          detailStudentData?.student_status ??
          detailStudentData?.status ??
          "On Going",
      ),
    );
    setVisaStatusModalOpen(true);
  };

  const handleCloseVisaStatusModal = () => {
    setVisaStatusModalOpen(false);
  };

  const handleOpenVisaGrantModal = () => {
    setSelectedVisaGrantedAt(
      detailStudentData?.visa_granted_at
        ? dayjs(detailStudentData.visa_granted_at)
        : null,
    );
    setVisaGrantModalOpen(true);
  };

  const handleCloseVisaGrantModal = () => {
    setVisaGrantModalOpen(false);
  };

  const handleSubmitNote = (values: { content?: string }) => {
    const content = values.content?.trim();
    if (!content) return;

    if (selectedNote?.id) {
      onUpdateNote({
        id: selectedNote.id,
        payload: { content },
      });
    } else if (studentId) {
      onCreateNote({
        user_id: String(studentId),
        content,
      });
    }

    setIsModalNotesOpen(false);
    setSelectedNote(null);
  };

  const handleSubmitVisaStatus = async () => {
    if (!studentId || !selectedVisaStatus) return;

    await Promise.all([
      onUpdateVisaStatus({
        id: studentId,
        visa_status: selectedVisaStatus,
      }),
      onUpdateStudentStatus({
        id: studentId,
        student_status: selectedVisaStatus,
      }),
    ]);

    setVisaStatusModalOpen(false);
  };

  const handleSubmitVisaGrantDate = async () => {
    if (!studentId || !selectedVisaGrantedAt) return;

    await onUpdateUser({
      id: studentId,
      payload: {
        visa_granted_at: selectedVisaGrantedAt.toISOString(),
      },
    });

    setVisaGrantModalOpen(false);
  };

  const notesItems = useMemo(() => {
    return notesSource.map((note) => ({
      id: note.id,
      author: "Internal",
      note: note.content ?? "-",
      time: note.created_at ? formatDisplayDateTime(note.created_at) : "-",
      raw: note,
    }));
  }, [notesSource]);

  const initials = useMemo(() => {
    const parts = studentName.split(" ").filter(Boolean);
    if (parts.length === 0) return "ST";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }, [studentName]);

  const stepsSource = useMemo(() => {
    const raw = detailStudentData?.stage?.country?.steps ?? [];
    if (raw.length > 0 && raw.some((s) => s.children && s.children.length > 0)) {
      return [...raw].sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeA - timeB;
      });
    }

    // Fallback 1: Cari dari negara siswa di master data negara yang diatur di Admisi
    const studentCountry = getCountryName(detailStudentData);
    const matchedCountry = dbCountries.find(
      (c) =>
        c.name.toLowerCase() === studentCountry.toLowerCase() &&
        c.steps &&
        c.steps.some((st) => st.children && st.children.length > 0),
    );
    if (matchedCountry?.steps?.length) {
      return [...matchedCountry.steps].sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeA - timeB;
      });
    }

    // Fallback 2: Ambil langsung dari master steps yang diatur di Admisi
    const masterStepsWithChildren = dbMasterSteps.filter(
      (s) => s.children && s.children.length > 0,
    );
    if (masterStepsWithChildren.length > 0) {
      return [...masterStepsWithChildren].sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeA - timeB;
      });
    }

    if (raw.length > 0) {
      return [...raw].sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeA - timeB;
      });
    }

    return [];
  }, [detailStudentData, dbCountries, dbMasterSteps]);

  const currentStepId = detailStudentData?.current_step_id;

  const currentStageIndex = useMemo(() => {
    if (!currentStepId) return 0;
    const foundIndex = stepsSource.findIndex(
      (step) => String(step.id) === String(currentStepId),
    );
    return foundIndex >= 0 ? foundIndex : 0;
  }, [currentStepId, stepsSource]);

  const progressPercent = useMemo(() => {
    if (!stepsSource.length) return 0;
    return Math.round(((currentStageIndex + 1) / stepsSource.length) * 100);
  }, [currentStageIndex, stepsSource.length]);

  const progressSteps = useMemo(
    () =>
      stepsSource.map((step, index) => {
        const isDone = index < currentStageIndex;
        const isCurrent = index === currentStageIndex;
        return {
          title: (
            <Flex align="center" justify="space-between" gap={12}>
              <div>
                <Typography.Text
                  strong={isCurrent}
                  style={{
                    color: isDone ? "#16a34a" : undefined,
                  }}
                >
                  {step.label}
                </Typography.Text>
                <Typography.Text
                  type="secondary"
                  style={{
                    display: "block",
                    marginTop: 2,
                    color: isDone ? "#16a34a" : undefined,
                  }}
                >
                  {step.children?.map((child) => child.label).join(", ") ??
                    "Belum ada detail"}
                </Typography.Text>
              </div>
            </Flex>
          ),
          status: isDone
            ? ("finish" as const)
            : isCurrent
              ? ("process" as const)
              : ("wait" as const),
        };
      }),
    [
      currentStageIndex,
      stepsSource,
    ],
  );

  const tabsItems = [
    {
      key: "overview",
      label: "Overview",
      children:
        detailStudentData && studentId ? (
          <OverviewComponent
            detailStudent={detailStudentData}
            student_id={studentId}
          />
        ) : (
          <LoadingSplash />
        ),
    },
    {
      key: "documents",
      label: "Documents",
      children: studentId ? (
        <DocumentsComponent
          student_id={studentId}
          student={detailStudentData}
        />
      ) : null,
    },
    {
      key: "translation",
      label: "Translation",
      children: studentId ? (
        <TranslationComponent
          student_id={studentId}
          student_name={studentName}
          student_country={detailStudentData?.stage?.country?.name || ""}
          translation_quota={detailStudentData?.translation_quota || 0}
          student_has_initial_translations={detailStudentData?.has_initial_translations}
        />
      ) : null,
    },
    {
      key: "data-cv",
      label: "Data & CV",
      children: studentId ? <CVComponents student_id={studentId} /> : null,
    },
    {
      key: "letter",
      label: "Letter",
      children: <LetterComponent />,
    },
    {
      key: "chat",
      label: "Chat",
      children: studentId ? (
        <ChatComponent
          student_id={studentId}
          student_name={detailStudentData?.name}
          consultant_name={detailStudentData?.name_consultant}
          initialConversationId={requestedConversationId}
        />
      ) : null,
    },
    {
      key: "activity-log",
      label: "Activity Log",
      children: <ActivityLogComponent />,
    },
  ];

  const activeTab = useMemo(() => {
    if (requestedTab && allowedTabKeys.has(requestedTab)) {
      return requestedTab;
    }
    return manualActiveTab;
  }, [manualActiveTab, requestedTab]);

  const handleTabChange = useCallback(
    (nextTab: string) => {
      setManualActiveTab(nextTab);

      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.set("tab", nextTab);

      if (nextTab !== "chat") {
        nextParams.delete("conversation_id");
      }

      const nextQuery = nextParams.toString();
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const defaultWorkflow = useMemo(
    () => [
      {
        id: "step-1",
        label: "Preparation",
        children: [
          { id: "c-1-1", label: "Administration Fee Payment" },
          { id: "c-1-2", label: "Offer Letter" },
          { id: "c-1-3", label: "Tuition Fee Breakdown" },
          { id: "c-1-4", label: "Visa Document Finalization" },
          { id: "c-1-5", label: "Medical Examination (MCU)" },
          { id: "c-1-6", label: "Visa Application Submission" },
          { id: "c-1-7", label: "Biometrics Appointment" },
          { id: "c-1-8", label: "Campus Application" },
        ],
      },
      {
        id: "step-2",
        label: "Progress",
        children: [
          { id: "c-2-1", label: "Document Collection" },
          { id: "c-2-2", label: "English Course" },
        ],
      },
      {
        id: "step-3",
        label: "Complete",
        children: [
          { id: "c-3-1", label: "Visa Grant" },
          { id: "c-3-2", label: "Pre-Departure Briefing" },
          { id: "c-3-3", label: "Student Testimonial" },
          { id: "c-3-4", label: "Student Departure" },
          { id: "c-3-5", label: "Arrival and On-Shore Support" },
        ],
      },
    ],
    [],
  );

  const displayWorkflow = useMemo(() => {
    const hasDbStepsWithChildren = stepsSource.some(
      (s) => s.children && s.children.length > 0,
    );
    if (hasDbStepsWithChildren) {
      return stepsSource.map((s, idx) => ({
        id: String(s.id || idx),
        label: s.label,
        children: (s.children || []).map((c, cIdx) => ({
          id: String(c.id || `${idx}-${cIdx}`),
          label: c.label,
        })),
      }));
    }
    return defaultWorkflow;
  }, [defaultWorkflow, stepsSource]);

  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (detailStudentData?.workflow_checked_ids) {
      try {
        const ids = JSON.parse(detailStudentData.workflow_checked_ids);
        if (Array.isArray(ids)) {
          const map: Record<string, boolean> = {};
          ids.forEach((id: string) => {
            map[id] = true;
          });
          setCheckedItems((prev) => ({ ...prev, ...map }));
        }
      } catch {
        // Ignored
      }
    }
  }, [detailStudentData?.workflow_checked_ids]);

  const totalCheckable = useMemo(() => {
    return displayWorkflow.reduce((acc, step) => acc + step.children.length, 0);
  }, [displayWorkflow]);

  const totalChecked = useMemo(() => {
    return Object.values(checkedItems).filter(Boolean).length;
  }, [checkedItems]);

  const dynamicProgressPercent = useMemo(() => {
    if (totalCheckable === 0) return 0;
    return Math.round((totalChecked / totalCheckable) * 100);
  }, [totalCheckable, totalChecked]);

  if (fetchLoading || !detailStudentData) {
    return <LoadingSplash label="Loading student detail..." />;
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.pageHeaderRow}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={() =>
            router.push("/director/dashboard/students-management")
          }
          aria-label="Kembali"
        >
          <ArrowLeftOutlined style={{ fontSize: 16 }} />
        </button>
        <h1 className={styles.pageTitle}>Student Case Detail</h1>
      </div>

      <div className={styles.mainCard}>
        <div className={styles.cardGrid}>
          {/* Left Column: Student Profile */}
          <div className={styles.leftCol}>
            <Avatar
              size={56}
              src={getStudentAvatarUrl(detailStudentData)}
              className={styles.studentAvatar}
              style={{
                backgroundColor: "#eff6ff",
                color: "#1b3d6d",
                fontSize: 20,
                fontWeight: 700,
                flexShrink: 0,
                border: "2px solid #e2e8f0",
              }}
            >
              {initials}
            </Avatar>

            <div className={styles.studentName}>{studentName}</div>
            <div className={styles.studentEmail}>{studentEmail}</div>

            <div className={styles.metaList}>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>No Phone:</span>
                <span className={styles.metaValue}>
                  {detailStudentData?.no_phone || "-"}
                </span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Country:</span>
                <span className={styles.metaValue}>
                  {studentCountry === "Belum ada negara"
                    ? "-"
                    : studentCountry}
                </span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Campus:</span>
                <span className={styles.metaValue}>
                  {studentCampus === "Belum ada kampus"
                    ? "-"
                    : studentCampus}
                </span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Degree:</span>
                <span className={styles.metaValue}>
                  {studentDegree === "Belum ada degree"
                    ? "-"
                    : studentDegree}
                </span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Major:</span>
                <span className={styles.metaValue}>
                  {studentDegreeName === "Belum ada nama degree"
                    ? "-"
                    : studentDegreeName}
                </span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Consultant:</span>
                <span className={styles.metaValue} style={{ fontWeight: 600, color: "#6d28d9" }}>
                  {detailStudentData?.name_consultant || "Belum ditentukan"}
                </span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>Google Drive:</span>
                <span className={styles.metaValue}>
                  {detailStudentData?.gdrive_folder_url ? (
                    <Flex align="center" gap={6} wrap="wrap">
                      <a
                        href={detailStudentData.gdrive_folder_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          color: "#1d4ed8",
                          fontWeight: 600,
                          fontSize: 12,
                          textDecoration: "none",
                        }}
                      >
                        <FolderOpenOutlined /> Open Folder
                      </a>
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined style={{ fontSize: 11, color: "#64748b" }} />}
                        onClick={handleOpenGdriveModal}
                        style={{ padding: "0 4px", height: 20 }}
                        title="Ubah link Google Drive"
                      />
                    </Flex>
                  ) : (
                    <Flex align="center" gap={6}>
                      <span style={{ color: "#94a3b8", fontSize: 12 }}>Not linked</span>
                      <Button
                        type="link"
                        size="small"
                        onClick={handleOpenGdriveModal}
                        style={{ padding: 0, height: "auto", fontSize: 12, fontWeight: 500 }}
                      >
                        + Link
                      </Button>
                    </Flex>
                  )}
                </span>
              </div>
            </div>

            <div
              style={{
                marginTop: 24,
                paddingTop: 16,
                borderTop: "1px solid #f1f5f9",
              }}
            >
              <Flex align="center" justify="space-between">
                <Typography.Text
                  strong
                  style={{ fontSize: 13, color: "#0f172a" }}
                >
                  Internal Notes
                </Typography.Text>
              </Flex>
              {notesItems.length > 0 && (
                <div
                  style={{
                    marginTop: 8,
                    maxHeight: 120,
                    overflowY: "auto",
                  }}
                >
                  <List
                    size="small"
                    dataSource={notesItems.slice(0, 3)}
                    renderItem={(item) => (
                      <List.Item
                        style={{
                          padding: "6px 0",
                          borderBottom: "1px solid #f8fafc",
                        }}
                      >
                        <div style={{ fontSize: 12, color: "#334155" }}>
                          {item.note}
                          <span
                            style={{
                              display: "block",
                              fontSize: 10,
                              color: "#94a3b8",
                            }}
                          >
                            {item.time}
                          </span>
                        </div>
                      </List.Item>
                    )}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Middle Column: Dynamic Workflow Progress */}
          <div className={styles.middleCol}>
            <div className={styles.workflowHeading}>
              Dynamic Workflow Progress
            </div>

            <div className={styles.stepsTimeline}>
              {displayWorkflow.map((step, idx) => {
                const stepCheckedCount = step.children.filter(
                  (c) => checkedItems[c.id],
                ).length;
                const stepTotalCount = step.children.length;
                const isLast = idx === displayWorkflow.length - 1;

                return (
                  <div key={step.id} className={styles.stepBlock}>
                    <div className={styles.stepTimelineIndicator}>
                      <div className={styles.stepNumberCircle}>
                        {idx + 1}
                      </div>
                      {!isLast && (
                        <div className={styles.stepTimelineLine} />
                      )}
                    </div>

                    <div className={styles.stepMainContent}>
                      <div className={styles.stepHeaderRow}>
                        <span className={styles.stepLabel}>
                          {step.label}
                        </span>
                        <span className={styles.stepBadgePill}>
                          {stepCheckedCount}/{stepTotalCount}
                        </span>
                      </div>

                      <div className={styles.checkboxList} style={{ pointerEvents: "none" }}>
                        {step.children.map((child) => (
                          <label
                            key={child.id}
                            className={styles.checkboxItem}
                            style={{ cursor: "default" }}
                          >
                            <input
                              type="checkbox"
                              className={styles.checkboxInput}
                              checked={Boolean(checkedItems[child.id])}
                              disabled
                              readOnly
                            />
                            <span>{child.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={styles.overallProgressContainer}>
              <span className={styles.overallProgressLabel}>
                Overall Progress
              </span>
              <span className={styles.overallProgressValue}>
                {dynamicProgressPercent}% Complete
              </span>
            </div>
          </div>

          {/* Right Column: Status Metadata Panel */}
          <div className={styles.rightCol}>
            <div className={styles.statusGroup}>
              <div className={styles.statusTitle}>Visa Status</div>
              <div style={{ marginTop: 2 }}>
                <span
                  className={styles.visaTag}
                  style={visaBadgeMeta.style}
                >
                  {statusLabel}
                </span>
              </div>
            </div>

            <div className={styles.statusGroup}>
              <div className={styles.statusTitle}>Visa Type</div>
              <div className={styles.statusDesc}>
                {visaTypeLabel === "Belum dipilih"
                  ? "Student Visa (Subclass 500)"
                  : visaTypeLabel}
              </div>
            </div>

            <div className={styles.statusGroup}>
              <div className={styles.statusTitle}>Status Last Updated</div>
              <div className={styles.statusDesc}>
                {statusChangedInfo}
              </div>
            </div>

            <div className={styles.statusGroup}>
              <div className={styles.statusTitle}>Joined At</div>
              <div className={styles.statusDesc}>
                {joinedAtLabel === "-" ? "19 Sep 2026" : joinedAtLabel}
              </div>
            </div>

            <div className={styles.statusGroup}>
              <div className={styles.statusTitle}>Visa Granted At</div>
              <div className={styles.statusDesc}>
                {visaGrantedAtLabel}
              </div>
            </div>

            <div className={styles.statusGroup}>
              <div className={styles.statusTitle}>Process Duration</div>
              <div className={styles.statusDesc}>
                {processDuration}
              </div>
            </div>

            <div className={styles.statusGroup}>
              <div className={styles.statusTitle}>PIC Consultant</div>
              <div className={styles.statusDesc} style={{ fontWeight: 600, color: "#6d28d9" }}>
                {detailStudentData?.name_consultant || "Jani Antari"}
              </div>
            </div>

            <div className={styles.statusGroup}>
              <div className={styles.statusTitle}>PIC Admission</div>
              <div className={styles.statusDesc}>
                {detailStudentData?.student_status_updated_by_name ||
                  "Admission Staff"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.tabsContainer}>
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={tabsItems}
        />
      </div>

      <ModalNotesComponent
        open={isModalNotesOpen}
        onClose={handleCloseModalNotes}
        user_id={studentId ? String(studentId) : undefined}
        loading={onCreateNoteLoading || onUpdateNoteLoading}
        selectedNote={selectedNote}
        onSubmit={handleSubmitNote}
      />

      <Modal
        open={visaStatusModalOpen}
        title="Update Visa Status"
        onCancel={handleCloseVisaStatusModal}
        onOk={() => void handleSubmitVisaStatus()}
        okText="Simpan"
        cancelText="Batal"
        confirmLoading={
          onUpdateVisaStatusLoading || onUpdateStudentStatusLoading
        }
        destroyOnHidden
      >
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <Typography.Text type="secondary">
            Pilih status visa terbaru untuk student ini.
          </Typography.Text>
          <Select
            value={selectedVisaStatus}
            onChange={setSelectedVisaStatus}
            options={visaStatusOptions}
            placeholder="Pilih status visa"
            style={{ width: "100%" }}
          />
        </Space>
      </Modal>

      <Modal
        open={visaGrantModalOpen}
        title="Edit Visa Grant Date"
        onCancel={handleCloseVisaGrantModal}
        onOk={() => void handleSubmitVisaGrantDate()}
        okText="Simpan"
        cancelText="Batal"
        confirmLoading={onUpdateLoading}
        destroyOnHidden
      >
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <Typography.Text type="secondary">
            Masukkan tanggal grant visa manual.
          </Typography.Text>
          <DatePicker
            value={selectedVisaGrantedAt}
            onChange={(value) => setSelectedVisaGrantedAt(value)}
            style={{ width: "100%" }}
            format="DD MMM YYYY"
          />
        </Space>
      </Modal>
      <Modal
        open={gdriveModalOpen}
        title="Tautkan Folder Google Drive"
        onCancel={() => setGdriveModalOpen(false)}
        footer={null}
        destroyOnClose
        width={480}
      >
        <Space direction="vertical" size={14} style={{ width: "100%", marginTop: 8 }}>
          <Typography.Text type="secondary" style={{ fontSize: 13, lineHeight: 1.6 }}>
            Tautan folder arsip dokumen internal tim.
          </Typography.Text>
          <Input
            placeholder="Contoh https://drive.google.com/drive/folders/..."
            value={gdriveInputUrl}
            onChange={(e) => setGdriveInputUrl(e.target.value)}
            allowClear
          />
          <Flex justify="flex-end" gap={8} style={{ marginTop: 8 }}>
            <Button onClick={() => setGdriveModalOpen(false)}>Batal</Button>
            <Button
              type="primary"
              loading={onUpdateLoading}
              onClick={handleSaveGdriveUrl}
              style={{ backgroundColor: "#1b3d6d", borderColor: "#1b3d6d" }}
            >
              Simpan
            </Button>
          </Flex>
        </Space>
      </Modal>
    </div>
  );
}
