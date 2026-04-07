"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Building2, Truck, Users, Download, Search, Calendar, FileText, Trash2, Edit, FilterX } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { DocumentEditDialog } from "./document-edit-dialog"

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

type StatusFilter = "all" | "expired_or_critical" | "warning" | "valid" | "no_expiry"

type ExpiryStatus = {
  key: "expired" | "critical" | "warning" | "ok"
  label: string
  variant: "destructive" | "outline"
  color: string
}

type DocumentType = {
  id: string
  name: string
  entity_type: string
}

// Helper para formatear fechas sin problemas de timezone
const formatDate = (dateString: string | null) => {
  if (!dateString) return "-"
  const datePart = dateString.split("T")[0]
  const [year, month, day] = datePart.split("-")
  return `${day}/${month}/${year}`
}

type Props = {
  userRole: string
  userId: string
  transportCompanies: TransportCompany[]
  statusFilterPreset?: StatusFilter
}

export function DocumentList({ userRole, userId, transportCompanies, statusFilterPreset = "all" }: Props) {
  const showAllTabs =
    userRole === "admin" || userRole === "owner" || userRole === "manager" || userRole === "documents" || userRole === "fleet_docs"
  const showCompanyOnly = userRole === "company"
  const showDriverOnly = userRole === "driver"

  const [activeTab, setActiveTab] = useState(showDriverOnly ? "driver" : "company")
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterDocType, setFilterDocType] = useState("all")
  const [filterTransportCompany, setFilterTransportCompany] = useState("all")
  const [filterStatus, setFilterStatus] = useState<StatusFilter>(statusFilterPreset)
  const [filterDateFrom, setFilterDateFrom] = useState("")
  const [filterDateTo, setFilterDateTo] = useState("")
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([])
  const [editingDocument, setEditingDocument] = useState<Document | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchDocuments()
    fetchDocumentTypes()
  }, [activeTab, userRole, userId])

  useEffect(() => {
    setFilterStatus(statusFilterPreset)
  }, [statusFilterPreset])

  async function fetchDocuments() {
    setLoading(true)

    const entityType = showDriverOnly ? "driver" : showCompanyOnly ? "company" : activeTab
    const selectWithTransportCompany = `
      id,
      entity_name,
      transport_company_id,
      transport_company_name,
      file_name,
      file_url,
      issue_date,
      expiry_date,
      notes,
      created_at,
      document_types!inner(name)
    `
    const selectWithoutTransportCompany = `
      id,
      entity_name,
      file_name,
      file_url,
      issue_date,
      expiry_date,
      notes,
      created_at,
      document_types!inner(name)
    `

    const buildQuery = (selectClause: string) => {
      let query = supabase.from("documents").select(selectClause).eq("entity_type", entityType).order("created_at", { ascending: false })

      if (showCompanyOnly) {
        query = query.eq("company_user_id", userId)
      }

      return query
    }

    let { data, error } = await buildQuery(selectWithTransportCompany)

    if (error) {
      const fallbackResponse = await buildQuery(selectWithoutTransportCompany)
      data = fallbackResponse.data
      error = fallbackResponse.error
    }

    if (error) {
      console.error("Error al cargar documentos:", error)
      setDocuments([])
      setLoading(false)
      return
    }

    const formatted = await Promise.all(
      (data || []).map(async (doc: any) => {
        let fileUrl = doc.file_url

        // Si es un path de storage (no empieza con http y no es el placeholder antiguo), generar URL firmada
        if (fileUrl && !fileUrl.startsWith("http") && !fileUrl.startsWith("/uploads/")) {
          const { data: signedData } = await supabase.storage.from("documents").createSignedUrl(fileUrl, 3600)
          if (signedData) {
            fileUrl = signedData.signedUrl
          }
        }

        return {
          ...doc,
          document_type_name: doc.document_types.name,
          transport_company_id: doc.transport_company_id ?? null,
          transport_company_name: doc.transport_company_name ?? null,
          file_url: fileUrl,
        }
      }),
    )

    setDocuments(formatted)
    setLoading(false)
  }

  async function fetchDocumentTypes() {
    const entityType = showDriverOnly ? "driver" : showCompanyOnly ? "company" : activeTab
    const { data } = await supabase.from("document_types").select("id, name, entity_type").eq("entity_type", entityType)

    if (data) {
      setDocumentTypes(data)
    }
  }

  async function handleDelete(docId: string) {
    if (!confirm("¿Está seguro de eliminar este documento?")) return

    const { error } = await supabase.from("documents").delete().eq("id", docId)

    if (error) {
      alert("Error al eliminar: " + error.message)
    } else {
      fetchDocuments()
    }
  }

  const getExpiryStatus = (expiryDate: string | null): ExpiryStatus | null => {
    if (!expiryDate) return null
    const today = new Date()
    const expiry = new Date(expiryDate)
    const daysUntil = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntil < 0) {
      return {
        key: "expired",
        label: "VENCIDO",
        variant: "destructive",
        color: "bg-red-100 text-red-700 border-red-300",
      }
    }

    if (daysUntil <= 15) {
      return {
        key: "critical",
        label: `${daysUntil} días`,
        variant: "destructive",
        color: "bg-orange-100 text-orange-700 border-orange-300",
      }
    }

    if (daysUntil <= 30) {
      return {
        key: "warning",
        label: `${daysUntil} días`,
        variant: "outline",
        color: "bg-yellow-100 text-yellow-700 border-yellow-300",
      }
    }

    return {
      key: "ok",
      label: `${daysUntil} días`,
      variant: "outline",
      color: "bg-green-100 text-green-700 border-green-300",
    }
  }

  const filteredDocuments = documents.filter((doc) => {
    const search = searchTerm.toLowerCase()
    const status = getExpiryStatus(doc.expiry_date)
    const matchesSearch =
      doc.document_type_name?.toLowerCase().includes(search) ||
      doc.entity_name?.toLowerCase().includes(search) ||
      doc.file_name?.toLowerCase().includes(search) ||
      doc.transport_company_name?.toLowerCase().includes(search)

    const matchesDocType = filterDocType === "all" || doc.document_type_name === filterDocType

    const matchesTransportCompany =
      filterTransportCompany === "all" ||
      (filterTransportCompany === "unassigned"
        ? !doc.transport_company_id && !doc.transport_company_name
        : doc.transport_company_id === filterTransportCompany)

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "expired_or_critical" && !!status && (status.key === "expired" || status.key === "critical")) ||
      (filterStatus === "warning" && status?.key === "warning") ||
      (filterStatus === "valid" && status?.key === "ok") ||
      (filterStatus === "no_expiry" && !status)

    let matchesDateRange = true
    if (filterDateFrom || filterDateTo) {
      const docDate = doc.expiry_date ? new Date(doc.expiry_date) : null
      if (docDate) {
        if (filterDateFrom && docDate < new Date(filterDateFrom)) {
          matchesDateRange = false
        }
        if (filterDateTo && docDate > new Date(filterDateTo)) {
          matchesDateRange = false
        }
      } else {
        matchesDateRange = false
      }
    }

    return matchesSearch && matchesDocType && matchesTransportCompany && matchesStatus && matchesDateRange
  })

  const clearFilters = () => {
    setSearchTerm("")
    setFilterDocType("all")
    setFilterTransportCompany("all")
    setFilterStatus("all")
    setFilterDateFrom("")
    setFilterDateTo("")
  }

  return (
    <div>
      <DocumentEditDialog
        open={!!editingDocument}
        onOpenChange={(open) => !open && setEditingDocument(null)}
        document={editingDocument}
        onSuccess={fetchDocuments}
        userId={userId}
        transportCompanies={transportCompanies}
      />
      {showAllTabs ? (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="company" className="text-xs sm:text-sm gap-1 sm:gap-2">
              <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Empresa</span>
              <span className="sm:hidden">Emp.</span>
            </TabsTrigger>
            <TabsTrigger value="vehicle" className="text-xs sm:text-sm gap-1 sm:gap-2">
              <Truck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Vehículos</span>
              <span className="sm:hidden">Veh.</span>
            </TabsTrigger>
            <TabsTrigger value="driver" className="text-xs sm:text-sm gap-1 sm:gap-2">
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Choferes</span>
              <span className="sm:hidden">Chof.</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <DocumentFilters
              searchTerm={searchTerm}
              onSearchTermChange={setSearchTerm}
              filterDocType={filterDocType}
              onFilterDocTypeChange={setFilterDocType}
              filterTransportCompany={filterTransportCompany}
              onFilterTransportCompanyChange={setFilterTransportCompany}
              filterStatus={filterStatus}
              onFilterStatusChange={setFilterStatus}
              filterDateFrom={filterDateFrom}
              onFilterDateFromChange={setFilterDateFrom}
              filterDateTo={filterDateTo}
              onFilterDateToChange={setFilterDateTo}
              documentTypes={documentTypes}
              transportCompanies={transportCompanies}
              onClear={clearFilters}
            />

            {["company", "vehicle", "driver"].map((tab) => (
              <TabsContent key={tab} value={tab}>
                <DocumentTable
                  documents={filteredDocuments}
                  loading={loading}
                  tab={tab}
                  onDelete={handleDelete}
                  onEdit={setEditingDocument}
                  getExpiryStatus={getExpiryStatus}
                />
              </TabsContent>
            ))}
          </div>
        </Tabs>
      ) : (
        <div>
          <DocumentFilters
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            filterDocType={filterDocType}
            onFilterDocTypeChange={setFilterDocType}
            filterTransportCompany={filterTransportCompany}
            onFilterTransportCompanyChange={setFilterTransportCompany}
            filterStatus={filterStatus}
            onFilterStatusChange={setFilterStatus}
            filterDateFrom={filterDateFrom}
            onFilterDateFromChange={setFilterDateFrom}
            filterDateTo={filterDateTo}
            onFilterDateToChange={setFilterDateTo}
            documentTypes={documentTypes}
            transportCompanies={transportCompanies}
            onClear={clearFilters}
          />
          <DocumentTable
            documents={filteredDocuments}
            loading={loading}
            tab={showDriverOnly ? "driver" : "company"}
            onDelete={handleDelete}
            onEdit={setEditingDocument}
            getExpiryStatus={getExpiryStatus}
          />
        </div>
      )}
    </div>
  )
}

