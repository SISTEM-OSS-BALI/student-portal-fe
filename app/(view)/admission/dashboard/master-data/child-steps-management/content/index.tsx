"use client";

import { useMemo, useState } from "react";
import { Button, Empty, Input, Popconfirm, Space, Tag } from "antd";
import {
  BranchesOutlined,
  DeleteOutlined,
  EditOutlined,
  SearchOutlined,
} from "@ant-design/icons";

import FormChildStepManagement from "./FormChildStepManagement";
import {
  useChildStepManagement,
  useChildStepsManagement,
} from "@/app/hooks/use-child-steps-management";
import type {
  ChildStepsManagementDataModel,
  ChildStepsManagementPayloadCreateModel,
} from "@/app/models/child-steps-management";
import SplitMasterDetailLayout, {
  splitMasterDetailStyles,
} from "@/app/components/common/split-master-detail";

export default function ChildStepsManagementContent() {
  const [selectedChild, setSelectedChild] =
    useState<ChildStepsManagementDataModel | null>(null);
  const [childQuery, setChildQuery] = useState("");

  const {
    data: childSteps = [],
    onCreate: onCreateChild,
    onCreateLoading: onCreateChildLoading,
    onDelete: onDeleteChild,
    onDeleteLoading: onDeleteChildLoading,
  } = useChildStepsManagement({});

  const { onUpdate: onUpdateChild, onUpdateLoading: onUpdateChildLoading } =
    useChildStepManagement({ id: selectedChild?.id ?? "" });

  const childFormLoading = selectedChild
    ? onUpdateChildLoading
    : onCreateChildLoading;

  const handleSelectChild = (child: ChildStepsManagementDataModel) => {
    setSelectedChild((prev) => (prev?.id === child.id ? null : child));
  };

  const handleSubmitChild = async (
    payload: ChildStepsManagementPayloadCreateModel,
  ) => {
    if (selectedChild) {
      try {
        await onUpdateChild({ id: selectedChild.id, payload });
        setSelectedChild(null);
      } catch {
        // handled by notification hook
      }
      return;
    }
    await onCreateChild(payload);
    setSelectedChild(null);
  };

  const handleDeleteChild = async (childId?: string) => {
    const idToDelete = childId ?? selectedChild?.id;
    if (!idToDelete) return;
    try {
      await onDeleteChild(idToDelete);
      if (selectedChild?.id === idToDelete) {
        setSelectedChild(null);
      }
    } catch {
      // handled by notification hook
    }
  };

  const filteredChildSteps = useMemo(() => {
    const list = [...(childSteps ?? [])].sort((a, b) =>
      (a.label ?? "").localeCompare(b.label ?? "", undefined, {
        sensitivity: "base",
        numeric: true,
      }),
    );
    const query = childQuery.trim().toLowerCase();
    if (!query) return list;
    return list.filter((child) =>
      child.label.toLowerCase().includes(query),
    );
  }, [childQuery, childSteps]);

  return (
    <SplitMasterDetailLayout
      pageTitle="Step Categories"
      pageSubtitle="Kelola kategori alur pendaftaran siswa"
      pageIcon={<BranchesOutlined />}
      onAddNew={() => setSelectedChild(null)}
      addNewText="Add Category"
      listTitle="Category List"
      listCount={filteredChildSteps.length}
      listFilter={
        <Input
          allowClear
          value={childQuery}
          onChange={(e) => setChildQuery(e.target.value)}
          placeholder="Search step category..."
          prefix={<SearchOutlined style={{ color: "#94a3b8", fontSize: 13 }} />}
          style={{ width: "100%", height: 34, borderRadius: 8, borderColor: "#e2e8f0", fontSize: 12.5 }}
        />
      }
      listContent={
        filteredChildSteps.length === 0 ? (
          <Empty
            description={
              childQuery
                ? "No categories match your search"
                : "No categories registered yet"
            }
          />
        ) : (
          filteredChildSteps.map((child) => {
            const isSelected = selectedChild?.id === child.id;
            const totalSteps = child.steps?.length ?? 0;

            return (
              <div
                key={child.id}
                className={`${splitMasterDetailStyles.cardItem} ${
                  isSelected ? splitMasterDetailStyles.cardItemActive : ""
                }`}
                onClick={() => handleSelectChild(child)}
              >
                {isSelected && (
                  <div className={splitMasterDetailStyles.activeIndicator} />
                )}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 10,
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 14.5,
                        color: isSelected ? "#1d4ed8" : "#0f172a",
                        marginBottom: 4,
                      }}
                    >
                      {child.label}
                    </div>
                  </div>

                  <Space size={6} onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="small"
                      type={isSelected ? "primary" : "default"}
                      icon={<EditOutlined />}
                      onClick={() => handleSelectChild(child)}
                      style={{
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        height: 30,
                        background: isSelected ? "#1b3d6d" : undefined,
                        borderColor: isSelected ? "#1b3d6d" : undefined,
                      }}
                    >
                      {isSelected ? "Editing" : "Edit"}
                    </Button>

                    <Popconfirm
                      title="Delete Category"
                      description={`Are you sure you want to delete category "${child.label}"?`}
                      onConfirm={() => handleDeleteChild(child.id)}
                      okText="Delete"
                      cancelText="Cancel"
                      okButtonProps={{ danger: true }}
                    >
                      <Button
                        size="small"
                        danger
                        type="text"
                        icon={<DeleteOutlined style={{ fontSize: 14 }} />}
                        title="Delete this category"
                        style={{ borderRadius: 8, height: 30, width: 30 }}
                      />
                    </Popconfirm>
                  </Space>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <Tag
                    color={totalSteps > 0 ? "geekblue" : "default"}
                    style={{
                      borderRadius: 6,
                      fontSize: 11,
                      marginRight: 0,
                    }}
                  >
                    {totalSteps > 0
                      ? `${totalSteps} Connected Steps`
                      : "No Steps Connected"}
                  </Tag>
                </div>
              </div>
            );
          })
        )
      }
      formTitle={
        selectedChild ? "Edit Step Category" : "Add Step Category"
      }
      formSubtitle={
        selectedChild
          ? "Modify the category name for registration stages."
          : "Add a new category to group registration stages."
      }
      formTag={
        selectedChild ? (
          <Tag color="blue" style={{ borderRadius: 6, fontWeight: 600 }}>
            Edit Mode
          </Tag>
        ) : (
          <Tag color="green" style={{ borderRadius: 6, fontWeight: 600 }}>
            New
          </Tag>
        )
      }
      isEditing={Boolean(selectedChild)}
      onCancelEdit={() => setSelectedChild(null)}
      onAddNewFromForm={() => setSelectedChild(null)}
      formContent={
        <FormChildStepManagement
          selectedChild={selectedChild}
          onSubmit={handleSubmitChild}
          onDelete={() => handleDeleteChild()}
          onCancel={() => setSelectedChild(null)}
          loading={childFormLoading}
          deleteLoading={onDeleteChildLoading}
        />
      }
    />
  );
}

