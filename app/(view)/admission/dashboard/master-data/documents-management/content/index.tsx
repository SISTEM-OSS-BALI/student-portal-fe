"use client";

import { useMemo, useState } from "react";
import {
  Button,
  Empty,
  Flex,
  Input,
  Modal,
  Select,
  Space,
  Tag,
  Typography,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  SearchOutlined,
} from "@ant-design/icons";

import FormDocumentComponent from "./FormDocumentComponent";
import {
  useDocument,
  useDocuments,
} from "@/app/hooks/use-documents-management";
import type {
  DocumentDataModel,
  DocumentPayloadCreateModel,
} from "@/app/models/documents-management";
import SplitMasterDetailLayout, {
  splitMasterDetailStyles,
} from "@/app/components/common/split-master-detail";
import styles from "./documents.module.css";

const { Title, Text } = Typography;

const categoryDisplayMap: Record<string, string> = {
  identity: "Identity",
  academic: "Academic",
  finance: "Finance",
  other: "Supporting",
  Pribadi: "Identity",
  Edukasi: "Academic",
  Finansial: "Finance",
  Lainnya: "Supporting",
  AKADEMIK: "Academic",
  IDENTITAS: "Identity",
  KEUANGAN: "Finance",
};

const fileTypeDisplayMap: Record<string, string> = {
  pdf: "PDF",
  PDF: "PDF",
  image: "JPG, PNG",
  IMAGE: "JPG, PNG",
  "pdf-image": "PDF, JPG",
  "pdf_image": "PDF, JPG",
};

