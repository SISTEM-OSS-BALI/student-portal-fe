"use client";

import SearchBarComponent from "@/app/components/common/search-bar";
import { Button, Card, Col, Row, Space, Tag, Typography } from "antd";
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
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import ModalConfirm from "@/app/components/common/modal-confirm";
import { useRouter } from "next/navigation";

export default function StagesManagementContent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] =
    useState<CountryManagementDataModel | null>(null);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
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
      ModalConfirm({
        title: country.name,
        description: `ID: ${country.id}`,
        actions: "hapus",
        onOk: async () => {
          setDeletingId(country.id);
          try {
            await onDelete(country.id);
            onDone?.();
          } finally {
            setDeletingId(null);
          }
        },
      });
    },
    [onDelete],
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

  return (
    <div>
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <SearchBarComponent
          placeholder="Cari negara"
          handleChange={setSearchTerm}
        />

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button type="primary" onClick={openCreateModal}>
            Tambah Negara
          </Button>
        </div>

        <Row gutter={[16, 16]}>
          {filteredCountries.map((country) => (
            <Col key={country.id} xs={24} sm={12} lg={8}>
              <Card
                hoverable
                bodyStyle={{ padding: 18 }}
                style={{
                  borderRadius: 16,
                  borderColor: "#e2e8f0",
                  background:
                    "linear-gradient(145deg, rgba(255,255,255,0.98), rgba(248,250,252,0.95))",
                  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
                }}
              >
                <Space direction="vertical" size={10} style={{ width: "100%" }}>
                  <Space
                    align="center"
                    style={{
                      width: "100%",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography.Text
                      strong
                      style={{
                        fontSize: 16,
                        color: "#0f172a",
                        cursor: "pointer",
                      }}
                      onClick={() => goToDetailCountry(country.id)}
                    >
                      {country.name}
                    </Typography.Text>
                    <Tag color="blue">
                      Total Dokumen {country.document_total ?? 0}
                    </Tag>
                  </Space>

                  <Space
                    direction="vertical"
                    size={10}
                    style={{ width: "100%" }}
                  >
                    <Space
                      align="center"
                      style={{
                        width: "100%",
                        justifyContent: "space-between",
                      }}
                    >
                      <Typography.Text
                        type="secondary"
                        style={{ fontSize: 12 }}
                      >
                        Terakhir update
                      </Typography.Text>
                      <Tag color="blue">
                        Total Langkah {country.step_total ?? 0}
                      </Tag>
                    </Space>
                    <Typography.Text style={{ fontSize: 13, color: "#1f2937" }}>
                      {country.updated_at
                        ? dayjs(country.updated_at).format("DD/MM/YYYY, HH:mm")
                        : "-"}
                    </Typography.Text>
                  </Space>

                  <Space style={{ width: "100%", justifyContent: "flex-end" }}>
                    <Button
                      size="small"
                      onClick={() => handleEditCountry(country)}
                      icon={<EditOutlined />}
                    />
                    <Button
                      size="small"
                      danger
                      loading={deletingId === country.id && onDeleteLoading}
                      onClick={() => handleDeleteCountry(country)}
                      icon={<DeleteOutlined />}
                    />
                  </Space>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>

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