function DocumentFilters({
  searchTerm,
  onSearchTermChange,
  filterDocType,
  onFilterDocTypeChange,
  filterTransportCompany,
  onFilterTransportCompanyChange,
  filterStatus,
  onFilterStatusChange,
  filterDateFrom,
  onFilterDateFromChange,
  filterDateTo,
  onFilterDateToChange,
  documentTypes,
  transportCompanies,
  onClear,
}: {
  searchTerm: string
  onSearchTermChange: (value: string) => void
  filterDocType: string
  onFilterDocTypeChange: (value: string) => void
  filterTransportCompany: string
  onFilterTransportCompanyChange: (value: string) => void
  filterStatus: StatusFilter
  onFilterStatusChange: (value: StatusFilter) => void
  filterDateFrom: string
  onFilterDateFromChange: (value: string) => void
  filterDateTo: string
  onFilterDateToChange: (value: string) => void
  documentTypes: DocumentType[]
  transportCompanies: TransportCompany[]
  onClear: () => void
}) {
  return (
    <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
      <div className="space-y-1 sm:col-span-2 xl:col-span-2">
        <Label className="text-xs text-muted-foreground">Búsqueda</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
          <Input
            placeholder="Buscar por documento, archivo, entidad o fletero..."
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Tipo de Documento</Label>
        <Select value={filterDocType} onValueChange={onFilterDocTypeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {documentTypes.map((dt) => (
              <SelectItem key={dt.id} value={dt.name}>
                {dt.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Fletero</Label>
        <Select value={filterTransportCompany} onValueChange={onFilterTransportCompanyChange}>
          <SelectTrigger>
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los fleteros</SelectItem>
            <SelectItem value="unassigned">Sin fletero</SelectItem>
            {transportCompanies.map((company) => (
              <SelectItem key={company.id} value={company.id}>
                {company.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Estado</Label>
        <Select value={filterStatus} onValueChange={(value: StatusFilter) => onFilterStatusChange(value)}>
          <SelectTrigger>
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="expired_or_critical">Vencidos y urgentes</SelectItem>
            <SelectItem value="warning">Próximos a vencer</SelectItem>
            <SelectItem value="valid">Vigentes</SelectItem>
            <SelectItem value="no_expiry">Sin vencimiento</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Desde (Vencimiento)</Label>
        <Input type="date" value={filterDateFrom} onChange={(e) => onFilterDateFromChange(e.target.value)} />
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Hasta (Vencimiento)</Label>
        <Input type="date" value={filterDateTo} onChange={(e) => onFilterDateToChange(e.target.value)} />
      </div>

      <div className="sm:col-span-2 xl:col-span-6">
        <Button type="button" variant="outline" onClick={onClear} className="w-full sm:w-auto bg-transparent">
          <FilterX className="mr-2 h-4 w-4" />
          Limpiar filtros
        </Button>
      </div>
    </div>
  )
}

function DocumentTable({
  documents,
  loading,
  tab,
  onDelete,
  onEdit,
  getExpiryStatus,
}: {
  documents: Document[]
  loading: boolean
  tab: string
  onDelete: (id: string) => void
  onEdit: (doc: Document) => void
  getExpiryStatus: (date: string | null) => ExpiryStatus | null
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Documentos {tab === "company" ? "de Empresa" : tab === "vehicle" ? "de Vehículos" : "de Chofer"}</span>
          <Badge variant="outline">{documents.length} documentos</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="py-8 text-center text-muted-foreground">Cargando documentos...</p>
        ) : documents.length === 0 ? (
          <div className="py-8 text-center">
            <FileText className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No hay documentos registrados</p>
            <p className="mt-2 text-sm text-muted-foreground">Use el formulario arriba para subir su primer documento</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Fletero</TableHead>
                  <TableHead className="whitespace-nowrap">Tipo de Documento</TableHead>
                  <TableHead className="whitespace-nowrap">Archivo</TableHead>
                  <TableHead className="whitespace-nowrap">Fecha Emisión</TableHead>
                  <TableHead className="whitespace-nowrap">Vencimiento</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => {
                  const status = getExpiryStatus(doc.expiry_date)
                  return (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">
                        {doc.transport_company_name ? (
                          doc.transport_company_name
                        ) : (
                          <span className="text-sm italic text-muted-foreground">Sin fletero</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{doc.document_type_name}</TableCell>
                      <TableCell>
                        {doc.file_name ? (
                          <span className="text-sm text-muted-foreground">{doc.file_name}</span>
                        ) : (
                          <span className="text-sm italic text-muted-foreground">Sin archivo</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {doc.issue_date ? (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {formatDate(doc.issue_date)}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {doc.expiry_date ? (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {formatDate(doc.expiry_date)}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {status ? (
                          <Badge variant={status.variant} className={status.color}>
                            {status.label}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Sin vencimiento</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {doc.file_url && (
                            <Button variant="ghost" size="sm" asChild>
                              <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => onEdit(doc)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => onDelete(doc.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
