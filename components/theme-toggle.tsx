"use client";

import { useState, useRef, useEffect } from "react";
import { Sun, Moon, Laptop, Check, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useTheme, useHydrated } from "@wrksz/themes/client";

interface ThemeToggleProps {
    variant?: "icon" | "segmented" | "dropdown-button";
    className?: string;
}

export function ThemeToggle({ variant = "icon", className = "" }: ThemeToggleProps) {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const isHydrated = useHydrated();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    if (!isHydrated) {
        if (variant === "segmented" || variant === "dropdown-button") {
            return (
                <div className={`flex h-10 w-full items-center rounded-xl border border-border-subtle bg-surface-subtle/40 p-1 ${className}`} />
            );
        }
        return (
            <div className={`h-8 w-8 rounded-lg border border-border-subtle bg-surface-subtle/50 ${className}`} />
        );
    }

    const CurrentIcon =
        theme === "system" ? Laptop : resolvedTheme === "dark" ? Moon : Sun;

    const currentLabel =
        theme === "system"
            ? "System Theme"
            : theme === "dark"
            ? "Dark Mode"
            : "Light Mode";

    const THEME_OPTIONS = [
        { key: "light", label: "Light", icon: Sun },
        { key: "dark", label: "Dark", icon: Moon },
        { key: "system", label: "System", icon: Laptop },
    ] as const;

    // Segmented variant (used in Settings)
    if (variant === "segmented") {
        return (
            <div className={`flex items-center rounded-xl border border-border-subtle bg-surface-subtle/60 p-1 text-[12px] font-medium text-foreground-muted ${className}`}>
                {THEME_OPTIONS.map(({ key, label, icon: Icon }) => {
                    const active = theme === key;
                    return (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setTheme(key)}
                            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 transition-all ${
                                active
                                    ? "bg-surface text-foreground font-semibold shadow-2xs"
                                    : "hover:text-foreground"
                            }`}
                            title={`${label} theme`}
                        >
                            <Icon size={13} />
                            <span>{label}</span>
                        </button>
                    );
                })}
            </div>
        );
    }

    // Dropdown Button variant (used in Sidebar)
    if (variant === "dropdown-button") {
        return (
            <div ref={dropdownRef} className={`relative block w-full text-left ${className}`}>
                <button
                    type="button"
                    onClick={() => setIsOpen((prev) => !prev)}
                    className="flex h-10 w-full items-center justify-between rounded-xl px-3 text-[13px] font-medium text-foreground-muted hover:bg-surface-subtle hover:text-foreground transition-colors border border-border-subtle/60 bg-surface/40"
                    aria-label={`Theme: ${theme}. Click to switch theme.`}
                    aria-haspopup="true"
                    aria-expanded={isOpen}
                >
                    <div className="flex items-center gap-2.5">
                        <CurrentIcon size={16} strokeWidth={1.8} className="shrink-0 text-foreground" />
                        <span className="text-[12.5px] font-medium text-foreground">{currentLabel}</span>
                    </div>

                    <ChevronDown
                        size={14}
                        className={`text-foreground-muted transition-transform duration-200 ${
                            isOpen ? "rotate-180 text-foreground" : ""
                        }`}
                    />
                </button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 4 }}
                            transition={{ duration: 0.15 }}
                            className="absolute bottom-full left-0 mb-1.5 z-50 w-full overflow-hidden rounded-xl border border-border bg-surface p-1 shadow-xl backdrop-blur-md"
                        >
                            {THEME_OPTIONS.map(({ key, label, icon: Icon }) => {
                                const active = theme === key;
                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => {
                                            setTheme(key);
                                            setIsOpen(false);
                                        }}
                                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[12px] transition-colors ${
                                            active
                                                ? "bg-foreground text-surface font-semibold"
                                                : "text-foreground-muted hover:bg-surface-subtle hover:text-foreground"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Icon size={14} />
                                            <span>{label}</span>
                                        </div>
                                        {active && <Check size={12} strokeWidth={2.5} />}
                                    </button>
                                );
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    // Icon variant with dropdown (used in Header)
    return (
        <div ref={dropdownRef} className={`relative inline-block text-left ${className}`}>
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle bg-surface text-foreground-muted hover:border-foreground/30 hover:text-foreground active:scale-95 transition-all"
                aria-label={`Theme: ${theme}. Click to switch theme.`}
                aria-haspopup="true"
                aria-expanded={isOpen}
            >
                <CurrentIcon size={15} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 z-50 mt-1.5 w-36 overflow-hidden rounded-xl border border-border bg-surface p-1 shadow-xl backdrop-blur-md"
                    >
                        {THEME_OPTIONS.map(({ key, label, icon: Icon }) => {
                            const active = theme === key;
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => {
                                        setTheme(key);
                                        setIsOpen(false);
                                    }}
                                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[12px] transition-colors ${
                                        active
                                            ? "bg-foreground text-surface font-semibold"
                                            : "text-foreground-muted hover:bg-surface-subtle hover:text-foreground"
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <Icon size={13} />
                                        <span>{label}</span>
                                    </div>
                                    {active && <Check size={12} strokeWidth={2.5} />}
                                </button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
