"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Trip {
  id: string
  trip_number: number
  date: string
  line: string
  product: string
  loading_location: string
  unloading_location: string
  unloading_address: string | null
  transport_company: string | null
  status: string
  notes: string | null
  client_name: string
  driver: {
    id: string
    name: string
    cuit: string
    chasis: {
      id: string
      patent_chasis: string
      vehicle_type: string
      transport_company: string
    } | null
    semi: {
      id: string
      patent_chasis: string
      vehicle_type: string
    } | null
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "asignado":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
    case "en viaje":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
    case "completado":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
    case "cancelado":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case "asignado":
      return "Asignado"
    case "en viaje":
      return "En Viaje"
    case "completado":
      return "Completado"
    case "cancelado":
      return "Cancelado"
    default:
      return status
  }
}

export function TripList({ trips, onEdit }: { trips: Trip[]; onEdit?: (trip: Trip) => void }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)
  const [filter, setFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este viaje?")) return

    setDeleting(id)
    try {
      const supabase = createClient()
      const { error } = await supabase.from("trips").delete().eq("id", id)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error("Error:", error)
      alert("Error al eliminar viaje")
    } finally {
      setDeleting(null)
    }
  }

  const filteredTrips = trips.filter((trip) => {
    const matchesSearch =
      trip.driver.name.toLowerCase().includes(filter.toLowerCase()) ||
      trip.client_name.toLowerCase().includes(filter.toLowerCase()) ||
      trip.product.toLowerCase().includes(filter.toLowerCase()) ||
      trip.trip_number.toString().includes(filter)

    const matchesStatus = statusFilter === "all" || trip.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Input
          placeholder="Buscar por chofer, cliente, producto o número..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-md"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="asignado">Asignado</SelectItem>
            <SelectItem value="en viaje">En Viaje</SelectItem>
            <SelectItem value="completado">Completado</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="secondary" className="whitespace-nowrap">
          {filteredTrips.length} viaje{filteredTrips.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      {filteredTrips.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center py-12 text-muted-foreground">No hay viajes registrados</p>
          </CardContent>
        </Card>
      ) : (
        filteredTrips.map((trip) => (
          <Card key={trip.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex gap-3 items-start">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                      Viaje #{trip.trip_number}
                      <Badge variant="outline" className="font-normal">
                        {trip.line}
                      </Badge>
                      <Badge className={getStatusColor(trip.status)}>{getStatusLabel(trip.status)}</Badge>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{new Date(trip.date).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-3">
                  <div>
                    <p className="text-muted-foreground text-xs">Cliente</p>
                    <p className="font-medium">{trip.client_name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Chofer</p>
                    <p className="font-medium">{trip.driver.name}</p>
                    <p className="text-xs text-muted-foreground">CUIT: {trip.driver.cuit}</p>
                  </div>
                  {trip.driver.chasis && (
                    <div>
                      <p className="text-muted-foreground text-xs">Chasis</p>
                      <p className="font-medium">
                        {trip.driver.chasis.patent_chasis} - {trip.driver.chasis.vehicle_type}
                      </p>
                    </div>
                  )}
                  {trip.driver.semi && (
                    <div>
                      <p className="text-muted-foreground text-xs">Semi</p>
                      <p className="font-medium">
                        {trip.driver.semi.patent_chasis} - {trip.driver.semi.vehicle_type}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-muted-foreground text-xs">Producto</p>
                    <p className="font-medium">{trip.product}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Carga</p>
                    <p className="font-medium">{trip.loading_location}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Descarga</p>
                    <p className="font-medium">{trip.unloading_location}</p>
                    {trip.status === "completado" && trip.unloading_address && (
                      <p className="text-xs text-muted-foreground mt-1">📍 {trip.unloading_address}</p>
                    )}
                  </div>
                  {trip.transport_company && (
                    <div>
                      <p className="text-muted-foreground text-xs">Transporte</p>
                      <p className="font-medium">{trip.transport_company}</p>
                    </div>
                  )}
                </div>
              </div>

              {trip.notes && (
                <div className="pt-2 border-t">
                  <p className="text-muted-foreground text-xs mb-1">Notas</p>
                  <p className="text-sm">{trip.notes}</p>
                </div>
              )}

              <div className="pt-2 flex gap-2">
                {onEdit && (
                  <Button variant="outline" size="sm" onClick={() => onEdit(trip)}>
                    Editar
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(trip.id)}
                  disabled={deleting === trip.id}
                >
                  {deleting === trip.id ? "Eliminando..." : "Eliminar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
