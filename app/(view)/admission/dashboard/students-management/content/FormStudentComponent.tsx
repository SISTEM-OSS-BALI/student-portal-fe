"use client";

import { useLookupReferral } from "@/app/hooks/use-referral";
import { useVisaTypes } from "@/app/hooks/use-visa-type-management";
import { useUsers } from "@/app/hooks/use-users";
import { useCountriesManagement } from "@/app/hooks/use-country-management";
import { useAuth } from "@/app/utils/use-auth";
import { buildConsultantOptions } from "@/app/utils/consultant-options";
import { StagesManagementDataModel } from "@/app/models/stages-management";
import {
  UserDataModel,
  StudentFormValues,
} from "@/app/models/user";
import { Button, Form, Input, InputNumber, Select, Switch } from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./form-student.module.css";

interface FormStudentComponentProps {
  onSubmit: (
    values: StudentFormValues,
  ) => void | Promise<void>;
  onDelete: () => void;
  onCancel: () => void;
  loading: boolean;
  deleteLoading: boolean;
  selectedStudent?: UserDataModel | null;
  stagesData?: StagesManagementDataModel[];
}

export const ADD_STUDENT_DRAFT_KEY = "oss_add_student_form_draft";

export default function FormStudentComponent({
  onSubmit,
  onDelete,
  onCancel,
  loading,
  deleteLoading,
  selectedStudent,
  stagesData,
}: FormStudentComponentProps) {
  const [form] = Form.useForm<StudentFormValues>();
  const selectedTypeVisa = Form.useWatch("visa_type", form);

  const { data: visaTypes } = useVisaTypes({});
  const { data: allUsers } = useUsers({});
  const { data: countriesData } = useCountriesManagement({});
  const { onLookup: onLookupReferral } = useLookupReferral();
  const { role, user_name } = useAuth();
  const isConsultant = role === "CONSULTANT";

  // Akun tim yang terdaftar dengan role CONSULTANT atau DIRECTOR (Director yang juga memegang siswa).
  const consultantOptions = useMemo(() => buildConsultantOptions(allUsers), [allUsers]);

  const [referralStatus, setReferralStatus] = useState<
    "idle" | "loading" | "found" | "not_found"
  >("idle");
  const [referralName, setReferralName] = useState<string | null>(null);
  const referralDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const checkReferralCode = useCallback(
    async (code: string) => {
      const trimmed = code.trim();
      if (!trimmed) {
        setReferralStatus("idle");
        setReferralName(null);
        return;
      }

      setReferralStatus("loading");
      try {
        const result = await onLookupReferral(trimmed);
        setReferralStatus("found");
        setReferralName(result.name);
      } catch {
        setReferralStatus("not_found");
        setReferralName(null);
      }
    },
    [onLookupReferral],
  );

  const handleReferralCodeChange = (value: string) => {
    if (referralDebounceRef.current) {
      clearTimeout(referralDebounceRef.current);
    }
    referralDebounceRef.current = setTimeout(() => {
      checkReferralCode(value);
    }, 400);
  };

  const selectedVisa = useMemo(() => {
    return (visaTypes ?? []).find((visa) => visa.id === selectedTypeVisa);
  }, [visaTypes, selectedTypeVisa]);

  const isStudentVisa = useMemo(() => {
    return String(selectedVisa?.name ?? "")
      .toLowerCase()
      .includes("student");
  }, [selectedVisa]);

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

    (countriesData ?? []).forEach((country) => {
      if (!map.has(country.id)) {
        map.set(country.id, {
          name: country.name,
          total: Number(country.document_total ?? 0),
          stage_id: country.id,
        });
      }
    });

    const fallbackList = [
      { id: "cty_aus", name: "Australia" },
      { id: "cty_can", name: "Canada" },
      { id: "cty_uk", name: "United Kingdom" },
      { id: "cty_nz", name: "New Zealand" },
      { id: "cty_usa", name: "United States" },
      { id: "cty_deu", name: "Germany" },
    ];
    fallbackList.forEach((c) => {
      if (!map.has(c.id)) {
        map.set(c.id, {
          name: c.name,
          total: 0,
          stage_id: c.id,
        });
      }
    });

    return Array.from(map.values())
      .map((value) => ({
        id: value.stage_id,
        name: value.name,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [stagesData, countriesData]);

  const prevVisaTypeRef = useRef<string | undefined>(selectedTypeVisa);
  const isVisaTypesLoaded = Boolean(visaTypes && visaTypes.length > 0);

  useEffect(() => {
    if (
      isVisaTypesLoaded &&
      prevVisaTypeRef.current &&
      prevVisaTypeRef.current !== selectedTypeVisa
    ) {
      if (!isStudentVisa) {
        form.setFieldsValue({
          name_campus: undefined,
          degree: undefined,
          name_degree: undefined,
        });
      }
    }
    prevVisaTypeRef.current = selectedTypeVisa;
  }, [form, isStudentVisa, isVisaTypesLoaded, selectedTypeVisa]);

  const handleValuesChange = (
    _: unknown,
    allValues: StudentFormValues,
  ) => {
    if (!selectedStudent && typeof window !== "undefined") {
      try {
        localStorage.setItem(
          ADD_STUDENT_DRAFT_KEY,
          JSON.stringify(allValues),
        );
      } catch (err) {
        console.error("Gagal menyimpan draft form student:", err);
      }
    }
  };

  const handleCancel = () => {
    if (!selectedStudent && typeof window !== "undefined") {
      localStorage.removeItem(ADD_STUDENT_DRAFT_KEY);
      sessionStorage.removeItem("oss_add_student_modal_open");
    }
    onCancel();
  };

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
        has_initial_translations:
          selectedStudent.has_initial_translations ?? false,
        no_phone: selectedStudent.no_phone ?? undefined,
        name_consultant: selectedStudent.name_consultant ?? undefined,
        source: selectedStudent.source ?? undefined,
        source_category: selectedStudent.source_category ?? undefined,
        code_referral: selectedStudent.code_referral ?? undefined,
        gdrive_folder_url: selectedStudent.gdrive_folder_url ?? undefined,
      });
      const codeReferral = selectedStudent.code_referral;
      const timer = setTimeout(() => {
        if (codeReferral) {
          checkReferralCode(codeReferral);
        } else {
          setReferralStatus("idle");
          setReferralName(null);
        }
      }, 0);
      return () => clearTimeout(timer);
    }

    let draftData: Partial<StudentFormValues> | null = null;
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(ADD_STUDENT_DRAFT_KEY);
        if (raw) {
          draftData = JSON.parse(raw);
        }
      } catch {
        draftData = null;
      }
    }

    if (draftData && Object.keys(draftData).length > 0) {
      form.setFieldsValue(draftData);
      const codeReferral = draftData.code_referral;
      const timer = setTimeout(() => {
        if (codeReferral) {
          checkReferralCode(codeReferral);
        } else {
          setReferralStatus("idle");
          setReferralName(null);
        }
      }, 0);
      return () => clearTimeout(timer);
    }

    form.resetFields();
    if (isConsultant && user_name) {
      form.setFieldsValue({ name_consultant: user_name });
    }
    const timer = setTimeout(() => {
      setReferralStatus("idle");
      setReferralName(null);
    }, 0);
    return () => clearTimeout(timer);
  }, [form, selectedStudent, checkReferralCode, isConsultant, user_name]);

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onSubmit}
      onValuesChange={handleValuesChange}
    >
      <div className={styles.formStudentGrid}>
      <Form.Item
        name="name"
        label="Full Name"
        tooltip="Nama lengkap siswa sesuai paspor atau kartu identitas."
        rules={[{ required: true, message: "Nama wajib diisi" }]}
      >
        <Input placeholder="Masukkan nama student" />
      </Form.Item>

      <Form.Item
        name="email"
        label="Email Address"
        tooltip="Alamat email aktif untuk akun login siswa."
        rules={[
          { required: true, message: "Email wajib diisi" },
          { type: "email", message: "Format email tidak valid" },
        ]}
      >
        <Input placeholder="student@email.com" />
      </Form.Item>

      <Form.Item
        name="no_phone"
        label="Phone Number"
        tooltip="Nomor telepon atau WhatsApp aktif siswa."
        rules={[
          {
            pattern: /^[0-9+()\-\s]*$/,
            message: "Nomor HP hanya boleh angka dan simbol +()-",
          },
        ]}
      >
        <Input placeholder="Contoh: +62 812 3456 7890" />
      </Form.Item>

      <Form.Item
        name="translation_quota"
        label="Translation Quota"
        tooltip="Jumlah kuota penerjemahan dokumen tersumpah untuk siswa."
        rules={[{ required: true, message: "Translation quota wajib diisi" }]}
      >
        <InputNumber min={0} style={{ width: "100%" }} placeholder="0" />
      </Form.Item>

      <Form.Item
        name="has_initial_translations"
        label="Initial Translation Available"
        tooltip="Tandai jika siswa sudah memiliki dokumen terjemahan tersumpah mandiri."
        valuePropName="checked"
      >
        <Switch />
      </Form.Item>

      <Form.Item
        name="visa_type"
        label="Visa Type"
        tooltip="Jenis visa yang diajukan oleh siswa."
        rules={[{ required: true, message: "Tipe visa wajib dipilih" }]}
      >
        <Select
          placeholder="Pilih tipe visa"
          showSearch
          optionFilterProp="label"
          options={(visaTypes ?? []).map((visa) => ({
            value: visa.id,
            label: visa.name,
          }))}
        />
      </Form.Item>

      {isStudentVisa && (
        <>
          <Form.Item
            name="name_campus"
            label="Campus Name"
            tooltip="Nama universitas atau institusi pendidikan tujuan studi."
          >
            <Input placeholder="Contoh: University of Melbourne" />
          </Form.Item>

          <Form.Item
            name="degree"
            label="Degree Level"
            tooltip="Tingkat jenjang studi yang diambil siswa."
          >
            <Select placeholder="Pilih jenjang pendidikan" allowClear>
              <Select.Option value="diploma">Diploma</Select.Option>
              <Select.Option value="bachelor">Bachelor</Select.Option>
              <Select.Option value="master">Master</Select.Option>
              <Select.Option value="doctorate">Doctorate</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="name_degree"
            label="Field of Study"
            tooltip="Jurusan atau program studi yang diambil siswa."
          >
            <Input placeholder="Contoh: Computer Science" />
          </Form.Item>
        </>
      )}

      {!selectedStudent && (
        <Form.Item
          name="password"
          label="Password"
          tooltip="Kata sandi akun login siswa minimal 8 karakter."
          rules={[
            { required: true, message: "Password wajib diisi" },
            { min: 8, message: "Minimal 8 karakter" },
          ]}
        >
          <Input.Password placeholder="Minimal 8 karakter" />
        </Form.Item>
      )}

      <Form.Item
        name="name_consultant"
        label="Consultant Name"
        tooltip="Nama staf konsultan yang mendampingi siswa."
        rules={[{ required: true, message: "Nama Konsultan wajib diisi" }]}
      >
        <Select
          placeholder="Pilih nama konsultan"
          showSearch
          allowClear
          disabled={isConsultant}
          optionFilterProp="label"
          options={consultantOptions}
          notFoundContent="Tidak ada konsultan terdaftar"
        />
      </Form.Item>

      <Form.Item
        name="source"
        label="Lead Source"
        tooltip="Kanal asal mula calon siswa mengetahui layanan."
      >
        <Select placeholder="Pilih sumber leads">
          <Select.Option value="instagram">Instagram</Select.Option>
          <Select.Option value="facebook">Facebook</Select.Option>
          <Select.Option value="tiktok">TikTok</Select.Option>
          <Select.Option value="walkin">Walk-in</Select.Option>
          <Select.Option value="website">Website</Select.Option>
          <Select.Option value="referral">Referral</Select.Option>
          <Select.Option value="other">Other</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="source_category"
        label="Lead Source Category"
        tooltip="Klasifikasi jenis saluran perolehan calon siswa."
      >
        <Select placeholder="Pilih kategori sumber leads">
          <Select.Option value="digital">Digital</Select.Option>
          <Select.Option value="offline">Offline</Select.Option>
          <Select.Option value="referral">Referral</Select.Option>
          <Select.Option value="agent">Agent</Select.Option>
          <Select.Option value="other">Other</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="code_referral"
        label="Referral Code"
        tooltip="Kode rujukan dari pihak yang mereferensikan siswa."
        extra={
          referralStatus === "loading" ? (
            "Mengecek kode referral..."
          ) : referralStatus === "found" ? (
            <span style={{ color: "#52c41a" }}>
              ✓ Terdaftar atas nama {referralName}
            </span>
          ) : referralStatus === "not_found" ? (
            <span style={{ color: "#ff4d4f" }}>
              Kode referral tidak ditemukan
            </span>
          ) : (
            "Opsional. Masukkan kode referral jika ada."
          )
        }
      >
        <Input
          placeholder="Masukkan kode referral"
          onChange={(e) => handleReferralCodeChange(e.target.value)}
        />
      </Form.Item>

      <Form.Item
        name="gdrive_folder_url"
        label="Google Drive Folder Link"
        tooltip="Tautan folder Google Drive mahasiswa untuk kebutuhan arsip dokumen internal tim."
        rules={[
          {
            type: "url",
            message: "Format URL tidak valid (harus diawali http:// atau https://)",
          },
        ]}
      >
        <Input placeholder="Contoh https://drive.google.com/drive/folders/..." allowClear />
      </Form.Item>

      <Form.Item
        name="stage_id"
        label="Destination Country"
        tooltip="Negara tujuan studi yang dipilih oleh siswa."
        rules={[{ required: true, message: "Pilih negara" }]}
      >
        <Select placeholder="Pilih negara">
          {countryOptions.map((country) => (
            <Select.Option key={country.id} value={country.id}>
              {country.name}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
      </div>

      <div className={styles.formStudentFooter}>
        <Button onClick={handleCancel}>Batal</Button>

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
      </div>
    </Form>
  );
}
