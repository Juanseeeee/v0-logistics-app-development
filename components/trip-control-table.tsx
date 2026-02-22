"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { TripForm } from "@/components/trip-form"
import { Badge } from "@/components/ui/badge"
import * as XLSX from "xlsx"

interface Trip {
  id: string
  trip_number: number
  date: string
  client_name: string
  line: string
  driver_id: string
  product: string
  loading_location: string
  unloading_location: string
  status: string
  particularity: string | null
  unloading_address: string | null
  unloading_lat: number | null
  unloading_lng: number | null
  notes: string | null
  completed_at: string | null
  driver: {
    id: string
    name: string
    cuit: string
    chasis: {
      id: string
      patent_chasis: string
      vehicle_type: string
      transport_company: string
      transport_companies: {
        id: string
        name: string
      } | null
    } | null
    semi: {
      id: string
      patent_chasis: string
      vehicle_type: string
    } | null
  }
}

interface Driver {
  id: string
  name: string
  cuit: string
  chasis: {
    id: string
    patent_chasis: string
    vehicle_type: string
    transport_company: string
    transport_companies: {
      id: string
      name: string
    } | null
  } | null
  semi: {
    id: string
    patent_chasis: string
    vehicle_type: string
  } | null
}

interface Client {
  id: string
  company: string
}

interface Product {
  id: string
  name: string
}

interface Location {
  id: string
  name: string
  city: string | null
  active: boolean
}

// Status colors following the methodology:
// BLANCO (white): Pendiente - truck hasn't unloaded yet
// VERDE (green): Completado L2 - trip completed on L2
// MORADO (purple): Completado L1 - trip completed on L1
// AZUL (blue): Completado L1/L2 - trip completed on mixed line
// NARANJA (orange): Completado con Particularidad - completed with issues
// ROJO (red): Cancelado - trip cancelled
const getStatusColor = (status: string) => {
  switch (status) {
    case "pendiente":
      return "bg-white text-gray-900 border border-gray-300"
    case "completado_l2":
      return "bg-green-500 text-white"
    case "completado_l1":
      return "bg-purple-500 text-white"
    case "completado_l1_l2":
      return "bg-blue-500 text-white"
    case "completado_particularidad":
      return "bg-orange-500 text-white"
    case "cancelado":
      return "bg-red-500 text-white"
    default:
      return "bg-gray-100 text-gray-900"
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case "pendiente":
      return "Pendiente"
    case "completado_l2":
      return "L2"
    case "completado_l1":
      return "L1"
    case "completado_l1_l2":
      return "L1/L2"
    case "completado_particularidad":
      return "Particularidad"
    case "cancelado":
      return "Cancelado"
    default:
      return status
  }
}

const formatLocalDate = (dateString: string) => {
  const [year, month, day] = dateString.split("-")
  return `${day}/${month}/${year}`
}

const getLocalDateString = (date: Date) => {
  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const year = date.getFullYear()
  return `${year}-${month}-${day}`
}

