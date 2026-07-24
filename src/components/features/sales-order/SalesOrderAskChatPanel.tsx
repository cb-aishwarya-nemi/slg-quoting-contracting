import { useEffect, useRef, useState, type FocusEvent, type ReactNode } from 'react'
import { Send, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GradientSparkle } from '@/components/features/contract-processing/GradientSparkle'
import { ASK_RESPONSES, type AskResponse } from '@/data/salesOrderAskMock'

export const ASK_SUGGESTIONS = [
  "What's the story of this deal?",
  'What exactly did we commit to Pioneer?',
  'Prep me for the kick-off call',
  "What can't wait this week?",
] as const

export const ASK_CHAT_RAIL_WIDTH = 420

const THINKING_MS = 2400

const PILL_RING =
  'linear-gradient(135deg, rgba(255, 51, 0, 0.28) 0%, rgba(139, 92, 246, 0.32) 100%)'
const PILL_FILL =
  'linear-gradient(135deg, rgba(255, 51, 0, 0.04) 0%, rgba(139, 92, 246, 0.05) 100%), #fff'

export function SuggestionPill({
  label,
  onClick,
  asDisplay,
}: {
  label: string
  onClick?: () => void
  asDisplay?: boolean
}) {
  const inner = (
    <span
      className="block rounded-full px-3 py-1.5 text-left text-[12px] font-medium text-brand-navy"
      style={{ background: PILL_FILL }}
    >
      {label}
    </span>
  )

  if (asDisplay || !onClick) {
    return (
      <div className="rounded-full p-px" style={{ background: PILL_RING }}>
        {inner}
      </div>
    )
  }

  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="cursor-pointer rounded-full p-px transition-opacity hover:opacity-90"
      style={{ background: PILL_RING }}
    >
      {inner}
    </button>
  )
}

export function AskComposer({
  value,
  onChange,
  onSubmit,
  onFocus,
  onBlur,
  placeholder = 'Ask about this sales order',
  autoFocus,
  expanded,
}: {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onFocus?: () => void
  onBlur?: (e: FocusEvent) => void
  placeholder?: string
  autoFocus?: boolean
  expanded?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  return (
    <div
      className={cn(
        'rounded-full p-[1.5px] ai-gradient transition-all duration-300 ease-out',
        expanded ? 'w-full' : 'w-[320px]',
      )}
    >
      <div className="flex cursor-text items-center gap-2 rounded-full bg-white px-3 py-1.5 shadow-sm">
        <GradientSparkle size={12} />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSubmit()
          }}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-[12px] text-brand-navy outline-none placeholder:text-brand-fog"
        />
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
    <div className="rounded-xl border border-neutral-200 bg-white px-5 py-5 shadow-sm">
      <h3 className="text-[15px] font-semibold tracking-[-0.2px] text-brand-navy">
        Pioneer Systems · Kick-off brief
      </h3>
      <p className="mt-1.5 text-[12px] leading-relaxed text-brand-fog">
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
      <BulletList items={[...confirm]} last />
    </div>
  )
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-fog">
      {children}
    </p>
  )
}

function SectionDivider() {
  return <div className="my-4 h-px w-full bg-neutral-200" />
}

function BulletList({
  items,
  last = false,
}: {
  items: ReactNode[]
  last?: boolean
}) {
  return (
    <ul className="space-y-0">
      {items.map((item, index) => (
        <li key={index}>
          <div className="flex gap-2.5 py-2.5 text-[13px] leading-relaxed text-brand-navy">
            <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-brand-fog/70" />
            <span>{item}</span>
          </div>
          {(!last || index < items.length - 1) && index < items.length - 1 && (
            <div className="h-px w-full bg-neutral-100" />
          )}
        </li>
      ))}
    </ul>
  )
}

function MarkdownAnswer({ response }: { response: Extract<AskResponse, { kind: 'markdown' }> }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white px-5 py-5 shadow-sm">
      <h3 className="text-[15px] font-semibold tracking-[-0.2px] text-brand-navy">{response.title}</h3>
      <p className="mt-3 text-[13px] leading-relaxed text-brand-navy">{response.body}</p>
    </div>
  )
}

