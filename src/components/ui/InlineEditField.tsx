import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface InlineEditFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  helperText?: string
  className?: string
  inputClassName?: string
  type?: 'text' | 'email' | 'tel'
}

export function InlineEditField({
  label,
  value,
  onChange,
  placeholder = '',
  required = false,
  helperText,
  className,
  inputClassName,
  type = 'text',
}: InlineEditFieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  useEffect(() => {
    setEditValue(value)
  }, [value])

  const handleClick = () => {
    setIsEditing(true)
  }

  const handleBlur = () => {
    setIsEditing(false)
    onChange(editValue)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditing(false)
      onChange(editValue)
    }
    if (e.key === 'Escape') {
      setIsEditing(false)
      setEditValue(value)
    }
  }

  return (
    <div className={cn('', className)}>
      <label className="mb-1 block text-[13px] text-brand-fog">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {isEditing ? (
        <input
          ref={inputRef}
          type={type}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            'w-full rounded-lg bg-neutral-100 px-3 py-2 text-[14px] text-brand-navy outline-none transition-colors',
            'focus:ring-2 focus:ring-violet-200',
            inputClassName
          )}
        />
      ) : (
        <div
          onClick={handleClick}
          className={cn(
            'min-h-[40px] cursor-text rounded-lg border border-neutral-200 px-3 py-2 text-[14px] transition-colors',
            'hover:border-neutral-300',
            value ? 'text-brand-navy' : 'text-brand-mist',
            inputClassName
          )}
        >
          {value || placeholder || 'Click to edit'}
        </div>
      )}
      {helperText && (
        <p className="mt-1 text-[12px] text-brand-fog">{helperText}</p>
      )}
    </div>
  )
}

interface InlineEditSelectProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  helperText?: string
  className?: string
}

export function InlineEditSelect({
  label,
  value,
  onChange,
  options,
  helperText,
  className,
}: InlineEditSelectProps) {
  return (
    <div className={cn('', className)}>
      <label className="mb-1 block text-[13px] text-brand-fog">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'w-full appearance-none rounded-lg border border-neutral-200 bg-white px-3 py-2 pr-8 text-[14px] text-brand-navy outline-none transition-colors',
            'hover:border-neutral-300 focus:ring-2 focus:ring-violet-200'
          )}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-mist"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {helperText && (
        <p className="mt-1 text-[12px] text-brand-fog">{helperText}</p>
      )}
    </div>
  )
}

interface InlineEditCheckboxProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  helperText?: string
  className?: string
}

export function InlineEditCheckbox({
  label,
  checked,
  onChange,
  helperText,
  className,
}: InlineEditCheckboxProps) {
  return (
    <div className={cn('', className)}>
      <label className="flex cursor-pointer items-start gap-2">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-neutral-300 text-violet-500 focus:ring-violet-200"
        />
        <div>
          <span className="text-[14px] font-medium text-brand-navy">{label}</span>
          {helperText && (
            <p className="mt-0.5 text-[12px] text-brand-fog">{helperText}</p>
          )}
        </div>
      </label>
    </div>
  )
}

interface InlineEditRadioGroupProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  helperText?: string
  className?: string
}

export function InlineEditRadioGroup({
  label,
  value,
  onChange,
  options,
  helperText,
  className,
}: InlineEditRadioGroupProps) {
  return (
    <div className={cn('', className)}>
      <label className="mb-1 block text-[13px] text-brand-fog">{label}</label>
      {helperText && (
        <p className="mb-2 text-[12px] text-brand-fog">{helperText}</p>
      )}
      <div className="flex items-center gap-4">
        {options.map((opt) => (
          <label key={opt.value} className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name={label}
              value={opt.value}
              checked={value === opt.value}
              onChange={(e) => onChange(e.target.value)}
              className="h-4 w-4 border-neutral-300 text-violet-500 focus:ring-violet-200"
            />
            <span className="text-[14px] text-brand-navy">{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
