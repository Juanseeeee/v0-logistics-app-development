"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SparePartFormProps {
  sparePart?: any
  onSuccess?: () => void
}

export function SparePartForm({ sparePart, onSuccess }: SparePartFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: sparePart?.name || "",
    description: sparePart?.description || "",
    stock_quantity: sparePart?.stock_quantity || 0,
    unit_cost: sparePart?.unit_cost || "",
    location: sparePart?.location || "",
    category: sparePart?.category || "Otro",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()

      const data = {
        name: formData.name,
        description: formData.description,
        stock_quantity: Number(formData.stock_quantity),
        unit_cost: formData.unit_cost ? Number.parseFloat(formData.unit_cost) : null,
        location: formData.location,
        category: formData.category,
      }

      if (sparePart) {
        const { error } = await supabase.from("spare_parts").update(data).eq("id", sparePart.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from("spare_parts").insert([data])
        if (error) throw error
      }

      setFormData({
        name: "",
        description: "",
        stock_quantity: 0,
        unit_cost: "",
        location: "",
        category: "Otro",
      })

      if (onSuccess) {
        onSuccess()
      } else {
        router.refresh()
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error al guardar repuesto")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre del Repuesto *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ej: Goma 295/80R22.5"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Categoría</Label>
        <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Gomas">Gomas</SelectItem>
            <SelectItem value="Filtros">Filtros</SelectItem>
            <SelectItem value="Aceites">Aceites</SelectItem>
            <SelectItem value="Frenos">Frenos</SelectItem>
            <SelectItem value="Eléctricos">Eléctricos</SelectItem>
            <SelectItem value="Suspensión">Suspensión</SelectItem>
            <SelectItem value="Motor">Motor</SelectItem>
            <SelectItem value="Otro">Otro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Detalles adicionales del repuesto"
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="stock_quantity">Cantidad en Stock *</Label>
          <Input
            id="stock_quantity"
            type="number"
            min="0"
            value={formData.stock_quantity}
            onChange={(e) => setFormData({ ...formData, stock_quantity: Number(e.target.value) })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="unit_cost">Costo Unitario</Label>
          <Input
            id="unit_cost"
            type="number"
            step="0.01"
            min="0"
            value={formData.unit_cost}
            onChange={(e) => setFormData({ ...formData, unit_cost: e.target.value })}
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Ubicación</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          placeholder="Ej: Depósito A, Estante 3"
        />
      </div>

      <Button type="submit" className="w-full bg-[#0038ae] hover:bg-[#0038ae]/90" disabled={loading}>
        {loading ? "Guardando..." : sparePart ? "Actualizar Repuesto" : "Agregar Repuesto"}
      </Button>
    </form>
  )
}
