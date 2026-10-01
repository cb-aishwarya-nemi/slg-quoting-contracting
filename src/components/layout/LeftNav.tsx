import { useState } from 'react'
import {
  Bell,
  Chat,
  Cube,
  Folder,
  Gear,
  Globe,
  House,
  Sparkle,
  Square,
  UserCircle,
  CaretUpDown,
  type Icon,
} from '@phosphor-icons/react'
import { cn } from '../../lib/utils'
import { useNavigation } from '../../context/NavigationContext'
import cbLogo from '../../assets/cb-logo-squircle.svg'

/** Measured from the 50×1024 reference rail. Glyph boxes are 22px; stack pitch is 42px. */
const ICON_SIZE = 22
const STACK_GAP = 20
const ACTIVE_BLUE = '#3748DD'

interface NavItem {
  id: string
  icon: Icon
  label: string
  fillWhenActive?: boolean
  onClick?: () => void
}

export function LeftNav() {
  const [isExpanded, setIsExpanded] = useState(false)
  const { view, goToWorkbench, goToCustomers, goToSalesOrders } = useNavigation()

  const mainItems: NavItem[] = [
    { id: 'workbench', icon: House, label: 'Workbench', fillWhenActive: true, onClick: goToWorkbench },
    { id: 'customers', icon: Folder, label: 'Customers', onClick: goToCustomers },
    { id: 'quotes', icon: Square, label: 'Quotes' },
    { id: 'sales-orders', icon: Cube, label: 'Sales orders', onClick: goToSalesOrders },
    { id: 'chat', icon: Chat, label: 'Chat' },
    { id: 'settings', icon: Gear, label: 'Settings' },
  ]

  const bottomItems: NavItem[] = [
    { id: 'notifications', icon: Bell, label: 'Notifications' },
    { id: 'account', icon: UserCircle, label: 'Account' },
    { id: 'apex', icon: Sparkle, label: 'Apex' },
  ]

  const isItemActive = (item: NavItem) => {
    if (item.id === 'workbench') return view.name === 'workbench'
    if (item.id === 'customers') return view.name === 'customers'
    if (item.id === 'sales-orders') return view.name === 'salesOrders'
    return false
  }

  const renderItem = (item: NavItem, index: number) => {
    const Icon = item.icon
    const isActive = isItemActive(item)
    return (
      <button
        key={item.id}
        type="button"
        onClick={item.onClick}
        title={item.label}
        aria-label={item.label}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          'flex cursor-pointer items-center text-left text-brand-navy',
          isExpanded && 'rounded-lg',
          isExpanded && isActive && 'bg-[#f2f6ff]',
          isExpanded && !isActive && 'hover:bg-brand-navy hover:text-white',
          !isExpanded && 'justify-center',
          isActive && 'text-[#3748DD]'
        )}
        style={
          isExpanded
            ? {
                height: 36,
                width: 'auto',
                padding: '8px 12px',
                justifyContent: 'flex-start',
                gap: 12,
              }
            : { width: ICON_SIZE, height: ICON_SIZE }
        }
      >
        <Icon
          size={ICON_SIZE}
          weight={isActive && item.fillWhenActive ? 'fill' : 'regular'}
          color={isActive ? ACTIVE_BLUE : 'currentColor'}
          className="shrink-0"
        />
        <span
          className={cn(
            'whitespace-nowrap text-[12px] uppercase leading-none tracking-[0em]',
            isActive ? 'font-semibold' : 'font-medium'
          )}
          style={{
            opacity: isExpanded ? 1 : 0,
            width: isExpanded ? undefined : 0,
            overflow: 'hidden',
            transform: isExpanded ? 'translateX(0)' : 'translateX(-8px)',
            transition: isExpanded
              ? `opacity 100ms cubic-bezier(0.2,0,0,1) ${index * 8 + 50}ms, transform 100ms cubic-bezier(0.2,0,0,1) ${index * 8 + 50}ms`
              : 'opacity 60ms, transform 60ms',
          }}
        >
          {item.label}
        </span>
      </button>
    )
  }

  return (
    <div
      className="fixed left-0 top-0 z-50 h-screen"
      style={{ width: isExpanded ? 336 : 48 }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <nav
        className={cn(
          'flex flex-col bg-white',
          isExpanded
            ? 'overflow-hidden'
            : 'overflow-x-hidden overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
        )}
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
        <div
          className={cn(
            'flex shrink-0 items-center overflow-hidden',
            isExpanded ? 'h-10 gap-2 px-3' : 'justify-center pt-[18px]'
          )}
        >
          <img
            src={cbLogo}
            alt="Chargebee"
            className={cn('shrink-0 object-contain', isExpanded ? 'h-7 w-7' : 'h-8 w-8')}
          />
          {isExpanded && (
            <>
              <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
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
              >
                <CaretUpDown size={14} />
              </button>
            </>
          )}
        </div>

        {isExpanded && <div className="mx-3 h-px bg-neutral-100" />}

        <button
          type="button"
          title="Switch site"
          aria-label="Switch site"
          className={cn(
            'flex shrink-0 cursor-pointer items-center justify-center text-brand-navy',
            isExpanded ? 'mx-1.5 mt-1 h-9 w-9 rounded-lg hover:bg-neutral-100' : 'mt-[31px] self-center'
          )}
          style={isExpanded ? undefined : { width: ICON_SIZE, height: ICON_SIZE }}
        >
          <Globe size={ICON_SIZE} weight="regular" />
        </button>

        <div
          className={cn(
            'flex flex-col',
            isExpanded ? 'gap-0.5 px-1.5 pt-1' : 'mt-[56px] items-center'
          )}
          style={isExpanded ? undefined : { gap: STACK_GAP }}
        >
          {mainItems.map((item, index) => renderItem(item, index))}
        </div>

        <div
          className={cn(
            'flex flex-col',
            isExpanded ? 'mt-2 gap-0.5 px-1.5 pb-2' : 'mb-[17px] mt-auto items-center'
          )}
          style={isExpanded ? undefined : { gap: STACK_GAP }}
        >
          {bottomItems.map((item, index) => renderItem(item, index))}
        </div>
      </nav>
    </div>
  )
}
