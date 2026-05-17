"use client";
import { useState } from "react";
import {
  BarChart3, Download, Search, Filter,
  TrendingUp, Users, Target, Award,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Achievement { quarter: number; actual: number; status: string; score: number }
interface Goal {
  id: string; title: string; thrustArea: string; uomType: string;
  target: number; weightage: number; status: string; cycleYear: number;
  owner: { name: string; email: string };
  achievements: Achievement[];
}

const Q_LABELS: Record<number, string> = { 1: "Q1", 2: "Q2", 3: "Q3", 4: "Q4" };
const STATUS_COLORS: Record<string, string> = { DRAFT: "#94a3b8", SUBMITTED: "#fbbf24", APPROVED: "#34d399", REWORK: "#f87171" };
const STATUS_CLASS: Record<string, string> = { DRAFT: "badge-draft", SUBMITTED: "badge-submitted", APPROVED: "badge-approved", REWORK: "badge-rework" };

export default function ReportsClient({ goals }: { goals: Goal[] }) {
  const [filter, setFilter] = useState({ status: "", thrustArea: "", search: "" });

  const filtered = goals.filter(g =>
    (!filter.status || g.status === filter.status) &&
    (!filter.thrustArea || g.thrustArea === filter.thrustArea) &&
    (!filter.search || g.title.toLowerCase().includes(filter.search.toLowerCase()) || g.owner.name.toLowerCase().includes(filter.search.toLowerCase()))
  );

  const thrustAreas = [...new Set(goals.map(g => g.thrustArea))];

  function exportCSV() {
    const rows = [
      ["Employee", "Email", "Goal", "Thrust Area", "UoM", "Target", "Weightage", "Status", "Q1 Actual", "Q1 Score", "Q2 Actual", "Q2 Score", "Q3 Actual", "Q3 Score", "Q4 Actual", "Q4 Score"],
      ...filtered.map(g => {
        const q = (n: number) => { const a = g.achievements.find(a => a.quarter === n); return [a?.actual ?? "", a?.score.toFixed(1) ?? ""]; };
        return [g.owner.name, g.owner.email, g.title, g.thrustArea, g.uomType, g.target, g.weightage, g.status, ...q(1), ...q(2), ...q(3), ...q(4)];
      }),
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `atomquest-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  const approvedCount = goals.filter(g => g.status === "APPROVED").length;
  const allAch = goals.flatMap(g => g.achievements);
  const avgScore = allAch.length > 0 ? allAch.reduce((s, a) => s + a.score, 0) / allAch.length : 0;
  const uniqueEmployees = new Set(goals.map(g => g.owner.email)).size;

  return (
    <div className="fade-in" style={{ maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
            <BarChart3 size={16} color="#6366f1" />
            <span style={{ fontSize: "0.8rem", color: "#6366f1", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>Analytics</span>
          </div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>Achievement overview · Planned vs Actual · CSV export</p>
        </div>
        <button className="btn-success" onClick={exportCSV}>
          <Download size={15} /> Export CSV
        </button>
      </div>

      {/* Summary Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { label: "Total Goals", value: goals.length, Icon: Target, color: "#818cf8" },
          { label: "Approved", value: approvedCount, Icon: Award, color: "#34d399" },
          { label: "Avg Score", value: `${avgScore.toFixed(1)}%`, Icon: TrendingUp, color: "#818cf8" },
          { label: "Employees", value: uniqueEmployees, Icon: Users, color: "#fbbf24" },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ padding: "0.5rem", borderRadius: "0.625rem", background: `${s.color}15`, border: `1px solid ${s.color}30`, width: "fit-content" }}>
              <s.Icon size={18} color={s.color} />
            </div>
            <div style={{ fontSize: "1.875rem", fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: "0.75rem", color: "#475569", fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 240px" }}>
          <Search size={14} color="#475569" style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          <Input
            className="input"
            placeholder="Search employee or goal…"
            value={filter.search}
            onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
            style={{ paddingLeft: "2.25rem" }}
          />
        </div>
        <Select value={filter.status} onValueChange={v => setFilter(f => ({ ...f, status: v ?? "" }))}>
          <SelectTrigger className="input" style={{ height: "auto", flex: "0 0 160px" }}>
            <Filter size={13} style={{ marginRight: "0.4rem", opacity: 0.5 }} />
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="SUBMITTED">Submitted</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REWORK">Rework</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filter.thrustArea} onValueChange={v => setFilter(f => ({ ...f, thrustArea: v ?? "" }))}>
          <SelectTrigger className="input" style={{ height: "auto", flex: "0 0 200px" }}>
            <SelectValue placeholder="All Thrust Areas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Thrust Areas</SelectItem>
            {thrustAreas.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <div style={{ fontSize: "0.75rem", color: "#475569", marginBottom: "0.75rem" }}>
        Showing <strong style={{ color: "#94a3b8" }}>{filtered.length}</strong> of {goals.length} goals
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Goal</th>
              <th>Thrust Area</th>
              <th>Target</th>
              <th>Weight</th>
              <th>Status</th>
              {[1, 2, 3, 4].map(q => <th key={q}>{Q_LABELS[q]} Score</th>)}
              <th>Best</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={11} style={{ textAlign: "center", color: "#475569", padding: "2.5rem" }}>No goals match your filters.</td></tr>
            ) : (
              filtered.map(goal => {
                const achByQ = Object.fromEntries(goal.achievements.map(a => [a.quarter, a]));
                const bestScore = goal.achievements.length > 0 ? Math.max(...goal.achievements.map(a => a.score)) : null;
                return (
                  <tr key={goal.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: "#e2e8f0" }}>{goal.owner.name}</div>
                      <div style={{ fontSize: "0.72rem", color: "#475569" }}>{goal.owner.email}</div>
                    </td>
                    <td style={{ maxWidth: 180 }}>
                      <div style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#94a3b8" }}>{goal.title}</div>
                    </td>
                    <td><span style={{ fontSize: "0.78rem", color: "#64748b" }}>{goal.thrustArea}</span></td>
                    <td><strong style={{ color: "#94a3b8" }}>{goal.target}</strong></td>
                    <td><span style={{ color: "#64748b" }}>{goal.weightage}%</span></td>
                    <td>
                      <span className={`badge ${STATUS_CLASS[goal.status] ?? "badge-draft"}`}>{goal.status}</span>
                    </td>
                    {[1, 2, 3, 4].map(q => (
                      <td key={q}>
                        {achByQ[q] ? (
                          <div>
                            <div style={{ fontWeight: 700, fontSize: "0.82rem", color: achByQ[q].score >= 80 ? "#34d399" : achByQ[q].score >= 50 ? "#fbbf24" : "#f87171" }}>
                              {achByQ[q].score.toFixed(0)}%
                            </div>
                            <div style={{ fontSize: "0.7rem", color: "#475569" }}>{achByQ[q].actual}</div>
                          </div>
                        ) : <span style={{ color: "#334155" }}>—</span>}
                      </td>
                    ))}
                    <td>
                      {bestScore !== null ? (
                        <span style={{
                          fontWeight: 800, fontSize: "0.875rem",
                          color: bestScore >= 80 ? "#34d399" : bestScore >= 50 ? "#fbbf24" : "#f87171",
                        }}>{bestScore.toFixed(1)}%</span>
                      ) : <span style={{ color: "#334155" }}>—</span>}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
