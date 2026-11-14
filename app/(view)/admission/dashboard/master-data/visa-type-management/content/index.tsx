"use client";

import { useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Empty,
  Flex,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Segmented,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import {
  AppstoreOutlined,
  BarsOutlined,
  DeleteOutlined,
  EditOutlined,
  GlobalOutlined,
  IdcardOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

import PageHeader from "@/app/components/common/page-header";
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
import { getCountryBadgeMeta } from "@/app/utils/student-helpers";
import CountryBadge from "@/app/components/common/country-badge";
import styles from "./visa-type-management.module.css";

const { Text, Title } = Typography;

type FormValues = {
  name: string;
  country_id: string;
};

function normalizeText(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function VisaTypeManagementContent() {
  const [form] = Form.useForm<FormValues>();

  const [keyword, setKeyword] = useState("");
  const [selectedCountryId, setSelectedCountryId] = useState<string>();
  const [sortBy, setSortBy] = useState<string>("name_asc");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
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

  const isFiltered =
    Boolean(keyword.trim()) ||
    Boolean(selectedCountryId) ||
    sortBy !== "name_asc";

  const resetFilter = () => {
    setKeyword("");
    setSelectedCountryId(undefined);
    setSortBy("name_asc");
  };

  const filteredVisaTypes = useMemo(() => {
    const search = normalizeText(keyword);

    return (visaTypesData ?? [])
      .filter((item) => {
        const countryName =
          item.country_name ?? countryNameById.get(item.country_id) ?? "";

        const matchKeyword =
          !search ||
          normalizeText(item.name).includes(search) ||
          normalizeText(countryName).includes(search);

        const matchCountry =
          !selectedCountryId || item.country_id === selectedCountryId;

        return matchKeyword && matchCountry;
      })
      .sort((a, b) => {
        const countryA =
          a.country_name ?? countryNameById.get(a.country_id) ?? "";
        const countryB =
          b.country_name ?? countryNameById.get(b.country_id) ?? "";

        if (sortBy === "name_asc") {
          return a.name.localeCompare(b.name, "id");
        }
        if (sortBy === "name_desc") {
          return b.name.localeCompare(a.name, "id");
        }
        if (sortBy === "country_asc") {
          const comp = countryA.localeCompare(countryB, "id");
          if (comp !== 0) return comp;
          return a.name.localeCompare(b.name, "id");
        }
        if (sortBy === "country_desc") {
          const comp = countryB.localeCompare(countryA, "id");
          if (comp !== 0) return comp;
          return a.name.localeCompare(b.name, "id");
        }
        if (sortBy === "newest") {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        }
        return 0;
      });
  }, [visaTypesData, keyword, selectedCountryId, countryNameById, sortBy]);

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
    const payloadBase = {
      name: values.name.trim(),
      country_id: values.country_id,
    };

    if (editingVisaType) {
      const payload: VisaTypeManagementPayloadUpdateModel = payloadBase;
      await onUpdate({ id: editingVisaType.id, payload });
      closeModal();
      return;
    }

    const payload: VisaTypeManagementPayloadCreateModel = payloadBase;
    await onCreate(payload);
    closeModal();
  };

  const handleDelete = async (id: string) => {
    await onDelete(id);
  };

  // Table Columns
  const columns: ColumnsType<VisaTypeManagementDataModel> = [
    {
      title: "Nama Jenis Visa",
      key: "name",
      render: (_, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "#eff6ff",
              color: "#1b3d6d",
              display: "grid",
              placeItems: "center",
              fontSize: 16,
              flexShrink: 0,
            }}
          >
            <IdcardOutlined />
          </div>
          <div>
            <Text strong style={{ display: "block", fontSize: 13.5, color: "#0f172a" }}>
              {record.name}
            </Text>
            <Text type="secondary" style={{ fontSize: 11.5 }}>
              ID: {record.id}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Negara Tujuan",
      key: "country",
      width: 220,
      render: (_, record) => {
        const countryName =
          record.country_name ??
          countryNameById.get(record.country_id) ??
          "Negara tidak ditemukan";

        return <CountryBadge countryName={countryName} />;
      },
    },
    {
      title: "Tanggal Dibuat",
      key: "created_at",
      width: 170,
      render: (_, record) => (
        <Text style={{ fontSize: 12.5, color: "#475569" }}>
          {formatDate(record.created_at)}
        </Text>
      ),
    },
    {
      title: "Aksi",
      key: "action",
      width: 150,
      align: "right",
      render: (_, record) => (
        <Space size={6}>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
            style={{
              borderRadius: 8,
              fontWeight: 600,
              color: "#1b3d6d",
              borderColor: "#bfdbfe",
              background: "#eff6ff",
            }}
          >
            Edit
          </Button>

          <Popconfirm
            title="Arsipkan jenis visa ini?"
            description={`Data tidak akan muncul pada pilihan pengajuan visa siswa baru.`}
            okText="Ya, Arsipkan"
            cancelText="Batal"
            okButtonProps={{
              danger: true,
              loading: onDeleteLoading,
            }}
            onConfirm={() => handleDelete(record.id)}
          >
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
              style={{
                borderRadius: 8,
                fontWeight: 600,
              }}
            >
              Hapus
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.pageContainer}>
      {/* Standard Executive PageHeader */}
      <PageHeader
        title="Visa Type Management"
        subtitle="Kelola kategori dan persyaratan tipe visa studi"
        icon={<IdcardOutlined />}
        onAddNew={openCreateModal}
        addNewText="Add Visa Type"
      />

      {/* KPI Metric Cards Grid */}
      <div className={styles.metricCardsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricTitle}>Total Visa Types</div>
          <div className={styles.metricNumber}>{visaTypesData.length}</div>
          <div className={styles.metricSubtitle} style={{ color: "#16a34a", fontWeight: 600 }}>
            {filteredVisaTypes.length} active types
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricTitle}>Configured Countries</div>
          <div className={styles.metricNumber}>{countryOptions.length}</div>
          <div className={styles.metricSubtitle}>Target countries configured</div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricTitle}>Filtered Results</div>
          <div className={styles.metricNumber}>{filteredVisaTypes.length}</div>
          <div className={styles.metricSubtitle}>Visa types displayed</div>
        </div>
      </div>

      {/* Main Table Container Card */}
      <div className={styles.mainCard}>
        {/* Filter and Control Bar */}
        <div className={styles.toolbarRow}>
          <div className={styles.toolbarLeft}>
            <Input
              allowClear
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search visa type..."
              prefix={<SearchOutlined style={{ color: "#94a3b8", fontSize: 13 }} />}
              className={styles.searchInput}
            />

            <Select
              allowClear
              value={selectedCountryId}
              onChange={(v) => setSelectedCountryId(v)}
              placeholder="Filter Country"
              options={countryOptions}
              showSearch
              optionFilterProp="label"
              className={styles.filterSelect}
            />

            <Select
              value={sortBy}
              onChange={(v) => setSortBy(v)}
              className={styles.sortSelect}
              options={[
                { value: "name_asc", label: "Name A - Z" },
                { value: "name_desc", label: "Name Z - A" },
                { value: "country_asc", label: "Country A - Z" },
                { value: "country_desc", label: "Country Z - A" },
                { value: "newest", label: "Newest Added" },
              ]}
            />

            {isFiltered && (
              <Button
                onClick={resetFilter}
                style={{
                  height: 34,
                  borderRadius: 8,
                  color: "#ef4444",
                  borderColor: "#fecdd3",
                  fontWeight: 600,
                  fontSize: 12,
                }}
              >
                Reset
              </Button>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 13, color: "#64748b" }}>
              Showing <strong>{filteredVisaTypes.length}</strong> visa types
            </span>

            <Segmented
              value={viewMode}
              onChange={(val) => setViewMode(val as "table" | "grid")}
              options={[
                {
                  value: "table",
                  label: "Table",
                  icon: <BarsOutlined style={{ fontSize: 13 }} />,
                },
                {
                  value: "grid",
                  label: "Cards",
                  icon: <AppstoreOutlined style={{ fontSize: 13 }} />,
                },
              ]}
              style={{
                background: "#f1f5f9",
                borderRadius: 10,
                padding: 3,
                height: 40,
                display: "flex",
                alignItems: "center",
              }}
            />
          </div>
        </div>

        {/* View: Table or Grid */}
        {viewMode === "table" ? (
          <Table<VisaTypeManagementDataModel>
            columns={columns}
            dataSource={filteredVisaTypes}
            rowKey="id"
            loading={fetchLoading}
            scroll={{ x: "max-content" }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50"],
              showTotal: (total) => `Total ${total} jenis visa`,
            }}
            locale={{
              emptyText: (
                <Empty description="Belum ada tipe visa yang sesuai filter." />
              ),
            }}
          />
        ) : (
          <Row gutter={[14, 14]}>
            {filteredVisaTypes.length === 0 ? (
              <Col span={24}>
                <Empty description="Belum ada tipe visa yang sesuai filter." />
              </Col>
            ) : (
              filteredVisaTypes.map((item) => {
                const countryName =
                  item.country_name ??
                  countryNameById.get(item.country_id) ??
                  "Negara tidak ditemukan";

                return (
                  <Col key={item.id} xs={24} sm={12} lg={8}>
                    <div
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: 14,
                        padding: 18,
                        background: "#ffffff",
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
                        transition: "all 0.18s ease",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        <CountryBadge countryName={countryName} />

                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: "#eff6ff",
                            color: "#1b3d6d",
                            display: "grid",
                            placeItems: "center",
                            fontSize: 15,
                          }}
                        >
                          <IdcardOutlined />
                        </div>
                      </div>

                      <div>
                        <Text strong style={{ fontSize: 14, color: "#0f172a" }}>
                          {item.name}
                        </Text>
                        <Text
                          type="secondary"
                          style={{ display: "block", fontSize: 11.5, marginTop: 2 }}
                        >
                          ID: {item.id}
                        </Text>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          borderTop: "1px solid #f1f5f9",
                          paddingTop: 10,
                          marginTop: 4,
                        }}
                      >
                        <Text type="secondary" style={{ fontSize: 11.5 }}>
                          {formatDate(item.created_at)}
                        </Text>

                        <Space size={6}>
                          <Button
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => openEditModal(item)}
                            style={{
                              borderRadius: 8,
                              fontWeight: 600,
                              color: "#1b3d6d",
                              background: "#eff6ff",
                              borderColor: "#bfdbfe",
                            }}
                          >
                            Edit
                          </Button>

                          <Popconfirm
                            title="Hapus tipe visa ini?"
                            okText="Hapus"
                            cancelText="Batal"
                            okButtonProps={{ danger: true, loading: onDeleteLoading }}
                            onConfirm={() => handleDelete(item.id)}
                          >
                            <Button
                              danger
                              size="small"
                              icon={<DeleteOutlined />}
                              style={{ borderRadius: 8 }}
                            />
                          </Popconfirm>
                        </Space>
                      </div>
                    </div>
                  </Col>
                );
              })
            )}
          </Row>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        open={isModalOpen}
        onCancel={closeModal}
        title={
          <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
            {editingVisaType ? "Edit Visa Type" : "Add Visa Type"}
          </div>
        }
        okText={editingVisaType ? "Save Changes" : "Save Visa Type"}
        cancelText="Cancel"
        okButtonProps={{
          style: {
            background: "#1b3d6d",
            borderColor: "#1b3d6d",
            borderRadius: 8,
            fontWeight: 600,
          },
        }}
        cancelButtonProps={{
          style: { borderRadius: 8 },
        }}
        confirmLoading={onCreateLoading || onUpdateLoading}
        onOk={() => form.submit()}
        destroyOnHidden
        centered
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark={false}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            label="Visa Type Name"
            name="name"
            tooltip="Nama resmi kategori atau jenis visa tujuan studi."
            rules={[
              {
                required: true,
                message: "Silakan masukkan nama jenis visa",
              },
            ]}
          >
            <Input
              placeholder="Contoh: Student Visa Subclass 500"
              size="large"
              style={{ borderRadius: 10 }}
            />
          </Form.Item>

          <Form.Item
            label="Destination Country"
            name="country_id"
            tooltip="Negara yang memberlakukan jenis visa ini."
            rules={[
              {
                required: true,
                message: "Silakan pilih negara tujuan",
              },
            ]}
          >
            <Select
              placeholder="Pilih negara tujuan"
              size="large"
              showSearch
              optionFilterProp="label"
              options={countryOptions}
              style={{ width: "100%", borderRadius: 10 }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
