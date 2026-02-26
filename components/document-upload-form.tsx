"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, FileText, X, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

type DocumentType = {
  id: string
  name: string
  entity_type: string
}

type Props = {
  userRole: string
  userId: string
  documentTypes: DocumentType[]
  onSuccess?: () => void
}

export function DocumentUploadForm({ userRole, userId, documentTypes, onSuccess }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    documentTypeId: "",
    entityName: "",
    issueDate: "",
    expiryDate: "",
    notes: "",
  })

  // Filtrar tipos de documento según rol
  const availableDocTypes = documentTypes.filter((dt) => {
    if (userRole === "company") {
      return dt.entity_type === "company"
    }
    if (userRole === "driver") {
      return dt.entity_type === "driver"
    }
    return true // admin, owner, manager, documents, fleet_docs ven todos
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file || !formData.documentTypeId) {
      alert("Por favor seleccione un tipo de documento y un archivo")
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      // Subir archivo a Vercel Blob o Supabase Storage
      const fileExt = file.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

      // Por ahora usamos un placeholder URL - en producción aquí subirías a Blob
      const fileUrl = `/uploads/${fileName}`

      // Insertar documento en la base de datos
      const selectedDocType = documentTypes.find((dt) => dt.id === formData.documentTypeId)

      const { error } = await supabase.from("documents").insert({
        document_type_id: formData.documentTypeId,
        entity_type: selectedDocType?.entity_type || "company",
        entity_name: formData.entityName || null,
        file_url: fileUrl,
        file_name: file.name,
        file_size: file.size,
        issue_date: formData.issueDate || null,
        expiry_date: formData.expiryDate || null,
        notes: formData.notes || null,
        uploaded_by: userId,
        company_user_id: userRole === "company" || userRole === "driver" ? userId : null,
      })

      if (error) throw error

      alert("Documento subido exitosamente")

      // Resetear formulario
      setFile(null)
      setFormData({
        documentTypeId: "",
        entityName: "",
        issueDate: "",
        expiryDate: "",
        notes: "",
      })

      if (onSuccess) {
        onSuccess()
      } else {
        router.refresh()
      }
    } catch (error: any) {
      console.error("Error al subir documento:", error)
      alert("Error al subir el documento: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Subir Nuevo Documento
        </CardTitle>
        <CardDescription>Complete la información del documento y seleccione el archivo a subir</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo de Documento */}
          <div className="space-y-2">
            <Label htmlFor="documentType">Tipo de Documento *</Label>
            <Select
              value={formData.documentTypeId}
              onValueChange={(value) => setFormData({ ...formData, documentTypeId: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione el tipo de documento" />
              </SelectTrigger>
              <SelectContent>
                {availableDocTypes.map((dt) => (
                  <SelectItem key={dt.id} value={dt.id}>
                    {dt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Nombre de Entidad (opcional para company) */}
          {userRole !== "company" && userRole !== "driver" && (
            <div className="space-y-2">
              <Label htmlFor="entityName">Nombre de Entidad</Label>
              <Input
                id="entityName"
                placeholder="Ej: Empresa XYZ, Vehículo ABC123"
                value={formData.entityName}
                onChange={(e) => setFormData({ ...formData, entityName: e.target.value })}
              />
            </div>
          )}

          {/* Archivo */}
          <div className="space-y-2">
            <Label htmlFor="file">Archivo *</Label>
            <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/50 transition-colors">
              <input
                type="file"
                id="file"
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
              <label htmlFor="file" className="cursor-pointer">
                {file ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="h-6 w-6 text-primary" />
                    <span className="text-sm font-medium">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault()
                        setFile(null)
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Haga clic para seleccionar un archivo</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG, DOC (máx. 10MB)</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Fecha de Emisión */}
          <div className="space-y-2">
            <Label htmlFor="issueDate">Fecha de Emisión</Label>
            <Input
              id="issueDate"
              type="date"
              value={formData.issueDate}
              onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
            />
          </div>

          {/* Fecha de Vencimiento */}
          <div className="space-y-2">
            <Label htmlFor="expiryDate">Fecha de Vencimiento</Label>
            <Input
              id="expiryDate"
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
            />
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              placeholder="Observaciones o comentarios adicionales"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          {/* Botón Submit */}
          <Button type="submit" className="w-full" disabled={loading || !file}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Subiendo...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Subir Documento
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
