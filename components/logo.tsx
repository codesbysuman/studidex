export function StudidexLogo({
  size = 24,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center rounded-lg bg-inverse text-inverse-foreground shadow-sm ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <span
        className="absolute rounded-full bg-amber-500"
        style={{
          top: Math.max(2, Math.round(size * 0.12)),
          right: Math.max(2, Math.round(size * 0.12)),
          width: Math.max(3, Math.round(size * 0.2)),
          height: Math.max(3, Math.round(size * 0.2)),
        }}
      />
      <span
        className="font-black leading-none select-none tracking-tight"
        style={{
          fontSize: Math.round(size * 0.62),
          marginTop: -1,
        }}
      >
        S
      </span>
    </span>
  );
}
