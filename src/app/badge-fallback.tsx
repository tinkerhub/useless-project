// Same scalloped-seal medal the handbook's prize section falls back to when a prize has no
// badge image yet (see PrizeMedal in handbook/page.tsx) - duplicated here rather than imported
// so the two pages don't have to share a component just for this, but kept visually identical.
function buildSealPath(cx: number, cy: number, outerR: number, innerR: number, points: number) {
  const step = Math.PI / points;
  let d = "";
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = i * step - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    d += `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)} `;
  }
  return `${d}Z`;
}
const SEAL_PATH = buildSealPath(50, 42, 42, 36, 12);

export default function BadgeFallback({ size = 76 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 108" width={size} height={size * 1.08} aria-hidden="true">
      <path d="M38,72 L28,104 L50,90 Z" fill="#1b352a" />
      <path d="M62,72 L72,104 L50,90 Z" fill="#244638" />
      <path d={SEAL_PATH} fill="#ea34df" />
      <circle cx="50" cy="42" r="28" fill="#fff" />
      <circle cx="50" cy="42" r="28" fill="none" stroke="#ea34df" strokeWidth="2" strokeDasharray="3 3.5" />
      <text x="50" y="53" textAnchor="middle" fontSize="30" fill="#ea34df" style={{ fontFamily: "var(--font-drowner)" }}>
        ★
      </text>
    </svg>
  );
}
