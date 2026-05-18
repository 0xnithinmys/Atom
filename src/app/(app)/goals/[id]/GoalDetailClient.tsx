"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, TrendingUp, TrendingDown, Calendar, Shield,
  CheckCircle2, XCircle, Send, Target, Scale, Hash,
  MessageSquare, ClipboardList, Loader2, AlertTriangle, Link2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CheckIn { id: string; comment: string; createdAt: Date | string; manager: { name: string } }
interface Achievement { id: string; quarter: number; actual: number; actualDate: Date | string | null; status: string; score: number; checkIns: CheckIn[] }
interface AuditLog { id: string; action: string; details: string; createdAt: Date | string; user: { name: string } }
interface Goal {
  id: string; title: string; description: string; thrustArea: string; uomType: string;
  target: number; targetDate: Date | string | null; weightage: number; status: string;
  isShared: boolean; cycleYear: number;
  owner: { id: string; name: string; email: string };
  achievements: Achievement[];
  auditLogs: AuditLog[];
}

const STATUS_LABELS: Record<string, string> = { NOT_STARTED: "Not Started", ON_TRACK: "On Track", COMPLETED: "Completed" };
const Q_LABELS = ["", "Q1 (Jul)", "Q2 (Oct)", "Q3 (Jan)", "Q4 (Mar)"];

const UOM_META: Record<string, { Icon: React.ElementType; color: string; label: string }> = {
  MIN:      { Icon: TrendingUp,   color: "#818cf8", label: "Maximize" },
  MAX:      { Icon: TrendingDown, color: "#34d399", label: "Minimize" },
  TIMELINE: { Icon: Calendar,     color: "#fbbf24", label: "Timeline" },
  ZERO:     { Icon: Shield,       color: "#f87171", label: "Zero-based" },
};

const GOAL_STATUS_STYLE: Record<string, string> = {
  DRAFT: "badge-draft", SUBMITTED: "badge-submitted", APPROVED: "badge-approved", REWORK: "badge-rework",
};
const ACH_STATUS_STYLE: Record<string, string> = {
  NOT_STARTED: "badge-not-started", ON_TRACK: "badge-on-track", COMPLETED: "badge-completed",
};
const AUDIT_COLORS: Record<string, string> = {
  CREATED: "#818cf8", SUBMITTED: "#fbbf24", APPROVED: "#34d399", REWORK: "#f87171", EDITED: "#64748b",
};

