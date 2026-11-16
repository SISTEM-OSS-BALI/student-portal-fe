"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import {
  Button,
  Empty,
  Flex,
  Input,
  Modal,
  Select,
  Space,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  ArrowDownOutlined,
  ArrowLeftOutlined,
  ArrowUpOutlined,
  CheckOutlined,
  DeleteOutlined,
  EditOutlined,
  HolderOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import api from "@/lib/api";
import {
  cleanHelpText,
  cleanQuestionLabel,
} from "@/app/utils/placeholder-sanitizer";

import { useQuestion, useQuestions } from "@/app/hooks/use-questions";
import { useQuestionBase } from "@/app/hooks/use-question-bases";
import type {
  QuestionDataModel,
  QuestionPayloadCreateModel,
  QuestionPayloadUpdateModel,
} from "@/app/models/question";
import FormQuestionManagement from "./FormQuestionComponent";
import SplitMasterDetailLayout, {
  splitMasterDetailStyles,
} from "@/app/components/common/split-master-detail";
import styles from "./questions.module.css";

const { Title, Text } = Typography;

const cleanSlashText = (val?: string | null): string => {
  if (!val) return "";
  return val
    .replace(/student\/client/gi, "student")
    .replace(/Next of kin\/parents/gi, "Next of Kin");
};

const INPUT_TYPE_COLORS: Record<string, string> = {
  TEXT: "blue",
  TEXTAREA: "cyan",
  NUMBER: "purple",
  EMAIL: "geekblue",
  PHONE: "magenta",
  DATE: "orange",
  SELECT: "green",
  RADIO: "lime",
  CHECKBOX: "gold",
  FILE: "volcano",
};

interface QuestionCardInnerProps {
  item: QuestionDataModel;
  index: number;
  isSelected: boolean;
  typeColor: string;
  isReorderMode: boolean;
  isMoving?: boolean;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  isDragging?: boolean;
  dragAttributes?: ReturnType<typeof useSortable>["attributes"];
  dragListeners?: ReturnType<typeof useSortable>["listeners"];
  onMove?: (
    item: QuestionDataModel,
    direction: "up" | "down",
    e: React.MouseEvent,
  ) => void;
  onDelete?: (item: QuestionDataModel, e: React.MouseEvent) => void;
}

