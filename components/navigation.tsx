"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
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
    const { user, isAuthenticated, logout, isDbConnected, isSyncing, syncWithCloud } = useStudidex();
    const [isAuthOpen, setIsAuthOpen] = useState(false);

    return (
        <>
            <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

            {/* Desktop sidebar */}
            <aside className="fixed inset-y-0 left-0 z-50 hidden w-55 border-r border-border-subtle bg-background md:flex md:flex-col">
                {/* Brand */}
                <div className="px-5 pt-7">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2.5 text-[15px] font-semibold tracking-[-0.03em] text-foreground"
                    >
                        <StudidexLogo size={20} />
                        <span>Studidex</span>
                    </Link>
                </div>

                {/* Primary navigation */}
                <nav className="flex-1 px-3 pt-14">
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

                                    <motion.div
                                        whileHover={{ x: 2 }}
                                        whileTap={{ scale: 0.98 }}
                                        transition={spring}
                                        className={`relative flex h-10 items-center gap-3 rounded-xl px-3 text-[13px] font-medium ${active
                                            ? "text-inverse-foreground"
                                            : "text-foreground-muted hover:text-foreground"
                                            }`}
                                    >
                                        <Icon
                                            size={17}
                                            strokeWidth={1.8}
                                            className="shrink-0"
                                        />

                                        <span>{item.label}</span>
                                    </motion.div>
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                {/* Secondary actions & Theme Switcher (Profile, Settings, Theme) */}
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
                                        className="text-foreground-muted hover:text-foreground p-1 rounded-md hover:bg-surface-subtle transition-colors"
                                        title="Log out"
                                    >
                                        <LogOut size={13} />
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    onClick={syncWithCloud}
                                    disabled={isSyncing}
                                    className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-border-subtle bg-surface-subtle/50 py-1.5 text-[11.5px] font-medium text-foreground hover:bg-surface-subtle active:scale-98 transition-all disabled:opacity-50"
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
                                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-foreground py-1.5 text-[11.5px] font-semibold text-surface hover:opacity-90 active:scale-98 transition-all"
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
                        <motion.div
                            whileHover={{ x: 2 }}
                            whileTap={{ scale: 0.98 }}
                            transition={spring}
                            className={`flex h-10 items-center gap-3 rounded-xl px-3 text-[13px] font-medium transition-colors ${pathname === "/profile"
                                ? "bg-surface text-foreground font-semibold shadow-2xs"
                                : "text-foreground-muted hover:bg-surface-subtle hover:text-foreground"
                                }`}
                        >
                            <User size={17} strokeWidth={1.8} />
                            <span>Profile</span>
                        </motion.div>
                    </Link>

                    {/* App Settings */}
                    <Link href="/settings" className="block">
                        <motion.div
                            whileHover={{ x: 2 }}
                            whileTap={{ scale: 0.98 }}
                            transition={spring}
                            className={`flex h-10 items-center gap-3 rounded-xl px-3 text-[13px] font-medium transition-colors ${pathname === "/settings"
                                ? "bg-surface text-foreground font-semibold shadow-2xs"
                                : "text-foreground-muted hover:bg-surface-subtle hover:text-foreground"
                                }`}
                        >
                            <Settings size={17} strokeWidth={1.8} />
                            <span>Settings</span>
                        </motion.div>
                    </Link>

                    {/* 3-Theme Dropdown (Light / Dark / System) */}
                    <div className="pt-1.5">
                        <ThemeToggle variant="dropdown-button" />
                    </div>
                </div>
            </aside>

            {/* Mobile floating navigation */}
            <motion.nav
                layout
                className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center rounded-2xl border border-border bg-inverse p-1.5 shadow-[0_12px_40px_rgb(0_0_0/0.16)] md:hidden"
                transition={spring}
            >
                {navigation.map((item) => {
                    const active = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            aria-current={active ? "page" : undefined}
                            className="relative"
                        >
                            <motion.div
                                layout
                                whileTap={{ scale: 0.92 }}
                                transition={spring}
                                className={`relative flex h-11 items-center overflow-hidden rounded-xl px-3 ${active
                                    ? "text-inverse"
                                    : "text-inverse-foreground/50 hover:text-inverse-foreground"
                                    }`}
                            >
                                {active && (
                                    <motion.div
                                        layoutId="mobile-navigation-active"
                                        className="absolute inset-0 rounded-xl bg-inverse-foreground"
                                        transition={spring}
                                    />
                                )}

                                <span className="relative z-10 flex items-center gap-2">
                                    <Icon size={18} strokeWidth={1.8} />

                                    <motion.span
                                        initial={false}
                                        animate={{
                                            width: active ? "auto" : 0,
                                            opacity: active ? 1 : 0,
                                        }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 500,
                                            damping: 35,
                                            mass: 0.6,
                                        }}
                                        className="overflow-hidden whitespace-nowrap text-[12px] font-medium"
                                    >
                                        {item.label}
                                    </motion.span>
                                </span>
                            </motion.div>
                        </Link>
                    );
                })}
            </motion.nav>
        </>
    );
}