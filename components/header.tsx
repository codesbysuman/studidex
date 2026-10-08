import Link from "next/link";
import { Plus } from "lucide-react";
import { StudidexLogo } from "./logo";

export default function Header({ className = "" }: { className?: string }) {
  return (
    <header
      className={`sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-border-subtle bg-background/90 px-5 backdrop-blur-md md:hidden ${className}`}
    >
      <Link
        href="/"
        className="inline-flex items-center gap-2.5 text-[17px] font-semibold tracking-[-0.03em] text-foreground"
      >
        <StudidexLogo size={22} />
        <span>Studidex</span>
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