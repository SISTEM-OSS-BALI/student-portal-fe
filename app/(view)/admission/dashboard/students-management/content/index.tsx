"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import {
  Avatar,
  Button,
  Card,
  Empty,
  Flex,
  Input,
  message,
  Modal,
  Pagination,
  Segmented,
  Select,
  Space,
  Tag,
  Typography,
} from "antd";
import {
  AppstoreOutlined,
  ArrowsAltOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  EnvironmentOutlined,
  FilterOutlined,
  HolderOutlined,
  PauseCircleOutlined,
  PlusOutlined,
  RightOutlined,
  SearchOutlined,
  ShrinkOutlined,
  SyncOutlined,
  TableOutlined,
  UpOutlined,
  UserOutlined,
} from "@ant-design/icons";
import styles from "./students-management.module.css";
import type { StudentFormValues } from "@/app/models/user";
import {
  closestCorners,
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useRouter } from "next/navigation";
import FormStudentComponent from "./FormStudentComponent";
import PageHeader from "@/app/components/common/page-header";
import MetricCardsGroup, {
  type MetricCardItem,
} from "@/app/components/common/metric-cards";
import { useStagesManagement } from "@/app/hooks/use-stages-management";
import { useVisaTypes } from "@/app/hooks/use-visa-type-management";
import { useAuth } from "@/app/utils/use-auth";
import {
  getStudentAvatarUrl,
  getCountryName as getCountryNameHelper,
  getStudentVisaName,
  getStudentCampus,
  compareStudentsByNewest,
} from "@/app/utils/student-helpers";

import {
  useCreateUser,
  useDeleteUser,
  useUpdateStudentStatusUser,
  useUpdateUser,
  useUpdateVisaStatusUser,
  useUserRoleStudents,
  useUsers,
} from "@/app/hooks/use-users";
import {
  buildConsultantFilterOptions,
  buildConsultantOptions,
  consultantFilterLabel,
  matchesConsultantFilter,
} from "@/app/utils/consultant-options";
import type {
  UserDataModel,
  UserPayloadCreateModel,
  UserPayloadUpdateModel,
} from "@/app/models/user";

const { Text, Title } = Typography;

const PAGE_SIZE = 10;

const filterStyle: CSSProperties = {
  width: "100%",
};

type StudentBoardStatus =
  | "ONGOING"
  | "WAITING_VISA"
  | "POSTPONE"
  | "CANCEL"
  | "STUDENT_DONE";

type SelectOption = {
  value: string;
  label: string;
};

type BoardColumnConfig = {
  key: StudentBoardStatus;
  title: string;
  color: string;
  softBg: string;
  borderColor: string;
  accent: string;
  icon: React.ReactNode;
  iconBg: string;
};

type SortableHookResult = ReturnType<typeof useSortable>;

const boardConfig: BoardColumnConfig[] = [
  {
    key: "ONGOING",
    title: "On Going",
    color: "#059669",
    softBg: "linear-gradient(180deg, #f4fff7 0%, #ffffff 32%)",
    borderColor: "#c7efd2",
    accent: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
    icon: <SyncOutlined />,
    iconBg: "#ecfdf5",
  },
  {
    key: "WAITING_VISA",
    title: "Waiting Visa",
    color: "#0284c7",
    softBg: "linear-gradient(180deg, #f0f9ff 0%, #ffffff 32%)",
    borderColor: "#bae6fd",
    accent: "linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)",
    icon: <ClockCircleOutlined />,
    iconBg: "#f0f9ff",
  },
  {
    key: "STUDENT_DONE",
    title: "Student Done (Grant)",
    color: "#2563eb",
    softBg: "linear-gradient(180deg, #eff6ff 0%, #ffffff 32%)",
    borderColor: "#bfdbfe",
    accent: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
    icon: <CheckCircleOutlined />,
    iconBg: "#eff6ff",
  },
  {
    key: "POSTPONE",
    title: "Post Pone",
    color: "#d97706",
    softBg: "linear-gradient(180deg, #fff8ec 0%, #ffffff 32%)",
    borderColor: "#f6d6a8",
    accent: "linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)",
    icon: <PauseCircleOutlined />,
    iconBg: "#fffbeb",
  },
  {
    key: "CANCEL",
    title: "Cancel (Refused)",
    color: "#dc2626",
    softBg: "linear-gradient(180deg, #fff4f3 0%, #ffffff 32%)",
    borderColor: "#f5c4bf",
    accent: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    icon: <CloseCircleOutlined />,
    iconBg: "#fef2f2",
  },
];

function normalizeText(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function sanitizeFilterValue(value?: string | null): string | undefined {
  const normalized = String(value ?? "").trim();
  return normalized ? normalized : undefined;
}

function normalizeStudentResponse(value: unknown): UserDataModel[] {
  if (Array.isArray(value)) {
    return value as UserDataModel[];
  }

  const response = value as
    | {
        data?: unknown;
        result?: unknown;
        users?: unknown;
        students?: unknown;
      }
    | undefined;

  if (!response) return [];

  if (Array.isArray(response.data)) return response.data as UserDataModel[];
  if (Array.isArray(response.result)) return response.result as UserDataModel[];
  if (Array.isArray(response.users)) return response.users as UserDataModel[];
  if (Array.isArray(response.students)) {
    return response.students as UserDataModel[];
  }

  const nestedData = response.data as
    | {
        data?: unknown;
        result?: unknown;
        users?: unknown;
        students?: unknown;
      }
    | undefined;

  if (Array.isArray(nestedData?.data)) {
    return nestedData.data as UserDataModel[];
  }

  if (Array.isArray(nestedData?.result)) {
    return nestedData.result as UserDataModel[];
  }

  if (Array.isArray(nestedData?.users)) {
    return nestedData.users as UserDataModel[];
  }

  if (Array.isArray(nestedData?.students)) {
    return nestedData.students as UserDataModel[];
  }

  return [];
}

function getCountryName(student: UserDataModel): string {
  return getCountryNameHelper(student);
}

function resolveBoardStatus(value: unknown): StudentBoardStatus {
  const rawStatus = normalizeText(value);

  if (
    rawStatus.includes("student done") ||
    rawStatus.includes("done") ||
    rawStatus.includes("completed") ||
    rawStatus.includes("finish") ||
    rawStatus.includes("grant")
  ) {
    return "STUDENT_DONE";
  }

  if (
    rawStatus.includes("cancel") ||
    rawStatus.includes("canceled") ||
    rawStatus.includes("cancelled") ||
    rawStatus.includes("reject") ||
    rawStatus.includes("refuse") ||
    rawStatus.includes("refused") ||
    rawStatus.includes("drop")
  ) {
    return "CANCEL";
  }

  if (
    rawStatus.includes("postpone") ||
    rawStatus.includes("post pone") ||
    rawStatus.includes("pending") ||
    rawStatus.includes("reschedule") ||
    rawStatus.includes("hold")
  ) {
    return "POSTPONE";
  }

  if (
    rawStatus.includes("waiting visa") ||
    rawStatus.includes("waiting_visa") ||
    rawStatus.includes("visa waiting") ||
    rawStatus.includes("waiting") ||
    rawStatus.includes("proses visa") ||
    rawStatus.includes("lodgement") ||
    rawStatus.includes("lodged")
  ) {
    return "WAITING_VISA";
  }

  return "ONGOING";
}

function getStudentBoardStatus(student: UserDataModel): StudentBoardStatus {
  return resolveBoardStatus(
    student.visa_status ?? student.student_status ?? student.status,
  );
}

function getCurrentStepLabel(student: UserDataModel): string {
  const boardStatus = getStudentBoardStatus(student);

  // 1. Standarisasi jelas dan profesional per status pipeline:
  // Siswa Cancel -> Step: Cancelled (bukan berjalan)
  if (boardStatus === "CANCEL") {
    return "Cancelled";
  }

  // Siswa Postpone -> Step: On Hold (penundaan sementara)
  if (boardStatus === "POSTPONE") {
    return "On Hold";
  }

  // Siswa Selesai -> Step: Complete
  if (boardStatus === "STUDENT_DONE") {
    return "Complete";
  }

  // Siswa Menunggu Visa -> Step: Visa Processing
  if (boardStatus === "WAITING_VISA") {
    return "Visa Processing";
  }

  // 2. Untuk status ONGOING (Siswa aktif berjalan):
  // Menampilkan tahapan berjalan (Preparation atau Progress)
  const currentStepId = String(student.current_step_id ?? "").trim();
  if (currentStepId) {
    const steps = student.stage?.country?.steps ?? [];
    const step = steps.find((item) => item.id === currentStepId);
    if (step?.label) return step.label;

    const defaultStepLabels: Record<string, string> = {
      stp_prep: "Preparation",
      stp_prog: "Progress",
      stp_comp: "Complete",
    };

    if (defaultStepLabels[currentStepId]) {
      return defaultStepLabels[currentStepId];
    }
  }

  return "Preparation";
}

function getStepTone(stepLabel: string): { color: string } {
  switch (stepLabel) {
    case "Cancelled":
      return { color: "#dc2626" };
    case "On Hold":
      return { color: "#d97706" };
    case "Complete":
      return { color: "#16a34a" };
    case "Visa Processing":
      return { color: "#0284c7" };
    default:
      return { color: "#334155" };
  }
}

function getDegreeLabel(student: UserDataModel): string {
  return String(student.degree || student.name_degree || "").trim();
}

function getCampusName(student: UserDataModel): string {
  return getStudentCampus(student);
}

function getVisaType(student: UserDataModel): string {
  return getStudentVisaName(student);
}

function getConsultantName(student: UserDataModel): string {
  return String(student.name_consultant ?? "").trim();
}

function getStudentId(student: UserDataModel): string {
  return String(student.id);
}

function mergeStudentData(
  student: UserDataModel,
  override?: Partial<UserDataModel>,
): UserDataModel {
  return {
    ...student,
    ...override,
  };
}



function getStudentStatusPayload(status: StudentBoardStatus): string {
  switch (status) {
    case "WAITING_VISA":
      return "WAITING VISA";
    case "POSTPONE":
      return "POSTPONE";
    case "CANCEL":
      return "CANCEL (REFUSED)";
    case "STUDENT_DONE":
      return "STUDENT DONE (GRANT)";
    default:
      return "ON GOING";
  }
}

function getStatusTagMeta(status: StudentBoardStatus): {
  label: string;
  color: string;
  background: string;
  borderColor: string;
} {
  switch (status) {
    case "WAITING_VISA":
      return {
        label: "Waiting Visa",
        color: "#0284c7",
        background: "#f0f9ff",
        borderColor: "#bae6fd",
      };
    case "POSTPONE":
      return {
        label: "Post Pone",
        color: "#b45309",
        background: "#fff6e8",
        borderColor: "#ffd8a8",
      };
    case "CANCEL":
      return {
        label: "Cancel (Refused)",
        color: "#b42318",
        background: "#fff1f0",
        borderColor: "#ffccc7",
      };
    case "STUDENT_DONE":
      return {
        label: "Student Done (Grant)",
        color: "#1d4ed8",
        background: "#eff6ff",
        borderColor: "#bfdbfe",
      };
    default:
      return {
        label: "On Going",
        color: "#15803d",
        background: "#effcf3",
        borderColor: "#b7ebc2",
      };
  }
}

function formatVisaType(value: string): string {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "Visa belum dipilih";

  // If backend already provides a human-readable name, keep casing.
  if (trimmed.includes(" ") && !trimmed.includes("_")) {
    return trimmed;
  }

  return trimmed.replace(/_/g, " ").toUpperCase();
}

function getFilterSummaryLabel({
  country,
  visa,
  degree,
  consultant,
  referral,
}: {
  country?: string;
  visa?: string;
  degree?: string;
  consultant?: string;
  referral?: string;
}): string {
  const formatRef = (ref?: string) => {
    if (!ref) return null;
    if (ref === "__has_referral__") return "Ada Referral";
    if (ref === "__no_referral__") return "Tanpa Referral";
    return ref;
  };

  const parts = [
    country ? `Negara: ${country}` : null,
    visa ? `Visa: ${formatVisaType(visa)}` : null,
    degree ? `Jenjang: ${degree}` : null,
    consultant ? `Konsultan: ${consultant}` : null,
    referral ? `Referral: ${formatRef(referral)}` : null,
  ].filter(Boolean);

  return parts.length ? parts.join(" • ") : "Menampilkan semua student";
}

function getStudentInitials(student: UserDataModel): string {
  const parts = String(student.name ?? "")
    .split(" ")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) return "ST";

  return parts.map((item) => item.charAt(0).toUpperCase()).join("");
}

