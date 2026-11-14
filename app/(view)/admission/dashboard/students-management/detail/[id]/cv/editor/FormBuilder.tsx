"use client";

import React, { useState } from "react";
import dayjs from "dayjs";
import {
  Button,
  Card,
  Col,
  Collapse,
  Divider,
  Flex,
  Input,
  Row,
  Select,
  Space,
  Tag,
  Typography,
} from "antd";
import {
  BookOutlined,
  CompassOutlined,
  DeleteOutlined,
  GlobalOutlined,
  MinusCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
  TeamOutlined,
  TrophyOutlined,
  UserOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { message } from "antd";
import { generateProfileSummaryText } from "@/app/utils/ai-profile-summary";
import type {
  CvActivity,
  CvData,
  CvEducation,
  CvEmploymentHistory,
  CvExperience,
  CvLanguage,
  CvLeadership,
  CvNextOfKin,
  CvNonformalEducation,
  CvSkill,
  CvTravelHistory,
} from "./types";

type FormBuilderProps = {
  cv: CvData;
  onChange: (updated: Partial<CvData>) => void;
  onSaveDraft?: () => void;
  saving?: boolean;
  onReset?: () => void;
};

export default function FormBuilder({
  cv,
  onChange,
  onSaveDraft,
  saving = false,
  onReset,
}: FormBuilderProps) {
  const [skillInput, setSkillInput] = useState("");
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    try {
      const summary = await generateProfileSummaryText({
        fullName: `${cv.first_name || ""} ${cv.last_name || ""}`.trim(),
        jobTitle: cv.job_title,
        educations: cv.educations,
        experiences: cv.experiences,
        skills: cv.skills,
      });
      handleFieldChange("profile_description", summary);
      message.success("Ringkasan profil profesional berhasil disusun dengan AI.");
    } catch {
      message.error("Gagal menyusun ringkasan profil.");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleFieldChange = (field: keyof CvData, value: unknown) => {
    if (field === "date_of_birth" && typeof value === "string") {
      const parsed = dayjs(value);
      if (parsed.isValid()) {
        const diff = dayjs().diff(parsed, "year");
        if (diff > 0 && diff < 120) {
          onChange({ [field]: value, age: String(diff) });
          return;
        }
      }
    }
    onChange({ [field]: value });
  };

  const handleKinChange = (field: keyof CvNextOfKin, value: string) => {
    const kin = cv.next_of_kin || {
      name: "",
      relationship: "Parent",
      address: "",
      city: "",
      province: "",
      postal_code: "",
      country: "Indonesia",
      contact_no: "",
      email: "",
    };
    onChange({ next_of_kin: { ...kin, [field]: value } });
  };

  // Education Handlers
  const handleAddEducation = () => {
    const newEdu: CvEducation = {
      id: `edu-${Date.now()}`,
      school_name: "",
      degree: "",
      major: "",
      start_date: "",
      end_date: "",
      description: "",
    };
    onChange({ educations: [...(cv.educations || []), newEdu] });
  };

  const handleUpdateEducation = (id: string, field: keyof CvEducation, value: string) => {
    const updated = (cv.educations || []).map((edu) =>
      edu.id === id ? { ...edu, [field]: value } : edu,
    );
    onChange({ educations: updated });
  };

  const handleRemoveEducation = (id: string) => {
    onChange({ educations: (cv.educations || []).filter((edu) => edu.id !== id) });
  };

  // Nonformal Education Handlers
  const handleAddNonformal = () => {
    const newNon: CvNonformalEducation = {
      id: `non-${Date.now()}`,
      level: "",
      school: "",
      commence: "",
      completed: "",
    };
    onChange({ nonformal_educations: [...(cv.nonformal_educations || []), newNon] });
  };

  const handleUpdateNonformal = (id: string, field: keyof CvNonformalEducation, value: string) => {
    const updated = (cv.nonformal_educations || []).map((n) =>
      n.id === id ? { ...n, [field]: value } : n,
    );
    onChange({ nonformal_educations: updated });
  };

  const handleRemoveNonformal = (id: string) => {
    onChange({ nonformal_educations: (cv.nonformal_educations || []).filter((n) => n.id !== id) });
  };

  // Experience Handlers
  const handleAddExperience = () => {
    const newExp: CvExperience = {
      id: `exp-${Date.now()}`,
      job_title: "",
      company: "",
      start_date: "",
      end_date: "",
      description: "",
    };
    onChange({ experiences: [...(cv.experiences || []), newExp] });
  };

  const handleUpdateExperience = (id: string, field: keyof CvExperience, value: string) => {
    const updated = (cv.experiences || []).map((exp) =>
      exp.id === id ? { ...exp, [field]: value } : exp,
    );
    onChange({ experiences: updated });
  };

  const handleRemoveExperience = (id: string) => {
    onChange({ experiences: (cv.experiences || []).filter((exp) => exp.id !== id) });
  };

  // Travel Handlers
  const handleAddTravel = () => {
    const newTrv: CvTravelHistory = {
      id: `trv-${Date.now()}`,
      country: "",
      purpose: "",
      start_date: "",
      end_date: "",
    };
    onChange({ travel_history: [...(cv.travel_history || []), newTrv] });
  };

  const handleUpdateTravel = (id: string, field: keyof CvTravelHistory, value: string) => {
    const updated = (cv.travel_history || []).map((t) =>
      t.id === id ? { ...t, [field]: value } : t,
    );
    onChange({ travel_history: updated });
  };

  const handleRemoveTravel = (id: string) => {
    onChange({ travel_history: (cv.travel_history || []).filter((t) => t.id !== id) });
  };

  // Skill Handlers
  const handleAddSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed) return;
    const newSkill: CvSkill = { id: `skill-${Date.now()}`, name: trimmed };
    onChange({ skills: [...(cv.skills || []), newSkill] });
    setSkillInput("");
  };

  const handleRemoveSkill = (id: string) => {
    onChange({ skills: (cv.skills || []).filter((s) => s.id !== id) });
  };

  // Language Handlers
  const handleAddLanguage = () => {
    const newLang: CvLanguage = {
      id: `lang-${Date.now()}`,
      name: "",
      proficiency: "Fluent",
    };
    onChange({ languages: [...(cv.languages || []), newLang] });
  };

  const handleUpdateLanguage = (id: string, field: keyof CvLanguage, value: string) => {
    const updated = (cv.languages || []).map((lang) =>
      lang.id === id ? { ...lang, [field]: value } : lang,
    );
    onChange({ languages: updated });
  };

  const handleRemoveLanguage = (id: string) => {
    onChange({ languages: (cv.languages || []).filter((l) => l.id !== id) });
  };

  // Leadership Handlers
  const handleAddLeadership = () => {
    const newLead: CvLeadership = {
      id: `lead-${Date.now()}`,
      role: "",
      organization: "",
      start_date: "",
      end_date: "",
      description: "",
    };
    onChange({ leaderships: [...(cv.leaderships || []), newLead] });
  };

  const handleUpdateLeadership = (id: string, field: keyof CvLeadership, value: string) => {
    const updated = (cv.leaderships || []).map((lead) =>
      lead.id === id ? { ...lead, [field]: value } : lead,
    );
    onChange({ leaderships: updated });
  };

  const handleRemoveLeadership = (id: string) => {
    onChange({ leaderships: (cv.leaderships || []).filter((l) => l.id !== id) });
  };

  const kin = cv.next_of_kin || {
    name: "",
    relationship: "Parent",
    address: "",
    city: cv.city || "",
    province: cv.province_state || "",
    postal_code: cv.postal_code || "",
    country: cv.country || "Indonesia",
    contact_no: "",
    email: "",
  };

  const collapseItems = [
    {
      key: "1",
      label: (
        <span style={{ fontWeight: 700, fontSize: 14 }}>
          <UserOutlined style={{ marginRight: 8, color: "#2563eb" }} />
          1. Data Diri & Identitas Resmi
        </span>
      ),
      children: (
        <Row gutter={[12, 12]}>
          <Col xs={24} sm={12}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Nama Depan</label>
            <Input
              value={cv.first_name}
              onChange={(e) => handleFieldChange("first_name", e.target.value)}
              placeholder="Nama depan"
              style={{ marginTop: 4, borderRadius: 8 }}
            />
          </Col>
          <Col xs={24} sm={12}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Nama Belakang</label>
            <Input
              value={cv.last_name}
              onChange={(e) => handleFieldChange("last_name", e.target.value)}
              placeholder="Nama belakang"
              style={{ marginTop: 4, borderRadius: 8 }}
            />
          </Col>
          <Col xs={24} sm={12}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Email</label>
            <Input
              value={cv.email}
              onChange={(e) => handleFieldChange("email", e.target.value)}
              placeholder="email@contoh.com"
              style={{ marginTop: 4, borderRadius: 8 }}
            />
          </Col>
          <Col xs={24} sm={12}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Nomor Telepon</label>
            <Input
              value={cv.phone}
              onChange={(e) => handleFieldChange("phone", e.target.value)}
              placeholder="+62 812-xxxx-xxxx"
              style={{ marginTop: 4, borderRadius: 8 }}
            />
          </Col>
          <Col xs={24} sm={12}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Kota Domisili</label>
            <Input
              value={cv.city}
              onChange={(e) => handleFieldChange("city", e.target.value)}
              placeholder="Contoh: Denpasar"
              style={{ marginTop: 4, borderRadius: 8 }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Provinsi / State</label>
            <Input
              value={cv.province_state}
              onChange={(e) => handleFieldChange("province_state", e.target.value)}
              placeholder="Bali"
              style={{ marginTop: 4, borderRadius: 8 }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Kode Pos</label>
            <Input
              value={cv.postal_code}
              onChange={(e) => handleFieldChange("postal_code", e.target.value)}
              placeholder="80227"
              style={{ marginTop: 4, borderRadius: 8 }}
            />
          </Col>

          <Col xs={12} sm={6}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Tanggal Lahir</label>
            <Input
              value={cv.date_of_birth}
              onChange={(e) => handleFieldChange("date_of_birth", e.target.value)}
              placeholder="DD/MM/YYYY"
              style={{ marginTop: 4, borderRadius: 8 }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Tempat Lahir</label>
            <Input
              value={cv.place_of_birth}
              onChange={(e) => handleFieldChange("place_of_birth", e.target.value)}
              placeholder="Kota lahir"
              style={{ marginTop: 4, borderRadius: 8 }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Umur (Dihitung Otomatis)</label>
            <Input
              value={cv.age}
              onChange={(e) => handleFieldChange("age", e.target.value)}
              placeholder="Dihitung otomatis dari tgl lahir"
              style={{ marginTop: 4, borderRadius: 8, backgroundColor: "#f8fafc" }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Kewarganegaraan</label>
            <Input
              value={cv.nationality}
              onChange={(e) => handleFieldChange("nationality", e.target.value)}
              placeholder="Indonesian"
              style={{ marginTop: 4, borderRadius: 8 }}
            />
          </Col>

          <Col xs={12} sm={6}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Jenis Kelamin</label>
            <Select
              value={cv.gender || "Male"}
              onChange={(val) => handleFieldChange("gender", val)}
              style={{ width: "100%", marginTop: 4 }}
              options={[
                { value: "Male", label: "Male" },
                { value: "Female", label: "Female" },
              ]}
            />
          </Col>
          <Col xs={12} sm={6}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Status Pernikahan</label>
            <Input
              value={cv.marital_status}
              onChange={(e) => handleFieldChange("marital_status", e.target.value)}
              placeholder="Single"
              style={{ marginTop: 4, borderRadius: 8 }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Tinggi (cm)</label>
            <Input
              value={cv.height}
              onChange={(e) => handleFieldChange("height", e.target.value)}
              placeholder="170"
              style={{ marginTop: 4, borderRadius: 8 }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Berat (kg)</label>
            <Input
              value={cv.weight}
              onChange={(e) => handleFieldChange("weight", e.target.value)}
              placeholder="65"
              style={{ marginTop: 4, borderRadius: 8 }}
            />
          </Col>

          <Col xs={24} sm={12}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Nomor KTP (ID Number)</label>
            <Input
              value={cv.id_number}
              onChange={(e) => handleFieldChange("id_number", e.target.value)}
              placeholder="Nomor NIK KTP"
              style={{ marginTop: 4, borderRadius: 8 }}
            />
          </Col>
          <Col xs={24} sm={12}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Nomor Paspor (Passport Number)</label>
            <Input
              value={cv.passport_number}
              onChange={(e) => handleFieldChange("passport_number", e.target.value)}
              placeholder="Nomor Paspor"
              style={{ marginTop: 4, borderRadius: 8 }}
            />
          </Col>

          <Col xs={24}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Target Studi / Profesi</label>
            <Input
              value={cv.job_title}
              onChange={(e) => handleFieldChange("job_title", e.target.value)}
              placeholder="Contoh: Bachelor of Business"
              style={{ marginTop: 4, borderRadius: 8 }}
            />
          </Col>

          <Col xs={24}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Tautan Foto Profil (Untuk Format 2)</label>
            <Input
              value={cv.photo_url}
              onChange={(e) => handleFieldChange("photo_url", e.target.value)}
              placeholder="https://..."
              style={{ marginTop: 4, borderRadius: 8 }}
            />
          </Col>
          <Col xs={24}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>
                Ringkasan Profil (Untuk Format 1 & 2)
              </label>
              <Button
                size="small"
                type="dashed"
                icon={<ThunderboltOutlined />}
                loading={isGeneratingSummary}
                onClick={handleGenerateSummary}
                style={{ fontSize: 12, borderRadius: 6, color: "#4f46e5", borderColor: "#c7d2fe" }}
              >
                Susun dengan AI
              </Button>
            </div>
            <Input.TextArea
              rows={3}
              value={cv.profile_description}
              onChange={(e) => handleFieldChange("profile_description", e.target.value)}
              placeholder="Uraikan ringkasan minat, pencapaian, dan fokus akademik siswa..."
              style={{ marginTop: 4, borderRadius: 8 }}
            />
          </Col>
        </Row>
      ),
    },
    {
      key: "2",
      label: (
        <span style={{ fontWeight: 700, fontSize: 14 }}>
          <BookOutlined style={{ marginRight: 8, color: "#10b981" }} />
          2. Pendidikan Formal & Nonformal
        </span>
      ),
      children: (
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <div>
            <Typography.Text strong style={{ fontSize: 13, color: "#0f172a" }}>
              Pendidikan Formal ({cv.educations?.length || 0}):
            </Typography.Text>
            <Space direction="vertical" size={12} style={{ width: "100%", marginTop: 8 }}>
              {(cv.educations || []).map((edu, idx) => (
                <Card
                  key={edu.id}
                  size="small"
                  style={{ borderRadius: 10, borderColor: "#e2e8f0", backgroundColor: "#f8fafc" }}
                  title={<span style={{ fontSize: 13, fontWeight: 600 }}>Pendidikan #{idx + 1}: {edu.school_name || "Institusi"}</span>}
                  extra={<Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleRemoveEducation(edu.id)} />}
                >
                  <Row gutter={[10, 10]}>
                    <Col xs={24} sm={14}>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Sekolah / Universitas</label>
                      <Input
                        value={edu.school_name}
                        onChange={(e) => handleUpdateEducation(edu.id, "school_name", e.target.value)}
                        placeholder="Nama institusi"
                        style={{ borderRadius: 6, marginTop: 2 }}
                      />
                    </Col>
                    <Col xs={24} sm={10}>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Jenjang / Level</label>
                      <Input
                        value={edu.degree}
                        onChange={(e) => handleUpdateEducation(edu.id, "degree", e.target.value)}
                        placeholder="Bachelor Degree"
                        style={{ borderRadius: 6, marginTop: 2 }}
                      />
                    </Col>
                    <Col xs={12} sm={12}>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Tahun Masuk (Commence)</label>
                      <Input
                        value={edu.start_date}
                        onChange={(e) => handleUpdateEducation(edu.id, "start_date", e.target.value)}
                        placeholder="2017"
                        style={{ borderRadius: 6, marginTop: 2 }}
                      />
                    </Col>
                    <Col xs={12} sm={12}>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Tahun Lulus (Completed)</label>
                      <Input
                        value={edu.end_date}
                        onChange={(e) => handleUpdateEducation(edu.id, "end_date", e.target.value)}
                        placeholder="2021"
                        style={{ borderRadius: 6, marginTop: 2 }}
                      />
                    </Col>
                  </Row>
                </Card>
              ))}

              <Button type="dashed" block icon={<PlusOutlined />} onClick={handleAddEducation} style={{ borderRadius: 8 }}>
                Tambah Pendidikan Formal
              </Button>
            </Space>
          </div>

          <Divider style={{ margin: "6px 0" }} />

          <div>
            <Typography.Text strong style={{ fontSize: 13, color: "#0f172a" }}>
              Pendidikan Nonformal / Pelatihan ({cv.nonformal_educations?.length || 0}):
            </Typography.Text>
            <Space direction="vertical" size={12} style={{ width: "100%", marginTop: 8 }}>
              {(cv.nonformal_educations || []).map((non, idx) => (
                <Card
                  key={non.id}
                  size="small"
                  style={{ borderRadius: 10, borderColor: "#e2e8f0", backgroundColor: "#f8fafc" }}
                  title={<span style={{ fontSize: 13, fontWeight: 600 }}>Kursus / Pelatihan #{idx + 1}</span>}
                  extra={<Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleRemoveNonformal(non.id)} />}
                >
                  <Row gutter={[10, 10]}>
                    <Col xs={24} sm={12}>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Nama Lembaga / Kursus</label>
                      <Input
                        value={non.school}
                        onChange={(e) => handleUpdateNonformal(non.id, "school", e.target.value)}
                        placeholder="Nama tempat kursus"
                        style={{ borderRadius: 6, marginTop: 2 }}
                      />
                    </Col>
                    <Col xs={24} sm={12}>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Tingkat / Bidang</label>
                      <Input
                        value={non.level}
                        onChange={(e) => handleUpdateNonformal(non.id, "level", e.target.value)}
                        placeholder="English Course"
                        style={{ borderRadius: 6, marginTop: 2 }}
                      />
                    </Col>
                    <Col xs={12} sm={12}>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Mulai</label>
                      <Input
                        value={non.commence}
                        onChange={(e) => handleUpdateNonformal(non.id, "commence", e.target.value)}
                        placeholder="2021"
                        style={{ borderRadius: 6, marginTop: 2 }}
                      />
                    </Col>
                    <Col xs={12} sm={12}>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Selesai</label>
                      <Input
                        value={non.completed}
                        onChange={(e) => handleUpdateNonformal(non.id, "completed", e.target.value)}
                        placeholder="2022"
                        style={{ borderRadius: 6, marginTop: 2 }}
                      />
                    </Col>
                  </Row>
                </Card>
              ))}

              <Button type="dashed" block icon={<PlusOutlined />} onClick={handleAddNonformal} style={{ borderRadius: 8 }}>
                Tambah Kursus / Nonformal
              </Button>
            </Space>
          </div>
        </Space>
      ),
    },
    {
      key: "3",
      label: (
        <span style={{ fontWeight: 700, fontSize: 14 }}>
          <TrophyOutlined style={{ marginRight: 8, color: "#f59e0b" }} />
          3. Riwayat Pekerjaan ({cv.experiences?.length || 0})
        </span>
      ),
      children: (
        <Space direction="vertical" size={14} style={{ width: "100%" }}>
          {(cv.experiences || []).map((exp, idx) => (
            <Card
              key={exp.id}
              size="small"
              style={{ borderRadius: 10, borderColor: "#e2e8f0", backgroundColor: "#f8fafc" }}
              title={<span style={{ fontSize: 13, fontWeight: 600 }}>Pekerjaan #{idx + 1}: {exp.job_title || "Posisi"}</span>}
              extra={<Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleRemoveExperience(exp.id)} />}
            >
              <Row gutter={[10, 10]}>
                <Col xs={24} sm={12}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Perusahaan</label>
                  <Input
                    value={exp.company}
                    onChange={(e) => handleUpdateExperience(exp.id, "company", e.target.value)}
                    placeholder="Nama perusahaan"
                    style={{ borderRadius: 6, marginTop: 2 }}
                  />
                </Col>
                <Col xs={24} sm={12}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Posisi / Jabatan</label>
                  <Input
                    value={exp.job_title}
                    onChange={(e) => handleUpdateExperience(exp.id, "job_title", e.target.value)}
                    placeholder="Staff Operasional"
                    style={{ borderRadius: 6, marginTop: 2 }}
                  />
                </Col>
                <Col xs={12} sm={6}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Dari (From)</label>
                  <Input
                    value={exp.start_date}
                    onChange={(e) => handleUpdateExperience(exp.id, "start_date", e.target.value)}
                    placeholder="2021"
                    style={{ borderRadius: 6, marginTop: 2 }}
                  />
                </Col>
                <Col xs={12} sm={6}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Sampai (To)</label>
                  <Input
                    value={exp.end_date}
                    onChange={(e) => handleUpdateExperience(exp.id, "end_date", e.target.value)}
                    placeholder="2023"
                    style={{ borderRadius: 6, marginTop: 2 }}
                  />
                </Col>
                <Col xs={24}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Uraian Tugas / Kontak Referensi</label>
                  <Input.TextArea
                    rows={2}
                    value={exp.description}
                    onChange={(e) => handleUpdateExperience(exp.id, "description", e.target.value)}
                    placeholder="Tanggung jawab dan catatan referensi..."
                    style={{ borderRadius: 6, marginTop: 2 }}
                  />
                </Col>
              </Row>
            </Card>
          ))}

          <Button type="dashed" block icon={<PlusOutlined />} onClick={handleAddExperience} style={{ borderRadius: 8 }}>
            Tambah Riwayat Pekerjaan
          </Button>
        </Space>
      ),
    },
    {
      key: "4",
      label: (
        <span style={{ fontWeight: 700, fontSize: 14 }}>
          <CompassOutlined style={{ marginRight: 8, color: "#06b6d4" }} />
          4. Perjalanan Luar Negeri ({cv.travel_history?.length || 0})
        </span>
      ),
      children: (
        <Space direction="vertical" size={14} style={{ width: "100%" }}>
          {(cv.travel_history || []).map((trv, idx) => (
            <Card
              key={trv.id}
              size="small"
              style={{ borderRadius: 10, borderColor: "#e2e8f0", backgroundColor: "#f8fafc" }}
              title={<span style={{ fontSize: 13, fontWeight: 600 }}>Perjalanan #{idx + 1}: {trv.country || "Negara"}</span>}
              extra={<Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleRemoveTravel(trv.id)} />}
            >
              <Row gutter={[10, 10]}>
                <Col xs={24} sm={12}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Negara (Country)</label>
                  <Input
                    value={trv.country}
                    onChange={(e) => handleUpdateTravel(trv.id, "country", e.target.value)}
                    placeholder="Australia"
                    style={{ borderRadius: 6, marginTop: 2 }}
                  />
                </Col>
                <Col xs={24} sm={12}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Tujuan (Purpose)</label>
                  <Input
                    value={trv.purpose}
                    onChange={(e) => handleUpdateTravel(trv.id, "purpose", e.target.value)}
                    placeholder="Study"
                    style={{ borderRadius: 6, marginTop: 2 }}
                  />
                </Col>
                <Col xs={12} sm={12}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Mulai (Start)</label>
                  <Input
                    value={trv.start_date}
                    onChange={(e) => handleUpdateTravel(trv.id, "start_date", e.target.value)}
                    placeholder="MM/YYYY"
                    style={{ borderRadius: 6, marginTop: 2 }}
                  />
                </Col>
                <Col xs={12} sm={12}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Selesai (End)</label>
                  <Input
                    value={trv.end_date}
                    onChange={(e) => handleUpdateTravel(trv.id, "end_date", e.target.value)}
                    placeholder="MM/YYYY"
                    style={{ borderRadius: 6, marginTop: 2 }}
                  />
                </Col>
              </Row>
            </Card>
          ))}

          <Button type="dashed" block icon={<PlusOutlined />} onClick={handleAddTravel} style={{ borderRadius: 8 }}>
            Tambah Riwayat Perjalanan
          </Button>
        </Space>
      ),
    },
    {
      key: "5",
      label: (
        <span style={{ fontWeight: 700, fontSize: 14 }}>
          <TeamOutlined style={{ marginRight: 8, color: "#8b5cf6" }} />
          5. Orang Tua / Wali (Next of Kin)
        </span>
      ),
      children: (
        <Row gutter={[12, 12]}>
          <Col xs={24} sm={12}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Nama Lengkap</label>
            <Input
              value={kin.name}
              onChange={(e) => handleKinChange("name", e.target.value)}
              placeholder="Nama orang tua"
              style={{ marginTop: 4, borderRadius: 8 }}
            />
          </Col>
          <Col xs={24} sm={12}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Hubungan (Relationship)</label>
            <Input
              value={kin.relationship}
              onChange={(e) => handleKinChange("relationship", e.target.value)}
              placeholder="Father"
              style={{ marginTop: 4, borderRadius: 8 }}
            />
          </Col>
          <Col xs={24} sm={12}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Nomor Kontak</label>
            <Input
              value={kin.contact_no}
              onChange={(e) => handleKinChange("contact_no", e.target.value)}
              placeholder="+62 812-xxxx-xxxx"
              style={{ marginTop: 4, borderRadius: 8 }}
            />
          </Col>
          <Col xs={24} sm={12}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Email</label>
            <Input
              value={kin.email}
              onChange={(e) => handleKinChange("email", e.target.value)}
              placeholder="parent@contoh.com"
              style={{ marginTop: 4, borderRadius: 8 }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Kota</label>
            <Input
              value={kin.city}
              onChange={(e) => handleKinChange("city", e.target.value)}
              placeholder="Denpasar"
              style={{ marginTop: 4, borderRadius: 8 }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Provinsi</label>
            <Input
              value={kin.province}
              onChange={(e) => handleKinChange("province", e.target.value)}
              placeholder="Bali"
              style={{ marginTop: 4, borderRadius: 8 }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Kode Pos</label>
            <Input
              value={kin.postal_code}
              onChange={(e) => handleKinChange("postal_code", e.target.value)}
              placeholder="80227"
              style={{ marginTop: 4, borderRadius: 8 }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>Negara</label>
            <Input
              value={kin.country}
              onChange={(e) => handleKinChange("country", e.target.value)}
              placeholder="Indonesia"
              style={{ marginTop: 4, borderRadius: 8 }}
            />
          </Col>
        </Row>
      ),
    },
    {
      key: "6",
      label: (
        <span style={{ fontWeight: 700, fontSize: 14 }}>
          <GlobalOutlined style={{ marginRight: 8, color: "#6366f1" }} />
          6. Keahlian & Bahasa ({cv.skills?.length || 0} skills, {cv.languages?.length || 0} bahasa)
        </span>
      ),
      children: (
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <div>
            <Typography.Text strong style={{ fontSize: 13, color: "#334155" }}>
              Daftar Keahlian:
            </Typography.Text>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "8px 0" }}>
              {(cv.skills || []).map((skill) => (
                <Tag
                  key={skill.id}
                  closable
                  onClose={() => handleRemoveSkill(skill.id)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 999,
                    fontSize: 12,
                    borderColor: "#bfdbfe",
                    backgroundColor: "#eff6ff",
                    color: "#1e40af",
                  }}
                >
                  {skill.name}
                </Tag>
              ))}
            </div>

            <Flex gap={8} style={{ marginTop: 6 }}>
              <Input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onPressEnter={handleAddSkill}
                placeholder="Ketik keahlian (misal: Public Speaking, Data Analysis)..."
                style={{ borderRadius: 8 }}
              />
              <Button type="primary" onClick={handleAddSkill} style={{ borderRadius: 8 }}>
                Tambah
              </Button>
            </Flex>
          </div>

          <Divider style={{ margin: "4px 0" }} />

          <div>
            <Typography.Text strong style={{ fontSize: 13, color: "#334155" }}>
              Kemampuan Bahasa:
            </Typography.Text>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
              {(cv.languages || []).map((lang) => (
                <Flex key={lang.id} gap={8} align="center">
                  <Input
                    value={lang.name}
                    onChange={(e) => handleUpdateLanguage(lang.id, "name", e.target.value)}
                    placeholder="Nama Bahasa (Contoh: English)"
                    style={{ flex: 1, borderRadius: 8 }}
                  />
                  <Select
                    value={lang.proficiency || "Fluent"}
                    onChange={(val) => handleUpdateLanguage(lang.id, "proficiency", val)}
                    style={{ width: 140 }}
                    options={[
                      { value: "Native", label: "Penutur Asli (Native)" },
                      { value: "Fluent", label: "Fasih (Fluent)" },
                      { value: "Intermediate", label: "Menengah (Intermediate)" },
                      { value: "Basic", label: "Dasar (Basic)" },
                    ]}
                  />
                  <Button
                    type="text"
                    danger
                    icon={<MinusCircleOutlined />}
                    onClick={() => handleRemoveLanguage(lang.id)}
                  />
                </Flex>
              ))}

              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={handleAddLanguage}
                style={{ borderRadius: 8, marginTop: 4 }}
              >
                Tambah Bahasa
              </Button>
            </div>
          </div>
        </Space>
      ),
    },
    {
      key: "7",
      label: (
        <span style={{ fontWeight: 700, fontSize: 14 }}>
          <TeamOutlined style={{ marginRight: 8, color: "#ec4899" }} />
          7. Organisasi & Kegiatan ({cv.leaderships?.length || 0})
        </span>
      ),
      children: (
        <Space direction="vertical" size={14} style={{ width: "100%" }}>
          {(cv.leaderships || []).map((lead, idx) => (
            <Card
              key={lead.id}
              size="small"
              style={{ borderRadius: 10, borderColor: "#e2e8f0", backgroundColor: "#f8fafc" }}
              title={<span style={{ fontSize: 13, fontWeight: 600 }}>Kegiatan #{idx + 1}: {lead.role || "Peran"}</span>}
              extra={<Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleRemoveLeadership(lead.id)} />}
            >
              <Row gutter={[10, 10]}>
                <Col xs={24} sm={12}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Peran / Jabatan</label>
                  <Input
                    value={lead.role}
                    onChange={(e) => handleUpdateLeadership(lead.id, "role", e.target.value)}
                    placeholder="Contoh: Koordinator Acara"
                    style={{ borderRadius: 6, marginTop: 2 }}
                  />
                </Col>
                <Col xs={24} sm={12}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Nama Organisasi</label>
                  <Input
                    value={lead.organization}
                    onChange={(e) => handleUpdateLeadership(lead.id, "organization", e.target.value)}
                    placeholder="Contoh: Himpunan Mahasiswa"
                    style={{ borderRadius: 6, marginTop: 2 }}
                  />
                </Col>
                <Col xs={12} sm={6}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Mulai</label>
                  <Input
                    value={lead.start_date}
                    onChange={(e) => handleUpdateLeadership(lead.id, "start_date", e.target.value)}
                    placeholder="2022"
                    style={{ borderRadius: 6, marginTop: 2 }}
                  />
                </Col>
                <Col xs={12} sm={6}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Selesai</label>
                  <Input
                    value={lead.end_date}
                    onChange={(e) => handleUpdateLeadership(lead.id, "end_date", e.target.value)}
                    placeholder="2023"
                    style={{ borderRadius: 6, marginTop: 2 }}
                  />
                </Col>
                <Col xs={24}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Uraian Kegiatan</label>
                  <Input.TextArea
                    rows={2}
                    value={lead.description}
                    onChange={(e) => handleUpdateLeadership(lead.id, "description", e.target.value)}
                    placeholder="Uraikan kegiatan dan kontribusi..."
                    style={{ borderRadius: 6, marginTop: 2 }}
                  />
                </Col>
              </Row>
            </Card>
          ))}

          <Button type="dashed" block icon={<PlusOutlined />} onClick={handleAddLeadership} style={{ borderRadius: 8 }}>
            Tambah Kegiatan Organisasi
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card
      style={{
        borderRadius: 20,
        borderColor: "#e2e8f0",
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
        background: "#ffffff",
      }}
      styles={{ body: { padding: 18 } }}
    >
      <div style={{ marginBottom: 14 }}>
        <Typography.Title level={4} style={{ margin: 0, color: "#0f172a", fontWeight: 700 }}>
          Kelola Data CV
        </Typography.Title>
        <Typography.Text type="secondary" style={{ fontSize: 13 }}>
          Sesuaikan data profil siswa sebelum dokumen dicetak
        </Typography.Text>
      </div>

      <Collapse
        defaultActiveKey={["1", "2"]}
        items={collapseItems}
        bordered={false}
        style={{ background: "#ffffff" }}
      />
    </Card>
  );
}
