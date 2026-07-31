import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
  return (
    <AuthShell
      title="Bắt đầu cùng Dương Vũ"
      subtitle="Tạo tài khoản để quản lý chi phí xuất khẩu và sản xuất trên cùng một hệ thống."
    >
      <SignupForm />
    </AuthShell>
  );
}
