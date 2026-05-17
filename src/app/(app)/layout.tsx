import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { SidebarProvider } from "@/components/SidebarProvider";
import AppShell from "@/components/AppShell";
import { AtomQuestCopilot } from "@/components/AtomQuestCopilot";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  const user = session.user as { id: string; name?: string | null; role?: string };

  return (
    <SidebarProvider>
      <div style={{ display: "flex" }}>
        <Sidebar role={user.role ?? "EMPLOYEE"} name={user.name ?? "User"} />
        <AppShell>{children}</AppShell>
        <AtomQuestCopilot />
      </div>
    </SidebarProvider>
  );
}
