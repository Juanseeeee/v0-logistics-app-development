"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MaintenanceForm } from "@/components/maintenance-form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus } from "lucide-react"

export default function MaintenancePage() {
  const [user, setUser] = useState<any>(null)
  const [alerts, setAlerts] = useState<any[]>([])
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [drivers, setDrivers] = useState<any[]>([])
  const [spareParts, setSpareParts] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      setUser(user)

      const [alertsResponse, suggestionsResponse, vehiclesResponse, driversResponse, sparePartsResponse] =
        await Promise.all([
          supabase.from("maintenance_alerts").select("*").order("urgency_level", { ascending: true }),
          supabase
            .from("maintenance_suggestions")
            .select("*")
            .eq("needs_alert", true)
            .order("vehicle_type", { ascending: true }),
          supabase
            .from("vehicles")
            .select("*")
            .eq("transport_company", "CRONOS SA")
            .order("patent_chasis", { ascending: true }),
          supabase.from("drivers").select("id, name, cuit").order("name", { ascending: true }),
          supabase.from("spare_parts").select("*").order("name", { ascending: true }),
        ])

      if (alertsResponse.data) {
        const cronosAlerts = alertsResponse.data.filter((alert: any) => {
          const vehicle = vehiclesResponse.data?.find((v: any) => v.id === alert.vehicle_id)
          return vehicle?.transport_company === "CRONOS SA"
        })
        setAlerts(cronosAlerts)
      }
      if (suggestionsResponse.data) setSuggestions(suggestionsResponse.data)
      if (vehiclesResponse.data) setVehicles(vehiclesResponse.data)
      if (driversResponse.data) setDrivers(driversResponse.data)
      if (sparePartsResponse.data) setSpareParts(sparePartsResponse.data)
    }

    checkUser()
  }, [router, supabase])

  const handleSuccess = async () => {
    setOpen(false)
    router.refresh()

    const [alertsResponse, suggestionsResponse, sparePartsResponse, vehiclesResponse] = await Promise.all([
      supabase.from("maintenance_alerts").select("*").order("urgency_level", { ascending: true }),
      supabase
        .from("maintenance_suggestions")
        .select("*")
        .eq("needs_alert", true)
        .order("vehicle_type", { ascending: true }),
      supabase.from("spare_parts").select("*").order("name", { ascending: true }),
      supabase
        .from("vehicles")
        .select("*")
        .eq("transport_company", "CRONOS SA")
        .order("patent_chasis", { ascending: true }),
    ])

    if (alertsResponse.data && vehiclesResponse.data) {
      const cronosAlerts = alertsResponse.data.filter((alert: any) => {
        const vehicle = vehiclesResponse.data.find((v: any) => v.id === alert.vehicle_id)
        return vehicle?.transport_company === "CRONOS SA"
      })
      setAlerts(cronosAlerts)
    }
    if (suggestionsResponse.data) setSuggestions(suggestionsResponse.data)
    if (sparePartsResponse.data) setSpareParts(sparePartsResponse.data)
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "critical":
        return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
      case "warning":
        return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
      default:
        return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
    }
  }

  const getUrgencyLabel = (urgency: string) => {
    switch (urgency) {
      case "critical":
        return "URGENTE"
      case "warning":
        return "PRÓXIMO"
      default:
        return "PROGRAMADO"
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button asChild variant="ghost" size="icon">
              <Link href="/fleet">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
            </Button>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#0038ae] flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c-.94 1.543.826 3.31 2.37 2.37a1.724 1.724 0 002.572 1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h1 className="text-sm sm:text-xl font-bold">Alertas de Mantenimiento</h1>
            </div>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#0038ae] hover:bg-[#0038ae]/90 text-xs sm:text-sm" size="sm">
                <Plus className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Nuevo Mantenimiento</span>
                <span className="sm:hidden">Nuevo</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Registrar Mantenimiento</DialogTitle>
                <DialogDescription>Carga un nuevo mantenimiento para cualquier vehículo de la flota</DialogDescription>
              </DialogHeader>
              {vehicles.length > 0 ? (
                <MaintenanceForm
                  vehicleId={null}
                  vehicles={vehicles}
                  drivers={drivers}
                  spareParts={spareParts}
                  onSuccess={handleSuccess}
                />
              ) : (
                <p className="text-sm text-muted-foreground py-4">No hay vehículos disponibles</p>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Mantenimientos Programados</CardTitle>
            <CardDescription>
              Servicios que ya fueron programados y necesitan atención según fecha o kilometraje
            </CardDescription>
          </CardHeader>
          <CardContent>
            {alerts && alerts.length > 0 ? (
              <div className="space-y-3">
                {alerts.map((alert: any) => (
                  <div key={alert.id} className={`p-4 rounded-lg border ${getUrgencyColor(alert.urgency_level)}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-xs font-bold px-2 py-1 rounded ${
                              alert.urgency_level === "critical"
                                ? "bg-red-600 text-white"
                                : alert.urgency_level === "warning"
                                  ? "bg-yellow-600 text-white"
                                  : "bg-blue-600 text-white"
                            }`}
                          >
                            {getUrgencyLabel(alert.urgency_level)}
                          </span>
                          <h3 className="font-semibold">
                            {alert.vehicle_type} - {alert.patent_chasis}
                          </h3>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
                      </div>
                      <Button asChild size="sm" variant="outline" className="bg-transparent shrink-0 ml-2">
                        <Link href={`/fleet/vehicles/${alert.vehicle_id}`} prefetch={false}>
                          Ver Vehículo
                        </Link>
                      </Button>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 mt-3 text-sm">
                      {alert.next_service_date && (
                        <div>
                          <p className="text-muted-foreground">Próximo servicio (fecha)</p>
                          <p className="font-medium">{new Date(alert.next_service_date).toLocaleDateString()}</p>
                          {alert.days_until_service !== null && (
                            <p
                              className={`text-xs mt-1 font-medium ${
                                alert.days_until_service < 0
                                  ? "text-red-600 dark:text-red-400"
                                  : alert.days_until_service <= 7
                                    ? "text-yellow-600 dark:text-yellow-400"
                                    : "text-muted-foreground"
                              }`}
                            >
                              {alert.days_until_service > 0
                                ? `En ${alert.days_until_service} días`
                                : alert.days_until_service === 0
                                  ? "¡HOY!"
                                  : `¡Vencido hace ${Math.abs(alert.days_until_service)} días!`}
                            </p>
                          )}
                        </div>
                      )}

                      {alert.next_service_km !== null && (
                        <div>
                          <p className="text-muted-foreground">Próximo servicio (km)</p>
                          <p className="font-medium">{alert.next_service_km.toLocaleString()} km</p>
                          {alert.km_until_service !== null && (
                            <p
                              className={`text-xs mt-1 font-medium ${
                                alert.km_until_service < 0
                                  ? "text-red-600 dark:text-red-400"
                                  : alert.km_until_service <= 500
                                    ? "text-yellow-600 dark:text-yellow-400"
                                    : "text-muted-foreground"
                              }`}
                            >
                              {alert.km_until_service > 0
                                ? `Faltan ${alert.km_until_service.toLocaleString()} km`
                                : `¡Excedido por ${Math.abs(alert.km_until_service).toLocaleString()} km!`}
                            </p>
                          )}
                        </div>
                      )}

                      <div>
                        <p className="text-muted-foreground">KM actuales</p>
                        <p className="font-medium">{alert.current_km.toLocaleString()} km</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">No hay mantenimientos programados próximos</p>
            )}
          </CardContent>
        </Card>

        {suggestions && suggestions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Sugerencias de Mantenimiento</CardTitle>
              <CardDescription>
                El sistema detectó que estos mantenimientos podrían necesitarse pronto según los intervalos estándar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {suggestions.map((suggestion: any, index: number) => (
                  <div
                    key={`suggestion-${suggestion.vehicle_id}-${suggestion.maintenance_type}-${index}`}
                    className="p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg border border-gray-200 dark:border-gray-800"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold px-2 py-1 rounded bg-gray-600 text-white">SUGERENCIA</span>
                          <h3 className="font-semibold">
                            {suggestion.vehicle_type} - {suggestion.patent_chasis}
                          </h3>
                        </div>
                        <p className="text-sm font-medium text-[#0038ae] dark:text-blue-400 mt-1">
                          {suggestion.maintenance_type}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{suggestion.description}</p>
                      </div>
                      <Button asChild size="sm" variant="outline" className="bg-transparent shrink-0 ml-2">
                        <Link href={`/fleet/vehicles/${suggestion.vehicle_id}`} prefetch={false}>
                          Programar
                        </Link>
                      </Button>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 mt-3 text-sm">
                      {suggestion.last_service_date && (
                        <div>
                          <p className="text-muted-foreground">Último servicio</p>
                          <p className="font-medium">{new Date(suggestion.last_service_date).toLocaleDateString()}</p>
                          {suggestion.suggested_next_date && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Sugerido: {new Date(suggestion.suggested_next_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      )}

                      {suggestion.last_service_km !== null && (
                        <div>
                          <p className="text-muted-foreground">Último servicio (km)</p>
                          <p className="font-medium">{suggestion.last_service_km.toLocaleString()} km</p>
                          {suggestion.suggested_next_km && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Sugerido: {suggestion.suggested_next_km.toLocaleString()} km
                            </p>
                          )}
                        </div>
                      )}

                      <div>
                        <p className="text-muted-foreground">KM actuales</p>
                        <p className="font-medium">{suggestion.current_km.toLocaleString()} km</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
