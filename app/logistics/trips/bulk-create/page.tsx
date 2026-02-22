"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronDown, ChevronUp, Loader2, Plus, X } from "lucide-react"

interface TripRow {
  id: string
  date: string
  client_id: string
  product_id: string
  driver_id: string
  loading_location_id: string
  unloading_location_id: string
  line: string
  notes: string
}

export default function BulkTripCreationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showCommonFields, setShowCommonFields] = useState(true)

  // Data
  const [drivers, setDrivers] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [clientProducts, setClientProducts] = useState<Record<string, any[]>>({})

  // Common data
  const [commonData, setCommonData] = useState({
    client_id: "",
    product_id: "",
    driver_id: "",
    loading_location_id: "",
    unloading_location_id: "",
    line: "L1",
  })

  const [useCommon, setUseCommon] = useState({
    client: false,
    product: false,
    driver: false,
    loading: false,
    unloading: false,
    line: false,
  })

  // Trip rows
  const [tripRows, setTripRows] = useState<TripRow[]>([
    {
      id: crypto.randomUUID(),
      date: getLocalDateString(new Date()),
      client_id: "",
      product_id: "",
      driver_id: "",
      loading_location_id: "",
      unloading_location_id: "",
      line: "L1",
      notes: "",
    },
  ])

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (commonData.client_id && useCommon.client) {
      loadClientProducts(commonData.client_id)
      setTripRows((rows) => rows.map((row) => ({ ...row, client_id: commonData.client_id })))
    }
  }, [commonData.client_id, useCommon.client])

  useEffect(() => {
    if (commonData.driver_id && useCommon.driver) {
      setTripRows((rows) => rows.map((row) => ({ ...row, driver_id: commonData.driver_id })))
    }
  }, [commonData.driver_id, useCommon.driver])

  function getLocalDateString(date: Date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  const loadData = async () => {
    try {
      const supabase = createClient()

      const [driversRes, clientsRes, locationsRes] = await Promise.all([
        supabase
          .from("drivers")
          .select(
            `
          id, 
          name, 
          cuit, 
          chasis:chasis_id (id, patent_chasis, vehicle_type),
          semi:semi_id (id, patent_chasis, vehicle_type)
        `,
          )
          .eq("active", true)
          .order("name"),
        supabase.from("clients").select("id, company").order("company"),
        supabase.from("locations").select("*").order("name"),
      ])

      console.log("[v0] Loaded drivers:", driversRes.data)
      console.log("[v0] Loaded clients:", clientsRes.data)
      console.log("[v0] Loaded locations:", locationsRes.data)

      setDrivers(driversRes.data || [])
      setClients(clientsRes.data || [])
      setLocations(locationsRes.data || [])
    } catch (error) {
      console.error("Error loading data:", error)
      alert("Error al cargar datos")
    } finally {
      setLoading(false)
    }
  }

  const loadClientProducts = async (clientId: string) => {
    try {
      console.log("[v0] Loading products for client:", clientId)
      const supabase = createClient()

      const { data, error } = await supabase
        .from("client_products")
        .select(`
          product_id,
          products (
            id,
            name,
            description,
            active
          )
        `)
        .eq("client_id", clientId)

      if (error) {
        console.error("[v0] Error loading products:", error.message)
        return
      }

      // Extract products from the join result
      const productsData = data?.map((cp: any) => cp.products).filter((p: any) => p && p.active) || []

      console.log("[v0] Loaded products:", productsData)
      setProducts(productsData)
      setClientProducts((prev) => ({ ...prev, [clientId]: productsData }))
    } catch (error) {
      console.error("Error loading products:", error)
    }
  }

  const addRow = () => {
    setTripRows([
      ...tripRows,
      {
        id: crypto.randomUUID(),
        date: getLocalDateString(new Date()),
        client_id: useCommon.client ? commonData.client_id : "",
        product_id: useCommon.product ? commonData.product_id : "",
        driver_id: useCommon.driver ? commonData.driver_id : "",
        loading_location_id: useCommon.loading ? commonData.loading_location_id : "",
        unloading_location_id: useCommon.unloading ? commonData.unloading_location_id : "",
        line: useCommon.line ? commonData.line : "L1",
        notes: "",
      },
    ])
  }

  const removeRow = (id: string) => {
    if (tripRows.length > 1) {
      setTripRows(tripRows.filter((row) => row.id !== id))
    }
  }

  const updateRow = (id: string, field: keyof TripRow, value: string) => {
    console.log("[v0] Updating row:", id, field, value)
    setTripRows(tripRows.map((row) => (row.id === id ? { ...row, [field]: value } : row)))

    if (field === "client_id" && value) {
      loadClientProducts(value)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const supabase = createClient()

      const invalidRows = tripRows.filter(
        (row) =>
          !row.date ||
          !row.client_id ||
          !row.product_id ||
          !row.driver_id ||
          !row.loading_location_id ||
          !row.unloading_location_id,
      )

      if (invalidRows.length > 0) {
        alert(`Por favor completa todos los campos obligatorios en todas las filas`)
        setSaving(false)
        return
      }

      const tripsToInsert = await Promise.all(
        tripRows.map(async (row) => {
          const client = clients.find((c) => c.id === row.client_id)
          const { data: productData } = await supabase.from("products").select("name").eq("id", row.product_id).single()
          const { data: loadingLoc } = await supabase
            .from("locations")
            .select("name")
            .eq("id", row.loading_location_id)
            .single()
          const { data: unloadingLoc } = await supabase
            .from("locations")
            .select("name")
            .eq("id", row.unloading_location_id)
            .single()

          return {
            date: row.date,
            client_name: client?.company || "",
            product: productData?.name || "",
            driver_id: row.driver_id,
            loading_location: loadingLoc?.name || "",
            unloading_location: unloadingLoc?.name || "",
            line: row.line,
            status: "pendiente",
            notes: row.notes || null,
          }
        }),
      )

      const { error } = await supabase.from("trips").insert(tripsToInsert)

      if (error) throw error

      alert(`${tripRows.length} viaje(s) creado(s) exitosamente`)
      router.push("/logistics/trips")
    } catch (error) {
      console.error("Error creating trips:", error)
      alert("Error al crear los viajes")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/logistics/trips">
              <Button variant="ghost" size="icon">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </Button>
            </Link>
            <div className="w-12 h-12 rounded-full bg-[#0038ae] flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Crear Múltiples Viajes</h1>
              <p className="text-sm text-muted-foreground">Carga varios viajes de forma rápida y eficiente</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => router.push("/logistics/trips")} disabled={saving}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving || tripRows.length === 0}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>Guardar {tripRows.length} Viajes</>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6 space-y-6">
        {/* Common Fields Section */}
        <Card>
          <CardHeader>
            <button
              onClick={() => setShowCommonFields(!showCommonFields)}
              className="flex items-center justify-between w-full"
            >
              <div>
                <CardTitle>Datos Comunes (Opcional)</CardTitle>
                <CardDescription>Define valores que se aplicarán a todos los viajes</CardDescription>
              </div>
              {showCommonFields ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </CardHeader>

          {showCommonFields && (
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="use-common-client"
                    checked={useCommon.client}
                    onCheckedChange={(checked) => setUseCommon({ ...useCommon, client: !!checked })}
                    className="mt-2"
                  />
                  <div className="flex-1">
                    <Label htmlFor="use-common-client" className="cursor-pointer">
                      Cliente
                    </Label>
                    <Select
                      value={commonData.client_id}
                      onValueChange={(v) => {
                        setCommonData({ ...commonData, client_id: v })
                      }}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Seleccionar cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.company}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="use-common-product"
                    checked={useCommon.product}
                    onCheckedChange={(checked) => setUseCommon({ ...useCommon, product: !!checked })}
                    className="mt-2"
                  />
                  <div className="flex-1">
                    <Label htmlFor="use-common-product" className="cursor-pointer">
                      Producto
                    </Label>
                    <Select
                      value={commonData.product_id}
                      onValueChange={(v) => setCommonData({ ...commonData, product_id: v })}
                      disabled={!commonData.client_id}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Seleccionar producto" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="use-common-driver"
                    checked={useCommon.driver}
                    onCheckedChange={(checked) => setUseCommon({ ...useCommon, driver: !!checked })}
                    className="mt-2"
                  />
                  <div className="flex-1">
                    <Label htmlFor="use-common-driver" className="cursor-pointer">
                      Chofer
                    </Label>
                    <Select
                      value={commonData.driver_id}
                      onValueChange={(v) => setCommonData({ ...commonData, driver_id: v })}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Seleccionar chofer" />
                      </SelectTrigger>
                      <SelectContent>
                        {drivers.map((driver) => (
                          <SelectItem key={driver.id} value={driver.id}>
                            {driver.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="use-common-loading"
                    checked={useCommon.loading}
                    onCheckedChange={(checked) => setUseCommon({ ...useCommon, loading: !!checked })}
                    className="mt-2"
                  />
                  <div className="flex-1">
                    <Label htmlFor="use-common-loading" className="cursor-pointer">
                      Origen
                    </Label>
                    <Select
                      value={commonData.loading_location_id}
                      onValueChange={(v) => setCommonData({ ...commonData, loading_location_id: v })}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Seleccionar origen" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((loc) => (
                          <SelectItem key={loc.id} value={loc.id}>
                            {loc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="use-common-unloading"
                    checked={useCommon.unloading}
                    onCheckedChange={(checked) => setUseCommon({ ...useCommon, unloading: !!checked })}
                    className="mt-2"
                  />
                  <div className="flex-1">
                    <Label htmlFor="use-common-unloading" className="cursor-pointer">
                      Destino
                    </Label>
                    <Select
                      value={commonData.unloading_location_id}
                      onValueChange={(v) => setCommonData({ ...commonData, unloading_location_id: v })}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Seleccionar destino" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((loc) => (
                          <SelectItem key={loc.id} value={loc.id}>
                            {loc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="use-common-line"
                    checked={useCommon.line}
                    onCheckedChange={(checked) => setUseCommon({ ...useCommon, line: !!checked })}
                    className="mt-2"
                  />
                  <div className="flex-1">
                    <Label htmlFor="use-common-line" className="cursor-pointer">
                      Línea
                    </Label>
                    <Select value={commonData.line} onValueChange={(v) => setCommonData({ ...commonData, line: v })}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="L1">L1</SelectItem>
                        <SelectItem value="L2">L2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Trips Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Viajes ({tripRows.length})</CardTitle>
                <CardDescription>Agrega y edita los viajes que deseas crear</CardDescription>
              </div>
              <Button onClick={addRow} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Agregar Viaje
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-3 text-left text-sm font-medium">#</th>
                    <th className="p-3 text-left text-sm font-medium min-w-[150px]">Fecha*</th>
                    <th className="p-3 text-left text-sm font-medium min-w-[200px]">Cliente*</th>
                    <th className="p-3 text-left text-sm font-medium min-w-[200px]">Producto*</th>
                    <th className="p-3 text-left text-sm font-medium min-w-[200px]">Chofer*</th>
                    <th className="p-3 text-left text-sm font-medium min-w-[200px]">Origen*</th>
                    <th className="p-3 text-left text-sm font-medium min-w-[200px]">Destino*</th>
                    <th className="p-3 text-left text-sm font-medium min-w-[120px]">Línea*</th>
                    <th className="p-3 text-left text-sm font-medium min-w-[250px]">Notas</th>
                    <th className="p-3 text-left text-sm font-medium w-[60px]"></th>
                  </tr>
                </thead>
                <tbody>
                  {tripRows.map((row, index) => (
                    <tr key={row.id} className="border-t hover:bg-muted/50">
                      <td className="p-3 text-sm font-medium">{index + 1}</td>
                      <td className="p-3">
                        <Input
                          type="date"
                          value={row.date}
                          onChange={(e) => updateRow(row.id, "date", e.target.value)}
                          className="w-full"
                        />
                      </td>
                      <td className="p-3">
                        <Select
                          value={row.client_id}
                          onValueChange={(v) => {
                            updateRow(row.id, "client_id", v)
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Cliente" />
                          </SelectTrigger>
                          <SelectContent>
                            {clients.map((client) => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.company}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-3">
                        <Select
                          value={row.product_id}
                          onValueChange={(v) => updateRow(row.id, "product_id", v)}
                          disabled={!row.client_id}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Seleccionar producto" />
                          </SelectTrigger>
                          <SelectContent>
                            {(row.client_id ? clientProducts[row.client_id] || products : products).map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-3">
                        <Select value={row.driver_id} onValueChange={(v) => updateRow(row.id, "driver_id", v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Chofer" />
                          </SelectTrigger>
                          <SelectContent>
                            {drivers.map((driver) => (
                              <SelectItem key={driver.id} value={driver.id}>
                                {driver.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-3">
                        <Select
                          value={row.loading_location_id}
                          onValueChange={(v) => updateRow(row.id, "loading_location_id", v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Origen" />
                          </SelectTrigger>
                          <SelectContent>
                            {locations.map((loc) => (
                              <SelectItem key={loc.id} value={loc.id}>
                                {loc.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-3">
                        <Select
                          value={row.unloading_location_id}
                          onValueChange={(v) => updateRow(row.id, "unloading_location_id", v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Destino" />
                          </SelectTrigger>
                          <SelectContent>
                            {locations.map((loc) => (
                              <SelectItem key={loc.id} value={loc.id}>
                                {loc.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-3">
                        <Select value={row.line} onValueChange={(v) => updateRow(row.id, "line", v)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="L1">L1</SelectItem>
                            <SelectItem value="L2">L2</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-3">
                        <Input
                          value={row.notes}
                          onChange={(e) => updateRow(row.id, "notes", e.target.value)}
                          placeholder="Particularidades..."
                        />
                      </td>
                      <td className="p-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRow(row.id)}
                          disabled={tripRows.length === 1}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
