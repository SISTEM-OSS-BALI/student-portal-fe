import type {
  CountryManagementDataModel,
  CountryManagementPayloadCreateModel,
} from "@/app/models/country-management";
import { AutoComplete, Button, Form, Space, Typography } from "antd";
import { useEffect, useMemo } from "react";
import CountryFlag from "@/app/components/common/country-flag";
import { POPULAR_COUNTRIES } from "@/app/utils/country-directory";

export interface FormCountryComponentProps {
  onSubmit: (values: CountryManagementPayloadCreateModel) => void;
  onDelete: () => void;
  onCancel: () => void;
  loading: boolean;
  deleteLoading: boolean;
  selectedCountry?: CountryManagementDataModel | null;
}

export default function FormCountryComponent({
  onSubmit,
  onDelete,
  onCancel,
  loading,
  deleteLoading,
  selectedCountry,
}: FormCountryComponentProps) {
  const [form] = Form.useForm<CountryManagementPayloadCreateModel>();
  const currentName = Form.useWatch("name", form);

  useEffect(() => {
    form.setFieldsValue({
      name: selectedCountry?.name ?? "",
    });
  }, [form, selectedCountry]);

  // Siapkan opsi rekomendasi negara lengkap dengan pratinjau bendera
  const countryOptions = useMemo(() => {
    return POPULAR_COUNTRIES.map((item) => ({
      value: item.nameEn,
      label: (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "2px 0" }}>
          <CountryFlag countryName={item.nameEn} width={28} height={18} borderRadius={4} />
          <div>
            <span style={{ fontWeight: 600, color: "#0f172a" }}>{item.nameEn}</span>
            {item.nameId !== item.nameEn && (
              <span style={{ fontSize: 12, color: "#64748b", marginLeft: 6 }}>
                ({item.nameId})
              </span>
            )}
          </div>
        </div>
      ),
    }));
  }, []);

  return (
    <div>
      <Form
        form={form}
        layout="vertical"
        onFinish={onSubmit}
      >
        <Form.Item
          name="name"
          label="Destination Country"
          tooltip="Negara tujuan studi untuk alur pendaftaran siswa."
          rules={[{ required: true, message: "Nama negara wajib diisi" }]}
          extra="Ketik nama negara dalam Bahasa Inggris atau Bahasa Indonesia, atau pilih dari daftar rekomendasi."
        >
          <AutoComplete
            options={countryOptions}
            placeholder="Contoh: Japan, Australia, Germany, atau Korea Selatan"
            filterOption={(inputValue, option) => {
              const val = String(option?.value ?? "").toLowerCase();
              const input = inputValue.toLowerCase();
              return val.includes(input);
            }}
            style={{ width: "100%" }}
          />
        </Form.Item>

        {/* Live Preview Bendera Terdeteksi */}
        {currentName && String(currentName).trim() && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 14px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              marginBottom: 20,
            }}
          >
            <CountryFlag countryName={currentName} width={38} height={25} borderRadius={6} />
            <div>
              <Typography.Text strong style={{ fontSize: 13, color: "#0f172a", display: "block" }}>
                Pratinjau Bendera Terdeteksi
              </Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Sistem akan menampilkan bendera ini secara otomatis di halaman tahapan dan checklist dokumen.
              </Typography.Text>
            </div>
          </div>
        )}

        <Space style={{ width: "100%", justifyContent: "flex-end" }}>
          <Button onClick={onCancel}>Batal</Button>
          <Button
            danger
            onClick={onDelete}
            disabled={!selectedCountry}
            loading={deleteLoading}
          >
            Hapus
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            {selectedCountry ? "Simpan Perubahan" : "Simpan"}
          </Button>
        </Space>
      </Form>
    </div>
  );
}
