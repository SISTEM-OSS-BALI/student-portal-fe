"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  App,
  Button,
  Card,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Tag,
  Typography,
} from "antd";
import type { SelectProps } from "antd";
import {
  ExclamationCircleOutlined,
  GlobalOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import PageHeader from "@/app/components/common/page-header";

import { useCountriesManagement } from "@/app/hooks/use-country-management";
import { useInformationCountries } from "@/app/hooks/use-information-country-management";
import type {
  InformationCountryDataModel,
  InformationCountryPayloadCreateModel,
  InformationCountryPayloadUpdateModel,
} from "@/app/models/information-country-management";
import styles from "./info-card.module.css";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

type InformationFormValues = {
  title: string;
  slug: string;
  priority: string;
  country_id: string;
  description?: string;
};

type OptionItem = {
  value: string;
  label: string;
};

const priorityOptions: OptionItem[] = [
  { value: "high", label: "High Priority" },
  { value: "medium", label: "Medium Priority" },
  { value: "normal", label: "Normal Priority" },
  { value: "low", label: "Low Priority" },
];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 25);
}

function formatPriorityLabel(value?: string): string {
  switch (String(value ?? "").toLowerCase()) {
    case "high":
      return "High Priority";
    case "medium":
      return "Medium Priority";
    case "low":
      return "Low Priority";
    default:
      return "Normal Priority";
  }
}

function getPriorityTagStyle(value?: string) {
  switch (String(value ?? "").toLowerCase()) {
    case "high":
      return {
        color: "#c2410c",
        background: "#fff1f2",
        borderColor: "#fecdd3",
      };
    case "medium":
      return {
        color: "#b45309",
        background: "#fff7ed",
        borderColor: "#fed7aa",
      };
    case "low":
      return {
        color: "#1d4ed8",
        background: "#eff6ff",
        borderColor: "#bfdbfe",
      };
    default:
      return {
        color: "#475569",
        background: "#f8fafc",
        borderColor: "#cbd5e1",
      };
  }
}

