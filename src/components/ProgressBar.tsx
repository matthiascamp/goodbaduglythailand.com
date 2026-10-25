interface ProgressBarProps {
  value: number; // 0–100
  label?: string;
  showPercent?: boolean;
  size?: "sm" | "md" | "lg";
  color?: "gold" | "emerald" | "burgundy";
}

const colorMap = {
  gold: "bg-gold",
  emerald: "bg-emerald",
  burgundy: "bg-burgundy",
};

const heightMap = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

export default function ProgressBar({
  value,
  label,
  showPercent = true,
  size = "md",
  color = "gold",
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div>
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-1">
          {label && (
            <span className="text-xs font-medium text-charcoal/70">{label}</span>
          )}
          {showPercent && (
            <span className="text-xs font-semibold text-charcoal/60 ml-auto">
              {clamped}%
            </span>
          )}
        </div>
      )}
      <div
        className={`w-full bg-cream-dark rounded-full overflow-hidden ${heightMap[size]}`}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`${heightMap[size]} ${colorMap[color]} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
