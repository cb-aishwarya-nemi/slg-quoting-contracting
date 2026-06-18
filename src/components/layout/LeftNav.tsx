import { useState } from 'react'
import {
  Home,
  MessageSquarePlus,
  History,
  Users,
  FileText,
  ScrollText,
  ReceiptText,
  WalletCards,
  BarChart3,
  ChevronsUpDown,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import cbLogo from '../../assets/cb-logo-squircle.svg'

function GradientMessageSquarePlus({ size = 18, paused = false }: { size?: number; paused?: boolean }) {
  return (
    <div style={{ width: size, height: size, position: 'relative' }}>
      <style>{`
        @keyframes aiGradientPulse1 {
          0%, 100% { stop-color: #1c1b2e; }
          50% { stop-color: #ff3300; }
        }
        @keyframes aiGradientPulse2 {
          0%, 100% { stop-color: #1c1b2e; }
          50% { stop-color: #8b5cf6; }
        }
        .ai-stop-top { animation: aiGradientPulse1 3s ease-in-out infinite; }
        .ai-stop-bottom { animation: aiGradientPulse2 3s ease-in-out infinite; }
        .ai-stop-top.paused { animation: none; }
        .ai-stop-bottom.paused { animation: none; }
      `}</style>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <linearGradient id="msgGrad" x1="12" y1="3" x2="12" y2="21" gradientUnits="userSpaceOnUse">
            <stop className={paused ? "ai-stop-top paused" : "ai-stop-top"} stopColor={paused ? "#ffffff" : "#1c1b2e"} />
            <stop className={paused ? "ai-stop-bottom paused" : "ai-stop-bottom"} offset="1" stopColor={paused ? "#ffffff" : "#1c1b2e"} />
          </linearGradient>
        </defs>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="url(#msgGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="12" y1="7" x2="12" y2="13" stroke="url(#msgGrad)" strokeWidth="2" strokeLinecap="round" />
        <line x1="9" y1="10" x2="15" y2="10" stroke="url(#msgGrad)" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  )
}

function GradientHistory({ size = 18, paused = false }: { size?: number; paused?: boolean }) {
  return (
    <div style={{ width: size, height: size, position: 'relative' }}>
      <style>{`
        @keyframes aiGradientPulseHist1 {
          0%, 100% { stop-color: #1c1b2e; }
          50% { stop-color: #ff3300; }
        }
        @keyframes aiGradientPulseHist2 {
          0%, 100% { stop-color: #1c1b2e; }
          50% { stop-color: #8b5cf6; }
        }
        .ai-stop-top-hist { animation: aiGradientPulseHist1 3s ease-in-out infinite; }
        .ai-stop-bottom-hist { animation: aiGradientPulseHist2 3s ease-in-out infinite; }
        .ai-stop-top-hist.paused { animation: none; }
        .ai-stop-bottom-hist.paused { animation: none; }
      `}</style>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <linearGradient id="histGrad" x1="12" y1="3" x2="12" y2="21" gradientUnits="userSpaceOnUse">
            <stop className={paused ? "ai-stop-top-hist paused" : "ai-stop-top-hist"} stopColor={paused ? "#ffffff" : "#1c1b2e"} />
            <stop className={paused ? "ai-stop-bottom-hist paused" : "ai-stop-bottom-hist"} offset="1" stopColor={paused ? "#ffffff" : "#1c1b2e"} />
          </linearGradient>
        </defs>
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" stroke="url(#histGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 3v5h5" stroke="url(#histGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 7v5l4 2" stroke="url(#histGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

interface NavItem {
  icon: LucideIcon
  label: string
  desc: string
  href: string
  isAI?: boolean
  isActive?: boolean
}

const navItems: NavItem[] = [
  { icon: Home,              label: 'Workbench',   desc: 'Your task dashboard',       href: '/',            isActive: true },
  { icon: MessageSquarePlus, label: 'New Chat',    desc: 'Start an AI conversation',  href: '/chat',        isAI: true },
  { icon: History,           label: 'History',     desc: 'Browse past AI chats',      href: '/history',     isAI: true },
  { icon: Users,             label: 'Customers',   desc: 'Manage your accounts',      href: '/customers' },
  { icon: FileText,          label: 'Quotes',      desc: 'Quotes and proposals',      href: '/quotes' },
  { icon: ScrollText,        label: 'Contracts',   desc: 'Contract management',       href: '/contracts' },
  { icon: ReceiptText,       label: 'Invoices',    desc: 'Billing and payments',      href: '/invoices' },
  { icon: WalletCards,       label: 'Collections', desc: 'Track receivables',         href: '/collections' },
  { icon: BarChart3,         label: 'Reports',     desc: 'Analytics and insights',    href: '/reports' },
]


export function LeftNav() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  return (
    <>
      {/* Hover zone — always full height, width expands with card */}
      <div
        className="fixed left-0 top-0 z-50 h-screen"
        style={{
          width: isExpanded ? 336 : 48,
          pointerEvents: 'auto',
        }}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        {/* Visual card — gets inset margin when expanded for the "lifted" look */}
        <nav
          className="flex flex-col overflow-hidden bg-white"
          style={{
            margin: isExpanded ? 8 : 0,
            width: isExpanded ? 320 : 48,
            height: isExpanded ? 'fit-content' : '100vh',
            maxHeight: isExpanded ? '600px' : '100vh',
            boxShadow: isExpanded
              ? '0 0 0 1px #1c1b2e, 0 16px 48px -6px rgba(0,0,0,0.22)'
              : 'none',
            borderRadius: isExpanded ? 14 : 0,
            transition: isExpanded
              ? 'margin 140ms cubic-bezier(0.2,0,0,1), width 140ms cubic-bezier(0.2,0,0,1), max-height 140ms cubic-bezier(0.2,0,0,1), border-radius 140ms cubic-bezier(0.2,0,0,1), box-shadow 140ms cubic-bezier(0.2,0,0,1)'
              : 'margin 0ms, width 0ms, max-height 0ms, border-radius 0ms, box-shadow 0ms',
          }}
        >
          {/* Header row — logo always visible; site selector text fades in */}
          <div className="flex h-10 shrink-0 items-center gap-2 overflow-hidden px-3">
            <img src={cbLogo} alt="Chargebee" className="h-7 w-7 shrink-0 object-contain" />

            {/* Site selector text */}
            <div
              className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden"
              style={{
                opacity: isExpanded ? 1 : 0,
                transition: isExpanded ? 'opacity 90ms cubic-bezier(0.2,0,0,1) 30ms' : 'opacity 0ms',
                pointerEvents: isExpanded ? 'auto' : 'none',
              }}
            >
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-green-50 px-1.5 py-0.5 text-[11px] font-medium text-green-700">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                LIVE
              </span>
              <span className="truncate text-xs font-medium text-brand-navy">
                Echocorp.test.chargebee.com
              </span>
            </div>

            <button
              type="button"
              className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded text-brand-navy transition-colors hover:bg-neutral-100"
              title="Switch site"
              style={{
                opacity: isExpanded ? 1 : 0,
                transition: isExpanded ? 'opacity 90ms cubic-bezier(0.2,0,0,1) 30ms' : 'opacity 0ms',
                pointerEvents: isExpanded ? 'auto' : 'none',
              }}
            >
              <ChevronsUpDown size={14} />
            </button>
          </div>

          {/* Divider */}
          <div
            className="mx-3 h-px bg-neutral-100"
            style={{
              opacity: isExpanded ? 1 : 0,
              transition: isExpanded ? 'opacity 70ms cubic-bezier(0.2,0,0,1) 20ms' : 'opacity 0ms',
            }}
          />

          {/* Nav items — single DOM structure, text visibility controlled via CSS */}
          <div className="flex flex-col gap-0.5 px-1.5 pt-2 pb-2">
            {navItems.map((item, idx) => {
              const Icon = item.icon
              return (
                <button
                  key={item.href}
                  type="button"
                  className={cn(
                    'group flex cursor-pointer items-center rounded-lg text-left transition-colors',
                    item.isActive
                      ? 'bg-orange-100 text-brand-navy'
                      : 'text-brand-navy hover:bg-brand-navy hover:text-white'
                  )}
                  style={{
                    height: isExpanded ? 'auto' : 36,
                    width: isExpanded ? 'auto' : 36,
                    padding: isExpanded ? '10px 12px' : item.isActive ? 4 : 0,
                    justifyContent: isExpanded ? 'flex-start' : 'center',
                    gap: isExpanded ? 12 : 0,
                    transition: isExpanded
                      ? 'padding 120ms cubic-bezier(0.2,0,0,1), height 120ms cubic-bezier(0.2,0,0,1), width 120ms cubic-bezier(0.2,0,0,1), background-color 150ms ease-out, color 150ms ease-out'
                      : 'padding 0ms, height 0ms, width 0ms, background-color 150ms ease-out, color 150ms ease-out',
                  }}
                  onMouseEnter={() => setHoveredItem(item.href)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  {/* Icon wrapper — keeps icon centred in collapsed, left-aligned in expanded */}
                  <div
                    className="flex shrink-0 items-center justify-center transition-all duration-150"
                    style={{
                      width: item.isActive && !isExpanded ? 28 : 18,
                      height: item.isActive && !isExpanded ? 28 : 18,
                    }}
                  >
                    {item.isAI ? (
                      item.label === 'New Chat' ? (
                        <GradientMessageSquarePlus size={18} paused={hoveredItem === item.href} />
                      ) : item.label === 'History' ? (
                        <GradientHistory size={18} paused={hoveredItem === item.href} />
                      ) : (
                        <Icon size={18} />
                      )
                    ) : (
                      <Icon size={18} />
                    )}
                  </div>

                  {/* Label + description — always in DOM, fades in/out */}
                  <div
                    className="flex min-w-0 flex-col overflow-hidden"
                    style={{
                      opacity: isExpanded ? 1 : 0,
                      maxWidth: isExpanded ? 240 : 0,
                      transform: isExpanded ? 'translateX(0)' : 'translateX(-4px)',
                      transition: isExpanded
                        ? `opacity 80ms cubic-bezier(0.2,0,0,1) ${idx * 12 + 40}ms, transform 80ms cubic-bezier(0.2,0,0,1) ${idx * 12 + 40}ms, max-width 120ms cubic-bezier(0.2,0,0,1)`
                        : 'opacity 0ms, transform 0ms, max-width 0ms',
                      pointerEvents: isExpanded ? 'auto' : 'none',
                    }}
                  >
                    <span
                      className={cn(
                        'whitespace-nowrap text-[12px] uppercase leading-none tracking-[0em]',
                        item.isActive ? 'font-semibold' : 'font-medium'
                      )}
                    >
                      {item.label}
                    </span>
                    <span
                      className={cn(
                        'mt-[5px] whitespace-nowrap text-[11px] leading-none transition-colors',
                        item.isActive
                          ? 'text-brand-navy'
                          : 'text-brand-fog group-hover:text-white/70'
                      )}
                    >
                      {item.desc}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </nav>
      </div>
    </>
  )
}
