"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Check, Search } from "lucide-react";

export interface CustomSelectOption {
    value: string;
    label: string;
    description?: string;
    badge?: string;
}

interface CustomSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: CustomSelectOption[];
    placeholder?: string;
    icon?: React.ReactNode;
    className?: string;
    triggerClassName?: string;
    menuClassName?: string;
    disabled?: boolean;
    searchable?: boolean;
}

export function CustomSelect({
    value,
    onChange,
    options,
    placeholder = "Select an option",
    icon,
    className = "",
    triggerClassName = "",
    menuClassName = "",
    disabled = false,
    searchable = false,
}: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Selected option display
    const selectedOption = options.find((opt) => opt.value === value);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("keydown", handleKeyDown);
            if (searchable && searchInputRef.current) {
                searchInputRef.current.focus();
            }
        }
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, searchable]);

    // Filter options if search query exists
    const filteredOptions = searchQuery.trim()
        ? options.filter((opt) =>
            opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            opt.description?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : options;

    const handleSelect = (val: string) => {
        onChange(val);
        setIsOpen(false);
        setSearchQuery("");
    };

    return (
        <div ref={containerRef} className={`relative inline-block w-full text-left ${className}`}>
            {/* Trigger Button */}
            <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen((prev) => !prev)}
                className={`flex w-full items-center justify-between gap-2.5 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-left text-[13px] font-medium text-foreground shadow-2xs transition-all hover:border-foreground/40 focus:border-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${isOpen ? "border-foreground ring-1 ring-foreground/20" : ""
                    } ${triggerClassName}`}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <div className="flex items-center gap-2.5 overflow-hidden">
                    {icon && <span className="shrink-0 text-foreground-muted">{icon}</span>}
                    <span className="truncate">
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    {selectedOption?.badge && (
                        <span className="shrink-0 rounded-md bg-surface-subtle px-1.5 py-0.5 text-[10.5px] font-bold uppercase text-foreground-muted">
                            {selectedOption.badge}
                        </span>
                    )}
                </div>

                <ChevronDown
                    size={14}
                    className={`shrink-0 text-foreground-muted transition-transform duration-200 ${isOpen ? "rotate-180 text-foreground" : ""
                        }`}
                />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.98 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className={`absolute left-0 z-50 mt-1.5 max-h-72 w-full min-w-50 overflow-hidden rounded-xl border border-border bg-surface shadow-xl backdrop-blur-md ${menuClassName}`}
                    >
                        {/* Optional search input */}
                        {(searchable || options.length > 7) && (
                            <div className="border-b border-border-subtle p-2">
                                <div className="relative">
                                    <Search
                                        size={13}
                                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-foreground-muted"
                                    />
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search..."
                                        className="w-full rounded-lg border border-border-subtle bg-surface-subtle/50 py-1.5 pl-8 pr-2.5 text-[12px] text-foreground placeholder:text-foreground-faint focus:border-foreground focus:outline-none"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Options List */}
                        <div className="max-h-60 overflow-y-auto p-1 space-y-0.5">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((opt) => {
                                    const isSelected = opt.value === value;
                                    return (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => handleSelect(opt.value)}
                                            className={`group flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[12.5px] transition-colors ${isSelected
                                                    ? "bg-foreground text-surface font-semibold"
                                                    : "text-foreground hover:bg-surface-subtle"
                                                }`}
                                            role="option"
                                            aria-selected={isSelected}
                                        >
                                            <div className="flex-1 pr-2">
                                                <div className="flex items-center gap-2">
                                                    <span>{opt.label}</span>
                                                    {opt.badge && (
                                                        <span
                                                            className={`rounded px-1.5 py-0.2 text-[10px] font-bold uppercase ${isSelected
                                                                    ? "bg-surface/20 text-surface"
                                                                    : "bg-surface-subtle text-foreground-muted"
                                                                }`}
                                                        >
                                                            {opt.badge}
                                                        </span>
                                                    )}
                                                </div>
                                                {opt.description && (
                                                    <p
                                                        className={`text-[11px] line-clamp-1 ${isSelected
                                                                ? "text-surface/80"
                                                                : "text-foreground-muted"
                                                            }`}
                                                    >
                                                        {opt.description}
                                                    </p>
                                                )}
                                            </div>

                                            {isSelected && (
                                                <Check
                                                    size={14}
                                                    strokeWidth={2.5}
                                                    className="shrink-0 text-surface"
                                                />
                                            )}
                                        </button>
                                    );
                                })
                            ) : (
                                <div className="px-3 py-4 text-center text-[12px] text-foreground-muted">
                                    No matches found
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
