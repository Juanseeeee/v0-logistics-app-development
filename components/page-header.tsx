"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

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
          <ThemeToggle />
          {showLogout && (
            <Link href="/auth/signout" prefetch={false}>
              <Button variant="ghost">Cerrar Sesión</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
