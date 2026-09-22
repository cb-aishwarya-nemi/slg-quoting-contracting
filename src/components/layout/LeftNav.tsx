import { useEffect, useRef, useState } from 'react'
import {
  Bell,
  CircleUser,
  ChevronsUpDown,
  Folder,
  Home,
  MessageSquareText,
  Package,
  PieChart,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useNavigation } from '../../context/NavigationContext'
import cbLogo from '../../assets/cb-logo-squircle.svg'

function GradientSparkles({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="askSparkGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ff3300" />
          <stop offset="1" stopColor="#6d28d9" />
        </linearGradient>
      </defs>
      <path
        d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"
        stroke="url(#askSparkGrad)"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M20 2v4" stroke="url(#askSparkGrad)" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M22 4h-4" stroke="url(#askSparkGrad)" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="4" cy="20" r="2" stroke="url(#askSparkGrad)" strokeWidth="1.75" />
    </svg>
  )
}

interface NavItem {
  icon: LucideIcon
  label: string
  href: string
  onClick?: () => void
}

export function LeftNav() {
  const [isExpanded, setIsExpanded] = useState(false)
  const railRef = useRef<HTMLDivElement>(null)
  const { view, goToWorkbench, goToCustomers, goToSalesOrders } = useNavigation()

  useEffect(() => {
    if (!isExpanded) return
    const close = (event: MouseEvent) => {
      if (railRef.current && !railRef.current.contains(event.target as Node)) {
        setIsExpanded(false)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [isExpanded])

  const navItems: NavItem[] = [
    { icon: Home, label: 'Workbench', href: '/', onClick: goToWorkbench },
    { icon: Folder, label: 'Customers', href: '/customers', onClick: goToCustomers },
    { icon: Package, label: 'Sales orders', href: '/sales-orders', onClick: goToSalesOrders },
    { icon: MessageSquareText, label: 'Quotes', href: '/quotes' },
    { icon: PieChart, label: 'Reports', href: '/reports' },
    { icon: Settings, label: 'Settings', href: '/settings' },
  ]

  const getIsActive = (item: NavItem): boolean => {
    if (item.href === '/' && view.name === 'workbench') return true
    if (item.href === '/customers' && view.name === 'customers') return true
    if (item.href === '/sales-orders' && view.name === 'salesOrders') return true
    return false
  }

  return (
    <>
      {/* Icon rail. Labels open from the logo click; the icons themselves only navigate. */}
      <div
        ref={railRef}
        className="fixed left-0 top-0 z-50 h-screen"
        style={{
          width: isExpanded ? 336 : 48,
          pointerEvents: 'auto',
        }}
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
            <button
              type="button"
              onClick={() => setIsExpanded((open) => !open)}
              className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center"
              aria-label={isExpanded ? 'Collapse navigation' : 'Expand navigation'}
              aria-expanded={isExpanded}
            >
              <img src={cbLogo} alt="" className="h-7 w-7 object-contain" />
            </button>

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
              const isActive = getIsActive(item)
              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    item.onClick?.()
                  }}
                  className={cn(
                    'group flex cursor-pointer items-center rounded-lg text-left transition-colors',
                    isActive
                      ? 'bg-orange-100 text-brand-navy'
                      : 'text-brand-navy hover:bg-brand-navy hover:text-white'
                  )}
                  style={{
                    height: 36,
                    width: isExpanded ? 'auto' : 36,
                    padding: isExpanded ? '8px 12px' : '8px',
                    justifyContent: 'flex-start',
                    gap: 12,
                    transition: 'width 140ms cubic-bezier(0.2,0,0,1), padding 140ms cubic-bezier(0.2,0,0,1), background-color 150ms ease-out, color 150ms ease-out',
                  }}
                >
                  <div className={cn("flex shrink-0 items-center justify-center", isActive && "text-orange-500")} style={{ width: 18, height: 18 }}>
                    <Icon size={18} strokeWidth={1.75} />
                  </div>

                  {/* Label — slides in from left */}
                  <span
                    className={cn(
                      'whitespace-nowrap text-[12px] uppercase leading-none tracking-[0em]',
                      isActive ? 'font-semibold' : 'font-medium'
                    )}
                    style={{
                      opacity: isExpanded ? 1 : 0,
                      transform: isExpanded ? 'translateX(0)' : 'translateX(-8px)',
                      transition: isExpanded
                        ? `opacity 100ms cubic-bezier(0.2,0,0,1) ${idx * 8 + 50}ms, transform 100ms cubic-bezier(0.2,0,0,1) ${idx * 8 + 50}ms`
                        : 'opacity 60ms, transform 60ms',
                    }}
                  >
                    {item.label}
                  </span>
                </button>
              )
            })}
          </div>
        </nav>

        <div className="absolute bottom-4 left-0 flex w-12 flex-col items-center gap-5">
          <button
            type="button"
            className="flex cursor-pointer items-center justify-center text-brand-navy"
            aria-label="Notifications"
          >
            <Bell size={20} strokeWidth={1.75} />
          </button>
          <button
            type="button"
            className="flex cursor-pointer items-center justify-center text-brand-navy"
            aria-label="Account"
          >
            <CircleUser size={20} strokeWidth={1.75} />
          </button>
          <button
            type="button"
            data-ask-icon
            onClick={() => window.dispatchEvent(new CustomEvent('ask-icon-click'))}
            className="flex cursor-pointer items-center justify-center"
            aria-label="Ask"
          >
            <GradientSparkles />
          </button>
        </div>
      </div>
    </>
  )
}
