import { Card, Col, Row, Space, Tag, Typography } from "antd";
import { useMemo, useState } from "react";
import SearchBarComponent from "@/app/components/common/search-bar";
import FormChildStepManagement from "./FormChildStepManagement";
import {
  useChildStepManagement,
  useChildStepsManagement,
} from "@/app/hooks/use-child-steps-management";
import type {
  ChildStepsManagementDataModel,
  ChildStepsManagementPayloadCreateModel,
} from "@/app/models/child-steps-management";

const { Text, Title } = Typography;

export default function ChildStepsManagementContent() {
  const [selectedChild, setSelectedChild] =
    useState<ChildStepsManagementDataModel | null>(null);
  const [childQuery, setChildQuery] = useState("");

  const {
    data: childSteps,
    onCreate: onCreateChild,
    onCreateLoading: onCreateChildLoading,
    onDelete: onDeleteChild,
    onDeleteLoading: onDeleteChildLoading,
  } = useChildStepsManagement({});

  const { onUpdate: onUpdateChild, onUpdateLoading: onUpdateChildLoading } =
    useChildStepManagement({ id: selectedChild?.id ?? "" });

  const childFormLoading = selectedChild
    ? onUpdateChildLoading
    : onCreateChildLoading;

  const handleSelectChild = (child: ChildStepsManagementDataModel) => {
    setSelectedChild((prev) => (prev?.id === child.id ? null : child));
  };

  const handleSubmitChild = async (
    payload: ChildStepsManagementPayloadCreateModel,
  ) => {
    if (selectedChild) {
      try {
        await onUpdateChild({ id: selectedChild.id, payload });
        setSelectedChild(null);
      } catch {
        // handled by notification hook
      }
      return;
    }
    await onCreateChild(payload);
    setSelectedChild(null);
  };

  const handleDeleteChild = async () => {
    if (!selectedChild) return;
    try {
      await onDeleteChild(selectedChild.id);
      setSelectedChild(null);
    } catch {
      // handled by notification hook
    }
  };

  const filteredChildSteps = useMemo(() => {
    const query = childQuery.trim().toLowerCase();
    if (!query) return childSteps ?? [];
    return (childSteps ?? []).filter((child) =>
      child.label.toLowerCase().includes(query),
    );
  }, [childQuery, childSteps]);

  return (
    <div style={{ padding: "8px 4px" }}>
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <div>
          <Title level={3} style={{ marginBottom: 4 }}>
            Manajemen Kategori Step
          </Title>
          <Text type="secondary">
            Kelola kategori besar untuk mengelompokkan step.
          </Text>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={10}>
            <Card bodyStyle={{ padding: 20 }}>
              <Space direction="vertical" size={12} style={{ width: "100%" }}>
                <div>
                  <Title level={5} style={{ marginBottom: 4 }}>
                    Daftar Kategori Step
                  </Title>
                  <Text type="secondary">
                    Pilih kategori untuk mengubah atau hapus data.
                  </Text>
                </div>
                <SearchBarComponent
                  placeholder="Cari kategori step..."
                  handleChange={setChildQuery}
                />
              </Space>
              <Space
                direction="vertical"
                size={8}
                style={{ width: "100%", marginTop: 12 }}
              >
                {filteredChildSteps.length === 0 ? (
                  <Text type="secondary">Belum ada kategori step.</Text>
                ) : null}
                {filteredChildSteps.map((child) => {
                  const isSelected = selectedChild?.id === child.id;
                  const totalSteps = child.steps?.length ?? 0;
                  return (
                    <Card
                      key={child.id}
                      type="inner"
                      hoverable
                      onClick={() => handleSelectChild(child)}
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
                          {child.label}
                        </Title>
                        {/* <Tag
                          color={totalSteps > 0 ? "blue" : "default"}
                          style={{ alignSelf: "flex-start" }}
                        >
                          {totalSteps} steps
                        </Tag> */}
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
                    Form Kategori Step
                  </Title>
                  <Text type="secondary">
                    Tambahkan atau ubah kategori untuk mengelompokkan step.
                  </Text>
                </div>
                <FormChildStepManagement
                  selectedChild={selectedChild}
                  onSubmit={handleSubmitChild}
                  onDelete={handleDeleteChild}
                  onCancel={() => setSelectedChild(null)}
                  loading={childFormLoading}
                  deleteLoading={onDeleteChildLoading}
                />
              </Space>
            </Card>
          </Col>
        </Row>
      </Space>
    </div>
  );
}