function ThinkingState() {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3.5 py-3 shadow-sm">
      <GradientSparkle size={14} />
      <span className="ai-gradient-text text-[13px] font-medium">Thinking</span>
      <span className="flex gap-1 pl-0.5">
        <span className="h-1 w-1 animate-pulse rounded-full bg-violet-400 [animation-delay:0ms]" />
        <span className="h-1 w-1 animate-pulse rounded-full bg-violet-400 [animation-delay:150ms]" />
        <span className="h-1 w-1 animate-pulse rounded-full bg-orange-400 [animation-delay:300ms]" />
      </span>
    </div>
  )
}

export interface AskChatTurn {
  id: string
  prompt: string
}

function AgentAnswer({ prompt }: { prompt: string }) {
  const response = ASK_RESPONSES[prompt]
  if (response?.kind === 'kickoff') return <KickoffBrief />
  if (response?.kind === 'markdown') return <MarkdownAnswer response={response} />
  return (
    <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3 text-[13px] text-brand-navy shadow-sm">
      I don&apos;t have a tailored brief for that yet — try one of the suggested prompts.
    </div>
  )
}

function ChatTurnBlock({
  prompt,
  isLatest,
  usedPrompts,
  onAsk,
  onResolved,
}: {
  prompt: string
  isLatest: boolean
  usedPrompts: string[]
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

  const otherSuggestions = ASK_SUGGESTIONS.filter((s) => !usedPrompts.includes(s))

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <SuggestionPill label={prompt} asDisplay />
      </div>

      {phase === 'thinking' ? <ThinkingState /> : <AgentAnswer prompt={prompt} />}

      {phase === 'answer' && isLatest && otherSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {otherSuggestions.map((suggestion) => (
            <SuggestionPill
              key={suggestion}
              label={suggestion}
              onClick={() => onAsk(suggestion)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface SalesOrderAskChatPanelProps {
  turns: AskChatTurn[]
  onAsk: (prompt: string) => void
  onClose: () => void
}

export function SalesOrderAskChatPanel({ turns, onAsk, onClose }: SalesOrderAskChatPanelProps) {
  const [followUp, setFollowUp] = useState('')
  const [contentReady, setContentReady] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setContentReady(false)
    const reveal = window.setTimeout(() => setContentReady(true), 80)
    return () => window.clearTimeout(reveal)
  }, [])

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
    <div className="flex h-full w-full flex-col bg-white">
      <header className="flex shrink-0 items-center justify-between border-b border-neutral-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <GradientSparkle size={16} />
          <div>
            <p className="text-[13px] font-semibold text-brand-navy">Ask Apex</p>
            <p className="text-[11px] text-brand-fog">About this sales order</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-brand-fog transition-colors hover:bg-neutral-100 hover:text-brand-navy"
          aria-label="Close chat"
        >
          <X size={18} />
        </button>
      </header>

      <div
        ref={scrollRef}
        className={cn(
          'min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-4 transition-all duration-500',
          contentReady ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
        )}
      >
        {turns.map((turn, index) => (
          <ChatTurnBlock
            key={turn.id}
            prompt={turn.prompt}
            isLatest={index === turns.length - 1}
            usedPrompts={usedPrompts}
            onAsk={onAsk}
            onResolved={scrollToBottom}
          />
        ))}
        <div ref={bottomRef} aria-hidden="true" />
      </div>

      <footer className="shrink-0 border-t border-neutral-200 p-3">
        <AskComposer
          value={followUp}
          onChange={setFollowUp}
          onSubmit={submitFollowUp}
          placeholder="Ask a follow-up…"
          expanded
          autoFocus
        />
      </footer>
    </div>
  )
}

export function SalesOrderAskBar({ onAsk }: { onAsk: (prompt: string) => void }) {
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
        <div className="flex max-w-[640px] flex-wrap items-center justify-center gap-2">
          {ASK_SUGGESTIONS.map((suggestion) => (
            <SuggestionPill
              key={suggestion}
              label={suggestion}
              onClick={() => submit(suggestion)}
            />
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
      />
    </div>
  )
}

export default SalesOrderAskChatPanel
