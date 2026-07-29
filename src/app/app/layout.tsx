import { AppShellHeader } from "@/components/app/shell-header";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppShellHeader email={user?.email ?? null} />
      {children}
    </div>
  );
}
