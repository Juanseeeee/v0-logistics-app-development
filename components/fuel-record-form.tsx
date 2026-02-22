"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function FuelRecordForm({ vehicleId, currentKm }: { vehicleId: string; currentKm: number }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    liters: "",
    cost: "",
    date: new Date().toISOString().split("T")[0],
    kilometers: currentKm,
    station: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()

      const fuelData = {
        vehicle_id: vehicleId,
        liters: Number.parseFloat(formData.liters),
        cost: Number.parseFloat(formData.cost),
        date: formData.date,
        kilometers: formData.kilometers,
        station: formData.station || null,
      }

      const { error } = await supabase.from("fuel_records").insert([fuelData])

      if (error) throw error

      setFormData({
        liters: "",
        cost: "",
        date: new Date().toISOString().split("T")[0],
        kilometers: currentKm,
        station: "",
      })
      router.refresh()
    } catch (error) {
      console.error("Error:", error)
      alert("Error al registrar carga de combustible")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="liters">Litros</Label>
        <Input
          id="liters"
          type="number"
          step="0.01"
          min="0"
          value={formData.liters}
          onChange={(e) => setFormData({ ...formData, liters: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="cost">Costo Total</Label>
        <Input
          id="cost"
          type="number"
          step="0.01"
          min="0"
          value={formData.cost}
          onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Fecha</Label>
        <Input
          id="date"
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="kilometers">Kilómetros</Label>
        <Input
          id="kilometers"
          type="number"
          min="0"
          value={formData.kilometers}
          onChange={(e) => setFormData({ ...formData, kilometers: Number.parseInt(e.target.value) || 0 })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="station">Estación (Opcional)</Label>
        <Input
          id="station"
          value={formData.station}
          onChange={(e) => setFormData({ ...formData, station: e.target.value })}
          placeholder="Nombre de la estación"
        />
      </div>

      <Button type="submit" className="w-full bg-[#0038ae] hover:bg-[#0038ae]/90" disabled={loading}>
        {loading ? "Registrando..." : "Registrar Carga"}
      </Button>
    </form>
  )
}
