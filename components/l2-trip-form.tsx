"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Loader2, Plus, AlertTriangle } from "lucide-react"
import { LocationForm } from "@/components/location-form"

interface L2TripFormProps {
  trip?: any
  clients: any[]
  drivers: any[]
  onSuccess: () => void
}

export function L2TripForm({ trip, clients, drivers, onSuccess }: L2TripFormProps) {
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [transportCompanies, setTransportCompanies] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState(trip?.client_id || "")
  const [clientProducts, setClientProducts] = useState<any[]>([])
  const [tariffAlert, setTariffAlert] = useState<any>(null)
  const [showQuickLocationDialog, setShowQuickLocationDialog] = useState(false)
  const [quickLocationType, setQuickLocationType] = useState<"origin" | "destination">("origin")

  const [formData, setFormData] = useState({
    trip_id: trip?.trip_id || trip?._l1Trip?.id || null, // Add trip_id to link with L1 trip
    invoice_number: trip?.invoice_number || "",
    invoice_date: trip?.invoice_date || "",
    payment_date: trip?.payment_date || "",
    client_id: trip?.client_id || "",
    product_id: trip?.product_id || "",
    origin: trip?.origin || "",
    origin_company: trip?.origin_company || "",
    destination: trip?.destination || "",
    destination_company: trip?.destination_company || "",
    tare_origin: trip?.tare_origin || "",
    gross_weight: trip?.gross_weight || "",
    net_origin: trip?.net_origin || "",
    tare_destination: trip?.tare_destination || "",
    gross_destination: trip?.gross_destination || "",
    net_destination: trip?.net_destination || "",
    weight_difference: trip?.weight_difference || "",
    tons_delivered: trip?.tons_delivered || "",
    driver_id: trip?.driver_id || "",
    chasis_patent: trip?.chasis_patent || "",
    semi_patent: trip?.semi_patent || "",
    tariff_rate: trip?.tariff_rate || "",
    trip_amount: trip?.trip_amount || "",
    third_party_transport: trip?.third_party_transport || "",
    third_party_rate: trip?.third_party_rate || "",
    third_party_amount: trip?.third_party_amount || "",
    third_party_invoice: trip?.third_party_invoice || "",
    third_party_payment_date: trip?.third_party_payment_date || "",
    third_party_payment_status: trip?.third_party_payment_status || "IMPAGO",
    client_invoice_passed: trip?.client_invoice_passed || false,
    client_invoice_number: trip?.client_invoice_number || "",
    client_invoice_date: trip?.client_invoice_date || "",
    client_payment_date: trip?.client_payment_date || "",
    client_fca_number: trip?.client_fca_number || "PENDIENTE",
    client_payment_status: trip?.client_payment_status || "PENDIENTE",
    year: trip?.year || new Date().getFullYear(),
    category: trip?.category || "Tercero",
    notes: trip?.notes || "",
  })

  // Load initial data
  useEffect(() => {
    loadLocations()
    loadTransportCompanies()

    if (trip?._shouldLookupTariff && trip?.client_id) {
      setSelectedClient(trip.client_id)
    }
  }, [])

  useEffect(() => {
    if (
      trip?._shouldLookupTariff &&
      formData.client_id &&
      formData.product_id &&
      formData.origin &&
      formData.destination &&
      clientProducts.length > 0
    ) {
      // Add a small delay to ensure all data is loaded
      setTimeout(() => {
        lookupTariff()
      }, 500)
    }
  }, [
    trip?._shouldLookupTariff,
    formData.client_id,
    formData.product_id,
    formData.origin,
    formData.destination,
    clientProducts,
  ])

  // Load products when client changes
  useEffect(() => {
    if (selectedClient) {
      loadClientProducts(selectedClient)
    }
  }, [selectedClient])

  useEffect(() => {
    if (
      formData.client_id &&
      formData.product_id &&
      formData.origin &&
      formData.destination &&
      formData.third_party_transport &&
      !trip?._shouldLookupTariff // Only auto-lookup if not already triggered by promotion
    ) {
      lookupTariff()
    }
  }, [formData.client_id, formData.product_id, formData.origin, formData.destination, formData.third_party_transport])

  const loadLocations = async () => {
    const supabase = createClient()
    const { data, error } = await supabase.from("locations").select("*").eq("active", true).order("name")

    if (error) {
      console.error("Error loading locations:", error)
      return
    }

    setLocations(data || [])
  }

  const loadTransportCompanies = async () => {
    const supabase = createClient()
    const { data, error } = await supabase.from("transport_companies").select("*").eq("active", true).order("name")

    if (error) {
      console.error("Error loading transport companies:", error)
      return
    }

    setTransportCompanies(data || [])
  }

  const loadClientProducts = async (clientId: string) => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("client_products")
      .select("product_id, products(*)")
      .eq("client_id", clientId)

    if (error) {
      console.error("Error loading client products:", error)
      return
    }

    setClientProducts(data?.map((cp) => cp.products) || [])
  }

  const lookupTariff = async () => {
    const supabase = createClient()

    const { data, error } = await supabase.from("l2_tariffs").select("*").eq("active", true)

    if (error) {
      console.error("Error looking up tariff:", error)
      return
    }

    if (data && data.length > 0) {
      const matchingTariffs = data.filter((tariff) => {
        const clientMatch = !tariff.client_id || tariff.client_id === "ALL" || tariff.client_id === formData.client_id
        const productMatch =
          !tariff.product_id || tariff.product_id === "ALL" || tariff.product_id === formData.product_id
        const originMatch = !tariff.origin || tariff.origin === "ALL" || tariff.origin === formData.origin
        const destMatch =
          !tariff.destination || tariff.destination === "ALL" || tariff.destination === formData.destination
        const transportMatch =
          !tariff.transport_company ||
          tariff.transport_company === "ALL" ||
          tariff.transport_company === formData.third_party_transport

        return clientMatch && productMatch && originMatch && destMatch && transportMatch
      })

      if (matchingTariffs.length > 0) {
        // Sort by specificity (more criteria matched = higher priority)
        const sortedTariffs = matchingTariffs.sort((a, b) => {
          const scoreA =
            (a.client_id && a.client_id !== "ALL" ? 1 : 0) +
            (a.product_id && a.product_id !== "ALL" ? 1 : 0) +
            (a.origin && a.origin !== "ALL" ? 1 : 0) +
            (a.destination && a.destination !== "ALL" ? 1 : 0) +
            (a.transport_company && a.transport_company !== "ALL" ? 1 : 0)
          const scoreB =
            (b.client_id && b.client_id !== "ALL" ? 1 : 0) +
            (b.product_id && b.product_id !== "ALL" ? 1 : 0) +
            (b.origin && b.origin !== "ALL" ? 1 : 0) +
            (b.destination && b.destination !== "ALL" ? 1 : 0) +
            (b.transport_company && b.transport_company !== "ALL" ? 1 : 0)
          return scoreB - scoreA
        })

        const bestTariff = sortedTariffs[0]

        // Check if tariff is expired or expiring soon
        if (bestTariff.valid_until) {
          const today = new Date()
          const validUntil = new Date(bestTariff.valid_until)
          const daysUntilExpiry = Math.ceil((validUntil.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

          if (daysUntilExpiry < 0) {
            setTariffAlert({
              type: "expired",
              message: `La tarifa está vencida desde hace ${Math.abs(daysUntilExpiry)} días`,
              tariff: bestTariff,
            })
          } else if (daysUntilExpiry <= 30) {
            setTariffAlert({
              type: "expiring",
              message: `La tarifa vence en ${daysUntilExpiry} días`,
              tariff: bestTariff,
            })
          } else {
            setTariffAlert(null)
          }
        } else {
          setTariffAlert(null)
        }

        // Apply tariff - both own rate and third party rate
        setFormData((prev) => {
          const updates: any = {
            ...prev,
            tariff_rate: bestTariff.rate_per_ton || prev.tariff_rate,
          }
          // Apply third party rate from tariff if available
          if (bestTariff.third_party_rate_per_ton) {
            updates.third_party_rate = bestTariff.third_party_rate_per_ton
          }
          // Apply transport company from tariff if available and not already set
          if (bestTariff.transport_company && bestTariff.transport_company !== "ALL" && !prev.third_party_transport) {
            updates.third_party_transport = bestTariff.transport_company
          }
          return updates
        })

        toast.success("Tarifa encontrada y aplicada automáticamente")
      } else {
        setTariffAlert({
          type: "not_found",
          message: "No se encontró una tarifa para estos criterios. Ingrese manualmente.",
        })
      }
    } else {
      setTariffAlert({
        type: "not_found",
        message: "No se encontró una tarifa para estos criterios. Ingrese manualmente.",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()

    try {
      const { _isPromotion, _shouldLookupTariff, _l1Trip, ...cleanData } = formData as any

      const dateFields = [
        "invoice_date",
        "payment_date",
        "client_invoice_date",
        "client_payment_date",
        "third_party_payment_date",
      ]

      dateFields.forEach((field) => {
        if (cleanData[field] === "" || cleanData[field] === undefined) {
          cleanData[field] = null
        }
      })

      const numericFields = [
        "tare_origin",
        "gross_weight",
        "net_origin",
        "tare_destination",
        "gross_destination",
        "net_destination",
        "weight_difference",
        "tons_delivered",
        "tariff_rate",
        "trip_amount",
        "third_party_rate",
        "third_party_amount",
      ]

      numericFields.forEach((field) => {
        if (cleanData[field] === "" || cleanData[field] === undefined) {
          cleanData[field] = null
        }
      })

      if (trip && !trip._isPromotion) {
        // Update existing L2 trip
        const { error } = await supabase
          .from("l2_trips")
          .update({
            ...cleanData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", trip.id)

        if (error) throw error
        toast.success("Viaje L2 actualizado exitosamente")
      } else {
        // Create new L2 trip (including promotions from L1)
        const { error } = await supabase.from("l2_trips").insert([cleanData])

        if (error) throw error
        toast.success("Viaje L2 creado exitosamente")
      }

      onSuccess()
    } catch (error: any) {
      console.error("Error saving L2 trip:", error)
      toast.error(error.message || "Error al guardar el viaje L2")
    } finally {
      setLoading(false)
    }
  }

  const handleQuickLocationSuccess = () => {
    setShowQuickLocationDialog(false)
    loadLocations()
  }

  // Calculate weights automatically
  useEffect(() => {
    // Calculate Net Origin (Bruto C - Tara C)
    if (formData.gross_weight && formData.tare_origin) {
      const netOrigin = Number.parseFloat(formData.gross_weight) - Number.parseFloat(formData.tare_origin)
      setFormData((prev) => ({
        ...prev,
        net_origin: netOrigin.toFixed(2),
      }))
    }
  }, [formData.gross_weight, formData.tare_origin])

  useEffect(() => {
    // Calculate Net Destination (Bruto D - Tara D)
    if (formData.gross_destination && formData.tare_destination) {
      const netDest = Number.parseFloat(formData.gross_destination) - Number.parseFloat(formData.tare_destination)
      setFormData((prev) => ({
        ...prev,
        net_destination: netDest.toFixed(2),
      }))
    }
  }, [formData.gross_destination, formData.tare_destination])

  useEffect(() => {
    if (formData.net_destination && formData.net_origin) {
      const diff = Number.parseFloat(formData.net_origin) - Number.parseFloat(formData.net_destination)
      setFormData((prev) => ({
        ...prev,
        weight_difference: diff.toFixed(2),
      }))
    }
  }, [formData.net_destination, formData.net_origin])

  useEffect(() => {
    // Auto-fill TN Descargadas with Net Destination converted to tons (kg / 1000)
    if (formData.net_destination) {
      const tons = Number.parseFloat(formData.net_destination) / 1000
      setFormData((prev) => ({
        ...prev,
        tons_delivered: tons.toFixed(3),
      }))
    }
  }, [formData.net_destination])

  useEffect(() => {
    if (formData.tariff_rate && formData.tons_delivered) {
      const tons = Number.parseFloat(formData.tons_delivered)
      const amount = Number.parseFloat(formData.tariff_rate) * tons
      setFormData((prev) => ({
        ...prev,
        trip_amount: amount.toFixed(2),
      }))
    }
  }, [formData.tariff_rate, formData.tons_delivered])

  useEffect(() => {
    if (formData.third_party_rate && formData.tons_delivered) {
      const tons = Number.parseFloat(formData.tons_delivered)
      const amount = Number.parseFloat(formData.third_party_rate) * tons
      setFormData((prev) => ({
        ...prev,
        third_party_amount: amount.toFixed(2),
      }))
    }
  }, [formData.third_party_rate, formData.tons_delivered])

  useEffect(() => {
    if (formData.driver_id) {
      const selectedDriver = drivers.find((d) => d.id === formData.driver_id)
      if (selectedDriver) {
        setFormData((prev) => ({
          ...prev,
          chasis_patent: selectedDriver.chasis?.patent_chasis || "",
          semi_patent: selectedDriver.semi?.patent_semi || "",
        }))
      }
    }
  }, [formData.driver_id, drivers])

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tariff Alert */}
        {tariffAlert && (
          <div
            className={`p-4 rounded-lg flex items-start gap-3 ${
              tariffAlert.type === "expired"
                ? "bg-red-50 text-red-800 border border-red-200"
                : tariffAlert.type === "expiring"
                  ? "bg-yellow-50 text-yellow-800 border border-yellow-200"
                  : "bg-blue-50 text-blue-800 border border-blue-200"
            }`}
          >
            <AlertTriangle className="h-5 w-5 mt-0.5" />
            <div>
              <p className="font-semibold">
                {tariffAlert.type === "expired"
                  ? "Tarifa Vencida"
                  : tariffAlert.type === "expiring"
                    ? "Tarifa Por Vencer"
                    : "Tarifa No Encontrada"}
              </p>
              <p className="text-sm">{tariffAlert.message}</p>
            </div>
          </div>
        )}

        {/* Información General */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Información General</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="invoice_number">Nº RTO</Label>
              <Input
                id="invoice_number"
                value={formData.invoice_number}
                onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="invoice_date">Fecha</Label>
              <Input
                id="invoice_date"
                type="date"
                value={formData.invoice_date}
                onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="year">Año</Label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: Number.parseInt(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="category">Rubro</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tercero">Tercero</SelectItem>
                  <SelectItem value="Propio">Propio</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Cliente y Producto */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Cliente y Producto</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="client_id">Cliente *</Label>
              <Select
                value={formData.client_id}
                onValueChange={(value) => {
                  setFormData({ ...formData, client_id: value })
                  setSelectedClient(value)
                }}
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
            <div>
              <Label htmlFor="product_id">Producto *</Label>
              <Select
                value={formData.product_id}
                onValueChange={(value) => setFormData({ ...formData, product_id: value })}
                disabled={!selectedClient}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar producto" />
                </SelectTrigger>
                <SelectContent>
                  {clientProducts.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Origen y Destino */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Origen y Destino</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="origin">Carga *</Label>
              <div className="flex gap-2">
                <Select
                  value={formData.origin}
                  onValueChange={(value) => setFormData({ ...formData, origin: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar origen" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.name}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setQuickLocationType("origin")
                    setShowQuickLocationDialog(true)
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="origin_company">Empresa Proveedora</Label>
              <Input
                id="origin_company"
                value={formData.origin_company}
                onChange={(e) => setFormData({ ...formData, origin_company: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="destination">Descarga *</Label>
              <div className="flex gap-2">
                <Select
                  value={formData.destination}
                  onValueChange={(value) => setFormData({ ...formData, destination: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.name}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setQuickLocationType("destination")
                    setShowQuickLocationDialog(true)
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="destination_company">Empresa Descarga</Label>
              <Input
                id="destination_company"
                value={formData.destination_company}
                onChange={(e) => setFormData({ ...formData, destination_company: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Pesos */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Pesos</h3>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground border-b pb-1">Carga</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="tare_origin">Tara C (kg)</Label>
                <Input
                  id="tare_origin"
                  type="number"
                  step="0.01"
                  value={formData.tare_origin}
                  onChange={(e) => setFormData({ ...formData, tare_origin: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="gross_weight">Bruto C (kg)</Label>
                <Input
                  id="gross_weight"
                  type="number"
                  step="0.01"
                  value={formData.gross_weight}
                  onChange={(e) => setFormData({ ...formData, gross_weight: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="net_origin">Neto C (kg)</Label>
                <Input
                  id="net_origin"
                  type="number"
                  step="0.01"
                  value={formData.net_origin}
                  readOnly
                  className="bg-muted"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground border-b pb-1">Descarga</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="tare_destination">Tara D (kg)</Label>
                <Input
                  id="tare_destination"
                  type="number"
                  step="0.01"
                  value={formData.tare_destination}
                  onChange={(e) => setFormData({ ...formData, tare_destination: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="gross_destination">Bruto D (kg) *</Label>
                <Input
                  id="gross_destination"
                  type="number"
                  step="0.01"
                  value={formData.gross_destination}
                  onChange={(e) => setFormData({ ...formData, gross_destination: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="net_destination">Neto D (kg)</Label>
                <Input
                  id="net_destination"
                  type="number"
                  step="0.01"
                  value={formData.net_destination}
                  readOnly
                  className="bg-muted"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="weight_difference">Diferencia (kg)</Label>
              <Input
                id="weight_difference"
                type="number"
                step="0.01"
                value={formData.weight_difference}
                readOnly
                className="bg-muted font-semibold"
              />
            </div>
            <div>
              <Label htmlFor="tons_delivered">TN Descargadas</Label>
              <Input
                id="tons_delivered"
                type="number"
                step="0.01"
                value={formData.tons_delivered}
                onChange={(e) => setFormData({ ...formData, tons_delivered: e.target.value })}
                placeholder="Se autocompleta, puede editarse"
              />
            </div>
          </div>
        </div>

        {/* Tarifa */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Tarifa</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="tons_delivered_display">TN Descargadas</Label>
              <Input id="tons_delivered_display" value={formData.tons_delivered} readOnly className="bg-muted" />
            </div>
            <div>
              <Label htmlFor="tariff_rate">Tarifa ($/TN)</Label>
              <Input
                id="tariff_rate"
                type="number"
                step="0.01"
                value={formData.tariff_rate}
                onChange={(e) => setFormData({ ...formData, tariff_rate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="trip_amount">$/Viaje</Label>
              <Input
                id="trip_amount"
                type="number"
                step="0.01"
                value={formData.trip_amount}
                readOnly
                className="bg-muted font-semibold"
              />
            </div>
            <div>
              <Label>Producto</Label>
              <Input
                value={
                  clientProducts.find((p) => p.id === formData.product_id)?.name || "Seleccione cliente y producto"
                }
                readOnly
                className="bg-muted"
              />
            </div>
            <div>
              <Label>Empresa Transporte</Label>
              <Input value={formData.third_party_transport || "Sin asignar"} readOnly className="bg-muted" />
            </div>
          </div>
        </div>

        {/* Chofer y Vehículos */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Chofer y Vehículos</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="driver_id">Chofer *</Label>
              <Select
                value={formData.driver_id}
                onValueChange={(value) => setFormData({ ...formData, driver_id: value })}
                required
              >
                <SelectTrigger>
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
            <div>
              <Label htmlFor="chasis_patent">Patente Chasis</Label>
              <Input id="chasis_patent" value={formData.chasis_patent} readOnly className="bg-muted" />
            </div>
            <div>
              <Label htmlFor="semi_patent">Patente Semi</Label>
              <Input id="semi_patent" value={formData.semi_patent} readOnly className="bg-muted" />
            </div>
          </div>
        </div>

        {/* Cliente y Facturación */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Cliente y Facturación</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="client_invoice_passed">Pasada</Label>
              <Select
                value={formData.client_invoice_passed ? "Si" : "No"}
                onValueChange={(value) => setFormData({ ...formData, client_invoice_passed: value === "Si" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="No">No</SelectItem>
                  <SelectItem value="Si">Si</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="client_invoice_number">Nº de Comprobante</Label>
              <Input
                id="client_invoice_number"
                value={formData.client_invoice_number}
                onChange={(e) => setFormData({ ...formData, client_invoice_number: e.target.value })}
                placeholder="Opcional"
              />
            </div>
            <div>
              <Label htmlFor="client_invoice_date">Fecha de Pasada</Label>
              <Input
                id="client_invoice_date"
                type="date"
                value={formData.client_invoice_date}
                onChange={(e) => setFormData({ ...formData, client_invoice_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="client_payment_date">Fecha de Cobro</Label>
              <Input
                id="client_payment_date"
                type="date"
                value={formData.client_payment_date}
                onChange={(e) => setFormData({ ...formData, client_payment_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="client_fca_number">N° FCA</Label>
              <Input
                id="client_fca_number"
                value={formData.client_fca_number}
                onChange={(e) => setFormData({ ...formData, client_fca_number: e.target.value })}
                placeholder="PENDIENTE"
              />
            </div>
            <div>
              <Label htmlFor="client_payment_status">Estado de Pago</Label>
              <Select
                value={formData.client_payment_status}
                onValueChange={(value) => setFormData({ ...formData, client_payment_status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDIENTE">PENDIENTE</SelectItem>
                  <SelectItem value="PAGADO">PAGADO</SelectItem>
                  <SelectItem value="IMPAGO">IMPAGO</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Transporte Terceros with transport company selector */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Transporte Terceros</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="third_party_transport">Transporte</Label>
              <Select
                value={formData.third_party_transport}
                onValueChange={(value) => setFormData({ ...formData, third_party_transport: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar empresa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin transporte tercero</SelectItem>
                  {transportCompanies.map((company) => (
                    <SelectItem key={company.id} value={company.name}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="third_party_payment_date">Fecha de Comp.</Label>
              <Input
                id="third_party_payment_date"
                type="date"
                value={formData.third_party_payment_date}
                onChange={(e) => setFormData({ ...formData, third_party_payment_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="third_party_payment_status">Estado</Label>
              <Select
                value={formData.third_party_payment_status}
                onValueChange={(value) => setFormData({ ...formData, third_party_payment_status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IMPAGO">IMPAGO</SelectItem>
                  <SelectItem value="PENDIENTE">PENDIENTE</SelectItem>
                  <SelectItem value="PAGADO">PAGADO</SelectItem>
                  <SelectItem value="PARCIAL">PARCIAL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="third_party_rate">Tarifa 3er ($/TN)</Label>
              <Input
                id="third_party_rate"
                type="number"
                step="0.01"
                value={formData.third_party_rate}
                onChange={(e) => setFormData({ ...formData, third_party_rate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="third_party_amount">$/Viaje 3erc</Label>
              <Input
                id="third_party_amount"
                type="number"
                step="0.01"
                value={formData.third_party_amount}
                readOnly
                className="bg-muted"
              />
            </div>
            <div>
              <Label htmlFor="third_party_invoice">Nº Comprobante 3ros</Label>
              <Input
                id="third_party_invoice"
                value={formData.third_party_invoice}
                onChange={(e) => setFormData({ ...formData, third_party_invoice: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Notas */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Notas</h3>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            placeholder="Notas adicionales..."
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {trip ? "Actualizar" : "Crear"} Viaje L2
          </Button>
        </div>
      </form>

      {/* Quick Add Location Dialog */}
      <Dialog open={showQuickLocationDialog} onOpenChange={setShowQuickLocationDialog}>
        <DialogContent className="z-[100]">
          <DialogHeader>
            <DialogTitle>Agregar Ubicación Rápida</DialogTitle>
          </DialogHeader>
          <LocationForm onSuccess={handleQuickLocationSuccess} />
        </DialogContent>
      </Dialog>
    </>
  )
}
