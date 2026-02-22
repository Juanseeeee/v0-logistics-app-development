"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

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
}

export function VehicleReportCard({ vehicle }: { vehicle: VehicleReport }) {
  const [expanded, setExpanded] = useState(false)

  const averageFuelCost = vehicle.totalLiters > 0 ? vehicle.fuelTotal / vehicle.totalLiters : 0

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <CardTitle className="text-xl">{vehicle.patent_chasis}</CardTitle>
              <Badge variant="secondary">{vehicle.vehicle_type}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{vehicle.transport_company}</p>
            {vehicle.patent_semi && <p className="text-sm text-muted-foreground mt-1">Semi: {vehicle.patent_semi}</p>}
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-[#0038ae]">${vehicle.totalExpenses.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">Gastos Totales</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-4 gap-4">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Mantenimientos</p>
            <p className="text-xl font-semibold">${vehicle.maintenanceTotal.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">{vehicle.maintenanceCount} registros</p>
          </div>

          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Combustible</p>
            <p className="text-xl font-semibold">${vehicle.fuelTotal.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">{vehicle.fuelCount} cargas</p>
          </div>

          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Total Litros</p>
            <p className="text-xl font-semibold">{vehicle.totalLiters.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">litros cargados</p>
          </div>

          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Precio Promedio</p>
            <p className="text-xl font-semibold">${averageFuelCost.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">por litro</p>
          </div>
        </div>

        {expanded && (
          <div className="pt-4 border-t">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3 text-sm">Distribución de Gastos</h4>
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
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
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
                        {vehicle.totalExpenses > 0 ? ((vehicle.fuelTotal / vehicle.totalExpenses) * 100).toFixed(1) : 0}
                        %
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
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

              <div>
                <h4 className="font-semibold mb-3 text-sm">Información Adicional</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Kilómetros actuales</span>
                    <span className="font-medium">{vehicle.kilometers.toLocaleString()} km</span>
                  </div>
                  {vehicle.totalExpenses > 0 && vehicle.kilometers > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Costo por km</span>
                      <span className="font-medium">${(vehicle.totalExpenses / vehicle.kilometers).toFixed(2)}</span>
                    </div>
                  )}
                  {vehicle.fuelCount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Promedio por carga</span>
                      <span className="font-medium">${(vehicle.fuelTotal / vehicle.fuelCount).toFixed(2)}</span>
                    </div>
                  )}
                  {vehicle.maintenanceCount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Promedio mantenimiento</span>
                      <span className="font-medium">
                        ${(vehicle.maintenanceTotal / vehicle.maintenanceCount).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => setExpanded(!expanded)}>
            {expanded ? "Ver Menos" : "Ver Detalles"}
          </Button>

          <Button asChild size="sm" variant="outline" className="bg-transparent">
            <Link href={`/fleet/vehicles/${vehicle.id}`} prefetch={false}>
              Ver Vehículo
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
