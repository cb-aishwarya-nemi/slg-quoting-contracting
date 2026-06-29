import { ChevronsUpDown } from 'lucide-react'
import { cn } from '../../lib/utils'

interface TopNavV0Props {
  environmentName?: string
  isLive?: boolean
}

export function TopNavV0({ environmentName = 'Echocorp.test.chargebee.com', isLive = true }: TopNavV0Props) {

  return (
    <header 
      className={cn(
        "fixed left-12 right-0 top-0 z-30 flex h-10 items-center justify-between px-4",
        "bg-theme-surface border-b border-theme-border"
      )}
    >
      {/* Left section - Site selector */}
      <div className="flex items-center gap-2">
        {isLive && (
          <span className="flex items-center gap-1 rounded-full bg-green-50 px-1.5 py-0.5 text-[11px] font-medium text-green-700">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            LIVE
          </span>
        )}
        <span className="max-w-[180px] truncate text-xs font-medium text-theme-primary">
          {environmentName}
        </span>
        <button
          type="button"
          className="flex h-5 w-5 cursor-pointer items-center justify-center rounded text-theme-primary transition-colors hover:bg-theme-hover"
          title="Switch site"
        >
          <ChevronsUpDown size={14} />
        </button>
      </div>

      {/* Right section - Actions */}
      <div className="flex items-center gap-0.5">
        {/* Expanded profile with name */}
        <button
          type="button"
          className="flex h-7 cursor-pointer items-center gap-2 rounded-full bg-orange-100 px-2.5 text-xs font-medium text-orange-700 transition-colors hover:bg-orange-200"
          title="Account"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-200 text-[10px] font-semibold">
            A
          </span>
          <span>Adrian Brody</span>
        </button>
      </div>
    </header>
  )
}
