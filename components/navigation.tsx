"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Bell,
    BookOpen,
    CalendarDays,
    CheckSquare,
    House,
    Plus,
    Settings,
} from "lucide-react";
import { motion } from "motion/react";
import { StudidexLogo } from "./logo";

const navigation = [
    {
        label: "Home",
        href: "/",
        icon: House,
    },
    {
        label: "Plan",
        href: "/plan",
        icon: CalendarDays,
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

    return (
        <>
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
                <nav className="flex-1 px-3 pt-20">
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
                                        className={`relative flex h-11 items-center gap-3 rounded-xl px-3 text-[13px] font-medium ${active
                                            ? "text-inverse-foreground"
                                            : "text-foreground-muted hover:text-foreground"
                                            }`}
                                    >
                                        <Icon
                                            size={18}
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

                {/* Secondary actions */}
                <div className="px-3 pb-5">
                    <div className="mb-3 h-px bg-border-subtle" />

                    <Link href="/add" className="block">
                        <motion.div
                            whileHover={{ x: 2 }}
                            whileTap={{ scale: 0.98 }}
                            transition={spring}
                            className="flex h-10 items-center gap-3 rounded-xl px-3 text-[13px] font-medium text-foreground-muted hover:bg-surface-subtle hover:text-foreground"
                        >
                            <Plus size={17} strokeWidth={1.8} />
                            <span>Add / Import</span>
                        </motion.div>
                    </Link>

                    <Link href="/settings" className="block">
                        <motion.div
                            whileHover={{ x: 2 }}
                            whileTap={{ scale: 0.98 }}
                            transition={spring}
                            className="flex h-10 items-center gap-3 rounded-xl px-3 text-[13px] font-medium text-foreground-muted hover:bg-surface-subtle hover:text-foreground"
                        >
                            <Settings size={17} strokeWidth={1.8} />
                            <span>Settings</span>
                        </motion.div>
                    </Link>
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