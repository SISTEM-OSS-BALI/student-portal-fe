"use client";

import { useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Flex,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  GlobalOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";

import {
  useCreateVisaType,
  useDeleteVisaType,
  useUpdateVisaType,
  useVisaTypes,
} from "@/app/hooks/use-visa-type-management";
import { useCountriesManagement } from "@/app/hooks/use-country-management";
import type {
  VisaTypeManagementDataModel,
  VisaTypeManagementPayloadCreateModel,
  VisaTypeManagementPayloadUpdateModel,
} from "@/app/models/visa-type-management";
import type { CountryManagementDataModel } from "@/app/models/country-management";

const { Title, Text } = Typography;

type FormValues = {
  name: string;
  country_id: string;
};

function normalizeText(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

export default function VisaTypeManagementContent() {
  const [form] = Form.useForm<FormValues>();

  const [keyword, setKeyword] = useState("");
  const [selectedCountryId, setSelectedCountryId] = useState<string>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVisaType, setEditingVisaType] =
    useState<VisaTypeManagementDataModel | null>(null);

  const { data: visaTypesData = [], fetchLoading } = useVisaTypes({});
  const { data: countriesData = [] } = useCountriesManagement({});

  const { onCreate, onCreateLoading } = useCreateVisaType();
  const { onUpdate, onUpdateLoading } = useUpdateVisaType();
  const { onDelete, onDeleteLoading } = useDeleteVisaType();

  const countryOptions = useMemo(() => {
    return (countriesData ?? []).map((country: CountryManagementDataModel) => ({
      value: country.id,
      label: country.name ?? "-",
    }));
  }, [countriesData]);

  const countryNameById = useMemo(() => {
    const map = new Map<string, string>();

    for (const country of countriesData ?? []) {
      const id = String(country.id ?? "");
      const name = String(country.name ?? "-");

      if (id) {
        map.set(id, name);
      }
    }

    return map;
  }, [countriesData]);

  const filteredVisaTypes = useMemo(() => {
    const search = normalizeText(keyword);

    return (visaTypesData ?? []).filter((item) => {
      const countryName =
        item.country_name ?? countryNameById.get(item.country_id) ?? "";

      const matchKeyword =
        !search ||
        normalizeText(item.name).includes(search) ||
        normalizeText(countryName).includes(search);

      const matchCountry =
        !selectedCountryId || item.country_id === selectedCountryId;

      return matchKeyword && matchCountry;
    });
  }, [visaTypesData, keyword, selectedCountryId, countryNameById]);

  const openCreateModal = () => {
    setEditingVisaType(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const openEditModal = (item: VisaTypeManagementDataModel) => {
    setEditingVisaType(item);
    form.setFieldsValue({
      name: item.name,
      country_id: item.country_id,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingVisaType(null);
    form.resetFields();
  };

  const handleSubmit = async (values: FormValues) => {
    if (editingVisaType) {
      const payload: VisaTypeManagementPayloadUpdateModel = {
        name: values.name,
        country_id: values.country_id,
      };

      await onUpdate({
        id: editingVisaType.id,
        payload,
      });

      closeModal();
      return;
    }

    const payload: VisaTypeManagementPayloadCreateModel = {
      name: values.name,
      country_id: values.country_id,
    };

    await onCreate(payload);
    closeModal();
  };

  const handleDelete = async (id: string) => {
    await onDelete(id);
  };

  const resetFilter = () => {
    setKeyword("");
    setSelectedCountryId(undefined);
  };

  return (
    <div style={{ padding: "8px 4px" }}>
      <Space direction="vertical" size={18} style={{ width: "100%" }}>
        <Card
          bodyStyle={{ padding: 24 }}
          style={{
            borderRadius: 28,
            border: "1px solid #e5e7eb",
            background:
              "linear-gradient(135deg, #ffffff 0%, #f8fbff 45%, #eef4ff 100%)",
            boxShadow: "0 20px 45px rgba(15, 23, 42, 0.06)",
          }}
        >
          <Flex justify="space-between" align="flex-start" gap={20} wrap>
            <div>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 18,
                  display: "grid",
                  placeItems: "center",
                  color: "#4338ca",
                  background: "#eef2ff",
                  marginBottom: 14,
                  fontSize: 24,
                }}
              >
                <GlobalOutlined />
              </div>

              <Title level={3} style={{ margin: 0, color: "#101828" }}>
                Visa Type Management
              </Title>

              <Text
                style={{
                  display: "block",
                  marginTop: 8,
                  color: "#667085",
                  fontSize: 15,
                  lineHeight: 1.7,
                  maxWidth: 660,
                }}
              >
                Kelola jenis visa berdasarkan negara. Data ini dapat digunakan
                untuk filtering student, pipeline admission, dan kebutuhan
                dokumen berdasarkan tujuan negara.
              </Text>
            </div>

            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={openCreateModal}
              style={{
                height: 48,
                borderRadius: 16,
                fontWeight: 700,
                background: "linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)",
                boxShadow: "0 14px 26px rgba(79, 70, 229, 0.22)",
              }}
            >
              Create Visa Type
            </Button>
          </Flex>

          <Row gutter={[12, 12]} style={{ marginTop: 24 }}>
            <Col xs={24} md={12} lg={14}>
              <Input
                allowClear
                size="large"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Cari visa type atau nama negara..."
                prefix={<SearchOutlined style={{ color: "#667085" }} />}
                style={{
                  height: 48,
                  borderRadius: 16,
                  background: "#ffffff",
                }}
              />
            </Col>

            <Col xs={24} md={8} lg={6}>
              <Select
                allowClear
                size="large"
                value={selectedCountryId}
                onChange={(value) => setSelectedCountryId(value)}
                placeholder="Filter negara"
                options={countryOptions}
                showSearch
                optionFilterProp="label"
                style={{ width: "100%" }}
              />
            </Col>

            <Col xs={24} md={4} lg={4}>
              <Button
                size="large"
                onClick={resetFilter}
                style={{
                  width: "100%",
                  height: 48,
                  borderRadius: 16,
                  fontWeight: 600,
                }}
              >
                Reset
              </Button>
            </Col>
          </Row>
        </Card>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Card
              bodyStyle={{ padding: 18 }}
              style={{
                borderRadius: 22,
                borderColor: "#e5e7eb",
              }}
            >
              <Text type="secondary">Total Visa Type</Text>
              <div
                style={{
                  marginTop: 8,
                  fontSize: 34,
                  lineHeight: 1,
                  fontWeight: 800,
                  color: "#111827",
                }}
              >
                {visaTypesData.length}
              </div>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card
              bodyStyle={{ padding: 18 }}
              style={{
                borderRadius: 22,
                borderColor: "#e5e7eb",
              }}
            >
              <Text type="secondary">Hasil Filter</Text>
              <div
                style={{
                  marginTop: 8,
                  fontSize: 34,
                  lineHeight: 1,
                  fontWeight: 800,
                  color: "#111827",
                }}
              >
                {filteredVisaTypes.length}
              </div>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card
              bodyStyle={{ padding: 18 }}
              style={{
                borderRadius: 22,
                borderColor: "#e5e7eb",
              }}
            >
              <Text type="secondary">Negara Tersedia</Text>
              <div
                style={{
                  marginTop: 8,
                  fontSize: 34,
                  lineHeight: 1,
                  fontWeight: 800,
                  color: "#111827",
                }}
              >
                {countryOptions.length}
              </div>
            </Card>
          </Col>
        </Row>

        <Card
          title={
            <Space size={10}>
              <span>Daftar Visa Type</span>
              <Tag color="blue">{filteredVisaTypes.length} data</Tag>
            </Space>
          }
          bodyStyle={{ padding: 18 }}
          style={{
            borderRadius: 24,
            border: "1px solid #e5e7eb",
            boxShadow: "0 12px 30px rgba(15, 23, 42, 0.04)",
          }}
        >
          {fetchLoading ? (
            <div
              style={{
                minHeight: 260,
                display: "grid",
                placeItems: "center",
              }}
            >
              <Spin tip="Memuat visa type..." />
            </div>
          ) : filteredVisaTypes.length === 0 ? (
            <Empty description="Belum ada visa type yang sesuai filter." />
          ) : (
            <Row gutter={[14, 14]}>
              {filteredVisaTypes.map((item) => {
                const countryName =
                  item.country_name ??
                  countryNameById.get(item.country_id) ??
                  "Negara tidak ditemukan";

                return (
                  <Col key={item.id} xs={24} md={12} xl={8}>
                    <Card
                      hoverable
                      bodyStyle={{ padding: 18 }}
                      style={{
                        height: "100%",
                        borderRadius: 20,
                        border: "1px solid #e5e7eb",
                        background:
                          "linear-gradient(180deg, #ffffff 0%, #fbfcff 100%)",
                      }}
                    >
                      <Flex justify="space-between" align="flex-start" gap={14}>
                        <div style={{ minWidth: 0 }}>
                          <Tag
                            color="geekblue"
                            style={{
                              borderRadius: 999,
                              marginBottom: 10,
                              fontWeight: 600,
                            }}
                          >
                            {countryName}
                          </Tag>

                          <Title
                            level={5}
                            style={{
                              margin: 0,
                              color: "#111827",
                              lineHeight: 1.4,
                            }}
                          >
                            {item.name}
                          </Title>

                          <Text
                            type="secondary"
                            style={{
                              display: "block",
                              marginTop: 8,
                              fontSize: 12,
                            }}
                          >
                            ID: {item.id}
                          </Text>
                        </div>

                        <div
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: 14,
                            background: "#eef2ff",
                            color: "#4338ca",
                            display: "grid",
                            placeItems: "center",
                            flexShrink: 0,
                            fontSize: 18,
                          }}
                        >
                          <GlobalOutlined />
                        </div>
                      </Flex>

                      <Divider style={{ margin: "16px 0 12px" }} />

                      <Flex justify="space-between" align="center" gap={10}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {item.created_at
                            ? `Created: ${new Date(
                                item.created_at,
                              ).toLocaleDateString("id-ID")}`
                            : "Created: -"}
                        </Text>

                        <Space size={8}>
                          <Button
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => openEditModal(item)}
                            style={{
                              borderRadius: 999,
                              fontWeight: 600,
                            }}
                          >
                            Edit
                          </Button>

                          <Popconfirm
                            title="Hapus visa type?"
                            description={`Visa type "${item.name}" akan dihapus.`}
                            okText="Ya, hapus"
                            cancelText="Batal"
                            okButtonProps={{
                              danger: true,
                              loading: onDeleteLoading,
                            }}
                            onConfirm={() => handleDelete(item.id)}
                          >
                            <Button
                              danger
                              size="small"
                              icon={<DeleteOutlined />}
                              style={{
                                borderRadius: 999,
                                fontWeight: 600,
                              }}
                            >
                              Delete
                            </Button>
                          </Popconfirm>
                        </Space>
                      </Flex>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          )}
        </Card>
      </Space>

      <Modal
        open={isModalOpen}
        onCancel={closeModal}
        title={editingVisaType ? "Edit Visa Type" : "Create Visa Type"}
        okText={editingVisaType ? "Update" : "Create"}
        cancelText="Batal"
        confirmLoading={onCreateLoading || onUpdateLoading}
        onOk={() => form.submit()}
        destroyOnHidden
        centered
        styles={{
          body: {
            paddingTop: 18,
          },
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark={false}
        >
          <Form.Item
            label="Nama Visa Type"
            name="name"
            rules={[
              {
                required: true,
                message: "Nama visa type wajib diisi.",
              },
            ]}
          >
            <Input
              placeholder="Contoh: Student Visa, Working Holiday Visa"
              size="large"
              style={{ borderRadius: 12 }}
            />
          </Form.Item>

          <Form.Item
            label="Negara"
            name="country_id"
            rules={[
              {
                required: true,
                message: "Negara wajib dipilih.",
              },
            ]}
          >
            <Select
              placeholder="Pilih negara"
              size="large"
              showSearch
              optionFilterProp="label"
              options={countryOptions}
              style={{ width: "100%" }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
