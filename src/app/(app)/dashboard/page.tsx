import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveCycle } from "@/lib/cycle";
import Link from "next/link";
import {
  Target, CheckCircle2, Clock, Scale, Users, Bell,
  PlusCircle, ClipboardList, CheckSquare, BarChart3,
  Settings, ArrowRight, TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default async function DashboardPage() {
  const session = await auth();
  const user = session!.user as { id: string; name?: string | null; role?: string };
  const role = user.role ?? "EMPLOYEE";
  const activeCycle = await getActiveCycle();

  const myGoals = await prisma.goal.findMany({ where: { ownerId: user.id, cycleYear: activeCycle.year }, include: { achievements: true } });
  const totalWeightage = myGoals.reduce((s: number, g: typeof myGoals[0]) => s + g.weightage, 0);
  const approved = myGoals.filter((g: typeof myGoals[0]) => g.status === "APPROVED").length;
  const submitted = myGoals.filter((g: typeof myGoals[0]) => g.status === "SUBMITTED").length;
  const drafted = myGoals.filter((g: typeof myGoals[0]) => g.status === "DRAFT").length;

  let teamSize = 0;
  let pendingApprovals = 0;
  if (role === "MANAGER" || role === "ADMIN") {
    const reports = await prisma.user.findMany({ where: { managerId: user.id } });
    teamSize = reports.length;
    const reportIds = reports.map((r: typeof reports[0]) => r.id);
    pendingApprovals = await prisma.goal.count({ where: { ownerId: { in: reportIds }, status: "SUBMITTED", cycleYear: activeCycle.year } });
  }

  const auditLogs = await prisma.auditLog.findMany({
    where: { userId: user.id },
    include: { goal: true },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const statCards = [
    { label: "My Goals", value: myGoals.length, sub: `of 8 max`, Icon: Target, color: "#818cf8", gradient: "from-indigo-500/20 to-violet-500/10", ring: "rgba(129,140,248,0.25)", showProgress: true, progressVal: (myGoals.length / 8) * 100 },
    { label: "Approved", value: approved, sub: "goals approved", Icon: CheckCircle2, color: "#34d399", gradient: "from-emerald-500/20 to-teal-500/10", ring: "rgba(52,211,153,0.25)" },
    { label: "Submitted", value: submitted, sub: "awaiting review", Icon: Clock, color: "#fbbf24", gradient: "from-amber-500/20 to-orange-500/10", ring: "rgba(251,191,36,0.25)" },
    { label: "Weightage", value: `${totalWeightage}%`, sub: totalWeightage === 100 ? "✓ Complete" : `${100 - totalWeightage}% remaining`, Icon: Scale, color: totalWeightage === 100 ? "#34d399" : "#f87171", gradient: totalWeightage === 100 ? "from-emerald-500/20 to-teal-500/10" : "from-red-500/20 to-rose-500/10", ring: totalWeightage === 100 ? "rgba(52,211,153,0.25)" : "rgba(248,113,113,0.25)" },
    ...(role !== "EMPLOYEE" ? [
      { label: "Team", value: teamSize, sub: "direct reports", Icon: Users, color: "#818cf8", gradient: "from-indigo-500/20 to-violet-500/10", ring: "rgba(129,140,248,0.25)" },
      { label: "Pending", value: pendingApprovals, sub: "goal approvals", Icon: Bell, color: pendingApprovals > 0 ? "#fbbf24" : "#34d399", gradient: pendingApprovals > 0 ? "from-amber-500/20 to-orange-500/10" : "from-emerald-500/20 to-teal-500/10", ring: pendingApprovals > 0 ? "rgba(251,191,36,0.25)" : "rgba(52,211,153,0.25)" },
    ] : []),
  ];

  const quickActions = role === "EMPLOYEE" ? [
    { href: "/goals/new", Icon: PlusCircle, label: "Create Goal", desc: "Add a new goal to your sheet", color: "#818cf8" },
    { href: "/checkin",   Icon: ClipboardList, label: "Log Achievement", desc: "Update quarterly progress", color: "#34d399" },
  ] : role === "MANAGER" ? [
    { href: "/goals/approve", Icon: CheckSquare, label: "Approve Goals", desc: `${pendingApprovals} pending review`, color: "#fbbf24", badge: pendingApprovals },
    { href: "/checkin",       Icon: ClipboardList, label: "Team Check-ins", desc: "Review team progress", color: "#818cf8" },
    { href: "/reports",       Icon: BarChart3, label: "Reports", desc: "Export & analytics", color: "#34d399" },
  ] : [
    { href: "/admin",         Icon: Settings, label: "Admin Panel", desc: "Manage org & cycles", color: "#fbbf24" },
    { href: "/reports",       Icon: BarChart3, label: "Reports", desc: "Export & analytics", color: "#34d399" },
    { href: "/admin/unlock-goals", Icon: CheckSquare, label: "Goal Unlock", desc: "Exception handling", color: "#818cf8" },
    { href: "/admin/cycles", Icon: Settings, label: "Configure Cycles", desc: "Active FY + windows", color: "#fbbf24" },
  ];

  const actionColors: Record<string, string> = {
    CREATED: "#818cf8", SUBMITTED: "#fbbf24", APPROVED: "#34d399",
    REWORK: "#f87171", EDITED: "#94a3b8",
  };

  return (
    <div className="fade-in" style={{ maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
          <TrendingUp size={18} color="#6366f1" />
          <span style={{ fontSize: "0.8rem", color: "#6366f1", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>FY {activeCycle.year}</span>
        </div>
        <h1 className="page-title">
          {greeting()},{" "}
          <span className="gradient-text">{user.name?.split(" ")[0]}!</span>
        </h1>
        <p className="page-subtitle">Track your goals, log achievements, and drive performance.</p>

        <div className="card" style={{ padding: "1rem 1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <div style={{ fontWeight: 800, color: "#e2e8f0" }}>{activeCycle.name}</div>
              <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                Goal window: <span style={{ color: activeCycle.goalsUnlocked ? "#34d399" : "#f87171", fontWeight: 800 }}>{activeCycle.goalsUnlocked ? "Open" : "Locked"}</span>
                {"  "}|{"  "}
                Check-ins: <span style={{ color: activeCycle.checkinsOpen ? "#34d399" : "#f87171", fontWeight: 800 }}>{activeCycle.checkinsOpen ? "Open" : "Closed"}</span>
              </div>
            </div>
            {role === "ADMIN" && (
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <Link href="/admin/cycles" style={{ textDecoration: "none" }}><button className="btn-secondary">Configure Cycles</button></Link>
                <Link href="/admin/unlock-goals" style={{ textDecoration: "none" }}><button className="btn-secondary">Unlock Goals</button></Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {statCards.map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ padding: "0.5rem", borderRadius: "0.625rem", background: `bg-gradient-to-br ${s.gradient}`, border: `1px solid ${s.ring}`, backgroundColor: s.ring.replace("0.25", "0.1") }}>
                <s.Icon size={18} color={s.color} />
              </div>
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: s.color, lineHeight: 1, marginTop: "0.5rem" }}>{s.value}</div>
            <div style={{ fontSize: "0.75rem", color: "#475569", fontWeight: 600 }}>{s.label}</div>
            <div style={{ fontSize: "0.7rem", color: "#334155" }}>{s.sub}</div>
            {s.showProgress && (
              <div className="progress-bar" style={{ marginTop: "0.25rem" }}>
                <div className="progress-fill" style={{ width: `${s.progressVal}%` }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "0.8rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "1rem" }}>Quick Actions</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "1rem" }}>
          {quickActions.map(a => (
            <Link key={a.href + a.label} href={a.href} style={{ textDecoration: "none" }}>
              <div className="card" style={{ display: "flex", alignItems: "center", gap: "1rem", cursor: "pointer", position: "relative" }}>
                <div style={{ padding: "0.75rem", borderRadius: "0.75rem", background: `${a.color}15`, border: `1px solid ${a.color}30`, flexShrink: 0 }}>
                  <a.Icon size={22} color={a.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#e2e8f0", marginBottom: "0.15rem" }}>{a.label}</div>
                  <div style={{ fontSize: "0.775rem", color: "#64748b" }}>{a.desc}</div>
                </div>
                {("badge" in a) && (a.badge as number) > 0 && (
                  <div style={{ position: "absolute", top: "0.75rem", right: "0.75rem", background: "#ef4444", borderRadius: "999px", minWidth: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.68rem", fontWeight: 700, color: "white", padding: "0 5px" }}>
                    {a.badge as number}
                  </div>
                )}
                <ArrowRight size={16} color="#334155" style={{ flexShrink: 0 }} />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* My Goals Summary */}
      {myGoals.length > 0 && (
        <div style={{ marginBottom: "2rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          {/* Goal Progress */}
          <Card style={{ background: "linear-gradient(135deg,rgba(13,21,38,0.9),rgba(15,25,50,0.7))", border: "1px solid rgba(99,102,241,0.15)" }}>
            <CardHeader style={{ paddingBottom: "0.75rem" }}>
              <CardTitle style={{ fontSize: "0.875rem", fontWeight: 700, color: "#94a3b8", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Target size={15} /> Goal Status Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              {[
                { label: "Draft", count: drafted, color: "#94a3b8" },
                { label: "Submitted", count: submitted, color: "#fbbf24" },
                { label: "Approved", count: approved, color: "#34d399" },
                { label: "Rework", count: myGoals.filter((g: typeof myGoals[0]) => g.status === "REWORK").length, color: "#f87171" },
              ].map(s => (
                <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.875rem" }}>
                  <div style={{ fontSize: "0.78rem", color: "#64748b", width: 60 }}>{s.label}</div>
                  <div style={{ flex: 1 }}>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${myGoals.length ? (s.count / myGoals.length) * 100 : 0}%`, background: `linear-gradient(90deg,${s.color}99,${s.color})` }} />
                    </div>
                  </div>
                  <div style={{ fontSize: "0.875rem", fontWeight: 700, color: s.color, width: 20, textAlign: "right" }}>{s.count}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card style={{ background: "linear-gradient(135deg,rgba(13,21,38,0.9),rgba(15,25,50,0.7))", border: "1px solid rgba(99,102,241,0.15)" }}>
            <CardHeader style={{ paddingBottom: "0.75rem" }}>
              <CardTitle style={{ fontSize: "0.875rem", fontWeight: 700, color: "#94a3b8", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <ClipboardList size={15} /> Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {auditLogs.length === 0 ? (
                <div style={{ color: "#475569", fontSize: "0.8rem", textAlign: "center", padding: "1rem 0" }}>No activity yet</div>
              ) : (
                auditLogs.map((log: typeof auditLogs[0]) => (
                  <div key={log.id} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", padding: "0.5rem 0", borderBottom: "1px solid rgba(99,102,241,0.07)" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: actionColors[log.action] ?? "#475569", marginTop: "0.45rem", flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                        <Badge style={{ fontSize: "0.62rem", padding: "0.1rem 0.5rem", background: `${actionColors[log.action] ?? "#475569"}20`, color: actionColors[log.action] ?? "#475569", border: "none" }}>
                          {log.action}
                        </Badge>
                        <span style={{ fontSize: "0.775rem", color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.goal?.title ?? "—"}</span>
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "#334155", marginTop: "0.1rem" }}>{new Date(log.createdAt).toLocaleString()}</div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
