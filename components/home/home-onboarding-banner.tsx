"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { useStudidex } from "@/lib/use-studidex";

export function HomeOnboardingBanner({
    initialCompleted = false,
}: {
    initialCompleted?: boolean;
}) {
    const { updateProfile } = useStudidex();
    const [dismissed, setDismissed] = useState(initialCompleted);

    if (dismissed) return null;

    const handleDismiss = () => {
        setDismissed(true);
        updateProfile({ hasCompletedOnboarding: true });
    };

    return (
        <section className="relative overflow-hidden rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-2.5 py-0.5 text-[11px] font-semibold text-surface">
                            <Sparkles size={11} /> First-Time Setup
                        </span>
                        <span className="text-[12px] font-medium text-foreground-muted">
                            Tailor Studidex to your studies
                        </span>
                    </div>
                    <h3 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                        Personalize your academic workspace
                    </h3>
                    <p className="text-[13px] text-foreground-muted leading-relaxed">
                        Configure your stage (School, HS, College UG / PG), examining board or university, and your active semester papers (Core, SEC, DSE) so your schedule, exams, and materials are completely tailored to you.
                    </p>
                </div>
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0 w-full sm:w-auto">
                    <Link
                        href="/profile"
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-[13px] font-medium text-surface shadow-xs hover:opacity-90 active:scale-98 transition-all"
                    >
                        <span>Personalize Profile</span>
                        <ArrowRight size={14} />
                    </Link>
                    <button
                        type="button"
                        onClick={handleDismiss}
                        title="Dismiss setup"
                        className="rounded-xl border border-border px-3 py-2.5 text-[12.5px] font-medium text-foreground-muted hover:text-foreground hover:bg-surface-subtle transition-colors cursor-pointer"
                    >
                        Dismiss
                    </button>
                </div>
            </div>
        </section>
    );
}
