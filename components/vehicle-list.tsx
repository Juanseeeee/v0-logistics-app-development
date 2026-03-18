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
import { Pencil, Trash2, Eye } from "lucide-react"
import { VehicleForm } from "./vehicle-form"

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
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)

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
          <input
            type="text"
            placeholder="Buscar por patente o empresa..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full px-4 py-2 border rounded-lg"
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
                    <Dialog open={editingVehicle?.id === vehicle.id} onOpenChange={(open) => !open && setEditingVehicle(null)}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setEditingVehicle(vehicle)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Editar Vehículo</DialogTitle>
                          <DialogDescription>
                            Actualiza los datos del vehículo {vehicle.patent_chasis}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="pt-4">
                          <VehicleForm 
                            initialData={vehicle} 
                            onSuccess={() => setEditingVehicle(null)} 
                          />
                        </div>
                      </DialogContent></Dialog>
                    
                    <Button asChild variant="outline" size="icon">
                      <Link href={`/fleet/vehicles/${vehicle.id}`} prefetch={false}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(vehicle.id)}
                      disabled={updating === vehicle.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
        <div className="flex justify-center gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          <div className="flex items-center px-4">
            Página {currentPage} de {totalPages}
          </div>
          <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  )
}
