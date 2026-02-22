"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface FuelRecord {
  id: string
  liters: number
  cost: number
  date: string
  kilometers: number | null
  station: string | null
  created_at: string
}

export function FuelRecordList({ fuelRecords }: { fuelRecords: FuelRecord[] }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este registro?")) return

    setDeleting(id)
    try {
      const supabase = createClient()
      const { error } = await supabase.from("fuel_records").delete().eq("id", id)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error("Error:", error)
      alert("Error al eliminar registro")
    } finally {
      setDeleting(null)
    }
  }

  if (fuelRecords.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center py-12 text-muted-foreground">No hay registros de combustible</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {fuelRecords.map((record) => (
        <Card key={record.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-base">{record.liters} litros</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{new Date(record.date).toLocaleDateString()}</p>
              </div>
              <Badge variant="secondary">${record.cost.toLocaleString()}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm space-y-1">
              <p className="text-muted-foreground">
                Precio por litro:{" "}
                <span className="font-medium text-foreground">${(record.cost / record.liters).toFixed(2)}</span>
              </p>
              {record.kilometers !== null && (
                <p className="text-muted-foreground">
                  Kilómetros: <span className="font-medium text-foreground">{record.kilometers.toLocaleString()}</span>
                </p>
              )}
              {record.station && (
                <p className="text-muted-foreground">
                  Estación: <span className="font-medium text-foreground">{record.station}</span>
                </p>
              )}
            </div>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDelete(record.id)}
              disabled={deleting === record.id}
            >
              {deleting === record.id ? "Eliminando..." : "Eliminar"}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
