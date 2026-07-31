import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <AuthShell
      title="Hạt gạo tinh khiết, vận hành rõ ràng"
      subtitle="Đăng nhập để tải Excel, phân tích chi phí theo nhà máy và mã chi — cùng nhịp thương hiệu Dương Vũ."
    >
      <LoginForm />
    </AuthShell>
  );
}
