/**
 * ePassyar platform mark — the fixed brand icon for the software itself, as
 * opposed to the per-LGU seal (Municipality.logoUrl) which any municipality
 * uploads. This one is baked in and never changes: it identifies the platform
 * the way "Powered by ePassyar" does in the footer.
 *
 * A rounded badge with a pine-highland silhouette and an amber sun — the brand's
 * green canopy + cta-amber palette — kept legible down to ~20px.
 */
export default function EpassyarMark({
  size = 32,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="epm-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2E7D32" />
          <stop offset="1" stopColor="#0C330F" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#epm-bg)" />
      {/* sun */}
      <circle cx="22" cy="11" r="3.6" fill="#F5A524" />
      {/* back ridge */}
      <path d="M4 24 L12 14 L18 21 L23 16 L28 24 Z" fill="#57945D" opacity="0.9" />
      {/* front peak */}
      <path d="M2 25 L11 12.5 L20 25 Z" fill="#EAF6E2" />
      {/* snow/river accent on the front peak */}
      <path d="M11 12.5 L14 16.5 L12 18 L13 20 L9 20 L10.5 17.5 L9 16 Z" fill="#BFE8DE" opacity="0.85" />
    </svg>
  );
}
