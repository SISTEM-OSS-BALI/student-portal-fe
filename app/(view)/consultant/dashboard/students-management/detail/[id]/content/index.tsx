"use client";

import { useMemo, useCallback, useEffect, useState } from "react";
import {
  Avatar,
  Button,
  Card,
  Flex,
  Input,
  message,
  Modal,
  Result,
  Select,
  Space,
  Tabs,
  Tag,
  Typography,
} from "antd";
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  EditOutlined,
  EnvironmentOutlined,
  FolderOpenOutlined,
  IdcardOutlined,
  MailOutlined,
  PhoneOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useUser, useUpdateUser, useUsers } from "@/app/hooks/use-users";
import { useAuth } from "@/app/utils/use-auth";
import type { UserDataModel } from "@/app/models/user";
import LoadingSplash from "@/app/components/common/loading";
import OverviewComponent from "@/app/(view)/admission/dashboard/students-management/detail/[id]/content/tab-layout/OverviewComponent";
import DocumentsComponent from "@/app/(view)/admission/dashboard/students-management/detail/[id]/content/tab-layout/DocumentsComponent";
import TranslationComponent from "@/app/(view)/admission/dashboard/students-management/detail/[id]/content/tab-layout/TranslationComponent";
import CVComponents from "@/app/(view)/admission/dashboard/students-management/detail/[id]/content/tab-layout/CVComponents";
import ChatComponent from "@/app/(view)/admission/dashboard/students-management/detail/[id]/content/tab-layout/ChatComponent";
import {
  getCountryName,
  getStudentAvatarUrl,
  getVisaStatusBadgeMeta,
} from "@/app/utils/student-helpers";
import { useStepsManagement } from "@/app/hooks/use-steps-management";
import { useCountriesManagement } from "@/app/hooks/use-country-management";
import styles from "./detail.module.css";

const allowedTabKeys = new Set([
  "overview",
  "documents",
  "translation",
  "data-cv",
  "chat",
]);

function formatDisplayDate(value?: string | null): string {
  if (!value || value === "0001-01-01T00:00:00Z") return "-";
  const parsed = dayjs(value);
  if (!parsed.isValid()) return "-";
  return parsed.format("DD MMM YYYY");
}

export default function ConsultantStudentDetailContentPage() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawId = params.id;
  const studentId = Array.isArray(rawId) ? rawId[0] : rawId;
  const requestedTab = searchParams.get("tab");
  const requestedConversationId = searchParams.get("conversation_id");

  const { data, fetchLoading } = useUser({ id: studentId as string });
  const detailStudentData = (data ?? null) as UserDataModel | null;
  const { onUpdate: onUpdateUser, onUpdateLoading } = useUpdateUser();
  const { data: dbMasterSteps = [] } = useStepsManagement({});
  const { data: dbCountries = [] } = useCountriesManagement({});

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
      id: studentId as string,
      payload: {
        gdrive_folder_url: trimmed || null,
      },
    });
    setGdriveModalOpen(false);
  };

  const { user_name, role: userRole } = useAuth();
  const isConsultant = userRole?.toLowerCase() === "consultant";
  const loggedInConsultantName = (user_name ?? "").trim().toLowerCase();

  const isAuthorized = useMemo(() => {
    if (!isConsultant || !loggedInConsultantName || !detailStudentData) return true;
    const assignedConsultant = String(detailStudentData.name_consultant ?? "").trim().toLowerCase();
    return assignedConsultant === loggedInConsultantName;
  }, [isConsultant, loggedInConsultantName, detailStudentData]);

  const activeTab = useMemo(() => {
    if (requestedTab && allowedTabKeys.has(requestedTab)) {
      return requestedTab;
    }
    return "overview";
  }, [requestedTab]);

  const handleTabChange = useCallback(
    (nextTab: string) => {
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.set("tab", nextTab);
      const nextQuery = nextParams.toString();
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const initials = useMemo(() => {
    const parts = String(detailStudentData?.name ?? "Student")
      .split(" ")
      .filter(Boolean);
    if (!parts.length) return "ST";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }, [detailStudentData?.name]);

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
          student_name={detailStudentData?.name ?? ""}
          student_country={detailStudentData?.stage?.country?.name ?? ""}
          translation_quota={detailStudentData?.translation_quota ?? 0}
          student_has_initial_translations={
            detailStudentData?.has_initial_translations
          }
        />
      ) : null,
    },
    {
      key: "data-cv",
      label: "Data & CV",
      children: studentId ? <CVComponents student_id={studentId} /> : null,
    },
    {
      key: "chat",
      label: "Chat",
      children: studentId ? (
        <ChatComponent
          student_id={studentId}
          student_name={detailStudentData?.name}
          consultant_name={detailStudentData?.name_consultant}
          initialConversationId={requestedConversationId ?? undefined}
        />
      ) : null,
    },
  ];

  if (fetchLoading) {
    return <LoadingSplash label="Loading student detail..." />;
  }

  if (!isAuthorized) {
    return (
      <div style={{ padding: 40, background: "#fff", borderRadius: 16 }}>
        <Result
          status="403"
          title="Akses Ditolak"
          subTitle="Anda tidak memiliki izin untuk melihat data student ini karena student ini bukan merupakan asuhan Anda."
          extra={
            <Button
              type="primary"
              onClick={() => router.push("/consultant/dashboard/students-management")}
            >
              Kembali ke Student Pipeline
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      {/* Top Header Bar */}
      <div className={styles.pageHeaderRow}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => router.push("/consultant/dashboard/students-management")}
          aria-label="Kembali"
        >
          <ArrowLeftOutlined style={{ fontSize: 16 }} />
        </button>
        <h1 className={styles.pageTitle}>Student Case Detail</h1>
      </div>

      {/* Main Card with 3 Columns */}
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
                <span
                  className={styles.metaValue}
                  style={{
                    color: "#6d28d9",
                    fontWeight: 600,
                  }}
                >
                  {detailStudentData?.name_consultant || "-"}
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

                      <div className={styles.checkboxList}>
                        {step.children.map((child) => (
                          <label
                            key={child.id}
                            className={styles.checkboxItem}
                          >
                            <input
                              type="checkbox"
                              className={styles.checkboxInput}
                              checked={Boolean(checkedItems[child.id])}
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
              <div className={styles.statusTitle}>Status Siswa</div>
              <div className={styles.statusDesc}>
                {statusLabel}
              </div>
            </div>

            <div className={styles.statusGroup}>
              <div className={styles.statusTitle}>Joined At</div>
              <div className={styles.statusDesc}>
                {joinedAtLabel === "-" ? "-" : joinedAtLabel}
              </div>
            </div>

            <div className={styles.statusGroup}>
              <div className={styles.statusTitle}>Visa Granted At</div>
              <div className={styles.statusDesc}>
                {visaGrantedAtLabel}
              </div>
            </div>

            <div className={styles.statusGroup}>
              <div className={styles.statusTitle}>PIC Consultant</div>
              <div
                className={styles.statusDesc}
                style={{ color: "#6d28d9", fontWeight: 600 }}
              >
                {detailStudentData?.name_consultant || "-"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Container */}
      <div className={styles.tabsContainer}>
        <Tabs activeKey={activeTab} onChange={handleTabChange} items={tabsItems} />
      </div>

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
