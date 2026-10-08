// components/header.tsx
import Link from "next/link";
import { Plus } from "lucide-react";

export default function Header() {
    return (
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border-subtle bg-background/90 px-5 backdrop-blur-md md:px-8">
            <Link
                href="/"
                className="inline-flex items-center text-[17px] font-semibold tracking-[-0.03em] text-foreground"
            >
                Studidex
            </Link>

            <Link
                href="/add"
                className="inline-flex items-center gap-1 rounded-lg bg-inverse px-2.5 py-1 text-[12px] font-medium text-inverse-foreground transition-opacity hover:opacity-90"
            >
                <Plus size={14} />
                <span>Import</span>
            </Link>
        </header>
    );
}