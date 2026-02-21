import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"

export default async function FleetDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get statistics
  const { count: vehiclesCount } = await supabase.from("vehicles").select("*", { count: "exact", head: true })

  // Get recent alerts
  const { data: alerts } = await supabase
    .from("maintenance_alerts")
    .select("*")
    .order("urgency_level", { ascending: false })
    .limit(5)

  // Get vehicles needing attention
  const { data: criticalAlerts } = await supabase
    .from("maintenance_alerts")
    .select("*", { count: "exact", head: true })
    .eq("urgency_level", "critical")

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
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Dashboard de Flota</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Control y gestión de vehículos propios de Cronos</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Vehículos</CardDescription>
              <CardTitle className="text-4xl">{vehiclesCount || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Chasis y semis en flota</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Alertas Críticas</CardDescription>
              <CardTitle className="text-4xl text-red-500">{criticalAlerts?.length || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Requieren atención inmediata</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Mantenimientos Pendientes</CardDescription>
              <CardTitle className="text-4xl text-yellow-500">{alerts?.length || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Próximos 30 días</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Button asChild size="lg" className="h-auto py-6 flex-col gap-2 bg-[#0038ae] hover:bg-[#0038ae]/90">
            <Link href="/fleet/vehicles" prefetch={false}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span>Vehículos</span>
            </Link>
          </Button>

          <Button asChild size="lg" variant="outline" className="h-auto py-6 flex-col gap-2 bg-transparent">
            <Link href="/fleet/maintenance" prefetch={false}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>Mantenimientos</span>
            </Link>
          </Button>

          <Button asChild size="lg" variant="outline" className="h-auto py-6 flex-col gap-2 bg-transparent">
            <Link href="/fleet/fuel-records" prefetch={false}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              <span>Combustible</span>
            </Link>
          </Button>

          <Button asChild size="lg" variant="outline" className="h-auto py-6 flex-col gap-2 bg-transparent">
            <Link href="/fleet/reports" prefetch={false}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <span>Reportes</span>
            </Link>
          </Button>

          <Button asChild size="lg" variant="outline" className="h-auto py-6 flex-col gap-2 bg-transparent">
            <Link href="/fleet/spare-parts" prefetch={false}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
              <span>Repuestos</span>
            </Link>
          </Button>
        </div>

        {/* Alerts Section */}
        <Card>
          <CardHeader>
            <CardTitle>Alertas de Mantenimiento Recientes</CardTitle>
            <CardDescription>Mantenimientos que requieren atención</CardDescription>
          </CardHeader>
          <CardContent>
            {alerts && alerts.length > 0 ? (
              <div className="space-y-3">
                {alerts.map((alert: any) => {
                  const getBadgeColor = (urgency: string) => {
                    switch (urgency) {
                      case "critical":
                        return "bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
                      case "warning":
                        return "bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400"
                      default:
                        return "bg-blue-100 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400"
                    }
                  }

                  return (
                    <div
                      key={alert.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${getBadgeColor(alert.urgency_level)}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-current" />
                        <div>
                          <p className="font-medium text-sm">
                            {alert.vehicle_type} - {alert.patent_chasis}
                          </p>
                          <p className="text-sm opacity-80">{alert.description}</p>
                          {alert.next_service_date && (
                            <p className="text-xs opacity-70 mt-1">
                              Próximo servicio:{" "}
                              {new Date(alert.next_service_date).toLocaleDateString("es-AR", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {alert.alert_type === "date" && alert.days_until_service !== null && (
                          <p className="text-sm font-medium">
                            {alert.days_until_service > 0 ? `${alert.days_until_service} días` : "Vencido"}
                          </p>
                        )}
                        {alert.alert_type === "kilometers" && alert.km_until_service !== null && (
                          <p className="text-sm font-medium">{alert.km_until_service} km</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">No hay alertas activas</p>
            )}
            <div className="mt-4">
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/fleet/maintenance" prefetch={false}>
                  Ver todos los mantenimientos →
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
