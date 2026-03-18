"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LinkPurchaseOrderDialog } from "@/components/maintenance/link-purchase-order-dialog"

interface Maintenance {
  id: string
  description: string
  cost: number | null
  date: string
  kilometers_at_service: number | null
  next_service_date: string | null
  next_service_km: number | null
  created_at: string
  vehicles?: {
    patent_chasis: string
    vehicle_type: string
  } | null
  completed?: boolean
}

export function MaintenanceList({ maintenances, showVehicle = false, onEdit }: { maintenances: Maintenance[], showVehicle?: boolean, onEdit?: (maintenance: Maintenance) => void }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este registro?")) return

    setDeleting(id)
    try {
      const supabase = createClient()
      const { error } = await supabase.from("maintenances").delete().eq("id", id)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error("Error:", error)
      alert("Error al eliminar registro")
    } finally {
      setDeleting(null)
    }
  }

  if (maintenances.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center py-12 text-muted-foreground">No hay registros de mantenimiento</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {maintenances.map((maintenance) => (
        <Card key={maintenance.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <CardTitle className="text-base">{maintenance.description}</CardTitle>
                  {maintenance.completed === false && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400">Programado</Badge>
                  )}
                  {maintenance.completed === true && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400">Completado</Badge>
                  )}
                </div>
                {showVehicle && maintenance.vehicles && (
                  <p className="text-sm font-medium text-[#0038ae] mb-1">
                    {maintenance.vehicles.patent_chasis} <span className="text-muted-foreground font-normal">({maintenance.vehicles.vehicle_type})</span>
                  </p>
                )}
                <p className="text-sm text-muted-foreground mt-1">
                  {maintenance.completed === false ? 'Fecha programada:' : 'Fecha:'} {new Date(maintenance.date).toLocaleDateString()}
                </p>
              </div>
              {maintenance.cost && (
                <Badge variant="secondary" className="ml-2">
                  ${maintenance.cost.toLocaleString()}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm space-y-1">
              {maintenance.kilometers_at_service !== null && (
                <p className="text-muted-foreground">
                  KM al servicio:{" "}
                  <span className="font-medium text-foreground">
                    {maintenance.kilometers_at_service.toLocaleString()}
                  </span>
                </p>
              )}
              {maintenance.next_service_date && (
                <p className="text-muted-foreground">
                  Próximo servicio (fecha):{" "}
                  <span className="font-medium text-foreground">
                    {new Date(maintenance.next_service_date).toLocaleDateString()}
                  </span>
                </p>
              )}
              {maintenance.next_service_km !== null && (
                <p className="text-muted-foreground">
                  Próximo servicio (KM):{" "}
                  <span className="font-medium text-foreground">{maintenance.next_service_km.toLocaleString()}</span>
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <LinkPurchaseOrderDialog maintenanceId={maintenance.id} />
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(maintenance)}
                >
                  Editar
                </Button>
              )}
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(maintenance.id)}
                disabled={deleting === maintenance.id}
              >
                {deleting === maintenance.id ? "Eliminando..." : "Eliminar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
