"use client"

import { DialogFooter } from "@/components/ui/dialog"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { X, Plus, Loader2, ChevronDown, ChevronUp } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

interface BulkTripFormProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  drivers: any[]
  clients: any[]
  onClientChange: (clientId: string) => Promise<any[]>
}

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

export function BulkTripForm({ open, onClose, onSuccess, drivers, clients, onClientChange }: BulkTripFormProps) {
  const [showCommonFields, setShowCommonFields] = useState(true)
  const [saving, setSaving] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])

  // Datos comunes opcionales
  const [commonData, setCommonData] = useState({
    client_id: "",
    product_id: "",
    loading_location_id: "",
    unloading_location_id: "",
    line: "L1",
  })

  const [useCommon, setUseCommon] = useState({
    client: false,
    product: false,
    loading: false,
    unloading: false,
    line: false,
  })

  // Filas de viajes
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
    if (open) {
      loadLocations()
    }
  }, [open])

  useEffect(() => {
    if (commonData.client_id) {
      loadClientProducts(commonData.client_id)
    }
  }, [commonData.client_id])

  const loadLocations = async () => {
    const supabase = createClient()
    const { data } = await supabase.from("locations").select("*").order("name")
    setLocations(data || [])
  }

  const loadClientProducts = async (clientId: string) => {
    const productsData = await onClientChange(clientId)
    setProducts(productsData)
  }

  function getLocalDateString(date: Date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  const addRow = () => {
    setTripRows([
      ...tripRows,
      {
        id: crypto.randomUUID(),
        date: getLocalDateString(new Date()),
        client_id: useCommon.client ? commonData.client_id : "",
        product_id: useCommon.product ? commonData.product_id : "",
        driver_id: "",
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
    setTripRows(tripRows.map((row) => (row.id === id ? { ...row, [field]: value } : row)))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const supabase = createClient()

      // Validar que todas las filas tengan los datos requeridos
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

      // Preparar los viajes para insertar
      const tripsToInsert = await Promise.all(
        tripRows.map(async (row) => {
          // Obtener datos del cliente
          const client = clients.find((c) => c.id === row.client_id)

          // Obtener datos del producto
          const { data: productData } = await supabase.from("products").select("name").eq("id", row.product_id).single()

          // Obtener datos de ubicaciones
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
            status: "pending",
            notes: row.notes || null,
          }
        }),
      )

      const { error } = await supabase.from("trips").insert(tripsToInsert)

      if (error) throw error

      alert(`${tripRows.length} viaje(s) creado(s) exitosamente`)
      onSuccess()
      onClose()

      // Reset form
      setTripRows([
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
    } catch (error) {
      console.error("Error creating trips:", error)
      alert("Error al crear los viajes")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Múltiples Viajes</DialogTitle>
          <DialogDescription>
            Agrega varios viajes a la vez. Opcionalmente, define datos comunes para aplicar a todos los viajes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Sección de Datos Comunes */}
          <div className="border rounded-lg p-4">
            <button
              onClick={() => setShowCommonFields(!showCommonFields)}
              className="flex items-center justify-between w-full mb-4"
            >
              <h3 className="font-semibold text-lg">Datos Comunes (Opcional)</h3>
              {showCommonFields ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {showCommonFields && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <Checkbox
                    checked={useCommon.client}
                    onCheckedChange={(checked) => setUseCommon({ ...useCommon, client: !!checked })}
                  />
                  <div className="flex-1">
                    <Label>Cliente</Label>
                    <Select
                      value={commonData.client_id}
                      onValueChange={(v) => setCommonData({ ...commonData, client_id: v })}
                    >
                      <SelectTrigger>
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

                <div className="flex items-start gap-2">
                  <Checkbox
                    checked={useCommon.product}
                    onCheckedChange={(checked) => setUseCommon({ ...useCommon, product: !!checked })}
                  />
                  <div className="flex-1">
                    <Label>Producto</Label>
                    <Select
                      value={commonData.product_id}
                      onValueChange={(v) => setCommonData({ ...commonData, product_id: v })}
                    >
                      <SelectTrigger>
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

                <div className="flex items-start gap-2">
                  <Checkbox
                    checked={useCommon.loading}
                    onCheckedChange={(checked) => setUseCommon({ ...useCommon, loading: !!checked })}
                  />
                  <div className="flex-1">
                    <Label>Origen</Label>
                    <Select
                      value={commonData.loading_location_id}
                      onValueChange={(v) => setCommonData({ ...commonData, loading_location_id: v })}
                    >
                      <SelectTrigger>
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

                <div className="flex items-start gap-2">
                  <Checkbox
                    checked={useCommon.unloading}
                    onCheckedChange={(checked) => setUseCommon({ ...useCommon, unloading: !!checked })}
                  />
                  <div className="flex-1">
                    <Label>Destino</Label>
                    <Select
                      value={commonData.unloading_location_id}
                      onValueChange={(v) => setCommonData({ ...commonData, unloading_location_id: v })}
                    >
                      <SelectTrigger>
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

                <div className="flex items-start gap-2">
                  <Checkbox
                    checked={useCommon.line}
                    onCheckedChange={(checked) => setUseCommon({ ...useCommon, line: !!checked })}
                  />
                  <div className="flex-1">
                    <Label>Línea</Label>
                    <Select value={commonData.line} onValueChange={(v) => setCommonData({ ...commonData, line: v })}>
                      <SelectTrigger>
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
            )}
          </div>

          {/* Tabla de Viajes */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Viajes ({tripRows.length})</h3>
              <Button onClick={addRow} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Agregar Viaje
              </Button>
            </div>

            <div className="border rounded-lg overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 text-left text-sm font-medium">#</th>
                    <th className="p-2 text-left text-sm font-medium min-w-[140px]">Fecha*</th>
                    <th className="p-2 text-left text-sm font-medium min-w-[180px]">Cliente*</th>
                    <th className="p-2 text-left text-sm font-medium min-w-[180px]">Producto*</th>
                    <th className="p-2 text-left text-sm font-medium min-w-[180px]">Chofer*</th>
                    <th className="p-2 text-left text-sm font-medium min-w-[180px]">Origen*</th>
                    <th className="p-2 text-left text-sm font-medium min-w-[180px]">Destino*</th>
                    <th className="p-2 text-left text-sm font-medium min-w-[100px]">Línea*</th>
                    <th className="p-2 text-left text-sm font-medium min-w-[200px]">Notas</th>
                    <th className="p-2 text-left text-sm font-medium w-[50px]"></th>
                  </tr>
                </thead>
                <tbody>
                  {tripRows.map((row, index) => (
                    <tr key={row.id} className="border-t">
                      <td className="p-2 text-sm">{index + 1}</td>
                      <td className="p-2">
                        <Input
                          type="date"
                          value={row.date}
                          onChange={(e) => updateRow(row.id, "date", e.target.value)}
                          className="w-full"
                        />
                      </td>
                      <td className="p-2">
                        <Select
                          value={row.client_id}
                          onValueChange={(v) => {
                            updateRow(row.id, "client_id", v)
                            onClientChange(v).then((products) => setProducts(products))
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
                      <td className="p-2">
                        <Select value={row.product_id} onValueChange={(v) => updateRow(row.id, "product_id", v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Producto" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2">
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
                      <td className="p-2">
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
                      <td className="p-2">
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
                      <td className="p-2">
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
                      <td className="p-2">
                        <Input
                          value={row.notes}
                          onChange={(e) => updateRow(row.id, "notes", e.target.value)}
                          placeholder="Notas..."
                        />
                      </td>
                      <td className="p-2">
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
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              `Guardar ${tripRows.length} Viaje(s)`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
