"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { LocationForm } from "./location-form"
import { createBrowserClient } from "@/lib/supabase/client"
import { Pencil, Trash2, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Location {
  id: string
  name: string
  address: string
  city?: string
  province?: string
  country?: string
  latitude?: number
  longitude?: number
  location_type: string
  notes?: string
  active: boolean
}

interface LocationListProps {
  locations: Location[]
  onRefresh: () => void
}

export function LocationList({ locations, onRefresh }: LocationListProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const supabase = createBrowserClient()

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta ubicación?")) {
      return
    }

    try {
      const { error } = await supabase.from("locations").delete().eq("id", id)

      if (error) throw error

      onRefresh()
    } catch (error) {
      console.error("Error deleting location:", error)
      alert("Error al eliminar la ubicación")
    }
  }

  const handleSuccess = () => {
    setIsCreateDialogOpen(false)
    setEditingLocation(null)
    onRefresh()
  }

  const getLocationTypeLabel = (type: string) => {
    switch (type) {
      case "loading":
        return <Badge variant="secondary">Carga</Badge>
      case "unloading":
        return <Badge variant="secondary">Descarga</Badge>
      case "both":
        return <Badge>Ambos</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Ubicaciones</h2>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Ubicación
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Dirección</TableHead>
              <TableHead>Ciudad</TableHead>
              <TableHead>Provincia</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {locations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No hay ubicaciones registradas
                </TableCell>
              </TableRow>
            ) : (
              locations.map((location) => (
                <TableRow key={location.id}>
                  <TableCell className="font-medium">{location.name}</TableCell>
                  <TableCell>{location.address}</TableCell>
                  <TableCell>{location.city || "-"}</TableCell>
                  <TableCell>{location.province || "-"}</TableCell>
                  <TableCell>{getLocationTypeLabel(location.location_type)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => setEditingLocation(location)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(location.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nueva Ubicación</DialogTitle>
          </DialogHeader>
          <LocationForm onSuccess={handleSuccess} onCancel={() => setIsCreateDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingLocation} onOpenChange={(open) => !open && setEditingLocation(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Ubicación</DialogTitle>
          </DialogHeader>
          {editingLocation && (
            <LocationForm
              location={editingLocation}
              onSuccess={handleSuccess}
              onCancel={() => setEditingLocation(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
