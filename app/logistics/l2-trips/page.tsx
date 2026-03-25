"use client"

import { useEffect, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { L2TripForm } from "@/components/l2-trip-form"
import { BulkEditDialog } from "@/components/bulk-edit-dialog"
import { Plus, Search, Download, Edit, Trash2, ChevronLeft, ChevronRight, ArrowRight, FileText, Banknote, ListChecks, Filter, X, FileSpreadsheet, FileIcon } from "lucide-react"
import { toast } from "sonner"
import * as XLSX from "xlsx"
import { generateL2TripsListPDF, generateSingleL2TripPDF } from "@/lib/pdf/l2-trips-pdf"
import { L2Trip, L1Trip, Client, Driver, Product, Location } from "@/types/l2-trip"

export default function L2TripsPage() {
  const [l2Trips, setL2Trips] = useState<L2Trip[]>([])
  const [l1Trips, setL1Trips] = useState<L1Trip[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [bulkEditDialogOpen, setBulkEditDialogOpen] = useState(false)
  const [bulkEditMode, setBulkEditMode] = useState<"full" | "billing" | "settlement">("full")
  const [selectedTrip, setSelectedTrip] = useState<L2Trip | null>(null)
  const [activeTab, setActiveTab] = useState("l2")
  const [selectedTrips, setSelectedTrips] = useState<string[]>([])

  // Filtros
  const [searchTerm, setSearchTerm] = useState("")
  const [clientFilter, setClientFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [originFilter, setOriginFilter] = useState("")
  const [destinationFilter, setDestinationFilter] = useState("")
  const [productFilter, setProductFilter] = useState("")
  // Nuevos filtros
  const [categoryFilter, setCategoryFilter] = useState("")
  const [clientInvoiceNumberFilter, setClientInvoiceNumberFilter] = useState("")
  const [clientInvoiceDateFilter, setClientInvoiceDateFilter] = useState("")
  const [thirdPartyTransportFilter, setThirdPartyTransportFilter] = useState("")
  const [thirdPartyInvoiceFilter, setThirdPartyInvoiceFilter] = useState("")
  const [thirdPartyPaymentDateFilter, setThirdPartyPaymentDateFilter] = useState("")
  const [thirdPartyPaymentStatusFilter, setThirdPartyPaymentStatusFilter] = useState("")
  const [driverFilter, setDriverFilter] = useState("")

  const [sortField, setSortField] = useState<"date" | "invoice_date">("invoice_date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  useEffect(() => {
    loadData()
  }, [])

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
        .in("line", ["L2", "L1/L2"])
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

  const filteredTrips = useMemo(() => {
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

    // Status filter (Client)
    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter((trip) => trip.client_payment_status === statusFilter)
    }

    // Category filter
    if (categoryFilter && categoryFilter !== "all") {
      filtered = filtered.filter((trip) => trip.category === categoryFilter)
    }

    // Client Invoice Number
    if (clientInvoiceNumberFilter) {
      filtered = filtered.filter((trip) => 
        trip.client_invoice_number?.toLowerCase().includes(clientInvoiceNumberFilter.toLowerCase())
      )
    }

    // Client Invoice Date
    if (clientInvoiceDateFilter) {
      filtered = filtered.filter((trip) => trip.client_invoice_date === clientInvoiceDateFilter)
    }

    // Third Party Transport
    if (thirdPartyTransportFilter) {
      filtered = filtered.filter((trip) => 
        trip.third_party_transport?.toLowerCase().includes(thirdPartyTransportFilter.toLowerCase())
      )
    }

    // Third Party Invoice
    if (thirdPartyInvoiceFilter) {
      filtered = filtered.filter((trip) => 
        trip.third_party_invoice?.toLowerCase().includes(thirdPartyInvoiceFilter.toLowerCase())
      )
    }

    // Third Party Payment Date
    if (thirdPartyPaymentDateFilter) {
      filtered = filtered.filter((trip) => trip.third_party_payment_date === thirdPartyPaymentDateFilter)
    }

    // Third Party Payment Status
    if (thirdPartyPaymentStatusFilter && thirdPartyPaymentStatusFilter !== "all") {
      filtered = filtered.filter((trip) => trip.third_party_payment_status === thirdPartyPaymentStatusFilter)
    }

    // Date range
    if (dateFrom) {
      filtered = filtered.filter((trip) => trip.invoice_date >= dateFrom)
    }
    if (dateTo) {
      filtered = filtered.filter((trip) => trip.invoice_date <= dateTo)
    }

    // Tab filters
    if (activeTab === "l2_billed") {
      filtered = filtered.filter(
        (t) => t.client_invoice_passed === true && t.client_invoice_number?.trim() && t.client_invoice_date
      )
    } else if (activeTab === "l2_settled") {
      filtered = filtered.filter(
        (t) => t.third_party_invoice?.trim() && t.third_party_payment_date && t.third_party_payment_status === "PAGADO"
      )
    } else if (activeTab === "l2_completed_all") {
      filtered = filtered.filter(
        (t) =>
          t.client_invoice_passed === true &&
          t.client_invoice_number?.trim() &&
          t.client_invoice_date &&
          t.third_party_invoice?.trim() &&
          t.third_party_payment_date &&
          t.third_party_payment_status === "PAGADO"
      )
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

    return filtered
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
    categoryFilter,
    clientInvoiceNumberFilter,
    clientInvoiceDateFilter,
    thirdPartyTransportFilter,
    thirdPartyInvoiceFilter,
    thirdPartyPaymentDateFilter,
    thirdPartyPaymentStatusFilter,
    activeTab,
    sortField,
    sortDirection,
  ])

  const filteredL1Trips = useMemo(() => {
    let filtered = [...l1Trips]

    if (searchTerm) {
      filtered = filtered.filter(
        (trip) =>
          trip.trip_number?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
          trip.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          trip.product?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          trip.driver?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          trip.loading_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          trip.unloading_location?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (clientFilter && clientFilter !== "all") {
      const client = clients.find((c) => c.id === clientFilter)
      if (client?.company) {
        filtered = filtered.filter((trip) => trip.client_name === client.company)
      }
    }

    if (productFilter && productFilter !== "all") {
      const product = products.find((p) => p.id === productFilter)
      if (product?.name) {
        filtered = filtered.filter((trip) => trip.product === product.name)
      }
    }

    if (originFilter && originFilter !== "all") {
      filtered = filtered.filter((trip) => trip.loading_location === originFilter)
    }

    if (destinationFilter && destinationFilter !== "all") {
      filtered = filtered.filter((trip) => trip.unloading_location === destinationFilter)
    }

    if (driverFilter && driverFilter !== "all") {
      filtered = filtered.filter((trip) => trip.driver_id === driverFilter || trip.driver?.id === driverFilter)
    }

    if (dateFrom) {
      filtered = filtered.filter((trip) => trip.date >= dateFrom)
    }
    if (dateTo) {
      filtered = filtered.filter((trip) => trip.date <= dateTo)
    }

    return filtered
  }, [
    l1Trips,
    searchTerm,
    clientFilter,
    productFilter,
    originFilter,
    destinationFilter,
    driverFilter,
    dateFrom,
    dateTo,
    clients,
    products,
  ])

  useEffect(() => {
    setCurrentL1Page(1)
  }, [filteredL1Trips.length])

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filteredTrips.length])

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
      "N° Comp. Cliente": trip.client_invoice_number,
      "F. Pasada Cliente": formatLocalDate(trip.client_invoice_date),
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
      "N° Comp. Tercero": trip.third_party_invoice,
      "F. Pago Tercero": formatLocalDate(trip.third_party_payment_date),
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

  const handleExportPDF = async () => {
    await generateL2TripsListPDF({
      filteredTrips,
      activeTab,
      dateFrom,
      dateTo,
      clientFilter,
      thirdPartyTransportFilter,
      clients
    })
    toast.success("PDF generado exitosamente")
  }

  const handleExportTripPDF = async (trip: L2Trip) => {
    await generateSingleL2TripPDF(trip)
    toast.success("PDF generado exitosamente")
  }

  const toggleSort = () => {
    setSortDirection(sortDirection === "asc" ? "desc" : "asc")
  }

  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [currentL1Page, setCurrentL1Page] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)

  const totalPages = Math.ceil(filteredTrips.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentTrips = filteredTrips.slice(startIndex, endIndex)

  const totalL1Pages = Math.ceil(filteredL1Trips.length / itemsPerPage)
  const l1StartIndex = (currentL1Page - 1) * itemsPerPage
  const currentL1Trips = filteredL1Trips.slice(l1StartIndex, l1StartIndex + itemsPerPage)

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

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setSelectedTrips([])
  }

  const promoteToL2 = async (l1Trip: L1Trip) => {
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

  const handleBulkEditSuccess = () => {
    loadData()
    setSelectedTrips([])
  }

  const handleBulkBilling = () => {
    if (selectedTrips.length === 0) return
    setBulkEditMode("billing")
    setBulkEditDialogOpen(true)
  }

  const handleBulkSettlement = () => {
    if (selectedTrips.length === 0) return
    setBulkEditMode("settlement")
    setBulkEditDialogOpen(true)
  }

  const handleBulkFull = () => {
    if (selectedTrips.length === 0) return
    setBulkEditMode("full")
    setBulkEditDialogOpen(true)
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
          {selectedTrips.length > 0 && activeTab !== "pending" && (
            <>
              <Button onClick={handleBulkBilling} variant="secondary">
                <FileText className="mr-2 h-4 w-4" />
                Facturar masivamente ({selectedTrips.length})
              </Button>
              <Button onClick={handleBulkFull} variant="secondary">
                <ListChecks className="mr-2 h-4 w-4" />
                Facturar y liquidar masivamente ({selectedTrips.length})
              </Button>
              <Button onClick={handleBulkSettlement} variant="secondary">
                <Banknote className="mr-2 h-4 w-4" />
                Liquidar masivamente ({selectedTrips.length})
              </Button>
            </>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleExport}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Exportar Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDF}>
                <FileIcon className="mr-2 h-4 w-4" />
                Exportar PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent">
            <TabsTrigger value="pending" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Pendientes ({l1Trips.length})</TabsTrigger>
            <TabsTrigger value="l2" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Todos ({l2Trips.length})</TabsTrigger>
            <TabsTrigger value="l2_billed" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">Facturados</TabsTrigger>
            <TabsTrigger value="l2_settled" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">Liquidados</TabsTrigger>
            <TabsTrigger value="l2_completed_all" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">Completos</TabsTrigger>
          </TabsList>

          {/* Pending L1 Trips Tab */}
          <TabsContent value="pending" className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                Estos son viajes completados de Línea 2 que aún no tienen datos de facturación y tarifas. Haz clic en
                "Completar en L2" para agregar los datos adicionales.
              </p>
            </div>

            {/* Filters for Pending */}
            <div className="bg-card rounded-lg border p-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por N° Viaje, Cliente, Origen, Destino, Chofer, Producto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    <Filter className="mr-2 h-4 w-4" />
                    Filtros Avanzados
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[800px] p-6" align="end">
                  <div className="space-y-6 max-h-[80vh] overflow-y-auto">
                    <div>
                      <h3 className="text-base font-semibold mb-3">Filtros Generales</h3>
                      <div className="grid grid-cols-4 gap-4">
                        <Select value={productFilter} onValueChange={setProductFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="Producto" />
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

                        <div className="col-span-2 grid grid-cols-2 gap-2">
                          <Input type="date" placeholder="Desde" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                          <Input type="date" placeholder="Hasta" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                        </div>

                        <Select value={originFilter} onValueChange={setOriginFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="Origen (Carga)" />
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
                            <SelectValue placeholder="Destino (Descarga)" />
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
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="text-base font-semibold mb-3">Cliente y Chofer</h3>
                      <div className="grid grid-cols-4 gap-4">
                        <Select value={clientFilter} onValueChange={setClientFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="Cliente" />
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

                        <Select value={driverFilter} onValueChange={setDriverFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="Chofer" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos los choferes</SelectItem>
                            {drivers.map((driver) => (
                              <SelectItem key={driver.id} value={driver.id}>
                                {driver.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                      <Button 
                        variant="ghost" 
                        onClick={() => {
                          setSearchTerm("")
                          setClientFilter("all")
                          setProductFilter("all")
                          setOriginFilter("all")
                          setDestinationFilter("all")
                          setDriverFilter("all")
                          setDateFrom("")
                          setDateTo("")
                        }}
                      >
                        Limpiar Filtros
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
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
                    {filteredL1Trips.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                          No hay viajes pendientes de completar
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentL1Trips.map((trip) => (
                        <TableRow key={trip.id}>
                          <TableCell className="font-medium">{trip.trip_number}</TableCell>
                          <TableCell>{formatLocalDate(trip.date)}</TableCell>
                          <TableCell>{trip.client_name}</TableCell>
                          <TableCell>{trip.product}</TableCell>
                          <TableCell>{trip.driver?.name}</TableCell>
                          <TableCell>{trip.loading_location}</TableCell>
                          <TableCell>{trip.unloading_location}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              onClick={() => promoteToL2(trip)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Completar en L2
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination for L1 */}
              {filteredL1Trips.length > itemsPerPage && (
                <div className="flex items-center justify-between px-4 py-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {(currentL1Page - 1) * itemsPerPage + 1} a{" "}
                    {Math.min(currentL1Page * itemsPerPage, filteredL1Trips.length)} de {filteredL1Trips.length} viajes
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentL1Page((p) => Math.max(1, p - 1))}
                      disabled={currentL1Page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentL1Page((p) => Math.min(totalL1Pages, p + 1))}
                      disabled={currentL1Page === totalL1Pages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {activeTab !== "pending" && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="bg-card rounded-lg border p-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por RTO, Cliente, Origen, Destino, Chofer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    <Filter className="mr-2 h-4 w-4" />
                    Filtros Avanzados
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[800px] p-6" align="end">
                  <div className="space-y-6 max-h-[80vh] overflow-y-auto">
                    <div>
                      <h3 className="text-base font-semibold mb-3">Filtros Generales</h3>
                      <div className="grid grid-cols-4 gap-4">
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="Rubro" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="Propio">Propio</SelectItem>
                            <SelectItem value="Tercero">Tercero</SelectItem>
                          </SelectContent>
                        </Select>

                        <Select value={productFilter} onValueChange={setProductFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="Producto" />
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

                        <div className="col-span-2 grid grid-cols-2 gap-2">
                          <Input type="date" placeholder="Desde" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                          <Input type="date" placeholder="Hasta" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                        </div>

                        <Select value={originFilter} onValueChange={setOriginFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="Origen" />
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
                            <SelectValue placeholder="Destino" />
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
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="text-base font-semibold mb-3">Filtros Cliente</h3>
                      <div className="grid grid-cols-4 gap-4">
                        <Select value={clientFilter} onValueChange={setClientFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="Cliente" />
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

                        <Input 
                          placeholder="N° Comp. Cliente" 
                          value={clientInvoiceNumberFilter} 
                          onChange={(e) => setClientInvoiceNumberFilter(e.target.value)} 
                        />

                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-muted-foreground">Fecha Pasada Cliente</span>
                          <Input type="date" value={clientInvoiceDateFilter} onChange={(e) => setClientInvoiceDateFilter(e.target.value)} />
                        </div>

                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="Estado Cliente" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="PENDIENTE">PENDIENTE</SelectItem>
                            <SelectItem value="COBRADO">COBRADO</SelectItem>
                            <SelectItem value="PARCIAL">PARCIAL</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="text-base font-semibold mb-3">Filtros Terceros</h3>
                      <div className="grid grid-cols-4 gap-4">
                         <Input 
                          placeholder="Transporte" 
                          value={thirdPartyTransportFilter} 
                          onChange={(e) => setThirdPartyTransportFilter(e.target.value)} 
                        />

                        <Input 
                          placeholder="N° Comp. Tercero" 
                          value={thirdPartyInvoiceFilter} 
                          onChange={(e) => setThirdPartyInvoiceFilter(e.target.value)} 
                        />

                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-muted-foreground">Fecha Comp. Tercero</span>
                          <Input type="date" value={thirdPartyPaymentDateFilter} onChange={(e) => setThirdPartyPaymentDateFilter(e.target.value)} />
                        </div>

                        <Select value={thirdPartyPaymentStatusFilter} onValueChange={setThirdPartyPaymentStatusFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="Estado Tercero" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="IMPAGO">IMPAGO</SelectItem>
                            <SelectItem value="PAGADO">PAGADO</SelectItem>
                            <SelectItem value="PARCIAL">PARCIAL</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="pt-4 flex justify-end">
                      <Button 
                        variant="ghost" 
                        onClick={() => {
                          setSearchTerm("")
                          setClientFilter("all")
                          setProductFilter("all")
                          setOriginFilter("all")
                          setDestinationFilter("all")
                          setStatusFilter("all")
                          setCategoryFilter("all")
                          setClientInvoiceNumberFilter("")
                          setClientInvoiceDateFilter("")
                          setThirdPartyTransportFilter("")
                          setThirdPartyInvoiceFilter("")
                          setThirdPartyPaymentDateFilter("")
                          setThirdPartyPaymentStatusFilter("all")
                          setDateFrom("")
                          setDateTo("")
                        }}
                      >
                        Limpiar Filtros
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
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
                      <TableHead className="w-[40px]">
                        <Checkbox
                          checked={filteredTrips.length > 0 && selectedTrips.length === filteredTrips.length}
                          onCheckedChange={(checked) => {
                            if (checked) setSelectedTrips(filteredTrips.map((t) => t.id))
                            else setSelectedTrips([])
                          }}
                        />
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          if (sortField === "invoice_date") {
                            setSortDirection(sortDirection === "asc" ? "desc" : "asc")
                          } else {
                            setSortField("invoice_date")
                            setSortDirection("desc")
                          }
                        }}
                      >
                        Fecha {sortField === "invoice_date" && (sortDirection === "asc" ? "↑" : "↓")}
                      </TableHead>
                      <TableHead>RTO</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Chofer</TableHead>
                      <TableHead>Origen</TableHead>
                      <TableHead>Destino</TableHead>
                      {(activeTab === "l2" || activeTab === "l2_billed" || activeTab === "l2_completed_all") && (
                        <TableHead>Estado Cliente</TableHead>
                      )}
                      {(activeTab === "l2_billed") && (
                         <TableHead>N° Factura</TableHead>
                      )}
                      {(activeTab === "l2_settled" || activeTab === "l2_completed_all") && (
                        <TableHead>Estado Tercero</TableHead>
                      )}
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTrips.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                          No hay viajes completados que coincidan con los filtros
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTrips.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((trip) => (
                        <TableRow key={trip.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedTrips.includes(trip.id)}
                              onCheckedChange={(checked) => {
                                if (checked) setSelectedTrips([...selectedTrips, trip.id])
                                else setSelectedTrips(selectedTrips.filter((id) => id !== trip.id))
                              }}
                            />
                          </TableCell>
                          <TableCell>{formatLocalDate(trip.invoice_date)}</TableCell>
                          <TableCell>{trip.invoice_number}</TableCell>
                          <TableCell>
                            <div>{trip.clients?.company}</div>
                            <div className="text-xs text-muted-foreground">{trip.product}</div>
                          </TableCell>
                          <TableCell>{trip.drivers?.name}</TableCell>
                          <TableCell>{trip.origin}</TableCell>
                          <TableCell>{trip.destination}</TableCell>
                          {(activeTab === "l2" || activeTab === "l2_billed" || activeTab === "l2_completed_all") && (
                            <TableCell>
                              <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                trip.client_payment_status === "COBRADO" ? "bg-green-100 text-green-800" :
                                trip.client_payment_status === "PARCIAL" ? "bg-yellow-100 text-yellow-800" :
                                "bg-gray-100 text-gray-800"
                              }`}>
                                {trip.client_payment_status || "PENDIENTE"}
                              </div>
                            </TableCell>
                          )}
                          {(activeTab === "l2_billed") && (
                            <TableCell>{trip.client_invoice_number || "-"}</TableCell>
                          )}
                          {(activeTab === "l2_settled" || activeTab === "l2_completed_all") && (
                            <TableCell>
                              <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                trip.third_party_payment_status === "PAGADO" ? "bg-green-100 text-green-800" :
                                trip.third_party_payment_status === "PARCIAL" ? "bg-yellow-100 text-yellow-800" :
                                "bg-red-100 text-red-800"
                              }`}>
                                {trip.third_party_payment_status || "IMPAGO"}
                              </div>
                            </TableCell>
                          )}
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleExportTripPDF(trip)}>
                                <FileIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedTrip(trip)
                                  setDialogOpen(true)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(trip.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
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
              {filteredTrips.length > itemsPerPage && (
                <div className="flex items-center justify-between px-4 py-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {(currentPage - 1) * itemsPerPage + 1} a{" "}
                    {Math.min(currentPage * itemsPerPage, filteredTrips.length)} de {filteredTrips.length} viajes
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(Math.ceil(filteredTrips.length / itemsPerPage), p + 1))}
                      disabled={currentPage === Math.ceil(filteredTrips.length / itemsPerPage)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

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
      {/* Bulk Edit Dialog */}
      <BulkEditDialog
        open={bulkEditDialogOpen}
        onOpenChange={setBulkEditDialogOpen}
        selectedTripIds={selectedTrips}
        onSuccess={handleBulkEditSuccess}
      />
    </div>
  )
}
