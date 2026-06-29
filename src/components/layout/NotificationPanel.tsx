import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNotifications, type Notification } from '@/context/NotificationContext'

function NotificationItem({ notification }: { notification: Notification }) {
  const { removeNotification } = useNotifications()

  return (
    <div
      className={cn(
        'animate-in slide-in-from-top-2 duration-300',
        'rounded-lg border-2 border-brand-navy bg-white p-4',
        'mb-2'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="text-sm font-semibold text-brand-navy">
                {notification.title}
              </h4>
              <p className="mt-1 text-sm leading-relaxed text-brand-navy">
                {notification.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => removeNotification(notification.id)}
              className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded text-brand-fog hover:bg-neutral-100 hover:text-brand-navy"
              aria-label="Dismiss notification"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function NotificationPanel() {
  const { notifications } = useNotifications()

  if (notifications.length === 0) {
    return null
  }

  return (
    <div className="fixed right-4 top-11 z-30 w-[420px]">
      {notifications.map((notification) => (
        <NotificationItem key={notification.id} notification={notification} />
      ))}
    </div>
  )
}

export default NotificationPanel
