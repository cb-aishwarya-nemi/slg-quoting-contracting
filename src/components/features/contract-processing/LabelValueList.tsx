import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Pencil } from 'lucide-react'
import { type LabelValue } from '@/data/contractProcessingMock'
import { cn } from '@/lib/utils'

interface LabelValueRowProps {
  item: LabelValue
  onItemChange?: (label: string, newValue: string) => void
}

function LabelValueRow({ item, onItemChange }: LabelValueRowProps) {
  const isSelect = !!item.options

  // Shared editing/open state hoisted to row so the whole row triggers it
  const [isEditing, setIsEditing] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [editValue, setEditValue] = useState(item.value)
  const [dropdownPosition, setDropdownPosition] = useState<{ top?: string; bottom?: string }>({ top: '100%' })
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  // Calculate dropdown position on open
  useEffect(() => {
    if (!isOpen || !dropdownRef.current) return

    const timer = setTimeout(() => {
      const spaceBelow = window.innerHeight - dropdownRef.current!.getBoundingClientRect().top
      
      if (spaceBelow < 200) {
        setDropdownPosition({ bottom: '100%', top: 'auto' })
      } else {
        setDropdownPosition({ top: '100%', bottom: 'auto' })
      }
    }, 0)

    return () => clearTimeout(timer)
  }, [isOpen])

  // Close dropdown on outside click / Escape
  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleRowClick = () => {
    if (isEditing || isOpen) return
    if (isSelect) setIsOpen(true)
    else {
      setEditValue(item.value)
      setIsEditing(true)
    }
  }

  const handleBlur = () => {
    setIsEditing(false)
    if (onItemChange && editValue !== item.value) {
      onItemChange(item.label, editValue)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleBlur()
    if (e.key === 'Escape') {
      setEditValue(item.value)
      setIsEditing(false)
    }
  }

  return (
    <div
      onClick={handleRowClick}
      className={cn(
        'group row-hover-trail relative flex items-center border-b border-neutral-200 px-2',
        !isEditing && !isOpen && 'cursor-pointer hover:bg-brand-navy hover:border-brand-navy'
      )}
      style={{ height: 36 }}
    >
      <span className={cn(
        "w-[210px] shrink-0 text-[12px] uppercase tracking-[-0.25px] text-brand-navy transition-colors",
        "group-hover:text-white"
      )}>
        {item.label}
      </span>

      {/* Value area */}
      <div className="flex flex-1 items-center justify-between">
        {isSelect ? (
          <div ref={dropdownRef} className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className={cn(
                "flex cursor-pointer items-center gap-1.5 text-[14px] font-medium transition-colors",
                isEditing || isOpen ? "text-blue-700" : "text-blue-700 group-hover:text-white"
              )}
            >
              <span>{item.value}</span>
              <ChevronDown size={14} className={cn(
                "transition-colors",
                isEditing || isOpen ? "text-brand-mist" : "text-brand-mist group-hover:text-white/70"
              )} />
            </button>
            {isOpen && (
              <div
                className="absolute left-0 z-50 min-w-[200px] rounded-lg border border-neutral-200 bg-white py-1 shadow-lg"
                style={{
                  top: dropdownPosition.top as any,
                  bottom: dropdownPosition.bottom as any,
                  marginTop: dropdownPosition.top === '100%' ? '4px' : '0',
                  marginBottom: dropdownPosition.bottom === '100%' ? '4px' : '0',
                }}
              >
                {item.options!.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      onItemChange?.(item.label, option)
                      setIsOpen(false)
                    }}
                    className={cn(
                      'w-full px-3 py-2 text-left text-[14px] transition-colors',
                      option === item.value
                        ? 'bg-neutral-100 font-medium text-brand-navy'
                        : 'text-brand-navy hover:bg-neutral-50'
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="-mx-2 -my-0.5 flex-1 rounded bg-neutral-100 px-2 py-0.5 text-[14px] font-medium text-brand-navy outline-none"
          />
        ) : (
          <span className={cn(
            "text-[14px] font-medium transition-colors",
            isEditing || isOpen ? "text-blue-700" : "text-blue-700 group-hover:text-white"
          )}>
            {item.value}
          </span>
        )}

        {/* Edit icon - only visible on hover, positioned at the end */}
        {!isEditing && !isOpen && (
          <Pencil 
            size={14} 
            className="ml-2 opacity-0 text-white transition-opacity group-hover:opacity-100" 
          />
        )}
      </div>
    </div>
  )
}

interface LabelValueListProps {
  items: LabelValue[]
  onItemChange?: (label: string, newValue: string) => void
}

export function LabelValueList({ items, onItemChange }: LabelValueListProps) {
  return (
    <div>
      {items.map((item) => (
        <LabelValueRow key={item.label} item={item} onItemChange={onItemChange} />
      ))}
    </div>
  )
}

export default LabelValueList
