"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { NotificationBell } from "@/components/notification-bell"

interface PageHeaderProps {
  title: string
  backHref?: string
  backLabel?: string
  showLogout?: boolean
}

export function PageHeader({ title, backHref = "/hub", backLabel = "← Volver", showLogout = true }: PageHeaderProps) {
  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href={backHref} prefetch={false}>
              {backLabel}
            </Link>
          </Button>
          <div className="h-6 w-px bg-border mx-2" />
          <h1 className="text-xl font-bold">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <ThemeToggle />
          {showLogout && (
            <form action="/auth/signout" method="post">
              <Button variant="ghost" type="submit">Cerrar Sesión</Button>
            </form>
          )}
        </div>
      </div>
    </header>
  )
}
