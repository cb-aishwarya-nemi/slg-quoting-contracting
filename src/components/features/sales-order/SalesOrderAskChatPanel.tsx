import { useEffect, useMemo, useRef, useState, type FocusEvent, type ReactNode } from 'react'
import { PanelLeftClose, Send, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GradientSparkle } from '@/components/features/contract-processing/GradientSparkle'
import { ASK_RESPONSES, type AskResponse } from '@/data/salesOrderAskMock'

export const ASK_SUGGESTIONS_JUST_CREATED = [
  "What's the story of this deal?",
  'What exactly did we commit to Pioneer?',
  'Prep me for the kick-off call',
  "What can't wait this week?",
] as const

export const ASK_SUGGESTIONS_INVOICE_OVERDUE = [
  'Why might Pioneer be holding payment',
  'Is the Aug 31 invoice at risk',
  'Help me prepare to call Alex Nguyen',
  'Is this a payment delay or a signal?',
] as const

/** Generic Just created prompts for the ask typewriter. */
export function getAskSuggestions(_variant?: string | null): readonly string[] {
  return ASK_SUGGESTIONS_JUST_CREATED
}

export const ASK_SUGGESTIONS = ASK_SUGGESTIONS_JUST_CREATED

export const ASK_CHAT_RAIL_WIDTH = 320

const THINKING_MS = 2400

const PILL_RING =
  'linear-gradient(135deg, rgba(255, 51, 0, 0.28) 0%, rgba(139, 92, 246, 0.32) 100%)'
const PILL_FILL =
  'linear-gradient(135deg, rgba(255, 51, 0, 0.04) 0%, rgba(139, 92, 246, 0.05) 100%), #fff'

export function SuggestionPill({
  label,
  onClick,
  asDisplay,
  className,
}: {
  label: string
  onClick?: () => void
  asDisplay?: boolean
  className?: string
}) {
  const inner = (
    <span
      className={cn(
        'block whitespace-nowrap rounded-full px-3 py-1.5 text-[12px] font-medium text-brand-navy',
        asDisplay || !onClick ? 'text-left' : 'text-center',
      )}
      style={{ background: PILL_FILL }}
    >
      {label}
    </span>
  )

  if (asDisplay || !onClick) {
    return (
      <div className={cn('inline-block rounded-full p-px', className)} style={{ background: PILL_RING }}>
        {inner}
      </div>
    )
  }

  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        'inline-block w-fit cursor-pointer rounded-full p-px transition-opacity hover:opacity-90',
        className,
      )}
      style={{ background: PILL_RING }}
    >
      {inner}
    </button>
  )
}

const TYPE_MS = 36
const DELETE_MS = 22
const HOLD_MS = 1600
const GAP_MS = 400

function useTypewriterPlaceholder(phrases: readonly string[], enabled: boolean) {
  const [text, setText] = useState('')
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!enabled || phrases.length === 0) {
      setText('')
      setCharIndex(0)
      setDeleting(false)
      return
    }

    const phrase = phrases[phraseIndex % phrases.length]

    if (!deleting && charIndex === phrase.length) {
      const hold = window.setTimeout(() => setDeleting(true), HOLD_MS)
      return () => window.clearTimeout(hold)
    }

    if (deleting && charIndex === 0) {
      const gap = window.setTimeout(() => {
        setDeleting(false)
        setPhraseIndex((i) => (i + 1) % phrases.length)
      }, GAP_MS)
      return () => window.clearTimeout(gap)
    }

    const timer = window.setTimeout(
      () => {
        const next = deleting ? charIndex - 1 : charIndex + 1
        setCharIndex(next)
        setText(phrase.slice(0, next))
      },
      deleting ? DELETE_MS : TYPE_MS,
    )
    return () => window.clearTimeout(timer)
  }, [enabled, phrases, phraseIndex, charIndex, deleting])

  return text
}

