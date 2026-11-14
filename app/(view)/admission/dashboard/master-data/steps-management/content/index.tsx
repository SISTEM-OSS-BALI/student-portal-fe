"use client";

import { useMemo, useState } from "react";
import { Button, Empty, Input, Popconfirm, Space, Tag } from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  OrderedListOutlined,
  SearchOutlined,
} from "@ant-design/icons";

import FormStepManagement from "./FormStepManagement";
import { useStepsManagement, useStepManagement } from "@/app/hooks/use-steps-management";
import { useChildStepsManagement } from "@/app/hooks/use-child-steps-management";
import type {
  StepsManagementDataModel,
  StepsManagementPayloadCreateModel,
} from "@/app/models/steps-management";
import SplitMasterDetailLayout, {
  splitMasterDetailStyles,
} from "@/app/components/common/split-master-detail";

export default function StepsManagementContent() {
  const [selectedStep, setSelectedStep] =
    useState<StepsManagementDataModel | null>(null);
  const [stepQuery, setStepQuery] = useState("");

  const { data: childSteps = [] } = useChildStepsManagement({});

  const {
    data: steps = [],
    onCreate: onCreateStep,
    onCreateLoading: onCreateStepLoading,
    onDelete: onDeleteStep,
    onDeleteLoading: onDeleteStepLoading,
  } = useStepsManagement({});

  const { onUpdate: onUpdateStep, onUpdateLoading: onUpdateStepLoading } =
    useStepManagement({ id: selectedStep?.id ?? "" });

  const stepFormLoading = selectedStep
    ? onUpdateStepLoading
    : onCreateStepLoading;

  const handleSelectStep = (step: StepsManagementDataModel) => {
    setSelectedStep((prev) => (prev?.id === step.id ? null : step));
  };

  const handleSubmitStep = async (
    payload: StepsManagementPayloadCreateModel,
  ) => {
    if (selectedStep) {
      try {
        await onUpdateStep({ id: selectedStep.id, payload });
        setSelectedStep(null);
      } catch {
        // handled by notification hook
      }
      return;
    }
    await onCreateStep(payload);
    setSelectedStep(null);
  };

  const handleDeleteStep = async (stepId?: string) => {
    const idToDelete = stepId ?? selectedStep?.id;
    if (!idToDelete) return;
    try {
      await onDeleteStep(idToDelete);
      if (selectedStep?.id === idToDelete) {
        setSelectedStep(null);
      }
    } catch {
      // handled by notification hook
    }
  };

  const filteredSteps = useMemo(() => {
    const query = stepQuery.trim().toLowerCase();
    if (!query) return steps ?? [];
    return (steps ?? []).filter((step) =>
      step.label.toLowerCase().includes(query),
    );
  }, [stepQuery, steps]);

  const childLabelById = useMemo(() => {
    const map = new Map<string, string>();
    (childSteps ?? []).forEach((child) => {
      map.set(child.id, child.label);
    });
    return map;
  }, [childSteps]);

  return (
    <SplitMasterDetailLayout
      pageTitle="Step Management"
      pageSubtitle="Configure pipeline steps and requirements"
      pageIcon={<OrderedListOutlined />}
      onAddNew={() => setSelectedStep(null)}
      addNewText="Add Step"
      listTitle="Step List"
      listCount={filteredSteps.length}
      listFilter={
        <Input
          allowClear
          value={stepQuery}
          onChange={(e) => setStepQuery(e.target.value)}
          placeholder="Search step name..."
          prefix={<SearchOutlined style={{ color: "#94a3b8", fontSize: 13 }} />}
          style={{ width: "100%", height: 34, borderRadius: 8, borderColor: "#e2e8f0", fontSize: 12.5 }}
        />
      }
      listContent={
        filteredSteps.length === 0 ? (
          <Empty
            description={
              stepQuery
                ? "No steps match your search"
                : "No steps registered yet"
            }
          />
        ) : (
          filteredSteps.map((step) => {
            const isSelected = selectedStep?.id === step.id;
            const children = step.children ?? [];
            const fallbackChildren =
              children.length === 0 && step.child_ids?.length
                ? step.child_ids.map((id) => ({
                    id,
                    label: childLabelById.get(id) ?? id,
                  }))
                : [];
            const allChildren =
              children.length > 0 ? children : fallbackChildren;

            return (
              <div
                key={step.id}
                className={`${splitMasterDetailStyles.cardItem} ${
                  isSelected ? splitMasterDetailStyles.cardItemActive : ""
                }`}
                onClick={() => handleSelectStep(step)}
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
                      {step.label}
                    </div>
                  </div>

                  <Space size={6} onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="small"
                      type={isSelected ? "primary" : "default"}
                      icon={<EditOutlined />}
                      onClick={() => handleSelectStep(step)}
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
                      title="Delete Step"
                      description={`Are you sure you want to delete step "${step.label}"?`}
                      onConfirm={() => handleDeleteStep(step.id)}
                      okText="Delete"
                      cancelText="Cancel"
                      okButtonProps={{ danger: true }}
                    >
                      <Button
                        size="small"
                        danger
                        type="text"
                        icon={<DeleteOutlined style={{ fontSize: 14 }} />}
                        title="Delete this step"
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
                  {allChildren.length > 0 ? (
                    allChildren.map((child) => (
                      <Tag
                        key={child.id}
                        color="blue"
                        style={{
                          borderRadius: 6,
                          fontSize: 11,
                          marginRight: 0,
                          background: "#eff6ff",
                          borderColor: "#bfdbfe",
                          color: "#1d4ed8",
                        }}
                      >
                        {child.label}
                      </Tag>
                    ))
                  ) : (
                    <Tag
                      style={{
                        borderRadius: 6,
                        fontSize: 11,
                        marginRight: 0,
                        background: "#f1f5f9",
                        borderColor: "#e2e8f0",
                        color: "#64748b",
                      }}
                    >
                      No category
                    </Tag>
                  )}
                </div>
              </div>
            );
          })
        )
      }
      formTitle={selectedStep ? "Edit Step" : "Add Step"}
      formSubtitle={
        selectedStep
          ? "Modify registration stage configuration."
          : "Link registration stage to step categories."
      }
      formTag={
        selectedStep ? (
          <Tag color="blue" style={{ borderRadius: 6, fontWeight: 600 }}>
            Edit Mode
          </Tag>
        ) : (
          <Tag color="green" style={{ borderRadius: 6, fontWeight: 600 }}>
            New
          </Tag>
        )
      }
      isEditing={Boolean(selectedStep)}
      onCancelEdit={() => setSelectedStep(null)}
      onAddNewFromForm={() => setSelectedStep(null)}
      formContent={
        <FormStepManagement
          selectedStep={selectedStep}
          childStepsData={childSteps}
          onSubmit={handleSubmitStep}
          onDelete={() => handleDeleteStep()}
          onCancel={() => setSelectedStep(null)}
          loading={stepFormLoading}
          deleteLoading={onDeleteStepLoading}
        />
      }
    />
  );
}

