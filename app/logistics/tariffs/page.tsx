"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, AlertTriangle, ChevronLeft, Filter, X, Download } from "lucide-react"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { TariffForm } from "@/components/tariff-form"
import * as XLSX from "xlsx"
import Link from "next/link"

export default function TariffsPage() {
  const [tariffs, setTariffs] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [transportCompanies, setTransportCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedTariff, setSelectedTariff] = useState<any>(null)

  // Filters
  const [filterClient, setFilterClient] = useState("all")
  const [filterProduct, setFilterProduct] = useState("all")
  const [filterOrigin, setFilterOrigin] = useState("all")
  const [filterDestination, setFilterDestination] = useState("all")
  const [filterTransport, setFilterTransport] = useState("all")
  const [filterCurrency, setFilterCurrency] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterKm, setFilterKm] = useState("")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const supabase = createClient()
    setLoading(true)

    try {
      const [tariffsRes, clientsRes, productsRes, locationsRes, companiesRes] = await Promise.all([
        supabase
          .from("l2_tariffs")
          .select(
            `
          *,
          clients(company),
          products(name)
        `,
          )
          .order("created_at", { ascending: false }),
        supabase.from("clients").select("*").order("company"),
        supabase.from("products").select("*").eq("active", true).order("name"),
        supabase.from("locations").select("*").eq("active", true).order("name"),
        supabase.from("transport_companies").select("*").eq("active", true).order("name"),
      ])

      if (tariffsRes.error) throw tariffsRes.error
      if (clientsRes.error) throw clientsRes.error
      if (productsRes.error) throw productsRes.error
      if (locationsRes.error) throw locationsRes.error
      if (companiesRes.error) throw companiesRes.error

      setTariffs(tariffsRes.data || [])
      setClients(clientsRes.data || [])
      setProducts(productsRes.data || [])
      setLocations(locationsRes.data || [])
      setTransportCompanies(companiesRes.data || [])
    } catch (error: any) {
      console.error("Error loading data:", error)
      toast.error("Error al cargar los datos")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar esta tarifa?")) return

    const supabase = createClient()
    const { error } = await supabase.from("l2_tariffs").delete().eq("id", id)

    if (error) {
      toast.error("Error al eliminar la tarifa")
      return
    }

    toast.success("Tarifa eliminada exitosamente")
    loadData()
  }

  const getTariffStatus = (tariff: any) => {
    if (!tariff.valid_until) return { status: "indefinido", color: "text-gray-600", bgColor: "bg-gray-100" }

    const today = new Date()
    const validUntil = new Date(tariff.valid_until)
    const daysUntilExpiry = Math.ceil((validUntil.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilExpiry < 0)
      return { status: "vencida", color: "text-red-800", bgColor: "bg-red-100", days: Math.abs(daysUntilExpiry) }
    if (daysUntilExpiry <= 30)
      return { status: "por vencer", color: "text-yellow-800", bgColor: "bg-yellow-100", days: daysUntilExpiry }
    return { status: "vigente", color: "text-green-800", bgColor: "bg-green-100" }
  }

  const filteredTariffs = tariffs.filter((tariff) => {
    if (filterClient !== "all" && (tariff.client_id || "all") !== filterClient) return false
    if (filterProduct !== "all" && (tariff.product_id || "all") !== filterProduct) return false
    if (filterOrigin !== "all") {
      const origin = tariff.origin === "ALL" ? "all" : tariff.origin
      if (origin !== filterOrigin) return false
    }
    if (filterDestination !== "all") {
      const dest = tariff.destination === "ALL" ? "all" : tariff.destination
      if (dest !== filterDestination) return false
    }
    if (filterTransport !== "all") {
      const transport = tariff.transport_company === "ALL" ? "all" : tariff.transport_company
      if (transport !== filterTransport) return false
    }
    if (filterCurrency !== "all" && (tariff.currency || "ARS") !== filterCurrency) return false
    if (filterStatus !== "all") {
      const statusInfo = getTariffStatus(tariff)
      if (filterStatus !== statusInfo.status) return false
    }
    if (filterKm !== "") {
      const minKm = Number.parseFloat(filterKm)
      const tariffKm = tariff.kilometers ? Number.parseFloat(tariff.kilometers) : 0
      if (tariffKm < minKm) return false
    }
    return true
  })

  const hasActiveFilters = filterClient !== "all" || filterProduct !== "all" || filterOrigin !== "all" || filterDestination !== "all" || filterTransport !== "all" || filterCurrency !== "all" || filterStatus !== "all" || filterKm !== ""

  const clearFilters = () => {
    setFilterClient("all")
    setFilterProduct("all")
    setFilterOrigin("all")
    setFilterDestination("all")
    setFilterTransport("all")
    setFilterCurrency("all")
    setFilterStatus("all")
    setFilterKm("")
  }

  const handleExportExcel = () => {
    const exportData = filteredTariffs.map((tariff) => {
      const statusInfo = getTariffStatus(tariff)
      return {
        Cliente: tariff.clients?.company || (tariff.client_id ? "" : "Todos"),
        Producto: tariff.products?.name || (tariff.product_id ? "" : "Todos"),
        Origen: tariff.origin === "ALL" ? "Todos" : tariff.origin,
        Destino: tariff.destination === "ALL" ? "Todos" : tariff.destination,
        Transporte: tariff.transport_company === "ALL" ? "Todos" : tariff.transport_company,
        Km: tariff.kilometers ? Number.parseFloat(tariff.kilometers) : "",
        Moneda: tariff.currency || "ARS",
        "$/Viaje": tariff.rate_per_trip || "",
        "$/TN": tariff.rate_per_ton || "",
        "Terceros $/Viaje": tariff.third_party_rate_per_trip || "",
        "Terceros $/TN": tariff.third_party_rate_per_ton || "",
        "Vigencia Desde": tariff.valid_from || "",
        "Vigencia Hasta": tariff.valid_until || "",
        Estado: statusInfo.status,
        Activa: tariff.active ? "Sí" : "No",
        Observaciones: tariff.observations || "",
      }
    })

    const ws = XLSX.utils.json_to_sheet(exportData)
    ws["!cols"] = [
      { wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 20 },
      { wch: 20 }, { wch: 8 }, { wch: 8 }, { wch: 12 },
      { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 14 },
      { wch: 14 }, { wch: 12 }, { wch: 8 }, { wch: 30 },
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Tarifario L2")

    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })
    const blob = new Blob([wbout], { type: "application/octet-stream" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `tarifario_l2_${new Date().toISOString().split("T")[0]}.xlsx`
    link.click()
    URL.revokeObjectURL(url)

    toast.success(`${filteredTariffs.length} tarifas exportadas exitosamente`)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Cargando...</div>
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 border-b pb-4">
        <div className="flex items-center gap-4">
          <Link href="/logistics">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#0038ae]">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 sm:w-6 sm:h-6">
              <path
                d="M13 2L3 14h8l-1 8 10-12h-8l1-8z"
                fill="white"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-xl sm:text-3xl font-bold">Tarifario L2</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Gestión de tarifas para viajes línea 2</p>
          </div>
        </div>
        <div className="sm:ml-auto flex items-center gap-2">
          <Button variant="outline" onClick={handleExportExcel} className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            Exportar Excel
          </Button>
          <Button
            className="w-full sm:w-auto"
            onClick={() => {
              setSelectedTariff(null)
              setDialogOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nueva Tarifa
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg border p-3 sm:p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Filtros</h3>
            {hasActiveFilters && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {filteredTariffs.length} de {tariffs.length}
              </span>
            )}
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="mr-1 h-3 w-3" />
              Limpiar filtros
            </Button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3">
          <Select value={filterClient} onValueChange={setFilterClient}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los clientes</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.company}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterProduct} onValueChange={setFilterProduct}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Producto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los productos</SelectItem>
              {products.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterOrigin} onValueChange={setFilterOrigin}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Origen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los origenes</SelectItem>
              {locations.map((l) => (
                <SelectItem key={l.id} value={l.name}>{l.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterDestination} onValueChange={setFilterDestination}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Destino" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los destinos</SelectItem>
              {locations.map((l) => (
                <SelectItem key={l.id} value={l.name}>{l.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterTransport} onValueChange={setFilterTransport}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Transporte" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las empresas</SelectItem>
              {transportCompanies.map((c) => (
                <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterCurrency} onValueChange={setFilterCurrency}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Moneda" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="ARS">ARS</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="vigente">Vigente</SelectItem>
              <SelectItem value="por vencer">Por vencer</SelectItem>
              <SelectItem value="vencida">Vencida</SelectItem>
              <SelectItem value="indefinido">Indefinido</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="number"
            placeholder="Km mínimos"
            value={filterKm}
            onChange={(e) => setFilterKm(e.target.value)}
            className="h-9 text-xs"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Cliente</TableHead>
                <TableHead className="whitespace-nowrap">Producto</TableHead>
                <TableHead className="whitespace-nowrap">Origen</TableHead>
                <TableHead className="whitespace-nowrap">Destino</TableHead>
                <TableHead className="whitespace-nowrap">Transporte</TableHead>
                <TableHead className="text-right whitespace-nowrap">Km</TableHead>
                <TableHead className="whitespace-nowrap">Moneda</TableHead>
                <TableHead className="text-right whitespace-nowrap">$/Viaje</TableHead>
                <TableHead className="text-right whitespace-nowrap">$/TN</TableHead>
                <TableHead className="text-right whitespace-nowrap">Terceros $/Viaje</TableHead>
                <TableHead className="text-right whitespace-nowrap">Terceros $/TN</TableHead>
                <TableHead className="whitespace-nowrap">Vigencia</TableHead>
                <TableHead className="whitespace-nowrap">Estado</TableHead>
                <TableHead className="text-right whitespace-nowrap">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTariffs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={14} className="text-center py-8 text-muted-foreground">
                    {hasActiveFilters ? "No se encontraron tarifas con los filtros aplicados" : "No hay tarifas cargadas"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredTariffs.map((tariff) => {
                  const statusInfo = getTariffStatus(tariff)
                  const currencySymbol = tariff.currency === "USD" ? "USD" : "$"
                  return (
                    <TableRow key={tariff.id}>
                      <TableCell className="whitespace-nowrap">{tariff.clients?.company || "Todos"}</TableCell>
                      <TableCell className="whitespace-nowrap">{tariff.products?.name || "Todos"}</TableCell>
                      <TableCell className="whitespace-nowrap">{tariff.origin === "ALL" ? "Todos" : tariff.origin}</TableCell>
                      <TableCell className="whitespace-nowrap">{tariff.destination === "ALL" ? "Todos" : tariff.destination}</TableCell>
                      <TableCell className="whitespace-nowrap">{tariff.transport_company === "ALL" ? "Todos" : tariff.transport_company}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {tariff.kilometers ? `${Number.parseFloat(tariff.kilometers).toLocaleString("es-AR")}` : "-"}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${tariff.currency === "USD" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}>
                          {tariff.currency || "ARS"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {tariff.rate_per_trip
                          ? `${currencySymbol} ${Number.parseFloat(tariff.rate_per_trip).toLocaleString("es-AR")}`
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {tariff.rate_per_ton
                          ? `${currencySymbol} ${Number.parseFloat(tariff.rate_per_ton).toLocaleString("es-AR")}`
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {tariff.third_party_rate_per_trip
                          ? `${currencySymbol} ${Number.parseFloat(tariff.third_party_rate_per_trip).toLocaleString("es-AR")}`
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {tariff.third_party_rate_per_ton
                          ? `${currencySymbol} ${Number.parseFloat(tariff.third_party_rate_per_ton).toLocaleString("es-AR")}`
                          : "-"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs">
                        {tariff.valid_from || "-"} / {tariff.valid_until || "Indef."}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className={`px-2 py-0.5 rounded text-xs ${statusInfo.color} ${statusInfo.bgColor}`}>
                            {statusInfo.status.toUpperCase()}
                          </span>
                          {(statusInfo.status === "vencida" || statusInfo.status === "por vencer") && (
                            <AlertTriangle className={`h-3.5 w-3.5 ${statusInfo.status === "vencida" ? "text-red-600" : "text-yellow-600"}`} />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedTariff(tariff)
                              setDialogOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(tariff.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedTariff ? "Editar Tarifa" : "Nueva Tarifa"}</DialogTitle>
          </DialogHeader>
          <TariffForm
            tariff={selectedTariff}
            clients={clients}
            products={products}
            locations={locations}
            transportCompanies={transportCompanies}
            onSuccess={() => {
              setDialogOpen(false)
              loadData()
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
