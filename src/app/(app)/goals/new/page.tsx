"use client";
import { useState } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp, TrendingDown, Calendar, Shield, Target,
  AlertTriangle, CheckCircle2, Loader2, ArrowLeft, Sparkles, ShieldCheck,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { THRUST_AREAS } from "@/lib/utils";

const UOM_TYPES = [
  { value: "MIN",      label: "Maximize",   desc: "Higher actual = better (e.g. Sales Revenue)", Icon: TrendingUp,   color: "#818cf8" },
  { value: "MAX",      label: "Minimize",   desc: "Lower actual = better (e.g. TAT, Defect rate)", Icon: TrendingDown, color: "#34d399" },
  { value: "TIMELINE", label: "Timeline",   desc: "Date-based completion target", Icon: Calendar,     color: "#fbbf24" },
  { value: "ZERO",     label: "Zero-based", desc: "Zero = perfect (e.g. Safety incidents)", Icon: Shield,       color: "#f87171" },
];

export default function NewGoalPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    thrustArea: "", title: "", description: "", uomType: "MIN",
    target: "", targetDate: "", weightage: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cycleYear, setCycleYear] = useState<number | null>(null);
  const [currentTotalWeightage, setCurrentTotalWeightage] = useState(0);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [qualityFeedback, setQualityFeedback] = useState("");

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/cycle");
      if (!res.ok) return;
      const data = await res.json();
      setCycleYear(data.year);
      const goalsRes = await fetch("/api/goals");
      if (goalsRes.ok) {
        const goals = (await goalsRes.json()) as Array<{ weightage: number }>;
        const total = goals.reduce((sum, g) => sum + Number(g.weightage || 0), 0);
        setCurrentTotalWeightage(total);
      }
    })();
  }, []);

  const enteredWeight = Number(form.weightage || 0);
  const projectedTotal = currentTotalWeightage + enteredWeight;
  const remainingAfterThis = 100 - projectedTotal;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (Number(form.weightage) < 10) { setError("Minimum weightage is 10%"); return; }
    if (projectedTotal > 100) { setError(`You currently have ${currentTotalWeightage}%. This goal makes it ${projectedTotal}%. Reduce by ${projectedTotal - 100}%.`); return; }
    setLoading(true);
    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, target: Number(form.target), weightage: Number(form.weightage) }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Failed to create goal"); return; }
    router.push("/goals");
  }

  async function fetchAiSuggestion() {
    if (!form.thrustArea) {
      setError("Choose a thrust area before generating AI goal suggestion.");
      return;
    }
    setError("");
    setAiLoading(true);
    try {
      const prompt = `Generate one high-quality SMART goal for AtomQuest.
Return markdown with these headings only:
Title
Description
Target recommendation
Weightage recommendation

Context:
Thrust Area: ${form.thrustArea}
UOM: ${form.uomType}
Cycle Year: ${cycleYear ?? new Date().getFullYear()}
Current allocated weightage: ${currentTotalWeightage}%`;
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
      });
      const text = await res.text();
      if (!res.ok) {
        setError("Could not generate AI goal suggestion right now.");
        return;
      }
      setAiSuggestion(text.trim());
    } finally {
      setAiLoading(false);
    }
  }

  async function runQualityCheck() {
    if (!form.title.trim()) {
      setError("Enter a goal title before running quality check.");
      return;
    }
    setError("");
    setAiLoading(true);
    try {
      const prompt = `Review this AtomQuest goal for SMART quality.
Score each item out of 5: Specific, Measurable, Achievable, Relevant, Time-bound.
Then provide:
1) Overall score out of 25
2) Top 3 improvements
3) Rewritten better version

Goal details:
Title: ${form.title}
Description: ${form.description || "N/A"}
Thrust Area: ${form.thrustArea || "N/A"}
UOM: ${form.uomType}
Target: ${form.target || "N/A"}
Target Date: ${form.targetDate || "N/A"}
Weightage: ${form.weightage || "N/A"}%`;
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
      });
      const text = await res.text();
      if (!res.ok) {
        setError("Could not run goal quality check right now.");
        return;
      }
      setQualityFeedback(text.trim());
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="fade-in" style={{ maxWidth: 700 }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <button onClick={() => router.back()} className="btn-secondary" style={{ fontSize: "0.78rem", padding: "0.35rem 0.75rem", marginBottom: "1.25rem" }}>
          <ArrowLeft size={13} /> Back
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
          <Target size={16} color="#6366f1" />
          <span style={{ fontSize: "0.8rem", color: "#6366f1", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>FY {cycleYear ?? new Date().getFullYear()}</span>
        </div>
        <h1 className="page-title">Create New Goal</h1>
        <p className="page-subtitle" style={{ marginBottom: 0 }}>Add a goal to your performance sheet. Minimum 10% weightage required.</p>
      </div>

      {error && (
        <div style={{
          display: "flex", alignItems: "center", gap: "0.625rem",
          background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
          borderRadius: "0.75rem", padding: "0.875rem 1rem", marginBottom: "1.5rem",
          fontSize: "0.875rem", color: "#f87171",
        }}>
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card" style={{ display: "flex", flexDirection: "column", gap: "1.375rem" }}>
        <div style={{ background: "rgba(30,41,59,0.45)", border: "1px solid rgba(99,102,241,0.18)", borderRadius: "0.75rem", padding: "0.875rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", marginBottom: "0.4rem" }}>
            <span style={{ color: "#94a3b8" }}>Weightage Progress</span>
            <span style={{ color: projectedTotal <= 100 ? "#34d399" : "#f87171", fontWeight: 700 }}>{projectedTotal}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${Math.min(projectedTotal, 100)}%`, background: projectedTotal <= 100 ? "linear-gradient(90deg,#6366f1,#8b5cf6)" : "linear-gradient(90deg,#ef4444,#f87171)" }} />
          </div>
          <div style={{ marginTop: "0.45rem", fontSize: "0.75rem", color: remainingAfterThis === 0 ? "#34d399" : remainingAfterThis > 0 ? "#fbbf24" : "#f87171" }}>
            {remainingAfterThis > 0 && `You currently have ${currentTotalWeightage}%. Add ${remainingAfterThis}% more after this goal.`}
            {remainingAfterThis === 0 && "Perfect 100%. This goal setup is submission-ready."}
            {remainingAfterThis < 0 && `This exceeds 100% by ${Math.abs(remainingAfterThis)}%.`}
          </div>
        </div>

        {/* Thrust Area */}
        <div className="form-group">
          <Label className="label">Thrust Area *</Label>
          <Select value={form.thrustArea} onValueChange={v => set("thrustArea", v ?? "")} required>
            <SelectTrigger className="input" style={{ height: "auto" }}>
              <SelectValue placeholder="Select thrust area…" />
            </SelectTrigger>
            <SelectContent>
              {THRUST_AREAS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Title */}
        <div className="form-group">
          <Label className="label">Goal Title *</Label>
          <Input
            className="input"
            placeholder="e.g. Increase Sales Revenue by 20%"
            value={form.title}
            onChange={e => set("title", e.target.value)}
            required
          />
        </div>

        {/* Description */}
        <div className="form-group">
          <Label className="label">Description</Label>
          <Textarea
            className="input"
            placeholder="Describe how this goal will be measured and achieved…"
            value={form.description}
            onChange={e => set("description", e.target.value)}
            rows={3}
            style={{ resize: "vertical" }}
          />
        </div>

        {/* UoM Type */}
        <div>
          <Label className="label">Unit of Measurement (UoM) *</Label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginTop: "0.5rem" }}>
            {UOM_TYPES.map(u => (
              <div
                key={u.value}
                onClick={() => set("uomType", u.value)}
                style={{
                  border: `2px solid ${form.uomType === u.value ? u.color : "rgba(99,102,241,0.15)"}`,
                  borderRadius: "0.75rem", padding: "0.875rem", cursor: "pointer",
                  background: form.uomType === u.value ? `${u.color}10` : "rgba(30,41,59,0.5)",
                  transition: "all 0.18s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
                  <div style={{ padding: "0.3rem", borderRadius: "0.375rem", background: `${u.color}15` }}>
                    <u.Icon size={14} color={u.color} />
                  </div>
                  <span style={{ fontWeight: 700, fontSize: "0.84rem", color: form.uomType === u.value ? u.color : "#94a3b8" }}>{u.label}</span>
                </div>
                <div style={{ fontSize: "0.72rem", color: "#475569", lineHeight: 1.4 }}>{u.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Target + Weightage */}
        <div className="form-grid">
          <div className="form-group">
            <Label className="label">
              {form.uomType === "TIMELINE" ? "Target Date *" : form.uomType === "ZERO" ? "Allowed Count" : "Target Value *"}
            </Label>
            {form.uomType === "TIMELINE" ? (
              <Input type="date" className="input" value={form.targetDate} onChange={e => { set("targetDate", e.target.value); set("target", "1"); }} required />
            ) : (
              <Input type="number" className="input" placeholder={form.uomType === "ZERO" ? "0" : "Enter target value…"} value={form.target} onChange={e => set("target", e.target.value)} min="0" required />
            )}
          </div>
          <div className="form-group">
            <Label className="label">Weightage (%) *</Label>
            <Input type="number" className="input" placeholder="Min 10%" value={form.weightage} onChange={e => set("weightage", e.target.value)} min="10" max="100" required />
            <div style={{ fontSize: "0.7rem", color: "#475569", marginTop: "0.25rem" }}>Must be between 10–100%, total across all goals = 100%</div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "0.75rem", paddingTop: "0.25rem", borderTop: "1px solid rgba(99,102,241,0.1)" }}>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Saving…</> : <><CheckCircle2 size={15} /> Save Goal</>}
          </button>
          <button type="button" className="btn-secondary" onClick={() => router.push("/goals")}>Cancel</button>
        </div>
      </form>

      <div className="card" style={{ marginTop: "1rem" }}>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
          <button type="button" className="btn-secondary" onClick={fetchAiSuggestion} disabled={aiLoading}>
            {aiLoading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Sparkles size={14} />} AI Goal Suggestion
          </button>
          <button type="button" className="btn-secondary" onClick={runQualityCheck} disabled={aiLoading}>
            {aiLoading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <ShieldCheck size={14} />} Goal Quality Check
          </button>
        </div>

        {aiSuggestion && (
          <div style={{ marginBottom: "0.75rem", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "0.625rem", padding: "0.75rem", background: "rgba(30,41,59,0.45)" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#818cf8", marginBottom: "0.35rem" }}>AI Goal Suggestion</div>
            <pre style={{ margin: 0, whiteSpace: "pre-wrap", color: "#cbd5e1", fontSize: "0.8rem", fontFamily: "inherit" }}>{aiSuggestion}</pre>
          </div>
        )}

        {qualityFeedback && (
          <div style={{ border: "1px solid rgba(52,211,153,0.2)", borderRadius: "0.625rem", padding: "0.75rem", background: "rgba(6,78,59,0.18)" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#34d399", marginBottom: "0.35rem" }}>Goal Quality Checker</div>
            <pre style={{ margin: 0, whiteSpace: "pre-wrap", color: "#cbd5e1", fontSize: "0.8rem", fontFamily: "inherit" }}>{qualityFeedback}</pre>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
