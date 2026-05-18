"use client";

import { useEffect, useState } from "react";

type Notification = {
  id: string;
  channel: string;
  deliveryStatus: string;
  message: string;
  createdAt: string;
  event: {
    status: string;
    ruleType: string;
    level: number;
    user: { name: string };
    goal: { title: string } | null;
  };
};

const RULE_LABELS: Record<string, string> = {
  GOAL_NOT_SUBMITTED: "Goal Not Submitted",
  GOAL_PENDING_APPROVAL: "Goal Pending Approval",
  CHECKIN_NOT_COMPLETED: "Check-in Not Completed",
};

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/notifications");
    const data = await res.json();
    setItems(data.notifications ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div style={{ maxWidth: 1000 }}>
      <h1 className="page-title">My Notifications</h1>
      <p className="page-subtitle">Escalation alerts routed to you via in-app and email channels.</p>
      <button className="btn-secondary" onClick={() => void load()} style={{ marginBottom: "1rem" }}>Refresh</button>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Rule</th>
              <th>Level</th>
              <th>Status</th>
              <th>Channel</th>
              <th>Message</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{new Date(item.createdAt).toLocaleString()}</td>
                <td>{RULE_LABELS[item.event.ruleType] ?? item.event.ruleType}</td>
                <td>L{item.event.level}</td>
                <td>
                  <span style={{ color: item.event.status === "OPEN" ? "#fbbf24" : "#34d399", fontWeight: 700 }}>{item.event.status}</span>
                </td>
                <td>{item.channel} ({item.deliveryStatus})</td>
                <td style={{ maxWidth: 420, whiteSpace: "normal" }}>{item.message}</td>
              </tr>
            ))}
            {!items.length && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "#64748b", padding: "1rem" }}>
                  {loading ? "Loading notifications..." : "No notifications yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

