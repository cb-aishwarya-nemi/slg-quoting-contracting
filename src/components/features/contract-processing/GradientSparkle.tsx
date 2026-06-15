import { useId } from 'react'

interface GradientSparkleProps {
  size?: number
  strokeWidth?: number
}

/**
 * Static orange → violet gradient 4-point sparkle, used to denote AI-authored
 * surfaces (the contract "Summary" and APEX AI comments).
 */
export function GradientSparkle({ size = 16, strokeWidth = 2 }: GradientSparkleProps) {
  const id = useId()

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id={id} x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ff3300" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <path
        d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.962 0z"
        stroke={`url(#${id})`}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default GradientSparkle
