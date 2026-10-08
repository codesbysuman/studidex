import Link from "next/link";

export default function Header() {
    return (
        <header className="sticky top-0 z-40 flex h-16 items-center border-b border-border-subtle bg-background/90 px-5 backdrop-blur-md md:px-8">
            <Link
                href="/"
                className="inline-flex items-center text-xl font-semibold tracking-[-0.03em] text-foreground"
            >
                Studidex
            </Link>
        </header>
    );
}