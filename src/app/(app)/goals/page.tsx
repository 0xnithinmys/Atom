import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveCycle } from "@/lib/cycle";
import Link from "next/link";
import GoalActions from "./GoalActions";
import {
  Target, TrendingUp, TrendingDown, Calendar, Shield,
  PlusCircle, ArrowRight, AlertTriangle, Scale,
} from "lucide-react";

type GoalItem = {
  id: string;
  title: string;
  description: string;
  thrustArea: string;
  uomType: string;
  target: number;
  weightage: number;
  status: string;
  achievements: Array<{ quarter: number; score: number }>;
  sharedLinkId?: string;
  sharedOwnerName?: string;
};

const UOM_META: Record<string, { Icon: React.ElementType; color: string; label: string }> = {
  MIN: { Icon: TrendingUp, color: "#818cf8", label: "Maximize" },
  MAX: { Icon: TrendingDown, color: "#34d399", label: "Minimize" },
  TIMELINE: { Icon: Calendar, color: "#fbbf24", label: "Timeline" },
  ZERO: { Icon: Shield, color: "#f87171", label: "Zero-based" },
};

const STATUS_STYLE: Record<string, { className: string; dot: string }> = {
  DRAFT: { className: "badge-draft", dot: "#94a3b8" },
  SUBMITTED: { className: "badge-submitted", dot: "#fbbf24" },
  APPROVED: { className: "badge-approved", dot: "#34d399" },
  REWORK: { className: "badge-rework", dot: "#f87171" },
};

export default async function GoalsPage() {
  const session = await auth();
  const user = session!.user as { id: string };
  const activeCycle = await getActiveCycle();

  const ownGoals = await prisma.goal.findMany({
    where: { ownerId: user.id, cycleYear: activeCycle.year },
    include: { achievements: true },
    orderBy: { createdAt: "desc" },
  });

  const sharedLinks = await prisma.sharedGoal.findMany({
    where: { userId: user.id, goal: { cycleYear: activeCycle.year } },
    include: {
      goal: {
        include: {
          achievements: true,
          owner: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const sharedGoals: GoalItem[] = sharedLinks.map((link) => ({
    id: link.goal.id,
    title: link.goal.title,
    description: link.goal.description,
    thrustArea: link.goal.thrustArea,
    uomType: link.goal.uomType,
    target: link.goal.target,
    weightage: link.weightage,
    status: link.goal.status,
    achievements: link.goal.achievements,
    sharedLinkId: link.id,
    sharedOwnerName: link.goal.owner.name,
  }));

  const goalItems: GoalItem[] = [
    ...ownGoals.map((g) => ({
      id: g.id,
      title: g.title,
      description: g.description,
      thrustArea: g.thrustArea,
      uomType: g.uomType,
      target: g.target,
      weightage: g.weightage,
      status: g.status,
      achievements: g.achievements,
    })),
    ...sharedGoals,
  ];

  const totalWeightage = goalItems.reduce((s, g) => s + g.weightage, 0);
  const canSubmitAll = totalWeightage === 100 && ownGoals.some((g) => g.status === "DRAFT");

  return (
    <div className="fade-in" style={{ maxWidth: 900 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
            <Target size={16} color="#6366f1" />
            <span style={{ fontSize: "0.8rem", color: "#6366f1", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>FY {activeCycle.year}</span>
          </div>
          <h1 className="page-title">My Goals</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>{goalItems.length}/8 goals | {totalWeightage}% weightage allocated</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          {totalWeightage !== 100 && goalItems.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.78rem", color: "#fbbf24", background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)", borderRadius: "0.5rem", padding: "0.4rem 0.75rem" }}>
              <AlertTriangle size={13} /> Total must be 100%
            </div>
          )}
          {ownGoals.length < 8 && (
            <Link href="/goals/new" style={{ textDecoration: "none" }}><button className="btn-primary"><PlusCircle size={15} /> Add Goal</button></Link>
          )}
          {canSubmitAll && <GoalActions goalIds={ownGoals.filter((g) => g.status === "DRAFT").map((g) => g.id)} />}
        </div>
      </div>

      {goalItems.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem 2rem" }}>No goals yet.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {goalItems.map((goal, i) => {
            const uom = UOM_META[goal.uomType] ?? UOM_META.MIN;
            const st = STATUS_STYLE[goal.status] ?? STATUS_STYLE.DRAFT;
            const latestAch = [...goal.achievements].sort((a, b) => b.quarter - a.quarter)[0];
            return (
              <div key={`${goal.id}-${goal.sharedLinkId ?? "own"}`} className="card" style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "1rem", alignItems: "start", animationDelay: `${i * 60}ms` }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                    <div style={{ padding: "0.35rem", borderRadius: "0.5rem", background: `${uom.color}18`, border: `1px solid ${uom.color}30` }}><uom.Icon size={15} color={uom.color} /></div>
                    <span style={{ fontWeight: 700, fontSize: "0.975rem", color: "#f1f5f9" }}>{goal.title}</span>
                    <span className={`badge ${st.className}`}>{goal.status}</span>
                    {goal.sharedLinkId && <span className="badge" style={{ background: "rgba(129,140,248,0.12)", color: "#818cf8", border: "1px solid rgba(129,140,248,0.25)" }}>SHARED KPI</span>}
                  </div>
                  {goal.description && <div style={{ color: "#64748b", fontSize: "0.84rem", marginBottom: "0.75rem", lineHeight: 1.5 }}>{goal.description}</div>}
                  <div style={{ display: "flex", gap: "1.25rem", fontSize: "0.78rem", color: "#475569", flexWrap: "wrap" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}><Target size={12} color="#6366f1" /> {goal.thrustArea}</span>
                    <span>Target: <strong style={{ color: "#94a3b8" }}>{goal.target}</strong></span>
                    <span>Weight: <strong style={{ color: "#94a3b8" }}>{goal.weightage}%</strong></span>
                    {goal.sharedOwnerName && <span>Primary owner: <strong style={{ color: "#94a3b8" }}>{goal.sharedOwnerName}</strong></span>}
                    {latestAch && <span style={{ color: "#818cf8", fontWeight: 700 }}>Score: {latestAch.score.toFixed(1)}%</span>}
                  </div>
                </div>
                <Link href={`/goals/${goal.id}${goal.sharedLinkId ? `?sg=${goal.sharedLinkId}` : ""}`} style={{ textDecoration: "none", flexShrink: 0 }}>
                  <button className="btn-secondary" style={{ fontSize: "0.8rem", padding: "0.4rem 0.875rem" }}>View <ArrowRight size={13} /></button>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
