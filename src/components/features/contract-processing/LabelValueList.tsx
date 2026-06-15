import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { type LabelValue } from '@/data/contractProcessingMock'
import { cn } from '@/lib/utils'

interface EditableValueProps {
  value: string
  onChange?: (value: string) => void
}

function EditableValue({ value, onChange }: EditableValueProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleClick = () => {
    setIsEditing(true)
    setEditValue(value)
  }

  const handleBlur = () => {
    setIsEditing(false)
    if (onChange && editValue !== value) {
      onChange(editValue)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur()
    }
    if (e.key === 'Escape') {
      setEditValue(value)
      setIsEditing(false)
    }
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="flex-1 bg-neutral-100 px-2 py-0.5 -my-0.5 -mx-2 rounded text-[14px] font-medium text-brand-navy outline-none"
      />
    )
  }

  return (
    <span
      onClick={handleClick}
      className={cn(
        'cursor-pointer text-[14px] font-medium text-blue-700 transition-colors',
        'hover:text-brand-navy'
      )}
    >
      {value}
    </span>
  )
}

interface SelectableValueProps {
  value: string
  options: string[]
  onChange?: (value: string) => void
}

function SelectableValue({ value, options, onChange }: SelectableValueProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
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

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex cursor-pointer items-center gap-1.5 text-[14px] font-medium text-blue-700 transition-colors',
          'hover:text-brand-navy'
        )}
      >
        <span>{value}</span>
        <ChevronDown size={14} className="text-brand-mist" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[200px] rounded-lg border border-neutral-200 bg-white py-1 shadow-lg">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                onChange?.(option)
                setIsOpen(false)
              }}
              className={cn(
                'w-full px-3 py-2 text-left text-[14px] transition-colors',
                option === value
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
  )
}

interface LabelValueListProps {
  items: LabelValue[]
  onItemChange?: (label: string, newValue: string) => void
}

/**
 * Label (12px caps, navy) + value (14px, blue-700) rows on a 36px rhythm, each
 * separated by a hairline divider. Values are editable on click.
 * Fields with options render as dropdowns.
 */
export function LabelValueList({ items, onItemChange }: LabelValueListProps) {
  return (
    <div>
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center border-b border-neutral-200"
          style={{ height: 36 }}
        >
          <span className="w-[210px] shrink-0 text-[12px] uppercase tracking-[-0.25px] text-brand-navy">
            {item.label}
          </span>
          {item.options ? (
            <SelectableValue
              value={item.value}
              options={item.options}
              onChange={(newValue) => onItemChange?.(item.label, newValue)}
            />
          ) : (
            <EditableValue
              value={item.value}
              onChange={(newValue) => onItemChange?.(item.label, newValue)}
            />
          )}
        </div>
      ))}
    </div>
  )
}

export default LabelValueList
