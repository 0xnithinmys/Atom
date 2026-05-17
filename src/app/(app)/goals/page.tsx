import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveCycle } from "@/lib/cycle";
import Link from "next/link";
import GoalActions from "./GoalActions";
import {
  Target, TrendingUp, TrendingDown, Calendar, Shield,
  PlusCircle, ArrowRight, AlertTriangle, Scale,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const UOM_META: Record<string, { Icon: React.ElementType; color: string; label: string }> = {
  MIN:      { Icon: TrendingUp,   color: "#818cf8", label: "Maximize" },
  MAX:      { Icon: TrendingDown, color: "#34d399", label: "Minimize" },
  TIMELINE: { Icon: Calendar,     color: "#fbbf24", label: "Timeline" },
  ZERO:     { Icon: Shield,       color: "#f87171", label: "Zero-based" },
};

const STATUS_STYLE: Record<string, { className: string; dot: string }> = {
  DRAFT:     { className: "badge-draft",     dot: "#94a3b8" },
  SUBMITTED: { className: "badge-submitted", dot: "#fbbf24" },
  APPROVED:  { className: "badge-approved",  dot: "#34d399" },
  REWORK:    { className: "badge-rework",    dot: "#f87171" },
};

export default async function GoalsPage() {
  const session = await auth();
  const user = session!.user as { id: string; name?: string | null; role?: string };
  const activeCycle = await getActiveCycle();

  const goals = await prisma.goal.findMany({
    where: { ownerId: user.id, cycleYear: activeCycle.year },
    include: { achievements: true },
    orderBy: { createdAt: "desc" },
  });

  const totalWeightage = goals.reduce((s: number, g: typeof goals[0]) => s + g.weightage, 0);
  const canSubmitAll = totalWeightage === 100 && goals.some((g: typeof goals[0]) => g.status === "DRAFT");

  return (
    <div className="fade-in" style={{ maxWidth: 900 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
            <Target size={16} color="#6366f1" />
            <span style={{ fontSize: "0.8rem", color: "#6366f1", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>FY {activeCycle.year}</span>
          </div>
          <h1 className="page-title">My Goals</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>
            {goals.length}/8 goals &nbsp;·&nbsp; {totalWeightage}% weightage allocated
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          {totalWeightage !== 100 && goals.length > 0 && (
            <div style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              fontSize: "0.78rem", color: "#fbbf24",
              background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)",
              borderRadius: "0.5rem", padding: "0.4rem 0.75rem",
            }}>
              <AlertTriangle size={13} />
              Total must be 100%
            </div>
          )}
          {goals.length < 8 && (
            <Link href="/goals/new" style={{ textDecoration: "none" }}>
              <button className="btn-primary">
                <PlusCircle size={15} /> Add Goal
              </button>
            </Link>
          )}
          {canSubmitAll && (
            <GoalActions goalIds={goals.filter((g: typeof goals[0]) => g.status === "DRAFT").map((g: typeof goals[0]) => g.id)} />
          )}
        </div>
      </div>

      {/* Weightage Banner */}
      {goals.length > 0 && (
        <div className="card" style={{ marginBottom: "1.5rem", padding: "1.125rem 1.375rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.625rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.82rem", color: "#64748b" }}>
              <Scale size={14} />
              <span>Total Weightage Allocation</span>
            </div>
            <span style={{ fontWeight: 800, fontSize: "1rem", color: totalWeightage === 100 ? "#34d399" : "#fbbf24" }}>
              {totalWeightage}%
            </span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{
              width: `${Math.min(totalWeightage, 100)}%`,
              background: totalWeightage === 100
                ? "linear-gradient(90deg,#059669,#34d399)"
                : "linear-gradient(90deg,#6366f1,#8b5cf6)",
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem", fontSize: "0.7rem", color: "#334155" }}>
            <span>0%</span>
            <span style={{ color: totalWeightage === 100 ? "#34d399" : "#64748b" }}>
              {totalWeightage === 100 ? "✓ Ready to submit" : `${100 - totalWeightage}% remaining`}
            </span>
            <span>100%</span>
          </div>
        </div>
      )}

      {/* Goals List */}
      {goals.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "4rem 2rem" }}>
          <div className="float" style={{ display: "inline-flex", padding: "1.25rem", borderRadius: "50%", background: "rgba(99,102,241,0.1)", marginBottom: "1.25rem" }}>
            <Target size={40} color="#6366f1" />
          </div>
          <div style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem", color: "#e2e8f0" }}>No goals yet</div>
          <div style={{ color: "#64748b", marginBottom: "1.75rem", fontSize: "0.875rem" }}>Create your first goal to get started with FY {activeCycle.year}</div>
          <Link href="/goals/new" style={{ textDecoration: "none" }}>
            <button className="btn-primary"><PlusCircle size={15} /> Create First Goal</button>
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {goals.map((goal, i) => {
            const uom = UOM_META[goal.uomType] ?? UOM_META.MIN;
            const st = STATUS_STYLE[goal.status] ?? STATUS_STYLE.DRAFT;
            const latestAch = goal.achievements.sort((a, b) => b.quarter - a.quarter)[0];
            return (
              <div
                key={goal.id}
                className="card"
                style={{
                  display: "grid", gridTemplateColumns: "1fr auto", gap: "1rem", alignItems: "start",
                  animationDelay: `${i * 60}ms`,
                }}
              >
                <div>
                  {/* Title row */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                    <div style={{ padding: "0.35rem", borderRadius: "0.5rem", background: `${uom.color}18`, border: `1px solid ${uom.color}30` }}>
                      <uom.Icon size={15} color={uom.color} />
                    </div>
                    <span style={{ fontWeight: 700, fontSize: "0.975rem", color: "#f1f5f9" }}>{goal.title}</span>
                    <span className={`badge ${st.className}`}>{goal.status}</span>
                    {goal.status === "REWORK" && (
                      <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.72rem", color: "#f87171" }}>
                        <AlertTriangle size={11} /> Returned for rework
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  {goal.description && (
                    <div style={{ color: "#64748b", fontSize: "0.84rem", marginBottom: "0.75rem", lineHeight: 1.5 }}>{goal.description}</div>
                  )}

                  {/* Meta */}
                  <div style={{ display: "flex", gap: "1.25rem", fontSize: "0.78rem", color: "#475569", flexWrap: "wrap" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <Target size={12} color="#6366f1" /> {goal.thrustArea}
                    </span>
                    <span>Target: <strong style={{ color: "#94a3b8" }}>{goal.target}</strong></span>
                    <span>Weight: <strong style={{ color: "#94a3b8" }}>{goal.weightage}%</strong></span>
                    {latestAch && (
                      <span style={{ color: "#818cf8", fontWeight: 700 }}>
                        Score: {latestAch.score.toFixed(1)}%
                      </span>
                    )}
                  </div>

                  {/* Progress */}
                  {latestAch && (
                    <div style={{ marginTop: "0.875rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "#334155", marginBottom: "0.3rem" }}>
                        <span>Q{latestAch.quarter} Achievement</span>
                        <span style={{ color: "#818cf8", fontWeight: 700 }}>{latestAch.score.toFixed(0)}%</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${Math.min(latestAch.score, 100)}%` }} />
                      </div>
                    </div>
                  )}
                </div>

                <Link href={`/goals/${goal.id}`} style={{ textDecoration: "none", flexShrink: 0 }}>
                  <button className="btn-secondary" style={{ fontSize: "0.8rem", padding: "0.4rem 0.875rem" }}>
                    View <ArrowRight size={13} />
                  </button>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
