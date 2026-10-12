"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
    Bell,
    BookOpen,
    CalendarDays,
    CheckSquare,
    Home,
    Settings,
    User,
    Layers,
    LogIn,
    LogOut,
    Cloud,
    RefreshCw,
    ShieldCheck,
} from "lucide-react";
import { motion } from "motion/react";
import { StudidexLogo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { useStudidex } from "@/lib/use-studidex";
import { AuthModal } from "./auth-modal";

const navigation = [
    {
        label: "Home",
        href: "/",
        icon: Home,
    },
    {
        label: "Plan",
        href: "/plan",
        icon: CalendarDays,
    },
    {
        label: "Subjects",
        href: "/subjects",
        icon: Layers,
    },
    {
        label: "Actions",
        href: "/actions",
        icon: CheckSquare,
    },
    {
        label: "Materials",
        href: "/materials",
        icon: BookOpen,
    },
    {
        label: "Updates",
        href: "/updates",
        icon: Bell,
    },
];

const spring = {
    type: "spring" as const,
    stiffness: 420,
    damping: 32,
    mass: 0.7,
};

export function Navigation() {
    const pathname = usePathname();
    const { user, isAuthenticated, logout, isSyncing, syncWithCloud } = useStudidex();
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [hasAdminAccess, setHasAdminAccess] = useState(false);

    useEffect(() => {
        if (user?.role === "admin") {
            setHasAdminAccess(true);
        } else if (typeof window !== "undefined") {
            const storedKey = sessionStorage.getItem("studidex_admin_key");
            if (storedKey) setHasAdminAccess(true);
        }
    }, [user]);

    return (
        <>
            <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

            {/* Desktop sidebar */}
            <aside className="fixed inset-y-0 left-0 z-50 hidden w-55 border-r border-border-subtle bg-background md:flex md:flex-col">
                {/* Brand Header */}
                <div className="px-5 pt-7">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2.5 text-[15px] font-semibold tracking-[-0.03em] text-foreground hover:opacity-90 transition-opacity"
                    >
                        <StudidexLogo size={20} />
                        <span>Studidex</span>
                    </Link>
                </div>

                {/* Primary navigation */}
                <nav className="flex-1 px-3 pt-12">
                    <p className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground-faint">
                        Your academics
                    </p>

                    <div className="space-y-1">
                        {navigation.map((item) => {
                            const active = pathname === item.href;
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    aria-current={active ? "page" : undefined}
                                    className="relative block"
                                >
                                    {active && (
                                        <motion.div
                                            layoutId="navigation-active"
                                            className="absolute inset-0 rounded-xl bg-inverse"
                                            transition={spring}
                                        />
                                    )}

                                    <div
                                        className={`relative flex h-10 items-center gap-3 rounded-xl px-3 text-[13px] font-medium transition-colors ${
                                            active
                                                ? "text-inverse-foreground"
                                                : "text-foreground-muted hover:text-foreground hover:bg-surface-subtle/50"
                                        }`}
                                    >
                                        <Icon
                                            size={17}
                                            strokeWidth={1.8}
                                            className="shrink-0"
                                        />
                                        <span>{item.label}</span>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                {/* Secondary actions & Theme Switcher (Profile, Settings, Admin, Theme) */}
                <div className="px-3 pb-5 space-y-1">
                    {/* Cloud Auth & Database Sync Card */}
                    <div className="rounded-2xl border border-border bg-surface p-3 mb-2 shadow-2xs space-y-2.5">
                        {isAuthenticated && user ? (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground text-surface text-[11px] font-bold">
                                            {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[12px] font-semibold text-foreground truncate">
                                                {user.name || user.email.split("@")[0]}
                                            </p>
                                            <div className="flex items-center gap-1.5 text-[10px] text-green-700 dark:text-green-300 font-medium">
                                                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                                                <span>{isSyncing ? "Syncing..." : "Database Synced"}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={logout}
                                        className="text-foreground-muted hover:text-foreground p-1 rounded-md hover:bg-surface-subtle transition-colors cursor-pointer"
                                        title="Log out"
                                    >
                                        <LogOut size={13} />
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    onClick={syncWithCloud}
                                    disabled={isSyncing}
                                    className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-border-subtle bg-surface-subtle/50 py-1.5 text-[11.5px] font-medium text-foreground hover:bg-surface-subtle active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
                                >
                                    <RefreshCw size={12} className={isSyncing ? "animate-spin text-foreground" : "text-foreground-muted"} />
                                    <span>{isSyncing ? "Syncing Cloud..." : "Sync Database Now"}</span>
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-subtle text-foreground">
                                        <Cloud size={14} />
                                    </div>
                                    <div>
                                        <p className="text-[12px] font-semibold text-foreground">Cloud Database</p>
                                        <p className="text-[10px] text-foreground-muted">Offline Ready</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsAuthOpen(true)}
                                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-foreground py-1.5 text-[11.5px] font-semibold text-surface hover:opacity-90 active:scale-98 transition-all cursor-pointer"
                                >
                                    <LogIn size={12} />
                                    <span>Sync & Backup</span>
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="h-px bg-border-subtle mb-2" />

                    {/* Academic Profile */}
                    <Link href="/profile" className="block">
                        <div
                            className={`flex h-10 items-center gap-3 rounded-xl px-3 text-[13px] font-medium transition-colors ${
                                pathname === "/profile"
                                    ? "bg-surface text-foreground font-semibold shadow-2xs"
                                    : "text-foreground-muted hover:bg-surface-subtle hover:text-foreground"
                            }`}
                        >
                            <User size={17} strokeWidth={1.8} />
                            <span>Profile</span>
                        </div>
                    </Link>

                    {/* App Settings */}
                    <Link href="/settings" className="block">
                        <div
                            className={`flex h-10 items-center gap-3 rounded-xl px-3 text-[13px] font-medium transition-colors ${
                                pathname === "/settings"
                                    ? "bg-surface text-foreground font-semibold shadow-2xs"
                                    : "text-foreground-muted hover:bg-surface-subtle hover:text-foreground"
                            }`}
                        >
                            <Settings size={17} strokeWidth={1.8} />
                            <span>Settings</span>
                        </div>
                    </Link>

                    {/* Admin Curation Portal */}
                    <Link href="/admin" className="block">
                        <div
                            className={`flex h-10 items-center justify-between rounded-xl px-3 text-[13px] font-medium transition-colors ${
                                pathname === "/admin"
                                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/20"
                                    : "text-foreground-muted hover:bg-surface-subtle hover:text-foreground"
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <ShieldCheck size={17} strokeWidth={1.8} className="text-amber-600 dark:text-amber-400" />
                                <span>Admin Panel</span>
                            </div>
                            {hasAdminAccess && (
                                <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[9.5px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                                    Live
                                </span>
                            )}
                        </div>
                    </Link>

                    {/* 3-Theme Dropdown (Light / Dark / System) */}
                    <div className="pt-1.5">
                        <ThemeToggle variant="dropdown-button" />
                    </div>
                </div>
            </aside>

            {/* Mobile Docked Bottom Navigation Bar */}
            {/* Pinned directly to the bottom with labels always fitted in bottom */}
            <nav
                aria-label="Mobile Navigation"
                className="fixed bottom-0 inset-x-0 z-40 md:hidden border-t border-border-subtle bg-background/90 backdrop-blur-xl pb-[max(env(safe-area-inset-bottom,0px),4px)] pt-1 px-1 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.45)]"
            >
                <div className="flex items-center justify-around max-w-lg mx-auto">
                    {navigation.map((item) => {
                        const active = pathname === item.href;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                aria-current={active ? "page" : undefined}
                                className={`relative flex flex-1 flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-all duration-150 active:scale-95 ${
                                    active
                                        ? "text-foreground font-semibold"
                                        : "text-foreground-muted hover:text-foreground"
                                }`}
                            >
                                {/* Active indicator pill background */}
                                {active && (
                                    <span className="absolute inset-x-1.5 inset-y-0.5 -z-10 rounded-xl bg-surface-subtle/80 border border-border-subtle" />
                                )}

                                <div className="relative flex items-center justify-center">
                                    <Icon
                                        size={19}
                                        strokeWidth={active ? 2.3 : 1.8}
                                        className={`transition-transform duration-150 ${active ? "scale-105" : ""}`}
                                    />
                                    {active && (
                                        <span className="absolute -top-1 right-[-4px] h-1.5 w-1.5 rounded-full bg-foreground" />
                                    )}
                                </div>

                                {/* Label cleanly fitted on the bottom */}
                                <span
                                    className={`mt-1 text-[10px] sm:text-[10.5px] leading-none tracking-tight text-center truncate max-w-[56px] ${
                                        active
                                            ? "text-foreground font-semibold"
                                            : "text-foreground-muted"
                                    }`}
                                >
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}