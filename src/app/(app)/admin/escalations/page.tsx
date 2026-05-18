"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, MessageSquarePlus, X } from "lucide-react";

type Dispatch = {
  id: string;
  channel: string;
  deliveryStatus: string;
  message: string;
  createdAt: string;
};

type EventItem = {
  id: string;
  ruleType: string;
  status: string;
  cycleYear: number;
  level: number;
  firstTriggeredAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  resolutionComment: string | null;
  user: { id: string; name: string; email: string };
  goal: { id: string; title: string } | null;
  dispatches: Dispatch[];
};

type Rule = {
  id: string;
  type: string;
  enabled: boolean;
  thresholdDays: number;
};

const RULE_LABELS: Record<string, string> = {
  GOAL_NOT_SUBMITTED: "Goal Not Submitted",
  GOAL_PENDING_APPROVAL: "Goal Pending Approval",
  CHECKIN_NOT_COMPLETED: "Check-in Not Completed",
};

export default function EscalationsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [status, setStatus] = useState("OPEN");
  const [ruleType, setRuleType] = useState("ALL");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionComment, setResolutionComment] = useState("");
  const [resolving, setResolving] = useState(false);

  async function loadEvents() {
    setLoading(true);
    const params = new URLSearchParams({ status, ruleType, q });
    const res = await fetch(`/api/admin/escalations?${params.toString()}`);
    const data = await res.json();
    setEvents(data.events ?? []);
    setLoading(false);
  }

  async function loadRules() {
    const res = await fetch("/api/admin/escalation-rules");
    const data = await res.json();
    setRules(data.rules ?? []);
  }

  useEffect(() => {
    void loadEvents();
  }, [status, ruleType]);

  useEffect(() => {
    void loadRules();
  }, []);

  async function runEvaluation() {
    setLoading(true);
    await fetch("/api/admin/escalations", { method: "POST" });
    await loadEvents();
    setLoading(false);
  }

  async function saveRules() {
    await fetch("/api/admin/escalation-rules", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rules }),
    });
    await loadRules();
  }

  async function resolve(id: string) {
    if (!resolutionComment.trim()) return;
    setResolving(true);
    await fetch(`/api/admin/escalations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "RESOLVED", resolutionComment: resolutionComment.trim() }),
    });
    setResolving(false);
    setResolvingId(null);
    setResolutionComment("");
    await loadEvents();
  }

  const filteredEvents = useMemo(() => {
    if (!q) return events;
    const k = q.toLowerCase();
    return events.filter((e) => e.user.name.toLowerCase().includes(k) || e.user.email.toLowerCase().includes(k) || e.goal?.title.toLowerCase().includes(k));
  }, [events, q]);

  return (
    <div style={{ maxWidth: 1280 }}>
      <h1 className="page-title">Escalation Center</h1>
      <p className="page-subtitle">Rule-based escalation tracking with resolution visibility.</p>

      <div className="card" style={{ display: "grid", gridTemplateColumns: "2fr 1fr auto auto auto", gap: "0.75rem", alignItems: "center", marginBottom: "1rem" }}>
        <input className="input" placeholder="Search employee/goal" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="OPEN">Open</option>
          <option value="RESOLVED">Resolved</option>
          <option value="ALL">All</option>
        </select>
        <select className="select" value={ruleType} onChange={(e) => setRuleType(e.target.value)}>
          <option value="ALL">All Rules</option>
          <option value="GOAL_NOT_SUBMITTED">Goal Not Submitted</option>
          <option value="GOAL_PENDING_APPROVAL">Goal Pending Approval</option>
          <option value="CHECKIN_NOT_COMPLETED">Check-in Not Completed</option>
        </select>
        <button className="btn-secondary" onClick={() => void loadEvents()}>Search</button>
        <button className="btn-primary" onClick={runEvaluation} disabled={loading}>{loading ? "Running..." : "Run Escalation Check"}</button>
      </div>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <div style={{ fontWeight: 700, color: "#e2e8f0" }}>Rule Configuration</div>
          <button className="btn-secondary" onClick={saveRules}>Save Rules</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: "0.75rem" }}>
          {rules.map((rule, idx) => (
            <div className="card" key={rule.id}>
              <div style={{ fontWeight: 700, color: "#cbd5e1", marginBottom: "0.5rem" }}>{RULE_LABELS[rule.type] ?? rule.type}</div>
              <label style={{ display: "flex", gap: "0.4rem", alignItems: "center", marginBottom: "0.5rem", fontSize: "0.85rem", color: "#94a3b8" }}>
                <input type="checkbox" checked={rule.enabled} onChange={(e) => setRules((prev) => prev.map((p, i) => i === idx ? { ...p, enabled: e.target.checked } : p))} />
                Enabled
              </label>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <span style={{ color: "#64748b", fontSize: "0.8rem" }}>Threshold (days)</span>
                <input className="input" style={{ maxWidth: 90 }} type="number" min={1} value={rule.thresholdDays} onChange={(e) => setRules((prev) => prev.map((p, i) => i === idx ? { ...p, thresholdDays: Number(e.target.value) || 1 } : p))} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Rule</th>
              <th>Goal</th>
              <th>Level</th>
              <th>Status</th>
              <th>Time To Resolution</th>
              <th>Last Notification</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredEvents.map((event) => {
              const resolvedMs = event.resolvedAt ? new Date(event.resolvedAt).getTime() - new Date(event.firstTriggeredAt).getTime() : null;
              const days = resolvedMs ? Math.round((resolvedMs / (1000 * 60 * 60 * 24)) * 10) / 10 : "-";
              const latestDispatch = event.dispatches[0];
              return (
                <tr key={event.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: "#e2e8f0" }}>{event.user.name}</div>
                    <div style={{ fontSize: "0.72rem", color: "#64748b" }}>{event.user.email}</div>
                  </td>
                  <td>{RULE_LABELS[event.ruleType] ?? event.ruleType}</td>
                  <td>{event.goal?.title ?? "-"}</td>
                  <td>L{event.level}</td>
                  <td>
                    <span style={{ color: event.status === "OPEN" ? "#fbbf24" : "#34d399", fontWeight: 700 }}>{event.status}</span>
                  </td>
                  <td>{days === "-" ? "-" : `${days} days`}</td>
                  <td>
                    {latestDispatch ? (
                      <div>
                        <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>{latestDispatch.channel}: {latestDispatch.deliveryStatus}</div>
                        <div style={{ fontSize: "0.68rem", color: "#64748b" }}>{new Date(latestDispatch.createdAt).toLocaleString()}</div>
                      </div>
                    ) : "-"}
                  </td>
                  <td>
                    {event.status === "OPEN" ? (
                      resolvingId === event.id ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", minWidth: 220 }}>
                          <textarea
                            className="input"
                            rows={2}
                            placeholder="Enter resolution comment"
                            value={resolutionComment}
                            onChange={(e) => setResolutionComment(e.target.value)}
                          />
                          <div style={{ display: "flex", gap: "0.4rem" }}>
                            <button className="btn-success" disabled={resolving || !resolutionComment.trim()} onClick={() => void resolve(event.id)}>
                              {resolving ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <CheckCircle2 size={13} />} Confirm
                            </button>
                            <button className="btn-secondary" onClick={() => { setResolvingId(null); setResolutionComment(""); }}>
                              <X size={13} /> Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button className="btn-success" onClick={() => setResolvingId(event.id)}>
                          <MessageSquarePlus size={13} /> Resolve
                        </button>
                      )
                    ) : "Resolved"}
                  </td>
                </tr>
              );
            })}
            {!filteredEvents.length && (
              <tr><td colSpan={8} style={{ textAlign: "center", color: "#64748b", padding: "1.25rem" }}>{loading ? "Loading..." : "No escalation records found."}</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