function formatDateTime(value?: string): string {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildSearchValue(item: InformationCountryDataModel): string {
  return [item.title, item.description, item.slug, item.country?.name]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function InformationFormModal({
  open,
  mode,
  loading,
  countries,
  initialValues,
  onCancel,
  onSubmit,
}: {
  open: boolean;
  mode: "create" | "edit";
  loading: boolean;
  countries: OptionItem[];
  initialValues?: InformationCountryDataModel | null;
  onCancel: () => void;
  onSubmit: (values: InformationFormValues) => Promise<void> | void;
}) {
  const [form] = Form.useForm<InformationFormValues>();
  const slugTouchedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      form.resetFields();
      slugTouchedRef.current = false;
      return;
    }

    form.setFieldsValue({
      title: initialValues?.title ?? "",
      slug: initialValues?.slug ?? "",
      priority: initialValues?.priority ?? "normal",
      country_id: initialValues?.country_id ?? undefined,
      description: initialValues?.description ?? "",
    });

    slugTouchedRef.current = Boolean(initialValues?.slug);
  }, [form, initialValues, open]);

  const handleValuesChange = (
    changedValues: Partial<InformationFormValues>,
    allValues: InformationFormValues,
  ) => {
    if (Object.prototype.hasOwnProperty.call(changedValues, "slug")) {
      slugTouchedRef.current = true;
    }

    if (
      Object.prototype.hasOwnProperty.call(changedValues, "title") &&
      !slugTouchedRef.current
    ) {
      form.setFieldValue("slug", slugify(allValues.title || ""));
    }
  };

  return (
    <Modal
      open={open}
      title={mode === "create" ? "Add Information" : "Edit Information"}
      onCancel={onCancel}
      onOk={() => form.submit()}
      okText={mode === "create" ? "Save Information" : "Update Information"}
      confirmLoading={loading}
      destroyOnHidden
      centered
      styles={{ body: { paddingTop: 12 } }}
    >
      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleValuesChange}
        onFinish={onSubmit}
        initialValues={{ priority: "normal" }}
      >
        <Form.Item
          name="title"
          label="Title"
          tooltip="Judul informasi atau pengumuman resmi terkait negara tujuan."
          rules={[{ required: true, message: "Title is required" }]}
        >
          <Input placeholder="Update syarat visa Australia per 01/09" />
        </Form.Item>

        <Form.Item
          name="slug"
          label="Slug"
          tooltip="Pengenal unik URL halaman informasi."
          extra="Slug dibuat otomatis dari title, tetapi masih bisa Anda ubah manual."
          rules={[{ required: true, message: "Slug is required" }]}
        >
          <Input placeholder="update-syarat-visa-australia" />
        </Form.Item>

        <Form.Item
          name="country_id"
          label="Country"
          tooltip="Negara tujuan studi yang terkait dengan informasi ini."
          rules={[{ required: true, message: "Country is required" }]}
        >
          <Select
            placeholder="Select country"
            options={countries}
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>

        <Form.Item
          name="priority"
          label="Priority"
          tooltip="Tingkat prioritas penayangan informasi kepada pengguna."
          rules={[{ required: true, message: "Priority is required" }]}
        >
          <Select options={priorityOptions} placeholder="Select priority" />
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
          tooltip="Rincian isi pengumuman atau petunjuk lengkap."
        >
          <TextArea
            rows={5}
            placeholder="Tulis pengumuman, kebijakan, deadline, atau informasi penting lainnya."
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default function InformationCountryManagementContent() {
  const { message } = App.useApp();
  const [search, setSearch] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingItem, setEditingItem] =
    useState<InformationCountryDataModel | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data: countries = [] } = useCountriesManagement({});
  const {
    data: informations = [],
    fetchLoading,
    onCreate,
    onCreateLoading,
    onUpdate,
    onUpdateLoading,
    onDelete,
    onDeleteLoading,
  } = useInformationCountries({});

  const countryOptions = useMemo<OptionItem[]>(() => {
    return countries.map((country) => ({
      value: String(country.id),
      label: String(country.name),
    }));
  }, [countries]);

  const countryFilterOptions = useMemo<OptionItem[]>(() => {
    return [{ value: "all", label: "All Countries" }, ...countryOptions];
  }, [countryOptions]);

  const priorityFilterOptions = useMemo<OptionItem[]>(() => {
    return [{ value: "all", label: "All Priority" }, ...priorityOptions];
  }, []);

  const filteredInformations = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return informations.filter((item) => {
      if (selectedCountry !== "all" && item.country_id !== selectedCountry) {
        return false;
      }

      if (
        selectedPriority !== "all" &&
        String(item.priority ?? "").toLowerCase() !== selectedPriority
      ) {
        return false;
      }

      if (searchValue && !buildSearchValue(item).includes(searchValue)) {
        return false;
      }

      return true;
    });
  }, [informations, search, selectedCountry, selectedPriority]);

  const openCreateModal = () => {
    setModalMode("create");
    setEditingItem(null);
    setModalOpen(true);
  };

  const openEditModal = (item: InformationCountryDataModel) => {
    setModalMode("edit");
    setEditingItem(item);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingItem(null);
  };

  const handleSubmit = async (values: InformationFormValues) => {
    const payload: InformationCountryPayloadCreateModel = {
      title: values.title.trim(),
      slug: slugify(values.slug),
      priority: values.priority,
      country_id: values.country_id,
      description: values.description?.trim() || null,
    };

    try {
      if (modalMode === "create") {
        await onCreate(payload);
        message.success("Information berhasil dibuat.");
      } else if (editingItem?.id) {
        const updatePayload: InformationCountryPayloadUpdateModel = payload;
        await onUpdate({ id: editingItem.id, payload: updatePayload });
        message.success("Information berhasil diperbarui.");
      }

      closeModal();
    } catch {
      message.error("Gagal menyimpan information.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await onDelete(id);
      message.success("Information berhasil dihapus.");
    } catch {
      message.error("Gagal menghapus information.");
    }
  };

  return (
    <div
      style={{
        padding: 24,
        minHeight: "100%",
      }}
    >
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <PageHeader
          title="Country Information"
          subtitle="Kelola informasi dan panduan negara"
          icon={<GlobalOutlined />}
          onAddNew={openCreateModal}
          addNewText="Add Info"
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
            <div style={{ minWidth: 180 }}>
              <Select
                value={selectedCountry}
                onChange={setSelectedCountry}
                style={{ width: "100%", height: 34, fontSize: 12.5 }}
                options={countryFilterOptions}
              />
            </div>

            <div style={{ minWidth: 160 }}>
              <Select
                value={selectedPriority}
                onChange={setSelectedPriority}
                style={{ width: "100%", height: 34, fontSize: 12.5 }}
                options={priorityFilterOptions}
              />
            </div>

            <div style={{ flex: "1 1 260px", minWidth: 200 }}>
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                prefix={
                  <SearchOutlined style={{ color: "#94a3b8", fontSize: 13 }} />
                }
                placeholder="Search title, slug, or description..."
                allowClear
                style={{
                  borderRadius: 8,
                  height: 34,
                  fontSize: 12.5,
                  borderColor: "#e2e8f0",
                  background: "#ffffff",
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "#64748b" }}>
              Showing <strong>{filteredInformations.length}</strong> items
            </span>
          </div>
        </div>

        {/* List of Information or Empty State */}
        {!filteredInformations.length ? (
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
                search ||
                selectedCountry !== "all" ||
                selectedPriority !== "all"
                  ? "Tidak ada dokumen informasi yang sesuai dengan filter"
                  : "Belum ada information document."
              }
            />
          </div>
        ) : (
          <Space direction="vertical" size={14} style={{ width: "100%" }}>
            {filteredInformations.map((item) => {
              const priorityStyle = getPriorityTagStyle(item.priority);

              return (
                <Card
                  key={item.id}
                  loading={fetchLoading}
                  style={{
                    borderRadius: 16,
                    borderColor: "#e2e8f0",
                    background: "#ffffff",
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
                  }}
                  styles={{ body: { padding: 18 } }}
                >
                  <div className={styles.cardRow}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        display: "grid",
                        placeItems: "center",
                        background: "#eff6ff",
                        color: "#1b3d6d",
                        fontSize: 20,
                        flexShrink: 0,
                      }}
                    >
                      <InfoCircleOutlined />
                    </div>

                    <Space
                      direction="vertical"
                      size={8}
                      style={{ width: "100%", minWidth: 0 }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <Title
                          level={4}
                          style={{
                            margin: 0,
                            fontSize: 16,
                            fontWeight: 700,
                            color: "#0f172a",
                            lineHeight: 1.35,
                            wordBreak: "normal",
                            overflowWrap: "break-word",
                          }}
                        >
                          {item.title}
                        </Title>

                        <Text
                          type="secondary"
                          style={{
                            fontSize: 13,
                            lineHeight: 1.6,
                          }}
                        >
                          Country:{" "}
                          <Text strong>{item.country?.name || "-"}</Text>
                          {" · "}
                          Slug: <Text strong>{item.slug}</Text>
                        </Text>
                      </div>

                      <Paragraph
                        style={{
                          margin: 0,
                          color: "#475569",
                          fontSize: 13.5,
                          lineHeight: 1.6,
                          wordBreak: "normal",
                          overflowWrap: "break-word",
                        }}
                      >
                        {item.description || "Tidak ada deskripsi."}
                      </Paragraph>

                      <Space size={18} wrap>
                        <Text style={{ color: "#64748b", fontSize: 12.5 }}>
                          <Text strong>Last Updated:</Text>{" "}
                          {formatDateTime(item.updated_at)}
                        </Text>
                        <Text style={{ color: "#64748b", fontSize: 12.5 }}>
                          <Text strong>Created:</Text>{" "}
                          {formatDateTime(item.created_at)}
                        </Text>
                      </Space>
                    </Space>

                    <Space
                      direction="vertical"
                      size={12}
                      align="end"
                      className={styles.cardActions}
                    >
                      <Tag
                        style={{
                          margin: 0,
                          borderRadius: 6,
                          padding: "4px 10px",
                          fontWeight: 600,
                          fontSize: 12,
                          color: priorityStyle.color,
                          background: priorityStyle.background,
                          borderColor: priorityStyle.borderColor,
                        }}
                      >
                        {formatPriorityLabel(item.priority)}
                      </Tag>

                      <Space size={8}>
                        <Button
                          onClick={() => openEditModal(item)}
                          size="small"
                          style={{
                            borderRadius: 8,
                            height: 32,
                            paddingInline: 12,
                            fontWeight: 500,
                          }}
                        >
                          Edit
                        </Button>

                        <Popconfirm
                          title="Delete information"
                          description="Data yang dihapus tidak bisa dikembalikan."
                          okText="Delete"
                          okButtonProps={{
                            danger: true,
                            loading: onDeleteLoading,
                          }}
                          onConfirm={() => handleDelete(item.id)}
                        >
                          <Button
                            danger
                            size="small"
                            style={{
                              borderRadius: 8,
                              height: 32,
                              paddingInline: 12,
                              fontWeight: 500,
                            }}
                          >
                            Delete
                          </Button>
                        </Popconfirm>
                      </Space>
                    </Space>
                  </div>
                </Card>
              );
            })}
          </Space>
        )}
      </Space>

      <InformationFormModal
        open={modalOpen}
        mode={modalMode}
        loading={onCreateLoading || onUpdateLoading}
        countries={countryOptions}
        initialValues={editingItem}
        onCancel={closeModal}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
