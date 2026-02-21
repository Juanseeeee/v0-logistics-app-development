"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function VehicleForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    vehicle_type: "",
    patent_chasis: "",
    patent_semi: "",
    transport_company: "",
    kilometers: 0,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.from("vehicles").insert([formData])

      if (error) throw error

      setFormData({
        vehicle_type: "",
        patent_chasis: "",
        patent_semi: "",
        transport_company: "",
        kilometers: 0,
      })
      router.refresh()
    } catch (error) {
      console.error("Error:", error)
      alert("Error al agregar vehículo")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="vehicle_type">Tipo de Vehículo</Label>
        <Select
          value={formData.vehicle_type}
          onValueChange={(value) => setFormData({ ...formData, vehicle_type: value })}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Semiremolque">Semiremolque</SelectItem>
            <SelectItem value="Cisterna">Cisterna</SelectItem>
            <SelectItem value="Camioneta">Camioneta</SelectItem>
            <SelectItem value="Camión">Camión</SelectItem>
            <SelectItem value="Tractor">Tractor</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="patent_chasis">Patente Chasis</Label>
        <Input
          id="patent_chasis"
          value={formData.patent_chasis}
          onChange={(e) => setFormData({ ...formData, patent_chasis: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="patent_semi">Patente Semi (Opcional)</Label>
        <Input
          id="patent_semi"
          value={formData.patent_semi}
          onChange={(e) => setFormData({ ...formData, patent_semi: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="transport_company">Empresa de Transporte</Label>
        <Input
          id="transport_company"
          value={formData.transport_company}
          onChange={(e) => setFormData({ ...formData, transport_company: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="kilometers">Kilómetros Actuales</Label>
        <Input
          id="kilometers"
          type="number"
          min="0"
          value={formData.kilometers}
          onChange={(e) => setFormData({ ...formData, kilometers: Number.parseInt(e.target.value) || 0 })}
        />
      </div>

      <Button type="submit" className="w-full bg-[#0038ae] hover:bg-[#0038ae]/90" disabled={loading}>
        {loading ? "Agregando..." : "Agregar Vehículo"}
      </Button>
    </form>
  )
}
