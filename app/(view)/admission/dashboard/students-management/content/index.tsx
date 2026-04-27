"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import {
  Button,
  Card,
  Empty,
  Flex,
  Input,
  Pagination,
  Select,
  Space,
  Tag,
  Typography,
} from "antd";
import {
  FilterOutlined,
  HolderOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
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

import ModalStudentComponent from "./ModalStudentComponent";
import {
  useCreateUser,
  useDeleteUser,
  useUpdateStudentStatusUser,
  useUserRoleStudents,
} from "@/app/hooks/use-users";
import { useStagesManagement } from "@/app/hooks/use-stages-management";
import type { UserDataModel, UserPayloadCreateModel } from "@/app/models/user";

const { Text, Title } = Typography;

const PAGE_SIZE = 10;

const filterStyle: CSSProperties = {
  minWidth: 180,
  borderRadius: 999,
};

type StudentBoardStatus = "ONGOING" | "POSTPONE" | "CANCEL";

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
};

const boardConfig: BoardColumnConfig[] = [
  {
    key: "ONGOING",
    title: "On Going",
    color: "#17803d",
    softBg: "linear-gradient(180deg, #f4fff7 0%, #ffffff 32%)",
    borderColor: "#c7efd2",
    accent: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
  },
  {
    key: "POSTPONE",
    title: "Post Pone",
    color: "#b45309",
    softBg: "linear-gradient(180deg, #fff8ec 0%, #ffffff 32%)",
    borderColor: "#f6d6a8",
    accent: "linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)",
  },
  {
    key: "CANCEL",
    title: "Cancel",
    color: "#b42318",
    softBg: "linear-gradient(180deg, #fff4f3 0%, #ffffff 32%)",
    borderColor: "#f5c4bf",
    accent: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
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

  if (!response) {
    return [];
  }

  if (Array.isArray(response.data)) {
    return response.data as UserDataModel[];
  }

  if (Array.isArray(response.result)) {
    return response.result as UserDataModel[];
  }

  if (Array.isArray(response.users)) {
    return response.users as UserDataModel[];
  }

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
  return String(student.stage?.country?.name ?? "").trim();
}

function getVisaName(student: UserDataModel): string {
  return String(student.visa_type ?? "").trim();
}

function getDegreeLabel(student: UserDataModel): string {
  return String(student.degree || student.name_degree || "").trim();
}

function getCampusName(student: UserDataModel): string {
  return String(student.name_campus ?? "").trim();
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

function resolveBoardStatus(value: unknown): StudentBoardStatus {
  const rawStatus = normalizeText(value);

  if (
    rawStatus.includes("cancel") ||
    rawStatus.includes("canceled") ||
    rawStatus.includes("cancelled") ||
    rawStatus.includes("reject") ||
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

  return "ONGOING";
}

function getStudentBoardStatus(student: UserDataModel): StudentBoardStatus {
  return resolveBoardStatus(student.student_status ?? student.status);
}

function getStudentStatusPayload(status: StudentBoardStatus): string {
  switch (status) {
    case "POSTPONE":
      return "POSTPONE";
    case "CANCEL":
      return "CANCEL";
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
    case "POSTPONE":
      return {
        label: "Post Pone",
        color: "#b45309",
        background: "#fff6e8",
        borderColor: "#ffd8a8",
      };
    case "CANCEL":
      return {
        label: "Cancel",
        color: "#b42318",
        background: "#fff1f0",
        borderColor: "#ffccc7",
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
  return value ? value.replace(/_/g, " ").toUpperCase() : "Visa belum dipilih";
}

function getStudentInitials(student: UserDataModel): string {
  const parts = String(student.name ?? "")
    .split(" ")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) {
    return "ST";
  }

  return parts.map((item) => item.charAt(0).toUpperCase()).join("");
}

function buildStudentMetaLine(student: UserDataModel): string {
  const parts = [getCountryName(student), getCampusName(student)].filter(
    Boolean,
  );

  return parts.join(" • ") || "Profil student belum lengkap";
}

function buildStudentSecondaryLine(student: UserDataModel): string {
  const parts = [
    getDegreeLabel(student),
    String(student.no_phone ?? "").trim(),
  ].filter(Boolean);

  return parts.join(" • ") || student.email || "Belum ada detail tambahan";
}

function StudentCardInner({
  student,
  dragListeners,
  dragAttributes,
  isDragging,
}: {
  student: UserDataModel;
  dragListeners?: Record<string, unknown>;
  dragAttributes?: Record<string, unknown>;
  isDragging?: boolean;
}) {
  const status = getStudentBoardStatus(student);
  const statusMeta = getStatusTagMeta(status);

  return (
    <div
      style={{
        width: "100%",
        textAlign: "left",
        border: isDragging ? "1px solid #818cf8" : "1px solid #e7eaf0",
        background: "linear-gradient(180deg, #ffffff 0%, #fbfcff 100%)",
        borderRadius: 20,
        padding: 16,
        boxShadow: isDragging
          ? "0 22px 36px rgba(79, 70, 229, 0.18)"
          : "0 12px 30px rgba(15, 23, 42, 0.06)",
        opacity: isDragging ? 0.95 : 1,
        transition: "all 0.18s ease",
      }}
    >
      <Flex justify="space-between" align="flex-start" gap={14}>
        <Flex gap={12} align="flex-start" style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 16,
              background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
              color: "#fff",
              display: "grid",
              placeItems: "center",
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: 0.4,
              flexShrink: 0,
              boxShadow: "0 12px 24px rgba(79, 70, 229, 0.22)",
            }}
          >
            {getStudentInitials(student)}
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <Flex align="center" gap={8} wrap style={{ marginBottom: 6 }}>
              <Text
                strong
                ellipsis
                style={{
                  fontSize: 15,
                  lineHeight: 1.35,
                  color: "#111827",
                  minWidth: 0,
                  maxWidth: "100%",
                }}
              >
                {student.name || "Nama student belum tersedia"}
              </Text>

              <Tag
                style={{
                  marginRight: 0,
                  borderRadius: 999,
                  padding: "2px 10px",
                  fontSize: 11,
                  fontWeight: 600,
                  color: statusMeta.color,
                  background: statusMeta.background,
                  borderColor: statusMeta.borderColor,
                }}
              >
                {statusMeta.label}
              </Tag>
            </Flex>

            <Text
              style={{
                display: "block",
                color: "#475467",
                fontSize: 13,
                lineHeight: 1.45,
                marginBottom: 4,
              }}
            >
              {buildStudentMetaLine(student)}
            </Text>

            <Text
              type="secondary"
              style={{ display: "block", fontSize: 12, lineHeight: 1.5 }}
            >
              {buildStudentSecondaryLine(student)}
            </Text>
          </div>
        </Flex>

        <Flex vertical align="flex-end" gap={10} style={{ flexShrink: 0 }}>
          <div
            {...dragAttributes}
            {...dragListeners}
            style={{
              width: 34,
              height: 34,
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              color: "#98a2b3",
              display: "grid",
              placeItems: "center",
              fontSize: 15,
              cursor: isDragging ? "grabbing" : "grab",
              touchAction: "none",
              background: "#fff",
            }}
            onClick={(e) => e.stopPropagation()}
            title="Drag handle"
          >
            <HolderOutlined />
          </div>

          <Tag
            style={{
              marginRight: 0,
              borderRadius: 999,
              padding: "6px 12px",
              fontSize: 11,
              fontWeight: 700,
              color: "#3153d4",
              background: "#eef4ff",
              borderColor: "#bfd2ff",
              letterSpacing: 0.3,
            }}
          >
            {formatVisaType(getVisaName(student))}
          </Tag>
        </Flex>
      </Flex>
    </div>
  );
}

function SortableStudentCard({
  student,
  onClick,
  disabled,
}: {
  student: UserDataModel;
  onClick: () => void;
  disabled?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: getStudentId(student),
    disabled,
  });

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        border: "none",
        background: "transparent",
        padding: 0,
        cursor: isDragging ? "grabbing" : "pointer",
        textAlign: "left",
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <StudentCardInner
        student={student}
        dragAttributes={attributes}
        dragListeners={listeners}
        isDragging={isDragging}
      />
    </button>
  );
}

