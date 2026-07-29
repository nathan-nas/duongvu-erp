import { signOut } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function AppHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Trang chủ</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-4">
          <p className="text-sm text-muted-foreground">
            Đã đăng nhập với {user?.email ?? "tài khoản hiện tại"}.
          </p>
          <Button render={<Link href="/app/uploads" />}>Tải lên Excel</Button>
          <Button render={<Link href="/app/analytics" />} variant="outline">
            Xem phân tích
          </Button>
          <form action={signOut}>
            <Button type="submit" variant="outline">
              Đăng xuất
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
