"use client"

import { useEffect, useState, useMemo, Fragment } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, Filter, X, ArrowUpRight, ArrowDownRight, Minus, History, ChevronDown, ChevronUp } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

export default function TariffHistoryPage() {
  const [tariffs, setTariffs] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [transportCompanies, setTransportCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [filterClient, setFilterClient] = useState("all")
  const [filterProduct, setFilterProduct] = useState("all")
  const [filterOrigin, setFilterOrigin] = useState("all")
  const [filterDestination, setFilterDestination] = useState("all")
  const [filterTransport, setFilterTransport] = useState("all")

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
          .select(`*, clients(company), products(name)`)
          .order("valid_from", { ascending: true }),
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

  // Calculate history and differences
  const groupedHistory = useMemo(() => {
    if (!tariffs.length) return []

    // Group by unique route/service combination
    const grouped = new Map<string, any[]>()

    tariffs.forEach((t) => {
      const key = `${t.client_id || "all"}-${t.product_id || "all"}-${t.origin}-${t.destination}-${t.transport_company}-${t.currency || "ARS"}`
      if (!grouped.has(key)) {
        grouped.set(key, [])
      }
      grouped.get(key)!.push({ ...t, groupKey: key })
    })

    const result: any[] = []

    grouped.forEach((groupTariffs) => {
      // Sort by valid_from ascending to calculate history forward
      groupTariffs.sort((a, b) => new Date(a.valid_from || a.created_at).getTime() - new Date(b.valid_from || b.created_at).getTime())

      const processedTariffs: any[] = []
      for (let i = 0; i < groupTariffs.length; i++) {
        const current = { ...groupTariffs[i] }
        const prev = i > 0 ? groupTariffs[i - 1] : null

        const calcDiff = (currVal: number | string | null, prevVal: number | string | null) => {
          const c = Number.parseFloat(currVal as string) || 0
          const p = Number.parseFloat(prevVal as string) || 0
          if (p === 0) return null
          return ((c - p) / p) * 100
        }

        current.diff_rate_per_trip = prev ? calcDiff(current.rate_per_trip, prev.rate_per_trip) : null
        current.diff_rate_per_ton = prev ? calcDiff(current.rate_per_ton, prev.rate_per_ton) : null
        current.diff_third_party_trip = prev ? calcDiff(current.third_party_rate_per_trip, prev.third_party_rate_per_trip) : null
        current.diff_third_party_ton = prev ? calcDiff(current.third_party_rate_per_ton, prev.third_party_rate_per_ton) : null
        current.isNewest = i === groupTariffs.length - 1

        processedTariffs.push(current)
      }

      // Sort descending so newest is first in the array
      processedTariffs.sort((a, b) => new Date(b.valid_from || b.created_at).getTime() - new Date(a.valid_from || a.created_at).getTime())
      
      result.push({
        groupKey: processedTariffs[0].groupKey,
        latest: processedTariffs[0],
        history: processedTariffs.slice(1),
      })
    })

    // Sort globally by newest valid_from of the group
    return result.sort((a, b) => {
      return new Date(b.latest.valid_from || b.latest.created_at).getTime() - new Date(a.latest.valid_from || a.latest.created_at).getTime()
    })
  }, [tariffs])

  const filteredGroups = useMemo(() => {
    return groupedHistory.filter((group) => {
      const tariff = group.latest
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
      return true
    })
  }, [groupedHistory, filterClient, filterProduct, filterOrigin, filterDestination, filterTransport])

  // Pagination & Expansion
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    setCurrentPage(1)
  }, [filterClient, filterProduct, filterOrigin, filterDestination, filterTransport])

  const paginatedGroups = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredGroups.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredGroups, currentPage])

  const totalPages = Math.ceil(filteredGroups.length / itemsPerPage)

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const toggleGroup = (groupKey: string) => {
    const newSet = new Set(expandedGroups)
    if (newSet.has(groupKey)) newSet.delete(groupKey)
    else newSet.add(groupKey)
    setExpandedGroups(newSet)
  }

  const hasActiveFilters = filterClient !== "all" || filterProduct !== "all" || filterOrigin !== "all" || filterDestination !== "all" || filterTransport !== "all"

  const clearFilters = () => {
    setFilterClient("all")
    setFilterProduct("all")
    setFilterOrigin("all")
    setFilterDestination("all")
    setFilterTransport("all")
  }

  const formatCurrency = (val: string | number | null) => {
    if (!val) return "-"
    return Number.parseFloat(val.toString()).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const renderDiff = (diff: number | null) => {
    if (diff === null) return <span className="text-gray-400"><Minus className="inline h-3 w-3" /></span>
    
    const isPositive = diff > 0
    const isNegative = diff < 0
    const isZero = diff === 0

    if (isZero) return <span className="text-gray-500 text-xs font-medium">0%</span>

    return (
      <span className={`flex items-center text-xs font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}>
        {isPositive ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
        {Math.abs(diff).toFixed(1)}%
      </span>
    )
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Cargando historial...</div>
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 border-b pb-4">
        <div className="flex items-center gap-4">
          <Link href="/logistics/tariffs">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-secondary text-secondary-foreground">
            <History className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-3xl font-bold">Historial de Tarifas</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Auditoría y evolución de precios</p>
          </div>
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
                Resultados filtrados
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
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
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Ruta / Servicio</TableHead>
                <TableHead className="whitespace-nowrap">Vigencia</TableHead>
                <TableHead className="text-right whitespace-nowrap">$/Viaje</TableHead>
                <TableHead className="text-center whitespace-nowrap px-1">Var.</TableHead>
                <TableHead className="text-right whitespace-nowrap">$/TN</TableHead>
                <TableHead className="text-center whitespace-nowrap px-1">Var.</TableHead>
                <TableHead className="text-right whitespace-nowrap">3ros $/Viaje</TableHead>
                <TableHead className="text-center whitespace-nowrap px-1">Var.</TableHead>
                <TableHead className="text-right whitespace-nowrap">3ros $/TN</TableHead>
                <TableHead className="text-center whitespace-nowrap px-1">Var.</TableHead>
                <TableHead className="text-center whitespace-nowrap w-32">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedGroups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                    {hasActiveFilters ? "No se encontraron registros con los filtros aplicados" : "No hay historial disponible"}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedGroups.map((group) => {
                  const isExpanded = expandedGroups.has(group.groupKey)
                  const latest = group.latest
                  const currencySymbol = latest.currency === "USD" ? "U$S" : "$"
                  
                  return (
                    <Fragment key={group.groupKey}>
                      <TableRow className="border-t-2 border-t-gray-200 hover:bg-gray-50/50 transition-colors">
                        <TableCell className="max-w-[250px] truncate" title={`${latest.clients?.company || "Todos"} | ${latest.products?.name || "Todos"} | ${latest.origin === "ALL" ? "Todos" : latest.origin} -> ${latest.destination === "ALL" ? "Todos" : latest.destination}`}>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium text-sm">
                              {latest.clients?.company || "Todos"} • {latest.products?.name || "Todos"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {latest.origin === "ALL" ? "Todos" : latest.origin} → {latest.destination === "ALL" ? "Todos" : latest.destination}
                            </span>
                            <span className="text-xs text-muted-foreground font-semibold">
                              Transporte: {latest.transport_company === "ALL" ? "Todos" : latest.transport_company}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-primary">
                              {latest.valid_from ? new Date(latest.valid_from).toLocaleDateString("es-AR") : "-"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              hasta: {latest.valid_until ? new Date(latest.valid_until).toLocaleDateString("es-AR") : "Indefinido"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap font-medium">
                          {latest.rate_per_trip ? `${currencySymbol} ${formatCurrency(latest.rate_per_trip)}` : "-"}
                        </TableCell>
                        <TableCell className="text-center px-1">
                          {renderDiff(latest.diff_rate_per_trip)}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap font-medium">
                          {latest.rate_per_ton ? `${currencySymbol} ${formatCurrency(latest.rate_per_ton)}` : "-"}
                        </TableCell>
                        <TableCell className="text-center px-1">
                          {renderDiff(latest.diff_rate_per_ton)}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap text-muted-foreground">
                          {latest.third_party_rate_per_trip ? `${currencySymbol} ${formatCurrency(latest.third_party_rate_per_trip)}` : "-"}
                        </TableCell>
                        <TableCell className="text-center px-1">
                          {renderDiff(latest.diff_third_party_trip)}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap text-muted-foreground">
                          {latest.third_party_rate_per_ton ? `${currencySymbol} ${formatCurrency(latest.third_party_rate_per_ton)}` : "-"}
                        </TableCell>
                        <TableCell className="text-center px-1">
                          {renderDiff(latest.diff_third_party_ton)}
                        </TableCell>
                        <TableCell className="text-center">
                          {group.history.length > 0 && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => toggleGroup(group.groupKey)} 
                              className={`h-8 flex items-center gap-1 w-full justify-between ${isExpanded ? 'bg-secondary text-secondary-foreground' : ''}`}
                            >
                              <span className="flex items-center gap-1">
                                <History className="h-3.5 w-3.5" />
                                Historial
                              </span>
                              <div className="flex items-center">
                                <span className="text-xs mr-1 opacity-70">({group.history.length})</span>
                                {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                              </div>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                      
                      {isExpanded && group.history.map((tariff: any) => (
                        <TableRow key={tariff.id} className="bg-gray-50/70 border-t border-t-gray-100/50">
                          <TableCell className="pl-6">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                              <span className="text-xs text-muted-foreground italic">Versión anterior</span>
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="text-sm text-muted-foreground">
                                {tariff.valid_from ? new Date(tariff.valid_from).toLocaleDateString("es-AR") : "-"}
                              </span>
                              <span className="text-xs text-muted-foreground opacity-70">
                                hasta: {tariff.valid_until ? new Date(tariff.valid_until).toLocaleDateString("es-AR") : "Indefinido"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap text-muted-foreground">
                            {tariff.rate_per_trip ? `${currencySymbol} ${formatCurrency(tariff.rate_per_trip)}` : "-"}
                          </TableCell>
                          <TableCell className="text-center px-1">
                            {renderDiff(tariff.diff_rate_per_trip)}
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap text-muted-foreground">
                            {tariff.rate_per_ton ? `${currencySymbol} ${formatCurrency(tariff.rate_per_ton)}` : "-"}
                          </TableCell>
                          <TableCell className="text-center px-1">
                            {renderDiff(tariff.diff_rate_per_ton)}
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap text-muted-foreground/70">
                            {tariff.third_party_rate_per_trip ? `${currencySymbol} ${formatCurrency(tariff.third_party_rate_per_trip)}` : "-"}
                          </TableCell>
                          <TableCell className="text-center px-1">
                            {renderDiff(tariff.diff_third_party_trip)}
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap text-muted-foreground/70">
                            {tariff.third_party_rate_per_ton ? `${currencySymbol} ${formatCurrency(tariff.third_party_rate_per_ton)}` : "-"}
                          </TableCell>
                          <TableCell className="text-center px-1">
                            {renderDiff(tariff.diff_third_party_ton)}
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      ))}
                    </Fragment>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
        
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-muted-foreground">
              Mostrando <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> a{" "}
              <span className="font-medium">
                {Math.min(currentPage * itemsPerPage, filteredGroups.length)}
              </span>{" "}
              de <span className="font-medium">{filteredGroups.length}</span> resultados
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <div className="text-sm font-medium">
                Página {currentPage} de {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
