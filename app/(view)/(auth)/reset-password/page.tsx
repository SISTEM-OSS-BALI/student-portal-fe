import { Suspense } from "react";
import ResetPasswordContent from "./content";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}
