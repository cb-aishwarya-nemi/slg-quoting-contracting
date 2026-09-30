import { useState } from 'react'

/**
 * Excel-style comment marker: a black triangle in the cell's top-right corner.
 * The note shows while the triangle is hovered.
 */
export function ExcelCommentMark({
  message,
  cornerOffset = 0,
}: {
  message: string
  /** Shift toward a column rule that sits just outside the cell box. */
  cornerOffset?: number
}) {
  const [open, setOpen] = useState(false)

  return (
    <span
      className="absolute top-0 z-30 h-2 w-2"
      style={{ right: -cornerOffset }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={(event) => event.stopPropagation()}
    >
      <span
        aria-hidden
        className={`absolute right-0 top-0 h-0 w-0 border-l-[8px] border-t-[8px] border-solid border-l-transparent transition-colors ${open ? 'border-t-white' : 'border-t-black'}`}
      />
      <span className="sr-only">{message}</span>
      {open ? (
        <span
          role="tooltip"
          className="absolute right-0 top-3 z-40 w-max max-w-[240px] whitespace-normal rounded border border-[#e6d98a] bg-[#fff8d6] px-2 py-1 text-left text-[12px] font-normal normal-case leading-snug text-brand-navy shadow-md"
        >
          {message}
        </span>
      ) : null}
    </span>
  )
}
