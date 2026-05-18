"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Target, PlusCircle, CheckSquare, Users,
  ClipboardList, ShieldCheck, BarChart3, LogOut, Zap, Bell,
  PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useSidebar } from "./SidebarProvider";

interface NavItem { href: string; label: string; Icon: React.ElementType; roles?: string[]; }

const NAV: NavItem[] = [
  { href: "/dashboard",     label: "Dashboard",    Icon: LayoutDashboard },
  { href: "/goals/new",     label: "New Goal",      Icon: PlusCircle,    roles: ["EMPLOYEE"] },
  { href: "/goals",         label: "My Goals",      Icon: Target,        roles: ["EMPLOYEE"] },
  { href: "/goals/approve", label: "Approve Goals", Icon: CheckSquare,   roles: ["MANAGER", "ADMIN"] },
  { href: "/goals/shared",  label: "Shared Goals",  Icon: Users,          roles: ["MANAGER", "ADMIN"] },
  { href: "/goals",         label: "Team Goals",    Icon: Users,         roles: ["MANAGER"] },
  { href: "/checkin",       label: "Check-ins",     Icon: ClipboardList },
  { href: "/notifications", label: "Notifications", Icon: Bell },
  { href: "/reports",       label: "Reports",       Icon: BarChart3,     roles: ["ADMIN", "MANAGER"] },
  { href: "/admin/escalations", label: "Escalations", Icon: ClipboardList, roles: ["ADMIN"] },
  { href: "/admin",         label: "Admin Panel",   Icon: ShieldCheck,   roles: ["ADMIN"] },
];

const ROLE_CONFIG: Record<string, { color: string; bg: string }> = {
  ADMIN:    { color: "#fbbf24", bg: "rgba(251,191,36,0.12)"  },
  MANAGER:  { color: "#34d399", bg: "rgba(52,211,153,0.12)"  },
  EMPLOYEE: { color: "#818cf8", bg: "rgba(129,140,248,0.12)" },
};

const EXPANDED_W = 240;
const COLLAPSED_W = 64;

