"use client";

import { useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { useStudidex } from "@/lib/use-studidex";

export interface HomeActionRowProps {
    id: string;
    title: string;
    description?: string;
    initialStatus?: string;
    variant: "overdue" | "today" | "next";
    dueText?: string;
    room?: string;
    marks?: string;
    units?: string;
}

export function HomeActionRow({
    id,
    title,
    description,
    initialStatus = "active",
    variant,
    dueText,
    room,
    marks,
    units,
}: HomeActionRowProps) {
    const { toggleAction } = useStudidex();
    const [status, setStatus] = useState(initialStatus);

    const isCompleted = status === "completed";

    const handleToggle = () => {
        const nextStatus = isCompleted ? "active" : "completed";
        setStatus(nextStatus);
        toggleAction(id);
    };

    if (variant === "overdue") {
        return (
            <div className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        type="button"
                        onClick={handleToggle}
                        className="text-foreground-muted hover:text-foreground cursor-pointer transition-transform active:scale-90 shrink-0"
                        aria-label={isCompleted ? "Mark incomplete" : "Mark complete"}
                    >
                        {isCompleted ? (
                            <CheckCircle2 size={18} className="text-foreground" />
                        ) : (
                            <Circle size={18} strokeWidth={1.8} />
                        )}
                    </button>
                    <span
                        className={`text-[13.5px] font-medium truncate ${
                            isCompleted ? "line-through text-foreground-muted" : "text-foreground"
                        }`}
                    >
                        {title}
                    </span>
                </div>
                {dueText && (
                    <span className="text-[12px] text-red-600 dark:text-red-400 shrink-0 ml-3">
                        {dueText}
                    </span>
                )}
            </div>
        );
    }

    if (variant === "today") {
        return (
            <div className="group flex items-center justify-between rounded-xl border border-border-subtle bg-surface p-4 transition-all hover:border-border">
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        type="button"
                        onClick={handleToggle}
                        className="text-foreground-muted hover:text-foreground transition-transform active:scale-95 cursor-pointer shrink-0"
                        aria-label={isCompleted ? "Mark incomplete" : "Mark complete"}
                    >
                        {isCompleted ? (
                            <CheckCircle2 size={19} className="text-foreground" />
                        ) : (
                            <Circle size={19} strokeWidth={1.8} />
                        )}
                    </button>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="rounded bg-surface-subtle px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted shrink-0">
                                Due Today
                            </span>
                            <h3
                                className={`text-[14.5px] font-medium truncate ${
                                    isCompleted
                                        ? "line-through text-foreground-muted"
                                        : "text-foreground"
                                }`}
                            >
                                {title}
                            </h3>
                        </div>
                        {description && (
                            <p className="mt-0.5 text-[12.5px] text-foreground-muted line-clamp-1">
                                {description}
                            </p>
                        )}
                    </div>
                </div>

                {room && (
                    <span className="hidden text-[12px] text-foreground-muted sm:inline shrink-0 ml-3">
                        {room}
                    </span>
                )}
            </div>
        );
    }

    // "next" variant
    return (
        <div className="flex items-center justify-between p-4 transition-colors hover:bg-surface-subtle/50">
            <div className="flex items-center gap-3 min-w-0">
                <button
                    type="button"
                    onClick={handleToggle}
                    className="text-foreground-muted hover:text-foreground cursor-pointer transition-transform active:scale-90 shrink-0"
                    aria-label={isCompleted ? "Mark incomplete" : "Mark complete"}
                >
                    {isCompleted ? (
                        <CheckCircle2 size={18} className="text-foreground" />
                    ) : (
                        <Circle size={18} strokeWidth={1.8} />
                    )}
                </button>

                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <h3
                            className={`text-[14px] font-medium truncate ${
                                isCompleted
                                    ? "line-through text-foreground-muted"
                                    : "text-foreground"
                            }`}
                        >
                            {title}
                        </h3>
                        {marks && (
                            <span className="text-[11px] text-foreground-faint shrink-0">
                                · {marks} marks
                            </span>
                        )}
                        {units && (
                            <span className="text-[11px] text-foreground-faint shrink-0">
                                · {units}
                            </span>
                        )}
                    </div>
                    {description && (
                        <p className="text-[12px] text-foreground-muted line-clamp-1">
                            {description}
                        </p>
                    )}
                </div>
            </div>

            {dueText && (
                <div className="flex items-center gap-3 text-right shrink-0 ml-3">
                    <span className="text-[12px] font-medium text-foreground">
                        {dueText}
                    </span>
                </div>
            )}
        </div>
    );
}
