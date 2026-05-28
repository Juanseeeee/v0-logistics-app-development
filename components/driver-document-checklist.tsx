"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertTriangle, CheckCircle2, Clock3, FileText, Upload } from "lucide-react"
import { DocumentUploadForm } from "@/components/document-upload-form"

type DocumentType = {
  id: string
  name: string
  entity_type: string
}

type TransportCompany = {
  id: string
  name: string
}

type DriverProfile = {
  id: string
  name: string
  cuit: string
  transport_company_id: string | null
  transport_company: TransportCompany | null
}

type DriverDocument = {
  id: string
  document_type_id: string
  file_name: string | null
  issue_date: string | null
  expiry_date: string | null
  created_at: string
}

type ChecklistItemStatus = "missing" | "expired" | "critical" | "warning" | "ok" | "no_expiry"

type ChecklistItem = {
  documentType: DocumentType
  currentDocument: DriverDocument | null
  status: ChecklistItemStatus
  statusLabel: string
}

type Props = {
  userId: string
  documentTypes: DocumentType[]
  transportCompanies: TransportCompany[]
  onSuccess?: () => void
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return "-"
  const datePart = dateString.split("T")[0]
  const [year, month, day] = datePart.split("-")
  return `${day}/${month}/${year}`
}

const getChecklistStatus = (expiryDate: string | null, hasDocument: boolean): { status: ChecklistItemStatus; label: string } => {
  if (!hasDocument) {
    return { status: "missing", label: "Falta cargar" }
  }

  if (!expiryDate) {
    return { status: "no_expiry", label: "Sin vencimiento" }
  }

  const today = new Date()
  const expiry = new Date(expiryDate)
  const daysUntil = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (daysUntil < 0) {
    return { status: "expired", label: "Vencido" }
  }

  if (daysUntil <= 15) {
    return { status: "critical", label: `${daysUntil} días` }
  }

  if (daysUntil <= 30) {
    return { status: "warning", label: `${daysUntil} días` }
  }

  return { status: "ok", label: `${daysUntil} días` }
}

const statusClasses: Record<ChecklistItemStatus, string> = {
  missing: "bg-slate-100 text-slate-700 border-slate-300",
  expired: "bg-red-100 text-red-700 border-red-300",
  critical: "bg-orange-100 text-orange-700 border-orange-300",
  warning: "bg-yellow-100 text-yellow-700 border-yellow-300",
  ok: "bg-green-100 text-green-700 border-green-300",
  no_expiry: "bg-blue-100 text-blue-700 border-blue-300",
}

const statusPriority: Record<ChecklistItemStatus, number> = {
  missing: 0,
  expired: 1,
  critical: 2,
  warning: 3,
  ok: 4,
  no_expiry: 5,
}

