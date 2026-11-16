"use client";

import React, { useMemo, useState } from "react";
import {
  BankOutlined,
  CheckCircleOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  FileDoneOutlined,
  GlobalOutlined,
  PlusOutlined,
  SearchOutlined,
  StarFilled,
  StarOutlined,
  TagOutlined,
  UserOutlined,
} from "@ant-design/icons";
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
  Popover,
  Row,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";

import { useCountriesManagement } from "@/app/hooks/use-country-management";
import { useStudentCampusApplications } from "@/app/hooks/use-student-campus-applications";
import type {
  StudentCampusApplicationDataModel,
  StudentCampusApplicationStatus,
} from "@/app/models/student-campus-application";
import { getCountryBadgeMeta } from "@/app/utils/student-helpers";
import CountryBadge from "@/app/components/common/country-badge";
import styles from "./campus-applications.module.css";

interface CampusApplicationsCardProps {
  userId: string | number;
  defaultCountryName?: string;
  readOnly?: boolean;
  consultantName?: string | null;
  onEditConsultant?: () => void;
  fallbackCampusName?: string | null;
  fallbackDegree?: string | null;
  fallbackNameDegree?: string | null;
}

export interface StatusPresetOption {
  value: string;
  label: string;
  color: string;
  icon: React.ReactNode;
}

export const DEFAULT_STATUS_PRESETS: StatusPresetOption[] = [
  {
    value: "APPLIED",
    label: "Applied",
    color: "blue",
    icon: <ClockCircleOutlined />,
  },
  {
    value: "WAITING_LOO",
    label: "Menunggu LOO",
    color: "gold",
    icon: <ClockCircleOutlined />,
  },
  {
    value: "CONDITIONAL_LOO",
    label: "Conditional LOO",
    color: "purple",
    icon: <FileDoneOutlined />,
  },
  {
    value: "UNCONDITIONAL_LOO",
    label: "Unconditional LOO",
    color: "cyan",
    icon: <FileDoneOutlined />,
  },
  {
    value: "ACCEPTED",
    label: "Diterima",
    color: "green",
    icon: <CheckCircleOutlined />,
  },
  {
    value: "REJECTED",
    label: "Ditolak",
    color: "red",
    icon: <CloseCircleOutlined />,
  },
];

const NOTION_COLOR_PALETTE = [
  "blue",
  "cyan",
  "geekblue",
  "purple",
  "magenta",
  "volcano",
  "orange",
  "gold",
  "lime",
  "green",
];

