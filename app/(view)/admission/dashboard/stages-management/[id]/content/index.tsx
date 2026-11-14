"use client";

import { useDocuments } from "@/app/hooks/use-documents-management";
import { useStagesManagement } from "@/app/hooks/use-stages-management";
import { useCountryManagement } from "@/app/hooks/use-country-management";
import {
  Button,
  Card,
  Col,
  Divider,
  Input,
  Pagination,
  Row,
  Space,
  Tag,
  Typography,
} from "antd";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ApartmentOutlined,
  ArrowLeftOutlined,
  CheckOutlined,
  FileTextOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useStepsManagement } from "@/app/hooks/use-steps-management";
import { useChildStepsManagement } from "@/app/hooks/use-child-steps-management";
import { useCountryStepsManagement } from "@/app/hooks/use-country-steps-management";
import CountryFlag from "@/app/components/common/country-flag";
import { getCountryBadgeMeta } from "@/app/utils/student-helpers";

export default function StagesManagementDetailPage() {
  const router = useRouter();
  const params = useParams();
  const rawId = params?.id;
  const country_id = Array.isArray(rawId) ? rawId[0] : (rawId ?? "");
  const { data: countryData } = useCountryManagement({ id: country_id });
  const {
    data: stagesData,
    onCreate: onCreateStage,
    onDelete: onDeleteStage,
  } = useStagesManagement({});
  const { data: documentsData } = useDocuments({});
  const { data: stepsData } = useStepsManagement({});
  const { data: childStepsData } = useChildStepsManagement({});
  const {
    data: countryStepsData,
    onCreate: onCreateCountryStep,
    onDelete: onDeleteCountryStep,
  } = useCountryStepsManagement({});
  const [selectedDocIds, setSelectedDocIds] = useState<Array<string | number>>(
    [],
  );
  const [selectionDirty, setSelectionDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [docSearch, setDocSearch] = useState("");
  const [stepSearch, setStepSearch] = useState("");
  const [docPage, setDocPage] = useState(1);
  const [stepPage, setStepPage] = useState(1);
  const [selectedStepIds, setSelectedStepIds] = useState<Array<string | number>>(
    [],
  );
  const [stepSelectionDirty, setStepSelectionDirty] = useState(false);
  const [stepSaving, setStepSaving] = useState(false);
  const [checklistSearch, setChecklistSearch] = useState("");
  const [stepChecklistSearch, setStepChecklistSearch] = useState("");

  const toggleDoc = (id: string | number) => {
    setSelectedDocIds((prev) =>
      prev.includes(id) ? prev.filter((docId) => docId !== id) : [...prev, id],
    );
    setSelectionDirty(true);
  };

  const toggleStep = (id: string | number) => {
    setSelectedStepIds((prev) =>
      prev.includes(id) ? prev.filter((step_id) => step_id !== id) : [...prev, id],
    );
    setStepSelectionDirty(true);
  };

  const countryStages = useMemo(
    () => (stagesData ?? []).filter((stage) => stage.country_id === country_id),
    [country_id, stagesData],
  );

  const countrySteps = useMemo(
    () =>
      (countryStepsData ?? []).filter(
        (item) => item.country_id === country_id,
      ),
    [country_id, countryStepsData],
  );

  useEffect(() => {
    if (selectionDirty) return;
    setSelectedDocIds(countryStages.map((stage) => stage.document_id));
  }, [countryStages, selectionDirty]);

  useEffect(() => {
    setSelectionDirty(false);
    setStepSelectionDirty(false);
  }, [country_id]);

  useEffect(() => {
    if (stepSelectionDirty) return;
    setSelectedStepIds(countrySteps.map((item) => item.step_id));
  }, [countrySteps, stepSelectionDirty]);

  const selectedDocs = useMemo(() => {
    const ids = new Set(selectedDocIds);
    const docsSource =
      documentsData && documentsData.length
        ? documentsData
        : countryStages
            .map((stage) => stage.document)
            .filter((doc): doc is NonNullable<typeof doc> => Boolean(doc));

    const unique = new Map<string | number, (typeof docsSource)[number]>();
    docsSource.forEach((doc) => {
      if (ids.has(doc.id)) {
        unique.set(doc.id, doc);
      }
    });
    return Array.from(unique.values());
  }, [documentsData, selectedDocIds, countryStages]);

  const filteredSelectedDocs = useMemo(() => {
    const term = checklistSearch.trim().toLowerCase();
    if (!term) return selectedDocs;
    return selectedDocs.filter((doc) =>
      String(doc.label || "").toLowerCase().includes(term) ||
      String(doc.internal_code || "").toLowerCase().includes(term)
    );
  }, [checklistSearch, selectedDocs]);

  const filteredDocuments = useMemo(() => {
    const term = docSearch.trim().toLowerCase();
    if (!term) return documentsData ?? [];
    return (documentsData ?? []).filter((doc) =>
      doc.label.toLowerCase().includes(term),
    );
  }, [docSearch, documentsData]);

  const filteredSteps = useMemo(() => {
    const term = stepSearch.trim().toLowerCase();
    if (!term) return stepsData ?? [];
    return (stepsData ?? []).filter((step) =>
      step.label.toLowerCase().includes(term),
    );
  }, [stepSearch, stepsData]);

  const pageSize = 5;
  const totalDocPages = filteredDocuments.length;
  const totalStepPages = filteredSteps.length;
  const pagedDocuments = useMemo(() => {
    const start = (docPage - 1) * pageSize;
    return filteredDocuments.slice(start, start + pageSize);
  }, [filteredDocuments, docPage]);
  const pagedSteps = useMemo(() => {
    const start = (stepPage - 1) * pageSize;
    return filteredSteps.slice(start, start + pageSize);
  }, [filteredSteps, stepPage]);

  useEffect(() => {
    setDocPage(1);
  }, [docSearch]);

  useEffect(() => {
    setStepPage(1);
  }, [stepSearch]);

  const selectedSteps = useMemo(() => {
    const ids = new Set(selectedStepIds);
    const stepsSource =
      stepsData && stepsData.length
        ? stepsData
        : countrySteps
            .map((item) => item.step)
            .filter((step): step is NonNullable<typeof step> => Boolean(step));

    const unique = new Map<string | number, (typeof stepsSource)[number]>();
    stepsSource.forEach((step) => {
      if (ids.has(step.id)) {
        unique.set(step.id, step);
      }
    });
    return Array.from(unique.values());
  }, [stepsData, selectedStepIds, countrySteps]);

  const filteredSelectedSteps = useMemo(() => {
    const term = stepChecklistSearch.trim().toLowerCase();
    if (!term) return selectedSteps;
    return selectedSteps.filter((step) =>
      String(step.label || "").toLowerCase().includes(term)
    );
  }, [stepChecklistSearch, selectedSteps]);

  const childLabelById = useMemo(() => {
    const map = new Map<string, string>();
    (childStepsData ?? []).forEach((child) => {
      map.set(child.id, child.label);
    });
    return map;
  }, [childStepsData]);

  const totalDocuments = documentsData?.length ?? 0;
  const totalSteps = stepsData?.length ?? 0;
  const selectedCount = selectedDocs.length;
  const selectedStepCount = selectedSteps.length;
  const canSave =
    selectionDirty && (selectedCount > 0 || countryStages.length > 0);
  const canSaveSteps =
    stepSelectionDirty && (selectedStepCount > 0 || countrySteps.length > 0);

  const countryName =
    countryStages.find((stage) => stage.country?.name)?.country?.name ??
    countryData?.name ??
    "Stage Detail";

  const handleSaveChecklist = async () => {
    if (!country_id) return;
    const existingDocIds = new Set(
      countryStages.map((stage) => stage.document_id),
    );
    const selectedSet = new Set(selectedDocIds);
    const stagesToDelete = countryStages.filter(
      (stage) => !selectedSet.has(stage.document_id),
    );
    const docsToCreate = selectedDocIds.filter(
      (docId) => !existingDocIds.has(docId as string),
    );

    setSaving(true);
    try {
      await Promise.all([
        ...stagesToDelete.map((stage) => onDeleteStage(stage.id)),
        ...docsToCreate.map((docId) =>
          onCreateStage({
            country_id,
            document_id: String(docId),
          }),
        ),
      ]);
      setSelectionDirty(false);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSteps = async () => {
    if (!country_id) return;
    const existingStepIds = new Set(countrySteps.map((item) => item.step_id));
    const selectedSet = new Set(selectedStepIds);
    const stepsToDelete = countrySteps.filter(
      (item) => !selectedSet.has(item.step_id),
    );
    const stepsToCreate = selectedStepIds.filter(
      (step_id) => !existingStepIds.has(step_id as string),
    );

    setStepSaving(true);
    try {
      await Promise.all([
        ...stepsToDelete.map((item) => onDeleteCountryStep(item.id)),
        ...stepsToCreate.map((step_id) =>
          onCreateCountryStep({
            country_id,
            step_id: String(step_id),
          }),
        ),
      ]);
      setStepSelectionDirty(false);
    } finally {
      setStepSaving(false);
    }
  };

  return (
    <div style={{ padding: "8px 4px" }}>
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        {/* Aesthetic Country Hero Header */}
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            background:
              "radial-gradient(circle at 92% 18%, rgba(37, 99, 235, 0.08) 0%, rgba(37, 99, 235, 0) 50%), linear-gradient(135deg, #ffffff 0%, #f8fafc 55%, #f1f5f9 100%)",
            borderRadius: 20,
            border: "1px solid #e2e8f0",
            padding: "18px 20px",
            boxShadow:
              "0 8px 30px -4px rgba(15, 23, 42, 0.04), 0 2px 6px -1px rgba(15, 23, 42, 0.02)",
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          {/* Baris Navigasi Atas: Tombol Kembali & Breadcrumb */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              gap: 12,
              paddingBottom: 14,
              borderBottom: "1px solid rgba(226, 232, 240, 0.8)",
            }}
          >
            <button
              type="button"
              onClick={() =>
                router.push("/admission/dashboard/stages-management")
              }
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                borderRadius: 10,
                padding: "6px 14px",
                color: "#334155",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#94a3b8";
                e.currentTarget.style.background = "#f8fafc";
                e.currentTarget.style.color = "#0f172a";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#cbd5e1";
                e.currentTarget.style.background = "#ffffff";
                e.currentTarget.style.color = "#334155";
              }}
            >
              <ArrowLeftOutlined style={{ fontSize: 11 }} />
              <span>Kembali ke Daftar Negara</span>
            </button>
          </div>

          {/* Baris Utama: Flag Emblem + Info Negara + Statistik Ringkas */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 20,
            }}
          >
            {/* Sisi Kiri: Emblem Bendera + Identitas */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 18,
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  position: "relative",
                  borderRadius: 14,
                  padding: 3,
                  background: "#ffffff",
                  boxShadow:
                    "0 10px 25px -4px rgba(15, 23, 42, 0.12), 0 2px 6px -1px rgba(15, 23, 42, 0.06)",
                  border: "1px solid rgba(15, 23, 42, 0.08)",
                  display: "inline-flex",
                }}
              >
                <CountryFlag
                  countryName={countryName}
                  width={76}
                  height={50}
                  borderRadius={11}
                />
              </div>

              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <Typography.Title
                    level={2}
                    style={{
                      margin: 0,
                      fontWeight: 800,
                      fontSize: 24,
                      color: "#0f172a",
                      letterSpacing: "-0.025em",
                    }}
                  >
                    {countryName}
                  </Typography.Title>

                  <span
                    style={{
                      background: "#0f172a",
                      color: "#ffffff",
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      padding: "3px 10px",
                      borderRadius: 9999,
                      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.06)",
                    }}
                  >
                    {getCountryBadgeMeta(countryName).code}
                  </span>

                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      background: "#ecfdf5",
                      border: "1px solid #bbf7d0",
                      color: "#15803d",
                      fontSize: 12,
                      fontWeight: 600,
                      padding: "3px 10px",
                      borderRadius: 9999,
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "#22c55e",
                      }}
                    />
                    Alur Aktif
                  </span>
                </div>

                <Typography.Text
                  type="secondary"
                  style={{
                    fontSize: 13.5,
                    display: "block",
                    marginTop: 6,
                    color: "#64748b",
                  }}
                >
                  Konfigurasi berkas persyaratan checklist dan alur tahapan untuk negara {countryName}.
                </Typography.Text>
              </div>
            </div>

            {/* Sisi Kanan: Statistik Ringkas Berdampingan */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 10,
                width: "100%",
                maxWidth: 340,
              }}
            >
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 9,
                    background: "#f0fdf4",
                    border: "1px solid #dcfce7",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#16a34a",
                    fontSize: 17,
                    flexShrink: 0,
                  }}
                >
                  <FileTextOutlined />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#64748b",
                      textTransform: "uppercase",
                      letterSpacing: "0.03em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Documents
                  </div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: "#0f172a",
                      lineHeight: 1.2,
                    }}
                  >
                    {selectedCount}
                  </div>
                </div>
              </div>

              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 9,
                    background: "#eff6ff",
                    border: "1px solid #dbeafe",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#2563eb",
                    fontSize: 17,
                    flexShrink: 0,
                  }}
                >
                  <ApartmentOutlined />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#64748b",
                      textTransform: "uppercase",
                      letterSpacing: "0.03em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Steps
                  </div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: "#0f172a",
                      lineHeight: 1.2,
                    }}
                  >
                    {selectedStepCount}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={14}>
            <Space direction="vertical" size={16} style={{ width: "100%" }}>
              <Card
                title="Document Library"
                extra={<Tag color="blue">{totalDocuments} Documents</Tag>}
                bodyStyle={{ padding: 14 }}
                style={{
                  borderRadius: 16,
                  borderColor: "#e2e8f0",
                  background:
                    "linear-gradient(145deg, rgba(255,255,255,0.98), rgba(248,250,252,0.95))",
                  boxShadow: "0 4px 20px rgba(15, 23, 42, 0.04)",
                }}
              >
                <Input
                  placeholder="Cari dokumen..."
                  prefix={<SearchOutlined style={{ color: "#94a3b8", fontSize: 13 }} />}
                  allowClear
                  value={docSearch}
                  onChange={(event) => setDocSearch(event.target.value)}
                  style={{
                    marginBottom: 12,
                    borderRadius: 8,
                    height: 34,
                    fontSize: 12.5,
                    borderColor: "#e2e8f0",
                  }}
                />
                <Space direction="vertical" size={10} style={{ width: "100%" }}>
                  {pagedDocuments.map((doc) => {
                    const isSelected = selectedDocIds.includes(doc.id);
                    return (
                      <div
                        key={doc.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 12,
                          width: "100%",
                          padding: "10px 14px",
                          borderRadius: 12,
                          border: isSelected ? "1px solid #93c5fd" : "1px solid #e2e8f0",
                          background: isSelected ? "#eff6ff" : "#ffffff",
                          boxShadow: "0 1px 2px rgba(15, 23, 42, 0.02)",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                          <Typography.Text
                            strong
                            style={{
                              fontSize: 13,
                              color: "#0f172a",
                              display: "block",
                              lineHeight: 1.35,
                            }}
                          >
                            {doc.label}
                          </Typography.Text>
                          <Typography.Text
                            type="secondary"
                            style={{
                              fontSize: 11.5,
                              color: "#64748b",
                              display: "block",
                              marginTop: 2,
                              lineHeight: 1.35,
                            }}
                          >
                            {doc.notes || doc.internal_code || "-"}
                          </Typography.Text>
                        </div>
                        <Button
                          size="small"
                          type={isSelected ? "default" : "primary"}
                          icon={
                            isSelected ? (
                              <CheckOutlined style={{ fontSize: 11 }} />
                            ) : (
                              <PlusOutlined style={{ fontSize: 11 }} />
                            )
                          }
                          onClick={() => toggleDoc(doc.id)}
                          style={{
                            flexShrink: 0,
                            height: 28,
                            fontSize: 11.5,
                            borderRadius: 7,
                            padding: "0 10px",
                            whiteSpace: "nowrap",
                            background: isSelected ? "#ffffff" : "#1e3a8a",
                            borderColor: isSelected ? "#93c5fd" : "#1e3a8a",
                            color: isSelected ? "#1d4ed8" : "#ffffff",
                            fontWeight: 500,
                          }}
                        >
                          {isSelected ? "Added" : "Checklist"}
                        </Button>
                      </div>
                    );
                  })}
                  {!totalDocuments && (
                    <Typography.Text type="secondary">
                      Belum ada dokumen.
                    </Typography.Text>
                  )}
                  {totalDocuments > 0 && totalDocPages === 0 && (
                    <Typography.Text type="secondary">
                      Dokumen tidak ditemukan.
                    </Typography.Text>
                  )}
                </Space>
                {totalDocPages > pageSize && (
                  <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
                    <Pagination
                      current={docPage}
                      pageSize={pageSize}
                      total={totalDocPages}
                      onChange={setDocPage}
                      size="small"
                    />
                  </div>
                )}
              </Card>

              <Card
                title="Step Library"
                extra={<Tag color="gold">{totalSteps} Steps</Tag>}
                bodyStyle={{ padding: 14 }}
                style={{
                  borderRadius: 16,
                  borderColor: "#e2e8f0",
                  background: "#ffffff",
                  boxShadow: "0 4px 20px rgba(15, 23, 42, 0.04)",
                }}
              >
                <Input
                  placeholder="Cari steps..."
                  prefix={<SearchOutlined style={{ color: "#94a3b8", fontSize: 13 }} />}
                  allowClear
                  value={stepSearch}
                  onChange={(event) => setStepSearch(event.target.value)}
                  style={{
                    marginBottom: 12,
                    borderRadius: 8,
                    height: 34,
                    fontSize: 12.5,
                    borderColor: "#e2e8f0",
                  }}
                />
                <Space direction="vertical" size={10} style={{ width: "100%" }}>
                  {pagedSteps.map((step) => {
                    const isSelected = selectedStepIds.includes(step.id);
                    const children = step.children ?? [];
                    const fallbackChildren =
                      children.length === 0 && step.child_ids?.length
                        ? step.child_ids.map((id) => ({
                            id,
                            label: childLabelById.get(id) ?? id,
                          }))
                        : [];

                    return (
                      <div
                        key={step.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 12,
                          width: "100%",
                          padding: "10px 14px",
                          borderRadius: 12,
                          border: isSelected ? "1px solid #fde68a" : "1px solid #e2e8f0",
                          background: isSelected ? "#fffbeb" : "#ffffff",
                          boxShadow: "0 1px 2px rgba(15, 23, 42, 0.02)",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                          <Typography.Text
                            strong
                            style={{
                              fontSize: 13,
                              color: "#0f172a",
                              display: "block",
                              lineHeight: 1.35,
                            }}
                          >
                            {step.label}
                          </Typography.Text>
                          {children.length > 0 ||
                          fallbackChildren.length > 0 ? (
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 4,
                                marginTop: 4,
                              }}
                            >
                              {(children.length > 0
                                ? children
                                : fallbackChildren
                              ).map((child) => (
                                <Tag
                                  key={child.id}
                                  color="blue"
                                  style={{
                                    fontSize: 11,
                                    margin: 0,
                                    lineHeight: "18px",
                                    padding: "0 6px",
                                    borderRadius: 4,
                                  }}
                                >
                                  {child.label}
                                </Tag>
                              ))}
                            </div>
                          ) : (
                            <Tag
                              color="default"
                              style={{
                                fontSize: 11,
                                margin: "4px 0 0 0",
                                lineHeight: "18px",
                                padding: "0 6px",
                                borderRadius: 4,
                              }}
                            >
                              Tanpa kategori
                            </Tag>
                          )}
                        </div>
                        <Button
                          size="small"
                          type={isSelected ? "default" : "primary"}
                          icon={
                            isSelected ? (
                              <CheckOutlined style={{ fontSize: 11 }} />
                            ) : (
                              <PlusOutlined style={{ fontSize: 11 }} />
                            )
                          }
                          onClick={() => toggleStep(step.id)}
                          style={{
                            flexShrink: 0,
                            height: 28,
                            fontSize: 11.5,
                            borderRadius: 7,
                            padding: "0 10px",
                            whiteSpace: "nowrap",
                            background: isSelected ? "#ffffff" : "#1e3a8a",
                            borderColor: isSelected ? "#f59e0b" : "#1e3a8a",
                            color: isSelected ? "#b45309" : "#ffffff",
                            fontWeight: 500,
                          }}
                        >
                          {isSelected ? "Added" : "Checklist"}
                        </Button>
                      </div>
                    );
                  })}
                  {!totalSteps && (
                    <Typography.Text type="secondary">
                      Belum ada steps.
                    </Typography.Text>
                  )}
                  {totalSteps > 0 && totalStepPages === 0 && (
                    <Typography.Text type="secondary">
                      Steps tidak ditemukan.
                    </Typography.Text>
                  )}
                </Space>
                {totalStepPages > pageSize && (
                  <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
                    <Pagination
                      current={stepPage}
                      pageSize={pageSize}
                      total={totalStepPages}
                      onChange={setStepPage}
                      size="small"
                    />
                  </div>
                )}
              </Card>
            </Space>
          </Col>

          <Col xs={24} lg={10} style={{ position: "sticky", top: 20, alignSelf: "flex-start" }}>
            <Space direction="vertical" size={16} style={{ width: "100%" }}>
              <Card
                title="Checklist Negara"
                extra={
                  <Space size={8}>
                    <Tag color="green">{selectedCount} Dipilih</Tag>
                    {canSave && (
                      <Button
                        type="primary"
                        size="small"
                        onClick={handleSaveChecklist}
                        loading={saving}
                        style={{
                          height: 28,
                          fontSize: 11.5,
                          borderRadius: 7,
                          background: "#2563eb",
                          fontWeight: 500,
                        }}
                      >
                        Simpan Perubahan
                      </Button>
                    )}
                  </Space>
                }
                bodyStyle={{ padding: 14 }}
                style={{
                  borderRadius: 16,
                  borderColor: "#e2e8f0",
                  background: "#ffffff",
                  boxShadow: "0 4px 20px rgba(15, 23, 42, 0.04)",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                    Dokumen yang dibutuhkan untuk negara ini.
                  </Typography.Text>

                  {selectedDocs.length > 5 && (
                    <Input
                      placeholder="Cari dalam checklist..."
                      prefix={<SearchOutlined style={{ color: "#94a3b8", fontSize: 13 }} />}
                      allowClear
                      size="small"
                      value={checklistSearch}
                      onChange={(e) => setChecklistSearch(e.target.value)}
                      style={{ borderRadius: 8, height: 34, borderColor: "#e2e8f0" }}
                    />
                  )}

                  <Divider style={{ margin: "2px 0" }} />

                  <div
                    style={{
                      maxHeight: 360,
                      overflowY: "auto",
                      paddingRight: 4,
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                    }}
                  >
                    {filteredSelectedDocs.length ? (
                      filteredSelectedDocs.map((doc) => (
                        <div
                          key={doc.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "8px 12px",
                            borderRadius: 10,
                            border: "1px solid #fde68a",
                            background: "#fffbeb",
                            gap: 8,
                          }}
                        >
                          <Typography.Text strong style={{ fontSize: 12.5, flex: 1, minWidth: 0 }} ellipsis>
                            {doc.label}
                          </Typography.Text>
                          <Button
                            size="small"
                            type="text"
                            danger
                            style={{ fontSize: 11.5, height: 24, padding: "0 6px", flexShrink: 0 }}
                            onClick={() => toggleDoc(doc.id)}
                          >
                            Hapus
                          </Button>
                        </div>
                      ))
                    ) : (
                      <Typography.Text type="secondary" style={{ fontSize: 13, textAlign: "center", padding: 12 }}>
                        {checklistSearch ? "Tidak ada dokumen yang cocok." : "Belum ada dokumen yang dipilih."}
                      </Typography.Text>
                    )}
                  </div>
                </div>
              </Card>

              <Card
                title="Tahapan Negara"
                extra={
                  <Space size={8}>
                    <Tag color="gold">{selectedStepCount} Dipilih</Tag>
                    {canSaveSteps && (
                      <Button
                        type="primary"
                        size="small"
                        onClick={handleSaveSteps}
                        loading={stepSaving}
                        style={{
                          height: 28,
                          fontSize: 11.5,
                          borderRadius: 7,
                          background: "#2563eb",
                          fontWeight: 500,
                        }}
                      >
                        Simpan Perubahan
                      </Button>
                    )}
                  </Space>
                }
                bodyStyle={{ padding: 14 }}
                style={{
                  borderRadius: 16,
                  borderColor: "#e2e8f0",
                  background: "#ffffff",
                  boxShadow: "0 4px 20px rgba(15, 23, 42, 0.04)",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                    Steps yang dibutuhkan untuk negara ini.
                  </Typography.Text>

                  {selectedSteps.length > 5 && (
                    <Input
                      placeholder="Cari dalam steps..."
                      prefix={<SearchOutlined style={{ color: "#94a3b8", fontSize: 13 }} />}
                      allowClear
                      size="small"
                      value={stepChecklistSearch}
                      onChange={(e) => setStepChecklistSearch(e.target.value)}
                      style={{ borderRadius: 8, height: 34, borderColor: "#e2e8f0" }}
                    />
                  )}

                  <Divider style={{ margin: "2px 0" }} />

                  <div
                    style={{
                      maxHeight: 300,
                      overflowY: "auto",
                      paddingRight: 4,
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                    }}
                  >
                    {filteredSelectedSteps.length ? (
                      filteredSelectedSteps.map((step) => {
                        const children = step.children ?? [];
                        const fallbackChildren =
                          children.length === 0 && step.child_ids?.length
                            ? step.child_ids.map((id) => ({
                                id,
                                label: childLabelById.get(id) ?? id,
                              }))
                            : [];

                        return (
                          <div
                            key={step.id}
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              justifyContent: "space-between",
                              padding: "8px 12px",
                              borderRadius: 10,
                              border: "1px solid #fde68a",
                              background: "#fffbeb",
                              gap: 8,
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <Typography.Text strong style={{ fontSize: 12.5, display: "block" }} ellipsis>
                                {step.label}
                              </Typography.Text>
                              {children.length > 0 || fallbackChildren.length > 0 ? (
                                <Space size={4} wrap style={{ marginTop: 4 }}>
                                  {(children.length > 0 ? children : fallbackChildren).map((child) => (
                                    <Tag key={child.id} color="blue" style={{ fontSize: 11, margin: 0 }}>
                                      {child.label}
                                    </Tag>
                                  ))}
                                </Space>
                              ) : null}
                            </div>
                            <Button
                              size="small"
                              type="text"
                              danger
                              style={{ fontSize: 11.5, height: 24, padding: "0 6px", flexShrink: 0 }}
                              onClick={() => toggleStep(step.id)}
                            >
                              Hapus
                            </Button>
                          </div>
                        );
                      })
                    ) : (
                      <Typography.Text type="secondary" style={{ fontSize: 13, textAlign: "center", padding: 12 }}>
                        {stepChecklistSearch ? "Tidak ada steps yang cocok." : "Belum ada steps yang dipilih."}
                      </Typography.Text>
                    )}
                  </div>
                </div>
              </Card>
            </Space>
          </Col>
        </Row>
      </Space>
    </div>
  );
}