function buildStudentMetaLine(student: UserDataModel): string {
  const parts = [getCountryName(student), getCampusName(student)]
    .map((item) => item.trim())
    .filter(Boolean);

  return parts.join(" • ") || "Profil student belum lengkap";
}

function buildStudentSecondaryLine(student: UserDataModel): string {
  const parts = [getDegreeLabel(student), student.no_phone]
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);

  return parts.join(" • ") || student.email || "Belum ada detail tambahan";
}

function StudentCardInner({
  student,
  dragListeners,
  dragAttributes,
  isDragging,
  canDrag = true,
  onEdit,
  onDelete,
}: {
  student: UserDataModel;
  dragListeners?: SortableHookResult["listeners"];
  dragAttributes?: SortableHookResult["attributes"];
  isDragging?: boolean;
  canDrag?: boolean;
  onEdit?: (student: UserDataModel) => void;
  onDelete?: (student: UserDataModel) => void;
}) {
  const country = getCountryName(student);
  const visa = getVisaType(student);
  const consultant = getConsultantName(student);
  const stepLabel = getCurrentStepLabel(student);

  return (
    <div
      className={`${styles.studentCard} ${
        isDragging ? styles.studentCardDragging : ""
      }`}
    >
      {/* ── Mobile Compact List Row (Khusus tampilan mobile/layar kecil) ── */}
      <div className={styles.mobileStudentRow}>
        <Avatar
          src={getStudentAvatarUrl(student)}
          className={styles.studentAvatar}
          style={{
            backgroundColor: "#eff6ff",
            color: "#1b3d6d",
            border: "1px solid #bfdbfe",
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 700,
            flexShrink: 0,
            width: 32,
            height: 32,
          }}
        >
          {getStudentInitials(student)}
        </Avatar>

        <div className={styles.mobileStudentInfo}>
          <div className={styles.mobileStudentName}>
            {student.name || "Nama student belum tersedia"}
          </div>
          <div className={styles.mobileStudentMeta}>
            <span>{country || "-"}</span>
            {stepLabel && (
              <>
                <span className={styles.metaDot}>•</span>
                <span
                  style={{
                    color: getStepTone(stepLabel).color,
                    fontWeight: 600,
                  }}
                >
                  {stepLabel}
                </span>
              </>
            )}
            {consultant && (
              <>
                <span className={styles.metaDot}>•</span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 3,
                    color: "#475569",
                    fontWeight: 500,
                  }}
                >
                  <UserOutlined style={{ fontSize: 9.5, color: "#6366f1" }} />
                  {consultant}
                </span>
              </>
            )}
          </div>
        </div>

        <div
          className={styles.mobileStudentActions}
          onClick={(e) => e.stopPropagation()}
        >
          {onEdit && (
            <button
              type="button"
              className={styles.mobileActionBtn}
              onClick={() => onEdit(student)}
              title="Edit student"
            >
              <EditOutlined style={{ fontSize: 11 }} />
            </button>
          )}
          <div className={styles.mobileChevronRight}>
            <RightOutlined style={{ fontSize: 11, color: "#94a3b8" }} />
          </div>
        </div>
      </div>

      {/* ── Desktop Full Card View (Tetap utuh pada desktop) ── */}
      <div className={styles.desktopCardContent}>
        <Flex justify="space-between" align="flex-start" gap={10}>
          <Flex gap={10} align="center" style={{ minWidth: 0, flex: 1 }}>
            <Avatar
              src={getStudentAvatarUrl(student)}
              className={styles.studentAvatar}
              style={{
                backgroundColor: "#eff6ff",
                color: "#1b3d6d",
                border: "1px solid #bfdbfe",
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 700,
                flexShrink: 0,
                width: 34,
                height: 34,
              }}
            >
              {getStudentInitials(student)}
            </Avatar>

            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: "#0f172a",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  marginBottom: 2,
                }}
              >
                {student.name || "Nama student belum tersedia"}
              </div>

              <div
                style={{
                  fontSize: 11.5,
                  color: "#64748b",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {student.email || student.no_phone || "Belum ada kontak"}
              </div>
            </div>
          </Flex>

          <div
            style={{ display: "flex", alignItems: "center", gap: 4 }}
            onClick={(e) => e.stopPropagation()}
          >
            {canDrag && dragListeners && (
              <button
                type="button"
                {...dragAttributes}
                {...dragListeners}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 6,
                  border: "1px solid #e2e8f0",
                  color: "#94a3b8",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 11,
                  cursor: isDragging ? "grabbing" : "grab",
                  touchAction: "none",
                  background: "#fafafa",
                }}
                title="Drag handle"
              >
                <HolderOutlined />
              </button>
            )}

            {onEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(student);
                }}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 6,
                  border: "1px solid #e2e8f0",
                  background: "#ffffff",
                  color: "#1b3d6d",
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                }}
                title="Edit student"
              >
                <EditOutlined style={{ fontSize: 11 }} />
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(student);
                }}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 6,
                  border: "1px solid #fee2e2",
                  background: "#fef2f2",
                  color: "#dc2626",
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                }}
                title="Hapus student"
              >
                <DeleteOutlined style={{ fontSize: 11 }} />
              </button>
            )}
          </div>
        </Flex>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexWrap: "wrap",
            marginTop: 4,
          }}
        >
          <span
            style={{
              fontSize: 11,
              color: "#475569",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <EnvironmentOutlined style={{ color: "#2563eb", fontSize: 11 }} />
            {country || "-"}
          </span>

          <Tag
            style={{
              margin: 0,
              borderRadius: 6,
              padding: "0 6px",
              fontSize: 10.5,
              fontWeight: 500,
              color: "#475569",
              background: "#f1f5f9",
              borderColor: "#e2e8f0",
            }}
          >
            {formatVisaType(visa)}
          </Tag>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 8,
            borderTop: "1px solid #f1f5f9",
            fontSize: 11,
            marginTop: 2,
          }}
        >
          <span
            style={{
              color: "#64748b",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: 150,
            }}
          >
            Step:{" "}
            <strong style={{ color: getStepTone(stepLabel).color }}>
              {stepLabel}
            </strong>
          </span>

          {consultant ? (
            <Tag
              color="purple"
              style={{
                margin: 0,
                borderRadius: 999,
                fontSize: 10,
                fontWeight: 600,
                padding: "1px 8px",
              }}
            >
              <UserOutlined style={{ marginRight: 3 }} />
              {consultant}
            </Tag>
          ) : (
            <Tag
              style={{
                margin: 0,
                borderRadius: 999,
                fontSize: 10,
                color: "#94a3b8",
                background: "#f8fafc",
                border: "1px dashed #cbd5e1",
                padding: "1px 8px",
              }}
            >
              Tanpa Konsultan
            </Tag>
          )}
        </div>

        <div
          style={{
            marginTop: 6,
            display: "flex",
            gap: 4,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {student.source ? (
            <Tag
              color="cyan"
              style={{
                margin: 0,
                borderRadius: 6,
                fontSize: 10,
                fontWeight: 600,
                padding: "0 6px",
                textTransform: "capitalize",
              }}
            >
              Leads: {student.source}
            </Tag>
          ) : (
            <Tag
              style={{
                margin: 0,
                borderRadius: 6,
                fontSize: 10,
                color: "#94a3b8",
                background: "#f8fafc",
                border: "1px dashed #cbd5e1",
                padding: "0 6px",
              }}
            >
              Tanpa Lead
            </Tag>
          )}
          {student.source_category && (
            <Tag
              style={{
                margin: 0,
                borderRadius: 6,
                fontSize: 10,
                color: "#64748b",
                background: "#f1f5f9",
                border: "1px solid #e2e8f0",
                padding: "0 5px",
              }}
            >
              {student.source_category}
            </Tag>
          )}
          {student.code_referral && (
            <Tag
              color="green"
              style={{
                margin: 0,
                borderRadius: 6,
                fontSize: 10,
                padding: "0 5px",
                fontWeight: 600,
              }}
            >
              Ref: {student.code_referral}
            </Tag>
          )}
        </div>
      </div>
    </div>
  );
}

