"use client";

import {
  App,
  Button,
  Card,
  Col,
  Empty,
  Input,
  Row,
  Segmented,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import ModalCountryComponent from "./ModalCountryComponent";
import { useCallback, useMemo, useState } from "react";
import type {
  CountryManagementDataModel,
  CountryManagementPayloadCreateModel,
} from "@/app/models/country-management";
import {
  useCountriesManagement,
  useCountryManagement,
} from "@/app/hooks/use-country-management";
import dayjs from "dayjs";
import {
  AppstoreOutlined,
  BarsOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  GlobalOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import ModalConfirm from "@/app/components/common/modal-confirm";
import PageHeader from "@/app/components/common/page-header";
import CountryFlag from "@/app/components/common/country-flag";
import { useRouter } from "next/navigation";

export default function StagesManagementContent() {
  const { notification } = App.useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] =
    useState<CountryManagementDataModel | null>(null);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const router = useRouter();

  const {
    data: countries,
    onCreate,
    onCreateLoading,
    onDelete,
    onDeleteLoading,
  } = useCountriesManagement({});

  const { onUpdate, onUpdateLoading } = useCountryManagement({
    id: selectedCountry?.id ?? "",
  });

  const filteredCountries = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return countries ?? [];
    return (countries ?? []).filter((country) =>
      country.name.toLowerCase().includes(term),
    );
  }, [countries, searchTerm]);

  const openCreateModal = useCallback(() => {
    setSelectedCountry(null);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedCountry(null);
  }, []);

  const handleSubmit = useCallback(
    async (values: CountryManagementPayloadCreateModel) => {
      if (selectedCountry) {
        await onUpdate({ id: selectedCountry.id, payload: values });
      } else {
        await onCreate(values);
      }
      closeModal();
    },
    [closeModal, onCreate, onUpdate, selectedCountry],
  );

  const handleEditCountry = useCallback(
    (country: CountryManagementDataModel) => {
      setSelectedCountry(country);
      setIsModalOpen(true);
    },
    [],
  );

  const confirmDeleteCountry = useCallback(
    (country: CountryManagementDataModel, onDone?: () => void) => {
      const documentTotal = Number(country.document_total ?? 0);
      const stepTotal = Number(country.step_total ?? 0);
      if (documentTotal > 0 || stepTotal > 0) {
        notification.warning({
          message: "Tidak bisa hapus negara",
          description:
            "Negara ini masih terhubung dengan data lain (seperti dokumen atau langkah).",
        });
        return;
      }
      ModalConfirm({
        title: country.name,
        description: `ID: ${country.id}`,
        actions: "hapus",
        onOk: async () => {
          setDeletingId(country.id);
          try {
            await onDelete(country.id);
            onDone?.();
          } catch (err) {
            const message =
              err && typeof err === "object" && "message" in err
                ? String((err as { message?: unknown }).message)
                : "Terjadi kesalahan saat menghapus negara.";
            notification.error({
              message: "Gagal menghapus negara",
              description: message,
            });
          } finally {
            setDeletingId(null);
          }
        },
      });
    },
    [notification, onDelete],
  );

  const handleDeleteCountry = useCallback(
    (country: CountryManagementDataModel) => {
      confirmDeleteCountry(country);
    },
    [confirmDeleteCountry],
  );

  const handleDeleteSelected = useCallback(() => {
    if (!selectedCountry) return;
    confirmDeleteCountry(selectedCountry, closeModal);
  }, [closeModal, confirmDeleteCountry, selectedCountry]);

  const goToDetailCountry = useCallback(
    (country_id: string | number) => {
      router.push(`/admission/dashboard/stages-management/${country_id}`);
    },
    [router],
  );

  const tableColumns = useMemo(
    () => [
      {
        title: "Negara",
        dataIndex: "name",
        key: "name",
        render: (text: string, record: CountryManagementDataModel) => (
          <Space align="center" size={10}>
            <CountryFlag countryName={text} width={28} height={18} borderRadius={4} />
            <Typography.Text
              strong
              style={{
                cursor: "pointer",
                color: "#1b3d6d",
                fontSize: 14,
              }}
              onClick={() => goToDetailCountry(record.id)}
            >
              {text}
            </Typography.Text>
          </Space>
        ),
      },
      {
        title: "Total Dokumen",
        dataIndex: "document_total",
        key: "document_total",
        width: 170,
        render: (val: number) => (
          <Tag color="blue" style={{ borderRadius: 6, fontWeight: 500 }}>
            {val ?? 0} Dokumen
          </Tag>
        ),
      },
      {
        title: "Total Langkah",
        dataIndex: "step_total",
        key: "step_total",
        width: 170,
        render: (val: number) => (
          <Tag color="gold" style={{ borderRadius: 6, fontWeight: 500 }}>
            {val ?? 0} Langkah
          </Tag>
        ),
      },
      {
        title: "Terakhir Diperbarui",
        dataIndex: "updated_at",
        key: "updated_at",
        width: 190,
        render: (val: string) => (
          <Typography.Text style={{ fontSize: 13, color: "#64748b" }}>
            {val ? dayjs(val).format("DD/MM/YYYY, HH:mm") : "-"}
          </Typography.Text>
        ),
      },
      {
        title: "Aksi",
        key: "action",
        width: 180,
        align: "right" as const,
        render: (_: unknown, record: CountryManagementDataModel) => (
          <Space size={8}>
            <Button
              size="small"
              type="primary"
              ghost
              icon={<EyeOutlined />}
              onClick={() => goToDetailCountry(record.id)}
              style={{ borderRadius: 8, fontSize: 12, height: 30 }}
            >
              Detail
            </Button>
            <Button
              size="small"
              onClick={() => handleEditCountry(record)}
              icon={<EditOutlined />}
              style={{ borderRadius: 8, height: 30 }}
            />
            <Button
              size="small"
              danger
              loading={deletingId === record.id && onDeleteLoading}
              onClick={() => handleDeleteCountry(record)}
              icon={<DeleteOutlined />}
              style={{ borderRadius: 8, height: 30 }}
            />
          </Space>
        ),
      },
    ],
    [
      deletingId,
      goToDetailCountry,
      handleDeleteCountry,
      handleEditCountry,
      onDeleteLoading,
    ],
  );

  return (
    <div>
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <PageHeader
          title="Stage Management"
          subtitle="Konfigurasi dokumen dan alur tahapan negara"
          icon={<GlobalOutlined />}
          onAddNew={openCreateModal}
          addNewText="Add Country"
        />

        {/* Toolbar Controls */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            background: "#ffffff",
            padding: "12px 16px",
            borderRadius: 14,
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
              flex: 1,
            }}
          >
            <Input
              allowClear
              placeholder="Search destination country..."
              prefix={<SearchOutlined style={{ color: "#94a3b8", fontSize: 13 }} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: 280,
                maxWidth: "100%",
                borderRadius: 8,
                height: 34,
                fontSize: 12.5,
                borderColor: "#e2e8f0",
                background: "#ffffff",
              }}
            />

            <Segmented
              value={viewMode}
              onChange={(val) => setViewMode(val as "card" | "table")}
              options={[
                {
                  value: "card",
                  label: "Cards",
                  icon: <AppstoreOutlined style={{ fontSize: 13 }} />,
                },
                {
                  value: "table",
                  label: "Table",
                  icon: <BarsOutlined style={{ fontSize: 13 }} />,
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

          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "#64748b" }}>
              Showing <strong>{filteredCountries.length}</strong> countries
            </span>
          </div>
        </div>

        {/* View Mode: Card Grid or Table */}
        {filteredCountries.length === 0 ? (
          <div
            style={{
              padding: "48px 24px",
              textAlign: "center",
              background: "#ffffff",
              borderRadius: 16,
              border: "1px dashed #cbd5e1",
            }}
          >
            <Empty
              description={
                searchTerm
                  ? "Tidak ada negara yang sesuai dengan kata kunci pencarian"
                  : "Belum ada data negara terdaftar"
              }
            />
          </div>
        ) : viewMode === "table" ? (
          <div
            style={{
              background: "#ffffff",
              borderRadius: 16,
              border: "1px solid #e2e8f0",
              overflow: "hidden",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
            }}
          >
            <Table<CountryManagementDataModel>
              rowKey="id"
              dataSource={filteredCountries}
              columns={tableColumns}
              scroll={{ x: "max-content" }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                pageSizeOptions: ["10", "20", "50"],
                showTotal: (total) => `Total ${total} negara`,
              }}
            />
          </div>
        ) : (
          <Row gutter={[14, 14]}>
            {filteredCountries.map((country) => (
              <Col key={country.id} xs={24} sm={12} lg={8}>
                <div
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 14,
                    padding: 16,
                    background: "#ffffff",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
                    transition: "all 0.18s ease",
                  }}
                >
                  {/* Header: Flag + Country Name */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        cursor: "pointer",
                        minWidth: 0,
                        flex: 1,
                      }}
                      onClick={() => goToDetailCountry(country.id)}
                    >
                      <CountryFlag
                        countryName={country.name}
                        width={26}
                        height={17}
                        borderRadius={4}
                      />
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: 14,
                          color: "#0f172a",
                          lineHeight: 1.3,
                          wordBreak: "break-word",
                        }}
                      >
                        {country.name}
                      </span>
                    </div>
                  </div>

                  {/* Badges: Document & Step counts */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      flexWrap: "wrap",
                    }}
                  >
                    <Tag
                      style={{
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 600,
                        background: "#eff6ff",
                        color: "#1d4ed8",
                        border: "1px solid #dbeafe",
                        margin: 0,
                        padding: "1px 7px",
                        height: 22,
                        lineHeight: "20px",
                      }}
                    >
                      {country.document_total ?? 0} Dokumen
                    </Tag>
                    <Tag
                      style={{
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 600,
                        background: "#fefce8",
                        color: "#854d0e",
                        border: "1px solid #fef08a",
                        margin: 0,
                        padding: "1px 7px",
                        height: 22,
                        lineHeight: "20px",
                      }}
                    >
                      {country.step_total ?? 0} Langkah
                    </Tag>
                  </div>

                  {/* Footer: Updated at & Actions */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderTop: "1px solid #f1f5f9",
                      paddingTop: 10,
                      gap: 8,
                    }}
                  >
                    <span style={{ fontSize: 11.5, color: "#64748b" }}>
                      {country.updated_at
                        ? dayjs(country.updated_at).format("DD/MM/YYYY, HH:mm")
                        : "-"}
                    </span>

                    <Space size={6} style={{ flexShrink: 0 }}>
                      <Button
                        size="small"
                        type="primary"
                        ghost
                        icon={<EyeOutlined />}
                        onClick={() => goToDetailCountry(country.id)}
                        style={{
                          borderRadius: 7,
                          fontSize: 11.5,
                          fontWeight: 600,
                          height: 28,
                          background: "#eff6ff",
                          borderColor: "#bfdbfe",
                          color: "#1d4ed8",
                        }}
                      >
                        Detail
                      </Button>
                      <Button
                        size="small"
                        onClick={() => handleEditCountry(country)}
                        icon={<EditOutlined style={{ fontSize: 12 }} />}
                        style={{ borderRadius: 7, height: 28, width: 28 }}
                        title="Edit"
                      />
                      <Button
                        size="small"
                        danger
                        loading={deletingId === country.id && onDeleteLoading}
                        onClick={() => handleDeleteCountry(country)}
                        icon={<DeleteOutlined style={{ fontSize: 12.5 }} />}
                        style={{ borderRadius: 7, height: 28, width: 28 }}
                        title="Hapus"
                      />
                    </Space>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        )}

        <div>
          <ModalCountryComponent
            open={isModalOpen}
            onCancelModal={closeModal}
            onSubmit={handleSubmit}
            onDelete={handleDeleteSelected}
            onCancel={closeModal}
            loading={selectedCountry ? onUpdateLoading : onCreateLoading}
            deleteLoading={onDeleteLoading}
            selectedCountry={selectedCountry}
          />
        </div>
      </Space>
    </div>
  );
}
