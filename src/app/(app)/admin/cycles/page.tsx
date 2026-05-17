"use client";
import { useEffect, useState } from "react";

type Cycle = {
  id: string;
  year: number;
  name: string;
  isActive: boolean;
  goalsUnlocked: boolean;
  checkinsOpen: boolean;
};

export default function ConfigureCyclesPage() {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [year, setYear] = useState(String(new Date().getFullYear() + 1));
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/cycles");
    if (!res.ok) return;
    const data = await res.json();
    setCycles(data.cycles);
  }

  useEffect(() => { void load(); }, []);

  async function createCycle() {
    setLoading(true);
    await fetch("/api/admin/cycles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year: Number(year) }),
    });
    setLoading(false);
    await load();
  }

  async function patchCycle(id: string, payload: Partial<Cycle>) {
    await fetch(`/api/admin/cycles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    await load();
  }

  return (
    <div style={{ maxWidth: 1000 }}>
      <h1 className="page-title">Configure Cycles</h1>
      <p className="page-subtitle">Create cycles, set active FY, and open/close goal and check-in windows.</p>
      <div className="card" style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", alignItems: "center" }}>
        <input className="input" type="number" value={year} onChange={(e) => setYear(e.target.value)} placeholder="Cycle year" />
        <button className="btn-primary" onClick={createCycle} disabled={loading}>{loading ? "Creating..." : "Create Cycle"}</button>
      </div>

      <div className="table-wrapper">
        <table>
          <thead><tr><th>Cycle</th><th>Active</th><th>Goals</th><th>Check-ins</th></tr></thead>
          <tbody>
            {cycles.map((c: typeof cycles[0]) => (
              <tr key={c.id}>
                <td>{c.name} ({c.year})</td>
                <td><button className="btn-secondary" onClick={() => patchCycle(c.id, { isActive: true })}>{c.isActive ? "Active" : "Set Active"}</button></td>
                <td><button className={c.goalsUnlocked ? "btn-success" : "btn-danger"} onClick={() => patchCycle(c.id, { goalsUnlocked: !c.goalsUnlocked })}>{c.goalsUnlocked ? "Open" : "Locked"}</button></td>
                <td><button className={c.checkinsOpen ? "btn-success" : "btn-danger"} onClick={() => patchCycle(c.id, { checkinsOpen: !c.checkinsOpen })}>{c.checkinsOpen ? "Open" : "Closed"}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