function SortableStudentCard({
  student,
  onClick,
  onEdit,
  onDelete,
  disabled,
  canDrag = true,
}: {
  student: UserDataModel;
  onClick: () => void;
  onEdit?: (student: UserDataModel) => void;
  onDelete?: (student: UserDataModel) => void;
  disabled?: boolean;
  canDrag?: boolean;
}) {
  const isDragDisabled = disabled || !canDrag;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: getStudentId(student),
    disabled: isDragDisabled,
  });

  return (
    <div
      ref={setNodeRef}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          onClick();
        }
      }}
      style={{
        width: "100%",
        border: "none",
        background: "transparent",
        padding: 0,
        cursor: isDragging ? "grabbing" : "pointer",
        textAlign: "left",
        transform: CSS.Transform.toString(transform),
        transition,
        outline: "none",
      }}
    >
      <StudentCardInner
        student={student}
        dragAttributes={isDragDisabled ? undefined : attributes}
        dragListeners={isDragDisabled ? undefined : listeners}
        isDragging={isDragging}
        canDrag={canDrag && !disabled}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
}

function BoardColumn({
  column,
  students,
  paginatedStudents,
  currentPage,
  onPageChange,
  onClickStudent,
  onEditStudent,
  onDeleteStudent,
  isHighlighted,
  disableInteraction,
  canDragAndDrop = true,
  isExpanded,
  onToggleExpand,
  isCollapsible = false,
  isCollapsed = false,
  onToggleCollapse,
}: {
  column: BoardColumnConfig;
  students: UserDataModel[];
  paginatedStudents: UserDataModel[];
  currentPage: number;
  onPageChange: (page: number) => void;
  onClickStudent: (student: UserDataModel) => void;
  onEditStudent?: (student: UserDataModel) => void;
  onDeleteStudent?: (student: UserDataModel) => void;
  isHighlighted: boolean;
  disableInteraction?: boolean;
  canDragAndDrop?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  isCollapsible?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.key,
  });

  const isActive = isHighlighted || isOver;

  const startNumber =
    students.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endNumber = Math.min(currentPage * PAGE_SIZE, students.length);

  return (
    <div
      ref={setNodeRef}
      id={`kanban-column-${column.key}`}
      className={`${styles.boardColumn} ${
        isActive ? styles.boardColumnHighlight : ""
      } ${
        isCollapsible && isCollapsed ? styles.boardColumnCollapsed : ""
      }`}
      onClick={() => {
        if (isCollapsible && isCollapsed) {
          onToggleCollapse?.();
        }
      }}
    >
      <div
        className={styles.columnHeader}
        onClick={(e) => {
          if (isCollapsible) {
            e.stopPropagation();
            onToggleCollapse?.();
          }
        }}
        role="button"
        tabIndex={0}
        style={isCollapsible ? { cursor: "pointer" } : undefined}
      >
        <div className={styles.columnTitleGroup}>
          <span
            className={styles.columnDot}
            style={{ background: column.color }}
          />
          <span className={styles.columnTitle}>{column.title}</span>
          {isExpanded && (
            <Tag
              color="blue"
              style={{
                borderRadius: 999,
                fontSize: 11,
                margin: 0,
                padding: "0 8px",
                fontWeight: 600,
              }}
            >
              Mode Melebar
            </Tag>
          )}
        </div>

        <Space size={6} align="center">
          <span className={styles.columnCountBadge}>{students.length}</span>

          {onToggleExpand && (
            <Button
              className={styles.desktopExpandBtn}
              size="small"
              type="text"
              icon={
                isExpanded ? (
                  <ShrinkOutlined style={{ fontSize: 13, color: "#2563eb" }} />
                ) : (
                  <ArrowsAltOutlined style={{ fontSize: 12, color: "#64748b" }} />
                )
              }
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
              title={
                isExpanded
                  ? "Kembalikan ke tampilan papan"
                  : `Lebarkan kolom ${column.title}`
              }
              style={{
                width: 26,
                height: 26,
                padding: 0,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 6,
                background: isExpanded ? "#eff6ff" : "transparent",
              }}
            />
          )}

          {isCollapsible && (
            <Button
              size="small"
              type="text"
              icon={
                isCollapsed ? (
                  <DownOutlined style={{ fontSize: 12, color: "#64748b" }} />
                ) : (
                  <UpOutlined style={{ fontSize: 12, color: "#2563eb" }} />
                )
              }
              onClick={(e) => {
                e.stopPropagation();
                onToggleCollapse?.();
              }}
              title={
                isCollapsed
                  ? `Buka card ${column.title}`
                  : `Tutup card ${column.title}`
              }
              style={{
                width: 26,
                height: 26,
                padding: 0,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 6,
                background: isCollapsed ? "#f1f5f9" : "#eff6ff",
              }}
            />
          )}
        </Space>
      </div>

      <SortableContext
        items={paginatedStudents.map((student) => getStudentId(student))}
        strategy={verticalListSortingStrategy}
      >
        <div
          className={styles.columnScrollArea}
          style={
            isExpanded
              ? {
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fill, minmax(310px, 1fr))",
                  gap: 14,
                  alignContent: "start",
                }
              : undefined
          }
        >
          {students.length === 0 ? (
            <div className={styles.emptyColumnSlot}>
              <span style={{ fontWeight: 600, color: "#64748b" }}>
                Belum ada student
              </span>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>
                {canDragAndDrop
                  ? "Tarik kartu ke kolom ini untuk ubah status"
                  : "Tidak ada student pada tahapan ini"}
              </span>
            </div>
          ) : (
            paginatedStudents.map((student) => (
              <SortableStudentCard
                key={student.id}
                student={student}
                disabled={disableInteraction || !canDragAndDrop}
                canDrag={canDragAndDrop}
                onClick={() => onClickStudent(student)}
                onEdit={onEditStudent}
                onDelete={onDeleteStudent}
              />
            ))
          )}
        </div>
      </SortableContext>

      {students.length > PAGE_SIZE && (
        <div
          className={styles.columnPagination}
          style={{
            padding: "6px 10px",
            borderTop: "1px solid #eef2f6",
            background: "#ffffff",
          }}
        >
          <Flex align="center" justify="space-between" gap={8} wrap>
            <Text
              type="secondary"
              style={{
                fontSize: 11,
                whiteSpace: "nowrap",
              }}
            >
              {`${startNumber}-${endNumber} / ${students.length}`}
            </Text>

            <Pagination
              size="small"
              current={currentPage}
              pageSize={PAGE_SIZE}
              total={students.length}
              onChange={onPageChange}
              showSizeChanger={false}
              hideOnSinglePage
            />
          </Flex>
        </div>
      )}
    </div>
  );
}