export function AskComposer({
  value,
  onChange,
  onSubmit,
  onFocus,
  onBlur,
  placeholder = 'Ask AI',
  placeholderPhrases,
  autoFocus,
  fullWidth,
}: {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onFocus?: () => void
  onBlur?: (e: FocusEvent) => void
  placeholder?: string
  /** When set, cycles a typewriter through these phrases while idle */
  placeholderPhrases?: readonly string[]
  autoFocus?: boolean
  /** @deprecated Width is fitted to placeholder phrases; kept for call-site compat */
  expanded?: boolean
  fullWidth?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [focused, setFocused] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [typewriterReady, setTypewriterReady] = useState(!placeholderPhrases?.length)

  useEffect(() => {
    if (!placeholderPhrases?.length) {
      setTypewriterReady(true)
      return
    }
    setTypewriterReady(false)
    const timer = window.setTimeout(() => setTypewriterReady(true), 2500)
    return () => window.clearTimeout(timer)
  }, [placeholderPhrases])

  const animateIdle =
    Boolean(placeholderPhrases?.length) && typewriterReady && !value && !focused && !hovered
  const typedPlaceholder = useTypewriterPlaceholder(placeholderPhrases ?? [], animateIdle)

  const fittedWidth = useMemo(() => {
    const phrases = placeholderPhrases?.length ? placeholderPhrases : [placeholder]
    const longest = phrases.reduce((a, b) => (a.length >= b.length ? a : b), phrases[0] ?? placeholder)
    // 12px Inter: ~6.6px/char covers this copy without excess slack
    const textPx = Math.ceil(longest.length * 6.6)
    // sparkle + send + gaps + horizontal padding + gradient ring
    const chromePx = 68
    return `${textPx + chromePx}px`
  }, [placeholderPhrases, placeholder])

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  const handleFocus = () => {
    setFocused(true)
    onFocus?.()
  }

  const handleBlur = (e: FocusEvent) => {
    setFocused(false)
    onBlur?.(e)
  }

  return (
    <div
      className={cn(
        'rounded-full p-[1.5px] ai-gradient transition-all duration-300 ease-out',
        fullWidth && 'w-full',
      )}
      style={fullWidth ? undefined : { width: fittedWidth }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="relative flex cursor-text items-center gap-2 rounded-full bg-white px-3 py-1.5 shadow-sm"
        onClick={() => inputRef.current?.focus()}
      >
        <GradientSparkle size={12} />
        <div className="relative min-w-0 flex-1">
          {animateIdle && (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 flex items-center truncate text-[12px] text-brand-fog"
            >
              {typedPlaceholder}
              <span className="ml-px inline-block h-[12px] w-px shrink-0 animate-pulse bg-brand-fog/70" />
            </span>
          )}
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSubmit()
            }}
            placeholder={animateIdle ? '' : placeholder}
            className="relative z-[1] w-full bg-transparent text-[12px] text-brand-navy outline-none placeholder:text-brand-fog"
          />
        </div>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onSubmit}
          className={cn(
            'flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors',
            value.trim()
              ? 'bg-brand-navy text-white hover:bg-brand-soft'
              : 'text-brand-fog hover:bg-neutral-100 hover:text-brand-navy',
          )}
          aria-label="Send"
        >
          <Send size={12} strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}

function UserMessageBubble({ label }: { label: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[92%] rounded-xl bg-blue-50 px-3.5 py-2.5 text-[13px] leading-relaxed text-blue-800">
        {label}
      </div>
    </div>
  )
}

function AgentMessage({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
        <GradientSparkle size={14} />
      </span>
      <div className="min-w-0 flex-1 text-[13px] leading-relaxed text-brand-navy">{children}</div>
    </div>
  )
}

function KickoffBrief() {
  const cover = [
    'Who owns platform admin on their side — you need a named contact before you hang up',
    'Seat provisioning plan — who are the first users, how do they want them grouped',
    'Sandbox setup priority — which team needs the first environment and for what',
  ] as const

  const ask = [
    'What does success look like for your team in the first 90 days?',
    'What systems are you planning to integrate with Apex first?',
    "Is there anything you expected from us that isn't reflected in the contract?",
  ] as const

  const confirm = [
    'Platform admin name and email',
    'Date for Month 3 QBR',
    'Who to contact for the 4-hour SLA support channel',
  ] as const

  return (
    <div>
      <p className="text-[14px] font-semibold tracking-[-0.2px] text-brand-navy">
        Pioneer Systems · Kick-off brief
      </p>
      <p className="mt-1.5 text-[13px] leading-relaxed text-brand-fog">
        New customer · Signed May 1, 2026 · Apex platform, 50 seats, Premium SLA, 3 sandboxes · No
        prior relationship history.
      </p>

      <SectionDivider />
      <SectionHeading>Cover on the call</SectionHeading>
      <BulletList
        items={[
          ...cover,
          <>
            First invoice heads-up —{' '}
            <span className="font-semibold text-brand-navy">$41K generates May 31</span>, confirm
            they expect it and billing contact is correct
          </>,
        ]}
      />

      <SectionDivider />
      <SectionHeading>Ask them</SectionHeading>
      <BulletList items={[...ask]} />

      <SectionDivider />
      <SectionHeading>Confirm before hanging up</SectionHeading>
      <BulletList items={[...confirm]} />
    </div>
  )
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-brand-fog">
      {children}
    </p>
  )
}

