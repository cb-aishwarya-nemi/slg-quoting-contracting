interface MessageCircleInfoIconProps {
  size?: number
  strokeWidth?: number
  className?: string
  'aria-label'?: string
}

/**
 * Lucide has no message-circle-info, so this pairs lucide's speech-bubble path
 * with an "i" glyph — same geometry as MessageCircleQuestionMark beside it.
 */
export function MessageCircleInfoIcon({
  size = 14,
  strokeWidth = 2.25,
  className,
  'aria-label': ariaLabel,
}: MessageCircleInfoIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={ariaLabel ? 'img' : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
    >
      <path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719" />
      <path d="M12 8h.01" />
      <path d="M12 12v4" />
    </svg>
  )
}
