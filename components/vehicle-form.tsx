"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface VehicleFormProps {
  initialData?: {
    id: string
    vehicle_type: string
    patent_chasis: string
    patent_semi: string | null
    transport_company: string
    kilometers: number
  }
  onSuccess?: () => void
}

export function VehicleForm({ initialData, onSuccess }: VehicleFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    vehicle_type: initialData?.vehicle_type || "",
    patent_chasis: initialData?.patent_chasis || "",
    patent_semi: initialData?.patent_semi || "",
    transport_company: initialData?.transport_company || "",
    kilometers: initialData?.kilometers || 0,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      
      if (initialData?.id) {
        const { error } = await supabase
          .from("vehicles")
          .update(formData)
          .eq("id", initialData.id)
          
        if (error) throw error
      } else {
        const { error } = await supabase.from("vehicles").insert([formData])
        if (error) throw error
        
        setFormData({
          vehicle_type: "",
          patent_chasis: "",
          patent_semi: "",
          transport_company: "",
          kilometers: 0,
        })
      }

      router.refresh()
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error al guardar vehículo")
    } finally {
      setLoading(false)
    }
  }

  const standardTypes = ["Semiremolque", "Cisterna", "Camioneta", "Camión", "Tractor", "Semi"]
  const currentType = formData.vehicle_type
  
  // Ensure the current value is included in the options if it's not standard
  const displayTypes = [...standardTypes]
  if (currentType && !standardTypes.includes(currentType)) {
    displayTypes.unshift(currentType)
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
            {displayTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
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
        {loading ? "Guardando..." : initialData ? "Actualizar Vehículo" : "Agregar Vehículo"}
      </Button>
    </form>
  )
}
