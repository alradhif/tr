function buildWaveLines() {
  const lines: { d: string; opacity: number }[] = []
  const count = 26
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1)
    const startY = 620 + t * 760
    const dip = 90 + t * 40
    const endY = startY - 60 - t * 30
    const d = `M -40 ${startY} C 480 ${startY - dip}, 1040 ${startY - dip * 1.4}, 1600 ${endY - 40} C 2080 ${endY - 90}, 2320 ${endY - 160}, 2480 ${endY - 260}`
    const opacity = 0.16 + (1 - Math.abs(t - 0.5) * 2) * 0.22
    lines.push({ d, opacity: Math.max(0.08, Math.min(0.4, opacity)) })
  }
  return lines
}

function buildRayLines() {
  const lines: { x1: number; y1: number; x2: number; y2: number; opacity: number }[] = []
  const count = 34
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1)
    const originX = 2560 - t * 260
    const x1 = originX
    const y1 = -60 + t * 40
    const x2 = originX - 520 - t * 120
    const y2 = 900 + t * 260
    const opacity = 0.1 + (1 - t) * 0.28
    lines.push({ x1, y1, x2, y2, opacity })
  }
  return lines
}

const waveLines = buildWaveLines()
const rayLines = buildRayLines()

export function AuthBackground() {
  return (
    <svg
      className="auth-bg"
      viewBox="0 0 2560 1440"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="authBgFill" x1="0%" y1="0%" x2="70%" y2="100%">
          <stop offset="0%" stopColor="#fbfcfb" />
          <stop offset="45%" stopColor="#eef4ee" />
          <stop offset="100%" stopColor="#d9ecdd" />
        </linearGradient>
        <linearGradient id="authRayFill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#17b26a" />
          <stop offset="100%" stopColor="#8fd6ab" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="2560" height="1440" fill="url(#authBgFill)" />
      <g stroke="#17b26a" fill="none" strokeWidth="1.6">
        {waveLines.map((line, i) => (
          <path key={i} d={line.d} opacity={line.opacity} />
        ))}
      </g>
      <g stroke="url(#authRayFill)" strokeWidth="2">
        {rayLines.map((line, i) => (
          <line key={i} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} opacity={line.opacity} />
        ))}
      </g>
    </svg>
  )
}
