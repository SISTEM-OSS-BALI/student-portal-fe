"use client";

import { useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from "antd";
import { DeleteOutlined, EditOutlined, GiftOutlined, PlusOutlined } from "@ant-design/icons";

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

const { Title, Text } = Typography;

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
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function PromoManagementContent() {
  const [form] = Form.useForm<FormValues>();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PromoDataModel | null>(null);

  const { data: promos = [], fetchLoading } = usePromos({});
  const { onCreate, onCreateLoading } = useCreatePromo();
  const { onUpdate, onUpdateLoading } = useUpdatePromo();
  const { onDelete, onDeleteLoading } = useDeletePromo();

  const loading = onCreateLoading || onUpdateLoading;

  const sortedPromos = useMemo(() => {
    return [...promos].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }, [promos]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ is_active: true, discount: 0 });
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
      code: values.code,
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

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Card>
        <Space
          align="start"
          style={{ width: "100%", justifyContent: "space-between" }}
        >
          <div>
            <Title level={3} style={{ marginBottom: 4 }}>
              Promo Management
            </Title>
            <Text type="secondary">
              Admission dapat membuat promo untuk ditampilkan di navbar student.
            </Text>
          </div>

          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Create Promo
          </Button>
        </Space>
      </Card>

      <Card>
        <Table<PromoDataModel>
          rowKey="id"
          loading={fetchLoading}
          dataSource={sortedPromos}
          pagination={{ pageSize: 8 }}
          columns={[
            {
              title: "Promo",
              key: "promo",
              render: (_, record) => (
                <Space direction="vertical" size={0}>
                  <Text strong>{record.code}</Text>
                  <Text type="secondary">{record.description || "-"}</Text>
                </Space>
              ),
            },
            {
              title: "Discount",
              dataIndex: "discount",
              key: "discount",
              render: (value: number) => <Text>{value}%</Text>,
            },
            {
              title: "Periode",
              key: "period",
              render: (_, record) => (
                <Text>
                  {formatDate(record.valid_from)} - {formatDate(record.valid_to)}
                </Text>
              ),
            },
            {
              title: "Status",
              key: "status",
              render: (_, record) => {
                const now = Date.now();
                const withinRange =
                  now >= new Date(record.valid_from).getTime() &&
                  now <= new Date(record.valid_to).getTime();

                return record.is_active && withinRange ? (
                  <Tag color="green">Active</Tag>
                ) : (
                  <Tag>Inactive</Tag>
                );
              },
            },
            {
              title: "Action",
              key: "action",
              width: 160,
              render: (_, record) => (
                <Space>
                  <Button
                    icon={<EditOutlined />}
                    onClick={() => openEdit(record)}
                  />
                  <Popconfirm
                    title="Delete promo?"
                    onConfirm={() => onDelete(record.id)}
                    okButtonProps={{ loading: onDeleteLoading }}
                  >
                    <Button danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
          locale={{
            emptyText: (
              <Space direction="vertical" align="center">
                <GiftOutlined style={{ fontSize: 24, color: "#94a3b8" }} />
                <Text type="secondary">Belum ada promo</Text>
              </Space>
            ),
          }}
        />
      </Card>

      <Modal
        title={editing ? "Edit Promo" : "Create Promo"}
        open={open}
        onCancel={close}
        onOk={() => form.submit()}
        confirmLoading={loading}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="code"
            label="Promo Code"
            rules={[{ required: true, message: "Promo code wajib diisi" }]}
          >
            <Input placeholder="Contoh: PROMO2026" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Deskripsi promo" />
          </Form.Item>

          <Form.Item
            name="discount"
            label="Discount (%)"
            rules={[{ required: true, message: "Discount wajib diisi" }]}
          >
            <InputNumber min={0} max={100} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            name="valid_range"
            label="Valid Period"
            rules={[{ required: true, message: "Periode wajib diisi" }]}
          >
            <DatePicker.RangePicker style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            name="is_active"
            label="Aktif"
            valuePropName="checked"
            initialValue
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}

