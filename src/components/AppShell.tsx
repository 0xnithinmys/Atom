"use client";
import { useSidebar } from "./SidebarProvider";

const EXPANDED_W = 240;
const COLLAPSED_W = 64;

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  const sideW = collapsed ? COLLAPSED_W : EXPANDED_W;

  return (
    <main
      style={{
        marginLeft: sideW,
        width: `calc(100% - ${sideW}px)`,
        minHeight: "100vh",
        background: "var(--background)",
        display: "flex",
        justifyContent: "center",
        transition: "margin-left 0.3s cubic-bezier(0.4,0,0.2,1), width 0.3s cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      <div style={{
        width: "100%",
        maxWidth: "1800px",
        padding: "2rem 3rem",
      }} className="app-shell-content">
        {children}
      </div>
    </main>
  );
}