export type StudentsManagementContentProps = {
  detailBasePath?: string;
  readOnly?: boolean;
  title?: string;
  subtitle?: string;
  onAddNew?: () => void;
  addNewText?: string;
  hideAddNew?: boolean;
  consultantOnly?: boolean;
};

export default function StudentsManagementContent({
  detailBasePath = "/admission/dashboard/students-management/detail",
  readOnly = false,
  title = "Student Pipeline",
  subtitle = "Pantau progres pipeline siswa dan pengajuan visa",
  onAddNew,
  addNewText = "Add Student",
  hideAddNew = false,
  consultantOnly = false,
}: StudentsManagementContentProps = {}) {
  const router = useRouter();
  const { user_name, role: userRole } = useAuth();
  const isConsultant = consultantOnly || userRole?.toLowerCase() === "consultant";
  const loggedInConsultantName = (user_name ?? "").trim();
  const normalizedRole = (userRole ?? "").toLowerCase().trim();
  const isAdmission = !consultantOnly && normalizedRole === "admission";
  const canDragAndDrop = !readOnly && isAdmission;

  const [keyword, setKeyword] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | undefined>();
  const [selectedVisa, setSelectedVisa] = useState<string | undefined>();
  const [selectedDegree, setSelectedDegree] = useState<string | undefined>();
  const [selectedConsultant, setSelectedConsultant] = useState<
    string | undefined
  >();
  const [selectedReferral, setSelectedReferral] = useState<
    string | undefined
  >();
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] =
    useState<StudentBoardStatus | null>(null);
  const [movingStudentId, setMovingStudentId] = useState<string | null>(null);
  const [editingStudent, setEditingStudent] = useState<UserDataModel | null>(
    null,
  );
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [deleteTargetStudent, setDeleteTargetStudent] =
    useState<UserDataModel | null>(null);
  const [studentOverrides, setStudentOverrides] = useState<
    Record<string, Partial<UserDataModel>>
  >({});
  const [collapsedColumns, setCollapsedColumns] = useState<
    Record<string, boolean>
  >({
    POSTPONE: true,
    CANCEL: true,
  });

  const toggleColumnCollapse = useCallback((columnKey: string) => {
    setCollapsedColumns((prev) => ({
      ...prev,
      [columnKey]: !prev[columnKey],
    }));
  }, []);

  const [pageByStatus, setPageByStatus] = useState<
    Record<StudentBoardStatus, number>
  >({
    ONGOING: 1,
    WAITING_VISA: 1,
    POSTPONE: 1,
    CANCEL: 1,
    STUDENT_DONE: 1,
  });

  const { onCreate, onCreateLoading } = useCreateUser();

  const { onUpdate: onUpdateStudentStatus, onUpdateLoading } =
    useUpdateStudentStatusUser();

  const { onUpdate: onUpdateVisaStatus } = useUpdateVisaStatusUser();

  const {
    onUpdate: updateStudentUser,
    onUpdateLoading: updateStudentUserLoading,
  } = useUpdateUser();

  const { onDelete, onDeleteLoading } = useDeleteUser();

  const { data: rawStudentsRoleData } = useUserRoleStudents({
    consultant: isConsultant && loggedInConsultantName ? loggedInConsultantName : undefined,
  });
  // Team Account: dasar pilihan dan pencocokan filter konsultan (konsultan yang login hanya melihat dirinya, jadi tidak perlu memuatnya).
  const { data: teamUsers } = useUsers({ enabled: !isConsultant });
  const { data: stagesData = [] } = useStagesManagement({});
  const { data: visaTypesData = [] } = useVisaTypes({});
  const [viewMode, setViewMode] = useState<"board" | "table">("board");
  const [statusFilter, setStatusFilter] = useState<StudentBoardStatus | "ALL">("ALL");

  const studentsRoleData = useMemo<UserDataModel[]>(() => {
    const list = normalizeStudentResponse(rawStudentsRoleData);
    if (isConsultant && loggedInConsultantName) {
      const cName = normalizeText(loggedInConsultantName);
      return list.filter((student) => {
        const sConsultant = normalizeText(getConsultantName(student));
        if (!sConsultant) return false;
        return (
          sConsultant === cName ||
          cName.split(/\s+/)[0] === sConsultant.split(/\s+/)[0] ||
          cName.includes(sConsultant) ||
          sConsultant.includes(cName)
        );
      });
    }
    return list;
  }, [rawStudentsRoleData, isConsultant, loggedInConsultantName]);

  const goToStudentDetail = useCallback(
    (student: UserDataModel) => {
      router.push(
        `${detailBasePath}/${student.id}`,
      );
    },
    [detailBasePath, router],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const resetPagination = useCallback(() => {
    setPageByStatus({
      ONGOING: 1,
      WAITING_VISA: 1,
      POSTPONE: 1,
      CANCEL: 1,
      STUDENT_DONE: 1,
    });
  }, []);

  const openCreateModal = useCallback(() => {
    setEditingStudent(null);
    setIsStudentModalOpen(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("oss_add_student_modal_open", "true");
    }
  }, []);

  const openEditModal = useCallback((student: UserDataModel) => {
    setEditingStudent(student);
    setIsStudentModalOpen(true);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("oss_add_student_modal_open");
    }
  }, []);

  const closeStudentModal = useCallback(() => {
    setIsStudentModalOpen(false);
    setEditingStudent(null);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("oss_add_student_modal_open");
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isAddStudentOpen =
        sessionStorage.getItem("oss_add_student_modal_open") === "true";
      if (isAddStudentOpen) {
        setIsStudentModalOpen(true);
      }
    }
  }, []);

  const openDeleteModal = useCallback((student: UserDataModel) => {
    setDeleteTargetStudent(student);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setDeleteTargetStudent(null);
  }, []);

  const handleSubmitStudent = useCallback(
    async (values: StudentFormValues) => {
      if (editingStudent?.id) {
        const studentId = String(editingStudent.id);

        const payload: UserPayloadUpdateModel = {
          ...values,
        };

        try {
          const response = await updateStudentUser({
            id: studentId,
            payload,
          });

          const updatedStudent = (response?.data?.result ?? response?.data) as
            | UserDataModel
            | undefined;

          setStudentOverrides((prev) => ({
            ...prev,
            [studentId]: {
              ...prev[studentId],
              ...values,
              ...(updatedStudent ?? {}),
            },
          }));

          closeStudentModal();
          resetPagination();
        } catch {
          // onError hooks show descriptive error
        }
        return;
      }

      const { password, ...rest } = values;
      if (!password) {
        message.error("Password wajib diisi untuk membuat student baru.");
        return;
      }

      const payload: UserPayloadCreateModel = { ...rest, password, role: "student" };

      try {
        await onCreate(payload);
        if (typeof window !== "undefined") {
          localStorage.removeItem("oss_add_student_form_draft");
          sessionStorage.removeItem("oss_add_student_modal_open");
        }
        closeStudentModal();
        resetPagination();
      } catch {
        // onError hooks show descriptive error
      }
    },
    [
      closeStudentModal,
      editingStudent,
      onCreate,
      resetPagination,
      updateStudentUser,
    ],
  );

  const handleConfirmDeleteStudent = useCallback(async () => {
    if (!deleteTargetStudent?.id) return;

    const studentId = getStudentId(deleteTargetStudent);

    await onDelete(deleteTargetStudent.id);

    setStudentOverrides((prev) => {
      const next = { ...prev };
      delete next[studentId];
      return next;
    });

    if (editingStudent && getStudentId(editingStudent) === studentId) {
      closeStudentModal();
    }

    closeDeleteModal();
    resetPagination();
  }, [
    closeDeleteModal,
    closeStudentModal,
    deleteTargetStudent,
    editingStudent,
    onDelete,
    resetPagination,
  ]);

  const isUpdatingStudent =
    onUpdateLoading ||
    updateStudentUserLoading ||
    onCreateLoading ||
    onDeleteLoading ||
    movingStudentId !== null;

  const activeCountryFilter = sanitizeFilterValue(selectedCountry);
  const activeVisaFilter = sanitizeFilterValue(selectedVisa);
  const activeDegreeFilter = sanitizeFilterValue(selectedDegree);
  const activeConsultantFilter = sanitizeFilterValue(selectedConsultant);
  const activeReferralFilter = sanitizeFilterValue(selectedReferral);
  const activeKeyword = sanitizeFilterValue(keyword);

  const hasActiveFilter = Boolean(
    activeKeyword ||
    activeCountryFilter ||
    activeVisaFilter ||
    activeDegreeFilter ||
    activeConsultantFilter ||
    activeReferralFilter,
  );

  const resetFilters = useCallback(() => {
    setSelectedCountry(undefined);
    setSelectedVisa(undefined);
    setSelectedDegree(undefined);
    setSelectedConsultant(undefined);
    setSelectedReferral(undefined);
    setKeyword("");
    resetPagination();
  }, [resetPagination]);

  const toggleFilters = useCallback(() => {
    setShowFilters((prev) => !prev);
  }, []);

  useEffect(() => {
    resetPagination();
  }, [
    keyword,
    selectedCountry,
    selectedVisa,
    selectedDegree,
    selectedConsultant,
    selectedReferral,
    studentsRoleData.length,
    resetPagination,
  ]);

  useEffect(() => {
    if (!studentsRoleData.length) return;

    setStudentOverrides((prev) => {
      let changed = false;
      const next = { ...prev };

      for (const student of studentsRoleData) {
        const id = getStudentId(student);
        const override = next[id];

        if (!override) continue;

        const serverStatus = getStudentBoardStatus(student);
        const overrideStatus = resolveBoardStatus(
          override.student_status ?? override.status ?? student.student_status,
        );

        if (serverStatus === overrideStatus) {
          delete next[id];
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [studentsRoleData]);

  const countryOptions = useMemo<SelectOption[]>(() => {
    const map = new Map<string, SelectOption>();

    studentsRoleData.forEach((student) => {
      const country = getCountryName(student);

      if (country && country !== "-") {
        map.set(country, {
          value: country,
          label: country,
        });
      }
    });

    return Array.from(map.values());
  }, [studentsRoleData]);

  const visaOptions = useMemo<SelectOption[]>(() => {
    // Filter should use visa NAME (human-readable) to avoid mixing ids vs names.
    // This keeps it consistent with Visa Type Management display.
    const options: SelectOption[] = (visaTypesData ?? [])
      .filter((visa) => visa?.name)
      .map((visa) => {
        const name = String(visa.name).trim();
        return { value: name, label: name };
      })
      .filter((opt) => opt.value);

    const byLabelKey = new Map<string, SelectOption>();
    for (const opt of options) {
      byLabelKey.set(normalizeText(opt.label), opt);
    }

    // Backward compatibility: include any visa labels found on students that
    // don't exist in the management table.
    studentsRoleData.forEach((student) => {
      const visa = getVisaType(student);
      if (!visa) return;
      const key = normalizeText(visa);
      if (byLabelKey.has(key)) return;
      const label = formatVisaType(visa);
      byLabelKey.set(key, { value: visa, label });
    });

    return Array.from(byLabelKey.values());
  }, [studentsRoleData, visaTypesData]);

  const degreeOptions = useMemo<SelectOption[]>(() => {
    const map = new Map<string, SelectOption>();

    studentsRoleData.forEach((student) => {
      const degree = getDegreeLabel(student);

      if (degree) {
        map.set(degree, {
          value: degree,
          label: degree.charAt(0).toUpperCase() + degree.slice(1),
        });
      }
    });

    return Array.from(map.values());
  }, [studentsRoleData]);

  const teamAccountNames = useMemo(
    () => buildConsultantOptions(teamUsers).map((option) => option.value),
    [teamUsers],
  );

  // Pilihan = Team Account (Consultant dan Director), satu per orang; nama lama di data siswa tidak lagi jadi pilihan sendiri.
  const consultantOptions = useMemo<SelectOption[]>(() => {
    if (isConsultant && loggedInConsultantName) {
      return [
        {
          value: loggedInConsultantName,
          label: loggedInConsultantName,
        },
      ];
    }
    return buildConsultantFilterOptions(
      teamUsers,
      studentsRoleData.map(getConsultantName),
    );
  }, [studentsRoleData, teamUsers, isConsultant, loggedInConsultantName]);

  const referralOptions = useMemo<SelectOption[]>(() => {
    const options: SelectOption[] = [
      { value: "__no_referral__", label: "Tanpa Referral" },
    ];

    const codes = new Set<string>();
    studentsRoleData.forEach((student) => {
      const code = student.code_referral?.trim();
      if (code) {
        codes.add(code);
      }
    });

    Array.from(codes)
      .sort((a, b) => a.localeCompare(b))
      .forEach((code) => {
        options.push({ value: code, label: code });
      });

    return options;
  }, [studentsRoleData]);

  const effectiveStudents = useMemo<UserDataModel[]>(() => {
    return studentsRoleData
      .map((student) =>
        mergeStudentData(student, studentOverrides[getStudentId(student)]),
      )
      .sort(compareStudentsByNewest);
  }, [studentOverrides, studentsRoleData]);

  const filteredStudents = useMemo<UserDataModel[]>(() => {
    if (!hasActiveFilter) {
      return [...effectiveStudents].sort(compareStudentsByNewest);
    }

    const filtered = effectiveStudents.filter((student) => {
      const haystack = [
        student.name,
        student.email,
        student.no_phone,
        student.code_referral,
        getCountryName(student),
        getDegreeLabel(student),
        getCampusName(student),
        getVisaType(student),
        getConsultantName(student),
      ]
        .map((item) => normalizeText(item))
        .join(" ");

      const matchKeyword =
        !activeKeyword || haystack.includes(normalizeText(activeKeyword));

      const matchCountry =
        !activeCountryFilter ||
        normalizeText(getCountryName(student)) ===
          normalizeText(activeCountryFilter);

      const matchVisa =
        !activeVisaFilter ||
        normalizeText(getVisaType(student)) === normalizeText(activeVisaFilter);

      const matchDegree =
        !activeDegreeFilter ||
        normalizeText(getDegreeLabel(student)) ===
          normalizeText(activeDegreeFilter);

      const matchConsultant = matchesConsultantFilter(
        getConsultantName(student),
        activeConsultantFilter,
        teamAccountNames,
      );

      const matchReferral = (() => {
        if (!activeReferralFilter) return true;
        const studentReferral = student.code_referral?.trim() || "";
        const hasReferral = Boolean(
          studentReferral ||
            normalizeText(student.source_category) === "referral" ||
            normalizeText(student.source) === "referral",
        );

        if (activeReferralFilter === "__has_referral__") {
          return hasReferral;
        }
        if (activeReferralFilter === "__no_referral__") {
          return !hasReferral;
        }
        return (
          normalizeText(studentReferral) === normalizeText(activeReferralFilter)
        );
      })();

      return (
        matchKeyword &&
        matchCountry &&
        matchVisa &&
        matchDegree &&
        matchConsultant &&
        matchReferral
      );
    });

    return filtered.sort(compareStudentsByNewest);
  }, [
    activeConsultantFilter,
    activeCountryFilter,
    activeDegreeFilter,
    activeKeyword,
    activeReferralFilter,
    activeVisaFilter,
    effectiveStudents,
    hasActiveFilter,
    teamAccountNames,
  ]);

  const studentMap = useMemo(() => {
    const map = new Map<string, UserDataModel>();

    effectiveStudents.forEach((student) => {
      map.set(getStudentId(student), student);
    });

    return map;
  }, [effectiveStudents]);

  const getEffectiveBoardStatus = useCallback(
    (student: UserDataModel): StudentBoardStatus => {
      return getStudentBoardStatus(student);
    },
    [],
  );

  const groupedStudents = useMemo<
    Record<StudentBoardStatus, UserDataModel[]>
  >(() => {
    const grouped: Record<StudentBoardStatus, UserDataModel[]> = {
      ONGOING: [],
      WAITING_VISA: [],
      POSTPONE: [],
      CANCEL: [],
      STUDENT_DONE: [],
    };

    filteredStudents.forEach((student) => {
      const status = getEffectiveBoardStatus(student);
      grouped[status].push(student);
    });

    // Urutkan setiap kolom status agar data siswa yang baru masuk selalu muncul paling atas
    (Object.keys(grouped) as StudentBoardStatus[]).forEach((statusKey) => {
      grouped[statusKey].sort(compareStudentsByNewest);
    });

    return grouped;
  }, [filteredStudents, getEffectiveBoardStatus]);

  const paginatedGroupedStudents = useMemo<
    Record<StudentBoardStatus, UserDataModel[]>
  >(() => {
    return {
      ONGOING: groupedStudents.ONGOING.slice(
        ((pageByStatus.ONGOING || 1) - 1) * PAGE_SIZE,
        (pageByStatus.ONGOING || 1) * PAGE_SIZE,
      ),
      WAITING_VISA: groupedStudents.WAITING_VISA.slice(
        ((pageByStatus.WAITING_VISA || 1) - 1) * PAGE_SIZE,
        (pageByStatus.WAITING_VISA || 1) * PAGE_SIZE,
      ),
      POSTPONE: groupedStudents.POSTPONE.slice(
        ((pageByStatus.POSTPONE || 1) - 1) * PAGE_SIZE,
        (pageByStatus.POSTPONE || 1) * PAGE_SIZE,
      ),
      CANCEL: groupedStudents.CANCEL.slice(
        ((pageByStatus.CANCEL || 1) - 1) * PAGE_SIZE,
        (pageByStatus.CANCEL || 1) * PAGE_SIZE,
      ),
      STUDENT_DONE: groupedStudents.STUDENT_DONE.slice(
        ((pageByStatus.STUDENT_DONE || 1) - 1) * PAGE_SIZE,
        (pageByStatus.STUDENT_DONE || 1) * PAGE_SIZE,
      ),
    };
  }, [groupedStudents, pageByStatus]);

  const activeStudent = activeStudentId
    ? (studentMap.get(activeStudentId) ?? null)
    : null;

  const resolveDropStatus = useCallback(
    (
      overId: UniqueIdentifier | null | undefined,
    ): StudentBoardStatus | null => {
      if (!overId) return null;

      const candidate = String(overId);

      if (boardConfig.some((column) => column.key === candidate)) {
        return candidate as StudentBoardStatus;
      }

      const overStudent = studentMap.get(candidate);

      return overStudent ? getEffectiveBoardStatus(overStudent) : null;
    },
    [getEffectiveBoardStatus, studentMap],
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      if (!canDragAndDrop) return;
      setActiveStudentId(String(event.active.id));
    },
    [canDragAndDrop],
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      if (!canDragAndDrop) return;
      setDragOverStatus(resolveDropStatus(event.over?.id));
    },
    [canDragAndDrop, resolveDropStatus],
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const draggedId = String(event.active.id);
      const draggedStudent = studentMap.get(draggedId);
      const nextStatus = resolveDropStatus(event.over?.id);

      setActiveStudentId(null);
      setDragOverStatus(null);

      if (!canDragAndDrop || readOnly || !draggedStudent || !nextStatus) return;

      const currentStatus = getEffectiveBoardStatus(draggedStudent);

      if (currentStatus === nextStatus) return;

      const statusPayload = getStudentStatusPayload(nextStatus);
      const nowIso = new Date().toISOString();
      setStudentOverrides((prev) => ({
        ...prev,
        [draggedId]: {
          ...prev[draggedId],
          student_status: statusPayload,
          visa_status: statusPayload,
          student_status_updated_at: nowIso,
          updated_at: nowIso,
        },
      }));

      setMovingStudentId(draggedId);

      try {
        const [studentRes] = await Promise.all([
          onUpdateStudentStatus({
            id: draggedId,
            student_status: statusPayload,
          }),
          onUpdateVisaStatus({
            id: draggedId,
            visa_status: statusPayload,
          }),
        ]);

        const updatedStudent = (studentRes?.data?.result ?? studentRes?.data) as
          | UserDataModel
          | undefined;

        if (updatedStudent) {
          setStudentOverrides((prev) => ({
            ...prev,
            [draggedId]: updatedStudent,
          }));
        }
      } catch {
        setStudentOverrides((prev) => {
          const next = { ...prev };
          delete next[draggedId];
          return next;
        });
      } finally {
        setMovingStudentId(null);
        resetPagination();
      }
    },
    [
      canDragAndDrop,
      getEffectiveBoardStatus,
      onUpdateStudentStatus,
      readOnly,
      resetPagination,
      resolveDropStatus,
      studentMap,
    ],
  );

  const handleDragCancel = useCallback(() => {
    setActiveStudentId(null);
    setDragOverStatus(null);
  }, []);

  const handleColumnPageChange = useCallback(
    (status: StudentBoardStatus, page: number) => {
      setPageByStatus((prev) => ({
        ...prev,
        [status]: page,
      }));
    },
    [],
  );

  const boardSummary = useMemo(() => {
    return boardConfig.map((column) => ({
      ...column,
      count: groupedStudents[column.key].length,
    }));
  }, [groupedStudents]);

  const visibleColumns = useMemo(() => {
    if (statusFilter === "ALL") return boardConfig;
    return boardConfig.filter((col) => col.key === statusFilter);
  }, [statusFilter]);

  const primaryColumns = useMemo(
    () =>
      boardConfig.filter((c) =>
        ["ONGOING", "WAITING_VISA", "STUDENT_DONE"].includes(c.key),
      ),
    [],
  );

  const secondaryColumns = useMemo(
    () =>
      boardConfig.filter((c) => ["POSTPONE", "CANCEL"].includes(c.key)),
    [],
  );

  const displayedTableStudents = useMemo(() => {
    const list =
      statusFilter === "ALL"
        ? filteredStudents
        : filteredStudents.filter(
            (s) => getEffectiveBoardStatus(s) === statusFilter,
          );
    return [...list].sort(compareStudentsByNewest);
  }, [filteredStudents, getEffectiveBoardStatus, statusFilter]);

  const metricItems = useMemo<MetricCardItem[]>(() => {
    return [
      {
        key: "ALL",
        title: "Semua Student",
        count: filteredStudents.length,
        caption: "Total seluruh siswa terdaftar",
        color: "#1b3d6d",
        bgSoft: "#eff6ff",
        icon: <UserOutlined />,
      },
      ...boardConfig.map((col) => {
        const count = groupedStudents[col.key]?.length ?? 0;
        let caption = "Dalam tahapan aktif";
        if (col.key === "WAITING_VISA") caption = "Menunggu approval visa";
        if (col.key === "POSTPONE") caption = "Tertunda sementara";
        if (col.key === "CANCEL") caption = "Visa refused / batal";
        if (col.key === "STUDENT_DONE") caption = "Visa grant & studi selesai";

        return {
          key: col.key,
          title: col.title,
          count,
          caption,
          color: col.color,
          bgSoft: col.iconBg,
          icon: col.icon,
        };
      }),
    ];
  }, [filteredStudents.length, groupedStudents]);

  const handleMetricCardSelect = useCallback(
    (key: string) => {
      if (key === statusFilter) {
        setStatusFilter("ALL");
      } else {
        setStatusFilter(key as StudentBoardStatus | "ALL");
      }
    },
    [statusFilter],
  );

  return (
    <div className={styles.pageWrapper}>
      {/* 1. Consistent Header Card component */}
      <PageHeader
        title={title}
        subtitle={subtitle}
        icon={<AppstoreOutlined />}
        onAddNew={hideAddNew ? undefined : (onAddNew || openCreateModal)}
        addNewText={addNewText}
      />

      {/* 2. Main White Container Card */}
      <div className={styles.mainCard}>
        {/* Eye-catching BI Metric Cards ("kotak kotak kecil") */}
        <MetricCardsGroup
          items={metricItems}
          activeKey={statusFilter}
          onSelect={handleMetricCardSelect}
        />

        {/* Toolbar Controls */}
        <div className={styles.toolbarRow}>
          <div className={styles.toolbarLeft}>
            <Input
              allowClear
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search student by name, email, or phone..."
              prefix={
                <SearchOutlined style={{ color: "#94a3b8", fontSize: 13 }} />
              }
              style={{
                width: 320,
                maxWidth: "100%",
                borderRadius: 8,
                height: 34,
                fontSize: 12.5,
                background: "#ffffff",
              }}
            />

            <Button
              icon={<FilterOutlined style={{ fontSize: 13 }} />}
              onClick={toggleFilters}
              style={{
                borderRadius: 8,
                height: 34,
                fontWeight: 600,
                fontSize: 12.5,
                borderColor: showFilters || hasActiveFilter ? "#2563eb" : "#e2e8f0",
                color: showFilters || hasActiveFilter ? "#2563eb" : "#475569",
                background: showFilters || hasActiveFilter ? "#eff6ff" : "#ffffff",
              }}
            >
              Filter
            </Button>

            {hasActiveFilter && (
              <Button
                size="small"
                onClick={resetFilters}
                style={{
                  borderRadius: 8,
                  fontSize: 12,
                  height: 34,
                  borderColor: "#e2e8f0",
                  color: "#64748b",
                }}
              >
                Reset Filter
              </Button>
            )}

            <Segmented
              value={viewMode}
              onChange={(val) => setViewMode(val as "board" | "table")}
              options={[
                {
                  value: "board",
                  label: "Board",
                  icon: <AppstoreOutlined style={{ fontSize: 13 }} />,
                },
                {
                  value: "table",
                  label: "Table",
                  icon: <TableOutlined style={{ fontSize: 13 }} />,
                },
              ]}
              style={{
                borderRadius: 8,
                padding: 2,
                background: "#f1f5f9",
                height: 34,
                display: "flex",
                alignItems: "center",
              }}
            />
          </div>

          <div className={styles.toolbarRight}>
            {statusFilter !== "ALL" && (
              <Tag
                color="blue"
                closable
                onClose={() => setStatusFilter("ALL")}
                style={{
                  borderRadius: 999,
                  fontWeight: 600,
                  padding: "2px 10px",
                  fontSize: 12,
                }}
              >
                Fokus: {boardConfig.find((c) => c.key === statusFilter)?.title}
              </Tag>
            )}
            <Text type="secondary" style={{ fontSize: 12.5 }}>
              Menampilkan {displayedTableStudents.length} dari {filteredStudents.length} student
            </Text>
          </div>
        </div>

        {/* Collapsible Filter Panel */}
        {showFilters && (
          <div className={styles.advancedFilterCard}>
            <Flex
              justify="space-between"
              align="center"
              gap={16}
              wrap
              style={{ marginBottom: 12 }}
            >
              <div>
                <Text
                  strong
                  style={{
                    display: "block",
                    color: "#0f172a",
                    fontSize: 13.5,
                    marginBottom: 2,
                  }}
                >
                  Filter Lanjutan Student
                </Text>

                <Text style={{ color: "#64748b", fontSize: 12 }}>
                  {getFilterSummaryLabel({
                    country: selectedCountry,
                    visa: selectedVisa,
                    degree: selectedDegree,
                    consultant: consultantFilterLabel(selectedConsultant),
                    referral: selectedReferral,
                  })}
                </Text>
              </div>

              <Button
                size="small"
                onClick={resetFilters}
                style={{
                  borderRadius: 8,
                  fontWeight: 500,
                  fontSize: 12,
                  borderColor: "#e2e8f0",
                  color: "#475569",
                  background: "#ffffff",
                }}
              >
                Reset Filter
              </Button>
            </Flex>

            <div className={styles.advancedFilterGrid}>
              <div>
                <Text
                  style={{
                    display: "block",
                    fontSize: 11.5,
                    color: "#475569",
                    marginBottom: 4,
                    fontWeight: 600,
                  }}
                >
                  Negara Tujuan
                </Text>

                <Select
                  placeholder="Semua negara"
                  allowClear
                  value={selectedCountry}
                  onChange={(value) =>
                    setSelectedCountry(sanitizeFilterValue(value))
                  }
                  style={filterStyle}
                  options={countryOptions}
                />
              </div>

              <div>
                <Text
                  style={{
                    display: "block",
                    fontSize: 11.5,
                    color: "#475569",
                    marginBottom: 4,
                    fontWeight: 600,
                  }}
                >
                  Jenis Visa
                </Text>

                <Select
                  placeholder="Semua visa"
                  allowClear
                  value={selectedVisa}
                  onChange={(value) =>
                    setSelectedVisa(sanitizeFilterValue(value))
                  }
                  style={filterStyle}
                  options={visaOptions}
                />
              </div>

              <div>
                <Text
                  style={{
                    display: "block",
                    fontSize: 11.5,
                    color: "#475569",
                    marginBottom: 4,
                    fontWeight: 600,
                  }}
                >
                  Jenjang Pendidikan
                </Text>

                <Select
                  placeholder="Semua jenjang"
                  allowClear
                  value={selectedDegree}
                  onChange={(value) =>
                    setSelectedDegree(sanitizeFilterValue(value))
                  }
                  style={filterStyle}
                  options={degreeOptions}
                />
              </div>

              <div>
                <Text
                  style={{
                    display: "block",
                    fontSize: 11.5,
                    color: "#475569",
                    marginBottom: 4,
                    fontWeight: 600,
                  }}
                >
                  Konsultan
                </Text>

                {isConsultant ? (
                  <div
                    style={{
                      height: 32,
                      padding: "4px 11px",
                      background: "#f1f5f9",
                      border: "1px solid #e2e8f0",
                      borderRadius: 6,
                      fontSize: 13,
                      color: "#334155",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {loggedInConsultantName || "Konsultan Saya"}
                  </div>
                ) : (
                  <Select
                    placeholder="Semua konsultan"
                    allowClear
                    value={selectedConsultant}
                    onChange={(value) =>
                      setSelectedConsultant(sanitizeFilterValue(value))
                    }
                    style={filterStyle}
                    options={consultantOptions}
                  />
                )}
              </div>

              <div>
                <Text
                  style={{
                    display: "block",
                    fontSize: 11.5,
                    color: "#475569",
                    marginBottom: 4,
                    fontWeight: 600,
                  }}
                >
                  Referral
                </Text>

                <Select
                  placeholder="Semua referral"
                  allowClear
                  value={selectedReferral}
                  onChange={(value) =>
                    setSelectedReferral(sanitizeFilterValue(value))
                  }
                  style={filterStyle}
                  options={referralOptions}
                />
              </div>
            </div>
          </div>
        )}

        {viewMode === "table" ? (
          <div className={styles.tableContainer}>
            <div className={styles.tableHeaderBar}>
              <Space>
                <Text strong style={{ fontSize: 13, color: "#0f172a" }}>
                  Daftar Siswa ({displayedTableStudents.length})
                </Text>
                {statusFilter !== "ALL" && (
                  <Tag
                    color="blue"
                    closable
                    onClose={() => setStatusFilter("ALL")}
                    style={{ borderRadius: 999, fontWeight: 600 }}
                  >
                    Status {boardConfig.find((c) => c.key === statusFilter)?.title}
                  </Tag>
                )}
              </Space>
              <Text type="secondary" className={styles.tableHeaderHint} style={{ fontSize: 11.5 }}>
                Klik baris untuk detail
              </Text>
            </div>
            <div className={styles.tableScroll}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Status Pipeline</th>
                    <th>Negara Tujuan</th>
                    <th>Tipe Visa</th>
                    <th>Step Saat Ini</th>
                    <th>Konsultan</th>
                    <th style={{ textAlign: "right" }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedTableStudents.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        style={{
                          textAlign: "center",
                          padding: "48px 16px",
                          color: "#94a3b8",
                        }}
                      >
                        Tidak ada data student yang cocok dengan filter.
                      </td>
                    </tr>
                  ) : (
                    displayedTableStudents.map((student) => {
                      const statusKey = getEffectiveBoardStatus(student);
                      const statusConfig = boardConfig.find(
                        (c) => c.key === statusKey,
                      );
                      const stepLabel = getCurrentStepLabel(student);
                      const country = getCountryName(student);
                      const visa = getVisaType(student);
                      const consultant = getConsultantName(student);

                      return (
                        <tr
                          key={getStudentId(student)}
                          onClick={() => goToStudentDetail(student)}
                        >
                          <td>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                              }}
                            >
                              <Avatar
                                src={getStudentAvatarUrl(student)}
                                className={styles.studentAvatar}
                                style={{
                                  backgroundColor: "#eff6ff",
                                  color: "#1b3d6d",
                                  border: "1px solid #bfdbfe",
                                  borderRadius: 10,
                                  fontSize: 12,
                                  fontWeight: 700,
                                  flexShrink: 0,
                                  width: 34,
                                  height: 34,
                                }}
                              >
                                {getStudentInitials(student)}
                              </Avatar>
                              <div style={{ minWidth: 0 }}>
                                <div
                                  style={{
                                    fontWeight: 700,
                                    color: "#0f172a",
                                    fontSize: 13,
                                  }}
                                >
                                  {student.name || "-"}
                                </div>
                                <div style={{ fontSize: 11.5, color: "#64748b" }}>
                                  {student.email || student.no_phone || "-"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <Tag
                              style={{
                                margin: 0,
                                borderRadius: 999,
                                padding: "2px 10px",
                                fontSize: 11,
                                fontWeight: 600,
                                background: statusConfig?.iconBg || "#f1f5f9",
                                color: statusConfig?.color || "#475569",
                                borderColor:
                                  statusConfig?.borderColor || "transparent",
                              }}
                            >
                              {statusConfig?.title || statusKey}
                            </Tag>
                          </td>
                          <td>
                            <Space size={6}>
                              <EnvironmentOutlined
                                style={{ color: "#2563eb", fontSize: 12 }}
                              />
                              <span>{country || "-"}</span>
                            </Space>
                          </td>
                          <td>
                            <Tag
                              style={{
                                borderRadius: 6,
                                fontSize: 11,
                                margin: 0,
                              }}
                            >
                              {formatVisaType(visa)}
                            </Tag>
                          </td>
                          <td>
                            <span style={{ fontSize: 12, fontWeight: 600, color: getStepTone(stepLabel).color }}>
                              {stepLabel}
                            </span>
                          </td>
                          <td>
                            {consultant ? (
                              <Tag
                                color="purple"
                                style={{
                                  borderRadius: 999,
                                  fontSize: 11,
                                  margin: 0,
                                  fontWeight: 500,
                                }}
                              >
                                <UserOutlined style={{ marginRight: 4 }} />
                                {consultant}
                              </Tag>
                            ) : (
                              <span
                                style={{
                                  fontSize: 12,
                                  color: "#94a3b8",
                                  fontStyle: "italic",
                                }}
                              >
                                Belum ditugaskan
                              </span>
                            )}
                          </td>
                          <td
                            style={{ textAlign: "right" }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Space size={4}>
                              {!readOnly && (
                                <>
                                  <Button
                                    size="small"
                                    type="text"
                                    icon={<EditOutlined style={{ color: "#1b3d6d" }} />}
                                    onClick={() => openEditModal(student)}
                                    title="Edit Student"
                                  />
                                  <Button
                                    size="small"
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => openDeleteModal(student)}
                                    title="Hapus Student"
                                  />
                                </>
                              )}
                              <Button
                                size="small"
                                type="text"
                                icon={
                                  <RightOutlined
                                    style={{ fontSize: 11, color: "#64748b" }}
                                  />
                                }
                                onClick={() => goToStudentDetail(student)}
                                title="Lihat Detail"
                              />
                            </Space>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <div className={styles.boardScrollWrapper}>
              {visibleColumns.length === 1 ? (
                <div
                  className={styles.boardColumnsGrid}
                  style={{ gridTemplateColumns: "1fr" }}
                >
                  {visibleColumns.map((column) => (
                    <BoardColumn
                      key={column.key}
                      column={column}
                      students={groupedStudents[column.key]}
                      paginatedStudents={paginatedGroupedStudents[column.key]}
                      currentPage={pageByStatus[column.key]}
                      onPageChange={(page) =>
                        handleColumnPageChange(column.key, page)
                      }
                      onClickStudent={goToStudentDetail}
                      onEditStudent={readOnly ? undefined : openEditModal}
                      onDeleteStudent={readOnly ? undefined : openDeleteModal}
                      isHighlighted={dragOverStatus === column.key}
                      disableInteraction={readOnly || isUpdatingStudent}
                      canDragAndDrop={canDragAndDrop}
                      isExpanded
                      onToggleExpand={() => setStatusFilter("ALL")}
                    />
                  ))}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {/* ── BARIS 1: ALUR HARAPAN MAJU (ON GOING, WAITING VISA, STUDENT DONE) ── */}
                  <div
                    className={styles.boardColumnsGrid}
                    style={{
                      gridTemplateColumns: "repeat(3, minmax(280px, 1fr))",
                      alignItems: "start",
                    }}
                  >
                    {primaryColumns.map((column) => (
                      <BoardColumn
                        key={column.key}
                        column={column}
                        students={groupedStudents[column.key]}
                        paginatedStudents={paginatedGroupedStudents[column.key]}
                        currentPage={pageByStatus[column.key]}
                        onPageChange={(page) =>
                          handleColumnPageChange(column.key, page)
                        }
                        onClickStudent={goToStudentDetail}
                        onEditStudent={readOnly ? undefined : openEditModal}
                        onDeleteStudent={readOnly ? undefined : openDeleteModal}
                        isHighlighted={dragOverStatus === column.key}
                        disableInteraction={readOnly || isUpdatingStudent}
                        canDragAndDrop={canDragAndDrop}
                        isExpanded={false}
                        onToggleExpand={() => setStatusFilter(column.key)}
                        isCollapsible={true}
                        isCollapsed={Boolean(collapsedColumns[column.key])}
                        onToggleCollapse={() => toggleColumnCollapse(column.key)}
                      />
                    ))}
                  </div>

                  {/* ── BARIS 2: POST PONE & CANCEL ── */}
                  <div
                    className={styles.boardColumnsGrid}
                    style={{
                      gridTemplateColumns: "repeat(3, minmax(280px, 1fr))",
                      alignItems: "start",
                    }}
                  >
                    {secondaryColumns.map((column) => (
                      <BoardColumn
                        key={column.key}
                        column={column}
                        students={groupedStudents[column.key]}
                        paginatedStudents={paginatedGroupedStudents[column.key]}
                        currentPage={pageByStatus[column.key]}
                        onPageChange={(page) =>
                          handleColumnPageChange(column.key, page)
                        }
                        onClickStudent={goToStudentDetail}
                        onEditStudent={readOnly ? undefined : openEditModal}
                        onDeleteStudent={readOnly ? undefined : openDeleteModal}
                        isHighlighted={dragOverStatus === column.key}
                        disableInteraction={readOnly || isUpdatingStudent}
                        canDragAndDrop={canDragAndDrop}
                        isExpanded={false}
                        onToggleExpand={() => setStatusFilter(column.key)}
                        isCollapsible={true}
                        isCollapsed={Boolean(collapsedColumns[column.key])}
                        onToggleCollapse={() => toggleColumnCollapse(column.key)}
                      />
                    ))}
                  </div>
                </div>
                )}
              </div>

            <DragOverlay>
              {activeStudent ? (
                <div style={{ width: 340, maxWidth: "92vw" }}>
                  <StudentCardInner student={activeStudent} isDragging />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      <Modal
        open={isStudentModalOpen}
        title={editingStudent ? "Edit Student" : "Add Student"}
        onCancel={closeStudentModal}
        footer={null}
        destroyOnClose={false}
        width={680}
        className={styles.studentModal}
        style={{ maxWidth: "calc(100vw - 24px)", top: 20 }}
      >
        <FormStudentComponent
          selectedStudent={editingStudent}
          stagesData={stagesData}
          loading={updateStudentUserLoading || onCreateLoading}
          deleteLoading={onDeleteLoading}
          onCancel={closeStudentModal}
          onDelete={() => {
            if (editingStudent) {
              openDeleteModal(editingStudent);
            }
          }}
          onSubmit={handleSubmitStudent}
        />
      </Modal>

      <Modal
        open={Boolean(deleteTargetStudent)}
        title="Hapus Student"
        onCancel={closeDeleteModal}
        footer={null}
        destroyOnClose
        width={460}
      >
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <div
            style={{
              borderRadius: 16,
              background: "#fff1f2",
              border: "1px solid #fecdd3",
              padding: 16,
            }}
          >
            <Typography.Text style={{ color: "#9f1239" }}>
              Data student{" "}
              <strong>
                {deleteTargetStudent?.name || deleteTargetStudent?.email || "-"}
              </strong>{" "}
              akan dihapus. Tindakan ini tidak dapat dibatalkan.
            </Typography.Text>
          </div>

          <Flex justify="flex-end" gap={10}>
            <Button onClick={closeDeleteModal}>Batal</Button>
            <Button
              danger
              type="primary"
              icon={<DeleteOutlined />}
              loading={onDeleteLoading}
              onClick={handleConfirmDeleteStudent}
            >
              Ya, Hapus
            </Button>
          </Flex>
        </Space>
      </Modal>
    </div>
  );
}