export function DriverDocumentChecklist({ userId, documentTypes, transportCompanies, onSuccess }: Props) {
  const supabase = createClient()
  const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(null)
  const [documents, setDocuments] = useState<DriverDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDocumentType, setSelectedDocumentType] = useState<DocumentType | null>(null)

  const driverDocumentTypes = useMemo(
    () =>
      [...documentTypes]
        .filter((documentType) => documentType.entity_type === "driver")
        .sort((a, b) => a.name.localeCompare(b.name, "es")),
    [documentTypes],
  )

  const checklistItems = useMemo(() => {
    const latestByType = new Map<string, DriverDocument>()

    documents.forEach((document) => {
      if (!latestByType.has(document.document_type_id)) {
        latestByType.set(document.document_type_id, document)
      }
    })

    return driverDocumentTypes
      .map((documentType) => {
        const currentDocument = latestByType.get(documentType.id) || null
        const { status, label } = getChecklistStatus(currentDocument?.expiry_date || null, !!currentDocument)

        return {
          documentType,
          currentDocument,
          status,
          statusLabel: label,
        } satisfies ChecklistItem
      })
      .sort((a, b) => {
        const priorityDifference = statusPriority[a.status] - statusPriority[b.status]
        if (priorityDifference !== 0) return priorityDifference
        return a.documentType.name.localeCompare(b.documentType.name, "es")
      })
  }, [documents, driverDocumentTypes])

  const summary = useMemo(
    () => ({
      missing: checklistItems.filter((item) => item.status === "missing").length,
      urgent: checklistItems.filter((item) => item.status === "expired" || item.status === "critical").length,
      warning: checklistItems.filter((item) => item.status === "warning").length,
      ok: checklistItems.filter((item) => item.status === "ok" || item.status === "no_expiry").length,
    }),
    [checklistItems],
  )

  useEffect(() => {
    fetchDriverData()
  }, [userId, documentTypes])

  async function fetchDriverData() {
    setLoading(true)

    const { data: driverData, error: driverError } = await supabase
      .from("drivers")
      .select("id, name, cuit, transport_company_id, transport_company:transport_company_id(id, name)")
      .eq("user_id", userId)
      .maybeSingle()

    if (driverError) {
      console.error("Error al cargar el chofer:", driverError)
      setDriverProfile(null)
      setDocuments([])
      setLoading(false)
      return
    }

    setDriverProfile(driverData as DriverProfile | null)

    const { data: documentsData, error: documentsError } = await supabase
      .from("documents")
      .select("id, document_type_id, file_name, issue_date, expiry_date, created_at")
      .eq("entity_type", "driver")
      .order("created_at", { ascending: false })

    if (documentsError) {
      console.error("Error al cargar documentos del chofer:", documentsError)
      setDocuments([])
      setLoading(false)
      return
    }

    setDocuments((documentsData as DriverDocument[]) || [])
    setLoading(false)
  }

  const handleUploadSuccess = async () => {
    await fetchDriverData()
    setSelectedDocumentType(null)
    onSuccess?.()
  }

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Carga Rápida de Documentación</CardTitle>
          <CardDescription>
            Seleccioná el ítem y cargalo. El tipo de documento, el chofer y el fletero se completan automáticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!driverProfile ? (
            <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-900">
              No se encontró un perfil de chofer vinculado a este usuario. No se puede automatizar la carga hasta que ese vínculo exista.
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Chofer</p>
                  <p className="font-medium">{driverProfile.name}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Fletero</p>
                  <p className="font-medium">{driverProfile.transport_company?.name || "Sin fletero asignado"}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Documentos faltantes</p>
                  <p className="font-medium">{summary.missing}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Vencidos o urgentes</p>
                  <p className="font-medium">{summary.urgent}</p>
                </div>
              </div>

              {!driverProfile.transport_company_id && (
                <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-900">
                  Este chofer no tiene fletero asociado. La documentación se podrá subir igual, pero sin completar ese dato automáticamente.
                </div>
              )}

              {loading ? (
                <p className="py-8 text-center text-muted-foreground">Cargando checklist de documentos...</p>
              ) : checklistItems.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                  No hay tipos de documentos configurados para choferes.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="px-3 py-2 font-medium">Ítem</th>
                        <th className="px-3 py-2 font-medium">Estado</th>
                        <th className="px-3 py-2 font-medium">Archivo actual</th>
                        <th className="px-3 py-2 font-medium">Emisión</th>
                        <th className="px-3 py-2 font-medium">Vencimiento</th>
                        <th className="px-3 py-2 text-right font-medium">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {checklistItems.map((item) => (
                        <tr key={item.documentType.id} className="border-b">
                          <td className="px-3 py-3 font-medium">{item.documentType.name}</td>
                          <td className="px-3 py-3">
                            <Badge variant="outline" className={statusClasses[item.status]}>
                              {item.statusLabel}
                            </Badge>
                          </td>
                          <td className="px-3 py-3 text-muted-foreground">
                            {item.currentDocument?.file_name || "Sin archivo cargado"}
                          </td>
                          <td className="px-3 py-3 text-muted-foreground">{formatDate(item.currentDocument?.issue_date || null)}</td>
                          <td className="px-3 py-3 text-muted-foreground">{formatDate(item.currentDocument?.expiry_date || null)}</td>
                          <td className="px-3 py-3 text-right">
                            <Button size="sm" onClick={() => setSelectedDocumentType(item.documentType)}>
                              <Upload className="mr-2 h-4 w-4" />
                              {item.currentDocument ? "Actualizar" : "Subir"}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">Atención</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Se priorizan primero los documentos faltantes y los vencidos o urgentes para agilizar la carga.
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center gap-2 text-yellow-600">
                    <Clock3 className="h-4 w-4" />
                    <span className="font-medium">Próximos a vencer</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Hay {summary.warning} documento(s) próximos a vencer que conviene renovar pronto.
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="font-medium">Vigentes</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Hay {summary.ok} documento(s) al día o sin fecha de vencimiento registrada.
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedDocumentType} onOpenChange={(open) => !open && setSelectedDocumentType(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedDocumentType ? `Subir ${selectedDocumentType.name}` : "Subir documento"}</DialogTitle>
            <DialogDescription>
              Completá solo el archivo y las fechas. El resto de los datos se carga automáticamente.
            </DialogDescription>
          </DialogHeader>

          {selectedDocumentType && driverProfile ? (
            <DocumentUploadForm
              userRole="driver"
              userId={userId}
              documentTypes={documentTypes}
              transportCompanies={transportCompanies}
              onSuccess={handleUploadSuccess}
              presetDocumentTypeId={selectedDocumentType.id}
              lockDocumentType
              defaultTransportCompanyId={driverProfile.transport_company_id || undefined}
              defaultTransportCompanyName={driverProfile.transport_company?.name}
              defaultEntityName={driverProfile.name}
              defaultEntityId={driverProfile.id}
              hideTransportCompanyField
              hideEntityNameField
              title={selectedDocumentType.name}
              description="Seleccioná el archivo, indicá las fechas y cargalo."
              submitLabel="Guardar documento"
            />
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <FileText className="mx-auto mb-3 h-10 w-10" />
              No se pudo preparar la carga del documento.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
