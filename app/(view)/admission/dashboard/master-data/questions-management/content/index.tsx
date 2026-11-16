"use client";

import { useMemo, useState } from "react";
import {
  App,
  Button,
  Empty,
  Input,
  Select,
  Space,
  Tag,
  Typography,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  FormOutlined,
  RightCircleOutlined,
  RightOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  useQuestionBase,
  useQuestionBases,
} from "@/app/hooks/use-question-bases";
import { useCountriesManagement } from "@/app/hooks/use-country-management";
import type {
  QuestionBaseDataModel,
  QuestionBasePayloadCreateModel,
  QuestionBasePayloadUpdateModel,
} from "@/app/models/question";
import FormCreateBaseQuestionComponent from "./FormCreateBaseQuestionComponent";
import SplitMasterDetailLayout, {
  splitMasterDetailStyles,
} from "@/app/components/common/split-master-detail";
import CountryBadge from "@/app/components/common/country-badge";
import { useRouter } from "next/navigation";

const { Text } = Typography;

const cleanSlashText = (val?: string | null): string => {
  if (!val) return "";
  return val
    .replace(/student\/client/gi, "student")
    .replace(/Next of kin\/parents/gi, "Next of Kin");
};

export default function QuestionManagementContent() {
  const [searchValue, setSearchValue] = useState("");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name_asc");
  const [editingBase, setEditingBase] = useState<QuestionBaseDataModel | null>(
    null,
  );

  const router = useRouter();
  const { modal } = App.useApp();

  const { data: countries = [] } = useCountriesManagement({});

  const {
    data: questionBases,
    fetchLoading,
    onCreate: onCreateQuestionBase,
    onCreateLoading,
    onDelete: onDeleteQuestionBase,
  } = useQuestionBases({});

  const { onUpdate: onUpdateQuestionBase, onUpdateLoading } = useQuestionBase({
    id: editingBase?.id ?? "",
  });

  const isFiltered =
    Boolean(searchValue.trim()) ||
    countryFilter !== "all" ||
    statusFilter !== "all" ||
    sortBy !== "name_asc";

  const handleResetFilters = () => {
    setSearchValue("");
    setCountryFilter("all");
    setStatusFilter("all");
    setSortBy("name_asc");
  };

  const filteredBases = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    const bases = questionBases ?? [];

    return bases
      .filter((base) => {
        const matchSearch =
          !query ||
          [base.name, base.desc ?? "", base.type_country ?? ""].some((text) =>
            String(text).toLowerCase().includes(query),
          );

        const matchCountry =
          countryFilter === "all" ||
          base.country_id === countryFilter ||
          base.type_country?.toLowerCase() === countryFilter.toLowerCase();

        const matchStatus =
          statusFilter === "all" ||
          (statusFilter === "active" && base.active) ||
          (statusFilter === "inactive" && !base.active);

        return matchSearch && matchCountry && matchStatus;
      })
      .sort((a, b) => {
        if (sortBy === "name_asc") {
          return a.name.localeCompare(b.name, "id");
        }
        if (sortBy === "name_desc") {
          return b.name.localeCompare(a.name, "id");
        }
        if (sortBy === "country_asc") {
          return (a.type_country || "").localeCompare(b.type_country || "", "id");
        }
        if (sortBy === "version_desc") {
          return (b.version ?? 1) - (a.version ?? 1);
        }
        if (sortBy === "active_first") {
          if (a.active === b.active) {
            return a.name.localeCompare(b.name, "id");
          }
          return a.active ? -1 : 1;
        }
        return 0;
      });
  }, [questionBases, searchValue, countryFilter, statusFilter, sortBy]);

  const handleCreateQuestionBase = async (
    payload: QuestionBasePayloadCreateModel,
  ) => {
    await onCreateQuestionBase(payload);
    setEditingBase(null);
  };

  const handleUpdateQuestionBase = async (
    payload: QuestionBasePayloadUpdateModel,
  ) => {
    if (!editingBase) return;
    await onUpdateQuestionBase({ id: editingBase.id, payload });
    setEditingBase(null);
  };

  const handleSubmit = async (payload: QuestionBasePayloadCreateModel) => {
    if (editingBase) return handleUpdateQuestionBase(payload);
    return handleCreateQuestionBase(payload);
  };

  const handleDeleteQuestionBase = (base: QuestionBaseDataModel) => {
    modal.confirm({
      title: "Arsipkan Kelompok Formulir?",
      content: `Kelompok formulir "${base.name}" akan diarsipkan (soft delete). Pertanyaan di dalamnya tidak akan muncul pada alur pendaftaran siswa baru.`,
      okText: "Ya, Arsipkan",
      okType: "danger",
      cancelText: "Batal",
      onOk: () => onDeleteQuestionBase(base.id),
    });
  };

  const formInitialValues = useMemo<QuestionBasePayloadCreateModel>(
    () =>
      editingBase
        ? {
            name: editingBase.name,
            desc: editingBase.desc ?? undefined,
            type_country: editingBase.type_country,
            country_id: editingBase.country_id ?? undefined,
            allow_multiple_submissions: editingBase.allow_multiple_submissions,
            active: editingBase.active,
            version: editingBase.version,
          }
        : {
            active: true,
            allow_multiple_submissions: false,
            version: 1,
            name: "",
            type_country: "",
          },
    [editingBase],
  );

  const goToDetail = (id: string) => {
    router.push(
      `/admission/dashboard/master-data/questions-management/detail/${id}`,
    );
  };

  const countryFilterOptions = useMemo(() => {
    return [
      { value: "all", label: "Semua Negara" },
      ...countries.map((c) => ({
        value: c.id,
        label: c.name || "-",
      })),
    ];
  }, [countries]);

  return (
    <SplitMasterDetailLayout
      pageTitle="Questionnaires"
      pageSubtitle="Kelola formulir dan butir kuesioner siswa"
      pageIcon={<FormOutlined />}
      onAddNew={() => setEditingBase(null)}
      addNewText="Add Questionnaire"
      listTitle="Questionnaire Forms"
      listCount={filteredBases.length}
      listFilter={
        <div className={splitMasterDetailStyles.filterRow}>
          <Input
            allowClear
            placeholder="Search forms by name, description, or country..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
            className={splitMasterDetailStyles.filterSearchFull}
            style={{ borderRadius: 8 }}
          />

          <Select
            value={countryFilter}
            onChange={setCountryFilter}
            className={splitMasterDetailStyles.filterItem}
            showSearch
            optionFilterProp="label"
            options={countryFilterOptions}
          />

          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            className={splitMasterDetailStyles.filterItem}
            options={[
              { value: "all", label: "All Status" },
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
          />

          <Select
            value={sortBy}
            onChange={setSortBy}
            className={splitMasterDetailStyles.filterItem}
            options={[
              { value: "name_asc", label: "Name A - Z" },
              { value: "name_desc", label: "Name Z - A" },
              { value: "country_asc", label: "Country A - Z" },
              { value: "version_desc", label: "Newest Version" },
              { value: "active_first", label: "Active First" },
            ]}
          />

          {isFiltered && (
            <Button
              onClick={handleResetFilters}
              className={splitMasterDetailStyles.filterItem}
              style={{ borderRadius: 8 }}
            >
              Reset
            </Button>
          )}
        </div>
      }
      listContent={
        fetchLoading ? (
          <div style={{ padding: 32, textAlign: "center", color: "#64748b" }}>
            Memuat daftar question base...
          </div>
        ) : filteredBases.length === 0 ? (
          <Empty description="Belum ada question base yang terdaftar." />
        ) : (
          filteredBases.map((base) => {
            const isSelected = editingBase?.id === base.id;

            return (
              <div
                key={base.id}
                onClick={() => setEditingBase(base)}
                className={`${splitMasterDetailStyles.cardItem} ${
                  isSelected ? splitMasterDetailStyles.cardItemActive : ""
                }`}
                style={{ cursor: "pointer" }}
              >
                {isSelected && (
                  <div className={splitMasterDetailStyles.activeIndicator} />
                )}

                <div className={splitMasterDetailStyles.cardItemHeader}>
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      goToDetail(base.id);
                    }}
                    className={`${splitMasterDetailStyles.cardItemTitle} ${
                      isSelected ? splitMasterDetailStyles.cardItemTitleActive : ""
                    }`}
                    title="Buka Detail Pertanyaan"
                  >
                    {cleanSlashText(base.name)}
                  </div>

                  <Space size={6} style={{ flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="small"
                      type={isSelected ? "primary" : "default"}
                      icon={<EditOutlined />}
                      onClick={() =>
                        setEditingBase({
                          ...base,
                          name: cleanSlashText(base.name),
                          desc: cleanSlashText(base.desc),
                        })
                      }
                      className={splitMasterDetailStyles.cardActionBtn}
                      style={{
                        background: isSelected ? "#1b3d6d" : undefined,
                        borderColor: isSelected ? "#1b3d6d" : undefined,
                      }}
                    >
                      {isSelected ? "Editing" : "Edit"}
                    </Button>
                    <Button
                      size="small"
                      danger
                      type="text"
                      icon={<DeleteOutlined style={{ fontSize: 13 }} />}
                      onClick={() => handleDeleteQuestionBase(base)}
                      title="Hapus"
                      style={{ borderRadius: 8, height: 30, width: 30 }}
                    />
                  </Space>
                </div>

                {base.desc ? (
                  <div className={splitMasterDetailStyles.cardItemDesc}>
                    {cleanSlashText(base.desc)}
                  </div>
                ) : null}

                <div
                  className={splitMasterDetailStyles.cardItemFooter}
                  style={{
                    marginTop: base.desc ? 0 : 8,
                  }}
                >
                  <CountryBadge countryName={base.type_country} />
                  <Tag
                    color={base.active ? "success" : "default"}
                    style={{ borderRadius: 6, fontWeight: 600, margin: 0 }}
                  >
                    {base.active ? "Active" : "Draft"}
                  </Tag>
                  <Tag style={{ borderRadius: 6, margin: 0 }}>
                    v{base.version || 1}
                  </Tag>

                  <div style={{ marginLeft: "auto" }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        goToDetail(base.id);
                      }}
                      title="Buka Detail Pertanyaan"
                      className={splitMasterDetailStyles.cardDetailBtn}
                    >
                      <span>Detail</span>
                      <RightOutlined style={{ fontSize: 10 }} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )
      }
      formTitle={
        editingBase
          ? "Edit Base Form"
          : "Add Base Form"
      }
      formSubtitle={
        editingBase
          ? "Perbarui informasi nama kelompok, negara tujuan, atau status aktif formulir."
          : "Daftarkan kelompok formulir pendaftaran baru untuk negara tujuan studi."
      }
      formTag={
        editingBase ? (
          <Tag color="blue" style={{ borderRadius: 999, fontWeight: 600 }}>
            {editingBase.type_country}
          </Tag>
        ) : undefined
      }
      isEditing={Boolean(editingBase)}
      onCancelEdit={() => setEditingBase(null)}
      onAddNewFromForm={() => setEditingBase(null)}
      formContent={
        <FormCreateBaseQuestionComponent
          key={editingBase?.id ?? "new-base-form"}
          onFinish={handleSubmit}
          initialValues={formInitialValues}
          submitLabel={editingBase ? "Save Changes" : "Save Base Form"}
          loading={editingBase ? onUpdateLoading : onCreateLoading}
          onCancel={editingBase ? () => setEditingBase(null) : undefined}
        />
      }
    />
  );
}
