"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList, User, Target, Scale, TrendingUp,
  MessageSquare, CheckCircle2, Loader2, AlertTriangle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

interface CheckIn { id: string; comment: string; createdAt: string; manager: { name: string } }
interface Achievement { id: string; quarter: number; actual: number; status: string; score: number; checkIns: CheckIn[] }
interface Goal {
  id: string; title: string; thrustArea: string; uomType: string;
  target: number; weightage: number;
  owner?: { name: string };
  achievements: Achievement[];
}

const Q_LABELS = ["", "Q1 (July)", "Q2 (October)", "Q3 (January)", "Q4 (Mar/Apr)"];
const STATUS_COLORS: Record<string, string> = { NOT_STARTED: "#94a3b8", ON_TRACK: "#60a5fa", COMPLETED: "#34d399" };
const STATUS_BG: Record<string, string> = { NOT_STARTED: "rgba(148,163,184,0.1)", ON_TRACK: "rgba(96,165,250,0.1)", COMPLETED: "rgba(52,211,153,0.1)" };

type WindowItem = { quarter: number; label: string; start: string; end: string };

export default function CheckinClient({
  goals, role, cycleYear, windows, activeQuarter,
}: {
  goals: Goal[];
  role: string;
  cycleYear: number;
  windows: WindowItem[];
  activeQuarter: number | null;
}) {
  const router = useRouter();
  const isManager = role === "MANAGER" || role === "ADMIN";

  const [selectedGoal, setSelectedGoal] = useState<string>(goals[0]?.id ?? "");
  const [achForm, setAchForm] = useState({ quarter: String(activeQuarter ?? 1), actual: "", status: "ON_TRACK" });
  const [checkinComment, setCheckinComment] = useState("");
  const [selectedAch, setSelectedAch] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const goal = goals.find(g => g.id === selectedGoal);

  const showMsg = (text: string, ok: boolean) => { setMsg({ text, ok }); setTimeout(() => setMsg(null), 4000); };

  async function logAchievement(e: React.FormEvent) {
    e.preventDefault();
    if (!goal) return;
    setLoading(true);
    const res = await fetch("/api/achievements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goalId: goal.id, quarter: Number(achForm.quarter), actual: Number(achForm.actual), status: achForm.status }),
    });
    setLoading(false);
    if (res.ok) { showMsg("Achievement logged successfully!", true); router.refresh(); }
    else {
      const data = await res.json().catch(() => ({}));
      showMsg(data.error ?? "Error logging achievement", false);
    }
  }

  async function addCheckin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/checkins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ achievementId: selectedAch, comment: checkinComment }),
    });
    setLoading(false);
    if (res.ok) { showMsg("Check-in comment saved!", true); setCheckinComment(""); setSelectedAch(""); router.refresh(); }
    else {
      const data = await res.json().catch(() => ({}));
      showMsg(data.error ?? "Error saving check-in", false);
    }
  }

  return (
    <div className="fade-in" style={{ maxWidth: 1000 }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
          <ClipboardList size={16} color="#6366f1" />
          <span style={{ fontSize: "0.8rem", color: "#6366f1", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>Progress Tracking</span>
        </div>
        <h1 className="page-title">Quarterly Check-ins</h1>
        <p className="page-subtitle" style={{ marginBottom: 0 }}>Track and update goal progress for each quarter.</p>
      </div>
      <div className="card" style={{ marginBottom: "1rem" }}>
        <div style={{ color: "#94a3b8", fontSize: "0.82rem" }}>Cycle FY {cycleYear}</div>
        <div style={{ color: activeQuarter ? "#34d399" : "#fbbf24", fontWeight: 700, marginTop: "0.2rem" }}>
          {activeQuarter ? `Active Check-in Window: Q${activeQuarter}` : "No active check-in window today"}
        </div>
        <div style={{ marginTop: "0.75rem", display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: "0.5rem" }}>
          {windows.map((w) => {
            const isActive = activeQuarter === w.quarter;
            return (
              <div key={w.quarter} style={{ borderRadius: "0.6rem", border: `1px solid ${isActive ? "rgba(52,211,153,0.4)" : "rgba(99,102,241,0.15)"}`, background: isActive ? "rgba(52,211,153,0.12)" : "rgba(30,41,59,0.35)", padding: "0.55rem" }}>
                <div style={{ fontWeight: 700, fontSize: "0.75rem", color: isActive ? "#34d399" : "#94a3b8" }}>{w.label}</div>
                <div style={{ color: "#64748b", fontSize: "0.7rem", marginTop: "0.2rem" }}>
                  {new Date(w.start).toLocaleDateString()} - {new Date(w.end).toLocaleDateString()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {msg && (
        <div style={{
          display: "flex", alignItems: "center", gap: "0.625rem",
          background: msg.ok ? "rgba(52,211,153,0.08)" : "rgba(239,68,68,0.08)",
          border: `1px solid ${msg.ok ? "rgba(52,211,153,0.25)" : "rgba(239,68,68,0.25)"}`,
          borderRadius: "0.75rem", padding: "0.875rem 1rem", marginBottom: "1.25rem",
          fontSize: "0.875rem", color: msg.ok ? "#34d399" : "#f87171",
        }}>
          {msg.ok ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />} {msg.text}
        </div>
      )}

      {goals.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "4rem 2rem" }}>
          <div className="float" style={{ display: "inline-flex", padding: "1.25rem", borderRadius: "50%", background: "rgba(99,102,241,0.1)", marginBottom: "1.25rem" }}>
            <ClipboardList size={40} color="#6366f1" />
          </div>
          <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "#e2e8f0", marginBottom: "0.5rem" }}>No approved goals yet</div>
          <div style={{ color: "#64748b", fontSize: "0.875rem" }}>Goals must be approved before logging achievements.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: "1.5rem", alignItems: "start" }}>
          {/* Goal Selector */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ fontSize: "0.7rem", color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.25rem", paddingLeft: "0.25rem" }}>
              Select Goal ({goals.length})
            </div>
            {goals.map(g => (
              <div
                key={g.id}
                onClick={() => setSelectedGoal(g.id)}
                style={{
                  background: selectedGoal === g.id
                    ? "linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.1))"
                    : "rgba(13,21,38,0.7)",
                  border: `1px solid ${selectedGoal === g.id ? "rgba(99,102,241,0.4)" : "rgba(99,102,241,0.1)"}`,
                  borderRadius: "0.75rem", padding: "0.875rem", cursor: "pointer",
                  transition: "all 0.15s",
                  boxShadow: selectedGoal === g.id ? "0 4px 15px rgba(99,102,241,0.15)" : "none",
                }}
              >
                <div style={{ fontWeight: 600, fontSize: "0.84rem", color: selectedGoal === g.id ? "#a5b4fc" : "#94a3b8", marginBottom: "0.25rem" }}>{g.title}</div>
                {g.owner && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.72rem", color: "#475569", marginBottom: "0.2rem" }}>
                    <User size={10} /> {g.owner.name}
                  </div>
                )}
                <div style={{ fontSize: "0.7rem", color: "#334155" }}>
                  {g.achievements.length} quarter{g.achievements.length !== 1 ? "s" : ""} logged
                </div>
              </div>
            ))}
          </div>

          {/* Detail Panel */}
          {goal && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Goal Summary */}
              <div className="card">
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.875rem" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "1rem", color: "#f1f5f9", marginBottom: "0.25rem" }}>{goal.title}</div>
                    <div style={{ display: "flex", gap: "1rem", fontSize: "0.78rem", color: "#64748b" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}><Target size={11} /> {goal.thrustArea}</span>
                      <span>Target: <strong style={{ color: "#94a3b8" }}>{goal.target}</strong></span>
                      <span><Scale size={11} style={{ display: "inline" }} /> {goal.weightage}%</span>
                    </div>
                  </div>
                </div>

                {/* Achievement History */}
                {goal.achievements.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: goal.achievements.length > 0 && !isManager ? "1.25rem" : "0" }}>
                    {[...goal.achievements].sort((a,b) => a.quarter - b.quarter).map(ach => (
                      <div key={ach.id} style={{
                        background: STATUS_BG[ach.status] ?? "rgba(30,41,59,0.5)",
                        border: `1px solid ${STATUS_COLORS[ach.status] ?? "#94a3b8"}30`,
                        borderRadius: "0.75rem", padding: "0.875rem",
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem", alignItems: "center" }}>
                          <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "#e2e8f0" }}>{Q_LABELS[ach.quarter]}</span>
                          <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.78rem", alignItems: "center" }}>
                            <span style={{ color: STATUS_COLORS[ach.status] ?? "#94a3b8", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                              <span style={{ width: 7, height: 7, borderRadius: "50%", background: STATUS_COLORS[ach.status] ?? "#94a3b8", display: "inline-block" }} />
                              {ach.status.replace("_", " ")}
                            </span>
                            <span style={{ color: "#818cf8", fontWeight: 800 }}>{ach.score.toFixed(1)}%</span>
                          </div>
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "0.5rem" }}>
                          Actual: <strong style={{ color: "#e2e8f0" }}>{ach.actual}</strong> / {goal.target}
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${Math.min(ach.score, 100)}%`, background: `linear-gradient(90deg,${STATUS_COLORS[ach.status]}80,${STATUS_COLORS[ach.status]})` }} />
                        </div>
                        {ach.checkIns.map(c => (
                          <div key={c.id} style={{ marginTop: "0.5rem", display: "flex", gap: "0.4rem", fontSize: "0.75rem", color: "#64748b", fontStyle: "italic" }}>
                            <MessageSquare size={11} color="#6366f1" style={{ flexShrink: 0, marginTop: 2 }} />
                            <span><strong style={{ color: "#94a3b8", fontStyle: "normal" }}>{c.manager.name}:</strong> "{c.comment}"</span>
                          </div>
                        ))}
                        {isManager && (
                          <button className="btn-secondary" style={{ fontSize: "0.72rem", padding: "0.25rem 0.625rem", marginTop: "0.5rem" }} onClick={() => setSelectedAch(ach.id)}>
                            <MessageSquare size={11} /> Add Comment
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Log Achievement (employee) */}
                {!isManager && (
                  <>
                    {goal.achievements.length > 0 && <Separator style={{ margin: "1rem 0", background: "rgba(99,102,241,0.1)" }} />}
                    <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#94a3b8", marginBottom: "0.875rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <TrendingUp size={13} /> Log New Achievement
                    </div>
                    <form onSubmit={logAchievement}>
                      <div className="form-grid" style={{ marginBottom: "0.875rem" }}>
                        <div className="form-group">
                          <label className="label">Quarter</label>
                          <Select value={achForm.quarter} onValueChange={v => setAchForm(f => ({ ...f, quarter: v ?? "1" }))}>
                            <SelectTrigger className="input" style={{ height: "auto" }}><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1" disabled={activeQuarter !== 1}>Q1 (July)</SelectItem>
                              <SelectItem value="2" disabled={activeQuarter !== 2}>Q2 (October)</SelectItem>
                              <SelectItem value="3" disabled={activeQuarter !== 3}>Q3 (January)</SelectItem>
                              <SelectItem value="4" disabled={activeQuarter !== 4}>Q4 (Mar/Apr)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="form-group">
                          <label className="label">Actual Value</label>
                          <Input type="number" className="input" placeholder="Enter actual…" value={achForm.actual} onChange={e => setAchForm(f => ({ ...f, actual: e.target.value }))} required min="0" />
                        </div>
                        <div className="form-group full">
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
                      </div>
                      <button className="btn-primary" type="submit" disabled={loading || !activeQuarter || Number(achForm.quarter) !== activeQuarter}>
                        {loading ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Saving…</> : <><CheckCircle2 size={14} /> Log Achievement</>}
                      </button>
                    </form>
                  </>
                )}

                {/* Manager Check-in Comment */}
                {isManager && selectedAch && (
                  <>
                    <Separator style={{ margin: "1rem 0", background: "rgba(99,102,241,0.1)" }} />
                    <form onSubmit={addCheckin}>
                      <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#94a3b8", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <MessageSquare size={13} /> Add Check-in Comment
                      </div>
                      <Textarea className="input" placeholder="Document your discussion…" value={checkinComment} onChange={e => setCheckinComment(e.target.value)} rows={3} style={{ resize: "vertical", marginBottom: "0.75rem" }} required />
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button className="btn-primary" type="submit" disabled={loading}>{loading ? "Saving…" : "Save Comment"}</button>
                        <button className="btn-secondary" type="button" onClick={() => { setSelectedAch(""); setCheckinComment(""); }}>Cancel</button>
                      </div>
                    </form>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
