"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Power, PowerOff, Search, ChevronLeft, ChevronRight, Unlock, Pencil } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface Driver {
  id: string
  name: string
  cuit: string
  active: boolean
  transport_company_id: string | null
  transport_company: {
    id: string
    name: string
  } | null
  chasis: {
    id: string
    patent_chasis: string
    vehicle_type: string
  } | null
  semi: {
    id: string
    patent_chasis: string
    vehicle_type: string
  } | null
}

export function DriverList({
  drivers,
  userRole,
  vehicles,
  transportCompanies,
}: {
  drivers: Driver[]
  userRole?: string
  vehicles: { id: string; patent_chasis: string; vehicle_type: string }[]
  transportCompanies: { id: string; name: string }[]
}) {
  const router = useRouter()
  const [updating, setUpdating] = useState<string | null>(null)

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const [editingDriver, setEditingDriver] = useState<Driver | null>(null)
  const [editFormData, setEditFormData] = useState({
    name: "",
    cuit: "",
    transport_company_id: "",
    chasis_id: "",
    semi_id: "",
  })

  const filteredDrivers = drivers.filter((driver) => {
    const matchesSearch =
      driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.cuit.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.chasis?.patent_chasis.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.semi?.patent_chasis.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.transport_company?.name.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && driver.active) ||
      (statusFilter === "inactive" && !driver.active)

    return matchesSearch && matchesStatus
  })

  const totalPages = Math.ceil(filteredDrivers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedDrivers = filteredDrivers.slice(startIndex, endIndex)

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    setUpdating(id)
    try {
      const supabase = createClient()
      const { error } = await supabase.from("drivers").update({ active: !currentActive }).eq("id", id)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error("Error:", error)
      alert("Error al actualizar estado")
    } finally {
      setUpdating(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este chofer?")) return

    setUpdating(id)
    try {
      const supabase = createClient()
      const { error } = await supabase.from("drivers").delete().eq("id", id)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error("Error:", error)
      alert("Error al eliminar chofer")
    } finally {
      setUpdating(null)
    }
  }

  const handleUnlock = async (id: string) => {
    if (!confirm("¿Desbloquear este chofer y permitir asignación a nuevos viajes?")) return

    setUpdating(id)
    try {
      const supabase = createClient()
      // Activate the driver to unlock them
      const { error } = await supabase.from("drivers").update({ active: true }).eq("id", id)

      if (error) throw error

      alert("Chofer desbloqueado exitosamente")
      router.refresh()
    } catch (error) {
      console.error("Error:", error)
      alert("Error al desbloquear chofer")
    } finally {
      setUpdating(null)
    }
  }

  const handleEdit = (driver: Driver) => {
    setEditingDriver(driver)
    setEditFormData({
      name: driver.name,
      cuit: driver.cuit,
      transport_company_id: driver.transport_company_id || "",
      chasis_id: driver.chasis?.id || "none",
      semi_id: driver.semi?.id || "none",
    })
  }

  const handleSaveEdit = async () => {
    if (!editingDriver) return

    setUpdating(editingDriver.id)
    try {
      const supabase = createClient()
      const selectedCompany = transportCompanies.find((c) => c.id === editFormData.transport_company_id)
      const updateData = {
        name: editFormData.name,
        cuit: editFormData.cuit,
        transport_company_id: editFormData.transport_company_id,
        transport_company: selectedCompany?.name || null,
        chasis_id: editFormData.chasis_id === "none" ? null : editFormData.chasis_id,
        semi_id: editFormData.semi_id === "none" ? null : editFormData.semi_id,
      }

      const { error } = await supabase.from("drivers").update(updateData).eq("id", editingDriver.id)

      if (error) throw error

      setEditingDriver(null)
      router.refresh()
    } catch (error) {
      console.error("Error:", error)
      alert("Error al actualizar chofer")
    } finally {
      setUpdating(null)
    }
  }

  if (drivers.length === 0) {
    return <div className="border rounded-lg p-12 text-center text-muted-foreground">No hay choferes registrados</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, CUIT, patente o empresa..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            className="pl-10"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value)
            setCurrentPage(1)
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="inactive">Inactivos</SelectItem>
          </SelectContent>
        </Select>
        <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 por página</SelectItem>
            <SelectItem value="20">20 por página</SelectItem>
            <SelectItem value="50">50 por página</SelectItem>
            <SelectItem value="100">100 por página</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>CUIT</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Chasis</TableHead>
              <TableHead>Semi</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedDrivers.map((driver) => (
              <TableRow key={driver.id}>
                <TableCell className="font-medium">{driver.name}</TableCell>
                <TableCell>{driver.cuit}</TableCell>
                <TableCell>{driver.transport_company?.name || "-"}</TableCell>
                <TableCell>
                  {driver.chasis ? (
                    <div className="text-sm">
                      <p className="font-medium">{driver.chasis.patent_chasis}</p>
                      <p className="text-muted-foreground text-xs">{driver.chasis.vehicle_type}</p>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {driver.semi ? (
                    <div className="text-sm">
                      <p className="font-medium">{driver.semi.patent_chasis}</p>
                      <p className="text-muted-foreground text-xs">{driver.semi.vehicle_type}</p>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={driver.active ? "default" : "secondary"}>
                    {driver.active ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {!driver.active && (userRole === "admin" || userRole === "owner" || userRole === "manager") && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleUnlock(driver.id)}
                        disabled={updating === driver.id}
                        title="Desbloquear chofer"
                        className="border-orange-500 text-orange-500 hover:bg-orange-50"
                      >
                        <Unlock className="h-4 w-4" />
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(driver)}
                      disabled={updating === driver.id}
                      title="Editar chofer"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleToggleActive(driver.id, driver.active)}
                      disabled={updating === driver.id}
                      title={driver.active ? "Desactivar" : "Activar"}
                    >
                      {driver.active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                    </Button>

                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDelete(driver.id)}
                      disabled={updating === driver.id}
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

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando {startIndex + 1} a {Math.min(endIndex, filteredDrivers.length)} de {filteredDrivers.length} choferes
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog open={!!editingDriver} onOpenChange={(open) => !open && setEditingDriver(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Chofer</DialogTitle>
            <DialogDescription>Modifica los datos del chofer</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nombre</Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-cuit">CUIT</Label>
              <Input
                id="edit-cuit"
                value={editFormData.cuit}
                onChange={(e) => setEditFormData({ ...editFormData, cuit: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-transport">Empresa de Transporte</Label>
              <Select
                value={editFormData.transport_company_id}
                onValueChange={(value) => setEditFormData({ ...editFormData, transport_company_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar empresa" />
                </SelectTrigger>
                <SelectContent>
                  {transportCompanies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-chasis">Chasis</Label>
              <Select
                value={editFormData.chasis_id}
                onValueChange={(value) => setEditFormData({ ...editFormData, chasis_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar vehículo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ninguno</SelectItem>
                  {vehicles
                    .filter((v) => v.vehicle_type === "Camión")
                    .map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.patent_chasis} - {vehicle.vehicle_type}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-semi">Semi</Label>
              <Select
                value={editFormData.semi_id}
                onValueChange={(value) => setEditFormData({ ...editFormData, semi_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar semi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ninguno</SelectItem>
                  {vehicles
                    .filter((v) => v.vehicle_type === "Semi")
                    .map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.patent_chasis} - {vehicle.vehicle_type}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditingDriver(null)} className="flex-1">
                Cancelar
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={!!updating}
                className="flex-1 bg-[#0038ae] hover:bg-[#0038ae]/90"
              >
                {updating ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
