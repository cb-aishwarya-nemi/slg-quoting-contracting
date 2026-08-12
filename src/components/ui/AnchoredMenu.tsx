import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/utils'

/** Keeps menus off the viewport edge. */
const VIEWPORT_GUTTER = 8

interface AnchoredMenuProps {
  isOpen: boolean
  /** Trigger the menu hangs off — usually the button that opened it. */
  anchorRef: RefObject<HTMLElement | null>
  onClose: () => void
  /** Which anchor edge the menu lines up with. */
  align?: 'start' | 'end'
  /** 'auto' flips above the anchor when there isn't room below. */
  placement?: 'bottom' | 'top' | 'auto'
  /** Gap between anchor and menu, in px. */
  offset?: number
  matchAnchorWidth?: boolean
  className?: string
  style?: CSSProperties
  children: ReactNode
}

/**
 * Dropdown/ellipsis menus rendered into the body so scroll containers, sticky
 * columns and stacking contexts can't clip or bury them. Position is measured
 * from the anchor and refreshed while the page scrolls or resizes.
 */
export function AnchoredMenu({
  isOpen,
  anchorRef,
  onClose,
  align = 'start',
  placement = 'auto',
  offset = 4,
  matchAnchorWidth = false,
  className,
  style,
  children,
}: AnchoredMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [coords, setCoords] = useState<{ top: number; left: number; width?: number } | null>(null)

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current
    const menu = menuRef.current
    if (!anchor || !menu) return

    const anchorRect = anchor.getBoundingClientRect()
    const menuWidth = matchAnchorWidth ? anchorRect.width : menu.offsetWidth
    const menuHeight = menu.offsetHeight
    const spaceBelow = window.innerHeight - anchorRect.bottom
    const spaceAbove = anchorRect.top

    const openUp =
      placement === 'top' ||
      (placement === 'auto' &&
        spaceBelow < menuHeight + offset + VIEWPORT_GUTTER &&
        spaceAbove > spaceBelow)

    const rawLeft = align === 'end' ? anchorRect.right - menuWidth : anchorRect.left
    const maxLeft = Math.max(VIEWPORT_GUTTER, window.innerWidth - menuWidth - VIEWPORT_GUTTER)
    const left = Math.min(Math.max(VIEWPORT_GUTTER, rawLeft), maxLeft)

    const rawTop = openUp ? anchorRect.top - offset - menuHeight : anchorRect.bottom + offset
    const maxTop = Math.max(VIEWPORT_GUTTER, window.innerHeight - menuHeight - VIEWPORT_GUTTER)
    const top = Math.min(Math.max(VIEWPORT_GUTTER, rawTop), maxTop)

    setCoords({ top, left, width: matchAnchorWidth ? anchorRect.width : undefined })
  }, [align, anchorRef, matchAnchorWidth, offset, placement])

  useLayoutEffect(() => {
    if (!isOpen) {
      setCoords(null)
      return
    }
    updatePosition()
    window.addEventListener('resize', updatePosition)
    document.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      document.removeEventListener('scroll', updatePosition, true)
    }
  }, [isOpen, updatePosition])

  // Content can grow after open (async data, search filtering) — re-measure.
  useEffect(() => {
    if (!isOpen || !menuRef.current || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(updatePosition)
    observer.observe(menuRef.current)
    return () => observer.disconnect()
  }, [isOpen, updatePosition])

  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (menuRef.current?.contains(target)) return
      if (anchorRef.current?.contains(target)) return
      onClose()
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [anchorRef, isOpen, onClose])

  if (!isOpen) return null

  return createPortal(
    <div
      ref={menuRef}
      data-anchored-menu=""
      className={cn('fixed z-[9999]', className)}
      style={{
        top: coords?.top ?? 0,
        left: coords?.left ?? 0,
        width: coords?.width,
        visibility: coords ? undefined : 'hidden',
        ...style,
      }}
    >
      {children}
    </div>,
    document.body
  )
}

export default AnchoredMenu