export const getStatusMeta = (
  rawStatus?: string | null
): { label: string; color: string; icon: React.ReactNode } => {
  if (!rawStatus || !rawStatus.trim()) {
    return { label: "Belum Ditentukan", color: "default", icon: <TagOutlined /> };
  }

  const trimmed = rawStatus.trim();
  const lower = trimmed.toLowerCase();

  const foundPreset = DEFAULT_STATUS_PRESETS.find(
    (p) => p.value.toLowerCase() === lower || p.label.toLowerCase() === lower
  );
  if (foundPreset) return foundPreset;

  // Keyword heuristic
  if (
    lower.includes("accept") ||
    lower.includes("terima") ||
    lower.includes("lolos") ||
    lower.includes("final") ||
    lower.includes("enrolled")
  ) {
    return { label: trimmed, color: "green", icon: <CheckCircleOutlined /> };
  }
  if (
    lower.includes("reject") ||
    lower.includes("tolak") ||
    lower.includes("batal") ||
    lower.includes("cancel")
  ) {
    return { label: trimmed, color: "red", icon: <CloseCircleOutlined /> };
  }
  if (
    lower.includes("wait") ||
    lower.includes("tunggu") ||
    lower.includes("pending") ||
    lower.includes("proses") ||
    lower.includes("review")
  ) {
    return { label: trimmed, color: "gold", icon: <ClockCircleOutlined /> };
  }
  if (
    lower.includes("conditional") ||
    lower.includes("syarat") ||
    lower.includes("interview") ||
    lower.includes("wawancara")
  ) {
    return { label: trimmed, color: "purple", icon: <FileDoneOutlined /> };
  }
  if (
    lower.includes("unconditional") ||
    lower.includes("offer") ||
    lower.includes("loo") ||
    lower.includes("coe")
  ) {
    return { label: trimmed, color: "cyan", icon: <FileDoneOutlined /> };
  }

  // Hash-based pastel color for custom tags
  let hash = 0;
  for (let i = 0; i < trimmed.length; i++) {
    hash = trimmed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % NOTION_COLOR_PALETTE.length;
  return {
    label: trimmed,
    color: NOTION_COLOR_PALETTE[colorIndex],
    icon: <TagOutlined />,
  };
};

const NotionStatusPopover: React.FC<{
  currentStatus: string;
  allStatuses: string[];
  onSelect: (newStatus: string) => Promise<void> | void;
  disabled?: boolean;
}> = ({ currentStatus, allStatuses, onSelect, disabled = false }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const meta = getStatusMeta(currentStatus);

  // Combine default preset labels with custom statuses
  const combinedOptions = Array.from(
    new Set([
      ...DEFAULT_STATUS_PRESETS.map((p) => p.label),
      ...allStatuses.map((s) => getStatusMeta(s).label),
    ])
  );

  const filtered = combinedOptions.filter((opt) =>
    opt.toLowerCase().includes(search.trim().toLowerCase())
  );

  const isExactMatch = combinedOptions.some(
    (opt) => opt.toLowerCase() === search.trim().toLowerCase()
  );

  const handleSelect = async (statusLabel: string) => {
    try {
      setLoading(true);
      await onSelect(statusLabel);
      setOpen(false);
      setSearch("");
    } finally {
      setLoading(false);
    }
  };

  if (disabled) {
    return (
      <Tag
        color={meta.color}
        icon={meta.icon}
        style={{
          borderRadius: 6,
          fontWeight: 500,
          fontSize: 11,
          height: 22,
          lineHeight: "20px",
          padding: "0 7px",
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          margin: 0,
        }}
      >
        {meta.label}
      </Tag>
    );
  }

  const content = (
    <div style={{ width: 230 }}>
      <Input
        size="small"
        placeholder="Cari atau buat status..."
        prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && search.trim()) {
            e.preventDefault();
            handleSelect(search.trim());
          }
        }}
        style={{ marginBottom: 8, borderRadius: 6 }}
        autoFocus
      />
      <div style={{ maxHeight: 220, overflowY: "auto" }}>
        <Typography.Text
          type="secondary"
          style={{
            fontSize: 10,
            textTransform: "uppercase",
            display: "block",
            padding: "2px 8px",
            letterSpacing: "0.5px",
          }}
        >
          Pilih Status
        </Typography.Text>
        {filtered.map((item) => {
          const itemMeta = getStatusMeta(item);
          const isSelected = item.toLowerCase() === meta.label.toLowerCase();
          return (
            <div
              key={item}
              onClick={() => handleSelect(item)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "5px 8px",
                borderRadius: 6,
                cursor: "pointer",
                background: isSelected ? "#f1f5f9" : "transparent",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.background = "#f8fafc";
              }}
              onMouseLeave={(e) => {
                if (!isSelected)
                  e.currentTarget.style.background = "transparent";
              }}
            >
              <Tag
                color={itemMeta.color}
                icon={itemMeta.icon}
                style={{
                  margin: 0,
                  borderRadius: 6,
                  fontWeight: 500,
                  fontSize: 11,
                  height: 22,
                  lineHeight: "20px",
                  padding: "0 7px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {itemMeta.label}
              </Tag>
              {isSelected && (
                <CheckOutlined style={{ color: "#2563eb", fontSize: 12 }} />
              )}
            </div>
          );
        })}

        {search.trim() && !isExactMatch && (
          <div
            onClick={() => handleSelect(search.trim())}
            style={{
              padding: "7px 8px",
              marginTop: 4,
              borderTop: "1px dashed #e2e8f0",
              cursor: "pointer",
              borderRadius: 6,
              background: "#eff6ff",
              color: "#2563eb",
              fontSize: 12,
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <PlusOutlined />
            <span>Buat &quot;{search.trim()}&quot;</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottomLeft"
    >
      <Tag
        color={meta.color}
        icon={loading ? <Spin size="small" /> : meta.icon}
        style={{
          borderRadius: 6,
          fontWeight: 500,
          fontSize: 11,
          height: 22,
          lineHeight: "20px",
          padding: "0 7px",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          userSelect: "none",
          borderStyle: "dashed",
          transition: "all 0.2s ease",
          margin: 0,
        }}
        title="Klik untuk ubah atau buat status (Notion-style)"
      >
        <span>{meta.label}</span>
        <DownOutlined style={{ fontSize: 8.5, opacity: 0.7, marginLeft: 2 }} />
      </Tag>
    </Popover>
  );
};

const DEGREE_OPTIONS = [
  { value: "Bachelor", label: "Bachelor (S1)" },
  { value: "Master", label: "Master (S2)" },
  { value: "Doctorate", label: "Doctorate (S3)" },
  { value: "Diploma", label: "Diploma" },
  { value: "Foundation", label: "Foundation" },
  { value: "Vocational / VET", label: "Pendidikan Vokasi (VET)" },
  { value: "Language Course / ELICOS", label: "Kursus Bahasa (ELICOS)" },
];

export const CampusApplicationsCard: React.FC<CampusApplicationsCardProps> = ({
  userId,
  defaultCountryName,
  readOnly = false,
  consultantName,
  onEditConsultant,
  fallbackCampusName,
  fallbackDegree,
  fallbackNameDegree,
}) => {
  const normalizedUserId = String(userId);
  const { data: countriesData } = useCountriesManagement({});
  const {
    data,
    fetchLoading,
    onCreate,
    onCreateLoading,
    onUpdate,
    onUpdateLoading,
    onSetPrimary,
    onSetPrimaryLoading,
    onDelete,
    onDeleteLoading,
  } = useStudentCampusApplications({ userId: normalizedUserId });

  const primaryItem = useMemo(
    () => data.find((item) => item.is_primary),
    [data],
  );

  const effectiveCampusName =
    primaryItem?.campus_name || fallbackCampusName || "Belum ditentukan";

  const effectiveDegree = primaryItem
    ? primaryItem.name_degree
      ? `${primaryItem.name_degree} (${primaryItem.degree || "-"})`
      : primaryItem.degree || "-"
    : fallbackNameDegree
    ? `${fallbackNameDegree} (${fallbackDegree || "-"})`
    : fallbackDegree || "Belum ditentukan";

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] =
    useState<StudentCampusApplicationDataModel | null>(null);
  const [customStatusInput, setCustomStatusInput] = useState("");
  const [customStatusesList, setCustomStatusesList] = useState<string[]>([]);
  const [form] = Form.useForm();

  const allUniqueStatusOptions = useMemo(() => {
    const labels = new Set<string>();
    DEFAULT_STATUS_PRESETS.forEach((p) => labels.add(p.label));
    data.forEach((d) => {
      if (d.status) labels.add(getStatusMeta(d.status).label);
    });
    customStatusesList.forEach((s) => labels.add(s));

    return Array.from(labels).map((label) => {
      const meta = getStatusMeta(label);
      return {
        value: label,
        label: (
          <Space size={6}>
            <Tag
              color={meta.color}
              icon={meta.icon}
              style={{ margin: 0, borderRadius: 4, fontWeight: 500 }}
            >
              {meta.label}
            </Tag>
          </Space>
        ),
      };
    });
  }, [data, customStatusesList]);

  const handleAddCustomStatusInForm = () => {
    const val = customStatusInput.trim();
    if (!val) return;
    if (!customStatusesList.includes(val)) {
      setCustomStatusesList((prev) => [...prev, val]);
    }
    form.setFieldValue("status", val);
    setCustomStatusInput("");
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({
      country_name: defaultCountryName || undefined,
      status: "APPLIED",
      is_primary: data.length === 0,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: StudentCampusApplicationDataModel) => {
    setEditingItem(item);
    form.resetFields();
    form.setFieldsValue({
      campus_name: item.campus_name,
      country_name: item.country_name || defaultCountryName || undefined,
      degree: item.degree,
      name_degree: item.name_degree,
      intake: item.intake,
      status: item.status,
      is_primary: item.is_primary,
      notes: item.notes,
      offer_letter_url: item.offer_letter_url,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    form.resetFields();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const matchedCountry = (countriesData ?? []).find(
        (c) =>
          c.name?.trim().toLowerCase() ===
          values.country_name?.trim().toLowerCase()
      );
      const countryId = matchedCountry?.id || undefined;

      if (editingItem) {
        await onUpdate({
          id: editingItem.id,
          payload: {
            campus_name: values.campus_name,
            country_name: values.country_name,
            country_id: countryId,
            degree: values.degree,
            name_degree: values.name_degree,
            intake: values.intake,
            status: values.status,
            is_primary: values.is_primary,
            notes: values.notes,
            offer_letter_url: values.offer_letter_url,
          },
        });
      } else {
        await onCreate({
          user_id: normalizedUserId,
          campus_name: values.campus_name,
          country_name: values.country_name,
          country_id: countryId,
          degree: values.degree,
          name_degree: values.name_degree,
          intake: values.intake,
          status: values.status,
          is_primary: values.is_primary,
          notes: values.notes,
          offer_letter_url: values.offer_letter_url,
        });
      }
      handleCloseModal();
    } catch {
      // Form validation error
    }
  };

  const handleSetPrimary = async (item: StudentCampusApplicationDataModel) => {
    await onSetPrimary(item.id);
  };

  const handleDelete = async (id: string) => {
    await onDelete(id);
  };

  const columns: ColumnsType<StudentCampusApplicationDataModel> = [
    {
      title: "Negara",
      dataIndex: "country_name",
      key: "country_name",
      width: 120,
      render: (countryName: string) => {
        if (!countryName) {
          return (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              -
            </Typography.Text>
          );
        }
        return <CountryBadge countryName={countryName} />;
      },
    },
    {
      title: "Nama Kampus",
      dataIndex: "campus_name",
      key: "campus_name",
      width: 220,
      render: (text, record) => (
        <Space direction="vertical" size={2} style={{ maxWidth: 220 }}>
          <Space align="center" size={6} wrap>
            <Typography.Text strong style={{ fontSize: 13.5, whiteSpace: "normal" }}>
              {text}
            </Typography.Text>
            {record.is_primary && (
              <Tag
                color="gold"
                icon={<StarFilled style={{ color: "#d97706", fontSize: 10 }} />}
                style={{
                  fontWeight: 600,
                  borderRadius: 6,
                  padding: "0 6px",
                  fontSize: 10.5,
                  height: 22,
                  lineHeight: "20px",
                  margin: 0,
                  whiteSpace: "nowrap",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                Pilihan Utama
              </Tag>
            )}
          </Space>
          {record.intake && (
            <Typography.Text type="secondary" style={{ fontSize: 11.5 }}>
              Intake: {record.intake}
            </Typography.Text>
          )}
        </Space>
      ),
    },
    {
      title: "Jenjang & Jurusan",
      key: "program",
      width: 210,
      render: (_, record) => (
        <Space direction="vertical" size={2} style={{ maxWidth: 210 }}>
          <Tag color="geekblue" style={{ borderRadius: 6, width: "fit-content", margin: 0, fontSize: 11 }}>
            {record.degree}
          </Tag>
          <Typography.Text style={{ fontSize: 12.5, color: "#334155", whiteSpace: "normal" }}>
            {record.name_degree}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: "Status Aplikasi",
      dataIndex: "status",
      key: "status",
      width: 160,
      render: (
        status: StudentCampusApplicationStatus,
        record: StudentCampusApplicationDataModel
      ) => (
        <NotionStatusPopover
          currentStatus={status}
          allStatuses={data.map((d) => d.status).filter(Boolean)}
          disabled={readOnly}
          onSelect={async (newStatus) => {
            await onUpdate({
              id: record.id,
              payload: { status: newStatus },
            });
          }}
        />
      ),
    },
    {
      title: "Catatan",
      dataIndex: "notes",
      key: "notes",
      width: 170,
      render: (notes: string | null) => (
        <Typography.Paragraph
          ellipsis={{ rows: 2, tooltip: notes || undefined }}
          style={{ marginBottom: 0, fontSize: 12, color: "#64748b", maxWidth: 200 }}
        >
          {notes || "-"}
        </Typography.Paragraph>
      ),
    },
    ...(!readOnly
      ? [
          {
            title: "Aksi",
            key: "action",
            align: "center" as const,
            width: 100,
            render: (_: unknown, record: StudentCampusApplicationDataModel) => (
              <Space size={4}>
                {!record.is_primary && (
                  <Tooltip title="Jadikan Sebagai Pilihan Utama (Sinkronisasi Profil)">
                    <Button
                      type="text"
                      size="small"
                      icon={<StarOutlined style={{ color: "#d97706" }} />}
                      onClick={() => handleSetPrimary(record)}
                      loading={onSetPrimaryLoading}
                    />
                  </Tooltip>
                )}
                <Tooltip title="Ubah Aplikasi Kampus">
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined style={{ color: "#2563eb" }} />}
                    onClick={() => handleOpenEditModal(record)}
                  />
                </Tooltip>
                <Popconfirm
                  title="Hapus aplikasi kampus ini?"
                  description="Jika ini adalah pilihan utama, kampus lain akan terpilih secara otomatis."
                  onConfirm={() => handleDelete(record.id)}
                  okText="Ya, Hapus"
                  cancelText="Batal"
                >
                  <Tooltip title="Hapus">
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      loading={onDeleteLoading}
                    />
                  </Tooltip>
                </Popconfirm>
              </Space>
            ),
          },
        ]
      : []),
  ];

  return (
    <>
      <Card
        style={{
          borderRadius: 16,
          borderColor: "#e2e8f0",
          background: "#ffffff",
          boxShadow: "0 4px 20px rgba(15, 23, 42, 0.04)",
          marginTop: 0,
        }}
        styles={{ body: { padding: "18px 20px" } }}
      >
        <div className={styles.headerFlex}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <BankOutlined />
            </div>
            <div style={{ minWidth: 0, flex: "1 1 auto", overflow: "hidden" }}>
              <h2 className={styles.headerTitle}>
                University Selections
              </h2>
              <span className={styles.headerSubtitle}>
                Rencana studi siswa
              </span>
            </div>
          </div>

          {!readOnly && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleOpenAddModal}
              className={styles.headerBtn}
              style={{
                borderRadius: 8,
                fontWeight: 600,
                background: "#1b3d6d",
                borderColor: "#1b3d6d",
                flexShrink: 0,
              }}
            >
              <span className={styles.desktopBtnText}>Tambah Kampus</span>
              <span className={styles.mobileBtnText}>Tambah</span>
            </Button>
          )}
        </div>

        {consultantName !== undefined && (
          <div
            style={{
              background: "#f8fafc",
              borderRadius: 12,
              padding: "14px 16px",
              border: "1px solid #f1f5f9",
              marginBottom: 16,
            }}
          >
            <Row gutter={[16, 12]} align="middle">
              <Col xs={24} sm={12} md={9}>
                <Typography.Text
                  type="secondary"
                  style={{ fontSize: 11, display: "block" }}
                >
                  Kampus Pilihan Utama
                </Typography.Text>
                <Space align="center" size={6} style={{ marginTop: 2 }}>
                  <Typography.Text
                    strong
                    style={{
                      fontSize: 14,
                      color:
                        effectiveCampusName !== "Belum ditentukan"
                          ? "#0f172a"
                          : "#94a3b8",
                    }}
                  >
                    {effectiveCampusName}
                  </Typography.Text>
                  {primaryItem && (
                    <Tag
                      color="gold"
                      icon={<StarFilled style={{ color: "#d97706", fontSize: 10 }} />}
                      style={{
                        margin: 0,
                        fontWeight: 600,
                        borderRadius: 6,
                        fontSize: 10.5,
                        height: 22,
                        lineHeight: "20px",
                        padding: "0 6px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 3,
                      }}
                    >
                      Pilihan Utama
                    </Tag>
                  )}
                </Space>
              </Col>

              <Col xs={24} sm={12} md={8}>
                <Typography.Text
                  type="secondary"
                  style={{ fontSize: 11, display: "block" }}
                >
                  Jenjang & Program Studi
                </Typography.Text>
                <Typography.Text
                  strong
                  style={{
                    fontSize: 14,
                    color:
                      effectiveDegree !== "Belum ditentukan"
                        ? "#0f172a"
                        : "#94a3b8",
                    display: "block",
                    marginTop: 2,
                  }}
                >
                  {effectiveDegree}
                </Typography.Text>
              </Col>

              <Col xs={24} sm={24} md={7}>
                <Flex align="center" justify="space-between" wrap="nowrap">
                  <div>
                    <Typography.Text
                      type="secondary"
                      style={{ fontSize: 11, display: "block" }}
                    >
                      Konsultan Penanggung Jawab
                    </Typography.Text>
                    <div style={{ marginTop: 2 }}>
                      {consultantName ? (
                        <Tag
                          color="purple"
                          style={{
                            borderRadius: 6,
                            fontWeight: 600,
                            fontSize: 11,
                            height: 22,
                            lineHeight: "20px",
                            padding: "0 7px",
                            margin: 0,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 3,
                          }}
                        >
                          <UserOutlined style={{ fontSize: 10 }} />
                          {consultantName}
                        </Tag>
                      ) : (
                        <Typography.Text
                          type="secondary"
                          style={{ fontStyle: "italic", fontSize: 13 }}
                        >
                          Belum dialokasikan
                        </Typography.Text>
                      )}
                    </div>
                  </div>
                </Flex>
              </Col>
            </Row>
          </div>
        )}

        {data.length === 0 && !fetchLoading ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Belum ada kampus yang didaftarkan untuk siswa ini."
          />
        ) : (
          <>
            {/* Tampilan Tabel untuk Layar Lebar / Desktop */}
            <div className={styles.desktopTableWrapper}>
              <Table
                dataSource={data}
                columns={columns}
                rowKey="id"
                loading={fetchLoading}
                pagination={false}
                size="middle"
                scroll={{ x: 980 }}
                rowClassName={(record) =>
                  record.is_primary ? "bg-amber-50/40" : ""
                }
              />
            </div>

            {/* Tampilan Kartu Responsif untuk Layar Ponsel */}
            <div className={styles.mobileCardList}>
              {data.map((item) => (
                <div
                  key={item.id}
                  className={`${styles.mobileCard} ${
                    item.is_primary ? styles.mobileCardPrimary : ""
                  }`}
                >
                  <div className={styles.mobileCardHeader}>
                    <div>
                      {item.country_name ? (
                        <CountryBadge countryName={item.country_name} />
                      ) : (
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                          -
                        </Typography.Text>
                      )}
                    </div>

                    <NotionStatusPopover
                      currentStatus={item.status}
                      allStatuses={data.map((d) => d.status).filter(Boolean)}
                      disabled={readOnly}
                      onSelect={async (newStatus) => {
                        await onUpdate({
                          id: item.id,
                          payload: { status: newStatus },
                        });
                      }}
                    />
                  </div>

                  <div className={styles.mobileCardCampus}>
                    <span>{item.campus_name}</span>
                    {item.is_primary && (
                      <Tag
                        color="gold"
                        icon={<StarFilled style={{ color: "#d97706", fontSize: 10 }} />}
                        style={{
                          margin: 0,
                          fontWeight: 600,
                          borderRadius: 6,
                          padding: "0 6px",
                          fontSize: 10.5,
                          height: 22,
                          lineHeight: "20px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 3,
                        }}
                      >
                        Pilihan Utama
                      </Tag>
                    )}
                  </div>

                  <div className={styles.mobileCardDegreeRow}>
                    {item.degree && (
                      <Tag
                        color="geekblue"
                        style={{
                          borderRadius: 6,
                          margin: 0,
                          fontSize: 11,
                          height: 22,
                          lineHeight: "20px",
                          padding: "0 6px",
                          display: "inline-flex",
                          alignItems: "center",
                          fontWeight: 500,
                        }}
                      >
                        {item.degree}
                      </Tag>
                    )}
                    {item.name_degree && (
                      <span style={{ fontWeight: 500, color: "#334155" }}>
                        {item.name_degree}
                      </span>
                    )}
                  </div>

                  {item.intake && (
                    <Typography.Text type="secondary" style={{ fontSize: 11.5 }}>
                      Intake: {item.intake}
                    </Typography.Text>
                  )}

                  {item.notes && (
                    <div className={styles.mobileCardNotes}>
                      {item.notes}
                    </div>
                  )}

                  {!readOnly && (
                    <div className={styles.mobileCardActions}>
                      {!item.is_primary && (
                        <Button
                          type="text"
                          size="small"
                          icon={<StarOutlined style={{ color: "#d97706" }} />}
                          onClick={() => handleSetPrimary(item)}
                          loading={onSetPrimaryLoading}
                          className={styles.mobileActionBtn}
                          style={{ color: "#d97706" }}
                        >
                          Jadikan Utama
                        </Button>
                      )}
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined style={{ color: "#2563eb" }} />}
                        onClick={() => handleOpenEditModal(item)}
                        className={styles.mobileActionBtn}
                        style={{ color: "#2563eb" }}
                      >
                        Ubah
                      </Button>
                      <Popconfirm
                        title="Hapus aplikasi kampus ini?"
                        description="Jika ini adalah pilihan utama, kampus lain akan terpilih secara otomatis."
                        onConfirm={() => handleDelete(item.id)}
                        okText="Ya, Hapus"
                        cancelText="Batal"
                      >
                        <Button
                          type="text"
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          loading={onDeleteLoading}
                          className={styles.mobileActionBtn}
                        >
                          Hapus
                        </Button>
                      </Popconfirm>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      <Modal
        title={
          <Space>
            <BankOutlined style={{ color: "#2563eb" }} />
            <span>
              {editingItem ? "Ubah Pilihan Kampus" : "Tambah Pilihan Kampus Baru"}
            </span>
          </Space>
        }
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={handleCloseModal}
        confirmLoading={onCreateLoading || onUpdateLoading}
        okText={editingItem ? "Simpan Perubahan" : "Tambah Kampus"}
        cancelText="Batal"
        destroyOnClose
        centered
        width={560}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="country_name"
            label="Negara Kampus"
            rules={[{ required: true, message: "Pilih atau isi negara kampus" }]}
          >
            <Select
              placeholder="Pilih atau cari negara"
              showSearch
              allowClear
              options={(countriesData ?? []).map((c) => ({
                value: c.name,
                label: c.name,
              }))}
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </Form.Item>

          <Form.Item
            name="campus_name"
            label="Nama Kampus"
            rules={[
              { required: true, message: "Nama kampus wajib diisi" },
            ]}
          >
            <Input
              placeholder="Contoh: Monash University"
              maxLength={150}
            />
          </Form.Item>

          <Form.Item
            name="degree"
            label="Jenjang Pendidikan"
            rules={[{ required: true, message: "Pilih jenjang pendidikan" }]}
          >
            <Select
              placeholder="Pilih jenjang pendidikan"
              options={DEGREE_OPTIONS}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </Form.Item>

          <Form.Item
            name="name_degree"
            label="Program Studi"
            rules={[
              { required: true, message: "Program studi wajib diisi" },
            ]}
          >
            <Input
              placeholder="Contoh: Bachelor of Business Information Systems"
              maxLength={150}
            />
          </Form.Item>

          <Form.Item
            name="intake"
            label="Periode Intake"
          >
            <Input placeholder="Contoh: Semester 1 - Februari 2026" maxLength={100} />
          </Form.Item>

          <Form.Item
            name="status"
            label="Status Aplikasi"
            rules={[{ required: true, message: "Pilih atau isi status aplikasi" }]}
            extra="Pilih status standar atau ketik status custom baru seperti di Notion."
          >
            <Select
              placeholder="Pilih status atau ketik status baru"
              showSearch
              filterOption={(input, option) => {
                const text = String(option?.value ?? "").toLowerCase();
                return text.includes(input.toLowerCase());
              }}
              dropdownRender={(menu) => (
                <>
                  {menu}
                  <Divider style={{ margin: "8px 0" }} />
                  <Space style={{ padding: "0 8px 6px", width: "100%" }}>
                    <Input
                      placeholder="Ketik status baru (misal: Interview, Portofolio)..."
                      value={customStatusInput}
                      onChange={(e) => setCustomStatusInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCustomStatusInForm();
                        }
                      }}
                      size="small"
                      style={{ flex: 1 }}
                    />
                    <Button
                      type="primary"
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={handleAddCustomStatusInForm}
                    >
                      Tambah
                    </Button>
                  </Space>
                </>
              )}
              options={allUniqueStatusOptions}
            />
          </Form.Item>

          <Form.Item
            name="is_primary"
            valuePropName="checked"
            label="Jadikan Sebagai Pilihan Utama (Final Choice)"
            extra="Jika diaktifkan, profil utama siswa, surat sponsor, surat pernyataan, dan CV akan otomatis disinkronkan dengan kampus ini."
          >
            <Switch />
          </Form.Item>

          <Form.Item name="notes" label="Catatan Tambahan">
            <Input.TextArea
              rows={3}
              placeholder="Catatan mengenai syarat LOO, beasiswa, atau nomor aplikasi kampus..."
              maxLength={500}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
