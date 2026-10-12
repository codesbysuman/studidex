"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Globe,
  Lock,
  Download,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  DollarSign,
  FileText,
  Filter,
  ArrowLeft,
  Sparkles,
  Trash2,
  Edit3,
  Eye,
  X,
  Check,
  Database,
  Activity,
  HardDrive,
  Copy,
  ChevronRight,
  ShieldAlert,
  GraduationCap,
  Layers,
} from "lucide-react";
import { useStudidex, type AuthUser } from "@/lib/use-studidex";

interface AdminMaterial {
  id: string;
  title: string;
  description?: string;
  type: string;
  origin: string;
  isPublic: boolean;
  isPaid: boolean;
  price: number;
  downloadCount: number;
  stage: string;
  board: string;
  subjectName: string;
  authorEmail: string;
  authorName: string;
  authorInstitution?: string | null;
  createdAt: string;
  updatedAt: string;
  contentExcerpt?: string | null;
  contentLength: number;
  hasQuiz: boolean;
}

interface AdminUserItem {
  id: string;
  email: string;
  name: string;
  stage: string;
  board: string;
  degree?: string | null;
  className?: string | null;
  institutionName: string;
  stream?: string | null;
  hasCompletedOnboarding: boolean;
  paperCount: number;
  materialCount: number;
  itemCount: number;
  subjectCount: number;
  attemptCount: number;
  isAdmin: boolean;
  createdAt: string;
}

interface AdminStats {
  totalMaterials: number;
  publicMaterials: number;
  paidMaterials: number;
  totalUsers: number;
  totalItems: number;
  totalAttempts?: number;
  totalDownloads: number;
}

interface SystemHealth {
  status: string;
  timestamp: string;
  database: {
    connected: boolean;
    latencyMs: number | null;
    provider: string;
  };
  counts: {
    users: number;
    subjects: number;
    topics: number;
    academicItems: number;
    materials: number;
    mockTestAttempts: number;
    academicInputs: number;
  };
  environment: {
    nodeEnv: string;
    hasGroqKey: boolean;
    hasJwtSecret: boolean;
  };
}

