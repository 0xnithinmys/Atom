"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  TrendingUp, TrendingDown, Calendar, Shield, CheckCircle2,
  XCircle, Eye, AlertTriangle, User, Folder, Target, Scale, Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

interface Goal {
  id: string; title: string; description: string; thrustArea: string;
  uomType: string; target: number; weightage: number; status: string;
  owner: { name: string; email: string };
}

const UOM_META: Record<string, { Icon: React.ElementType; color: string }> = {
  MIN:      { Icon: TrendingUp,   color: "#818cf8" },
  MAX:      { Icon: TrendingDown, color: "#34d399" },
  TIMELINE: { Icon: Calendar,     color: "#fbbf24" },
  ZERO:     { Icon: Shield,       color: "#f87171" },
};

export default function ApproveClient({ goals }: { goals: Goal[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, { target: string; weightage: string }>>({});
  const uniqueEmployees = new Set(goals.map((g) => g.owner.email)).size;
  const avgWeightage = goals.length ? goals.reduce((s, g) => s + g.weightage, 0) / goals.length : 0;
  const thrustAreas = new Set(goals.map((g) => g.thrustArea)).size;

  const getEdit = (id: string) => edits[id] ?? { target: "", weightage: "" };
  const setEdit = (id: string, k: "target" | "weightage", v: string) =>
    setEdits(e => ({ ...e, [id]: { ...getEdit(id), [k]: v } }));

  async function act(id: string, status: "APPROVED" | "REWORK") {
    setLoading(id + status);
    setError(null);
    setSuccess(null);
    const edit = getEdit(id);
    const body: Record<string, unknown> = { status };
    if (edit.target) body.target = Number(edit.target);
    if (edit.weightage) body.weightage = Number(edit.weightage);
    const res = await fetch(`/api/goals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(null);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to update goal");
      return;
    }
    setSuccess(status === "APPROVED" ? "Goal approved successfully!" : "Goal returned for rework.");
    router.refresh();
  }

  return (
    <div className="fade-in" style={{ maxWidth: 900 }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
          <CheckCircle2 size={16} color="#6366f1" />
          <span style={{ fontSize: "0.8rem", color: "#6366f1", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>Manager Review</span>
        </div>
        <h1 className="page-title">Approve Goals</h1>
        <p className="page-subtitle" style={{ marginBottom: 0 }}>
          Review and approve submitted goal sheets from your team.
          {goals.length > 0 && <> &nbsp;·&nbsp; <strong style={{ color: "#fbbf24" }}>{goals.length}</strong> pending</>}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "0.75rem", marginBottom: "1.25rem" }}>
        {[
          { label: "Pending Approvals", value: goals.length, Icon: Clock, color: "#fbbf24" },
          { label: "Employees Impacted", value: uniqueEmployees, Icon: User, color: "#818cf8" },
          { label: "Avg Goal Weight", value: `${avgWeightage.toFixed(1)}%`, Icon: Scale, color: "#34d399" },
          { label: "Thrust Areas", value: thrustAreas, Icon: Folder, color: "#a78bfa" },
        ].map((s) => (
          <div key={s.label} className="stat-card" style={{ padding: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: s.color }}><s.Icon size={14} /><span style={{ fontSize: "0.72rem", fontWeight: 700 }}>{s.label}</span></div>
            <div style={{ color: s.color, fontWeight: 800, fontSize: "1.3rem" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "0.75rem", padding: "0.875rem 1rem", marginBottom: "1.25rem", fontSize: "0.875rem", color: "#f87171" }}>
          <AlertTriangle size={15} /> {error}
        </div>
      )}
      {success && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.25)", borderRadius: "0.75rem", padding: "0.875rem 1rem", marginBottom: "1.25rem", fontSize: "0.875rem", color: "#34d399" }}>
          <CheckCircle2 size={15} /> {success}
        </div>
      )}

      {goals.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "4rem 2rem" }}>
          <div className="float" style={{ display: "inline-flex", padding: "1.25rem", borderRadius: "50%", background: "rgba(52,211,153,0.1)", marginBottom: "1.25rem" }}>
            <CheckCircle2 size={40} color="#34d399" />
          </div>
          <div style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: "0.5rem", color: "#e2e8f0" }}>All caught up!</div>
          <div style={{ color: "#64748b", fontSize: "0.875rem" }}>No pending goal submissions from your team.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {goals.map((goal, i) => {
            const uom = UOM_META[goal.uomType] ?? UOM_META.MIN;
            const edit = getEdit(goal.id);
            return (
              <div key={goal.id} className="card" style={{ animationDelay: `${i * 60}ms` }}>
                {/* Goal Header */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.875rem", marginBottom: "1rem" }}>
                  <div style={{ padding: "0.5rem", borderRadius: "0.625rem", background: `${uom.color}15`, border: `1px solid ${uom.color}30`, flexShrink: 0 }}>
                    <uom.Icon size={18} color={uom.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: "1rem", color: "#f1f5f9", marginBottom: "0.25rem" }}>{goal.title}</div>
                    {goal.description && <p style={{ color: "#64748b", fontSize: "0.84rem", margin: 0, lineHeight: 1.5 }}>{goal.description}</p>}
                  </div>
                  <Badge className="badge-submitted">SUBMITTED</Badge>
                </div>

                {/* Meta row */}
                <div style={{ display: "flex", gap: "1.25rem", fontSize: "0.78rem", color: "#475569", flexWrap: "wrap", marginBottom: "1.125rem" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}><User size={12} /> {goal.owner.name}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}><Folder size={12} /> {goal.thrustArea}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}><Target size={12} /> Target: <strong style={{ color: "#94a3b8" }}>{goal.target}</strong></span>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}><Scale size={12} /> <strong style={{ color: "#94a3b8" }}>{goal.weightage}%</strong> weight</span>
                </div>

                <Separator style={{ background: "rgba(99,102,241,0.1)", marginBottom: "1rem" }} />

                {/* Override + Actions */}
                <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", gap: "0.75rem", flex: 1, flexWrap: "wrap" }}>
                    <div className="form-group" style={{ flex: "0 0 160px" }}>
                      <label className="label">Override Target</label>
                      <Input type="number" className="input" placeholder={String(goal.target)} value={edit.target} onChange={e => setEdit(goal.id, "target", e.target.value)} />
                    </div>
                    <div className="form-group" style={{ flex: "0 0 140px" }}>
                      <label className="label">Override Weight %</label>
                      <Input type="number" className="input" placeholder={String(goal.weightage)} value={edit.weightage} onChange={e => setEdit(goal.id, "weightage", e.target.value)} min="10" max="100" />
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                    <Link 
                      href={`/goals/${goal.id}`}
                      className="btn-secondary" 
                      style={{ fontSize: "0.8rem", padding: "0.4rem 0.875rem", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.25rem" }}
                    >
                      <Eye size={13} /> View
                    </Link>
                    <button
                      className="btn-success"
                      disabled={loading === goal.id + "APPROVED"}
                      onClick={() => act(goal.id, "APPROVED")}
                    >
                      {loading === goal.id + "APPROVED" ? "…" : <><CheckCircle2 size={14} /> Approve</>}
                    </button>
                    <button
                      className="btn-danger"
                      disabled={loading === goal.id + "REWORK"}
                      onClick={() => act(goal.id, "REWORK")}
                    >
                      {loading === goal.id + "REWORK" ? "…" : <><XCircle size={14} /> Rework</>}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