export default function GoalDetailClient({ goal, currentUserId, currentRole, sharedLinkId }: { goal: Goal; currentUserId: string; currentRole: string; sharedLinkId?: string | null }) {
  const router = useRouter();
  const isOwner = goal.owner.id === currentUserId;
  const canApprove = currentRole === "MANAGER" || currentRole === "ADMIN";

  const [achForm, setAchForm] = useState({ quarter: "1", actual: "", actualDate: "", status: "ON_TRACK" });
  const [checkinForm, setCheckinForm] = useState({ achievementId: "", comment: "" });
  const [sharedWeightage, setSharedWeightage] = useState(String(goal.weightage));
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showMsg = (text: string, type: "success" | "error") => { setMsg({ text, type }); setTimeout(() => setMsg(null), 4000); };

  async function saveSharedWeightage() {
    if (!sharedLinkId) return;
    setLoading(true);
    const res = await fetch(`/api/shared-goals/${sharedLinkId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weightage: Number(sharedWeightage) }),
    });
    setLoading(false);
    if (res.ok) {
      showMsg("Shared weightage updated.", "success");
      router.refresh();
      return;
    }
    const data = await res.json().catch(() => ({}));
    showMsg(data.error ?? "Failed to update shared weightage", "error");
  }

  async function submitAchievement(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/achievements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goalId: goal.id, quarter: Number(achForm.quarter), actual: Number(achForm.actual), actualDate: achForm.actualDate || null, status: achForm.status }),
    });
    setLoading(false);
    if (res.ok) { showMsg("Achievement saved!", "success"); router.refresh(); }
    else showMsg("Error saving achievement", "error");
  }

  async function submitCheckin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/checkins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ achievementId: checkinForm.achievementId, comment: checkinForm.comment }),
    });
    setLoading(false);
    if (res.ok) { showMsg("Check-in saved!", "success"); setCheckinForm({ achievementId: "", comment: "" }); router.refresh(); }
    else showMsg("Error saving check-in", "error");
  }

  async function changeStatus(status: string) {
    setLoading(true);
    await fetch(`/api/goals/${goal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLoading(false);
    router.refresh();
  }

  const uom = UOM_META[goal.uomType] ?? UOM_META.MIN;
  const sortedAchievements = [...goal.achievements].sort((a, b) => a.quarter - b.quarter);

  return (
    <div className="fade-in" style={{ maxWidth: 780 }}>
      {/* Back + Status */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <button onClick={() => router.back()} className="btn-secondary" style={{ fontSize: "0.78rem", padding: "0.35rem 0.75rem" }}>
          <ArrowLeft size={13} /> Back
        </button>
        <span className={`badge ${GOAL_STATUS_STYLE[goal.status] ?? "badge-draft"}`}>{goal.status}</span>
        {goal.isShared && (
          <span className="badge" style={{ background: "rgba(129,140,248,0.12)", color: "#818cf8", border: "1px solid rgba(129,140,248,0.25)", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
            <Link2 size={12} />
            SHARED
          </span>
        )}
      </div>

      {/* Title + Actions */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "1.75rem", flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.375rem" }}>
            <div style={{ padding: "0.4rem", borderRadius: "0.5rem", background: `${uom.color}15`, border: `1px solid ${uom.color}30` }}>
              <uom.Icon size={16} color={uom.color} />
            </div>
            <span style={{ fontSize: "0.75rem", color: uom.color, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{uom.label}</span>
          </div>
          <h1 className="page-title" style={{ marginBottom: "0.25rem" }}>{goal.title}</h1>
          <p style={{ color: "#64748b", fontSize: "0.84rem", margin: 0 }}>
            {goal.thrustArea} · {goal.weightage}% weight · FY {goal.cycleYear}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
          {canApprove && goal.status === "SUBMITTED" && (
            <>
              <button className="btn-success" onClick={() => changeStatus("APPROVED")} disabled={loading}><CheckCircle2 size={14} /> Approve</button>
              <button className="btn-danger" onClick={() => changeStatus("REWORK")} disabled={loading}><XCircle size={14} /> Rework</button>
            </>
          )}
          {isOwner && goal.status === "DRAFT" && (
            <button className="btn-primary" onClick={() => changeStatus("SUBMITTED")} disabled={loading}>
              <Send size={14} /> Submit for Approval
            </button>
          )}
          {isOwner && goal.status === "REWORK" && (
            <button className="btn-primary" onClick={() => changeStatus("SUBMITTED")} disabled={loading}>
              <Send size={14} /> Re-submit
            </button>
          )}
        </div>
      </div>

      {/* Feedback Message */}
      {msg && (
        <div style={{
          display: "flex", alignItems: "center", gap: "0.625rem",
          background: msg.type === "success" ? "rgba(52,211,153,0.08)" : "rgba(239,68,68,0.08)",
          border: `1px solid ${msg.type === "success" ? "rgba(52,211,153,0.25)" : "rgba(239,68,68,0.25)"}`,
          borderRadius: "0.75rem", padding: "0.75rem 1rem", marginBottom: "1.25rem",
          fontSize: "0.875rem", color: msg.type === "success" ? "#34d399" : "#f87171",
        }}>
          {msg.type === "success" ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />} {msg.text}
        </div>
      )}

      {/* Goal Details Card */}
      <div className="card" style={{ marginBottom: "1.25rem" }}>
        <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "1rem" }}>Goal Details</div>
        {goal.description && <p style={{ color: "#94a3b8", margin: "0 0 1.25rem", fontSize: "0.875rem", lineHeight: 1.6 }}>{goal.description}</p>}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.875rem" }}>
          {[
            { label: "Target", value: goal.target, Icon: Target, color: "#818cf8" },
            { label: "Weightage", value: `${goal.weightage}%`, Icon: Scale, color: "#34d399" },
            { label: "Cycle Year", value: goal.cycleYear, Icon: Hash, color: "#fbbf24" },
          ].map(f => (
            <div key={f.label} style={{ background: "rgba(30,41,59,0.5)", borderRadius: "0.75rem", padding: "0.875rem", border: "1px solid rgba(99,102,241,0.1)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.35rem" }}>
                <f.Icon size={12} color={f.color} />
                <span style={{ fontSize: "0.7rem", color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{f.label}</span>
              </div>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, color: f.color }}>{f.value}</div>
            </div>
          ))}
        </div>
      </div>

      {sharedLinkId && (
        <div className="card" style={{ marginBottom: "1.25rem" }}>
          <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.6rem" }}>
            Shared KPI recipient controls (title/target are read-only).
          </div>
          <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", maxWidth: 320 }}>
            <Input type="number" className="input" min="10" value={sharedWeightage} onChange={(e) => setSharedWeightage(e.target.value)} />
            <button className="btn-primary" onClick={saveSharedWeightage} disabled={loading}>Save Weight %</button>
          </div>
        </div>
      )}

      {/* Achievements */}
      <div className="card" style={{ marginBottom: "1.25rem" }}>
        <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "1rem" }}>Quarterly Achievements</div>

        {sortedAchievements.length === 0 ? (
          <p style={{ color: "#475569", fontSize: "0.875rem" }}>No achievements logged yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {sortedAchievements.map(ach => (
              <div key={ach.id} style={{ background: "rgba(30,41,59,0.5)", borderRadius: "0.75rem", padding: "1rem", border: "1px solid rgba(99,102,241,0.1)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.625rem" }}>
                  <span style={{ fontWeight: 700, color: "#e2e8f0" }}>{Q_LABELS[ach.quarter] ?? `Q${ach.quarter}`}</span>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <span className={`badge ${ACH_STATUS_STYLE[ach.status] ?? "badge-draft"}`}>{STATUS_LABELS[ach.status] ?? ach.status}</span>
                    <span style={{ color: "#818cf8", fontWeight: 800, fontSize: "0.875rem" }}>{ach.score.toFixed(1)}%</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.82rem", color: "#64748b", marginBottom: "0.625rem" }}>
                  <span>Actual: <strong style={{ color: "#e2e8f0" }}>{ach.actual}</strong></span>
                  <span>Target: <strong style={{ color: "#e2e8f0" }}>{goal.target}</strong></span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${Math.min(ach.score, 100)}%` }} />
                </div>

                {/* Check-in comments */}
                {ach.checkIns.length > 0 && (
                  <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(99,102,241,0.08)" }}>
                    {ach.checkIns.map(c => (
                      <div key={c.id} style={{ display: "flex", gap: "0.5rem", fontSize: "0.8rem", color: "#64748b", marginBottom: "0.3rem" }}>
                        <MessageSquare size={12} style={{ flexShrink: 0, marginTop: 2, color: "#6366f1" }} />
                        <span><strong style={{ color: "#94a3b8" }}>{c.manager.name}:</strong> {c.comment}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Manager add check-in */}
                {canApprove && (
                  <div style={{ marginTop: "0.75rem" }}>
                    {checkinForm.achievementId === ach.id ? (
                      <form onSubmit={submitCheckin} style={{ display: "flex", gap: "0.5rem" }}>
                        <Input className="input" placeholder="Add check-in comment…" value={checkinForm.comment} onChange={e => setCheckinForm(f => ({ ...f, comment: e.target.value }))} required style={{ flex: 1 }} />
                        <button className="btn-primary" type="submit" disabled={loading} style={{ fontSize: "0.8rem", padding: "0.375rem 0.875rem" }}>Save</button>
                        <button className="btn-secondary" type="button" onClick={() => setCheckinForm({ achievementId: "", comment: "" })} style={{ fontSize: "0.8rem", padding: "0.375rem 0.875rem" }}>Cancel</button>
                      </form>
                    ) : (
                      <button className="btn-secondary" style={{ fontSize: "0.75rem", padding: "0.3rem 0.75rem" }} onClick={() => setCheckinForm({ achievementId: ach.id, comment: "" })}>
                        <MessageSquare size={12} /> Add Comment
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Log Achievement (employee & approved) */}
        {isOwner && goal.status === "APPROVED" && (
          <>
            <Separator style={{ margin: "1.25rem 0", background: "rgba(99,102,241,0.1)" }} />
            <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#94a3b8", marginBottom: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <ClipboardList size={14} /> Log Achievement
            </div>
            <form onSubmit={submitAchievement}>
              <div className="form-grid" style={{ marginBottom: "0.875rem" }}>
                <div className="form-group">
                  <label className="label">Quarter</label>
                  <Select value={achForm.quarter} onValueChange={v => setAchForm(f => ({ ...f, quarter: v ?? "1" }))}>
                    <SelectTrigger className="input" style={{ height: "auto" }}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Q1 (July)</SelectItem>
                      <SelectItem value="2">Q2 (October)</SelectItem>
                      <SelectItem value="3">Q3 (January)</SelectItem>
                      <SelectItem value="4">Q4 (Mar/Apr)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="form-group">
                  <label className="label">Actual Value</label>
                  <Input type="number" className="input" placeholder="Enter actual…" value={achForm.actual} onChange={e => setAchForm(f => ({ ...f, actual: e.target.value }))} required min="0" />
                </div>
                <div className="form-group">
                  <label className="label">Status</label>
                  <Select value={achForm.status} onValueChange={v => setAchForm(f => ({ ...f, status: v ?? "ON_TRACK" }))}>
                    <SelectTrigger className="input" style={{ height: "auto" }}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                      <SelectItem value="ON_TRACK">On Track</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {goal.uomType === "TIMELINE" && (
                  <div className="form-group">
                    <label className="label">Actual Completion Date</label>
                    <Input type="date" className="input" value={achForm.actualDate} onChange={e => setAchForm(f => ({ ...f, actualDate: e.target.value }))} />
                  </div>
                )}
              </div>
              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Saving…</> : <><CheckCircle2 size={14} /> Save Achievement</>}
              </button>
            </form>
          </>
        )}
      </div>

      {/* Audit Trail */}
      {goal.auditLogs.length > 0 && (
        <div className="card">
          <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "1rem" }}>Audit Trail</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {goal.auditLogs.map((log, i) => (
              <div key={log.id} style={{ display: "flex", gap: "0.875rem", alignItems: "flex-start", padding: "0.625rem 0", borderBottom: i < goal.auditLogs.length - 1 ? "1px solid rgba(99,102,241,0.07)" : "none" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: AUDIT_COLORS[log.action] ?? "#475569", marginTop: "0.4rem", flexShrink: 0, boxShadow: `0 0 6px ${AUDIT_COLORS[log.action] ?? "#475569"}60` }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: AUDIT_COLORS[log.action] ?? "#475569" }}>{log.action}</span>
                    <span style={{ fontSize: "0.78rem", color: "#475569" }}>by <strong style={{ color: "#94a3b8" }}>{log.user.name}</strong></span>
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "#334155", marginTop: "0.1rem" }}>{new Date(log.createdAt).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