export function TripControlTable({
  trips,
  drivers,
  clients,
  locations,
  onClientChange,
  onRefresh,
  stats,
}: {
  trips: Trip[]
  drivers: Driver[]
  clients: Client[]
  locations: Location[]
  onClientChange: (clientId: string) => Promise<Product[]>
  onRefresh: () => void
  stats?: {
    total: number
    byStatus: {
      pending: number
      completado_l2: number
      completado_l1: number
      completado_l1_l2: number
      completado_particularidad: number
      cancelled: number
    }
    byLine: {
      L1: number
      L2: number
      L1_L2: number
    }
  }
}) {
  const router = useRouter()
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [expandedParticularities, setExpandedParticularities] = useState<Set<string>>(new Set())
  const [searchFilter, setSearchFilter] = useState("")
  const [dateFromFilter, setDateFromFilter] = useState("")
  const [dateToFilter, setDateToFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [lineFilter, setLineFilter] = useState("all")
  const [driverFilter, setDriverFilter] = useState("all")
  const [productFilter, setProductFilter] = useState("all")
  // Added transportCompanyFilter state
  const [transportCompanyFilter, setTransportCompanyFilter] = useState("all")
  const [loadingLocationFilter, setLoadingLocationFilter] = useState("all")
  const [unloadingLocationFilter, setUnloadingLocationFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)

  const handleEdit = (trip: Trip) => {
    setEditingTrip(trip)
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingTrip(null)
  }

  const handleFormSubmit = () => {
    handleCloseDialog()
    onRefresh()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este viaje?")) return

    try {
      const supabase = createClient()
      const { error } = await supabase.from("trips").delete().eq("id", id)

      if (error) throw error

      onRefresh()
    } catch (error) {
      console.error("Error:", error)
      alert("Error al eliminar viaje")
    }
  }

  const exportTripToPDF = (trip: Trip) => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      alert("Por favor permita las ventanas emergentes para descargar el PDF")
      return
    }

    const pdfContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Detalle de Viaje #${trip.trip_number}</title>
        <style>
          @media print {
            @page { margin: 0.5cm; }
            body { margin: 0; }
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #1a1a1a;
            line-height: 1.3;
            font-size: 11px;
          }
          .header {
            background: linear-gradient(135deg, #0038ae 0%, #0052e0 100%);
            color: white;
            padding: 15px 20px;
            margin-bottom: 15px;
            border-radius: 6px;
          }
          .company-name {
            font-size: 20px;
            font-weight: 700;
            letter-spacing: 1.5px;
            display: inline-block;
          }
          .trip-number {
            font-size: 20px;
            font-weight: 700;
            float: right;
          }
          .content {
            padding: 0 10px;
          }
          .section {
            margin-bottom: 12px;
          }
          .section-title {
            font-size: 11px;
            font-weight: 600;
            color: #0038ae;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
            padding-bottom: 4px;
            border-bottom: 1.5px solid #0038ae;
          }
          .field-group {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px 12px;
          }
          .field-label {
            font-size: 9px;
            font-weight: 600;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            margin-bottom: 2px;
          }
          .field-value {
            font-size: 11px;
            color: #1a1a1a;
            font-weight: 500;
            padding: 4px 8px;
            background: #f8f9fa;
            border-radius: 3px;
            border-left: 2px solid #0038ae;
          }
          .notes-section {
            margin-top: 10px;
            padding: 8px 10px;
            background: #fff8e1;
            border-left: 3px solid #ffc107;
            border-radius: 3px;
          }
          .footer {
            margin-top: 15px;
            padding-top: 8px;
            border-top: 1px solid #e0e0e0;
            text-align: center;
            color: #666;
            font-size: 9px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <span class="company-name">CRONOS</span>
          <span class="trip-number">#${trip.trip_number}</span>
        </div>

        <div class="content">
          <div class="section">
            <div class="section-title">Información del Viaje</div>
            <div class="field-group">
              <div class="field">
                <div class="field-label">Fecha</div>
                <div class="field-value">${formatLocalDate(trip.date)}</div>
              </div>
              <div class="field">
                <div class="field-label">Producto</div>
                <div class="field-value">${trip.product}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Chofer y Vehículos</div>
            <div class="field-group">
              <div class="field">
                <div class="field-label">Chofer</div>
                <div class="field-value">${trip.driver.name}</div>
              </div>
              <div class="field">
                <div class="field-label">CUIT</div>
                <div class="field-value">${trip.driver.cuit}</div>
              </div>
              <div class="field">
                <div class="field-label">Patente Chasis</div>
                <div class="field-value">${trip.driver.chasis?.patent_chasis || "No asignado"}</div>
              </div>
              <div class="field">
                <div class="field-label">Patente Semi</div>
                <div class="field-value">${trip.driver.semi?.patent_chasis || "No asignado"}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Ubicaciones</div>
            <div class="field-group">
              <div class="field">
                <div class="field-label">Carga</div>
                <div class="field-value">${trip.loading_location}</div>
              </div>
              <div class="field">
                <div class="field-label">Descarga</div>
                <div class="field-value">${trip.unloading_location}</div>
              </div>
            </div>
          </div>

          ${
            trip.particularity || trip.notes
              ? `
          <div class="section">
            <div class="section-title">Observaciones</div>
            ${
              trip.particularity
                ? `
            <div class="notes-section">
              <div class="field-label" style="color: #f57c00;">⚠ Particularidad</div>
              <div style="margin-top: 4px; font-size: 10px; color: #e65100; font-weight: 500;">
                ${trip.particularity}
              </div>
            </div>
            `
                : ""
            }
            ${
              trip.notes
                ? `
            <div style="margin-top: 8px;">
              <div class="field-label">Notas</div>
              <div class="field-value" style="font-size: 10px;">${trip.notes}</div>
            </div>
            `
                : ""
            }
          </div>
          `
              : ""
          }

          <div class="footer">
            <div>CRONOS - Sistema de Gestión Logística | ${new Date().toLocaleDateString("es-AR")}</div>
          </div>
        </div>
      </body>
      </html>
    `

    printWindow.document.write(pdfContent)
    printWindow.document.close()

    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
      }, 250)
    }
  }

  const toggleParticularity = (tripId: string) => {
    setExpandedParticularities((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(tripId)) {
        newSet.delete(tripId)
      } else {
        newSet.add(tripId)
      }
      return newSet
    })
  }

  const uniqueLines = Array.from(new Set(trips.map((t) => t.line))).sort()
  const uniqueDrivers = Array.from(new Set(trips.map((t) => t.driver.name))).sort()
  const uniqueProducts = Array.from(new Set(trips.map((t) => t.product))).sort()
  const uniqueClients = Array.from(new Set(clients.map((c) => c.company))).sort()
  const uniqueTransportCompanies = Array.from(
    new Set(
      trips.map((t) => t.driver.chasis?.transport_companies?.name).filter((name): name is string => name != null),
    ),
  ).sort()
  // Get unique locations from actual trips to show only used locations
  const uniqueLoadingLocations = Array.from(new Set(trips.map((t) => t.loading_location))).sort()
  const uniqueUnloadingLocations = Array.from(new Set(trips.map((t) => t.unloading_location))).sort()
  const uniqueLocations = Array.from(new Set([...uniqueLoadingLocations, ...uniqueUnloadingLocations])).sort()

  const filteredTrips = trips.filter((trip) => {
    const matchesSearch =
      searchFilter === "" ||
      trip.trip_number.toString().includes(searchFilter) ||
      trip.client_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      trip.driver.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (trip.driver.chasis?.patent_chasis || "").toLowerCase().includes(searchFilter.toLowerCase()) ||
      (trip.driver.semi?.patent_chasis || "").toLowerCase().includes(searchFilter.toLowerCase())

    const tripDate = trip.date
    const matchesDateFrom = dateFromFilter === "" || tripDate >= dateFromFilter
    const matchesDateTo = dateToFilter === "" || tripDate <= dateToFilter
    const matchesDate = matchesDateFrom && matchesDateTo

    const matchesStatus = statusFilter === "all" || trip.status === statusFilter
    const matchesLine = lineFilter === "all" || trip.line === lineFilter
    const matchesDriver = driverFilter === "all" || trip.driver.name === driverFilter
    const matchesProduct = productFilter === "all" || trip.product === productFilter
    const matchesTransportCompany =
      transportCompanyFilter === "all" || trip.driver.chasis?.transport_companies?.name === transportCompanyFilter
    const matchesLoadingLocation =
      loadingLocationFilter === "all" || trip.loading_location === loadingLocationFilter
    const matchesUnloadingLocation =
      unloadingLocationFilter === "all" || trip.unloading_location === unloadingLocationFilter

    return (
      matchesSearch &&
      matchesDate &&
      matchesStatus &&
      matchesLine &&
      matchesDriver &&
      matchesProduct &&
      matchesTransportCompany &&
      matchesLoadingLocation &&
      matchesUnloadingLocation
    )
  })

  const totalPages = Math.ceil(filteredTrips.length / 50)
  const startIndex = (currentPage - 1) * 50
  const endIndex = startIndex + 50
  const paginatedTrips = filteredTrips.slice(startIndex, endIndex)

  const exportToExcel = () => {
    const headers = [
      "N° Viaje",
      "Fecha",
      "Estado",
      "Línea",
      "Cliente",
      "Chofer",
      "Chasis",
      "Semi",
      "Empresa Transporte",
      "Producto",
      "Carga",
      "Descarga",
      "Particularidad",
      "Notas",
    ]

    const rows = filteredTrips.map((trip) => [
      trip.trip_number,
      formatLocalDate(trip.date),
      getStatusLabel(trip.status),
      trip.line,
      trip.client_name,
      trip.driver.name,
      trip.driver.chasis?.patent_chasis || "-",
      trip.driver.semi?.patent_chasis || "-",
      trip.driver.chasis?.transport_companies?.name || "-",
      trip.product,
      trip.loading_location,
      trip.unloading_location,
      trip.particularity || "-",
      trip.notes || "-",
    ])

    // Create worksheet from data
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows])

    // Set column widths for better readability
    worksheet["!cols"] = [
      { wch: 10 }, // N° Viaje
      { wch: 12 }, // Fecha
      { wch: 15 }, // Estado
      { wch: 8 }, // Línea
      { wch: 25 }, // Cliente
      { wch: 25 }, // Chofer
      { wch: 12 }, // Chasis
      { wch: 12 }, // Semi
      { wch: 20 }, // Empresa Transporte
      { wch: 20 }, // Producto
      { wch: 30 }, // Carga
      { wch: 30 }, // Descarga
      { wch: 30 }, // Particularidad
      { wch: 30 }, // Notas
    ]

    // Create workbook and add worksheet
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Viajes")

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `viajes_${getLocalDateString(new Date())}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Control de Viajes</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Los viajes se cargan a día vencido. Ejemplo: viajes del 27/05 se cargan el 28/05.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportToExcel} disabled={filteredTrips.length === 0}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Exportar Excel
          </Button>
          <Button variant="outline" onClick={() => router.push("/logistics/trips/bulk-create")}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Crear Múltiples
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingTrip(null)}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Cargar Viaje
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingTrip ? "Editar Viaje" : "Cargar Nuevo Viaje"}</DialogTitle>
              </DialogHeader>
              <TripForm
                drivers={drivers}
                trip={editingTrip}
                onClose={handleCloseDialog}
                clients={clients}
                onClientChange={onClientChange}
                onRefresh={onRefresh}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-9 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Búsqueda General</label>
              <Input
                placeholder="N°, cliente, chofer, patente..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Fecha Desde</label>
              <Input type="date" value={dateFromFilter} onChange={(e) => setDateFromFilter(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Fecha Hasta</label>
              <Input type="date" value={dateToFilter} onChange={(e) => setDateToFilter(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Estado</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="completado_l2">Completado L2</SelectItem>
                  <SelectItem value="completado_l1">Completado L1</SelectItem>
                  <SelectItem value="completado_l1_l2">Completado L1/L2</SelectItem>
                  <SelectItem value="completado_particularidad">Completado con Particularidad</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Línea</label>
              <Select value={lineFilter} onValueChange={setLineFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {uniqueLines.map((line) => (
                    <SelectItem key={line} value={line}>
                      {line}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Chofer</label>
              <Select value={driverFilter} onValueChange={setDriverFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {uniqueDrivers.map((driver) => (
                    <SelectItem key={driver} value={driver}>
                      {driver}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Producto</label>
              <Select value={productFilter} onValueChange={setProductFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {uniqueProducts.map((product) => (
                    <SelectItem key={product} value={product}>
                      {product}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Empresa Transporte</label>
              <Select value={transportCompanyFilter} onValueChange={setTransportCompanyFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {uniqueTransportCompanies.map((company) => (
                    <SelectItem key={company} value={company}>
                      {company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Lugar de Carga</label>
              <Select value={loadingLocationFilter} onValueChange={setLoadingLocationFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {uniqueLoadingLocations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Lugar de Descarga</label>
              <Select value={unloadingLocationFilter} onValueChange={setUnloadingLocationFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {uniqueUnloadingLocations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <Badge variant="secondary">{filteredTrips.length} viajes encontrados</Badge>
            <Badge variant="outline">
              Mostrando {startIndex + 1}-{Math.min(endIndex, filteredTrips.length)} de {filteredTrips.length}
            </Badge>
            {(searchFilter ||
              dateFromFilter ||
              dateToFilter ||
              statusFilter !== "all" ||
              lineFilter !== "all" ||
              driverFilter !== "all" ||
              productFilter !== "all" ||
              transportCompanyFilter !== "all" ||
              loadingLocationFilter !== "all" ||
              unloadingLocationFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchFilter("")
                  setDateFromFilter("")
                  setDateToFilter("")
                  setStatusFilter("all")
                  setLineFilter("all")
                  setDriverFilter("all")
                  setProductFilter("all")
                  setTransportCompanyFilter("all")
                  setLoadingLocationFilter("all")
                  setUnloadingLocationFilter("all")
                  setCurrentPage(1)
                }}
              >
                Limpiar filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <p className="text-sm font-medium">Leyenda:</p>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white border border-gray-300 rounded"></div>
              <span className="text-sm">
                Pendiente (no descargó)
                {stats && <span className="ml-2 font-semibold text-yellow-600">({stats.byStatus.pending})</span>}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-500 rounded"></div>
              <span className="text-sm">
                Completado L2
                {stats && <span className="ml-2 font-semibold text-green-600">({stats.byStatus.completado_l2})</span>}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-purple-500 rounded"></div>
              <span className="text-sm">
                Completado L1
                {stats && <span className="ml-2 font-semibold text-purple-600">({stats.byStatus.completado_l1})</span>}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-500 rounded"></div>
              <span className="text-sm">
                Completado L1/L2
                {stats && <span className="ml-2 font-semibold text-blue-600">({stats.byStatus.completado_l1_l2})</span>}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-orange-500 rounded"></div>
              <span className="text-sm">
                Completado con Particularidad
                {stats && (
                  <span className="ml-2 font-semibold text-orange-600">
                    ({stats.byStatus.completado_particularidad})
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-red-500 rounded"></div>
              <span className="text-sm">
                Cancelado
                {stats && <span className="ml-2 font-semibold text-red-600">({stats.byStatus.cancelled})</span>}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-red-600 font-medium">Texto rojo = Particularidad</span>
            </div>
            {stats && (
              <>
                <div className="w-px h-6 bg-gray-300 mx-2"></div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">
                    Línea L1: <span className="ml-1 font-semibold text-[#0038ae]">{stats.byLine.L1}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">
                    Línea L2: <span className="ml-1 font-semibold text-purple-600">{stats.byLine.L2}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">
                    Línea L1/L2: <span className="ml-1 font-semibold text-blue-600">{stats.byLine.L1_L2}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">
                    Total: <span className="ml-1 font-semibold">{stats.total}</span>
                  </span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[70px]">N° Viaje</TableHead>
                  <TableHead className="w-[100px]">Fecha</TableHead>
                  <TableHead className="w-[100px]">Estado</TableHead>
                  <TableHead className="w-[60px]">Línea</TableHead>
                  <TableHead className="w-[120px]">Cliente</TableHead>
                  <TableHead className="w-[150px]">Chofer</TableHead>
                  <TableHead className="w-[100px]">Chasis</TableHead>
                  <TableHead className="w-[100px]">Semi</TableHead>
                  <TableHead className="text-center">Empresa</TableHead>
                  <TableHead className="w-[150px]">Producto</TableHead>
                  <TableHead className="w-[150px]">Carga</TableHead>
                  <TableHead className="w-[150px]">Descarga</TableHead>
                  <TableHead className="w-[120px] text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTrips.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                      No se encontraron viajes con los filtros aplicados
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedTrips.map((trip) => (
                    <>
                      <TableRow
                        key={trip.id}
                        className={`${getStatusColor(trip.status)} hover:opacity-90 transition-opacity`}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <span>{trip.trip_number}</span>
                            {trip.status === "pendiente" && trip.notes && trip.notes.trim() !== "" && (
                              <Badge className="bg-amber-100 text-amber-900 border-amber-300 border px-1.5 py-0 text-xs">
                                <svg
                                  className="w-3 h-3 mr-1 inline"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                Nota
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{formatLocalDate(trip.date)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(trip.status)}>{getStatusLabel(trip.status)}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{trip.line}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{trip.client_name}</TableCell>
                        <TableCell>{trip.driver.name}</TableCell>
                        <TableCell className="text-xs">{trip.driver.chasis?.patent_chasis || "-"}</TableCell>
                        <TableCell className="text-xs">{trip.driver.semi?.patent_chasis || "-"}</TableCell>
                        <TableCell className="text-xs text-center">
                          {trip.driver.chasis?.transport_companies?.name || "-"}
                        </TableCell>
                        <TableCell>{trip.product}</TableCell>
                        <TableCell className="text-xs">{trip.loading_location}</TableCell>
                        <TableCell className="text-xs">{trip.unloading_location}</TableCell>
                        <TableCell className="text-right">
                          {(trip.status === "cancelado" || trip.status === "completado_particularidad") &&
                            trip.particularity && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleParticularity(trip.id)}
                                title={
                                  expandedParticularities.has(trip.id) ? "Ocultar particularidad" : "Ver particularidad"
                                }
                              >
                                {expandedParticularities.has(trip.id) ? (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    />
                                  </svg>
                                )}
                              </Button>
                            )}
                          <Button variant="ghost" size="sm" onClick={() => exportTripToPDF(trip)} title="Descargar PDF">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2-2v14a2 2 0 002 2z"
                              />
                            </svg>
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(trip)} title="Editar">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(trip.id)} title="Eliminar">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                              />
                            </svg>
                          </Button>
                        </TableCell>
                      </TableRow>
                      {expandedParticularities.has(trip.id) && trip.particularity && (
                        <TableRow key={`${trip.id}-particularity`} className="bg-red-50 dark:bg-red-950/20">
                          <TableCell colSpan={12} className="py-3">
                            <div className="flex items-start gap-3 px-4">
                              <div className="flex-shrink-0 mt-1">
                                <svg
                                  className="w-5 h-5 text-red-600 dark:text-red-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                  />
                                </svg>
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-red-900 dark:text-red-100 mb-1">
                                  {trip.status === "cancelado" ? "Motivo de Cancelación:" : "Particularidad del Viaje:"}
                                </p>
                                <p className="text-red-800 dark:text-red-200 text-sm leading-relaxed">
                                  {trip.particularity}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
              Primera
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Siguiente
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              Última
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