function QuestionCardInner({
  item,
  index,
  isSelected,
  typeColor,
  isReorderMode,
  isMoving,
  canMoveUp,
  canMoveDown,
  isDragging,
  dragAttributes,
  dragListeners,
  onMove,
  onDelete,
}: QuestionCardInnerProps) {
  return (
    <div
      className={`${styles.questionCardItem} ${
        isSelected ? styles.questionCardItemActive : ""
      }`}
      style={{
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {isSelected && <div className={styles.activeIndicator} />}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 8,
            minWidth: 0,
            flex: 1,
          }}
        >
          {/* Tombol Drag Handle 6 titik hanya muncul saat mode atur urutan aktif */}
          {isReorderMode && (
            <button
              type="button"
              {...dragAttributes}
              {...dragListeners}
              style={{
                width: 26,
                height: 26,
                borderRadius: 6,
                border: "1px solid #cbd5e1",
                color: "#64748b",
                display: "grid",
                placeItems: "center",
                fontSize: 12,
                cursor: isDragging ? "grabbing" : "grab",
                touchAction: "none",
                background: "#ffffff",
                flexShrink: 0,
                padding: 0,
                marginTop: 1,
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              }}
              title="Tarik untuk memindahkan urutan pertanyaan"
            >
              <HolderOutlined />
            </button>
          )}

          <span
            className={`${styles.orderBadge} ${
              isSelected ? styles.orderBadgeActive : ""
            }`}
          >
            #{item.order ?? index + 1}
          </span>

          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: 14,
                color: isSelected ? "#1d4ed8" : "#0f172a",
                marginBottom: 2,
                wordBreak: "break-word",
              }}
            >
              {cleanQuestionLabel(item.text)}
            </div>
          </div>
        </div>

        <Space size={4} style={{ flexShrink: 0 }}>
          {isReorderMode ? (
            <>
              {onMove && (
                <>
                  <Tooltip title="Geser Urutan Naik">
                    <Button
                      type="text"
                      size="small"
                      icon={<ArrowUpOutlined style={{ fontSize: 11 }} />}
                      disabled={!canMoveUp || isMoving}
                      onClick={(e) => {
                        e.stopPropagation();
                        onMove(item, "up", e);
                      }}
                      style={{
                        borderRadius: 6,
                        height: 28,
                        width: 26,
                        padding: 0,
                      }}
                    />
                  </Tooltip>
                  <Tooltip title="Geser Urutan Turun">
                    <Button
                      type="text"
                      size="small"
                      icon={<ArrowDownOutlined style={{ fontSize: 11 }} />}
                      disabled={!canMoveDown || isMoving}
                      onClick={(e) => {
                        e.stopPropagation();
                        onMove(item, "down", e);
                      }}
                      style={{
                        borderRadius: 6,
                        height: 28,
                        width: 26,
                        padding: 0,
                      }}
                    />
                  </Tooltip>
                </>
              )}
            </>
          ) : (
            onDelete && (
              <Button
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined style={{ fontSize: 12.5 }} />}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item, e);
                }}
                title="Hapus"
                style={{ borderRadius: 7, height: 28, width: 28 }}
              />
            )
          )}
        </Space>
      </div>

      {item.help_text ? (
        <div
          style={{
            fontSize: 12,
            color: "#64748b",
            lineHeight: 1.45,
            marginTop: 4,
            marginBottom: 6,
            wordBreak: "break-word",
            whiteSpace: "normal",
            width: "100%",
          }}
        >
          {cleanHelpText(item.help_text)}
        </div>
      ) : null}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginTop: item.help_text ? 4 : 8,
          flexWrap: "wrap",
        }}
      >
        <Tag
          color={typeColor}
          style={{
            borderRadius: 6,
            fontWeight: 600,
            fontSize: 11,
            margin: 0,
          }}
        >
          {item.input_type}
        </Tag>

        {item.required ? (
          <Tag
            color="red"
            style={{
              borderRadius: 6,
              fontWeight: 600,
              fontSize: 11,
              margin: 0,
            }}
          >
            Required
          </Tag>
        ) : (
          <Tag
            style={{
              borderRadius: 6,
              fontSize: 11,
              margin: 0,
            }}
          >
            Optional
          </Tag>
        )}

        {item.options?.length ? (
          <Tag
            color="purple"
            style={{
              borderRadius: 6,
              fontSize: 11,
              margin: 0,
            }}
          >
            {item.options.length} Options
          </Tag>
        ) : null}

        {!item.active && (
          <Tag
            color="default"
            style={{
              borderRadius: 6,
              fontSize: 11,
              margin: 0,
            }}
          >
            Inactive
          </Tag>
        )}
      </div>
    </div>
  );
}

interface SortableQuestionCardProps {
  item: QuestionDataModel;
  index: number;
  isSelected: boolean;
  typeColor: string;
  isMoving: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  isReorderMode: boolean;
  onSelect: (item: QuestionDataModel) => void;
  onMove: (
    item: QuestionDataModel,
    direction: "up" | "down",
    e: React.MouseEvent,
  ) => void;
  onDelete: (item: QuestionDataModel, e: React.MouseEvent) => void;
}

