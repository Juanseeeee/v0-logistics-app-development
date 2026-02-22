"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Search, ChevronLeft, ChevronRight, Pencil } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ClientForm } from "./client-form"

interface ClientProduct {
  product_id: string
  products: {
    id: string
    name: string
  }
}

interface Client {
  id: string
  company: string
  cuit: string | null
  location: string | null
  contact_name: string | null
  contact_phone: string | null
  contact_email: string | null
  commercial_name: string | null
  commercial_phone: string | null
  logistics_name: string | null
  logistics_phone: string | null
  responsibles: string | null
  comments: string | null
  client_products: ClientProduct[]
}

interface ClientListProps {
  clients: Client[]
  products: Array<{ id: string; name: string }>
}

export function ClientList({ clients, products }: ClientListProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)
  const [editingClient, setEditingClient] = useState<Client | null>(null)

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.cuit?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.commercial_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.logistics_name?.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesSearch
  })

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedClients = filteredClients.slice(startIndex, endIndex)

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este cliente?")) return

    setDeleting(id)
    try {
      const supabase = createClient()
      const { error } = await supabase.from("clients").delete().eq("id", id)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error("Error:", error)
      alert("Error al eliminar cliente")
    } finally {
      setDeleting(null)
    }
  }

  if (clients.length === 0) {
    return <div className="border rounded-lg p-12 text-center text-muted-foreground">No hay clientes registrados</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por empresa, CUIT, localidad o contacto..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            className="pl-10"
          />
        </div>
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
              <TableHead>Empresa</TableHead>
              <TableHead>CUIT</TableHead>
              <TableHead>Localidad</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Productos</TableHead>
              <TableHead>Responsables</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedClients.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="font-medium">{client.company}</TableCell>
                <TableCell>{client.cuit || "-"}</TableCell>
                <TableCell>{client.location || "-"}</TableCell>
                <TableCell>
                  {client.contact_name ? (
                    <div className="text-sm">
                      <p className="font-medium">{client.contact_name}</p>
                      {client.contact_phone && <p className="text-muted-foreground text-xs">{client.contact_phone}</p>}
                      {client.contact_email && <p className="text-muted-foreground text-xs">{client.contact_email}</p>}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {client.client_products && client.client_products.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {client.client_products.slice(0, 3).map((cp) => (
                        <Badge key={cp.product_id} variant="secondary" className="text-xs">
                          {cp.products.name}
                        </Badge>
                      ))}
                      {client.client_products.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{client.client_products.length - 3}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="max-w-[200px] truncate">{client.responsibles || "-"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="icon" onClick={() => setEditingClient(client)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDelete(client.id)}
                      disabled={deleting === client.id}
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
          Mostrando {startIndex + 1} a {Math.min(endIndex, filteredClients.length)} de {filteredClients.length} clientes
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

      <Dialog open={!!editingClient} onOpenChange={(open) => !open && setEditingClient(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>
              Modifica los datos del cliente y selecciona los productos que comercializa.
            </DialogDescription>
          </DialogHeader>
          {editingClient && (
            <ClientForm products={products} client={editingClient} onSuccess={() => setEditingClient(null)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
