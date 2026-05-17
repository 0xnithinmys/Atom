"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Zap, Mail, Lock, LogIn, Loader2, AlertTriangle,
  User, ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DEMO_ACCOUNTS = [
  { label: "Employee", email: "employee@atomberg.com", pw: "employee123", color: "#818cf8", bg: "rgba(129,140,248,0.12)" },
  { label: "Manager",  email: "manager@atomberg.com",  pw: "manager123",  color: "#34d399", bg: "rgba(52,211,153,0.12)"  },
  { label: "Admin",    email: "admin@atomberg.com",    pw: "admin123",    color: "#fbbf24", bg: "rgba(251,191,36,0.12)"  },
];

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const quickLogin = (email: string, pw: string) => setForm({ email, password: pw });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", { ...form, redirect: false });
    setLoading(false);
    if (res?.error) setError("Invalid email or password. Please try again.");
    else router.push("/dashboard");
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: `
        radial-gradient(ellipse at 15% 60%, rgba(99,102,241,0.18) 0%, transparent 55%),
        radial-gradient(ellipse at 85% 15%, rgba(139,92,246,0.14) 0%, transparent 50%),
        radial-gradient(ellipse at 50% 90%, rgba(99,102,241,0.08) 0%, transparent 60%),
        #060b14
      `,
      padding: "1rem",
    }}>
      {/* Animated grid background */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: `linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)`,
        backgroundSize: "40px 40px",
      }} />

      <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 1 }} className="fade-in">
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{
            width: 64, height: 64, borderRadius: "18px",
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            marginBottom: "1.25rem",
            boxShadow: "0 0 0 1px rgba(99,102,241,0.3), 0 8px 40px rgba(99,102,241,0.5)",
          }} className="glow float">
            <Zap size={30} color="white" />
          </div>
          <h1 style={{ fontSize: "2rem", fontWeight: 900, margin: 0, letterSpacing: "-0.03em", color: "#f1f5f9" }}>
            Atom<span className="gradient-text">Quest</span>
          </h1>
          <p style={{ color: "#475569", marginTop: "0.375rem", fontSize: "0.9rem" }}>
            Goal Setting & Tracking Portal
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: "2rem", marginBottom: "1.25rem" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginTop: 0, marginBottom: "1.625rem", color: "#e2e8f0" }}>
            Sign in to your account
          </h2>

          {error && (
            <div style={{
              display: "flex", alignItems: "center", gap: "0.625rem",
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: "0.625rem", padding: "0.75rem 0.875rem",
              marginBottom: "1.25rem", fontSize: "0.84rem", color: "#f87171",
            }}>
              <AlertTriangle size={14} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }}>
            <div className="form-group">
              <Label className="label">Email Address</Label>
              <div style={{ position: "relative" }}>
                <Mail size={15} color="#475569" style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <Input
                  type="email"
                  className="input"
                  placeholder="you@atomberg.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  style={{ paddingLeft: "2.25rem" }}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <Label className="label">Password</Label>
              <div style={{ position: "relative" }}>
                <Lock size={15} color="#475569" style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <Input
                  type="password"
                  className="input"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  style={{ paddingLeft: "2.25rem" }}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: "100%", justifyContent: "center", padding: "0.75rem", marginTop: "0.375rem", fontSize: "0.9rem" }}
            >
              {loading
                ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Signing in…</>
                : <><LogIn size={16} /> Sign In</>
              }
            </button>
          </form>
        </div>

        {/* Demo Accounts */}
        <div>
          <p style={{ textAlign: "center", color: "#334155", fontSize: "0.72rem", marginBottom: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>
            Demo Accounts
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {DEMO_ACCOUNTS.map(d => (
              <button
                key={d.label}
                onClick={() => quickLogin(d.email, d.pw)}
                style={{
                  background: d.bg, border: `1px solid ${d.color}30`,
                  borderRadius: "0.625rem", padding: "0.625rem 1rem",
                  cursor: "pointer", transition: "all 0.15s",
                  display: "flex", alignItems: "center", gap: "0.625rem",
                  textAlign: "left",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = `${d.color}60`; (e.currentTarget as HTMLButtonElement).style.background = d.bg.replace("0.12", "0.2"); }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = `${d.color}30`; (e.currentTarget as HTMLButtonElement).style.background = d.bg; }}
              >
                <div style={{ padding: "0.35rem", borderRadius: "0.375rem", background: `${d.color}20`, flexShrink: 0 }}>
                  <User size={13} color={d.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: d.color }}>{d.label}</div>
                  <div style={{ fontSize: "0.7rem", color: "#475569" }}>{d.email}</div>
                </div>
                <ChevronRight size={14} color="#334155" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
