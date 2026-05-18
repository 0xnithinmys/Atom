import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveCycle } from "@/lib/cycle";
import { evaluateEscalationsIfDue } from "@/lib/escalationScheduler";
import Link from "next/link";
import {
  Target, CheckCircle2, Clock, Scale, Users, Bell,
  PlusCircle, ClipboardList, CheckSquare, BarChart3,
  Settings, ArrowRight, TrendingUp, Sparkles, Network,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";


export default async function DashboardPage() {
  await evaluateEscalationsIfDue();
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
  let delayedApprovals = 0;
  let teamCheckinPending = 0;
  let managerSummary = "";
  let hierarchyRows: Array<{ name: string; role: string; depth: number }> = [];
  let dependencyRows: Array<{ owner: string; receiver: string; title: string }> = [];
  if (role === "MANAGER" || role === "ADMIN") {
    const reports = await prisma.user.findMany({
      where: { managerId: user.id },
      include: { reports: { select: { id: true, name: true, role: true } } },
    });
    teamSize = reports.length;
    const reportIds = reports.map((r: typeof reports[0]) => r.id);
    const pendingGoals = await prisma.goal.findMany({
      where: { ownerId: { in: reportIds }, status: "SUBMITTED", cycleYear: activeCycle.year },
      select: { updatedAt: true },
    });
    pendingApprovals = pendingGoals.length;
    delayedApprovals = pendingGoals.filter((g) => Date.now() - new Date(g.updatedAt).getTime() > 3 * 24 * 60 * 60 * 1000).length;

    const approvedGoals = await prisma.goal.findMany({
      where: { ownerId: { in: reportIds }, status: "APPROVED", cycleYear: activeCycle.year },
      select: { id: true },
    });
    if (approvedGoals.length > 0) {
      const q = Math.floor(new Date().getMonth() / 3) + 1;
      const achieved = await prisma.achievement.findMany({
        where: { goalId: { in: approvedGoals.map((g) => g.id) }, quarter: q },
        select: { goalId: true },
      });
      teamCheckinPending = approvedGoals.length - new Set(achieved.map((a) => a.goalId)).size;
    }

    const teamGoals = await prisma.goal.findMany({
      where: { ownerId: { in: reportIds }, cycleYear: activeCycle.year },
      include: { achievements: true, owner: { select: { name: true } }, sharedGoals: { include: { user: { select: { name: true } } } } },
    });
    const draftCount = teamGoals.filter((g) => g.status === "DRAFT").length;
    const reworkCount = teamGoals.filter((g) => g.status === "REWORK").length;
    const teamAvgScore = teamGoals.flatMap((g) => g.achievements).length
      ? teamGoals.flatMap((g) => g.achievements).reduce((s, a) => s + a.score, 0) / teamGoals.flatMap((g) => g.achievements).length
      : 0;
    managerSummary = `Team snapshot: ${teamSize} reports, ${teamGoals.length} goals, ${pendingApprovals} pending approvals (${delayedApprovals} delayed >3d), ${reworkCount} in rework, ${draftCount} still draft. Current team average achievement score is ${teamAvgScore.toFixed(1)}%.`;

    hierarchyRows = reports.flatMap((r) => [
      { name: r.name, role: r.role, depth: 1 },
      ...r.reports.map((rr) => ({ name: rr.name, role: rr.role, depth: 2 })),
    ]);
    dependencyRows = teamGoals.flatMap((g) =>
      g.sharedGoals.map((sg) => ({ owner: g.owner.name, receiver: sg.user.name, title: g.title })),
    ).slice(0, 8);
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
      { label: "Delayed", value: delayedApprovals, sub: "pending >3 days", Icon: Clock, color: delayedApprovals > 0 ? "#f87171" : "#34d399", gradient: delayedApprovals > 0 ? "from-red-500/20 to-rose-500/10" : "from-emerald-500/20 to-teal-500/10", ring: delayedApprovals > 0 ? "rgba(248,113,113,0.25)" : "rgba(52,211,153,0.25)" },
      { label: "Check-in Risk", value: teamCheckinPending, sub: "team goals pending check-in", Icon: ClipboardList, color: teamCheckinPending > 0 ? "#fbbf24" : "#34d399", gradient: teamCheckinPending > 0 ? "from-amber-500/20 to-orange-500/10" : "from-emerald-500/20 to-teal-500/10", ring: teamCheckinPending > 0 ? "rgba(251,191,36,0.25)" : "rgba(52,211,153,0.25)" },
    ] : []),
  ];

  const quickActions = role === "EMPLOYEE" ? [
    { href: "/goals/new", Icon: PlusCircle, label: "Create Goal", desc: "Add a new goal to your sheet", color: "#818cf8" },
    { href: "/checkin",   Icon: ClipboardList, label: "Log Achievement", desc: "Update quarterly progress", color: "#34d399" },
    { href: "/notifications", Icon: Bell, label: "Notifications", desc: "View escalation alerts", color: "#f87171" },
  ] : role === "MANAGER" ? [
    { href: "/goals/approve", Icon: CheckSquare, label: "Approve Goals", desc: `${pendingApprovals} pending review`, color: "#fbbf24", badge: pendingApprovals },
    { href: "/checkin",       Icon: ClipboardList, label: "Team Check-ins", desc: "Review team progress", color: "#818cf8" },
    { href: "/reports",       Icon: BarChart3, label: "Reports", desc: "Export & analytics", color: "#34d399" },
    { href: "/notifications", Icon: Bell, label: "Notifications", desc: "View escalation alerts", color: "#f87171" },
  ] : [
    { href: "/admin",         Icon: Settings, label: "Admin Panel", desc: "Manage org & cycles", color: "#fbbf24" },
    { href: "/reports",       Icon: BarChart3, label: "Reports", desc: "Export & analytics", color: "#34d399" },
    { href: "/admin/unlock-goals", Icon: CheckSquare, label: "Goal Unlock", desc: "Exception handling", color: "#818cf8" },
    { href: "/admin/cycles", Icon: Settings, label: "Configure Cycles", desc: "Active FY + windows", color: "#fbbf24" },
    { href: "/admin/escalations", Icon: Bell, label: "Escalations", desc: "Monitor and resolve delays", color: "#f87171" },
    { href: "/notifications", Icon: Bell, label: "My Notifications", desc: "Delivery log for your account", color: "#ef4444" },
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
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginTop: "0.75rem" }}>
          <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>Demo Flow:</span>
          {role === "EMPLOYEE" && (
            <>
              <Link href="/goals/new"><button className="btn-secondary">1. Create Goal</button></Link>
              <Link href="/goals"><button className="btn-secondary">2. Submit Goals</button></Link>
              <Link href="/checkin"><button className="btn-secondary">3. Quarterly Check-in</button></Link>
            </>
          )}
          {role === "MANAGER" && (
            <>
              <Link href="/goals/approve"><button className="btn-secondary">1. Review Approvals</button></Link>
              <Link href="/goals/shared"><button className="btn-secondary">2. Push Shared KPI</button></Link>
              <Link href="/checkin"><button className="btn-secondary">3. Manager Check-in</button></Link>
            </>
          )}
          {role === "ADMIN" && (
            <>
              <Link href="/admin"><button className="btn-secondary">1. Admin Overview</button></Link>
              <Link href="/admin/escalations"><button className="btn-secondary">2. Resolve Escalations</button></Link>
              <Link href="/reports"><button className="btn-secondary">3. Export Reports</button></Link>
            </>
          )}
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

      {(role === "MANAGER" || role === "ADMIN") && (
        <div style={{ marginBottom: "1.5rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <Card style={{ background: "linear-gradient(135deg,rgba(13,21,38,0.9),rgba(15,25,50,0.7))", border: "1px solid rgba(99,102,241,0.15)" }}>
            <CardHeader style={{ paddingBottom: "0.6rem" }}>
              <CardTitle style={{ fontSize: "0.875rem", fontWeight: 700, color: "#94a3b8", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Sparkles size={15} /> AI Manager Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ fontSize: "0.84rem", color: "#cbd5e1", lineHeight: 1.55 }}>{managerSummary}</div>
            </CardContent>
          </Card>

          <Card style={{ background: "linear-gradient(135deg,rgba(13,21,38,0.9),rgba(15,25,50,0.7))", border: "1px solid rgba(99,102,241,0.15)" }}>
            <CardHeader style={{ paddingBottom: "0.6rem" }}>
              <CardTitle style={{ fontSize: "0.875rem", fontWeight: 700, color: "#94a3b8", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Network size={15} /> Org Hierarchy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {hierarchyRows.map((row, idx) => (
                  <div key={`${row.name}-${idx}`} style={{ marginLeft: row.depth === 2 ? "1rem" : 0, fontSize: "0.8rem", color: "#cbd5e1" }}>
                    {row.depth === 2 ? "└─ " : "• "}{row.name} <span style={{ color: "#64748b" }}>({row.role})</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {(role === "MANAGER" || role === "ADMIN") && dependencyRows.length > 0 && (
        <Card style={{ background: "linear-gradient(135deg,rgba(13,21,38,0.9),rgba(15,25,50,0.7))", border: "1px solid rgba(99,102,241,0.15)", marginBottom: "1.5rem" }}>
          <CardHeader style={{ paddingBottom: "0.6rem" }}>
            <CardTitle style={{ fontSize: "0.875rem", fontWeight: 700, color: "#94a3b8", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Network size={15} /> Shared Goal Dependency Map
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
              {dependencyRows.map((dep, i) => (
                <div key={`${dep.owner}-${dep.receiver}-${i}`} style={{ border: "1px solid rgba(99,102,241,0.15)", borderRadius: "0.55rem", padding: "0.55rem 0.7rem", background: "rgba(30,41,59,0.45)" }}>
                  <div style={{ fontSize: "0.78rem", color: "#e2e8f0", fontWeight: 700 }}>{dep.owner} {"->"} {dep.receiver}</div>
                  <div style={{ fontSize: "0.74rem", color: "#64748b" }}>{dep.title}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


