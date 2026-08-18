"use client";

import { Suspense, useCallback, useState } from "react";
import { message } from "antd";
import LoadingSplash from "@/app/components/common/loading";
import StudentsManagementContent from "@/app/(view)/director/dashboard/students-management/content";
import ModalStudentComponent from "@/app/(view)/admission/dashboard/students-management/content/ModalStudentComponent";
import { useCreateUser } from "@/app/hooks/use-users";
import { useStagesManagement } from "@/app/hooks/use-stages-management";
import type {
  StudentFormValues,
  UserPayloadCreateModel,
} from "@/app/models/user";

export default function ConsultantStudentsManagementPage() {
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);

  const { onCreate, onCreateLoading } = useCreateUser();
  const { data: stagesData = [] } = useStagesManagement({});

  const openCreateModal = useCallback(() => setIsStudentModalOpen(true), []);
  const closeStudentModal = useCallback(
    () => setIsStudentModalOpen(false),
    [],
  );

  const handleSubmitStudent = useCallback(
    async (values: StudentFormValues) => {
      const { password, ...rest } = values;
      if (!password) {
        message.error("Password wajib diisi untuk membuat student baru.");
        return;
      }

      const payload: UserPayloadCreateModel = {
        ...rest,
        password,
        role: "student",
      };

      await onCreate(payload);
      closeStudentModal();
    },
    [onCreate, closeStudentModal],
  );

  return (
    <Suspense fallback={<LoadingSplash />}>
      <StudentsManagementContent
        detailBasePath="/consultant/dashboard/students-management/detail"
        readOnly
        title="Student Pipeline Management"
        description="Pantau progres student berdasarkan status, negara tujuan, visa, dan jenjang pendidikan tanpa mengubah data."
        onAddStudent={openCreateModal}
      />

      <ModalStudentComponent
        open={isStudentModalOpen}
        onClose={closeStudentModal}
        onSubmit={handleSubmitStudent}
        onDelete={() => {}}
        onCancel={closeStudentModal}
        loading={onCreateLoading}
        deleteLoading={false}
        selectedStudent={null}
        stagesData={stagesData}
      />
    </Suspense>
  );
}
