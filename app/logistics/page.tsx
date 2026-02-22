import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"

export default async function LogisticsDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get statistics
  const { count: driversCount } = await supabase.from("drivers").select("*", { count: "exact", head: true })

  const { count: tripsCount } = await supabase
    .from("trips")
    .select("*", { count: "exact", head: true })
    .gte("date", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())

  const { count: activeTrips } = await supabase
    .from("trips")
    .select("*", { count: "exact", head: true })
    .in("status", ["asignado", "en viaje"])

  const { count: completedTrips } = await supabase
    .from("trips")
    .select("*", { count: "exact", head: true })
    .eq("status", "completado")
    .gte("date", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())

  // Get driver availability
  const { data: availability } = await supabase.from("driver_availability").select("*").limit(5)

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
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Dashboard Logístico</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Control y seguimiento de viajes propios y tercerizados</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Viajes este Mes</CardDescription>
              <CardTitle className="text-4xl">{tripsCount || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Total de viajes realizados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Viajes Activos</CardDescription>
              <CardTitle className="text-4xl text-orange-500">{activeTrips || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">En curso o asignados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Viajes Completados</CardDescription>
              <CardTitle className="text-4xl text-green-500">{completedTrips || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Este mes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Choferes Registrados</CardDescription>
              <CardTitle className="text-4xl">{driversCount || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Total en sistema</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Button asChild size="lg" className="h-auto py-6 flex-col gap-2 bg-[#0038ae] hover:bg-[#0038ae]/90">
            <Link href="/logistics/trips" prefetch={false}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <span>Viajes</span>
            </Link>
          </Button>

          <Button asChild size="lg" className="h-auto py-6 flex-col gap-2 bg-[#0038ae] hover:bg-[#0038ae]/90">
            <Link href="/logistics/l2-trips" prefetch={false}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
              <span>Viajes L2</span>
            </Link>
          </Button>

          <Button asChild size="lg" className="h-auto py-6 flex-col gap-2 bg-[#0038ae] hover:bg-[#0038ae]/90">
            <Link href="/logistics/tariffs" prefetch={false}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Tarifario</span>
            </Link>
          </Button>

          <Button asChild size="lg" variant="outline" className="h-auto py-6 flex-col gap-2 bg-transparent">
            <Link href="/logistics/drivers" prefetch={false}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <span>Choferes</span>
            </Link>
          </Button>

          <Button asChild size="lg" variant="outline" className="h-auto py-6 flex-col gap-2 bg-transparent">
            <Link href="/logistics/map" prefetch={false}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
              <span>Mapa</span>
            </Link>
          </Button>

          <Button asChild size="lg" variant="outline" className="h-auto py-6 flex-col gap-2 bg-transparent">
            <Link href="/logistics/clients" prefetch={false}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <span>Clientes</span>
            </Link>
          </Button>

          <Button asChild size="lg" variant="outline" className="h-auto py-6 flex-col gap-2 bg-transparent">
            <Link href="/logistics/products" prefetch={false}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <span>Productos</span>
            </Link>
          </Button>

          <Button asChild size="lg" variant="outline" className="h-auto py-6 flex-col gap-2 bg-transparent">
            <Link href="/logistics/transport-companies" prefetch={false}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <span>Empresas de Transporte</span>
            </Link>
          </Button>

          <Button asChild size="lg" variant="outline" className="h-auto py-6 flex-col gap-2 bg-transparent">
            <Link href="/logistics/locations" prefetch={false}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span>Ubicaciones</span>
            </Link>
          </Button>
        </div>

        {/* Driver Availability Section */}
        <Card>
          <CardHeader>
            <CardTitle>Disponibilidad de Choferes</CardTitle>
            <CardDescription>Estado actual de los choferes</CardDescription>
          </CardHeader>
          <CardContent>
            {availability && availability.length > 0 ? (
              <div className="space-y-3">
                {availability.map((driver: any) => {
                  const getStatusColor = (status: string) => {
                    switch (status) {
                      case "available":
                        return "bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                      case "on_trip":
                        return "bg-orange-100 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"
                      case "maintenance":
                        return "bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                      default:
                        return "bg-gray-100 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800"
                    }
                  }

                  const getStatusLabel = (status: string) => {
                    switch (status) {
                      case "available":
                        return "Disponible"
                      case "on_trip":
                        return "En viaje"
                      case "maintenance":
                        return "En mantenimiento"
                      default:
                        return "Desconocido"
                    }
                  }

                  const driverName = driver.name || "Desconocido"
                  const status = driver.is_available ? "available" : driver.trip_status ? "on_trip" : "maintenance"

                  return (
                    <div
                      key={driver.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${getStatusColor(status)}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#0038ae] flex items-center justify-center text-white font-bold">
                          {driverName?.charAt(0) || "?"}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{driverName}</p>
                          <p className="text-xs text-muted-foreground">{getStatusLabel(status)}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">No hay información de disponibilidad</p>
            )}
            <div className="mt-4">
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/logistics/drivers" prefetch={false}>
                  Ver todos los choferes →
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
