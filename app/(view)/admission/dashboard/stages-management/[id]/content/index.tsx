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
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CheckOutlined, PlusOutlined } from "@ant-design/icons";
import { useStepsManagement } from "@/app/hooks/use-steps-management";
import { useChildStepsManagement } from "@/app/hooks/use-child-steps-management";
import { useCountryStepsManagement } from "@/app/hooks/use-country-steps-management";

export default function StagesManagementDetailPage() {
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
        <Space direction="vertical" size={4}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {countryName}
          </Typography.Title>
          <Typography.Text type="secondary">
            Kelola checklist dokumen dan steps untuk negara ini.
          </Typography.Text>
        </Space>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={14}>
            <Space direction="vertical" size={16} style={{ width: "100%" }}>
              <Card
                title="Document Library"
                extra={<Tag color="blue">{totalDocuments} dokumen tersedia</Tag>}
                bodyStyle={{ padding: 16 }}
                style={{
                  borderRadius: 16,
                  borderColor: "#e2e8f0",
                  background:
                    "linear-gradient(145deg, rgba(255,255,255,0.98), rgba(248,250,252,0.95))",
                }}
              >
                <Input.Search
                  placeholder="Cari dokumen..."
                  allowClear
                  value={docSearch}
                  onChange={(event) => setDocSearch(event.target.value)}
                  style={{ marginBottom: 12 }}
                />
                <Space direction="vertical" size={12} style={{ width: "100%" }}>
                  {pagedDocuments.map((doc) => {
                    const isSelected = selectedDocIds.includes(doc.id);
                    return (
                      <Card
                        key={doc.id}
                        size="small"
                        bodyStyle={{ padding: 12 }}
                        style={{
                          borderRadius: 12,
                          borderColor: isSelected ? "#93c5fd" : "#e5e7eb",
                          background: isSelected ? "#eff6ff" : "#fff",
                        }}
                      >
                        <Row align="middle" justify="space-between">
                          <Col>
                            <Space direction="vertical" size={2}>
                              <Typography.Text strong>
                                {doc.label}
                              </Typography.Text>
                              <Typography.Text
                                type="secondary"
                                style={{ fontSize: 12 }}
                              >
                                {doc.internal_code || "-"}
                              </Typography.Text>
                            </Space>
                          </Col>
                          <Col>
                            <Button
                              size="small"
                              type={isSelected ? "default" : "primary"}
                              icon={
                                isSelected ? <CheckOutlined /> : <PlusOutlined />
                              }
                              onClick={() => toggleDoc(doc.id)}
                            >
                              {isSelected ? "Added" : "Add to checklist"}
                            </Button>
                          </Col>
                        </Row>
                      </Card>
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
                title="Steps Library"
                extra={<Tag color="gold">{totalSteps} steps tersedia</Tag>}
                bodyStyle={{ padding: 16 }}
                style={{
                  borderRadius: 16,
                  borderColor: "#e2e8f0",
                  background: "#ffffff",
                }}
              >
                <Input.Search
                  placeholder="Cari steps..."
                  allowClear
                  value={stepSearch}
                  onChange={(event) => setStepSearch(event.target.value)}
                  style={{ marginBottom: 12 }}
                />
                <Space direction="vertical" size={12} style={{ width: "100%" }}>
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
                      <Card
                        key={step.id}
                        size="small"
                        bodyStyle={{ padding: 12 }}
                        style={{
                          borderRadius: 12,
                          borderColor: isSelected ? "#fde68a" : "#e5e7eb",
                          background: isSelected ? "#fffbeb" : "#f8fafc",
                        }}
                      >
                        <Row align="middle" justify="space-between">
                          <Col>
                            <Space direction="vertical" size={6}>
                              <Typography.Text strong>
                                {step.label}
                              </Typography.Text>
                              {children.length > 0 ||
                              fallbackChildren.length > 0 ? (
                                <Space size={6} wrap>
                                  {(children.length > 0
                                    ? children
                                    : fallbackChildren
                                  ).map((child) => (
                                    <Tag key={child.id} color="blue">
                                      {child.label}
                                    </Tag>
                                  ))}
                                </Space>
                              ) : (
                                <Tag color="default">Tanpa kategori</Tag>
                              )}
                            </Space>
                          </Col>
                          <Col>
                            <Button
                              size="small"
                              type={isSelected ? "default" : "primary"}
                              icon={
                                isSelected ? <CheckOutlined /> : <PlusOutlined />
                              }
                              onClick={() => toggleStep(step.id)}
                            >
                              {isSelected ? "Added" : "Add to checklist"}
                            </Button>
                          </Col>
                        </Row>
                      </Card>
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

          <Col xs={24} lg={10}>
            <Space direction="vertical" size={16} style={{ width: "100%" }}>
              <Card
                title="Country Checklist"
                extra={
                  <Space size={8}>
                    <Tag color="green">{selectedCount} dokumen dipilih</Tag>
                    <Button
                      type="primary"
                      size="small"
                      onClick={handleSaveChecklist}
                      disabled={!canSave}
                      loading={saving}
                    >
                      Save
                    </Button>
                  </Space>
                }
                bodyStyle={{ padding: 16 }}
                style={{
                  borderRadius: 16,
                  borderColor: "#e2e8f0",
                  background: "#ffffff",
                }}
              >
                <Space direction="vertical" size={12} style={{ width: "100%" }}>
                  <Typography.Text type="secondary">
                    Dokumen yang dibutuhkan untuk negara ini.
                  </Typography.Text>
                  <Divider style={{ margin: "4px 0" }} />
                  {selectedDocs.length ? (
                    selectedDocs.map((doc) => (
                      <Card
                        key={doc.id}
                        size="small"
                        bodyStyle={{ padding: 12 }}
                        style={{
                          borderRadius: 12,
                          borderColor: "#fde68a",
                          background: "#fffbeb",
                        }}
                      >
                        <Row align="middle" justify="space-between">
                          <Col>
                            <Typography.Text strong>{doc.label}</Typography.Text>
                          </Col>
                          <Col>
                            <Button
                              size="small"
                              type="text"
                              onClick={() => toggleDoc(doc.id)}
                            >
                              Remove
                            </Button>
                          </Col>
                        </Row>
                      </Card>
                    ))
                  ) : (
                    <Typography.Text type="secondary">
                      Belum ada dokumen yang dipilih.
                    </Typography.Text>
                  )}
                </Space>
              </Card>

              <Card
                title="Country Steps"
                extra={
                  <Space size={8}>
                    <Tag color="gold">{selectedStepCount} steps dipilih</Tag>
                    <Button
                      type="primary"
                      size="small"
                      onClick={handleSaveSteps}
                      disabled={!canSaveSteps}
                      loading={stepSaving}
                    >
                      Save
                    </Button>
                  </Space>
                }
                bodyStyle={{ padding: 16 }}
                style={{
                  borderRadius: 16,
                  borderColor: "#e2e8f0",
                  background: "#ffffff",
                }}
              >
                <Space direction="vertical" size={12} style={{ width: "100%" }}>
                  <Typography.Text type="secondary">
                    Steps yang dibutuhkan untuk negara ini.
                  </Typography.Text>
                  <Divider style={{ margin: "4px 0" }} />
                  {selectedSteps.length ? (
                    selectedSteps.map((step) => {
                      const children = step.children ?? [];
                      const fallbackChildren =
                        children.length === 0 && step.child_ids?.length
                          ? step.child_ids.map((id) => ({
                              id,
                              label: childLabelById.get(id) ?? id,
                            }))
                          : [];

                      return (
                        <Card
                          key={step.id}
                          size="small"
                          bodyStyle={{ padding: 12 }}
                          style={{
                            borderRadius: 12,
                            borderColor: "#fde68a",
                            background: "#fffbeb",
                          }}
                        >
                          <Row align="top" justify="space-between">
                            <Col>
                              <Space direction="vertical" size={6}>
                                <Typography.Text strong>
                                  {step.label}
                                </Typography.Text>
                                {children.length > 0 ||
                                fallbackChildren.length > 0 ? (
                                  <Space size={6} wrap>
                                    {(children.length > 0
                                      ? children
                                      : fallbackChildren
                                    ).map((child) => (
                                      <Tag key={child.id} color="blue">
                                        {child.label}
                                      </Tag>
                                    ))}
                                  </Space>
                                ) : (
                                  <Tag color="default">Tanpa kategori</Tag>
                                )}
                              </Space>
                            </Col>
                            <Col>
                              <Button
                                size="small"
                                type="text"
                                onClick={() => toggleStep(step.id)}
                              >
                                Remove
                              </Button>
                            </Col>
                          </Row>
                        </Card>
                      );
                    })
                  ) : (
                    <Typography.Text type="secondary">
                      Belum ada steps yang dipilih.
                    </Typography.Text>
                  )}
                </Space>
              </Card>
            </Space>
          </Col>
        </Row>
      </Space>
    </div>
  );
}
