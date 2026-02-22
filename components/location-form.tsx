"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createBrowserClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"

interface Location {
  id: string
  name: string
  address: string
  city?: string
  province?: string
  country?: string
  latitude?: number
  longitude?: number
  location_type: string
  notes?: string
  active: boolean
}

interface LocationFormProps {
  location?: Location
  onSuccess: () => void
  onCancel: () => void
}

export function LocationForm({ location, onSuccess, onCancel }: LocationFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    province: "",
    country: "Argentina",
    location_type: "both",
    notes: "",
  })

  const supabase = createBrowserClient()

  useEffect(() => {
    if (location) {
      setFormData({
        name: location.name || "",
        address: location.address || "",
        city: location.city || "",
        province: location.province || "",
        country: location.country || "Argentina",
        location_type: location.location_type || "both",
        notes: location.notes || "",
      })
    }
  }, [location])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.address) {
      alert("Por favor completa todos los campos obligatorios")
      return
    }

    setLoading(true)

    try {
      if (location) {
        // Update existing location
        const { error } = await supabase
          .from("locations")
          .update({
            name: formData.name,
            address: formData.address,
            city: formData.city || null,
            province: formData.province || null,
            country: formData.country,
            location_type: formData.location_type,
            notes: formData.notes || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", location.id)

        if (error) throw error
      } else {
        // Create new location
        const { error } = await supabase.from("locations").insert({
          name: formData.name,
          address: formData.address,
          city: formData.city || null,
          province: formData.province || null,
          country: formData.country,
          location_type: formData.location_type,
          notes: formData.notes || null,
          active: true,
        })

        if (error) throw error
      }

      onSuccess()
    } catch (error) {
      console.error("Error saving location:", error)
      alert("Error al guardar la ubicación")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ej: Planta San Lorenzo"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Dirección *</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Ej: Ruta 11 Km 425, San Lorenzo"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">Ciudad</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            placeholder="Ej: San Lorenzo"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="province">Provincia</Label>
          <Input
            id="province"
            value={formData.province}
            onChange={(e) => setFormData({ ...formData, province: e.target.value })}
            placeholder="Ej: Santa Fe"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location_type">Tipo de Ubicación</Label>
        <Select
          value={formData.location_type}
          onValueChange={(value) => setFormData({ ...formData, location_type: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="loading">Solo Carga</SelectItem>
            <SelectItem value="unloading">Solo Descarga</SelectItem>
            <SelectItem value="both">Carga y Descarga</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Información adicional..."
          rows={3}
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {location ? "Guardar Cambios" : "Crear Ubicación"}
        </Button>
      </div>
    </form>
  )
}
