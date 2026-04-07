"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { FileText, Loader2, Upload, X } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

type Document = {
  id: string
  document_type_name: string
  entity_name: string | null
  transport_company_id?: string | null
  transport_company_name?: string | null
  file_name: string | null
  file_url: string | null
  issue_date: string | null
  expiry_date: string | null
  notes: string | null
  created_at: string
}

type TransportCompany = {
  id: string
  name: string
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  document: Document | null
  onSuccess: () => void
  userId: string
  transportCompanies: TransportCompany[]
}

export function DocumentEditDialog({ open, onOpenChange, document, onSuccess, userId, transportCompanies }: Props) {
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [hasNoExpiry, setHasNoExpiry] = useState(false)
  const [formData, setFormData] = useState({
    entityName: "",
    transportCompanyId: "",
    issueDate: "",
    expiryDate: "",
    notes: "",
  })

  useEffect(() => {
    if (document) {
      setFormData({
        entityName: document.entity_name || "",
        transportCompanyId: document.transport_company_id || "",
        issueDate: document.issue_date || "",
        expiryDate: document.expiry_date || "",
        notes: document.notes || "",
      })
      setHasNoExpiry(!document.expiry_date)
      setFile(null)
    }
  }, [document])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!document) return

    setLoading(true)

    try {
      const supabase = createClient()
      const selectedTransportCompany = transportCompanies.find((company) => company.id === formData.transportCompanyId)
      const updates: any = {
        entity_name: formData.entityName || null,
        issue_date: formData.issueDate || null,
        expiry_date: hasNoExpiry ? null : formData.expiryDate || null,
        notes: formData.notes || null,
      }

      if (formData.transportCompanyId) {
        updates.transport_company_id = formData.transportCompanyId
        updates.transport_company_name = selectedTransportCompany?.name || null
      } else if (document?.transport_company_id || document?.transport_company_name) {
        updates.transport_company_id = null
        updates.transport_company_name = null
      }

      // Si hay nuevo archivo, subirlo
      if (file) {
        const fileExt = file.name.split(".").pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${userId}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(filePath, file)

        if (uploadError) {
          throw new Error("Error al subir archivo: " + uploadError.message)
        }

        updates.file_url = filePath
        updates.file_name = file.name
        updates.file_size = file.size
      }

      const { error } = await supabase
        .from("documents")
        .update(updates)
        .eq("id", document.id)

      if (error) throw error

      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error("Error al actualizar documento:", error)
      alert("Error al actualizar el documento: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Documento</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-sm font-medium text-muted-foreground mb-2">
            Tipo: {document?.document_type_name}
          </div>

          <div className="space-y-2">
            <Label htmlFor="entityName">Nombre de Entidad (Opcional)</Label>
            <Input
              id="entityName"
              placeholder="Ej: Empresa XYZ, Vehículo ABC123"
              value={formData.entityName}
              onChange={(e) => setFormData({ ...formData, entityName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-transport-company">Fletero</Label>
            <Select
              value={formData.transportCompanyId || "none"}
              onValueChange={(value) => setFormData({ ...formData, transportCompanyId: value === "none" ? "" : value })}
            >
              <SelectTrigger id="edit-transport-company">
                <SelectValue placeholder="Seleccione un fletero" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin fletero asignado</SelectItem>
                {transportCompanies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Archivo */}
          <div className="space-y-2">
            <Label htmlFor="edit-file">Archivo</Label>
            <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/50 transition-colors">
              <input
                type="file"
                id="edit-file"
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
              <label htmlFor="edit-file" className="cursor-pointer block w-full">
                {file ? (
                  <div className="flex items-center justify-center gap-2 text-primary">
                    <FileText className="h-6 w-6" />
                    <span className="text-sm font-medium">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.preventDefault()
                        setFile(null)
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <Upload className="h-6 w-6" />
                    <span className="text-sm">
                      {document?.file_name 
                        ? `Archivo actual: ${document.file_name} (Click para cambiar)` 
                        : "Click para subir archivo"}
                    </span>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="issueDate">Fecha de Emisión</Label>
              <Input
                id="issueDate"
                type="date"
                value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiryDate">Fecha de Vencimiento</Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                disabled={hasNoExpiry}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="noExpiry"
              checked={hasNoExpiry}
              onCheckedChange={(checked) => {
                setHasNoExpiry(checked as boolean)
                if (checked) {
                  setFormData({ ...formData, expiryDate: "" })
                }
              }}
            />
            <Label htmlFor="noExpiry" className="text-sm font-normal cursor-pointer">
              Este documento no tiene vencimiento
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas Adicionales</Label>
            <Textarea
              id="notes"
              placeholder="Cualquier detalle relevante sobre el documento..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
