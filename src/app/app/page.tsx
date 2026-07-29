import Link from "next/link";
import { Upload, BarChart3, FileSpreadsheet } from "lucide-react";
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

  const { count: batchCount } = await supabase
    .from("import_batch")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user?.id ?? "");

  const { count: lineCount } = await supabase
    .from("spend_line")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user?.id ?? "");

  const stats = [
    {
      label: "Lô đã nhập",
      value: batchCount ?? 0,
      icon: FileSpreadsheet,
    },
    {
      label: "Dòng chi phí",
      value: (lineCount ?? 0).toLocaleString("vi-VN"),
      icon: BarChart3,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">Tổng quan</h2>
        <p className="text-sm text-muted-foreground">
          Chào {user?.email?.split("@")[0] ?? "bạn"}, đây là bảng điều khiển của bạn.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}

        <Link href="/app/uploads" className="group">
          <Card className="h-full shadow-sm transition-shadow group-hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tải lên
              </CardTitle>
              <Upload className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Nhập file Excel chi phí mới
              </p>
            </CardContent>
          </Card>
        </Link>
      </section>

      <section>
        <Link href="/app/analytics" className="group">
          <Card className="shadow-sm transition-shadow group-hover:shadow-md">
            <CardContent className="flex items-center gap-4 py-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <BarChart3 className="size-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Xem phân tích chi phí</p>
                <p className="text-sm text-muted-foreground">
                  Treemap, xu hướng theo tháng, chi tiết theo nhà máy và mã chi
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </section>
    </div>
  );
}
