"use client";

import { StagesManagementDataModel } from "@/app/models/stages-management";
import { UserDataModel, UserPayloadCreateModel } from "@/app/models/user";
import { Button, Form, Input, InputNumber, Select, Space } from "antd";
import { useEffect, useMemo } from "react";

interface FormStudentComponentProps {
  onSubmit: (values: UserPayloadCreateModel) => void;
  onDelete: () => void;
  onCancel: () => void;
  loading: boolean;
  deleteLoading: boolean;
  selectedStudent?: UserDataModel | null;
  stagesData?: StagesManagementDataModel[];
}

export default function FormStudentComponent({
  onSubmit,
  onDelete,
  onCancel,
  loading,
  deleteLoading,
  selectedStudent,
  stagesData,
}: FormStudentComponentProps) {
  const [form] = Form.useForm<UserPayloadCreateModel>();
  const selectedTypeVisa = Form.useWatch("visa_type", form);

  const countryOptions = useMemo(() => {
    const map = new Map<
      string,
      { name: string; total: number; stage_id: string }
    >();
    (stagesData ?? []).forEach((stage) => {
      const country_id = stage.country_id;
      const name = stage.country?.name ?? country_id;
      if (!map.has(country_id)) {
        map.set(country_id, { name, total: 0, stage_id: stage.id });
      }
      map.get(country_id)!.total += 1;
    });
    return Array.from(map.entries()).map(([id, value]) => ({
      id: value.stage_id,
      name: value.name,
      total: value.total,
    }));
  }, [stagesData]);

  useEffect(() => {
    if (selectedStudent) {
      form.setFieldsValue({
        name: selectedStudent.name,
        email: selectedStudent.email,
        stage_id: selectedStudent.stage_id ?? undefined,
        name_campus: selectedStudent.name_campus ?? undefined,
        degree: selectedStudent.degree ?? undefined,
        name_degree: selectedStudent.name_degree ?? undefined,
        visa_type: selectedStudent.visa_type ?? undefined,
        translation_quota: selectedStudent.translation_quota ?? 0,
        no_phone: selectedStudent.no_phone ?? undefined,
      });
      return;
    }
    form.resetFields();
  }, [form, selectedStudent]);

  return (
    <Form form={form} layout="vertical" onFinish={onSubmit}>
      <Form.Item
        name="name"
        label="Nama Lengkap"
        rules={[{ required: true, message: "Nama wajib diisi" }]}
      >
        <Input placeholder="Masukkan nama student" />
      </Form.Item>

      <Form.Item
        name="email"
        label="Email"
        rules={[
          { required: true, message: "Email wajib diisi" },
          { type: "email", message: "Format email tidak valid" },
        ]}
      >
        <Input placeholder="student@email.com" />
      </Form.Item>

      <Form.Item
        name="no_phone"
        label="No. HP"
        rules={[
          {
            pattern: /^[0-9+()\\-\\s]*$/,
            message: "Nomor HP hanya boleh angka dan simbol +()-",
          },
        ]}
      >
        <Input placeholder="Contoh: +62 812 3456 7890" />
      </Form.Item>

      <Form.Item
        name="translation_quota"
        label="Translation Quota"
        rules={[{ required: true, message: "Translation quota wajib diisi" }]}
      >
        <InputNumber min={0} style={{ width: "100%" }} placeholder="0" />
      </Form.Item>

      <Form.Item
        name="visa_type"
        label="Tipe Visa"
        rules={[{ required: true, message: "Tipe visa wajib dipilih" }]}
      >
        <Select placeholder="Pilih tipe visa">
          <Select.Option value="student_visa_500">
            Student Visa • Subclass 500
          </Select.Option>
          <Select.Option value="student_guardian_590">
            Student Guardian • Subclass 590
          </Select.Option>
          <Select.Option value="temporary_grad_485">
            Temporary Graduate • Subclass 485
          </Select.Option>
          <Select.Option value="visitor_600">
            Visitor • Subclass 600
          </Select.Option>
        </Select>
      </Form.Item>

      {selectedTypeVisa == "student_visa_500" && (
        <>
          <Form.Item
            name="name_campus"
            label="Nama Kampus"
            rules={[{ required: true, message: "Nama kampus wajib diisi" }]}
          >
            <Input placeholder="Contoh: University of Melbourne" />
          </Form.Item>

          <Form.Item
            name="degree"
            label="Degree"
            rules={[{ required: true, message: "Degree wajib dipilih" }]}
          >
            <Select placeholder="Pilih degree">
              <Select.Option value="diploma">Diploma</Select.Option>
              <Select.Option value="bachelor">Bachelor</Select.Option>
              <Select.Option value="master">Master</Select.Option>
              <Select.Option value="doctorate">Doctorate</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="name_degree"
            label="Nama Degree"
            rules={[{ required: true, message: "Nama degree wajib diisi" }]}
          >
            <Input placeholder="Contoh: Computer Science" />
          </Form.Item>
        </>
      )}

      {!selectedStudent && (
        <Form.Item
          name="password"
          label="Password"
          rules={[
            { required: true, message: "Password wajib diisi" },
            { min: 8, message: "Minimal 8 karakter" },
          ]}
        >
          <Input.Password placeholder="Minimal 8 karakter" />
        </Form.Item>
      )}

      <Form.Item
        name="stage_id"
        label="Negara"
        rules={[{ required: true, message: "Pilih negara" }]}
      >
        <Select placeholder="Pilih negara">
          {countryOptions.map((country) => (
            <Select.Option key={country.id} value={country.id}>
              {country.name} • {country.total} dokumen
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item label="Role">
        <Input value="Student" disabled />
      </Form.Item>

      <Space style={{ width: "100%", justifyContent: "flex-end" }}>
        <Button onClick={onCancel}>Batal</Button>
        <Button
          danger
          onClick={onDelete}
          disabled={!selectedStudent}
          loading={deleteLoading}
        >
          Hapus
        </Button>
        <Button type="primary" htmlType="submit" loading={loading}>
          {selectedStudent ? "Simpan Perubahan" : "Simpan"}
        </Button>
      </Space>
    </Form>
  );
}
