"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface VehicleReport {
  id: string
  vehicle_type: string
  patent_chasis: string
  patent_semi: string | null
  transport_company: string
  kilometers: number
  maintenanceTotal: number
  fuelTotal: number
  totalExpenses: number
  maintenanceCount: number
  fuelCount: number
  totalLiters: number
  maintenancesWithOwnParts: number
}

export default function ReportsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [vehicles, setVehicles] = useState<any[]>([])
  const [vehicleReports, setVehicleReports] = useState<VehicleReport[]>([])
  const [filteredReports, setFilteredReports] = useState<VehicleReport[]>([])
  const [loading, setLoading] = useState(true)

  const [searchPatent, setSearchPatent] = useState("")
  const [filterCategory, setFilterCategory] = useState<string>("all")

  const [expandedVehicles, setExpandedVehicles] = useState<Set<string>>(new Set())

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [sortBy, setSortBy] = useState<"desc" | "asc">("desc")

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      setUser(user)

      // Get vehicles with their maintenance and fuel data
      const { data: vehiclesData } = await supabase
        .from("vehicles")
        .select("*")
        .eq("transport_company", "CRONOS SA")
        .order("patent_chasis", { ascending: true })
      setVehicles(vehiclesData || [])

      const { data: maintenances } = await supabase.from("maintenances").select(`
          *,
          maintenance_spare_parts (
            spare_part_id,
            quantity_used
          )
        `)

      // Get all fuel records
      const { data: fuelRecords } = await supabase.from("fuel_records").select("*")

      // Calculate totals by vehicle
      const reports =
        vehiclesData?.map((vehicle) => {
          const vehicleMaintenances = maintenances?.filter((m) => m.vehicle_id === vehicle.id) || []
          const vehicleFuelRecords = fuelRecords?.filter((f) => f.vehicle_id === vehicle.id) || []

          const maintenanceTotal = vehicleMaintenances.reduce((sum, m) => sum + (Number(m.cost) || 0), 0)
          const fuelTotal = vehicleFuelRecords.reduce((sum, f) => sum + Number(f.cost), 0)
          const totalExpenses = maintenanceTotal + fuelTotal

          const totalLiters = vehicleFuelRecords.reduce((sum, f) => sum + Number(f.liters), 0)

          const maintenancesWithOwnParts = vehicleMaintenances.filter((m) => m.uses_own_spare_parts).length

          return {
            ...vehicle,
            maintenanceTotal,
            fuelTotal,
            totalExpenses,
            maintenanceCount: vehicleMaintenances.length,
            fuelCount: vehicleFuelRecords.length,
            totalLiters,
            maintenancesWithOwnParts,
          }
        }) || []

      setVehicleReports(reports)
      setFilteredReports(reports)
      setLoading(false)
    }

    loadData()
  }, [router])

  useEffect(() => {
    let filtered = vehicleReports

    // Filter by patent
    if (searchPatent) {
      filtered = filtered.filter(
        (v) =>
          v.patent_chasis.toLowerCase().includes(searchPatent.toLowerCase()) ||
          (v.patent_semi && v.patent_semi.toLowerCase().includes(searchPatent.toLowerCase())),
      )
    }

    // Filter by category
    if (filterCategory !== "all") {
      filtered = filtered.filter((v) => v.vehicle_type === filterCategory)
    }

    filtered = [...filtered].sort((a, b) => {
      if (sortBy === "desc") {
        return b.totalExpenses - a.totalExpenses
      } else {
        return a.totalExpenses - b.totalExpenses
      }
    })

    setFilteredReports(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }, [searchPatent, filterCategory, vehicleReports, sortBy])

  const toggleExpanded = (vehicleId: string) => {
    setExpandedVehicles((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(vehicleId)) {
        newSet.delete(vehicleId)
      } else {
        newSet.add(vehicleId)
      }
      return newSet
    })
  }

  const totalPages = Math.ceil(filteredReports.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedReports = filteredReports.slice(startIndex, endIndex)

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0038ae] mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando reportes...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="icon">
              <Link href="/fleet">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#0038ae] flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h1 className="text-xl font-bold">Reportes de Gastos</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Reportes por Vehículo</h2>
          <p className="text-muted-foreground">Análisis detallado de gastos por unidad</p>
        </div>

        {/* Overall Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="border-[#0038ae]/20">
            <CardHeader className="pb-3">
              <CardDescription>Total Vehículos</CardDescription>
              <CardTitle className="text-4xl">{filteredReports.length}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Mantenimientos</CardDescription>
              <CardTitle className="text-3xl">
                ${filteredReports.reduce((sum, v) => sum + v.maintenanceTotal, 0).toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Combustible</CardDescription>
              <CardTitle className="text-3xl">
                ${filteredReports.reduce((sum, v) => sum + v.fuelTotal, 0).toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="bg-[#0038ae] text-white border-[#0038ae]">
            <CardHeader className="pb-3">
              <CardDescription className="text-white/80">Total Gastos</CardDescription>
              <CardTitle className="text-3xl">
                ${filteredReports.reduce((sum, v) => sum + v.totalExpenses, 0).toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Vehicle Reports */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Reportes por Vehículo</CardTitle>
              <CardDescription>Análisis de gastos y mantenimientos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <Input
                    placeholder="Buscar por patente..."
                    value={searchPatent}
                    onChange={(e) => setSearchPatent(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los tipos</SelectItem>
                      <SelectItem value="Camión">Camión</SelectItem>
                      <SelectItem value="Semi">Semi</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={(value) => setSortBy(value as "desc" | "asc")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Mayor gasto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Mayor gasto</SelectItem>
                      <SelectItem value="asc">Menor gasto</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={itemsPerPage}
                    onValueChange={(value) => {
                      setItemsPerPage(Number(value))
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="20 por página" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 por página</SelectItem>
                      <SelectItem value="20">20 por página</SelectItem>
                      <SelectItem value="50">50 por página</SelectItem>
                      <SelectItem value="100">100 por página</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-semibold text-sm">Vehículo</th>
                      <th className="text-left p-3 font-semibold text-sm">Tipo</th>
                      <th className="text-right p-3 font-semibold text-sm">Mantenimientos</th>
                      <th className="text-right p-3 font-semibold text-sm">Combustible</th>
                      <th className="text-right p-3 font-semibold text-sm">Total Gastos</th>
                      <th className="text-center p-3 font-semibold text-sm">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedReports && paginatedReports.length > 0 ? (
                      paginatedReports.map((vehicle) => {
                        const isExpanded = expandedVehicles.has(vehicle.id)
                        return (
                          <>
                            <tr key={vehicle.id} className="border-b hover:bg-muted/50 transition-colors">
                              <td className="p-3">
                                <div>
                                  <p className="font-medium">{vehicle.patent_chasis}</p>
                                  {vehicle.patent_semi && (
                                    <p className="text-xs text-muted-foreground">Semi: {vehicle.patent_semi}</p>
                                  )}
                                </div>
                              </td>
                              <td className="p-3">
                                <Badge variant="secondary">{vehicle.vehicle_type}</Badge>
                              </td>
                              <td className="text-right p-3">
                                <p className="font-semibold">${vehicle.maintenanceTotal.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground">{vehicle.maintenanceCount} registros</p>
                                {vehicle.maintenancesWithOwnParts > 0 && (
                                  <p className="text-xs text-[#0038ae] font-medium">
                                    {vehicle.maintenancesWithOwnParts} con repuestos propios
                                  </p>
                                )}
                              </td>
                              <td className="text-right p-3">
                                <p className="font-semibold">${vehicle.fuelTotal.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground">{vehicle.fuelCount} cargas</p>
                              </td>
                              <td className="text-right p-3">
                                <p className="font-bold text-[#0038ae]">${vehicle.totalExpenses.toLocaleString()}</p>
                              </td>
                              <td className="text-center p-3">
                                <div className="flex items-center justify-center gap-2">
                                  <Button variant="ghost" size="sm" onClick={() => toggleExpanded(vehicle.id)}>
                                    {isExpanded ? (
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M5 15l7-7 7 7"
                                        />
                                      </svg>
                                    ) : (
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M19 9l-7 7-7-7"
                                        />
                                      </svg>
                                    )}
                                  </Button>
                                  <Button asChild size="sm" variant="outline">
                                    <Link href={`/fleet/vehicles/${vehicle.id}`} prefetch={false}>
                                      Ver
                                    </Link>
                                  </Button>
                                </div>
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr key={`${vehicle.id}-details`} className="bg-muted/30">
                                <td colSpan={6} className="p-4">
                                  <div className="grid md:grid-cols-3 gap-4">
                                    <div>
                                      <h4 className="font-semibold mb-2 text-sm">Información Adicional</h4>
                                      <div className="space-y-1 text-sm">
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Kilómetros</span>
                                          <span className="font-medium">{vehicle.kilometers.toLocaleString()} km</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Total Litros</span>
                                          <span className="font-medium">{vehicle.totalLiters.toLocaleString()} L</span>
                                        </div>
                                        {vehicle.totalLiters > 0 && (
                                          <div className="flex justify-between">
                                            <span className="text-muted-foreground">Precio Promedio</span>
                                            <span className="font-medium">
                                              ${(vehicle.fuelTotal / vehicle.totalLiters).toFixed(2)}/L
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div>
                                      <h4 className="font-semibold mb-2 text-sm">Promedios</h4>
                                      <div className="space-y-1 text-sm">
                                        {vehicle.kilometers > 0 && (
                                          <div className="flex justify-between">
                                            <span className="text-muted-foreground">Costo por km</span>
                                            <span className="font-medium">
                                              ${(vehicle.totalExpenses / vehicle.kilometers).toFixed(2)}
                                            </span>
                                          </div>
                                        )}
                                        {vehicle.fuelCount > 0 && (
                                          <div className="flex justify-between">
                                            <span className="text-muted-foreground">Por carga combustible</span>
                                            <span className="font-medium">
                                              ${(vehicle.fuelTotal / vehicle.fuelCount).toFixed(2)}
                                            </span>
                                          </div>
                                        )}
                                        {vehicle.maintenanceCount > 0 && (
                                          <div className="flex justify-between">
                                            <span className="text-muted-foreground">Por mantenimiento</span>
                                            <span className="font-medium">
                                              ${(vehicle.maintenanceTotal / vehicle.maintenanceCount).toFixed(2)}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div>
                                      <h4 className="font-semibold mb-2 text-sm">Distribución de Gastos</h4>
                                      <div className="space-y-2">
                                        <div>
                                          <div className="flex justify-between text-sm mb-1">
                                            <span className="text-muted-foreground">Mantenimientos</span>
                                            <span className="font-medium">
                                              {vehicle.totalExpenses > 0
                                                ? ((vehicle.maintenanceTotal / vehicle.totalExpenses) * 100).toFixed(1)
                                                : 0}
                                              %
                                            </span>
                                          </div>
                                          <div className="h-2 bg-background rounded-full overflow-hidden">
                                            <div
                                              className="h-full bg-blue-500"
                                              style={{
                                                width: `${vehicle.totalExpenses > 0 ? (vehicle.maintenanceTotal / vehicle.totalExpenses) * 100 : 0}%`,
                                              }}
                                            />
                                          </div>
                                        </div>
                                        <div>
                                          <div className="flex justify-between text-sm mb-1">
                                            <span className="text-muted-foreground">Combustible</span>
                                            <span className="font-medium">
                                              {vehicle.totalExpenses > 0
                                                ? ((vehicle.fuelTotal / vehicle.totalExpenses) * 100).toFixed(1)
                                                : 0}
                                              %
                                            </span>
                                          </div>
                                          <div className="h-2 bg-background rounded-full overflow-hidden">
                                            <div
                                              className="h-full bg-green-500"
                                              style={{
                                                width: `${vehicle.totalExpenses > 0 ? (vehicle.fuelTotal / vehicle.totalExpenses) * 100 : 0}%`,
                                              }}
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-muted-foreground">
                          No se encontraron vehículos
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {startIndex + 1} a {Math.min(endIndex, filteredReports.length)} de{" "}
                    {filteredReports.length} vehículos
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum
                        if (totalPages <= 5) {
                          pageNum = i + 1
                        } else if (currentPage <= 3) {
                          pageNum = i + 1
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i
                        } else {
                          pageNum = currentPage - 2 + i
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className={currentPage === pageNum ? "bg-[#0038ae]" : ""}
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