export default function Sidebar({ role, name }: { role: string; name: string }) {
  const path = usePathname();
  const { collapsed, toggle } = useSidebar();
  const links = NAV.filter(n => !n.roles || n.roles.includes(role));
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const rc = ROLE_CONFIG[role] ?? ROLE_CONFIG.EMPLOYEE;
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? COLLAPSED_W : EXPANDED_W,
        minHeight: "100vh",
        background: "linear-gradient(180deg, #070c18 0%, #0a1020 100%)",
        borderRight: "1px solid rgba(99,102,241,0.12)",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        top: 0, left: 0,
        zIndex: 40,
        transition: "width 0.3s cubic-bezier(0.4,0,0.2,1)",
        overflow: "hidden",
      }}>

        {/* Logo */}
        <div style={{
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: collapsed ? "0" : "0 1rem",
          gap: "0.75rem",
          borderBottom: "1px solid rgba(99,102,241,0.1)",
        }}>
          <Link href="/dashboard" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{
              width: 36, height: 36, borderRadius: "10px", flexShrink: 0,
              background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 12px rgba(99,102,241,0.35)",
            }}>
              <Zap size={18} color="white" />
            </div>
            <div style={{
              overflow: "hidden",
              maxWidth: collapsed ? 0 : 140,
              opacity: collapsed ? 0 : 1,
              transition: "max-width 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.15s",
              whiteSpace: "nowrap",
            }}>
              <div style={{ fontWeight: 800, fontSize: "0.92rem", color: "#f1f5f9", lineHeight: 1.1 }}>AtomQuest</div>
              <div style={{ fontSize: "0.6rem", color: "#475569", fontWeight: 500, letterSpacing: "0.05em" }}>GOAL PORTAL</div>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "0.5rem 0", overflowY: "auto", overflowX: "hidden" }}>
          {/* Section label */}
          <div style={{
            padding: collapsed ? "0" : "0.25rem 0.875rem 0.375rem",
            fontSize: "0.6rem", fontWeight: 700, color: "#2d3f55",
            letterSpacing: "0.09em", textTransform: "uppercase",
            maxHeight: collapsed ? 0 : 28, opacity: collapsed ? 0 : 1,
            overflow: "hidden",
            transition: "max-height 0.3s, opacity 0.2s",
          }}>Navigation</div>

          {mounted && links.map(({ href, label, Icon }) => {
            const isActive =
              path === href ||
              (href === "/admin" && path === "/admin") ||
              (href === "/admin/escalations" && path.startsWith("/admin/escalations")) ||
              (href === "/goals" && path.startsWith("/goals/") && !path.startsWith("/goals/new") && !path.startsWith("/goals/approve")) ||
              (href !== "/dashboard" && href !== "/goals" && href !== "/admin" && href !== "/admin/escalations" && path.startsWith(href));

            return (
              <Link
                key={href + label}
                href={href}
                title={collapsed ? label : undefined}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: collapsed ? "center" : "flex-start",
                  gap: "0.75rem",
                  padding: collapsed ? "0.65rem 0" : "0.6rem 0.875rem",
                  margin: "0.1rem 0.5rem",
                  borderRadius: "0.625rem",
                  textDecoration: "none",
                  color: isActive ? "#a5b4fc" : "#64748b",
                  background: isActive
                    ? "linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.12))"
                    : "transparent",
                  border: `1px solid ${isActive ? "rgba(99,102,241,0.3)" : "transparent"}`,
                  boxShadow: isActive ? "0 2px 10px rgba(99,102,241,0.12)" : "none",
                  transition: "all 0.18s",
                  position: "relative",
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.background = "rgba(99,102,241,0.1)";
                    el.style.color = "#a5b4fc";
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.background = "transparent";
                    el.style.color = "#64748b";
                  }
                }}
              >
                {/* Active left bar when collapsed */}
                {isActive && collapsed && (
                  <div style={{
                    position: "absolute", left: 0, top: "18%", bottom: "18%",
                    width: 3, borderRadius: "0 2px 2px 0",
                    background: "linear-gradient(180deg,#6366f1,#8b5cf6)",
                  }} />
                )}

                <Icon size={17} style={{ flexShrink: 0 }} />

                <span style={{
                  overflow: "hidden",
                  maxWidth: collapsed ? 0 : 160,
                  opacity: collapsed ? 0 : 1,
                  whiteSpace: "nowrap",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  transition: "max-width 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.15s",
                }}>
                  {label}
                </span>

                {isActive && !collapsed && (
                  <div style={{
                    marginLeft: "auto", flexShrink: 0,
                    width: 5, height: 5, borderRadius: "50%",
                    background: "#6366f1",
                    boxShadow: "0 0 6px rgba(99,102,241,0.7)",
                  }} />
                )}
              </Link>
            );
          })}
        </nav>

        <Separator style={{ background: "rgba(99,102,241,0.1)" }} />

        {/* User section */}
        <div style={{
          padding: collapsed ? "0.75rem 0.5rem" : "0.875rem",
          display: "flex", flexDirection: "column",
          alignItems: collapsed ? "center" : "stretch",
          gap: "0.625rem",
        }}>
          <div
            title={collapsed ? `${name} · ${role}` : undefined}
            style={{
              display: "flex", alignItems: "center",
              gap: collapsed ? 0 : "0.625rem",
              padding: collapsed ? 0 : "0.625rem 0.75rem",
              borderRadius: "0.75rem",
              background: collapsed ? "transparent" : rc.bg,
              border: collapsed ? "none" : `1px solid ${rc.color}20`,
              transition: "all 0.3s",
            }}>
            <Avatar style={{ width: 32, height: 32, flexShrink: 0, border: `2px solid ${rc.color}40` }}>
              <AvatarFallback style={{ background: rc.bg, color: rc.color, fontSize: "0.75rem", fontWeight: 700 }}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div style={{
              overflow: "hidden",
              maxWidth: collapsed ? 0 : 130,
              opacity: collapsed ? 0 : 1,
              transition: "max-width 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.15s",
              whiteSpace: "nowrap",
            }}>
              <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
              <div style={{ fontSize: "0.65rem", fontWeight: 700, color: rc.color, letterSpacing: "0.05em" }}>{role}</div>
            </div>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title={collapsed ? "Sign Out" : undefined}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: collapsed ? 0 : "0.4rem",
              width: "100%", padding: "0.45rem",
              borderRadius: "0.625rem",
              background: "rgba(30,41,59,0.8)",
              border: "1px solid rgba(99,102,241,0.15)",
              color: "#64748b", fontSize: "0.8rem", fontWeight: 500, cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = "rgba(239,68,68,0.1)"; b.style.color = "#f87171"; b.style.borderColor = "rgba(239,68,68,0.2)"; }}
            onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = "rgba(30,41,59,0.8)"; b.style.color = "#64748b"; b.style.borderColor = "rgba(99,102,241,0.15)"; }}
          >
            <LogOut size={14} style={{ flexShrink: 0 }} />
            <span style={{
              overflow: "hidden",
              maxWidth: collapsed ? 0 : 80,
              opacity: collapsed ? 0 : 1,
              whiteSpace: "nowrap",
              transition: "max-width 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.15s",
            }}>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Floating toggle handle — rides the right edge of sidebar */}
      <button
        onClick={toggle}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        style={{
          position: "fixed",
          left: (collapsed ? COLLAPSED_W : EXPANDED_W) - 12,
          top: 22,
          zIndex: 50,
          width: 24, height: 24,
          borderRadius: "50%",
          background: "#0f1932",
          border: "1px solid rgba(99,102,241,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
          transition: "left 0.3s cubic-bezier(0.4,0,0.2,1), background 0.2s",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(99,102,241,0.3)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#0f1932"; }}
      >
        {collapsed
          ? <PanelLeftOpen size={13} color="#818cf8" />
          : <PanelLeftClose size={13} color="#818cf8" />
        }
      </button>
    </>
  );
}
