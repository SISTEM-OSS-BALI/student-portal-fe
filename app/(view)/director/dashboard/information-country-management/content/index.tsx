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
  InfoCircleOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";

import { useCountriesManagement } from "@/app/hooks/use-country-management";
import { useInformationCountries } from "@/app/hooks/use-information-country-management";
import type {
  InformationCountryDataModel,
  InformationCountryPayloadCreateModel,
  InformationCountryPayloadUpdateModel,
} from "@/app/models/information-country-management";

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
          rules={[{ required: true, message: "Title is required" }]}
        >
          <Input placeholder="Update syarat visa Australia per 01/09" />
        </Form.Item>

        <Form.Item
          name="slug"
          label="Slug"
          extra="Slug dibuat otomatis dari title, tetapi masih bisa Anda ubah manual."
          rules={[{ required: true, message: "Slug is required" }]}
        >
          <Input placeholder="update-syarat-visa-australia" />
        </Form.Item>

        <Form.Item
          name="country_id"
          label="Country"
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
          rules={[{ required: true, message: "Priority is required" }]}
        >
          <Select options={priorityOptions} placeholder="Select priority" />
        </Form.Item>

        <Form.Item name="description" label="Description">
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
      <Space direction="vertical" size={24} style={{ width: "100%" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          <Space align="start" size={14}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                display: "grid",
                placeItems: "center",
                background: "#020617",
                color: "#ffffff",
                boxShadow: "0 12px 22px rgba(15, 23, 42, 0.16)",
                flexShrink: 0,
              }}
            >
              <ExclamationCircleOutlined style={{ fontSize: 20 }} />
            </div>

            <Space direction="vertical" size={0}>
              <Title
                level={2}
                style={{
                  margin: 0,
                  fontSize: 30,
                  lineHeight: 1.2,
                }}
              >
                Information Management
              </Title>
              <Text
                type="secondary"
                style={{
                  fontSize: 14,
                  lineHeight: 1.6,
                  maxWidth: 840,
                }}
              >
                Kelola pengumuman dan informasi penting untuk setiap negara
                seperti visa, kebijakan, deadline, dan pembaruan dokumen.
              </Text>
            </Space>
          </Space>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreateModal}
            style={{
              borderRadius: 999,
              minWidth: 180,
              height: 44,
              paddingInline: 20,
              fontSize: 15,
              fontWeight: 600,
              background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
              boxShadow: "0 10px 22px rgba(37, 99, 235, 0.24)",
            }}
          >
            Add Information
          </Button>
        </div>

        <Card
          style={{
            borderRadius: 24,
            borderColor: "#dbe4ee",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8)",
          }}
          styles={{ body: { padding: 20 } }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
            }}
          >
            <div>
              <Text
                strong
                style={{ display: "block", marginBottom: 8, fontSize: 14 }}
              >
                Country
              </Text>
              <Select
                value={selectedCountry}
                onChange={setSelectedCountry}
                style={{ width: "100%" }}
                options={countryFilterOptions}
              />
            </div>

            <div>
              <Text
                strong
                style={{ display: "block", marginBottom: 8, fontSize: 14 }}
              >
                Priority
              </Text>
              <Select
                value={selectedPriority}
                onChange={setSelectedPriority}
                style={{ width: "100%" }}
                options={priorityFilterOptions}
              />
            </div>

            <div>
              <Text
                strong
                style={{ display: "block", marginBottom: 8, fontSize: 14 }}
              >
                Search
              </Text>
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
                placeholder="Search title, slug, or description..."
                style={{ borderRadius: 999, height: 42 }}
              />
            </div>
          </div>
        </Card>

        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          {filteredInformations.length ? (
            filteredInformations.map((item) => {
              const priorityStyle = getPriorityTagStyle(item.priority);

              return (
                <Card
                  key={item.id}
                  loading={fetchLoading}
                  style={{
                    borderRadius: 24,
                    borderColor: "#dbe4ee",
                    boxShadow: "0 12px 28px rgba(15, 23, 42, 0.05)",
                  }}
                  styles={{ body: { padding: 20 } }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "auto 1fr auto",
                      gap: 16,
                      alignItems: "start",
                    }}
                  >
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 18,
                        display: "grid",
                        placeItems: "center",
                        background: "#eff6ff",
                        color: "#2563eb",
                        flexShrink: 0,
                      }}
                    >
                      <InfoCircleOutlined style={{ fontSize: 24 }} />
                    </div>

                    <Space
                      direction="vertical"
                      size={10}
                      style={{ width: "100%" }}
                    >
                      <div>
                        <Title
                          level={3}
                          style={{
                            margin: 0,
                            fontSize: 18,
                            lineHeight: 1.35,
                          }}
                        >
                          {item.title}
                        </Title>

                        <Text
                          type="secondary"
                          style={{
                            fontSize: 14,
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
                          fontSize: 14,
                          lineHeight: 1.7,
                        }}
                      >
                        {item.description || "Tidak ada deskripsi."}
                      </Paragraph>

                      <Space size={18} wrap>
                        <Text style={{ color: "#475569", fontSize: 14 }}>
                          <Text strong>Last Updated:</Text>{" "}
                          {formatDateTime(item.updated_at)}
                        </Text>
                        <Text style={{ color: "#475569", fontSize: 14 }}>
                          <Text strong>Created:</Text>{" "}
                          {formatDateTime(item.created_at)}
                        </Text>
                      </Space>
                    </Space>

                    <Space direction="vertical" size={14} align="end">
                      <Tag
                        style={{
                          margin: 0,
                          borderRadius: 999,
                          padding: "6px 12px",
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
                          size="middle"
                          style={{
                            borderRadius: 999,
                            paddingInline: 16,
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
                            size="middle"
                            style={{
                              borderRadius: 999,
                              paddingInline: 16,
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
            })
          ) : (
            <Card
              style={{ borderRadius: 24, borderColor: "#dbe4ee" }}
              styles={{ body: { padding: 32 } }}
            >
              <Empty description="Belum ada information document." />
            </Card>
          )}
        </Space>
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
