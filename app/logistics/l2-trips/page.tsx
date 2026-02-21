"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { L2TripForm } from "@/components/l2-trip-form"
import { Plus, Search, Download, Edit, Trash2, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import * as XLSX from "xlsx"

export default function L2TripsPage() {
  const [l2Trips, setL2Trips] = useState<any[]>([])
  const [l1Trips, setL1Trips] = useState<any[]>([])
  const [filteredTrips, setFilteredTrips] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [drivers, setDrivers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedTrip, setSelectedTrip] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("l2")

  // Filtros
  const [searchTerm, setSearchTerm] = useState("")
  const [clientFilter, setClientFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [originFilter, setOriginFilter] = useState("")
  const [destinationFilter, setDestinationFilter] = useState("")
  const [productFilter, setProductFilter] = useState("")
  const [sortField, setSortField] = useState<"date" | "invoice_date">("invoice_date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [
    l2Trips,
    searchTerm,
    clientFilter,
    statusFilter,
    dateFrom,
    dateTo,
    originFilter,
    destinationFilter,
    productFilter,
  ])

  const loadData = async () => {
    const supabase = createClient()
    setLoading(true)

    try {
      // Load L2 trips (trips already in L2)
      const { data: l2TripsData, error: l2Error } = await supabase
        .from("l2_trips")
        .select(`
          *,
          clients(company),
          products(name),
          drivers(name),
          trips(trip_number, line)
        `)
        .order("created_at", { ascending: false })

      if (l2Error) throw l2Error

      // Load L1 trips that are NOT yet in L2
      const { data: existingL2TripIds } = await supabase.from("l2_trips").select("trip_id")

      const l2TripIds = (existingL2TripIds || []).map((t) => t.trip_id).filter(Boolean)

      let l1Query = supabase
        .from("trips")
        .select(`
          *,
          driver:drivers(
            id,
            name,
            cuit,
            chasis:vehicles!drivers_chasis_id_fkey(id, patent_chasis),
            semi:vehicles!drivers_semi_id_fkey(id, patent_chasis)
          )
        `)
        .eq("line", "L2")
        .order("date", { ascending: false })

      // Only add the NOT IN filter if there are actually L2 trip IDs to exclude
      if (l2TripIds.length > 0) {
        l1Query = l1Query.not("id", "in", `(${l2TripIds.join(",")})`)
      }

      const { data: l1TripsData, error: l1Error } = await l1Query

      if (l1Error) throw l1Error

      // Load clients
      const { data: clientsData, error: clientsError } = await supabase.from("clients").select("*").order("company")

      if (clientsError) throw clientsError

      // Load products
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .order("name")

      if (productsError) throw productsError

      // Load drivers with vehicles and transport company
      const { data: driversData, error: driversError } = await supabase
        .from("drivers")
        .select(`
          *,
          chasis:vehicles!drivers_chasis_id_fkey(id, patent_chasis),
          semi:vehicles!drivers_semi_id_fkey(id, patent_chasis),
          transport_company:transport_companies(id, name)
        `)
        .eq("active", true)
        .order("name")

      if (driversError) throw driversError

      const { data: locationsData, error: locationsError } = await supabase.from("locations").select("*").order("name")

      if (locationsError) throw locationsError

      setL2Trips(l2TripsData || [])
      setL1Trips(l1TripsData || [])
      setClients(clientsData || [])
      setProducts(productsData || [])
      setDrivers(driversData || [])
      setLocations(locationsData || [])
    } catch (error: any) {
      console.error("Error loading data:", error)
      toast.error("Error al cargar los datos")
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...l2Trips]

    // Search term
    if (searchTerm) {
      filtered = filtered.filter(
        (trip) =>
          trip.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          trip.clients?.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          trip.origin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          trip.destination?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          trip.drivers?.name?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Client filter
    if (clientFilter && clientFilter !== "all") {
      filtered = filtered.filter((trip) => trip.client_id === clientFilter)
    }

    // Product filter
    if (productFilter && productFilter !== "all") {
      filtered = filtered.filter((trip) => trip.product_id === productFilter)
    }

    // Origin filter
    if (originFilter && originFilter !== "all") {
      filtered = filtered.filter((trip) => trip.origin === originFilter)
    }

    // Destination filter
    if (destinationFilter && destinationFilter !== "all") {
      filtered = filtered.filter((trip) => trip.destination === destinationFilter)
    }

    // Status filter
    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter((trip) => trip.client_payment_status === statusFilter)
    }

    // Date range
    if (dateFrom) {
      filtered = filtered.filter((trip) => trip.invoice_date >= dateFrom)
    }
    if (dateTo) {
      filtered = filtered.filter((trip) => trip.invoice_date <= dateTo)
    }

    filtered.sort((a, b) => {
      const aValue = a[sortField] || ""
      const bValue = b[sortField] || ""
      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredTrips(filtered)
    setCurrentPage(1)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este viaje L2?")) return

    const supabase = createClient()
    const { error } = await supabase.from("l2_trips").delete().eq("id", id)

    if (error) {
      toast.error("Error al eliminar el viaje")
      return
    }

    toast.success("Viaje eliminado exitosamente")
    loadData()
  }

  const handleExport = () => {
    const exportData = filteredTrips.map((trip) => ({
      Año: trip.year,
      Rubro: trip.category,
      Fecha: formatLocalDate(trip.invoice_date),
      RTO: trip.invoice_number,
      Cliente: trip.clients?.company,
      "Tara Origen": trip.tare_origin,
      Bruto: trip.gross_weight,
      "Neto Origen": trip.net_origin,
      "Tara Destino": trip.tare_destination,
      "Bruto Destino": trip.gross_destination,
      "Neto Destino": trip.net_destination,
      Diferencia: trip.weight_difference,
      "TN Desc.": trip.tons_delivered,
      Tarifa: trip.tariff_rate,
      "$/Viaje": trip.trip_amount,
      Producto: trip.products?.name,
      Transporte: trip.third_party_transport,
      Carga: trip.origin,
      "Empresa Proveedora": trip.origin_company,
      Descarga: trip.destination,
      "Empresa Descarga": trip.destination_company,
      Chofer: trip.drivers?.name,
      "Patente Camión": trip.chasis_patent,
      "Patente Semi": trip.semi_patent,
      "Estado Cliente": trip.client_payment_status,
      "Estado Terceros": trip.third_party_payment_status,
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)

    // Set column widths
    ws["!cols"] = [
      { wch: 6 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 25 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 10 },
      { wch: 12 },
      { wch: 12 },
      { wch: 30 },
      { wch: 15 },
      { wch: 30 },
      { wch: 20 },
      { wch: 30 },
      { wch: 20 },
      { wch: 25 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Viajes L2")

    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })
    const blob = new Blob([wbout], { type: "application/octet-stream" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `viajes_l2_${new Date().toISOString().split("T")[0]}.xlsx`
    link.click()
    URL.revokeObjectURL(url)

    toast.success("Datos exportados exitosamente")
  }

  const exportTripPDF = async (trip: any) => {
    try {
      const response = await fetch("/api/generate-l2-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trip }),
      })

      if (!response.ok) throw new Error("Error generating PDF")

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `viaje_l2_${trip.invoice_number || trip.id}.pdf`
      link.click()
      URL.revokeObjectURL(url)

      toast.success("PDF generado exitosamente")
    } catch (error) {
      console.error("Error exporting PDF:", error)
      toast.error("Error al generar el PDF")
    }
  }

  const toggleSort = () => {
    setSortDirection(sortDirection === "asc" ? "desc" : "asc")
  }

  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)

  const totalPages = Math.ceil(filteredTrips.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentTrips = filteredTrips.slice(startIndex, endIndex)

  // Calculate totals
  const totals = {
    tripAmount: filteredTrips.reduce((sum, t) => sum + (Number.parseFloat(t.trip_amount) || 0), 0),
    thirdPartyAmount: filteredTrips.reduce((sum, t) => sum + (Number.parseFloat(t.third_party_amount) || 0), 0),
    profit: filteredTrips.reduce(
      (sum, t) => sum + ((Number.parseFloat(t.trip_amount) || 0) - (Number.parseFloat(t.third_party_amount) || 0)),
      0,
    ),
  }

  // Helper function to format dates without timezone conversion
  const formatLocalDate = (dateString: string) => {
    if (!dateString) return "-"
    const [year, month, day] = dateString.split("-")
    return `${day}/${month}/${year}`
  }

  const promoteToL2 = async (l1Trip: any) => {
    try {
      const supabase = createClient()

      // Find client by name
      const client = clients.find((c) => c.company === l1Trip.client_name)

      // Find product by name
      const product = products.find((p) => p.name === l1Trip.product)

      const l2TripData = {
        trip_id: l1Trip.id,
        client_id: client?.id || "",
        product_id: product?.id || "",
        driver_id: l1Trip.driver_id || "",
        origin: l1Trip.loading_location || "",
        destination: l1Trip.unloading_location || "",
        chasis_patent: l1Trip.driver?.chasis?.patent_chasis || "",
        semi_patent: l1Trip.driver?.semi?.patent_chasis || "",
        third_party_transport: l1Trip.transport_company || "",
        notes: l1Trip.notes || "",
        year: new Date(l1Trip.date).getFullYear(),
        invoice_date: l1Trip.date || "",
        client_fca_number: "PENDIENTE",
        client_payment_status: "PENDIENTE",
        third_party_payment_status: "IMPAGO",
        client_invoice_passed: false,
        category: "Tercero",
        _isPromotion: true,
        _shouldLookupTariff: true,
        _l1Trip: l1Trip,
      }

      // Open dialog with pre-filled data
      setSelectedTrip(l2TripData)
      setDialogOpen(true)
    } catch (error: any) {
      console.error("Error promoting trip:", error)
      toast.error("Error al promover el viaje")
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Cargando...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button asChild variant="ghost" size="icon">
              <Link href="/logistics">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
            </Button>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#0038ae] flex items-center justify-center">
                <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
              </div>
              <h1 className="text-base sm:text-xl font-bold">Viajes Línea 2</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4 sm:py-8 space-y-4 sm:space-y-6">
        <div className="flex flex-wrap justify-end items-center gap-2">
          <Button onClick={handleExport} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar Excel
          </Button>
          <Button
            onClick={() => {
              setSelectedTrip(null)
              setDialogOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Viaje L2
          </Button>
        </div>

        {/* Tabs for L1 pending and L2 completed */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pending">Pendientes de Completar ({l1Trips.length})</TabsTrigger>
            <TabsTrigger value="l2">Viajes L2 Completados ({l2Trips.length})</TabsTrigger>
          </TabsList>

          {/* Pending L1 Trips Tab */}
          <TabsContent value="pending" className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                Estos son viajes completados de Línea 2 que aún no tienen datos de facturación y tarifas. Haz clic en
                "Completar en L2" para agregar los datos adicionales.
              </p>
            </div>

            <div className="bg-card rounded-lg border overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N° Viaje</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead>Chofer</TableHead>
                      <TableHead>Origen</TableHead>
                      <TableHead>Destino</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {l1Trips.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                          No hay viajes pendientes de completar
                        </TableCell>
                      </TableRow>
                    ) : (
                      l1Trips.map((trip) => (
                        <TableRow key={trip.id}>
                          <TableCell className="font-medium">{trip.trip_number}</TableCell>
                          <TableCell>{formatLocalDate(trip.date)}</TableCell>
                          <TableCell>{trip.client_name}</TableCell>
                          <TableCell>{trip.product}</TableCell>
                          <TableCell>{trip.driver?.name}</TableCell>
                          <TableCell>{trip.loading_location}</TableCell>
                          <TableCell>{trip.unloading_location}</TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" onClick={() => promoteToL2(trip)}>
                              <ArrowRight className="mr-2 h-4 w-4" />
                              Completar en L2
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          {/* L2 Trips Tab */}
          <TabsContent value="l2" className="space-y-4">
            {/* Filters */}
            <div className="bg-card rounded-lg border p-4 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={clientFilter} onValueChange={setClientFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los clientes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los clientes</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={productFilter} onValueChange={setProductFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los productos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los productos</SelectItem>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="PENDIENTE">PENDIENTE</SelectItem>
                    <SelectItem value="COBRADO">COBRADO</SelectItem>
                    <SelectItem value="PARCIAL">PARCIAL</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={originFilter} onValueChange={setOriginFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los orígenes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los orígenes</SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.name}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={destinationFilter} onValueChange={setDestinationFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los destinos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los destinos</SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.name}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input type="date" placeholder="Desde" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                <Input type="date" placeholder="Hasta" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-card rounded-lg border p-6">
                <p className="text-sm text-muted-foreground">Facturado a Clientes</p>
                <p className="text-2xl font-bold text-green-600">
                  ${totals.tripAmount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-card rounded-lg border p-6">
                <p className="text-sm text-muted-foreground">Pagado a Terceros</p>
                <p className="text-2xl font-bold text-red-600">
                  ${totals.thirdPartyAmount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-card rounded-lg border p-6">
                <p className="text-sm text-muted-foreground">Ganancia</p>
                <p className="text-2xl font-bold text-blue-600">
                  ${totals.profit.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Table */}
            <div className="bg-card rounded-lg border overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={toggleSort}>
                        <div className="flex items-center gap-1">
                          Fecha
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </div>
                      </TableHead>
                      <TableHead>RTO</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead>Origen</TableHead>
                      <TableHead>Destino</TableHead>
                      <TableHead className="text-right">TN</TableHead>
                      <TableHead className="text-right">$/Viaje</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentTrips.map((trip) => (
                      <TableRow key={trip.id}>
                        <TableCell>{formatLocalDate(trip.invoice_date)}</TableCell>
                        <TableCell>{trip.invoice_number}</TableCell>
                        <TableCell>{trip.clients?.company}</TableCell>
                        <TableCell>{trip.products?.name}</TableCell>
                        <TableCell>{trip.origin}</TableCell>
                        <TableCell>{trip.destination}</TableCell>
                        <TableCell className="text-right">{trip.tons_delivered}</TableCell>
                        <TableCell className="text-right">
                          ${Number.parseFloat(trip.trip_amount || 0).toLocaleString("es-AR")}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              trip.client_payment_status === "COBRADO"
                                ? "bg-green-100 text-green-800"
                                : trip.client_payment_status === "PARCIAL"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {trip.client_payment_status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="outline" onClick={() => exportTripPDF(trip)}>
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedTrip(trip)
                                setDialogOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDelete(trip.id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-4 border-t">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm text-muted-foreground">Mostrar</span>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                      setItemsPerPage(Number.parseInt(value))
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger className="w-16 sm:w-20 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-xs sm:text-sm text-muted-foreground">de {filteredTrips.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs sm:text-sm">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedTrip?._isPromotion
                  ? "Completar Viaje en L2"
                  : selectedTrip
                    ? "Editar Viaje L2"
                    : "Nuevo Viaje L2"}
              </DialogTitle>
            </DialogHeader>
            <L2TripForm
              trip={selectedTrip}
              clients={clients}
              drivers={drivers}
              products={products}
              onSuccess={() => {
                setDialogOpen(false)
                loadData()
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