function BoardColumn({
  column,
  students,
  paginatedStudents,
  currentPage,
  pageSize,
  onPageChange,
  onClickStudent,
  isHighlighted,
  disableInteraction,
}: {
  column: BoardColumnConfig;
  students: UserDataModel[];
  paginatedStudents: UserDataModel[];
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onClickStudent: (student: UserDataModel) => void;
  isHighlighted: boolean;
  disableInteraction?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.key,
  });

  const isActive = isHighlighted || isOver;

  const startNumber =
    students.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endNumber = Math.min(currentPage * pageSize, students.length);

  return (
    <div
      ref={setNodeRef}
      style={{
        background: isActive ? column.softBg : "#ffffff",
        height: "clamp(560px, calc(100vh - 360px), 820px)",
        minWidth: 340,
        display: "flex",
        flexDirection: "column",
        transition: "all 0.18s ease",
        border: `1px solid ${isActive ? column.borderColor : "#e8ebf2"}`,
        borderRadius: 28,
        boxShadow: isActive
          ? "0 18px 40px rgba(79, 70, 229, 0.08)"
          : "0 14px 32px rgba(15, 23, 42, 0.04)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: 18,
          borderBottom: "1px solid #edf0f5",
          background: "rgba(255,255,255,0.94)",
          backdropFilter: "blur(8px)",
          position: "sticky",
          top: 0,
          zIndex: 2,
        }}
      >
        <div
          style={{
            height: 6,
            width: 92,
            borderRadius: 999,
            background: column.accent,
            marginBottom: 14,
          }}
        />

        <Flex justify="space-between" align="center" gap={12}>
          <div style={{ minWidth: 0 }}>
            <Text strong style={{ fontSize: 19, color: "#111827" }}>
              {column.title}
            </Text>

            <Text
              style={{
                display: "block",
                marginTop: 4,
                color: "#667085",
                fontSize: 13,
              }}
            >
              {students.length} student{students.length === 1 ? "" : "s"}
            </Text>
          </div>

          <div
            style={{
              minWidth: 42,
              height: 42,
              borderRadius: 14,
              background: column.softBg,
              color: column.color,
              border: `1px solid ${column.borderColor}`,
              display: "grid",
              placeItems: "center",
              fontWeight: 700,
            }}
          >
            {students.length}
          </div>
        </Flex>
      </div>

      <SortableContext
        items={paginatedStudents.map((student) => getStudentId(student))}
        strategy={verticalListSortingStrategy}
      >
        <div
          style={{
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 14,
            flex: 1,
            overflowY: "auto",
            overscrollBehavior: "contain",
          }}
        >
          {students.length === 0 ? (
            <div
              style={{
                borderRadius: 24,
                border: isActive
                  ? `1px dashed ${column.borderColor}`
                  : "1px dashed #e5e7eb",
                minHeight: 220,
                display: "grid",
                placeItems: "center",
                transition: "border-color 0.18s ease",
                background: isActive ? "rgba(255,255,255,0.82)" : "#fbfcfe",
              }}
            >
              <Empty description="Belum ada student" />
            </div>
          ) : (
            paginatedStudents.map((student) => (
              <SortableStudentCard
                key={student.id}
                student={student}
                disabled={disableInteraction}
                onClick={() => onClickStudent(student)}
              />
            ))
          )}
        </div>
      </SortableContext>

      <div
        style={{
          padding: "12px 16px 16px",
          borderTop: "1px solid #edf0f5",
          background: "rgba(255,255,255,0.96)",
        }}
      >
        <Flex align="center" justify="space-between" gap={10} wrap>
          <Text
            type="secondary"
            style={{
              fontSize: 12,
              whiteSpace: "nowrap",
            }}
          >
            {students.length > 0
              ? `${startNumber}-${endNumber} dari ${students.length}`
              : "0 data"}
          </Text>

          <Pagination
            size="small"
            current={currentPage}
            pageSize={pageSize}
            total={students.length}
            onChange={onPageChange}
            showSizeChanger={false}
            hideOnSinglePage
          />
        </Flex>
      </div>
    </div>
  );
}

