import { Card, Col, Row, Space, Typography } from "antd";
import FormDocumentComponent from "./FormDocumentComponent";
import SearchBarComponent from "@/app/components/common/search-bar";
import { useDocument, useDocuments } from "@/app/hooks/use-documents-management";
import { useState } from "react";
import type {
  DocumentDataModel,
  DocumentPayloadCreateModel,
} from "@/app/models/documents-management";

const { Text, Title } = Typography;

export default function DocumentsManagementContent() {
  const [selectedDocument, setSelectedDocument] =
    useState<DocumentDataModel | null>(null);
  const {
    data: documents,
    onCreate: onCreateDocument,
    onCreateLoading: onCreateDocumentLoading,
    onDelete: onDeleteDocument,
    onDeleteLoading: onDeleteDocumentLoading,
  } = useDocuments({});

  const { onUpdate: onUpdateDocument, onUpdateLoading: onUpdateDocumentLoading } =
    useDocument({ id: selectedDocument?.id ?? "" });

  const formLoading = selectedDocument
    ? onUpdateDocumentLoading
    : onCreateDocumentLoading;

  const handleSelectDocument = (doc: DocumentDataModel) => {
    setSelectedDocument((prev) => (prev?.id === doc.id ? null : doc));
  };

  const handleSubmit = async (data: DocumentPayloadCreateModel) => {
    if (selectedDocument) {
      try {
        await onUpdateDocument({ id: selectedDocument.id, payload: data });
        setSelectedDocument(null);
      } catch {
        // handled by notification hook
      }
      return;
    }
    await onCreateDocument(data);
  };

  const handleDelete = async () => {
    if (!selectedDocument) return;
    try {
      await onDeleteDocument(selectedDocument.id);
      setSelectedDocument(null);
    } catch {
      // handled by notification hook
    }
  };
  return (
    <div style={{ padding: "8px 4px" }}>
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <div>
          <Title level={3} style={{ marginBottom: 4 }}>
            Manajemen Dokumen
          </Title>
          <Text type="secondary">
            Kelola daftar dokumen yang wajib di upload student, lengkap dengan
            pola auto rename file
          </Text>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={10}>
            <Card bodyStyle={{ padding: 20 }}>
              <Space direction="vertical" size={12} style={{ width: "100%" }}>
                <div>
                  <Title level={5} style={{ marginBottom: 4 }}>
                    Tipe Dokumen
                  </Title>
                  <Text type="secondary">
                    Atur tipe dokumen yang wajib di upload oleh student.
                  </Text>
                </div>
                <SearchBarComponent
                  placeholder="Cari tipe dokumen..."
                  handleSearch={(value) => console.log(value)}
                />
              </Space>
              <Space
                direction="vertical"
                size={8}
                style={{ width: "100%", marginTop: 12 }}
              >
                {documents?.map((doc) => {
                  const isSelected = selectedDocument?.id === doc.id;
                  return (
                    <Card
                      key={doc.id}
                      type="inner"
                      hoverable
                      onClick={() => handleSelectDocument(doc)}
                      bodyStyle={{ padding: "10px 12px" }}
                      style={{
                        borderColor: isSelected ? "#2f54eb" : "#7aa2ff",
                        background: isSelected ? "#e6f0ff" : "#f6f8ff",
                        borderRadius: 8,
                        cursor: "pointer",
                      }}
                    >
                    <Space
                      direction="vertical"
                      size={2}
                      style={{ width: "100%" }}
                    >
                      <Row align="middle" justify="space-between">
                        <Title level={5} style={{ margin: 0 }}>
                          {doc.label}
                        </Title>
                        {doc.required ? (
                          <Text
                            style={{
                              color: "#389e0d",
                              fontWeight: 600,
                              fontSize: 12,
                            }}
                          >
                            Required
                          </Text>
                        ) : null}
                      </Row>
                      {doc.notes ? (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {doc.notes}
                        </Text>
                      ) : null}
                      <Row align="middle" justify="space-between">
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Auto rename: {doc.auto_rename_pattern || "-"}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Code:{" "}
                          <span style={{ fontWeight: "bold" }}>
                            {doc.internal_code || "-"}
                          </span>
                        </Text>
                      </Row>
                    </Space>
                    </Card>
                  );
                })}
              </Space>
            </Card>
          </Col>
          <Col xs={24} md={14}>
            <Card bodyStyle={{ padding: 20 }}>
              <Space direction="vertical" size={12} style={{ width: "100%" }}>
                <div>
                  <Title level={5} style={{ marginBottom: 4 }}>
                    Manipulasi Tipe Dokumen
                  </Title>
                  <Text type="secondary">
                    Konfigurasi ini digunakan Admission saat menentukan dokumen
                    untuk setiap case student.
                  </Text>
                </div>
                <FormDocumentComponent
                  selectedDocument={selectedDocument}
                  onSubmit={handleSubmit}
                  onDelete={handleDelete}
                  onCancel={() => setSelectedDocument(null)}
                  loading={formLoading}
                  deleteLoading={onDeleteDocumentLoading}
                />
              </Space>
            </Card>
          </Col>
        </Row>
      </Space>
    </div>
  );
}