function SectionDivider() {
  return <div className="my-4 h-px w-full bg-neutral-200/80" />
}

function BulletList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item, index) => (
        <li key={index} className="flex gap-2.5 text-[13px] leading-relaxed text-brand-navy">
          <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-brand-fog/70" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function MarkdownAnswer({ response }: { response: Extract<AskResponse, { kind: 'markdown' }> }) {
  return (
    <div>
      <p className="text-[14px] font-semibold tracking-[-0.2px] text-brand-navy">{response.title}</p>
      <p className="mt-2 text-[13px] leading-relaxed text-brand-navy">{response.body}</p>
    </div>
  )
}

function ThinkingState() {
  return (
    <AgentMessage>
      <div className="flex items-center gap-2">
        <span className="ai-gradient-text text-[13px] font-medium">Thinking</span>
        <span className="flex gap-1">
          <span className="h-1 w-1 animate-pulse rounded-full bg-violet-400 [animation-delay:0ms]" />
          <span className="h-1 w-1 animate-pulse rounded-full bg-violet-400 [animation-delay:150ms]" />
          <span className="h-1 w-1 animate-pulse rounded-full bg-orange-400 [animation-delay:300ms]" />
        </span>
      </div>
    </AgentMessage>
  )
}

export interface AskChatTurn {
  id: string
  prompt: string
}

function AgentAnswer({ prompt }: { prompt: string }) {
  const response = ASK_RESPONSES[prompt]
  if (response?.kind === 'kickoff') {
    return (
      <AgentMessage>
        <KickoffBrief />
      </AgentMessage>
    )
  }
  if (response?.kind === 'markdown') {
    return (
      <AgentMessage>
        <MarkdownAnswer response={response} />
      </AgentMessage>
    )
  }
  return (
    <AgentMessage>
      I don&apos;t have a tailored brief for that yet — try one of the suggested prompts.
    </AgentMessage>
  )
}

