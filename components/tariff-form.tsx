"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface TariffFormProps {
  tariff?: any
  clients: any[]
  products: any[]
  locations: any[]
  transportCompanies: any[]
  onSuccess: () => void
}

export function TariffForm({ tariff, clients, products, locations, transportCompanies, onSuccess }: TariffFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    client_id: tariff?.client_id || "all",
    product_id: tariff?.product_id || "all",
    origin: tariff?.origin || "all",
    destination: tariff?.destination || "all",
    transport_company: tariff?.transport_company || "all",
    kilometers: tariff?.kilometers || "",
    rate_per_trip: tariff?.rate_per_trip || "",
    rate_per_ton: tariff?.rate_per_ton || "",
    third_party_rate_per_trip: tariff?.third_party_rate_per_trip || "",
    third_party_rate_per_ton: tariff?.third_party_rate_per_ton || "",
    currency: tariff?.currency || "ARS",
    valid_from: tariff?.valid_from || "",
    valid_until: tariff?.valid_until || "",
    observations: tariff?.observations || "",
    active: tariff?.active !== undefined ? tariff.active : true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()

    try {
      // Validación: debe tener al menos una tarifa
      if (!formData.rate_per_trip && !formData.rate_per_ton) {
        toast.error("Debe especificar al menos una tarifa (por viaje o por tonelada)")
        setLoading(false)
        return
      }

      const dataToSave = {
        client_id: formData.client_id === "all" ? null : formData.client_id,
        product_id: formData.product_id === "all" ? null : formData.product_id,
        origin: formData.origin === "all" ? "ALL" : formData.origin,
        destination: formData.destination === "all" ? "ALL" : formData.destination,
        transport_company: formData.transport_company === "all" ? "ALL" : formData.transport_company,
        kilometers: formData.kilometers ? Number.parseFloat(formData.kilometers) : null,
        rate_per_trip: formData.rate_per_trip ? Number.parseFloat(formData.rate_per_trip) : null,
        rate_per_ton: formData.rate_per_ton ? Number.parseFloat(formData.rate_per_ton) : null,
        third_party_rate_per_trip: formData.third_party_rate_per_trip ? Number.parseFloat(formData.third_party_rate_per_trip) : null,
        third_party_rate_per_ton: formData.third_party_rate_per_ton ? Number.parseFloat(formData.third_party_rate_per_ton) : null,
        currency: formData.currency,
        valid_from: formData.valid_from || null,
        valid_until: formData.valid_until || null,
        observations: formData.observations || null,
        active: formData.active,
      }

      if (tariff) {
        const { error } = await supabase
          .from("l2_tariffs")
          .update({ ...dataToSave, updated_at: new Date().toISOString() })
          .eq("id", tariff.id)

        if (error) throw error
        toast.success("Tarifa actualizada exitosamente")
      } else {
        const { error } = await supabase.from("l2_tariffs").insert([dataToSave])

        if (error) throw error
        toast.success("Tarifa creada exitosamente")
      }

      onSuccess()
    } catch (error: any) {
      console.error("Error saving tariff:", error)
      toast.error(error.message || "Error al guardar la tarifa")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground">
          Seleccione los criterios de aplicación (dejar en blanco para "Todos")
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="client_id">Cliente</Label>
            <Select
              value={formData.client_id}
              onValueChange={(value) => setFormData({ ...formData, client_id: value })}
            >
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
          </div>

          <div>
            <Label htmlFor="product_id">Producto</Label>
            <Select
              value={formData.product_id}
              onValueChange={(value) => setFormData({ ...formData, product_id: value })}
            >
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
          </div>

          <div>
            <Label htmlFor="origin">Origen</Label>
            <Select value={formData.origin} onValueChange={(value) => setFormData({ ...formData, origin: value })}>
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
          </div>

          <div>
            <Label htmlFor="destination">Destino</Label>
            <Select
              value={formData.destination}
              onValueChange={(value) => setFormData({ ...formData, destination: value })}
            >
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

          <div>
            <Label htmlFor="transport_company">Empresa de Transporte</Label>
            <Select
              value={formData.transport_company}
              onValueChange={(value) => setFormData({ ...formData, transport_company: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas las empresas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las empresas</SelectItem>
                {transportCompanies.map((company) => (
                  <SelectItem key={company.id} value={company.name}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="kilometers">Kilómetros</Label>
            <Input
              id="kilometers"
              type="number"
              step="0.1"
              value={formData.kilometers}
              onChange={(e) => setFormData({ ...formData, kilometers: e.target.value })}
              placeholder="Ej: 350"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground">Moneda</h3>
        <div className="w-full md:w-1/3">
          <Select
            value={formData.currency}
            onValueChange={(value) => setFormData({ ...formData, currency: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar moneda" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ARS">Peso Argentino (ARS)</SelectItem>
              <SelectItem value="USD">Dolar Estadounidense (USD)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground">Tarifas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="rate_per_trip">Tarifa por Viaje ({formData.currency === "USD" ? "USD" : "$"})</Label>
            <Input
              id="rate_per_trip"
              type="number"
              step="0.01"
              value={formData.rate_per_trip}
              onChange={(e) => setFormData({ ...formData, rate_per_trip: e.target.value })}
              placeholder="Ej: 500000"
            />
          </div>

          <div>
            <Label htmlFor="rate_per_ton">Tarifa por Tonelada ({formData.currency === "USD" ? "USD/TN" : "$/TN"})</Label>
            <Input
              id="rate_per_ton"
              type="number"
              step="0.01"
              value={formData.rate_per_ton}
              onChange={(e) => setFormData({ ...formData, rate_per_ton: e.target.value })}
              placeholder="Ej: 15000"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground">Tarifas Terceros</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="third_party_rate_per_trip">Tarifa por Viaje ({formData.currency === "USD" ? "USD" : "$"})</Label>
            <Input
              id="third_party_rate_per_trip"
              type="number"
              step="0.01"
              value={formData.third_party_rate_per_trip}
              onChange={(e) => setFormData({ ...formData, third_party_rate_per_trip: e.target.value })}
              placeholder="Ej: 450000"
            />
          </div>

          <div>
            <Label htmlFor="third_party_rate_per_ton">Tarifa por Tonelada ({formData.currency === "USD" ? "USD/TN" : "$/TN"})</Label>
            <Input
              id="third_party_rate_per_ton"
              type="number"
              step="0.01"
              value={formData.third_party_rate_per_ton}
              onChange={(e) => setFormData({ ...formData, third_party_rate_per_ton: e.target.value })}
              placeholder="Ej: 12000"
            />
          </div>
        </div>
      </div>

      {/* Percentage difference between own and third-party rates */}
      {(() => {
        const ownTrip = Number.parseFloat(formData.rate_per_trip) || 0
        const thirdTrip = Number.parseFloat(formData.third_party_rate_per_trip) || 0
        const ownTon = Number.parseFloat(formData.rate_per_ton) || 0
        const thirdTon = Number.parseFloat(formData.third_party_rate_per_ton) || 0
        const hasTripDiff = ownTrip > 0 && thirdTrip > 0
        const hasTonDiff = ownTon > 0 && thirdTon > 0
        if (!hasTripDiff && !hasTonDiff) return null
        const tripDiffPct = hasTripDiff ? (((ownTrip - thirdTrip) / thirdTrip) * 100).toFixed(1) : null
        const tonDiffPct = hasTonDiff ? (((ownTon - thirdTon) / thirdTon) * 100).toFixed(1) : null
        return (
          <div className="rounded-md border bg-muted/50 p-3 space-y-1">
            <h4 className="text-xs font-semibold text-muted-foreground">Diferencia Propia vs Terceros</h4>
            <div className="flex flex-wrap gap-4">
              {tripDiffPct !== null && (
                <p className="text-sm">
                  <span className="text-muted-foreground">Por viaje:</span>{" "}
                  <span className={`font-semibold ${Number(tripDiffPct) >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {Number(tripDiffPct) >= 0 ? "+" : ""}{tripDiffPct}%
                  </span>
                </p>
              )}
              {tonDiffPct !== null && (
                <p className="text-sm">
                  <span className="text-muted-foreground">Por tonelada:</span>{" "}
                  <span className={`font-semibold ${Number(tonDiffPct) >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {Number(tonDiffPct) >= 0 ? "+" : ""}{tonDiffPct}%
                  </span>
                </p>
              )}
            </div>
          </div>
        )
      })()}

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground">Vigencia</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="valid_from">Válido Desde</Label>
            <Input
              id="valid_from"
              type="date"
              value={formData.valid_from}
              onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="valid_until">Válido Hasta</Label>
            <Input
              id="valid_until"
              type="date"
              value={formData.valid_until}
              onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
            />
            <p className="text-xs text-muted-foreground mt-1">Dejar en blanco para vigencia indefinida</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="observations">Observaciones</Label>
        <textarea
          id="observations"
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
          value={formData.observations}
          onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
          placeholder="Notas o comentarios sobre esta tarifa..."
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="active"
          checked={formData.active}
          onCheckedChange={(checked) => setFormData({ ...formData, active: checked as boolean })}
        />
        <Label htmlFor="active" className="text-sm font-normal cursor-pointer">
          Tarifa activa
        </Label>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {tariff ? "Actualizar" : "Crear"} Tarifa
        </Button>
      </div>
    </form>
  )
}
