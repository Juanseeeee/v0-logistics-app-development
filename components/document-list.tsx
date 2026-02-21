"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Building2, Truck, Users, Download, Search, Calendar, FileText, Trash2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

type Document = {
  id: string
  document_type_name: string
  entity_name: string | null
  file_name: string | null
  file_url: string | null
  issue_date: string | null
  expiry_date: string | null
  notes: string | null
  created_at: string
}

type Props = {
  userRole: string
  userId: string
}

export function DocumentList({ userRole, userId }: Props) {
  const [activeTab, setActiveTab] = useState(userRole === "company" || userRole === "driver" ? "company" : "company")
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterDocType, setFilterDocType] = useState("all")
  const [filterDateFrom, setFilterDateFrom] = useState("")
  const [filterDateTo, setFilterDateTo] = useState("")
  const [documentTypes, setDocumentTypes] = useState<any[]>([])
  const supabase = createClient()

  const showAllTabs = userRole === "admin" || userRole === "owner" || userRole === "manager" || userRole === "documents" || userRole === "fleet_docs"
  const showCompanyOnly = userRole === "company"
  const showDriverOnly = userRole === "driver"

  useEffect(() => {
    fetchDocuments()
    fetchDocumentTypes()
  }, [activeTab])

  async function fetchDocuments() {
    setLoading(true)

    let query = supabase
      .from("documents")
      .select(`
        id,
        entity_name,
        file_name,
        file_url,
        issue_date,
        expiry_date,
        notes,
        created_at,
        document_types!inner(name)
      `)
      .eq("entity_type", showDriverOnly ? "driver" : activeTab)
      .order("created_at", { ascending: false })

    if (showCompanyOnly || showDriverOnly) {
      query = query.eq("company_user_id", userId)
    }

    const { data, error } = await query

    if (data) {
      const formatted = data.map((doc: any) => ({
        ...doc,
        document_type_name: doc.document_types.name,
      }))
      setDocuments(formatted)
    }
    setLoading(false)
  }

  async function fetchDocumentTypes() {
    const { data } = await supabase
      .from("document_types")
      .select("id, name, entity_type")
      .eq("entity_type", showDriverOnly ? "driver" : activeTab)

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

  const filteredDocuments = documents.filter((doc) => {
    const search = searchTerm.toLowerCase()
    const matchesSearch =
      doc.document_type_name?.toLowerCase().includes(search) ||
      doc.entity_name?.toLowerCase().includes(search) ||
      doc.file_name?.toLowerCase().includes(search)

    const matchesDocType = filterDocType === "all" || doc.document_type_name === filterDocType

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
      } else if (filterDateFrom || filterDateTo) {
        matchesDateRange = false
      }
    }

    return matchesSearch && matchesDocType && matchesDateRange
  })

  const getExpiryStatus = (expiryDate: string | null) => {
    if (!expiryDate) return null
    const today = new Date()
    const expiry = new Date(expiryDate)
    const daysUntil = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntil < 0) {
      return { label: "VENCIDO", variant: "destructive" as const, color: "bg-red-100 text-red-700 border-red-300" }
    } else if (daysUntil <= 15) {
      return {
        label: `${daysUntil} días`,
        variant: "destructive" as const,
        color: "bg-orange-100 text-orange-700 border-orange-300",
      }
    } else if (daysUntil <= 30) {
      return {
        label: `${daysUntil} días`,
        variant: "outline" as const,
        color: "bg-yellow-100 text-yellow-700 border-yellow-300",
      }
    }
    return {
      label: `${daysUntil} días`,
      variant: "outline" as const,
      color: "bg-green-100 text-green-700 border-green-300",
    }
  }

  return (
    <div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4">
              <div className="relative sm:col-span-2 md:col-span-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar documentos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Tipo de Documento</Label>
                <Select value={filterDocType} onValueChange={setFilterDocType}>
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
                <Label className="text-xs text-muted-foreground">Desde (Vencimiento)</Label>
                <Input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Hasta (Vencimiento)</Label>
                <Input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} />
              </div>
            </div>

            {["company", "vehicle", "driver"].map((tab) => (
              <TabsContent key={tab} value={tab}>
                <DocumentTable
                  documents={filteredDocuments}
                  loading={loading}
                  tab={tab}
                  onDelete={handleDelete}
                  getExpiryStatus={getExpiryStatus}
                />
              </TabsContent>
            ))}
          </div>
        </Tabs>
      ) : (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar documentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Tipo de Documento</Label>
              <Select value={filterDocType} onValueChange={setFilterDocType}>
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
              <Label className="text-xs text-muted-foreground">Desde (Vencimiento)</Label>
              <Input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Hasta (Vencimiento)</Label>
              <Input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} />
            </div>
          </div>
          <DocumentTable
            documents={filteredDocuments}
            loading={loading}
            tab={showDriverOnly ? "driver" : "company"}
            onDelete={handleDelete}
            getExpiryStatus={getExpiryStatus}
          />
        </div>
      )}
    </div>
  )
}

function DocumentTable({
  documents,
  loading,
  tab,
  onDelete,
  getExpiryStatus,
}: {
  documents: Document[]
  loading: boolean
  tab: string
  onDelete: (id: string) => void
  getExpiryStatus: (date: string | null) => any
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>
            Mis Documentos {tab === "company" ? "de Empresa" : tab === "vehicle" ? "de Vehículos" : "de Chofer"}
          </span>
          <Badge variant="outline">{documents.length} documentos</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center py-8 text-muted-foreground">Cargando documentos...</p>
        ) : documents.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No hay documentos registrados</p>
            <p className="text-sm text-muted-foreground mt-2">
              Use el formulario arriba para subir su primer documento
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
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
                      <TableCell className="font-medium">{doc.document_type_name}</TableCell>
                      <TableCell>
                        {doc.file_name ? (
                          <span className="text-sm text-muted-foreground">{doc.file_name}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground italic">Sin archivo</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {doc.issue_date ? (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {new Date(doc.issue_date).toLocaleDateString("es-AR")}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {doc.expiry_date ? (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {new Date(doc.expiry_date).toLocaleDateString("es-AR")}
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
                            <a href={doc.file_url} download target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="sm">
                                <Download className="h-4 w-4" />
                              </Button>
                            </a>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => onDelete(doc.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
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
