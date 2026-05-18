"use client";

import { useEffect, useMemo, useState } from "react";

type SourceGoal = { id: string; title: string; target: number; weightage: number; owner: { name: string } };
type Recipient = { id: string; name: string; email: string };

export default function SharedGoalsPage() {
  const [sourceGoals, setSourceGoals] = useState<SourceGoal[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [goalId, setGoalId] = useState("");
  const [selectedRecipients, setSelectedRecipients] = useState<Record<string, boolean>>({});
  const [weights, setWeights] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string>("");

  const selectedGoal = useMemo(() => sourceGoals.find((g) => g.id === goalId), [goalId, sourceGoals]);

  async function load() {
    const res = await fetch("/api/shared-goals");
    if (!res.ok) return;
    const data = await res.json();
    setSourceGoals(data.sourceGoals ?? []);
    setRecipients(data.recipients ?? []);
    const first = data.sourceGoals?.[0];
    if (first) setGoalId(first.id);
  }

  useEffect(() => { void load(); }, []);

  async function pushShared() {
    const recipientIds = Object.entries(selectedRecipients).filter(([, v]) => v).map(([id]) => id);
    if (!goalId || recipientIds.length === 0) {
      setMsg("Select a source goal and at least one recipient.");
      return;
    }
    const weightageByRecipient: Record<string, number> = {};
    for (const id of recipientIds) {
      const base = Number(weights[id] || selectedGoal?.weightage || 10);
      weightageByRecipient[id] = base;
    }

    const res = await fetch("/api/shared-goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goalId, recipientIds, weightageByRecipient }),
    });
    const data = await res.json().catch(() => ({}));
    setMsg(res.ok ? "Shared goals pushed successfully." : (data.error ?? "Failed to push shared goals."));
  }

  return (
    <div style={{ maxWidth: 980 }}>
      <h1 className="page-title">Push Shared Goals</h1>
      <p className="page-subtitle">Push one KPI to multiple employees. Recipients can adjust only weightage.</p>
      {msg && <div className="card" style={{ marginBottom: "1rem", color: "#94a3b8" }}>{msg}</div>}

      <div className="card" style={{ marginBottom: "1rem" }}>
        <div style={{ marginBottom: "0.5rem", color: "#94a3b8", fontSize: "0.8rem" }}>Source Goal</div>
        <select className="input" value={goalId} onChange={(e) => setGoalId(e.target.value)}>
          {sourceGoals.map((g) => (
            <option key={g.id} value={g.id}>{g.title} (Owner: {g.owner.name}, Target: {g.target}, Default Weight: {g.weightage}%)</option>
          ))}
        </select>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Select</th>
              <th>Employee</th>
              <th>Email</th>
              <th>Weightage %</th>
            </tr>
          </thead>
          <tbody>
            {recipients.map((r) => (
              <tr key={r.id}>
                <td><input type="checkbox" checked={Boolean(selectedRecipients[r.id])} onChange={(e) => setSelectedRecipients((p) => ({ ...p, [r.id]: e.target.checked }))} /></td>
                <td>{r.name}</td>
                <td>{r.email}</td>
                <td>
                  <input
                    className="input"
                    type="number"
                    min={10}
                    value={weights[r.id] ?? String(selectedGoal?.weightage ?? 10)}
                    onChange={(e) => setWeights((p) => ({ ...p, [r.id]: e.target.value }))}
                    style={{ width: 110 }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: "1rem" }}>
        <button className="btn-primary" onClick={pushShared}>Push Shared Goal</button>
      </div>
    </div>
  );
}

