import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

export interface Notification {
  id: string
  title: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'error'
  persistent?: boolean
}

interface NotificationContextValue {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id'>) => string
  removeNotification: (id: string) => void
  clearAll: () => void
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const newNotification: Notification = {
      ...notification,
      id,
      persistent: notification.persistent ?? true,
    }
    
    setNotifications(prev => [...prev, newNotification])
    
    return id
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, clearAll }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
