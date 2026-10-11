// components/auth-modal.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, LogIn, UserPlus, Sparkles, Check, AlertCircle, ShieldCheck } from "lucide-react";
import { useStudidex } from "@/lib/use-studidex";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: "login" | "signup";
}

export function AuthModal({ isOpen, onClose, defaultMode = "login" }: AuthModalProps) {
  const { checkAuth } = useStudidex();
  const [mode, setMode] = useState<"login" | "signup">(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [stage, setStage] = useState("ug");
  const [className, setClassName] = useState("Semester 3");
  const [institutionName, setInstitutionName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const payload =
        mode === "login"
          ? { email, password }
          : {
              email,
              password,
              name: name || "Student",
              stage,
              className,
              institutionName,
            };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Authentication request failed.");
      }

      setSuccessMessage(
        mode === "login"
          ? "Welcome back! Your academic space is ready."
          : "Account created! Your academic space is synced."
      );
      await checkAuth();

      setTimeout(() => {
        onClose();
        setSuccessMessage(null);
      }, 1200);
    } catch (err: any) {
      setError(err?.message || "Failed to authenticate.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border-subtle pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground text-surface">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h3 className="text-[16px] font-semibold text-foreground">
                    {mode === "login" ? "Student Sign In" : "Create Student Account"}
                  </h3>
                  <p className="text-[12px] text-foreground-muted">
                    Access your notes, tasks, and schedule across all your devices
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground-muted hover:bg-surface-subtle hover:text-foreground"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="mt-4 flex rounded-xl border border-border-subtle bg-surface-subtle/50 p-1">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                }}
                className={`flex-1 rounded-lg py-1.5 text-[12.5px] font-medium transition-all ${
                  mode === "login"
                    ? "bg-surface text-foreground shadow-2xs font-semibold"
                    : "text-foreground-muted hover:text-foreground"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError(null);
                }}
                className={`flex-1 rounded-lg py-1.5 text-[12.5px] font-medium transition-all ${
                  mode === "signup"
                    ? "bg-surface text-foreground shadow-2xs font-semibold"
                    : "text-foreground-muted hover:text-foreground"
                }`}
              >
                Sign Up
              </button>
            </div>

            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-[12.5px] text-red-600 dark:text-red-400">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 p-3 text-[12.5px] text-green-700 dark:text-green-300">
                <Check size={16} />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
              {mode === "signup" && (
                <div>
                  <label className="text-[11.5px] font-semibold text-foreground-muted uppercase tracking-wider">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-[13px] text-foreground focus:border-foreground focus:outline-none"
                    required
                  />
                </div>
              )}

              <div>
                <label className="text-[11.5px] font-semibold text-foreground-muted uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-[13px] text-foreground focus:border-foreground focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[11.5px] font-semibold text-foreground-muted uppercase tracking-wider">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-[13px] text-foreground focus:border-foreground focus:outline-none"
                  required
                />
              </div>

              {mode === "signup" && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[11.5px] font-semibold text-foreground-muted uppercase tracking-wider">
                      Stage
                    </label>
                    <select
                      value={stage}
                      onChange={(e) => setStage(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-[12.5px] text-foreground focus:border-foreground focus:outline-none"
                    >
                      <option value="ug">Undergraduate (UG)</option>
                      <option value="pg">Postgraduate (PG)</option>
                      <option value="school">School (11th/12th)</option>
                      <option value="phd">PhD / Research</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11.5px] font-semibold text-foreground-muted uppercase tracking-wider">
                      Level / Class
                    </label>
                    <input
                      type="text"
                      value={className}
                      onChange={(e) => setClassName(e.target.value)}
                      placeholder="Semester 3"
                      className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-[12.5px] text-foreground focus:border-foreground focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-foreground py-2.5 text-[13px] font-semibold text-surface shadow-xs hover:opacity-90 active:scale-98 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <span>Processing...</span>
                ) : mode === "login" ? (
                  <>
                    <LogIn size={15} />
                    <span>Sign In</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={15} />
                    <span>Create Free Account</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-4 border-t border-border-subtle pt-3 text-center text-[11.5px] text-foreground-muted">
              Secure private cloud backup. Keep your studies safe anywhere.
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
