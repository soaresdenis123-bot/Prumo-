// Logo do Prumo — o fio de prumo (fio + peso)
export default function PlumbMark({ size = 28, ink = 'currentColor', accent = 'var(--accent)' }) {
  const w = size * (64 / 84)
  return (
    <svg width={w} height={size} viewBox="0 0 64 84" fill="none" aria-hidden="true">
      <circle cx="32" cy="7" r="3.6" fill={ink} />
      <line x1="32" y1="10.6" x2="32" y2="40" stroke={ink} strokeWidth="2.4" />
      <polygon points="32,39 45,50 32,79 19,50" fill={accent} />
      <line x1="32" y1="39" x2="32" y2="79" stroke="#fff" strokeWidth="1.2" opacity="0.5" />
    </svg>
  )
}
