"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Pencil } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TransportCompanyForm } from "@/components/transport-company-form"

interface TransportCompany {
  id: string
  name: string
  cuit: string | null
  address: string | null
  contact_name: string | null
  contact_phone: string | null
  contact_email: string | null
  notes: string | null
  active: boolean
  created_at: string
}

export function TransportCompanyList({ companies: initialCompanies }: { companies: TransportCompany[] }) {
  const [companies, setCompanies] = useState(initialCompanies)
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState<string | null>(null)
  const [editingCompany, setEditingCompany] = useState<TransportCompany | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const handleEdit = (company: TransportCompany) => {
    setEditingCompany(company)
    setIsEditDialogOpen(true)
  }

  const handleCloseEdit = () => {
    setIsEditDialogOpen(false)
    setEditingCompany(null)
  }

  const handleUpdateSuccess = (updatedCompany: TransportCompany) => {
    setCompanies(companies.map((c) => (c.id === updatedCompany.id ? updatedCompany : c)))
    handleCloseEdit()
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de eliminar la empresa "${name}"?`)) return

    setLoading(id)
    try {
      const supabase = createClient()
      const { error } = await supabase.from("transport_companies").delete().eq("id", id)

      if (error) throw error

      setCompanies(companies.filter((c) => c.id !== id))
    } catch (error: any) {
      console.error("Error:", error)
      alert(error.message || "Error al eliminar empresa")
    } finally {
      setLoading(null)
    }
  }

  const filteredCompanies = companies.filter(
    (company) =>
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.cuit?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Buscar por nombre, CUIT o contacto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {filteredCompanies.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          {searchTerm ? "No se encontraron empresas" : "No hay empresas de transporte registradas"}
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>CUIT</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-[100px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompanies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell className="font-medium">{company.name}</TableCell>
                  <TableCell>{company.cuit || "-"}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{company.address || "-"}</TableCell>
                  <TableCell>{company.contact_name || "-"}</TableCell>
                  <TableCell>{company.contact_phone || "-"}</TableCell>
                  <TableCell>{company.contact_email || "-"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(company)}
                        className="h-8 w-8 text-blue-600 hover:text-blue-700"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(company.id, company.name)}
                        disabled={loading === company.id}
                        className="h-8 w-8 text-destructive hover:text-destructive"
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
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Empresa de Transporte</DialogTitle>
            <DialogDescription>Modificar los datos de la empresa de transporte</DialogDescription>
          </DialogHeader>
          {editingCompany && (
            <TransportCompanyForm company={editingCompany} onSuccess={handleUpdateSuccess} onCancel={handleCloseEdit} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
