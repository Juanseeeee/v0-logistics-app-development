"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { SparePartForm } from "./spare-part-form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SparePartListProps {
  spareParts: any[]
  onUpdate: () => void
}

export function SparePartList({ spareParts: initialSpareParts, onUpdate }: SparePartListProps) {
  const [spareParts, setSpareParts] = useState(initialSpareParts)
  const [editingPart, setEditingPart] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)

  // Filter and search
  const filteredParts = spareParts.filter((part) => {
    const matchesSearch =
      part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === "all" || part.category === filterCategory

    return matchesSearch && matchesCategory
  })

  // Pagination
  const totalPages = Math.ceil(filteredParts.length / itemsPerPage)
  const paginatedParts = filteredParts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este repuesto?")) return

    const supabase = createClient()
    const { error } = await supabase.from("spare_parts").delete().eq("id", id)

    if (error) {
      alert("Error al eliminar repuesto")
      return
    }

    setSpareParts(spareParts.filter((p) => p.id !== id))
    onUpdate()
  }

  const handleSuccess = () => {
    setIsDialogOpen(false)
    setEditingPart(null)
    onUpdate()
  }

  const getStockBadge = (quantity: number) => {
    if (quantity === 0) return <Badge variant="destructive">Sin stock</Badge>
    if (quantity <= 5) return <Badge className="bg-yellow-500">Stock bajo</Badge>
    return <Badge className="bg-green-500">En stock</Badge>
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Buscar por nombre o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            <SelectItem value="Gomas">Gomas</SelectItem>
            <SelectItem value="Filtros">Filtros</SelectItem>
            <SelectItem value="Aceites">Aceites</SelectItem>
            <SelectItem value="Frenos">Frenos</SelectItem>
            <SelectItem value="Eléctricos">Eléctricos</SelectItem>
            <SelectItem value="Suspensión">Suspensión</SelectItem>
            <SelectItem value="Motor">Motor</SelectItem>
            <SelectItem value="Otro">Otro</SelectItem>
          </SelectContent>
        </Select>
        <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
          <SelectTrigger className="w-[120px]">
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

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Repuesto</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead className="text-center">Stock</TableHead>
              <TableHead className="text-right">Costo Unit.</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedParts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No se encontraron repuestos
                </TableCell>
              </TableRow>
            ) : (
              paginatedParts.map((part) => (
                <TableRow key={part.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{part.name}</p>
                      {part.description && <p className="text-sm text-muted-foreground">{part.description}</p>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{part.category}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      {getStockBadge(part.stock_quantity)}
                      <span className="text-sm">{part.stock_quantity} unidades</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {part.unit_cost ? `$${Number(part.unit_cost).toLocaleString()}` : "-"}
                  </TableCell>
                  <TableCell>{part.location || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog
                        open={isDialogOpen && editingPart?.id === part.id}
                        onOpenChange={(open) => {
                          setIsDialogOpen(open)
                          if (!open) setEditingPart(null)
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingPart(part)
                              setIsDialogOpen(true)
                            }}
                          >
                            Editar
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Editar Repuesto</DialogTitle>
                          </DialogHeader>
                          <SparePartForm sparePart={editingPart} onSuccess={handleSuccess} />
                        </DialogContent>
                      </Dialog>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(part.id)}>
                        Eliminar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {(currentPage - 1) * itemsPerPage + 1} a{" "}
            {Math.min(currentPage * itemsPerPage, filteredParts.length)} de {filteredParts.length} repuestos
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <span className="flex items-center px-3 text-sm">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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
