"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Pencil, Trash2, Eye } from "lucide-react"

interface Vehicle {
  id: string
  vehicle_type: string
  patent_chasis: string
  patent_semi: string | null
  transport_company: string
  kilometers: number
  created_at: string
}

export function VehicleList({ vehicles }: { vehicles: Vehicle[] }) {
  const router = useRouter()
  const [updating, setUpdating] = useState<string | null>(null)
  const [editingKm, setEditingKm] = useState<{ id: string; km: number } | null>(null)

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este vehículo?")) return

    setUpdating(id)
    try {
      const supabase = createClient()
      const { error } = await supabase.from("vehicles").delete().eq("id", id)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error("Error:", error)
      alert("Error al eliminar vehículo")
    } finally {
      setUpdating(null)
    }
  }

  const handleUpdateKm = async () => {
    if (!editingKm) return

    setUpdating(editingKm.id)
    try {
      const supabase = createClient()
      const { error } = await supabase.from("vehicles").update({ kilometers: editingKm.km }).eq("id", editingKm.id)

      if (error) throw error

      setEditingKm(null)
      router.refresh()
    } catch (error) {
      console.error("Error:", error)
      alert("Error al actualizar kilómetros")
    } finally {
      setUpdating(null)
    }
  }

  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch =
      vehicle.patent_chasis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.patent_semi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.transport_company.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = filterType === "all" || vehicle.vehicle_type === filterType

    return matchesSearch && matchesType
  })

  const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedVehicles = filteredVehicles.slice(startIndex, endIndex)

  if (vehicles.length === 0) {
    return <div className="border rounded-lg p-12 text-center text-muted-foreground">No hay vehículos registrados</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Buscar por patente o empresa..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value)
              setCurrentPage(1)
            }}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">Todos los tipos</option>
            <option value="Camión">Camión</option>
            <option value="Semi">Semi</option>
          </select>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value))
              setCurrentPage(1)
            }}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="10">10 por página</option>
            <option value="20">20 por página</option>
            <option value="50">50 por página</option>
            <option value="100">100 por página</option>
          </select>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patente Chasis</TableHead>
              <TableHead>Patente Semi</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead className="text-right">Kilómetros</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedVehicles.map((vehicle) => (
              <TableRow key={vehicle.id}>
                <TableCell className="font-medium">{vehicle.patent_chasis}</TableCell>
                <TableCell>{vehicle.patent_semi || "-"}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{vehicle.vehicle_type}</Badge>
                </TableCell>
                <TableCell>{vehicle.transport_company}</TableCell>
                <TableCell className="text-right">{vehicle.kilometers.toLocaleString()} km</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setEditingKm({ id: vehicle.id, km: vehicle.kilometers })}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Actualizar Kilómetros</DialogTitle>
                          <DialogDescription>
                            Actualiza el kilometraje actual del vehículo {vehicle.patent_chasis}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <div className="space-y-2">
                            <Label htmlFor="new_km">Kilómetros</Label>
                            <Input
                              id="new_km"
                              type="number"
                              min="0"
                              value={editingKm?.km || 0}
                              onChange={(e) =>
                                editingKm && setEditingKm({ ...editingKm, km: Number.parseInt(e.target.value) || 0 })
                              }
                            />
                          </div>
                          <Button
                            onClick={handleUpdateKm}
                            className="w-full bg-[#0038ae] hover:bg-[#0038ae]/90"
                            disabled={updating === vehicle.id}
                          >
                            {updating === vehicle.id ? "Actualizando..." : "Actualizar"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button asChild variant="outline" size="icon">
                      <Link href={`/fleet/vehicles/${vehicle.id}`} prefetch={false}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>

                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDelete(vehicle.id)}
                      disabled={updating === vehicle.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Mostrando {startIndex + 1} a {Math.min(endIndex, filteredVehicles.length)} de {filteredVehicles.length}{" "}
            vehículos
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
    </div>
  )
}