export default function AdminClient({ initialUser }: { initialUser?: AuthUser | null }) {
  const { user } = useStudidex({ user: initialUser });
  const currentUser = user || initialUser;

  const [activeTab, setActiveTab] = useState<"materials" | "users" | "system">("materials");
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [systemLoading, setSystemLoading] = useState(false);

  const [materials, setMaterials] = useState<AdminMaterial[]>([]);
  const [usersList, setUsersList] = useState<AdminUserItem[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterVisibility, setFilterVisibility] = useState("all");
  const [filterPaid, setFilterPaid] = useState("all");
  const [filterStage, setFilterStage] = useState("all");

  // Interaction Modals & States
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [previewMaterial, setPreviewMaterial] = useState<AdminMaterial | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<AdminMaterial | null>(null);
  const [editFormData, setEditFormData] = useState({
    title: "",
    subjectName: "",
    stage: "UG",
    board: "General",
    price: 0,
  });

  // Admin Key Unlock state with persistence in sessionStorage
  const [adminKeyInput, setAdminKeyInput] = useState("");
  const [unlockedViaKey, setUnlockedViaKey] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Check saved admin key in sessionStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedKey = sessionStorage.getItem("studidex_admin_key");
      if (savedKey) {
        setUnlockedViaKey(true);
      }
    }
  }, []);

  const isAdmin = currentUser?.role === "admin" || unlockedViaKey;

  const getAdminHeaders = useCallback((): HeadersInit => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (typeof window !== "undefined") {
      const savedKey = sessionStorage.getItem("studidex_admin_key");
      if (savedKey) headers["x-admin-key"] = savedKey;
    }
    return headers;
  }, []);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Fetch Materials
  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/materials", {
        headers: getAdminHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setMaterials(data.materials || []);
          setStats(data.stats || null);
        }
      } else if (res.status === 403 || res.status === 401) {
        setUnlockedViaKey(false);
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("studidex_admin_key");
        }
      }
    } catch (e) {
      console.error("Failed to load materials:", e);
    } finally {
      setLoading(false);
    }
  }, [getAdminHeaders]);

  // 2. Fetch Users
  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        headers: getAdminHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setUsersList(data.users || []);
        }
      }
    } catch (e) {
      console.error("Failed to load users:", e);
    } finally {
      setUsersLoading(false);
    }
  }, [getAdminHeaders]);

  // 3. Fetch System Diagnostics
  const fetchSystem = useCallback(async () => {
    setSystemLoading(true);
    try {
      const res = await fetch("/api/admin/system", {
        headers: getAdminHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSystemHealth(data);
        }
      }
    } catch (e) {
      console.error("Failed to load system health:", e);
    } finally {
      setSystemLoading(false);
    }
  }, [getAdminHeaders]);

  // Trigger loads when admin is active
  useEffect(() => {
    if (isAdmin) {
      fetchMaterials();
      if (activeTab === "users") fetchUsers();
      if (activeTab === "system") fetchSystem();
    }
  }, [isAdmin, activeTab, fetchMaterials, fetchUsers, fetchSystem]);

  // Handle Passcode Submission
  const handleAdminKeyUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const key = adminKeyInput.trim();

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("studidex_admin_key", data.adminKey || key);
        }
        setUnlockedViaKey(true);
        setAdminKeyInput("");
        showToast("Production admin authorization verified.", "success");
      } else {
        setAuthError(data.error || "Invalid admin access passcode.");
      }
    } catch {
      setAuthError("Failed to reach verification endpoint.");
    }
  };

  const handleAdminLock = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("studidex_admin_key");
    }
    setUnlockedViaKey(false);
    showToast("Admin session locked.", "success");
  };

  // Toggle Public / Private
  const handleTogglePublic = async (material: AdminMaterial) => {
    setUpdatingId(material.id);
    const nextVal = !material.isPublic;

    // Optimistic UI
    setMaterials((prev) =>
      prev.map((m) => (m.id === material.id ? { ...m, isPublic: nextVal } : m))
    );

    try {
      const res = await fetch("/api/admin/materials", {
        method: "PATCH",
        headers: getAdminHeaders(),
        body: JSON.stringify({ id: material.id, isPublic: nextVal }),
      });

      if (!res.ok) throw new Error("Failed to update status.");
      showToast(
        nextVal
          ? `"${material.title}" is now publicly visible in student feeds.`
          : `"${material.title}" visibility set to Private.`
      );
    } catch {
      // Revert on error
      setMaterials((prev) =>
        prev.map((m) => (m.id === material.id ? { ...m, isPublic: material.isPublic } : m))
      );
      showToast("Error updating discovery status.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  // Toggle Free / Paid
  const handleTogglePaid = async (material: AdminMaterial) => {
    setUpdatingId(material.id);
    const nextVal = !material.isPaid;
    const nextPrice = nextVal ? (material.price > 0 ? material.price : 4.99) : 0;

    setMaterials((prev) =>
      prev.map((m) =>
        m.id === material.id ? { ...m, isPaid: nextVal, price: nextPrice } : m
      )
    );

    try {
      const res = await fetch("/api/admin/materials", {
        method: "PATCH",
        headers: getAdminHeaders(),
        body: JSON.stringify({ id: material.id, isPaid: nextVal, price: nextPrice }),
      });

      if (!res.ok) throw new Error("Failed to update access model.");
      showToast(
        nextVal
          ? `"${material.title}" marked as Paid ($${nextPrice.toFixed(2)}).`
          : `"${material.title}" is now Free for all students.`
      );
    } catch {
      setMaterials((prev) =>
        prev.map((m) =>
          m.id === material.id
            ? { ...m, isPaid: material.isPaid, price: material.price }
            : m
        )
      );
      showToast("Error updating access model.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  // Delete Material
  const handleDeleteMaterial = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${title}"? This cannot be undone.`)) {
      return;
    }

    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/materials?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: getAdminHeaders(),
      });

      if (!res.ok) throw new Error("Failed to delete.");
      setMaterials((prev) => prev.filter((m) => m.id !== id));
      showToast(`"${title}" deleted successfully.`);
    } catch {
      showToast("Failed to delete material.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  // Save Edit Metadata
  const handleSaveEdit = async () => {
    if (!editingMaterial) return;
    setUpdatingId(editingMaterial.id);

    try {
      const res = await fetch("/api/admin/materials", {
        method: "PATCH",
        headers: getAdminHeaders(),
        body: JSON.stringify({
          id: editingMaterial.id,
          title: editFormData.title,
          subjectName: editFormData.subjectName,
          stage: editFormData.stage,
          board: editFormData.board,
          price: Number(editFormData.price),
        }),
      });

      if (!res.ok) throw new Error("Failed to save changes.");

      setMaterials((prev) =>
        prev.map((m) =>
          m.id === editingMaterial.id
            ? {
                ...m,
                title: editFormData.title,
                subjectName: editFormData.subjectName,
                stage: editFormData.stage,
                board: editFormData.board,
                price: Number(editFormData.price),
              }
            : m
        )
      );
      showToast("Material updated successfully.");
      setEditingMaterial(null);
    } catch {
      showToast("Failed to save updates.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  // Memoized Filtered Materials
  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const match =
          m.title.toLowerCase().includes(q) ||
          m.authorName.toLowerCase().includes(q) ||
          m.authorEmail.toLowerCase().includes(q) ||
          m.subjectName.toLowerCase().includes(q) ||
          (m.authorInstitution && m.authorInstitution.toLowerCase().includes(q));
        if (!match) return false;
      }
      if (filterType !== "all" && m.type !== filterType) return false;
      if (filterVisibility === "public" && !m.isPublic) return false;
      if (filterVisibility === "private" && m.isPublic) return false;
      if (filterPaid === "paid" && !m.isPaid) return false;
      if (filterPaid === "free" && m.isPaid) return false;
      if (filterStage !== "all" && m.stage.toLowerCase() !== filterStage.toLowerCase()) return false;
      return true;
    });
  }, [materials, search, filterType, filterVisibility, filterPaid, filterStage]);

  // Memoized Filtered Users
  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return usersList;
    const q = userSearch.toLowerCase();
    return usersList.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        u.name.toLowerCase().includes(q) ||
        u.institutionName.toLowerCase().includes(q) ||
        (u.degree && u.degree.toLowerCase().includes(q))
    );
  }, [usersList, userSearch]);

  return (
    <main className="min-h-screen px-4 pb-32 pt-6 sm:px-8 md:px-12 md:pb-20 md:pt-10">
      <div className="mx-auto max-w-6xl space-y-7">
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-subtle pb-5">
          <div>
            <div className="flex items-center gap-2">
              <Link
                href="/materials"
                className="inline-flex items-center gap-1 text-[12px] font-medium text-foreground-muted hover:text-foreground transition-colors"
              >
                <ArrowLeft size={13} />
                <span>Materials</span>
              </Link>
              <span className="text-foreground-faint">/</span>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Administration Portal
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2.5">
              <span>Production Control Center</span>
              <span className="rounded-lg bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 border border-amber-500/20">
                Live Admin
              </span>
            </h1>
            <p className="mt-1 text-[13.5px] text-foreground-muted">
              Curate cloud materials, manage public discovery in student feeds, monitor registered accounts, and verify database integrity.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === "materials") fetchMaterials();
                    if (activeTab === "users") fetchUsers();
                    if (activeTab === "system") fetchSystem();
                  }}
                  disabled={loading || usersLoading || systemLoading}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-[12.5px] font-medium text-foreground hover:bg-surface-subtle transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw
                    size={13}
                    className={loading || usersLoading || systemLoading ? "animate-spin" : ""}
                  />
                  <span>Refresh</span>
                </button>

                <button
                  type="button"
                  onClick={handleAdminLock}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-[12.5px] font-medium text-foreground-muted hover:text-red-500 hover:border-red-500/30 transition-colors cursor-pointer"
                  title="Lock Admin Session"
                >
                  <Lock size={13} />
                  <span>Lock</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Global Toast Notification */}
        {toastMessage && (
          <div
            className={`rounded-xl border px-4 py-2.5 text-[13px] font-medium shadow-md transition-all ${
              toastMessage.type === "success"
                ? "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300"
                : "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
            }`}
          >
            {toastMessage.text}
          </div>
        )}

        {/* Non-Admin Access Gate */}
        {!isAdmin ? (
          <div className="rounded-3xl border border-border bg-surface p-7 sm:p-10 max-w-md mx-auto text-center shadow-lg space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <ShieldAlert size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Admin Verification Required</h2>
              <p className="mt-1 text-[13px] text-foreground-muted">
                Authorize with your production administrator passcode or sign in with an account having admin role privileges.
              </p>
            </div>

            {authError && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-2.5 text-[12px] text-red-600 dark:text-red-400">
                {authError}
              </div>
            )}

            <form onSubmit={handleAdminKeyUnlock} className="space-y-3 pt-2">
              <input
                type="password"
                value={adminKeyInput}
                onChange={(e) => setAdminKeyInput(e.target.value)}
                placeholder="Enter admin passcode (e.g. studidex2026)"
                autoFocus
                className="w-full rounded-xl border border-border bg-surface-subtle/50 px-3.5 py-2.5 text-[13.5px] text-foreground focus:border-foreground focus:outline-none"
              />
              <button
                type="submit"
                className="w-full rounded-xl bg-foreground px-4 py-2.5 text-[13px] font-semibold text-surface hover:opacity-90 active:scale-98 transition-all cursor-pointer"
              >
                Unlock Production Dashboard
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* Nav Tabs */}
            <div className="flex items-center gap-1.5 border-b border-border-subtle pb-px">
              <button
                type="button"
                onClick={() => setActiveTab("materials")}
                className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium border-b-2 transition-all cursor-pointer ${
                  activeTab === "materials"
                    ? "border-foreground text-foreground font-semibold"
                    : "border-transparent text-foreground-muted hover:text-foreground"
                }`}
              >
                <FileText size={15} />
                <span>Materials & Curation</span>
                {materials.length > 0 && (
                  <span className="rounded-full bg-surface-subtle px-2 py-0.5 text-[10.5px] font-bold text-foreground border border-border">
                    {materials.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("users")}
                className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium border-b-2 transition-all cursor-pointer ${
                  activeTab === "users"
                    ? "border-foreground text-foreground font-semibold"
                    : "border-transparent text-foreground-muted hover:text-foreground"
                }`}
              >
                <Users size={15} />
                <span>Registered Students</span>
                {stats?.totalUsers ? (
                  <span className="rounded-full bg-surface-subtle px-2 py-0.5 text-[10.5px] font-bold text-foreground border border-border">
                    {stats.totalUsers}
                  </span>
                ) : null}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("system")}
                className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium border-b-2 transition-all cursor-pointer ${
                  activeTab === "system"
                    ? "border-foreground text-foreground font-semibold"
                    : "border-transparent text-foreground-muted hover:text-foreground"
                }`}
              >
                <Database size={15} />
                <span>System Health & DB</span>
                <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              </button>
            </div>

            {/* TAB 1: MATERIALS & CONTENT CURATION */}
            {activeTab === "materials" && (
              <div className="space-y-6">
                {/* Stats Cards */}
                {stats && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-2xl border border-border bg-surface p-4">
                      <div className="flex items-center gap-2 text-foreground-muted">
                        <FileText size={15} />
                        <span className="text-[11px] font-semibold uppercase tracking-wider">
                          Total Materials
                        </span>
                      </div>
                      <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                        {stats.totalMaterials}
                      </p>
                      <p className="mt-0.5 text-[11px] text-foreground-faint">
                        Across all synced accounts
                      </p>
                    </div>

                    <div className="rounded-2xl border border-border bg-surface p-4">
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <Globe size={15} />
                        <span className="text-[11px] font-semibold uppercase tracking-wider">
                          Public Live Feeds
                        </span>
                      </div>
                      <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                        {materials.filter((m) => m.isPublic).length}
                      </p>
                      <p className="mt-0.5 text-[11px] text-foreground-faint">
                        Discoverable by all students
                      </p>
                    </div>

                    <div className="rounded-2xl border border-border bg-surface p-4">
                      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                        <DollarSign size={15} />
                        <span className="text-[11px] font-semibold uppercase tracking-wider">
                          Monetized Assets
                        </span>
                      </div>
                      <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                        {materials.filter((m) => m.isPaid).length}
                      </p>
                      <p className="mt-0.5 text-[11px] text-foreground-faint">
                        Paid student guides
                      </p>
                    </div>

                    <div className="rounded-2xl border border-border bg-surface p-4">
                      <div className="flex items-center gap-2 text-foreground-muted">
                        <Download size={15} />
                        <span className="text-[11px] font-semibold uppercase tracking-wider">
                          Total Downloads
                        </span>
                      </div>
                      <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                        {stats.totalDownloads}
                      </p>
                      <p className="mt-0.5 text-[11px] text-foreground-faint">
                        Student downloads & views
                      </p>
                    </div>
                  </div>
                )}

                {/* Search & Multi-Filters */}
                <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative flex-1">
                    <Search
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted"
                    />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search by title, subject, college, or author..."
                      className="w-full rounded-xl border border-border-subtle bg-surface-subtle/50 pl-9 pr-3 py-2 text-[13px] text-foreground focus:border-foreground focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[12px]">
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="rounded-xl border border-border-subtle bg-surface px-2.5 py-2 text-foreground focus:outline-none"
                    >
                      <option value="all">All Content Types</option>
                      <option value="note">Study Notes</option>
                      <option value="pyq">Past Papers (PYQs)</option>
                      <option value="mock_test">Practice Quizzes</option>
                      <option value="syllabus">Syllabus Outlines</option>
                      <option value="handout">Faculty Handouts</option>
                      <option value="sample_paper">Sample Papers</option>
                    </select>

                    <select
                      value={filterVisibility}
                      onChange={(e) => setFilterVisibility(e.target.value)}
                      className="rounded-xl border border-border-subtle bg-surface px-2.5 py-2 text-foreground focus:outline-none"
                    >
                      <option value="all">All Visibility</option>
                      <option value="public">Public Only</option>
                      <option value="private">Private Only</option>
                    </select>

                    <select
                      value={filterPaid}
                      onChange={(e) => setFilterPaid(e.target.value)}
                      className="rounded-xl border border-border-subtle bg-surface px-2.5 py-2 text-foreground focus:outline-none"
                    >
                      <option value="all">All Pricing</option>
                      <option value="free">Free Download</option>
                      <option value="paid">Paid Access</option>
                    </select>

                    <select
                      value={filterStage}
                      onChange={(e) => setFilterStage(e.target.value)}
                      className="rounded-xl border border-border-subtle bg-surface px-2.5 py-2 text-foreground focus:outline-none"
                    >
                      <option value="all">All Academic Stages</option>
                      <option value="ug">UG (Undergrad)</option>
                      <option value="pg">PG (Postgrad)</option>
                      <option value="highschool">High School</option>
                    </select>
                  </div>
                </div>

                {/* Materials List */}
                <div className="rounded-2xl border border-border bg-surface overflow-hidden">
                  <div className="border-b border-border-subtle bg-surface-subtle/40 px-5 py-3 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
                    <span>Material Details ({filteredMaterials.length})</span>
                    <span className="hidden sm:inline">Actions & Discovery Controls</span>
                  </div>

                  {loading ? (
                    <div className="p-10 text-center space-y-2">
                      <RefreshCw size={20} className="animate-spin mx-auto text-foreground-muted" />
                      <p className="text-[13px] text-foreground-muted">Loading cloud materials...</p>
                    </div>
                  ) : filteredMaterials.length === 0 ? (
                    <div className="p-10 text-center space-y-2">
                      <p className="text-[14px] font-medium text-foreground">No materials found.</p>
                      <p className="text-[12px] text-foreground-muted">
                        No materials match your current search and filter settings.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border-subtle">
                      {filteredMaterials.map((item) => (
                        <div
                          key={item.id}
                          className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors hover:bg-surface-subtle/30"
                        >
                          <div className="space-y-1.5 min-w-0 max-w-xl">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded bg-surface-subtle px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-foreground border border-border">
                                {item.type}
                              </span>
                              <span className="text-[12px] font-semibold text-foreground">
                                {item.subjectName}
                              </span>
                              <span className="text-[11px] text-foreground-faint">·</span>
                              <span className="text-[11px] text-foreground-faint">
                                {item.stage.toUpperCase()} · {item.board}
                              </span>
                              {item.hasQuiz && (
                                <span className="rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 px-1.5 py-0.2 text-[9.5px] font-bold uppercase">
                                  Quiz / Test
                                </span>
                              )}
                            </div>

                            <h3 className="text-[15px] font-semibold text-foreground tracking-tight">
                              {item.title}
                            </h3>

                            {item.description && (
                              <p className="text-[12.5px] text-foreground-muted line-clamp-1">
                                {item.description}
                              </p>
                            )}

                            <div className="flex flex-wrap items-center gap-3 text-[11.5px] text-foreground-faint pt-0.5">
                              <span>By: {item.authorName} ({item.authorEmail})</span>
                              {item.authorInstitution && (
                                <>
                                  <span>·</span>
                                  <span>{item.authorInstitution}</span>
                                </>
                              )}
                              <span>·</span>
                              <span>{item.downloadCount} downloads</span>
                            </div>
                          </div>

                          {/* Control Actions */}
                          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0 w-full sm:w-auto pt-2 sm:pt-0">
                            {/* Toggle Public / Private */}
                            <button
                              type="button"
                              onClick={() => handleTogglePublic(item)}
                              disabled={updatingId === item.id}
                              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-medium border transition-all cursor-pointer ${
                                item.isPublic
                                  ? "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300 hover:bg-green-500/20"
                                  : "border-border-subtle bg-surface text-foreground-muted hover:text-foreground hover:bg-surface-subtle"
                              }`}
                            >
                              <Globe size={13} />
                              <span>{item.isPublic ? "Public" : "Private"}</span>
                            </button>

                            {/* Toggle Free / Paid */}
                            <button
                              type="button"
                              onClick={() => handleTogglePaid(item)}
                              disabled={updatingId === item.id}
                              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-medium border transition-all cursor-pointer ${
                                item.isPaid
                                  ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20"
                                  : "border-border-subtle bg-surface text-foreground-muted hover:text-foreground hover:bg-surface-subtle"
                              }`}
                            >
                              {item.isPaid ? (
                                <>
                                  <Lock size={13} />
                                  <span>${item.price.toFixed(2)}</span>
                                </>
                              ) : (
                                <>
                                  <Download size={13} />
                                  <span>Free</span>
                                </>
                              )}
                            </button>

                            {/* Preview Note */}
                            <button
                              type="button"
                              onClick={() => setPreviewMaterial(item)}
                              className="inline-flex items-center justify-center rounded-xl border border-border bg-surface p-2 text-foreground-muted hover:text-foreground hover:bg-surface-subtle transition-colors cursor-pointer"
                              title="Preview Content"
                            >
                              <Eye size={13} />
                            </button>

                            {/* Edit Metadata */}
                            <button
                              type="button"
                              onClick={() => {
                                setEditingMaterial(item);
                                setEditFormData({
                                  title: item.title,
                                  subjectName: item.subjectName,
                                  stage: item.stage,
                                  board: item.board,
                                  price: item.price,
                                });
                              }}
                              className="inline-flex items-center justify-center rounded-xl border border-border bg-surface p-2 text-foreground-muted hover:text-foreground hover:bg-surface-subtle transition-colors cursor-pointer"
                              title="Edit Details"
                            >
                              <Edit3 size={13} />
                            </button>

                            {/* Delete Material */}
                            <button
                              type="button"
                              onClick={() => handleDeleteMaterial(item.id, item.title)}
                              disabled={updatingId === item.id}
                              className="inline-flex items-center justify-center rounded-xl border border-border bg-surface p-2 text-foreground-muted hover:text-red-500 hover:border-red-500/30 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-50"
                              title="Delete Material"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: REGISTERED STUDENTS & USER DIRECTORY */}
            {activeTab === "users" && (
              <div className="space-y-6">
                <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative flex-1">
                    <Search
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted"
                    />
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Search students by name, email, university, or degree..."
                      className="w-full rounded-xl border border-border-subtle bg-surface-subtle/50 pl-9 pr-3 py-2 text-[13px] text-foreground focus:border-foreground focus:outline-none"
                    />
                  </div>
                  <div className="text-[12px] font-semibold text-foreground-muted">
                    Total Students: {usersList.length}
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-surface overflow-hidden">
                  <div className="border-b border-border-subtle bg-surface-subtle/40 px-5 py-3 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
                    <span>Student Profile</span>
                    <span>Academic Portfolio & Activity</span>
                  </div>

                  {usersLoading ? (
                    <div className="p-10 text-center space-y-2">
                      <RefreshCw size={20} className="animate-spin mx-auto text-foreground-muted" />
                      <p className="text-[13px] text-foreground-muted">Fetching student registry...</p>
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="p-10 text-center space-y-2">
                      <p className="text-[14px] font-medium text-foreground">No students found.</p>
                      <p className="text-[12px] text-foreground-muted">
                        No registered students match your search criteria.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border-subtle">
                      {filteredUsers.map((u) => (
                        <div
                          key={u.id}
                          className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-surface-subtle/30 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground text-surface text-[14px] font-bold">
                              {u.name ? u.name.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase()}
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h3 className="text-[14.5px] font-semibold text-foreground">
                                  {u.name}
                                </h3>
                                {u.isAdmin && (
                                  <span className="rounded bg-amber-500/15 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                    Admin
                                  </span>
                                )}
                              </div>
                              <p className="text-[12px] text-foreground-muted">{u.email}</p>
                              <div className="flex flex-wrap items-center gap-2 text-[11px] text-foreground-faint">
                                <span>{u.institutionName}</span>
                                <span>·</span>
                                <span>
                                  {u.stage.toUpperCase()} · {u.board}
                                </span>
                                {u.degree && (
                                  <>
                                    <span>·</span>
                                    <span>{u.degree}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-[12px]">
                            <div className="flex items-center gap-2 rounded-xl bg-surface-subtle/60 border border-border-subtle px-3 py-1.5 text-foreground">
                              <span className="font-semibold">{u.paperCount}</span>
                              <span className="text-[10px] text-foreground-muted uppercase">Papers</span>
                            </div>

                            <div className="flex items-center gap-2 rounded-xl bg-surface-subtle/60 border border-border-subtle px-3 py-1.5 text-foreground">
                              <span className="font-semibold">{u.materialCount}</span>
                              <span className="text-[10px] text-foreground-muted uppercase">Notes</span>
                            </div>

                            <div className="flex items-center gap-2 rounded-xl bg-surface-subtle/60 border border-border-subtle px-3 py-1.5 text-foreground">
                              <span className="font-semibold">{u.itemCount}</span>
                              <span className="text-[10px] text-foreground-muted uppercase">Tasks</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(u.email);
                                showToast(`Copied ${u.email} to clipboard.`);
                              }}
                              className="rounded-xl border border-border p-2 text-foreground-muted hover:text-foreground transition-colors cursor-pointer"
                              title="Copy Email"
                            >
                              <Copy size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: SYSTEM HEALTH & DATABASE COCKPIT */}
            {activeTab === "system" && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-border bg-surface p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-border-subtle pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10 text-green-700 dark:text-green-300 border border-green-500/20">
                        <Activity size={20} />
                      </div>
                      <div>
                        <h2 className="text-[16px] font-semibold text-foreground">Database Engine Health</h2>
                        <p className="text-[12px] text-foreground-muted">
                          Neon Serverless PostgreSQL connection status & response latency
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="flex h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[12.5px] font-semibold text-green-700 dark:text-green-300">
                        {systemHealth?.database.connected ? "Online & Healthy" : "Checking..."}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className="rounded-xl border border-border-subtle bg-surface-subtle/40 p-3.5">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
                        Database Engine
                      </span>
                      <p className="mt-1 text-[14px] font-bold text-foreground">
                        {systemHealth?.database.provider || "Neon PostgreSQL (AWS)"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-border-subtle bg-surface-subtle/40 p-3.5">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
                        Query Latency
                      </span>
                      <p className="mt-1 text-[14px] font-bold text-foreground">
                        {systemHealth?.database.latencyMs !== undefined
                          ? `${systemHealth.database.latencyMs} ms`
                          : "Measuring..."}
                      </p>
                    </div>

                    <div className="rounded-xl border border-border-subtle bg-surface-subtle/40 p-3.5">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
                        Environment Mode
                      </span>
                      <p className="mt-1 text-[14px] font-bold text-foreground capitalize">
                        {systemHealth?.environment.nodeEnv || "production"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Table Records Breakdown */}
                {systemHealth?.counts && (
                  <div className="rounded-2xl border border-border bg-surface p-6 space-y-4">
                    <h3 className="text-[15px] font-semibold text-foreground">
                      Platform Record Aggregates
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="rounded-xl border border-border-subtle p-3.5">
                        <span className="text-[11px] text-foreground-muted uppercase font-medium">Students</span>
                        <p className="text-xl font-bold text-foreground mt-1">{systemHealth.counts.users}</p>
                      </div>
                      <div className="rounded-xl border border-border-subtle p-3.5">
                        <span className="text-[11px] text-foreground-muted uppercase font-medium">Subjects</span>
                        <p className="text-xl font-bold text-foreground mt-1">{systemHealth.counts.subjects}</p>
                      </div>
                      <div className="rounded-xl border border-border-subtle p-3.5">
                        <span className="text-[11px] text-foreground-muted uppercase font-medium">Syllabus Topics</span>
                        <p className="text-xl font-bold text-foreground mt-1">{systemHealth.counts.topics}</p>
                      </div>
                      <div className="rounded-xl border border-border-subtle p-3.5">
                        <span className="text-[11px] text-foreground-muted uppercase font-medium">Academic Tasks</span>
                        <p className="text-xl font-bold text-foreground mt-1">{systemHealth.counts.academicItems}</p>
                      </div>
                      <div className="rounded-xl border border-border-subtle p-3.5">
                        <span className="text-[11px] text-foreground-muted uppercase font-medium">Materials</span>
                        <p className="text-xl font-bold text-foreground mt-1">{systemHealth.counts.materials}</p>
                      </div>
                      <div className="rounded-xl border border-border-subtle p-3.5">
                        <span className="text-[11px] text-foreground-muted uppercase font-medium">Test Attempts</span>
                        <p className="text-xl font-bold text-foreground mt-1">{systemHealth.counts.mockTestAttempts}</p>
                      </div>
                      <div className="rounded-xl border border-border-subtle p-3.5">
                        <span className="text-[11px] text-foreground-muted uppercase font-medium">AI Ingestions</span>
                        <p className="text-xl font-bold text-foreground mt-1">{systemHealth.counts.academicInputs}</p>
                      </div>
                      <div className="rounded-xl border border-border-subtle p-3.5">
                        <span className="text-[11px] text-foreground-muted uppercase font-medium">AI Integration</span>
                        <p className="text-xl font-bold text-foreground mt-1">
                          {systemHealth.environment.hasGroqKey ? "Active (Groq)" : "Local Mock"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Modal: Preview Material */}
        {previewMaterial && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="relative w-full max-w-2xl max-h-[85vh] rounded-2xl border border-border bg-surface p-6 shadow-2xl flex flex-col space-y-4">
              <div className="flex items-start justify-between border-b border-border-subtle pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-surface-subtle px-1.5 py-0.5 text-[10px] font-bold uppercase text-foreground">
                      {previewMaterial.type}
                    </span>
                    <span className="text-[12px] text-foreground-muted">
                      {previewMaterial.subjectName}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-foreground mt-1">
                    {previewMaterial.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewMaterial(null)}
                  className="rounded-lg p-1.5 text-foreground-muted hover:text-foreground cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-[13px] text-foreground leading-relaxed">
                {previewMaterial.description && (
                  <p className="text-foreground-muted italic">
                    {previewMaterial.description}
                  </p>
                )}
                {previewMaterial.contentExcerpt ? (
                  <div className="rounded-xl border border-border-subtle bg-surface-subtle/50 p-4 font-mono text-[12px] whitespace-pre-wrap">
                    {previewMaterial.contentExcerpt}
                  </div>
                ) : (
                  <p className="text-foreground-faint">No text content available.</p>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-border-subtle pt-3 text-[12px]">
                <span className="text-foreground-muted">
                  By {previewMaterial.authorName} · {previewMaterial.stage}
                </span>
                <Link
                  href={`/materials/${previewMaterial.id}`}
                  className="inline-flex items-center gap-1 font-semibold text-foreground hover:underline"
                >
                  <span>Open Full Viewer</span>
                  <ExternalLink size={12} />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Edit Metadata */}
        {editingMaterial && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="relative w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <h3 className="text-lg font-bold text-foreground">Edit Material Details</h3>
                <button
                  type="button"
                  onClick={() => setEditingMaterial(null)}
                  className="rounded-lg p-1.5 text-foreground-muted hover:text-foreground cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3.5 text-[13px]">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
                    Title
                  </label>
                  <input
                    type="text"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
                    Subject Name
                  </label>
                  <input
                    type="text"
                    value={editFormData.subjectName}
                    onChange={(e) => setEditFormData({ ...editFormData, subjectName: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
                      Academic Stage
                    </label>
                    <select
                      value={editFormData.stage}
                      onChange={(e) => setEditFormData({ ...editFormData, stage: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
                    >
                      <option value="UG">Undergraduate (UG)</option>
                      <option value="PG">Postgraduate (PG)</option>
                      <option value="HighSchool">High School</option>
                      <option value="Diploma">Diploma</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
                      Exam Board / University
                    </label>
                    <input
                      type="text"
                      value={editFormData.board}
                      onChange={(e) => setEditFormData({ ...editFormData, board: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
                    Access Price ($ USD)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={editFormData.price}
                    onChange={(e) => setEditFormData({ ...editFormData, price: parseFloat(e.target.value) || 0 })}
                    className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-foreground focus:border-foreground focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-border-subtle pt-3">
                <button
                  type="button"
                  onClick={() => setEditingMaterial(null)}
                  className="rounded-xl border border-border px-3.5 py-2 text-[12.5px] font-medium text-foreground-muted hover:text-foreground cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={updatingId === editingMaterial.id}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-foreground px-4 py-2 text-[12.5px] font-semibold text-surface hover:opacity-90 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Check size={14} />
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