function SortableQuestionCard({
  item,
  index,
  isSelected,
  typeColor,
  isMoving,
  canMoveUp,
  canMoveDown,
  isReorderMode,
  onSelect,
  onMove,
  onDelete,
}: SortableQuestionCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: String(item.id),
    disabled: !isReorderMode,
  });

  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    position: "relative",
    zIndex: isDragging ? 99 : "auto",
    cursor: isReorderMode ? "default" : "pointer",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => {
        if (!isReorderMode) {
          onSelect(item);
        }
      }}
    >
      <QuestionCardInner
        item={item}
        index={index}
        isSelected={isSelected}
        typeColor={typeColor}
        isReorderMode={isReorderMode}
        isMoving={isMoving}
        canMoveUp={canMoveUp}
        canMoveDown={canMoveDown}
        isDragging={isDragging}
        dragAttributes={attributes}
        dragListeners={listeners}
        onMove={onMove}
        onDelete={onDelete}
      />
    </div>
  );
}

export default function DetailQuestionComponent() {
  const [searchValue, setSearchValue] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [requiredFilter, setRequiredFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("order_asc");
  const params = useParams();
  const router = useRouter();
  const base_id = Array.isArray(params?.id) ? params?.id[0] : params?.id;
  const [editingQuestion, setEditingQuestion] =
    useState<QuestionDataModel | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [localQuestions, setLocalQuestions] = useState<QuestionDataModel[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<QuestionDataModel | null>(
    null,
  );

  const { data: baseDetail } = useQuestionBase({
    id: base_id ? String(base_id) : "",
  });

  const {
    data: questions = [],
    onCreate: onCreateQuestion,
    onCreateLoading,
    fetchLoading,
    onDelete: onDeleteQuestion,
    onDeleteLoading: onDeleteQuestionLoading,
  } = useQuestions({
    queryString: base_id ? `base_id=${base_id}` : undefined,
  });

  const { onUpdate: onUpdateQuestion, onUpdateLoading } = useQuestion({
    id: editingQuestion?.id ?? "",
  });

  const formLoading = editingQuestion ? onUpdateLoading : onCreateLoading;

  const isFiltered =
    Boolean(searchValue.trim()) ||
    typeFilter !== "all" ||
    requiredFilter !== "all" ||
    sortBy !== "order_asc";

  const handleResetFilters = () => {
    setSearchValue("");
    setTypeFilter("all");
    setRequiredFilter("all");
    setSortBy("order_asc");
  };

  const filteredQuestions = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    const items = questions ?? [];

    return items
      .filter((item) => {
        const matchSearch =
          !query ||
          [
            item.text,
            cleanQuestionLabel(item.text),
            item.help_text ?? "",
            cleanHelpText(item.help_text ?? ""),
            item.input_type,
          ].some((text) =>
            String(text).toLowerCase().includes(query),
          );

        const matchType =
          typeFilter === "all" ||
          item.input_type?.toUpperCase() === typeFilter.toUpperCase();

        const matchRequired =
          requiredFilter === "all" ||
          (requiredFilter === "required" && Boolean(item.required)) ||
          (requiredFilter === "optional" && !item.required);

        return matchSearch && matchType && matchRequired;
      })
      .sort((a, b) => {
        if (sortBy === "order_asc") {
          return (a.order ?? 0) - (b.order ?? 0);
        }
        if (sortBy === "order_desc") {
          return (b.order ?? 0) - (a.order ?? 0);
        }
        if (sortBy === "text_asc") {
          return a.text.localeCompare(b.text, "id");
        }
        if (sortBy === "text_desc") {
          return b.text.localeCompare(a.text, "id");
        }
        if (sortBy === "required_first") {
          if (a.required === b.required) {
            return (a.order ?? 0) - (b.order ?? 0);
          }
          return a.required ? -1 : 1;
        }
        if (sortBy === "type_asc") {
          const typeDiff = (a.input_type || "").localeCompare(b.input_type || "", "id");
          if (typeDiff !== 0) return typeDiff;
          return (a.order ?? 0) - (b.order ?? 0);
        }
        return 0;
      });
  }, [questions, searchValue, typeFilter, requiredFilter, sortBy]);

  // Sinkronkan data tampilan pertanyaan lokal dengan data hasil filter
  useEffect(() => {
    setLocalQuestions(filteredQuestions);
  }, [filteredQuestions]);

  const activeQuestion = useMemo(() => {
    if (!activeQuestionId) return null;
    return (
      localQuestions.find((q) => String(q.id) === activeQuestionId) ?? null
    );
  }, [activeQuestionId, localQuestions]);

  const handleSelectNew = () => {
    setEditingQuestion(null);
  };

  const handleSelectQuestion = (item: QuestionDataModel) => {
    setEditingQuestion(item);
  };

  const handleOpenDeleteModal = (
    item: QuestionDataModel,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    setDeleteTarget(item);
    setIsDeleteModalOpen(true);
  };

  const handleExecuteDelete = async () => {
    if (!deleteTarget) return;
    try {
      await onDeleteQuestion(deleteTarget.id);
      if (editingQuestion?.id === deleteTarget.id) {
        setEditingQuestion(null);
      }
      setIsDeleteModalOpen(false);
      setDeleteTarget(null);
    } catch {
      // Handled by notification hook
    }
  };

  const queryClient = useQueryClient();
  const [movingId, setMovingId] = useState<string | null>(null);

  const handleMoveQuestion = async (
    item: QuestionDataModel,
    direction: "up" | "down",
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    const sorted = [...localQuestions].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0),
    );
    const idx = sorted.findIndex((q) => q.id === item.id);
    if (idx === -1) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sorted.length) return;

    const reordered = arrayMove(sorted, idx, targetIdx).map((q, i) => ({
      ...q,
      order: i + 1,
    }));

    // Pembaruan instan pada state lokal agar tampilan langsung bergeser mulus
    setLocalQuestions(reordered);

    // Pembaruan optimistik pada TanStack Query cache
    queryClient.setQueriesData({ queryKey: ["questions"] }, (old: unknown) => {
      if (!Array.isArray(old)) return old;
      const idToOrder = new Map(reordered.map((q) => [String(q.id), q.order]));
      return old
        .map((q: QuestionDataModel) => {
          const nextOrder = idToOrder.get(String(q.id));
          return nextOrder !== undefined ? { ...q, order: nextOrder } : q;
        })
        .sort(
          (a: QuestionDataModel, b: QuestionDataModel) =>
            (a.order ?? 0) - (b.order ?? 0),
        );
    });

    const currentItem = sorted[idx];
    const targetItem = sorted[targetIdx];
    const finalCurrentOrder = targetIdx + 1;
    const finalTargetOrder = idx + 1;

    setMovingId(String(item.id));
    try {
      await Promise.all([
        api.put(`/api/questions/${currentItem.id}`, {
          order: finalCurrentOrder,
        }),
        api.put(`/api/questions/${targetItem.id}`, { order: finalTargetOrder }),
      ]);
    } catch {
      // Handled
    } finally {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      setMovingId(null);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveQuestionId(String(event.active.id));
  };

  const handleDragCancel = () => {
    setActiveQuestionId(null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveQuestionId(null);
    if (!over || active.id === over.id) return;

    const oldIndex = localQuestions.findIndex(
      (q) => String(q.id) === String(active.id),
    );
    const newIndex = localQuestions.findIndex(
      (q) => String(q.id) === String(over.id),
    );

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(localQuestions, oldIndex, newIndex).map(
      (item, idx) => ({
        ...item,
        order: idx + 1,
      }),
    );

    // 1. Pembaruan state lokal secara langsung (reaktif dan tidak mental balik)
    setLocalQuestions(reordered);

    // 2. Pembaruan optimistik pada TanStack Query cache
    queryClient.setQueriesData({ queryKey: ["questions"] }, (old: unknown) => {
      if (!Array.isArray(old)) return old;
      const idToOrder = new Map(reordered.map((q) => [String(q.id), q.order]));
      return old
        .map((q: QuestionDataModel) => {
          const nextOrder = idToOrder.get(String(q.id));
          return nextOrder !== undefined ? { ...q, order: nextOrder } : q;
        })
        .sort(
          (a: QuestionDataModel, b: QuestionDataModel) =>
            (a.order ?? 0) - (b.order ?? 0),
        );
    });

    // 3. Simpan pembaruan nomor urut ke database
    const updates = reordered.map((question) =>
      api.put(`/api/questions/${question.id}`, { order: question.order }),
    );

    try {
      await Promise.all(updates);
    } catch {
      // Handled
    } finally {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    }
  };

  const handleSubmit = async (data: QuestionPayloadCreateModel) => {
    const resolvedBaseId =
      data.base_id ?? (base_id ? String(base_id) : undefined);
    const targetOrder = Number(data.order ?? 1);

    const currentQuestions = [...(questions ?? [])].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0),
    );

    if (editingQuestion) {
      // Periksa apakah nomor urutan bertabrakan dengan pertanyaan lain
      const otherQuestions = currentQuestions.filter(
        (q) => String(q.id) !== String(editingQuestion.id),
      );
      const isCollision = otherQuestions.some(
        (q) => Number(q.order) === targetOrder,
      );

      if (isCollision) {
        // Otomatis geser pertanyaan yang posisinya bersinggungan agar tetap terurut
        const shiftUpdates: Promise<unknown>[] = [];
        otherQuestions.forEach((q) => {
          if ((q.order ?? 0) >= targetOrder) {
            shiftUpdates.push(
              api.put(`/api/questions/${q.id}`, { order: (q.order ?? 0) + 1 }),
            );
          }
        });
        if (shiftUpdates.length > 0) {
          await Promise.all(shiftUpdates);
        }
      }

      const payload: QuestionPayloadUpdateModel = {
        ...data,
        order: targetOrder,
        base_id: resolvedBaseId,
      };
      const res = await onUpdateQuestion({ id: editingQuestion.id, payload });
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      return res;
    }

    // Untuk pertanyaan baru:
    const isCollision = currentQuestions.some(
      (q) => Number(q.order) === targetOrder,
    );
    if (isCollision) {
      const shiftUpdates: Promise<unknown>[] = [];
      currentQuestions.forEach((q) => {
        if ((q.order ?? 0) >= targetOrder) {
          shiftUpdates.push(
            api.put(`/api/questions/${q.id}`, { order: (q.order ?? 0) + 1 }),
          );
        }
      });
      if (shiftUpdates.length > 0) {
        await Promise.all(shiftUpdates);
      }
    }

    if (!resolvedBaseId) {
      throw new Error("base_id is required");
    }
    const payload: QuestionPayloadCreateModel = {
      ...data,
      order: targetOrder,
      base_id: resolvedBaseId,
    };
    const res = await onCreateQuestion(payload);
    queryClient.invalidateQueries({ queryKey: ["questions"] });
    return res;
  };

  const handleSaved = (saved?: QuestionDataModel) => {
    if (saved) {
      setEditingQuestion(saved);
    }
  };

  return (
    <>
      <SplitMasterDetailLayout
        pageTitle={
          baseDetail?.name
            ? `Form ${cleanSlashText(baseDetail.name)}`
            : "Kelola Pertanyaan"
        }
        pageSubtitle={
          baseDetail?.type_country
            ? `Formulir ${baseDetail.type_country}`
            : "Atur pertanyaan formulir"
        }
        headerExtra={
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() =>
              router.push(
                "/admission/dashboard/master-data/questions-management",
              )
            }
            className={styles.backBtn}
            title="Kembali ke Daftar Question Base"
          >
            <span className={styles.backBtnText}>Kembali</span>
          </Button>
        }
        onAddNew={handleSelectNew}
        addNewText="Tambah"
        listTitle="Daftar Pertanyaan"
        listCount={filteredQuestions.length}
        listExtra={
          <Button
            type="primary"
            icon={isReordering ? <CheckOutlined /> : <EditOutlined />}
            onClick={() => setIsReordering((prev) => !prev)}
            style={{
              background: "#1b3d6d",
              borderColor: "#1b3d6d",
              color: "#ffffff",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 12.5,
              height: 32,
              boxShadow: "0 1px 2px rgba(27, 61, 109, 0.15)",
            }}
          >
            {isReordering ? "Selesai" : "Edit"}
          </Button>
        }
        listFilter={
          <div className={splitMasterDetailStyles.filterRow}>
            <Input
              className={splitMasterDetailStyles.filterSearchFull}
              style={{ borderRadius: 8 }}
              placeholder="Cari teks pertanyaan atau teks bantuan..."
              prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              allowClear
            />

            <Select
              value={typeFilter}
              onChange={setTypeFilter}
              className={splitMasterDetailStyles.filterItem}
              options={[
                { value: "all", label: "Semua Tipe" },
                { value: "TEXT", label: "Text" },
                { value: "TEXTAREA", label: "Textarea" },
                { value: "NUMBER", label: "Number" },
                { value: "EMAIL", label: "Email" },
                { value: "PHONE", label: "Phone" },
                { value: "SELECT", label: "Select" },
                { value: "RADIO", label: "Radio" },
                { value: "CHECKBOX", label: "Checkbox" },
                { value: "FILE", label: "File" },
                { value: "DATE", label: "Date" },
              ]}
            />

            <Select
              value={requiredFilter}
              onChange={setRequiredFilter}
              className={splitMasterDetailStyles.filterItem}
              options={[
                { value: "all", label: "Semua Sifat" },
                { value: "required", label: "Wajib" },
                { value: "optional", label: "Opsional" },
              ]}
            />

            <Select
              value={sortBy}
              onChange={setSortBy}
              className={splitMasterDetailStyles.filterItem}
              options={[
                { value: "order_asc", label: "Urutan Nomor 1 - Akhir" },
                { value: "order_desc", label: "Urutan Terbalik" },
                { value: "text_asc", label: "Pertanyaan A - Z" },
                { value: "text_desc", label: "Pertanyaan Z - A" },
                { value: "required_first", label: "Wajib Dahulu" },
                { value: "type_asc", label: "Tipe Input" },
              ]}
            />

            {isFiltered && (
              <Button
                onClick={handleResetFilters}
                style={{ borderRadius: 10 }}
              >
                Reset
              </Button>
            )}
          </div>
        }
        listContent={
          fetchLoading ? (
            <div
              style={{ padding: 32, textAlign: "center", color: "#64748b" }}
            >
              Memuat daftar pertanyaan...
            </div>
          ) : filteredQuestions.length === 0 ? (
            <Empty description="Belum ada pertanyaan yang terdaftar." />
          ) : (
            <div>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
              >
                <SortableContext
                  items={localQuestions.map((q) => String(q.id))}
                  strategy={verticalListSortingStrategy}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    {localQuestions.map((item, index) => {
                      const isSelected = editingQuestion?.id === item.id;
                      const typeColor =
                        INPUT_TYPE_COLORS[item.input_type?.toUpperCase()] ||
                        "default";

                      return (
                        <SortableQuestionCard
                          key={item.id}
                          item={item}
                          index={index}
                          isSelected={isSelected}
                          typeColor={typeColor}
                          isMoving={movingId === String(item.id)}
                          canMoveUp={index > 0}
                          canMoveDown={index < localQuestions.length - 1}
                          isReorderMode={isReordering}
                          onSelect={handleSelectQuestion}
                          onMove={(q, dir, e) =>
                            void handleMoveQuestion(q, dir, e)
                          }
                          onDelete={handleOpenDeleteModal}
                        />
                      );
                    })}
                  </div>
                </SortableContext>

                <DragOverlay>
                  {activeQuestion ? (
                    <div
                      style={{
                        boxShadow: "0 12px 28px rgba(0, 0, 0, 0.16)",
                        borderRadius: 10,
                        background: "#ffffff",
                        cursor: "grabbing",
                      }}
                    >
                      <QuestionCardInner
                        item={activeQuestion}
                        index={localQuestions.findIndex(
                          (q) => q.id === activeQuestion.id,
                        )}
                        isSelected={editingQuestion?.id === activeQuestion.id}
                        typeColor={
                          INPUT_TYPE_COLORS[
                            activeQuestion.input_type?.toUpperCase()
                          ] || "default"
                        }
                        isReorderMode={true}
                        isDragging={true}
                      />
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            </div>
          )
        }
        formTitle={
          editingQuestion
            ? `Edit Question #${editingQuestion.order}`
            : "Add New Question"
        }
        formSubtitle={
          editingQuestion
            ? "Perbarui teks pertanyaan, tipe input, petunjuk pengisian, atau opsi jawaban."
            : "Konfigurasikan pertanyaan formulir baru yang akan diajukan kepada siswa."
        }
        formTag={
          editingQuestion ? (
            <Tag color="blue" style={{ borderRadius: 999, fontWeight: 600 }}>
              {editingQuestion.input_type}
            </Tag>
          ) : undefined
        }
        isEditing={Boolean(editingQuestion)}
        onCancelEdit={handleSelectNew}
        formContent={
          <FormQuestionManagement
            key={editingQuestion?.id ?? "new-question-form"}
            onSubmit={handleSubmit}
            onSaved={handleSaved}
            onCancel={handleSelectNew}
            base_id={base_id ? String(base_id) : undefined}
            questionId={editingQuestion?.id}
            initialOptions={editingQuestion?.options}
            initialValues={
              editingQuestion
                ? {
                    base_id: editingQuestion.base_id,
                    text: editingQuestion.text,
                    input_type: editingQuestion.input_type,
                    required: editingQuestion.required,
                    order: editingQuestion.order,
                    help_text: editingQuestion.help_text ?? undefined,
                    placeholder: editingQuestion.placeholder ?? undefined,
                    min_length: editingQuestion.min_length ?? undefined,
                    max_length: editingQuestion.max_length ?? undefined,
                    active: editingQuestion.active,
                    options: editingQuestion.options,
                  }
                : {
                    base_id: base_id ? String(base_id) : undefined,
                    required: true,
                    active: true,
                    order: (questions.length || 0) + 1,
                  }
            }
            submitLabel={
              editingQuestion ? "Save Changes" : "Save Question"
            }
            loading={formLoading}
          />
        }
      />

      {/* Modal Konfirmasi Hapus Pertanyaan */}
      <Modal
        open={isDeleteModalOpen}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setDeleteTarget(null);
        }}
        footer={null}
        width={420}
        centered
        destroyOnClose
      >
        <div style={{ textAlign: "center", padding: "12px 8px" }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "#fee2e2",
              color: "#dc2626",
              display: "grid",
              placeItems: "center",
              fontSize: 24,
              margin: "0 auto 16px",
            }}
          >
            <DeleteOutlined />
          </div>

          <Title level={4} style={{ margin: "0 0 8px", color: "#0f172a" }}>
            Arsipkan Pertanyaan?
          </Title>
          <Text
            type="secondary"
            style={{ display: "block", marginBottom: 24, fontSize: 13.5 }}
          >
            Apakah Anda yakin ingin mengarsipkan pertanyaan{" "}
            <b>&quot;{deleteTarget?.text}&quot;</b>?
          </Text>

          <Flex gap={12}>
            <Button
              block
              style={{ borderRadius: 10, height: 40 }}
              onClick={() => {
                setIsDeleteModalOpen(false);
                setDeleteTarget(null);
              }}
            >
              Batal
            </Button>
            <Button
              block
              danger
              type="primary"
              style={{ borderRadius: 10, height: 40, fontWeight: 600 }}
              loading={onDeleteQuestionLoading}
              onClick={handleExecuteDelete}
            >
              Ya, Arsipkan
            </Button>
          </Flex>
        </div>
      </Modal>
    </>
  );
}
