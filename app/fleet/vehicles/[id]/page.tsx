import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MaintenanceForm } from "@/components/maintenance-form"
import { MaintenanceList } from "@/components/maintenance-list"
import { FuelRecordForm } from "@/components/fuel-record-form"
import { FuelRecordList } from "@/components/fuel-record-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: vehicle } = await supabase.from("vehicles").select("*").eq("id", id).single()

  if (!vehicle) {
    notFound()
  }

  const { data: maintenances } = await supabase
    .from("maintenances")
    .select("*")
    .eq("vehicle_id", id)
    .order("date", { ascending: false })

  const { data: fuelRecords } = await supabase
    .from("fuel_records")
    .select("*")
    .eq("vehicle_id", id)
    .order("date", { ascending: false })

  const { data: alerts } = await supabase
    .from("maintenance_alerts")
    .select("*")
    .eq("vehicle_id", id)
    .order("next_service_date", { ascending: true })

  // Calculate totals
  const maintenanceTotal = maintenances?.reduce((sum, m) => sum + (Number(m.cost) || 0), 0) || 0
  const fuelTotal = fuelRecords?.reduce((sum, f) => sum + Number(f.cost), 0) || 0

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="icon">
              <Link href="/fleet/vehicles" prefetch={false}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
            </Button>

            <div>
              <h1 className="text-xl font-bold">{vehicle.patent_chasis}</h1>
              <p className="text-sm text-muted-foreground">{vehicle.vehicle_type}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Vehicle Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Información del Vehículo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Tipo</p>
                <Badge variant="secondary" className="mt-1">
                  {vehicle.vehicle_type}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Patente Chasis</p>
                <p className="font-medium mt-1">{vehicle.patent_chasis}</p>
              </div>
              {vehicle.patent_semi && (
                <div>
                  <p className="text-sm text-muted-foreground">Patente Semi</p>
                  <p className="font-medium mt-1">{vehicle.patent_semi}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Empresa</p>
                <p className="font-medium mt-1">{vehicle.transport_company}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Kilómetros</p>
                <p className="font-medium mt-1">{vehicle.kilometers.toLocaleString()} km</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        {alerts && alerts.length > 0 && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                Alertas de Mantenimiento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {alerts.map((alert: any) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded border"
                >
                  <div>
                    <p className="font-medium text-sm">{alert.description}</p>
                    {alert.next_service_date && (
                      <p className="text-xs text-muted-foreground">
                        Próximo servicio: {new Date(alert.next_service_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    {alert.days_until_service !== null && (
                      <p className="text-sm font-medium">
                        {alert.days_until_service > 0 ? `${alert.days_until_service} días` : "Vencido"}
                      </p>
                    )}
                    {alert.km_until_service !== null && (
                      <p className="text-sm font-medium">{alert.km_until_service} km restantes</p>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Mantenimientos</CardDescription>
              <CardTitle className="text-3xl">${maintenanceTotal.toLocaleString()}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Combustible</CardDescription>
              <CardTitle className="text-3xl">${fuelTotal.toLocaleString()}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Gastos</CardDescription>
              <CardTitle className="text-3xl">${(maintenanceTotal + fuelTotal).toLocaleString()}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="maintenance" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="maintenance">Mantenimientos</TabsTrigger>
            <TabsTrigger value="fuel">Combustible</TabsTrigger>
          </TabsList>

          <TabsContent value="maintenance" className="space-y-6">
            <div className="grid lg:grid-cols-[400px_1fr] gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Registrar Mantenimiento</CardTitle>
                </CardHeader>
                <CardContent>
                  <MaintenanceForm vehicleId={id} currentKm={vehicle.kilometers} />
                </CardContent>
              </Card>

              <div>
                <MaintenanceList maintenances={maintenances || []} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="fuel" className="space-y-6">
            <div className="grid lg:grid-cols-[400px_1fr] gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Registrar Carga</CardTitle>
                </CardHeader>
                <CardContent>
                  <FuelRecordForm vehicleId={id} currentKm={vehicle.kilometers} />
                </CardContent>
              </Card>

              <div>
                <FuelRecordList fuelRecords={fuelRecords || []} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
