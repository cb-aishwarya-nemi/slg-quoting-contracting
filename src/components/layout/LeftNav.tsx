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
  type LucideIcon,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import cbLogo from '../../assets/cb-logo-squircle.svg'

function GradientMessageSquarePlus({ size = 18 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        position: 'relative',
      }}
    >
      <style>{`
        @keyframes aiGradientPulse1 {
          0%, 100% { stop-color: #1c1b2e; }
          50% { stop-color: #ff3300; }
        }
        @keyframes aiGradientPulse2 {
          0%, 100% { stop-color: #1c1b2e; }
          50% { stop-color: #8b5cf6; }
        }
        .ai-stop-top {
          animation: aiGradientPulse1 3s ease-in-out infinite;
        }
        .ai-stop-bottom {
          animation: aiGradientPulse2 3s ease-in-out infinite;
        }
      `}</style>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        style={{ position: 'absolute', inset: 0 }}
      >
        <defs>
          <linearGradient id="msgGrad" x1="12" y1="3" x2="12" y2="21" gradientUnits="userSpaceOnUse">
            <stop className="ai-stop-top" stopColor="#1c1b2e" />
            <stop className="ai-stop-bottom" offset="1" stopColor="#1c1b2e" />
          </linearGradient>
        </defs>
        <path
          d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
          stroke="url(#msgGrad)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <line x1="12" y1="7" x2="12" y2="13" stroke="url(#msgGrad)" strokeWidth="2" strokeLinecap="round" />
        <line x1="9" y1="10" x2="15" y2="10" stroke="url(#msgGrad)" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  )
}

function GradientHistory({ size = 18 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        position: 'relative',
      }}
    >
      <style>{`
        @keyframes aiGradientPulseHist1 {
          0%, 100% { stop-color: #1c1b2e; }
          50% { stop-color: #ff3300; }
        }
        @keyframes aiGradientPulseHist2 {
          0%, 100% { stop-color: #1c1b2e; }
          50% { stop-color: #8b5cf6; }
        }
        .ai-stop-top-hist {
          animation: aiGradientPulseHist1 3s ease-in-out infinite;
        }
        .ai-stop-bottom-hist {
          animation: aiGradientPulseHist2 3s ease-in-out infinite;
        }
      `}</style>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        style={{ position: 'absolute', inset: 0 }}
      >
        <defs>
          <linearGradient id="histGrad" x1="12" y1="3" x2="12" y2="21" gradientUnits="userSpaceOnUse">
            <stop className="ai-stop-top-hist" stopColor="#1c1b2e" />
            <stop className="ai-stop-bottom-hist" offset="1" stopColor="#1c1b2e" />
          </linearGradient>
        </defs>
        <path
          d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
          stroke="url(#histGrad)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M3 3v5h5"
          stroke="url(#histGrad)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 7v5l4 2"
          stroke="url(#histGrad)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

interface NavItem {
  icon: LucideIcon
  label: string
  href: string
  isAI?: boolean
  isActive?: boolean
}

const navItems: NavItem[] = [
  { icon: Home, label: 'Workbench', href: '/', isActive: true },
  { icon: MessageSquarePlus, label: 'New Chat', href: '/chat', isAI: true },
  { icon: History, label: 'History', href: '/history', isAI: true },
  { icon: Users, label: 'Customers', href: '/customers' },
  { icon: FileText, label: 'Quotes', href: '/quotes' },
  { icon: ScrollText, label: 'Contracts', href: '/contracts' },
  { icon: ReceiptText, label: 'Invoices', href: '/invoices' },
  { icon: WalletCards, label: 'Collections', href: '/collections' },
  { icon: BarChart3, label: 'Reports', href: '/reports' },
]

interface NavButtonProps {
  item: NavItem
}

function NavButton({ item }: NavButtonProps) {
  const Icon = item.icon

  return (
    <div className="group relative flex h-9 w-9 cursor-pointer items-center justify-center" title={item.label}>
      {/* Tooltip */}
      <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md bg-brand-navy px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
        {item.label}
      </span>

      <button
        type="button"
        className={cn(
          'relative flex items-center justify-center rounded-lg transition-all',
          item.isActive
            ? 'h-7 w-7 bg-orange-100 text-orange-500'
            : 'h-9 w-9 text-brand-navy hover:bg-neutral-100'
        )}
        tabIndex={-1}
      >
        {item.isAI && !item.isActive ? (
          item.label === 'New Chat' ? (
            <GradientMessageSquarePlus size={18} />
          ) : item.label === 'History' ? (
            <GradientHistory size={18} />
          ) : (
            <Icon size={18} />
          )
        ) : (
          <Icon size={18} />
        )}
      </button>
    </div>
  )
}

export function LeftNav() {
  return (
    <nav className="fixed left-0 top-0 z-40 flex h-screen w-12 flex-col items-center bg-white pb-3 pt-2">
      {/* Logo */}
      <div className="mb-4 flex items-center justify-center">
        <img src={cbLogo} alt="Chargebee" className="h-7 w-7 object-contain" />
      </div>

      {/* Navigation Items */}
      <div className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => (
          <NavButton key={item.href} item={item} />
        ))}
      </div>

    </nav>
  )
}