export default function StudentsManagementContent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<UserDataModel | null>(
    null,
  );
  const [keyword, setKeyword] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<string | undefined>();
  const [selectedVisa, setSelectedVisa] = useState<string | undefined>();
  const [selectedDegree, setSelectedDegree] = useState<string | undefined>();
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] =
    useState<StudentBoardStatus | null>(null);
  const [movingStudentId, setMovingStudentId] = useState<string | null>(null);
  const [studentOverrides, setStudentOverrides] = useState<
    Record<string, Partial<UserDataModel>>
  >({});

  const [pageByStatus, setPageByStatus] = useState<
    Record<StudentBoardStatus, number>
  >({
    ONGOING: 1,
    POSTPONE: 1,
    CANCEL: 1,
  });

  const router = useRouter();

  const { onCreate, onCreateLoading } = useCreateUser();
  const { onDelete, onDeleteLoading } = useDeleteUser();
  const { onUpdate: onUpdateStudentStatus, onUpdateLoading } =
    useUpdateStudentStatusUser();

  const { data: rawStudentsRoleData } = useUserRoleStudents();
  const { data: stagesData } = useStagesManagement({});

  const studentsRoleData = useMemo<UserDataModel[]>(() => {
    return normalizeStudentResponse(rawStudentsRoleData);
  }, [rawStudentsRoleData]);

  const goToStudentDetail = useCallback(
    (student: UserDataModel) => {
      router.push(
        `/admission/dashboard/students-management/detail/${student.id}`,
      );
    },
    [router],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const activeCountryFilter = sanitizeFilterValue(selectedCountry);
  const activeVisaFilter = sanitizeFilterValue(selectedVisa);
  const activeDegreeFilter = sanitizeFilterValue(selectedDegree);
  const activeKeyword = sanitizeFilterValue(keyword);

  const hasActiveFilter = Boolean(
    activeKeyword ||
    activeCountryFilter ||
    activeVisaFilter ||
    activeDegreeFilter,
  );

  const resetPagination = useCallback(() => {
    setPageByStatus({
      ONGOING: 1,
      POSTPONE: 1,
      CANCEL: 1,
    });
  }, []);

  const resetFilters = useCallback(() => {
    setSelectedCountry(undefined);
    setSelectedVisa(undefined);
    setSelectedDegree(undefined);
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
    studentsRoleData.length,
    resetPagination,
  ]);

  useEffect(() => {
    if (!studentsRoleData.length) {
      return;
    }

    setStudentOverrides((prev) => {
      let changed = false;
      const next = { ...prev };

      for (const student of studentsRoleData) {
        const id = getStudentId(student);
        const override = next[id];

        if (!override) {
          continue;
        }

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

  const openCreateModal = useCallback(() => {
    setSelectedStudent(null);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedStudent(null);
  }, []);

  const handleSubmit = useCallback(
    async (values: UserPayloadCreateModel) => {
      await onCreate({
        ...values,
        role: "student",
      });

      closeModal();
      resetPagination();
    },
    [closeModal, onCreate, resetPagination],
  );

  const handleDelete = useCallback(async () => {
    if (!selectedStudent) {
      return;
    }

    await onDelete(selectedStudent.id);
    closeModal();
    resetPagination();
  }, [closeModal, onDelete, resetPagination, selectedStudent]);

  const countryOptions = useMemo<SelectOption[]>(() => {
    const map = new Map<string, SelectOption>();

    studentsRoleData.forEach((student) => {
      const country = getCountryName(student);

      if (country) {
        map.set(country, {
          value: country,
          label: country,
        });
      }
    });

    return Array.from(map.values());
  }, [studentsRoleData]);

  const visaOptions = useMemo<SelectOption[]>(() => {
    const map = new Map<string, SelectOption>();

    studentsRoleData.forEach((student) => {
      const visa = getVisaName(student);

      if (visa) {
        map.set(visa, {
          value: visa,
          label: formatVisaType(visa),
        });
      }
    });

    return Array.from(map.values());
  }, [studentsRoleData]);

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

  const effectiveStudents = useMemo<UserDataModel[]>(() => {
    return studentsRoleData.map((student) =>
      mergeStudentData(student, studentOverrides[getStudentId(student)]),
    );
  }, [studentsRoleData, studentOverrides]);

  const filteredStudents = useMemo<UserDataModel[]>(() => {
    if (!hasActiveFilter) {
      return effectiveStudents;
    }

    return effectiveStudents.filter((student) => {
      const haystack = [
        student.name,
        student.email,
        student.no_phone,
        getCountryName(student),
        getVisaName(student),
        getDegreeLabel(student),
        getCampusName(student),
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
        normalizeText(getVisaName(student)) === normalizeText(activeVisaFilter);

      const matchDegree =
        !activeDegreeFilter ||
        normalizeText(getDegreeLabel(student)) ===
          normalizeText(activeDegreeFilter);

      return matchKeyword && matchCountry && matchVisa && matchDegree;
    });
  }, [
    effectiveStudents,
    hasActiveFilter,
    activeKeyword,
    activeCountryFilter,
    activeVisaFilter,
    activeDegreeFilter,
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
      POSTPONE: [],
      CANCEL: [],
    };

    filteredStudents.forEach((student) => {
      const status = getEffectiveBoardStatus(student);
      grouped[status].push(student);
    });

    return grouped;
  }, [filteredStudents, getEffectiveBoardStatus]);

  const paginatedGroupedStudents = useMemo<
    Record<StudentBoardStatus, UserDataModel[]>
  >(() => {
    return {
      ONGOING: groupedStudents.ONGOING.slice(
        (pageByStatus.ONGOING - 1) * PAGE_SIZE,
        pageByStatus.ONGOING * PAGE_SIZE,
      ),
      POSTPONE: groupedStudents.POSTPONE.slice(
        (pageByStatus.POSTPONE - 1) * PAGE_SIZE,
        pageByStatus.POSTPONE * PAGE_SIZE,
      ),
      CANCEL: groupedStudents.CANCEL.slice(
        (pageByStatus.CANCEL - 1) * PAGE_SIZE,
        pageByStatus.CANCEL * PAGE_SIZE,
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
      if (!overId) {
        return null;
      }

      const candidate = String(overId);

      if (boardConfig.some((column) => column.key === candidate)) {
        return candidate as StudentBoardStatus;
      }

      const overStudent = studentMap.get(candidate);

      return overStudent ? getEffectiveBoardStatus(overStudent) : null;
    },
    [getEffectiveBoardStatus, studentMap],
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveStudentId(String(event.active.id));
  }, []);

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      setDragOverStatus(resolveDropStatus(event.over?.id));
    },
    [resolveDropStatus],
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const draggedId = String(event.active.id);
      const draggedStudent = studentMap.get(draggedId);
      const nextStatus = resolveDropStatus(event.over?.id);

      setActiveStudentId(null);
      setDragOverStatus(null);

      if (!draggedStudent || !nextStatus) {
        return;
      }

      const currentStatus = getEffectiveBoardStatus(draggedStudent);

      if (currentStatus === nextStatus) {
        return;
      }

      setStudentOverrides((prev) => ({
        ...prev,
        [draggedId]: {
          ...prev[draggedId],
          student_status: getStudentStatusPayload(nextStatus),
        },
      }));

      setMovingStudentId(draggedId);

      try {
        const response = await onUpdateStudentStatus({
          id: draggedId,
          student_status: getStudentStatusPayload(nextStatus),
        });

        const updatedStudent = (response?.data?.result ?? response?.data) as
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
      getEffectiveBoardStatus,
      onUpdateStudentStatus,
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

  return (
    <div>
      <Space direction="vertical" size={20} style={{ width: "100%" }}>
        <div
          style={{
            borderRadius: 30,
            padding: 20,
            border: "1px solid #e6eaf2",
            boxShadow: "0 22px 48px rgba(15, 23, 42, 0.06)",
          }}
        >
          <Flex justify="space-between" align="flex-start" gap={18} wrap>
            <div style={{ maxWidth: 620 }}>
              <Title
                level={3}
                style={{ margin: "8px 0 6px", color: "#101828" }}
              >
                Student Pipeline Management
              </Title>

              <Text style={{ color: "#667085", fontSize: 15, lineHeight: 1.7 }}>
                Kelola progres student dengan tampilan board yang lebih jelas.
                Drag and drop antar status akan langsung menyimpan perubahan ke
                sistem.
              </Text>
            </div>

            <Flex gap={12} wrap>
              {boardSummary.map((item) => (
                <div
                  key={item.key}
                  style={{
                    minWidth: 138,
                    borderRadius: 22,
                    padding: 16,
                    background: item.softBg,
                    border: `1px solid ${item.borderColor}`,
                  }}
                >
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {item.title}
                  </Text>

                  <div
                    style={{
                      marginTop: 8,
                      fontSize: 28,
                      lineHeight: 1,
                      fontWeight: 700,
                      color: "#111827",
                    }}
                  >
                    {item.count}
                  </div>
                </div>
              ))}
            </Flex>
          </Flex>

          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              flexWrap: "wrap",
              marginTop: 20,
            }}
          >
            <Input
              allowClear
              size="large"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search student by name, email, phone, campus..."
              prefix={<SearchOutlined style={{ color: "#667085" }} />}
              style={{
                flex: 1,
                minWidth: 260,
                borderRadius: 16,
                height: 54,
                background: "#fff",
              }}
            />

            <Button
              size="large"
              icon={<FilterOutlined />}
              onClick={toggleFilters}
              style={{
                minWidth: 122,
                borderRadius: 16,
                height: 54,
                fontWeight: 600,
                borderColor: showFilters ? "#c7d2fe" : undefined,
                color: showFilters ? "#4338ca" : undefined,
                background: showFilters ? "#eef2ff" : "#fff",
              }}
            >
              Filter
            </Button>

            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={openCreateModal}
              style={{
                minWidth: 170,
                borderRadius: 16,
                height: 54,
                fontWeight: 700,
                background: "linear-gradient(135deg, #5b4de6 0%, #4338ca 100%)",
                boxShadow: "0 14px 26px rgba(79, 70, 229, 0.2)",
              }}
            >
              Add Student
            </Button>
          </div>
        </div>

        {showFilters && (
          <Card
            bodyStyle={{ padding: 18 }}
            style={{
              borderRadius: 24,
              border: "1px solid #e5e7eb",
              boxShadow: "0 12px 30px rgba(15, 23, 42, 0.05)",
              background: "linear-gradient(180deg, #ffffff 0%, #fafbff 100%)",
            }}
          >
            <Space size={12} wrap style={{ width: "100%" }}>
              <Select
                placeholder="Country"
                allowClear
                value={selectedCountry}
                onChange={(value) =>
                  setSelectedCountry(sanitizeFilterValue(value))
                }
                style={filterStyle}
                options={countryOptions}
              />

              <Select
                placeholder="Visa"
                allowClear
                value={selectedVisa}
                onChange={(value) =>
                  setSelectedVisa(sanitizeFilterValue(value))
                }
                style={filterStyle}
                options={visaOptions}
              />

              <Select
                placeholder="Degree"
                allowClear
                value={selectedDegree}
                onChange={(value) =>
                  setSelectedDegree(sanitizeFilterValue(value))
                }
                style={filterStyle}
                options={degreeOptions}
              />

              <Button
                onClick={resetFilters}
                style={{ borderRadius: 999, fontWeight: 600 }}
              >
                Reset Filter
              </Button>
            </Space>
          </Card>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div
            style={{
              width: "100%",
              overflowX: "auto",
              paddingBottom: 8,
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(340px, 1fr))",
                gap: 18,
                alignItems: "stretch",
                minWidth: 1060,
              }}
            >
              {boardConfig.map((column) => (
                <BoardColumn
                  key={column.key}
                  column={column}
                  students={groupedStudents[column.key]}
                  paginatedStudents={paginatedGroupedStudents[column.key]}
                  currentPage={pageByStatus[column.key]}
                  pageSize={PAGE_SIZE}
                  onPageChange={(page) =>
                    handleColumnPageChange(column.key, page)
                  }
                  onClickStudent={goToStudentDetail}
                  isHighlighted={dragOverStatus === column.key}
                  disableInteraction={
                    onUpdateLoading && movingStudentId !== null
                  }
                />
              ))}
            </div>
          </div>

          <DragOverlay>
            {activeStudent ? (
              <div style={{ width: 360, maxWidth: "92vw" }}>
                <StudentCardInner student={activeStudent} isDragging />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </Space>

      <ModalStudentComponent
        open={isModalOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
        onCancel={closeModal}
        loading={onCreateLoading}
        deleteLoading={onDeleteLoading}
        selectedStudent={selectedStudent}
        stagesData={stagesData ?? []}
      />
    </div>
  );
}
