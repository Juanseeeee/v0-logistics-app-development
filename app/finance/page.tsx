import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { canAccessFinance } from "@/lib/auth/roles"
import { ThemeToggle } from "@/components/theme-toggle"

export default async function FinancePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/signin")
  }

  // Get user role
  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()

  const userRole = profile?.role

  if (!canAccessFinance(userRole)) {
    redirect("/hub")
  }

  // Get statistics
  const { data: purchaseOrders } = await supabase.from("purchase_orders").select("id, total, status")

  const totalOrders = purchaseOrders?.length || 0
  const pendingOrders = purchaseOrders?.filter((po) => po.status === "pending").length || 0
  const totalAmount = purchaseOrders?.reduce((sum, po) => sum + po.total, 0) || 0

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Image
              src="/logo.png"
              alt="Cronos Logística"
              width={240}
              height={60}
              className="h-8 sm:h-12 w-auto"
            />
            <div className="h-6 w-px bg-border mx-1 sm:mx-2 hidden sm:block" />
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/hub" prefetch={false}>
                ← Volver al Hub
              </Link>
            </Button>
            <Button asChild variant="ghost" size="icon" className="sm:hidden">
              <Link href="/hub" prefetch={false}>
                ←
              </Link>
            </Button>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            <Link href="/auth/signout" prefetch={false}>
              <Button variant="ghost" size="sm" className="text-xs sm:text-sm">Cerrar Sesión</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Panel de Finanzas</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Gestión de compras, proveedores y control financiero</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Órdenes de Compra</CardDescription>
              <CardTitle className="text-4xl">{totalOrders}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{pendingOrders} pendientes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Monto Total</CardDescription>
              <CardTitle className="text-4xl">${totalAmount.toLocaleString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">En órdenes registradas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Proveedores Activos</CardDescription>
              <CardTitle className="text-4xl">-</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Próximamente</p>
            </CardContent>
          </Card>
        </div>

        {/* Module Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Link href="/finance/purchase-orders" prefetch={false}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <CardTitle>Órdenes de Compra</CardTitle>
                <CardDescription>Crear, gestionar y descargar órdenes de compra</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/finance/suppliers" prefetch={false}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <CardTitle>Proveedores</CardTitle>
                <CardDescription>Gestión completa de proveedores</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/finance/expenses" prefetch={false}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <CardTitle>Gastos</CardTitle>
                <CardDescription>Control y registro de gastos</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