export default function DocumentsManagementContent() {
  const [selectedDocument, setSelectedDocument] =
    useState<DocumentDataModel | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DocumentDataModel | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [requirementFilter, setRequirementFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("label_asc");

  const {
    data: documents = [],
    fetchLoading,
    onCreate: onCreateDocument,
    onCreateLoading: onCreateDocumentLoading,
    onDelete: onDeleteDocument,
    onDeleteLoading: onDeleteDocumentLoading,
  } = useDocuments({});

  const {
    data: selectedDocumentDetail,
    onUpdate: onUpdateDocument,
    onUpdateLoading: onUpdateDocumentLoading,
  } = useDocument({ id: selectedDocument?.id ?? "" });

  const formLoading = selectedDocument
    ? onUpdateDocumentLoading
    : onCreateDocumentLoading;

  const handleSelectNew = () => {
    setSelectedDocument(null);
  };

  const handleSelectDoc = (doc: DocumentDataModel) => {
    setSelectedDocument(doc);
  };

  const handleOpenDeleteModal = (doc: DocumentDataModel, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteTarget(doc);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = async (data: DocumentPayloadCreateModel) => {
    if (selectedDocument) {
      try {
        await onUpdateDocument({ id: selectedDocument.id, payload: data });
      } catch {
        // Handled by notification hook
      }
      return;
    }

    try {
      await onCreateDocument(data);
      setSelectedDocument(null);
    } catch {
      // Handled by notification hook
    }
  };

  const handleExecuteDelete = async () => {
    if (!deleteTarget) return;
    try {
      await onDeleteDocument(deleteTarget.id);
      if (selectedDocument?.id === deleteTarget.id) {
        setSelectedDocument(null);
      }
      setIsDeleteModalOpen(false);
      setDeleteTarget(null);
    } catch {
      // Handled by notification hook
    }
  };

  const existingCodes = useMemo(() => {
    return documents
      .map((d) => String(d.internal_code || "").trim().toUpperCase())
      .filter(Boolean);
  }, [documents]);

  const isFiltered =
    Boolean(searchQuery.trim()) ||
    categoryFilter !== "all" ||
    requirementFilter !== "all" ||
    sortBy !== "label_asc";

  const handleResetFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setRequirementFilter("all");
    setSortBy("label_asc");
  };

  const filteredDocuments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return documents
      .filter((doc) => {
        const matchSearch =
          !query ||
          doc.label.toLowerCase().includes(query) ||
          doc.internal_code?.toLowerCase().includes(query) ||
          (doc.notes && doc.notes.toLowerCase().includes(query));

        const matchCategory =
          categoryFilter === "all" || doc.category === categoryFilter;

        const matchRequirement =
          requirementFilter === "all" ||
          (requirementFilter === "required" && Boolean(doc.required)) ||
          (requirementFilter === "optional" && !doc.required);

        return matchSearch && matchCategory && matchRequirement;
      })
      .sort((a, b) => {
        if (sortBy === "label_asc") {
          return a.label.localeCompare(b.label, "id");
        }
        if (sortBy === "label_desc") {
          return b.label.localeCompare(a.label, "id");
        }
        if (sortBy === "code_asc") {
          return (a.internal_code || "").localeCompare(b.internal_code || "", "id");
        }
        if (sortBy === "required_first") {
          if (a.required === b.required) {
            return a.label.localeCompare(b.label, "id");
          }
          return a.required ? -1 : 1;
        }
        if (sortBy === "optional_first") {
          if (a.required === b.required) {
            return a.label.localeCompare(b.label, "id");
          }
          return a.required ? 1 : -1;
        }
        if (sortBy === "category") {
          const catDiff = (a.category || "").localeCompare(b.category || "", "id");
          if (catDiff !== 0) return catDiff;
          return a.label.localeCompare(b.label, "id");
        }
        return 0;
      });
  }, [documents, searchQuery, categoryFilter, requirementFilter, sortBy]);

  return (
    <>
      <SplitMasterDetailLayout
        pageTitle="Document Management"
        pageSubtitle="Standardization of admission document requirements"
        pageIcon={<FileTextOutlined />}
        onAddNew={handleSelectNew}
        addNewText="Add Document"
        listTitle="Document List"
        listCount={filteredDocuments.length}
        listFilter={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", width: "100%" }}>
            <Input
              style={{ flex: 1, minWidth: 180, height: 34, borderRadius: 8, borderColor: "#e2e8f0", fontSize: 12.5 }}
              placeholder="Search by name, code, or notes..."
              prefix={<SearchOutlined style={{ color: "#94a3b8", fontSize: 13 }} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
            />

            <Select
              value={categoryFilter}
              onChange={setCategoryFilter}
              style={{ minWidth: 125, height: 34, fontSize: 12.5 }}
              options={[
                { value: "all", label: "All Categories" },
                { value: "identity", label: "Identity" },
                { value: "academic", label: "Academic" },
                { value: "finance", label: "Finance" },
                { value: "other", label: "Supporting" },
              ]}
            />

            <Select
              value={requirementFilter}
              onChange={setRequirementFilter}
              style={{ minWidth: 115, height: 34, fontSize: 12.5 }}
              options={[
                { value: "all", label: "All Status" },
                { value: "required", label: "Required" },
                { value: "optional", label: "Optional" },
              ]}
            />

            <Select
              value={sortBy}
              onChange={setSortBy}
              style={{ minWidth: 150, height: 34, fontSize: 12.5 }}
              options={[
                { value: "label_asc", label: "Name A - Z" },
                { value: "label_desc", label: "Name Z - A" },
                { value: "required_first", label: "Required First" },
                { value: "optional_first", label: "Optional First" },
                { value: "category", label: "Category" },
                { value: "code_asc", label: "Code A - Z" },
              ]}
            />

            {isFiltered && (
              <Button
                onClick={handleResetFilters}
                style={{ height: 34, borderRadius: 8, fontWeight: 600, fontSize: 12 }}
              >
                Reset
              </Button>
            )}
          </div>
        }
        listContent={
          fetchLoading ? (
            <div style={{ padding: 32, textAlign: "center", color: "#64748b" }}>
              Loading documents...
            </div>
          ) : filteredDocuments.length === 0 ? (
            <Empty description="No documents match your search criteria." />
          ) : (
            filteredDocuments.map((doc) => {
              const isSelected = selectedDocument?.id === doc.id;

              return (
                <div
                  key={doc.id}
                  className={`${styles.docCardItem} ${
                    isSelected ? styles.docCardItemActive : ""
                  }`}
                >
                  {isSelected && <div className={styles.activeIndicator} />}

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: isSelected ? "#1d4ed8" : "#0f172a", marginBottom: 2 }}>
                        {doc.label}
                      </div>
                      <span className={styles.codeChip}>
                        {doc.internal_code || "-"}
                      </span>
                      {doc.notes && (
                        <div
                          style={{
                            fontSize: 12,
                            color: "#64748b",
                            marginTop: 6,
                            lineHeight: 1.4,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                          title={doc.notes}
                        >
                          {doc.notes}
                        </div>
                      )}
                    </div>

                    <Space size={6}>
                      <Button
                        size="small"
                        type={isSelected ? "primary" : "default"}
                        icon={<EditOutlined />}
                        onClick={() => handleSelectDoc(doc)}
                        style={{
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 600,
                          height: 30,
                          background: isSelected ? "#1b3d6d" : undefined,
                          borderColor: isSelected ? "#1b3d6d" : undefined,
                        }}
                      >
                        {isSelected ? "Editing" : "Edit"}
                      </Button>
                      <Button
                        size="small"
                        danger
                        type="text"
                        icon={<DeleteOutlined style={{ fontSize: 14 }} />}
                        onClick={(e) => handleOpenDeleteModal(doc, e)}
                        title="Delete document"
                        style={{ borderRadius: 8, height: 30, width: 30 }}
                      />
                    </Space>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                    <span className={styles.formatTag}>
                      {categoryDisplayMap[doc.category] || doc.category || "Supporting"}
                    </span>
                    <span className={styles.formatTag}>
                      {fileTypeDisplayMap[doc.file_type] || doc.file_type || "PDF"}
                    </span>

                    {doc.required ? (
                      <span className={styles.requiredTag}>
                        Required
                      </span>
                    ) : (
                      <span className={styles.optionalTag}>
                        Optional
                      </span>
                    )}

                    {doc.translation_needed === "yes" && (
                      <span className={styles.swornTag}>
                        Sworn
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )
        }
        formTitle={
          selectedDocument
            ? "Edit Requirement Document"
            : "Add Requirement Document"
        }
        formSubtitle={
          selectedDocument
            ? "Modify requirement details, file formats, or automatic renaming patterns."
            : "Register a new document requirement in the system."
        }
        formTag={
          selectedDocument ? (
            <Tag color="blue" style={{ borderRadius: 999, fontWeight: 600 }}>
              {selectedDocument.internal_code || "DOCUMENT"}
            </Tag>
          ) : undefined
        }
        isEditing={Boolean(selectedDocument)}
        onCancelEdit={handleSelectNew}
        onAddNewFromForm={handleSelectNew}
        formContent={
          <FormDocumentComponent
            key={selectedDocument?.id ?? "new-doc-form"}
            selectedDocument={selectedDocumentDetail ?? selectedDocument}
            existingCodes={existingCodes}
            onSubmit={handleSubmit}
            onCancel={handleSelectNew}
            loading={formLoading}
          />
        }
      />

      {/* Modal Konfirmasi Hapus */}
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
            Delete Requirement Document?
          </Title>
          <Text
            type="secondary"
            style={{ display: "block", marginBottom: 24, fontSize: 13.5 }}
          >
            Are you sure you want to delete <b>&quot;{deleteTarget?.label}&quot;</b>?
            This document will be removed from the master list and will no longer be required for student applications.
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
              Cancel
            </Button>
            <Button
              block
              danger
              type="primary"
              style={{ borderRadius: 10, height: 40, fontWeight: 600 }}
              loading={onDeleteDocumentLoading}
              onClick={handleExecuteDelete}
            >
              Yes, Delete Document
            </Button>
          </Flex>
        </div>
      </Modal>
    </>
  );
}
