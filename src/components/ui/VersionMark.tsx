import { cn } from '@/lib/utils'

/** Signed-version disc used on the amendment mini-timeline and Compare changes axis. */
export function VersionMark({
  version,
  tone = 'default',
  className,
}: {
  version: string
  tone?: 'default' | 'positive'
  className?: string
}) {
  return (
    <span
      className={cn(
        'flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[8px] font-semibold leading-none tracking-[-0.2px] ring-1',
        tone === 'positive'
          ? 'bg-green-600 text-white ring-green-600 shadow-[0_0_0_2px_rgba(22,163,74,0.14)]'
          : 'bg-blue-500 text-white ring-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,0.16)]',
        className
      )}
    >
      {version}
    </span>
  )
}
