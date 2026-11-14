"use client";

import { useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  Button,
  Col,
  DatePicker,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  GiftOutlined,
  PlusOutlined,
  SearchOutlined,
  TagOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

import PageHeader from "@/app/components/common/page-header";
import {
  useCreatePromo,
  useDeletePromo,
  usePromos,
  useUpdatePromo,
} from "@/app/hooks/use-promo";
import type {
  PromoDataModel,
  PromoPayloadCreateModel,
  PromoPayloadUpdateModel,
} from "@/app/models/promo";
import styles from "./promo-management.module.css";

const { Text } = Typography;

type FormValues = {
  code: string;
  description?: string;
  discount: number;
  valid_range: [dayjs.Dayjs, dayjs.Dayjs];
  is_active: boolean;
};

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function isPromoActive(item: PromoDataModel): boolean {
  const now = Date.now();
  const withinRange =
    now >= new Date(item.valid_from).getTime() &&
    now <= new Date(item.valid_to).getTime();
  return Boolean(item.is_active && withinRange);
}

export default function PromoManagementContent() {
  const [form] = Form.useForm<FormValues>();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PromoDataModel | null>(null);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: promos = [], fetchLoading } = usePromos({});
  const { onCreate, onCreateLoading } = useCreatePromo();
  const { onUpdate, onUpdateLoading } = useUpdatePromo();
  const { onDelete, onDeleteLoading } = useDeletePromo();

  const loading = onCreateLoading || onUpdateLoading;

  // Filtered & sorted promos
  const filteredPromos = useMemo(() => {
    const q = keyword.trim().toLowerCase();

    return [...promos]
      .filter((item) => {
        const matchesQuery =
          !q ||
          item.code.toLowerCase().includes(q) ||
          String(item.description ?? "").toLowerCase().includes(q);

        const active = isPromoActive(item);
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active" && active) ||
          (statusFilter === "inactive" && !active);

        return matchesQuery && matchesStatus;
      })
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
  }, [promos, keyword, statusFilter]);

  // Summary counts
  const promoStats = useMemo(() => {
    let activeCount = 0;
    promos.forEach((p) => {
      if (isPromoActive(p)) activeCount += 1;
    });
    return {
      total: promos.length,
      active: activeCount,
      inactive: promos.length - activeCount,
    };
  }, [promos]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ is_active: true, discount: 10 });
    setOpen(true);
  };

  const openEdit = (item: PromoDataModel) => {
    setEditing(item);
    form.setFieldsValue({
      code: item.code,
      description: item.description ?? undefined,
      discount: item.discount,
      valid_range: [dayjs(item.valid_from), dayjs(item.valid_to)],
      is_active: item.is_active,
    });
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
    setEditing(null);
    form.resetFields();
  };

  const handleSubmit = async (values: FormValues) => {
    const payloadBase = {
      code: values.code.trim().toUpperCase(),
      description: values.description?.trim() || null,
      discount: Number(values.discount ?? 0),
      valid_from: values.valid_range[0].toISOString(),
      valid_to: values.valid_range[1].toISOString(),
      is_active: values.is_active,
    };

    if (editing) {
      const payload: PromoPayloadUpdateModel = payloadBase;
      await onUpdate({ id: editing.id, payload });
      close();
      return;
    }

    const payload: PromoPayloadCreateModel = payloadBase;
    await onCreate(payload);
    close();
  };

  const columns: ColumnsType<PromoDataModel> = [
    {
      title: "Kode Promo",
      key: "promo",
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
            <TagOutlined />
          </div>
          <div>
            <Text
              strong
              style={{
                display: "block",
                fontSize: 14,
                letterSpacing: "0.04em",
                color: "#0f172a",
              }}
            >
              {record.code}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.description || "Tanpa deskripsi"}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Diskon",
      dataIndex: "discount",
      key: "discount",
      width: 130,
      render: (value: number) => (
        <Tag
          style={{
            margin: 0,
            borderRadius: 6,
            fontWeight: 700,
            fontSize: 12,
            padding: "2px 10px",
            background: "#dcfce7",
            color: "#16a34a",
            borderColor: "#bbf7d0",
          }}
        >
          {value}% OFF
        </Tag>
      ),
    },
    {
      title: "Periode Berlaku",
      key: "period",
      width: 240,
      render: (_, record) => (
        <Text style={{ fontSize: 13, color: "#334155" }}>
          {formatDate(record.valid_from)} — {formatDate(record.valid_to)}
        </Text>
      ),
    },
    {
      title: "Status",
      key: "status",
      width: 140,
      render: (_, record) => {
        const active = isPromoActive(record);
        return active ? (
          <Tag
            style={{
              margin: 0,
              borderRadius: 999,
              fontWeight: 700,
              fontSize: 11,
              padding: "2px 10px",
              background: "#dcfce7",
              color: "#16a34a",
              borderColor: "#bbf7d0",
            }}
          >
            Aktif
          </Tag>
        ) : (
          <Tag
            style={{
              margin: 0,
              borderRadius: 999,
              fontWeight: 600,
              fontSize: 11,
              padding: "2px 10px",
              background: "#f1f5f9",
              color: "#64748b",
              borderColor: "#e2e8f0",
            }}
          >
            Tidak Aktif
          </Tag>
        );
      },
    },
    {
      title: "Aksi",
      key: "action",
      width: 140,
      align: "right",
      render: (_, record) => (
        <Space size={6}>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEdit(record)}
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
            title="Hapus promo ini?"
            description="Kode promo tidak dapat digunakan lagi oleh mahasiswa."
            okText="Ya, Hapus"
            cancelText="Batal"
            onConfirm={() => onDelete(record.id)}
            okButtonProps={{ loading: onDeleteLoading, danger: true }}
          >
            <Button danger size="small" icon={<DeleteOutlined />} style={{ borderRadius: 8 }} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.pageContainer}>
      {/* Standard Executive PageHeader */}
      <PageHeader
        title="Promo Management"
        subtitle="Kelola voucher dan potongan pendaftaran"
        icon={<GiftOutlined />}
        onAddNew={openCreate}
        addNewText="Add Promo"
      />

      {/* KPI Metric Cards Grid */}
      <div className={styles.metricCardsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricTitle}>Total Promos</div>
          <div className={styles.metricNumber}>{promoStats.total}</div>
          <div className={styles.metricSubtitle}>All registered promo codes</div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricTitle}>Active Promos</div>
          <div className={styles.metricNumber} style={{ color: "#16a34a" }}>
            {promoStats.active}
          </div>
          <div className={styles.metricSubtitle} style={{ color: "#16a34a", fontWeight: 600 }}>
            Available for student claims
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricTitle}>Expired / Inactive</div>
          <div className={styles.metricNumber} style={{ color: "#64748b" }}>
            {promoStats.inactive}
          </div>
          <div className={styles.metricSubtitle}>Period ended or disabled</div>
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
              placeholder="Search promo code or description..."
              prefix={<SearchOutlined style={{ color: "#94a3b8", fontSize: 13 }} />}
              className={styles.searchInput}
            />

            <Select
              value={statusFilter}
              onChange={(v) => setStatusFilter(v)}
              className={styles.filterSelect}
              options={[
                { value: "all", label: "All Status" },
                { value: "active", label: "Active Only" },
                { value: "inactive", label: "Inactive" },
              ]}
            />

            {(keyword || statusFilter !== "all") && (
              <Button
                onClick={() => {
                  setKeyword("");
                  setStatusFilter("all");
                }}
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

          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "#64748b" }}>
              Showing <strong>{filteredPromos.length}</strong> promos
            </span>
          </div>
        </div>

        <Table<PromoDataModel>
          rowKey="id"
          loading={fetchLoading}
          dataSource={filteredPromos}
          columns={columns}
          scroll={{ x: "max-content" }}
          pagination={{
            pageSize: 8,
            showSizeChanger: true,
            pageSizeOptions: ["8", "16", "32"],
            showTotal: (total) => `Total ${total} voucher promo`,
          }}
          locale={{
            emptyText: (
              <Empty description="Belum ada voucher promo yang sesuai filter." />
            ),
          }}
        />
      </div>

      {/* Create / Edit Modal */}
      <Modal
        open={open}
        onCancel={close}
        title={
          <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
            {editing ? "Edit Promo Code" : "Add Promo Code"}
          </div>
        }
        okText={editing ? "Save Changes" : "Save Promo"}
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
        confirmLoading={loading}
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
            name="code"
            label="Promo Code"
            tooltip="Kode kupon potongan harga unik yang dapat dimasukkan siswa."
            rules={[
              { required: true, message: "Kode promo wajib diisi" },
              { min: 3, message: "Minimal 3 karakter" },
            ]}
          >
            <Input
              placeholder="Contoh: MERDEKA2026, EARLYBIRD"
              size="large"
              style={{ borderRadius: 10, textTransform: "uppercase" }}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="Promo Description"
            tooltip="Keterangan syarat dan ketentuan penggunaan promo."
          >
            <Input.TextArea
              placeholder="Keterangan promo untuk siswa"
              rows={2}
              style={{ borderRadius: 10 }}
            />
          </Form.Item>

          <Row gutter={12}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="discount"
                label="Discount Percentage (%)"
                tooltip="Besaran persentase potongan harga yang diberikan."
                rules={[
                  { required: true, message: "Diskon wajib diisi" },
                  {
                    type: "number",
                    min: 1,
                    max: 100,
                    message: "Diskon antara 1% - 100%",
                  },
                ]}
              >
                <InputNumber
                  min={1}
                  max={100}
                  addonAfter="%"
                  style={{ width: "100%", borderRadius: 10 }}
                  size="large"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="is_active"
                label="Active Status"
                tooltip="Menentukan apakah kode promo dapat digunakan saat ini."
                valuePropName="checked"
              >
                <Switch checkedChildren="Aktif" unCheckedChildren="Mati" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="valid_range"
            label="Validity Period"
            tooltip="Rentang tanggal masa berlaku kupon promo."
            rules={[{ required: true, message: "Pilih rentang tanggal promo" }]}
          >
            <DatePicker.RangePicker
              format="YYYY-MM-DD"
              style={{ width: "100%", borderRadius: 10 }}
              size="large"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
