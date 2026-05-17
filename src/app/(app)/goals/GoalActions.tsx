"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2 } from "lucide-react";

export default function GoalActions({ goalIds }: { goalIds: string[] }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submitAll() {
    setLoading(true);
    await Promise.all(
      goalIds.map(id =>
        fetch(`/api/goals/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "SUBMITTED" }),
        })
      )
    );
    setLoading(false);
    router.refresh();
  }

  return (
    <button className="btn-success" onClick={submitAll} disabled={loading}>
      {loading
        ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Submitting…</>
        : <><Send size={14} /> Submit All for Approval</>
      }
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </button>
  );
}
