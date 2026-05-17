"use client";
import { useEffect, useState } from "react";

type Goal = {
  id: string;
  title: string;
  status: string;
  owner: { name: string; email: string };
};

type RecentUnlock = {
  id: string;
  previousStatus: string;
  reason: string;
  createdAt: string;
  goal: { id: string; title: string; owner: { name: string; email: string } };
  unlockedBy: { name: string; email: string };
};

export default function UnlockGoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [recentUnlocks, setRecentUnlocks] = useState<RecentUnlock[]>([]);
  const [reason, setReason] = useState("");
  const [loadingId, setLoadingId] = useState("");

  async function load() {
    const res = await fetch("/api/admin/unlocks");
    if (!res.ok) return;
    const data = await res.json();
    setGoals(data.goals);
    setRecentUnlocks(data.recentUnlocks ?? []);
  }
  useEffect(() => { void load(); }, []);

  async function unlock(goalId: string) {
    setLoadingId(goalId);
    await fetch("/api/admin/unlocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goalId, reason }),
    });
    setLoadingId("");
    await load();
  }

  return (
    <div style={{ maxWidth: 1000 }}>
      <h1 className="page-title">Unlock Goals</h1>
      <p className="page-subtitle">Move submitted/approved goals back to draft for exception handling.</p>
      <div className="card" style={{ marginBottom: "1rem" }}>
        <label className="label">Reason (applies to unlock action)</label>
        <input className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for unlock..." />
      </div>
      <div className="table-wrapper">
        <table>
          <thead><tr><th>Goal</th><th>Owner</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {goals.map((g) => (
              <tr key={g.id}>
                <td>{g.title}</td>
                <td>{g.owner.name}</td>
                <td>{g.status}</td>
                <td><button className="btn-primary" disabled={loadingId === g.id} onClick={() => unlock(g.id)}>{loadingId === g.id ? "Unlocking..." : "Unlock to Draft"}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: "1.5rem" }}>
        <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.75rem" }}>
          Recent Unlock History
        </div>
        {recentUnlocks.length === 0 ? (
          <div className="card" style={{ padding: "1.25rem" }}>
            <div style={{ color: "#64748b", fontSize: "0.85rem" }}>No unlock events yet.</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Goal</th><th>Owner</th><th>Unlocked By</th><th>From</th><th>Reason</th><th>Time</th></tr></thead>
              <tbody>
                {recentUnlocks.map((e) => (
                  <tr key={e.id}>
                    <td style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.goal.title}</td>
                    <td style={{ color: "#94a3b8" }}>{e.goal.owner.name}</td>
                    <td style={{ color: "#94a3b8" }}>{e.unlockedBy.name}</td>
                    <td style={{ color: "#fbbf24", fontWeight: 700 }}>{e.previousStatus}</td>
                    <td style={{ maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#64748b" }}>{e.reason}</td>
                    <td style={{ fontSize: "0.78rem", color: "#475569" }}>{new Date(e.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