function ChatTurnBlock({
  prompt,
  isLatest,
  usedPrompts,
  suggestions,
  onAsk,
  onResolved,
}: {
  prompt: string
  isLatest: boolean
  usedPrompts: string[]
  suggestions: readonly string[]
  onAsk: (prompt: string) => void
  onResolved: () => void
}) {
  const [phase, setPhase] = useState<'thinking' | 'answer'>('thinking')

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPhase('answer')
      onResolved()
    }, THINKING_MS)
    return () => window.clearTimeout(timer)
    // Only run thinking once per turn mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const otherSuggestions = suggestions.filter((s) => !usedPrompts.includes(s))

  return (
    <div className="space-y-4">
      <UserMessageBubble label={prompt} />

      {phase === 'thinking' ? <ThinkingState /> : <AgentAnswer prompt={prompt} />}

      {phase === 'answer' && isLatest && otherSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 pl-7 pt-1">
          {otherSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => onAsk(suggestion)}
              className="cursor-pointer rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[12px] font-medium text-blue-700 transition-colors hover:bg-blue-50"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

interface SalesOrderAskChatPanelProps {
  turns: AskChatTurn[]
  customerName: string
  suggestions: readonly string[]
  onAsk: (prompt: string) => void
  onClose: () => void
}

export function SalesOrderAskChatPanel({
  turns,
  customerName,
  suggestions,
  onAsk,
  onClose,
}: SalesOrderAskChatPanelProps) {
  const [followUp, setFollowUp] = useState('')
  const [contentReady, setContentReady] = useState(false)
  const [showContextPill, setShowContextPill] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setContentReady(false)
    const reveal = window.setTimeout(() => setContentReady(true), 80)
    return () => window.clearTimeout(reveal)
  }, [])

  useEffect(() => {
    setShowContextPill(true)
  }, [customerName])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [turns.length])

  const submitFollowUp = () => {
    const trimmed = followUp.trim()
    if (!trimmed) return
    setFollowUp('')
    onAsk(trimmed)
  }

  const usedPrompts = turns.map((t) => t.prompt)

  return (
    <div className="flex h-full w-full flex-col bg-transparent">
      <header className="flex shrink-0 items-start justify-between gap-3 px-5 pb-2 pt-5">
        <div className="min-w-0">
          <p className="text-[15px] font-semibold leading-tight tracking-[-0.2px] text-brand-navy">
            Ask Apex
          </p>
          <p className="mt-1 truncate text-[12px] leading-snug text-brand-fog">
            About this sales order
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-0.5 flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-brand-fog transition-colors hover:bg-black/[0.04] hover:text-brand-navy"
          aria-label="Close chat"
        >
          <PanelLeftClose size={16} strokeWidth={1.75} />
        </button>
      </header>

      <div
        ref={scrollRef}
        className={cn(
          'min-h-0 flex-1 space-y-5 overflow-y-auto px-5 pb-4 pt-2 transition-all duration-500',
          contentReady ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
        )}
      >
        {turns.map((turn, index) => (
          <ChatTurnBlock
            key={turn.id}
            prompt={turn.prompt}
            isLatest={index === turns.length - 1}
            usedPrompts={usedPrompts}
            suggestions={suggestions}
            onAsk={onAsk}
            onResolved={scrollToBottom}
          />
        ))}
        <div ref={bottomRef} aria-hidden="true" />
      </div>

      <footer className="shrink-0 px-4 pb-4 pt-1">
        {showContextPill && (
          <div className="mb-2 flex items-center">
            <div className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-neutral-200/80 bg-transparent py-1 pl-2.5 pr-1 text-[11px] text-brand-navy">
              <span className="truncate">
                <span className="text-brand-fog">Context · </span>
                <span className="font-medium">{customerName}</span>
              </span>
              <button
                type="button"
                onClick={() => setShowContextPill(false)}
                className="flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded-full text-brand-fog transition-colors hover:bg-black/[0.06] hover:text-brand-navy"
                aria-label={`Remove ${customerName} context`}
              >
                <X size={10} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        )}
        <AskComposer
          value={followUp}
          onChange={setFollowUp}
          onSubmit={submitFollowUp}
          placeholder="Ask a follow-up…"
          fullWidth
          autoFocus
        />
      </footer>
    </div>
  )
}

export function SalesOrderAskBar({
  onAsk,
  suggestions = ASK_SUGGESTIONS_JUST_CREATED,
}: {
  onAsk: (prompt: string) => void
  suggestions?: readonly string[]
}) {
  const [query, setQuery] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const showSuggestions = isExpanded && !query.trim()

  const handleBlur = (e: FocusEvent) => {
    const next = e.relatedTarget as Node | null
    if (rootRef.current?.contains(next)) return
    if (!query.trim()) setIsExpanded(false)
  }

  const submit = (prompt: string) => {
    const trimmed = prompt.trim()
    if (!trimmed) return
    setQuery('')
    setIsExpanded(false)
    onAsk(trimmed)
  }

  return (
    <div ref={rootRef} className="pointer-events-auto flex flex-col items-center gap-2.5">
      {showSuggestions && (
        <div className="flex flex-col items-center gap-2">
          {[0, 2].map((start) => (
            <div key={start} className="flex items-center justify-center gap-2">
              {suggestions.slice(start, start + 2).map((suggestion) => (
                <SuggestionPill
                  key={suggestion}
                  label={suggestion}
                  onClick={() => submit(suggestion)}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      <AskComposer
        value={query}
        onChange={setQuery}
        onSubmit={() => submit(query)}
        onFocus={() => setIsExpanded(true)}
        onBlur={handleBlur}
        expanded={isExpanded}
        placeholderPhrases={suggestions}
      />
    </div>
  )
}

export default SalesOrderAskChatPanel
