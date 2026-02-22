"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Vehicle {
  id: string
  patent_chasis: string
  vehicle_type: string
  kilometers: number
}

export function FuelRecordFormCentralized({
  vehicles,
  onSuccess,
}: {
  vehicles: Vehicle[]
  onSuccess?: () => void
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selectedVehicleId, setSelectedVehicleId] = useState("")
  const [formData, setFormData] = useState({
    liters: "",
    cost: "",
    date: new Date().toISOString().split("T")[0],
    kilometers: "",
    station: "",
  })

  // Get current kilometers when vehicle is selected
  const handleVehicleChange = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId)
    const vehicle = vehicles.find((v) => v.id === vehicleId)
    if (vehicle) {
      setFormData({ ...formData, kilometers: vehicle.kilometers.toString() })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedVehicleId) {
      alert("Selecciona un vehículo")
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      const fuelData = {
        vehicle_id: selectedVehicleId,
        liters: Number.parseFloat(formData.liters),
        cost: Number.parseFloat(formData.cost),
        date: formData.date,
        kilometers: formData.kilometers ? Number.parseInt(formData.kilometers) : null,
        station: formData.station || null,
      }

      const { error } = await supabase.from("fuel_records").insert([fuelData])

if (error) throw error

      onSuccess?.()
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
        <Label htmlFor="vehicle">Vehículo</Label>
        <Select value={selectedVehicleId} onValueChange={handleVehicleChange} required>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar vehículo" />
          </SelectTrigger>
          <SelectContent>
            {vehicles.map((vehicle) => (
              <SelectItem key={vehicle.id} value={vehicle.id}>
                {vehicle.patent_chasis} - {vehicle.vehicle_type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
        <Label htmlFor="kilometers">Kilómetros (Opcional)</Label>
        <Input
          id="kilometers"
          type="number"
          min="0"
          value={formData.kilometers}
          onChange={(e) => setFormData({ ...formData, kilometers: e.target.value })}
          placeholder="Kilómetros actuales"
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

export default FuelRecordFormCentralized
