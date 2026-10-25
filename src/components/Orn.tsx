/** Thai-influenced ornaments: lotus-bud mark, kanok rule and centred divider. */

export function LotusMark({ size = 26 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={Math.round(size * 30 / 26)} viewBox="0 0 26 30" className="orn-mark">
      <path d="M13 1 C18 9 24 14 13 29 C2 14 8 9 13 1 Z" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M13 9 C15.5 13 18 16 13 23 C8 16 10.5 13 13 9 Z" fill="currentColor" />
    </svg>
  );
}

export function KanokRule() {
  return (
    <svg aria-hidden="true" width="100%" height="14" className="orn-rule">
      <defs>
        <pattern id="kanokRule" width="40" height="14" patternUnits="userSpaceOnUse">
          <line x1="0" y1="7" x2="13" y2="7" stroke="currentColor" strokeWidth="0.8" />
          <path d="M20 1 C23 5 26 8 20 13 C14 8 17 5 20 1 Z" fill="none" stroke="currentColor" strokeWidth="0.9" />
          <line x1="27" y1="7" x2="40" y2="7" stroke="currentColor" strokeWidth="0.8" />
        </pattern>
      </defs>
      <rect width="100%" height="14" fill="url(#kanokRule)" opacity="0.7" />
    </svg>
  );
}

export function Divider() {
  return (
    <svg aria-hidden="true" width="140" height="22" viewBox="0 0 140 22" className="orn-divider">
      <line x1="0" y1="11" x2="54" y2="11" stroke="currentColor" strokeWidth="0.8" />
      <path d="M70 1 C75 7 80 11 70 21 C60 11 65 7 70 1 Z" fill="none" stroke="currentColor" strokeWidth="1" />
      <path d="M70 7 C72 10 74 12 70 16 C66 12 68 10 70 7 Z" fill="currentColor" />
      <line x1="86" y1="11" x2="140" y2="11" stroke="currentColor" strokeWidth="0.8" />
    </svg>
  );
}
