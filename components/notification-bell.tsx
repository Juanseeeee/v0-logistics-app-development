"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { createClient } from "@/lib/supabase/client"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"

interface Notification {
  id: string
  title: string
  description: string
  date: string
  read: boolean
  href: string
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function fetchAlerts() {
      // Fetch maintenance alerts as mock notifications
      const { data: maintenanceAlerts } = await supabase
        .from("maintenance_alerts")
        .select("id, description, urgency_level, vehicle_id, vehicles(patent_chasis)")
        .order("urgency_level", { ascending: true })
        .limit(3)

      const formattedNotifications: Notification[] = (maintenanceAlerts || []).map((alert: any) => ({
        id: alert.id,
        title: `Mantenimiento: ${alert.vehicles?.patent_chasis || "Vehículo"}`,
        description: alert.description,
        date: new Date().toISOString(),
        read: false, // In a real system, you'd store this state in a table
        href: alert.vehicle_id ? `/fleet/vehicles/${alert.vehicle_id}` : "/fleet/maintenance"
      }))

      setNotifications(formattedNotifications)
      setUnreadCount(formattedNotifications.length)
    }

    fetchAlerts()
  }, [])

  const markAllAsRead = () => {
    setUnreadCount(0)
    setNotifications(notifications.map((n) => ({ ...n, read: true })))
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="font-semibold">Notificaciones</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-auto px-2 py-1 text-xs">
              Marcar leídas
            </Button>
          )}
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">No tienes notificaciones.</div>
          ) : (
            notifications.map((notification) => (
              <Link
                key={notification.id}
                href={notification.href}
                prefetch={false}
                className={`block border-b p-4 last:border-0 hover:bg-muted/50 transition-colors ${
                  !notification.read ? "bg-muted/20" : ""
                }`}
                onClick={() => {
                  setNotifications(notifications.map(n => n.id === notification.id ? { ...n, read: true } : n))
                  if (!notification.read) setUnreadCount(prev => Math.max(0, prev - 1))
                  setIsOpen(false)
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{notification.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{notification.description}</p>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      {format(new Date(notification.date), "d MMM, HH:mm", { locale: es })}
                    </p>
                  </div>
                  {!notification.read && <div className="mt-1 h-2 w-2 rounded-full bg-blue-500 shrink-0" />}
                </div>
              </Link>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
