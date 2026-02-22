"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface FuelRecord {
  id: string
  liters: number
  cost: number
  date: string
  kilometers: number | null
  station: string | null
  created_at: string
  driver_name: string | null
  vehicle_patent: string | null
  establishment: string | null
  province: string | null
  locality: string | null
  product_type: string | null
  odometer: number | null
  price_per_liter: number | null
  receipt_number: string | null
  invoice_number: string | null
  address: string | null
}

export function FuelRecordListFiltered({ fuelRecords }: { fuelRecords: FuelRecord[] }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"table" | "cards">("table")

  // Filter states
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [selectedDriver, setSelectedDriver] = useState("all")
  const [selectedVehicle, setSelectedVehicle] = useState("all")
  const [selectedProvince, setSelectedProvince] = useState("all")
  const [selectedLocality, setSelectedLocality] = useState("all")
  const [selectedProduct, setSelectedProduct] = useState("all")
  const [selectedEstablishment, setSelectedEstablishment] = useState("all")
  const [searchText, setSearchText] = useState("")

  // Extract unique values for filters
  const uniqueDrivers = useMemo(
    () =>
      Array.from(new Set(fuelRecords.map((r) => r.driver_name).filter(Boolean)))
        .sort()
        .filter((name) => name && name.toLowerCase().includes("cronos")),
    [fuelRecords],
  )

  const uniqueVehicles = useMemo(
    () => Array.from(new Set(fuelRecords.map((r) => r.vehicle_patent).filter(Boolean))).sort(),
    [fuelRecords],
  )

  const uniqueProvinces = useMemo(
    () => Array.from(new Set(fuelRecords.map((r) => r.province).filter(Boolean))).sort(),
    [fuelRecords],
  )

  const uniqueLocalities = useMemo(
    () => Array.from(new Set(fuelRecords.map((r) => r.locality).filter(Boolean))).sort(),
    [fuelRecords],
  )

  const uniqueProducts = useMemo(
    () => Array.from(new Set(fuelRecords.map((r) => r.product_type).filter(Boolean))).sort(),
    [fuelRecords],
  )

  const uniqueEstablishments = useMemo(
    () => Array.from(new Set(fuelRecords.map((r) => r.establishment).filter(Boolean))).sort(),
    [fuelRecords],
  )

  // Filtered records
  const filteredRecords = useMemo(() => {
    return fuelRecords.filter((record) => {
      const recordDate = new Date(record.date)
      const matchesDateFrom = !dateFrom || recordDate >= new Date(dateFrom)
      const matchesDateTo = !dateTo || recordDate <= new Date(dateTo)
      const matchesDriver = selectedDriver === "all" || record.driver_name === selectedDriver
      const matchesVehicle = selectedVehicle === "all" || record.vehicle_patent === selectedVehicle
      const matchesProvince = selectedProvince === "all" || record.province === selectedProvince
      const matchesLocality = selectedLocality === "all" || record.locality === selectedLocality
      const matchesProduct = selectedProduct === "all" || record.product_type === selectedProduct
      const matchesEstablishment = selectedEstablishment === "all" || record.establishment === selectedEstablishment
      const matchesSearch =
        !searchText ||
        record.driver_name?.toLowerCase().includes(searchText.toLowerCase()) ||
        record.vehicle_patent?.toLowerCase().includes(searchText.toLowerCase()) ||
        record.establishment?.toLowerCase().includes(searchText.toLowerCase()) ||
        record.receipt_number?.toLowerCase().includes(searchText.toLowerCase()) ||
        record.invoice_number?.toLowerCase().includes(searchText.toLowerCase())

      return (
        matchesDateFrom &&
        matchesDateTo &&
        matchesDriver &&
        matchesVehicle &&
        matchesProvince &&
        matchesLocality &&
        matchesProduct &&
        matchesEstablishment &&
        matchesSearch
      )
    })
  }, [
    fuelRecords,
    dateFrom,
    dateTo,
    selectedDriver,
    selectedVehicle,
    selectedProvince,
    selectedLocality,
    selectedProduct,
    selectedEstablishment,
    searchText,
  ])

  // Statistics
  const stats = useMemo(() => {
    const totalRecords = filteredRecords.length
    const totalCost = filteredRecords.reduce((sum, r) => sum + r.cost, 0)
    const totalLiters = filteredRecords.reduce((sum, r) => sum + r.liters, 0)
    const avgPricePerLiter = totalLiters > 0 ? totalCost / totalLiters : 0

    return {
      totalRecords,
      totalCost,
      totalLiters,
      avgPricePerLiter,
    }
  }, [filteredRecords])

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este registro?")) return

    setDeleting(id)
    try {
      const supabase = createClient()
      const { error } = await supabase.from("fuel_records").delete().eq("id", id)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error("Error:", error)
      alert("Error al eliminar registro")
    } finally {
      setDeleting(null)
    }
  }

  const clearFilters = () => {
    setDateFrom("")
    setDateTo("")
    setSelectedDriver("all")
    setSelectedVehicle("all")
    setSelectedProvince("all")
    setSelectedLocality("all")
    setSelectedProduct("all")
    setSelectedEstablishment("all")
    setSearchText("")
  }

  const hasActiveFilters =
    dateFrom ||
    dateTo ||
    selectedDriver !== "all" ||
    selectedVehicle !== "all" ||
    selectedProvince !== "all" ||
    selectedLocality !== "all" ||
    selectedProduct !== "all" ||
    selectedEstablishment !== "all" ||
    searchText

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Filtros</CardTitle>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Date Range */}
            <div className="space-y-2">
              <Label>Fecha Desde</Label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Fecha Hasta</Label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>

            {/* Driver Filter */}
            <div className="space-y-2">
              <Label>Conductor</Label>
              <Select value={selectedDriver} onValueChange={setSelectedDriver}>
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

            {/* Vehicle Filter */}
            <div className="space-y-2">
              <Label>Vehículo (Patente)</Label>
              <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {uniqueVehicles.map((vehicle) => (
                    <SelectItem key={vehicle} value={vehicle}>
                      {vehicle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Product Type Filter */}
            <div className="space-y-2">
              <Label>Tipo de Producto</Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
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

            {/* Establishment Filter */}
            <div className="space-y-2">
              <Label>Establecimiento</Label>
              <Select value={selectedEstablishment} onValueChange={setSelectedEstablishment}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {uniqueEstablishments.map((establishment) => (
                    <SelectItem key={establishment} value={establishment}>
                      {establishment}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Province Filter */}
            <div className="space-y-2">
              <Label>Provincia</Label>
              <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {uniqueProvinces.map((province) => (
                    <SelectItem key={province} value={province}>
                      {province}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Locality Filter */}
            <div className="space-y-2">
              <Label>Localidad</Label>
              <Select value={selectedLocality} onValueChange={setSelectedLocality}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {uniqueLocalities.map((locality) => (
                    <SelectItem key={locality} value={locality}>
                      {locality}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search Input */}
            <div className="space-y-2 md:col-span-2">
              <Label>Buscar</Label>
              <Input
                placeholder="Buscar por conductor, patente, establecimiento, remito o factura..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Toggle and Statistics */}
      <div className="flex items-center justify-end mb-4">
        <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
          <Button
            variant={viewMode === "table" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("table")}
            className="h-8"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            Tabla
          </Button>
          <Button
            variant={viewMode === "cards" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("cards")}
            className="h-8"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              />
            </svg>
            Cards
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Registros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRecords}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gasto Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalCost.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Litros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLiters.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Precio Promedio/L</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.avgPricePerLiter.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Records List */}
      {filteredRecords.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center py-12 text-muted-foreground">
              {fuelRecords.length === 0 ? "No hay registros de combustible" : "No se encontraron registros con los filtros aplicados"}
            </p>
          </CardContent>
        </Card>
      ) : viewMode === "table" ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Conductor</TableHead>
                    <TableHead>Vehículo</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Litros</TableHead>
                    <TableHead className="text-right">Precio/L</TableHead>
                    <TableHead className="text-right">Costo</TableHead>
                    <TableHead>Establecimiento</TableHead>
                    <TableHead>Localidad</TableHead>
                    <TableHead>Provincia</TableHead>
                    <TableHead className="text-right">Odómetro</TableHead>
                    <TableHead>Remito</TableHead>
                    <TableHead>Factura</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="whitespace-nowrap">
                        {new Date(record.date).toLocaleDateString("es-AR")}
                      </TableCell>
                      <TableCell>{record.driver_name || "-"}</TableCell>
                      <TableCell className="font-mono">{record.vehicle_patent || "-"}</TableCell>
                      <TableCell>
                        {record.product_type ? (
                          <Badge variant="outline" className="whitespace-nowrap">
                            {record.product_type}
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-right">{record.liters.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        ${(record.price_per_liter || record.cost / record.liters).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${record.cost.toLocaleString("es-AR")}
                      </TableCell>
                      <TableCell>{record.establishment || "-"}</TableCell>
                      <TableCell>{record.locality || "-"}</TableCell>
                      <TableCell>{record.province || "-"}</TableCell>
                      <TableCell className="text-right">
                        {record.odometer ? `${record.odometer.toLocaleString()} km` : "-"}
                      </TableCell>
                      <TableCell>{record.receipt_number || "-"}</TableCell>
                      <TableCell>{record.invoice_number || "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(record.id)}
                          disabled={deleting === record.id}
                          className="text-destructive hover:text-destructive"
                        >
                          {deleting === record.id ? "..." : "Eliminar"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRecords.map((record) => (
            <Card key={record.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <span>{record.liters} litros</span>
                      {record.product_type && (
                        <Badge variant="outline" className="font-normal">
                          {record.product_type}
                        </Badge>
                      )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(record.date).toLocaleDateString("es-AR")}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-base">
                    ${record.cost.toLocaleString("es-AR")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  {record.driver_name && (
                    <p className="text-muted-foreground">
                      Conductor: <span className="font-medium text-foreground">{record.driver_name}</span>
                    </p>
                  )}
                  {record.vehicle_patent && (
                    <p className="text-muted-foreground">
                      Vehículo: <span className="font-medium text-foreground">{record.vehicle_patent}</span>
                    </p>
                  )}
                  {record.establishment && (
                    <p className="text-muted-foreground">
                      Establecimiento: <span className="font-medium text-foreground">{record.establishment}</span>
                    </p>
                  )}
                  {(record.locality || record.province) && (
                    <p className="text-muted-foreground">
                      Ubicación:{" "}
                      <span className="font-medium text-foreground">
                        {[record.locality, record.province].filter(Boolean).join(", ")}
                      </span>
                    </p>
                  )}
                  <p className="text-muted-foreground">
                    Precio/L: <span className="font-medium text-foreground">${(record.price_per_liter || record.cost / record.liters).toFixed(2)}</span>
                  </p>
                  {record.odometer && (
                    <p className="text-muted-foreground">
                      Odómetro: <span className="font-medium text-foreground">{record.odometer.toLocaleString()} km</span>
                    </p>
                  )}
                  {record.receipt_number && (
                    <p className="text-muted-foreground">
                      Remito: <span className="font-medium text-foreground">{record.receipt_number}</span>
                    </p>
                  )}
                  {record.invoice_number && (
                    <p className="text-muted-foreground">
                      Factura: <span className="font-medium text-foreground">{record.invoice_number}</span>
                    </p>
                  )}
                </div>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(record.id)}
                  disabled={deleting === record.id}
                >
                  {deleting === record.id ? "Eliminando..." : "Eliminar"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default FuelRecordListFiltered
