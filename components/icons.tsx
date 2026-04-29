type IconProps = { size?: number; className?: string }
const base = (size: number) => ({ width: size, height: size, viewBox: '0 0 14 14' })

export function Play({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden="true">
      <polygon points="3,2 11,7 3,12" fill="currentColor" />
    </svg>
  )
}

export function Pause({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden="true">
      <rect x="3" y="2" width="2.5" height="10" fill="currentColor" />
      <rect x="8.5" y="2" width="2.5" height="10" fill="currentColor" />
    </svg>
  )
}

export function Stop({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden="true">
      <rect x="2.5" y="2.5" width="9" height="9" fill="currentColor" />
    </svg>
  )
}

export function Log({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="miter">
      <path d="M3 1.5 L3 12.5 L7 9.5 L11 12.5 L11 1.5 Z" />
    </svg>
  )
}

export function LogOn({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden="true" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="miter">
      <path d="M3 1.5 L3 12.5 L7 9.5 L11 12.5 L11 1.5 Z" />
    </svg>
  )
}

export function Send({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
      <circle cx="3" cy="7" r="1.6" fill="currentColor" />
      <circle cx="11" cy="3" r="1.6" fill="currentColor" />
      <circle cx="11" cy="11" r="1.6" fill="currentColor" />
      <line x1="4.3" y1="6.3" x2="9.7" y2="3.7" />
      <line x1="4.3" y1="7.7" x2="9.7" y2="10.3" />
    </svg>
  )
}

export function Inspect({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
      <polyline points="2,5 2,2 5,2" />
      <polyline points="9,2 12,2 12,5" />
      <polyline points="12,9 12,12 9,12" />
      <polyline points="5,12 2,12 2,9" />
    </svg>
  )
}

export function Scan({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
      <path d="M1.5 3.5 L4 3.5 L7 10.5 L9.5 10.5" />
      <path d="M1.5 10.5 L4 10.5 L7 3.5 L9.5 3.5" />
      <polyline points="8,2 9.5,3.5 8,5" />
      <polyline points="8,9 9.5,10.5 8,12" />
    </svg>
  )
}

export function Discover({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="7" cy="7" r="5.5" />
      <circle cx="7" cy="7" r="2.5" />
      <line x1="7" y1="7" x2="11" y2="3" />
    </svg>
  )
}

export function Filter({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="miter">
      <polygon points="1.5,2 12.5,2 8,7.5 8,12 6,11 6,7.5" />
    </svg>
  )
}

export function MapPin({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="7" cy="5.5" r="2" />
      <path d="M7 1.5 C 4.5 1.5, 3 3.5, 3 5.5 C 3 8, 7 12.5, 7 12.5 C 7 12.5, 11 8, 11 5.5 C 11 3.5, 9.5 1.5, 7 1.5 Z" />
    </svg>
  )
}

export function Info({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="7" cy="7" r="5.5" />
      <line x1="7" y1="6" x2="7" y2="10" />
      <circle cx="7" cy="4" r="0.6" fill="currentColor" />
    </svg>
  )
}

export function Vol({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
      <polygon points="2,5 5,5 8,2 8,12 5,9 2,9" fill="currentColor" stroke="none" />
      <path d="M10 5 Q 11.5 7, 10 9" />
    </svg>
  )
}

export function Close({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
      <line x1="3" y1="3" x2="11" y2="11" />
      <line x1="11" y1="3" x2="3" y2="11" />
    </svg>
  )
}

export function Search({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
      <circle cx="6" cy="6" r="3.8" />
      <line x1="9" y1="9" x2="12" y2="12" />
    </svg>
  )
}

export function Rescan({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square">
      <path d="M2 7 A 5 5 0 1 1 7 12" />
      <polyline points="5,12 7,12 7,10" />
    </svg>
  )
}
