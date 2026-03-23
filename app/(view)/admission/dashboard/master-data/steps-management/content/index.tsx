import { Card, Col, Row, Space, Tag, Typography } from "antd";
import { useMemo, useState } from "react";
import SearchBarComponent from "@/app/components/common/search-bar";
import FormStepManagement from "./FormStepManagement";
import { useStepsManagement, useStepManagement } from "@/app/hooks/use-steps-management";
import { useChildStepsManagement } from "@/app/hooks/use-child-steps-management";
import type {
  StepsManagementDataModel,
  StepsManagementPayloadCreateModel,
} from "@/app/models/steps-management";

const { Text, Title } = Typography;

export default function StepsManagementContent() {
  const [selectedStep, setSelectedStep] =
    useState<StepsManagementDataModel | null>(null);
  const [stepQuery, setStepQuery] = useState("");

  const { data: childSteps } = useChildStepsManagement({});

  const {
    data: steps,
    onCreate: onCreateStep,
    onCreateLoading: onCreateStepLoading,
    onDelete: onDeleteStep,
    onDeleteLoading: onDeleteStepLoading,
  } = useStepsManagement({});

  const { onUpdate: onUpdateStep, onUpdateLoading: onUpdateStepLoading } =
    useStepManagement({ id: selectedStep?.id ?? "" });

  const stepFormLoading = selectedStep
    ? onUpdateStepLoading
    : onCreateStepLoading;

  const handleSelectStep = (step: StepsManagementDataModel) => {
    setSelectedStep((prev) => (prev?.id === step.id ? null : step));
  };

  const handleSubmitStep = async (
    payload: StepsManagementPayloadCreateModel,
  ) => {
    if (selectedStep) {
      try {
        await onUpdateStep({ id: selectedStep.id, payload });
        setSelectedStep(null);
      } catch {
        // handled by notification hook
      }
      return;
    }
    await onCreateStep(payload);
    setSelectedStep(null);
  };

  const handleDeleteStep = async () => {
    if (!selectedStep) return;
    try {
      await onDeleteStep(selectedStep.id);
      setSelectedStep(null);
    } catch {
      // handled by notification hook
    }
  };

  const filteredSteps = useMemo(() => {
    const query = stepQuery.trim().toLowerCase();
    if (!query) return steps ?? [];
    return (steps ?? []).filter((step) =>
      step.label.toLowerCase().includes(query),
    );
  }, [stepQuery, steps]);

  const childLabelById = useMemo(() => {
    const map = new Map<string, string>();
    (childSteps ?? []).forEach((child) => {
      map.set(child.id, child.label);
    });
    return map;
  }, [childSteps]);

  return (
    <div style={{ padding: "8px 4px" }}>
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <div>
          <Title level={3} style={{ marginBottom: 4 }}>
            Manajemen Steps
          </Title>
          <Text type="secondary">
            Buat dan kelola step detail yang terhubung ke kategori step.
          </Text>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={10}>
            <Card bodyStyle={{ padding: 20 }}>
              <Space direction="vertical" size={12} style={{ width: "100%" }}>
                <div>
                  <Title level={5} style={{ marginBottom: 4 }}>
                    Daftar Steps
                  </Title>
                  <Text type="secondary">
                    Pilih step untuk mengubah atau hapus data.
                  </Text>
                </div>
                <SearchBarComponent
                  placeholder="Cari step..."
                  handleChange={setStepQuery}
                />
              </Space>
              <Space
                direction="vertical"
                size={8}
                style={{ width: "100%", marginTop: 12 }}
              >
                {filteredSteps.length === 0 ? (
                  <Text type="secondary">Belum ada step.</Text>
                ) : null}
                {filteredSteps.map((step) => {
                  const isSelected = selectedStep?.id === step.id;
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
                      type="inner"
                      hoverable
                      onClick={() => handleSelectStep(step)}
                      bodyStyle={{ padding: "10px 12px" }}
                      style={{
                        borderColor: isSelected ? "#2f54eb" : "#e5e7eb",
                        background: isSelected ? "#e6f0ff" : "#f8fafc",
                        borderRadius: 10,
                        cursor: "pointer",
                      }}
                    >
                      <Space
                        direction="vertical"
                        size={4}
                        style={{ width: "100%" }}
                      >
                        <Title level={5} style={{ margin: 0 }}>
                          {step.label}
                        </Title>
                        {children.length > 0 || fallbackChildren.length > 0 ? (
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
                          <Tag color="default" style={{ alignSelf: "flex-start" }}>
                            Tanpa kategori
                          </Tag>
                        )}
                      </Space>
                    </Card>
                  );
                })}
              </Space>
            </Card>
          </Col>

          <Col xs={24} md={14}>
            <Card bodyStyle={{ padding: 20 }}>
              <Space direction="vertical" size={12} style={{ width: "100%" }}>
                <div>
                  <Title level={5} style={{ marginBottom: 4 }}>
                    Form Step
                  </Title>
                  <Text type="secondary">
                    Hubungkan step ke satu atau beberapa kategori step.
                  </Text>
                </div>
                <FormStepManagement
                  selectedStep={selectedStep}
                  childStepsData={childSteps ?? []}
                  onSubmit={handleSubmitStep}
                  onDelete={handleDeleteStep}
                  onCancel={() => setSelectedStep(null)}
                  loading={stepFormLoading}
                  deleteLoading={onDeleteStepLoading}
                />
              </Space>
            </Card>
          </Col>
        </Row>
      </Space>
    </div>
  );
}
