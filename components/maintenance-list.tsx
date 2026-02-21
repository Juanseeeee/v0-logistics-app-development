"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Maintenance {
  id: string
  description: string
  cost: number | null
  date: string
  kilometers_at_service: number | null
  next_service_date: string | null
  next_service_km: number | null
  created_at: string
}

export function MaintenanceList({ maintenances }: { maintenances: Maintenance[] }) {
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
                <CardTitle className="text-base">{maintenance.description}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{new Date(maintenance.date).toLocaleDateString()}</p>
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

            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDelete(maintenance.id)}
              disabled={deleting === maintenance.id}
            >
              {deleting === maintenance.id ? "Eliminando..." : "Eliminar"}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
