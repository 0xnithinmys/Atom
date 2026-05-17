import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Users, Target, CheckCircle2, ClipboardList,
  ShieldCheck, TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default async function AdminPage() {
  const session = await auth();
  const user = session!.user as { id: string; role?: string };
  if (user.role !== "ADMIN") redirect("/dashboard");

  const [users, goals, auditLogs] = await Promise.all([
    prisma.user.findMany({ include: { _count: { select: { goals: true } } }, orderBy: { role: "asc" } }),
    prisma.goal.findMany({ include: { owner: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.auditLog.findMany({ include: { user: { select: { name: true } }, goal: { select: { title: true } } }, orderBy: { createdAt: "desc" }, take: 30 }),
  ]);

  const ROLE_CONFIG: Record<string, { color: string; bg: string; badge: string }> = {
    ADMIN:    { color: "#fbbf24", bg: "rgba(251,191,36,0.12)",  badge: "badge-submitted" },
    MANAGER:  { color: "#34d399", bg: "rgba(52,211,153,0.12)",  badge: "badge-approved"  },
    EMPLOYEE: { color: "#818cf8", bg: "rgba(129,140,248,0.12)", badge: "badge-draft"     },
  };

  const STATUS_COLORS: Record<string, string> = { DRAFT: "#94a3b8", SUBMITTED: "#fbbf24", APPROVED: "#34d399", REWORK: "#f87171" };
  const AUDIT_COLORS: Record<string, string> = { CREATED: "#818cf8", SUBMITTED: "#fbbf24", APPROVED: "#34d399", REWORK: "#f87171", EDITED: "#64748b" };

  const approvalRate = goals.length > 0 ? Math.round((goals.filter((g: typeof goals[0]) => g.status === "APPROVED").length / goals.length) * 100) : 0;

  return (
    <div className="fade-in" style={{ maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
          <ShieldCheck size={16} color="#6366f1" />
          <span style={{ fontSize: "0.8rem", color: "#6366f1", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>Administration</span>
        </div>
        <h1 className="page-title">Admin Panel</h1>
        <p className="page-subtitle" style={{ marginBottom: 0 }}>Manage organization, users, cycles, and oversee completion rates.</p>
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.875rem" }}>
          <Link href="/admin/cycles"><button className="btn-primary">Configure Cycles</button></Link>
          <Link href="/admin/unlock-goals"><button className="btn-secondary">Unlock Goals</button></Link>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: "Total Users", value: users.length, Icon: Users, color: "#818cf8" },
          { label: "Total Goals", value: goals.length, Icon: Target, color: "#a78bfa" },
          { label: "Approval Rate", value: `${approvalRate}%`, Icon: CheckCircle2, color: "#34d399" },
          { label: "Audit Events", value: auditLogs.length, Icon: ClipboardList, color: "#fbbf24" },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ padding: "0.5rem", borderRadius: "0.625rem", background: `${s.color}15`, border: `1px solid ${s.color}30`, width: "fit-content" }}>
              <s.Icon size={18} color={s.color} />
            </div>
            <div style={{ fontSize: "1.875rem", fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: "0.75rem", color: "#475569", fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Users Table */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <ShieldCheck size={13} /> Users & Org Hierarchy
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Goals</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u: typeof users[0]) => {
                const rc = ROLE_CONFIG[u.role] ?? ROLE_CONFIG.EMPLOYEE;
                const initials = u.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
                return (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                        <Avatar style={{ width: 32, height: 32, border: `2px solid ${rc.color}40` }}>
                          <AvatarFallback style={{ background: rc.bg, color: rc.color, fontSize: "0.72rem", fontWeight: 700 }}>{initials}</AvatarFallback>
                        </Avatar>
                        <span style={{ fontWeight: 600, color: "#e2e8f0" }}>{u.name}</span>
                      </div>
                    </td>
                    <td style={{ color: "#64748b", fontSize: "0.82rem" }}>{u.email}</td>
                    <td>
                      <span style={{ background: rc.bg, color: rc.color, padding: "0.2rem 0.65rem", borderRadius: "999px", fontSize: "0.7rem", fontWeight: 700, border: `1px solid ${rc.color}30` }}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: "#818cf8" }}>{u._count.goals}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Goals + Audit Side by Side */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {/* Goals Status */}
        <div>
          <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Target size={13} /> Goal Status Overview
          </div>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Goal</th><th>Owner</th><th>Status</th></tr></thead>
              <tbody>
                {goals.slice(0, 10).map(g => (
                  <tr key={g.id}>
                    <td style={{ fontWeight: 500, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#94a3b8" }}>{g.title}</td>
                    <td style={{ color: "#64748b", fontSize: "0.78rem" }}>{g.owner.name}</td>
                    <td>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: STATUS_COLORS[g.status] ?? "#94a3b8", fontWeight: 700, fontSize: "0.75rem" }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: STATUS_COLORS[g.status] ?? "#94a3b8", flexShrink: 0 }} />
                        {g.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Trail */}
        <div>
          <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <ClipboardList size={13} /> Audit Trail
          </div>
          <div className="table-wrapper" style={{ maxHeight: 370, overflowY: "auto" }}>
            <table>
              <thead><tr><th>Action</th><th>By</th><th>Goal</th><th>Time</th></tr></thead>
              <tbody>
                {auditLogs.map(log => (
                  <tr key={log.id}>
                    <td>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: AUDIT_COLORS[log.action] ?? "#64748b", flexShrink: 0, boxShadow: `0 0 4px ${AUDIT_COLORS[log.action] ?? "#64748b"}` }} />
                        <span style={{ color: AUDIT_COLORS[log.action] ?? "#64748b", fontWeight: 700, fontSize: "0.75rem" }}>{log.action}</span>
                      </span>
                    </td>
                    <td style={{ fontSize: "0.78rem", color: "#94a3b8" }}>{log.user.name}</td>
                    <td style={{ fontSize: "0.72rem", color: "#64748b", maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.goal?.title ?? "—"}</td>
                    <td style={{ fontSize: "0.68rem", color: "#475569" }}>{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
