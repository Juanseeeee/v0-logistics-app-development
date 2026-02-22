"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Vehicle {
  id: string
  patent_chasis: string
  vehicle_type: string
}

interface TransportCompany {
  id: string
  name: string
}

export function DriverForm({
  vehicles,
  transportCompanies,
}: { vehicles: Vehicle[]; transportCompanies: TransportCompany[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    cuit: "",
    transport_company_id: "",
    chasis_id: "none",
    semi_id: "none",
  })

  const [isQuickVehicleOpen, setIsQuickVehicleOpen] = useState(false)
  const [quickVehicleType, setQuickVehicleType] = useState<"Camión" | "Semi">("Camión")
  const [quickVehicleData, setQuickVehicleData] = useState({
    patent_chasis: "",
    transport_company_id: "",
    kilometers: "0",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      const selectedCompany = transportCompanies.find((c) => c.id === formData.transport_company_id)
      const driverData = {
        name: formData.name,
        cuit: formData.cuit,
        transport_company_id: formData.transport_company_id,
        transport_company: selectedCompany?.name || null,
        chasis_id: formData.chasis_id === "none" ? null : formData.chasis_id,
        semi_id: formData.semi_id === "none" ? null : formData.semi_id,
      }

      const { error } = await supabase.from("drivers").insert([driverData])

      if (error) throw error

      setFormData({
        name: "",
        cuit: "",
        transport_company_id: "",
        chasis_id: "none",
        semi_id: "none",
      })
      router.refresh()
    } catch (error) {
      console.error("Error:", error)
      alert("Error al agregar chofer")
    } finally {
      setLoading(false)
    }
  }

  const handleQuickAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      const selectedCompany = transportCompanies.find((c) => c.id === quickVehicleData.transport_company_id)

      const vehicleData = {
        vehicle_type: quickVehicleType,
        patent_chasis: quickVehicleData.patent_chasis,
        transport_company: selectedCompany?.name || "",
        transport_company_id: quickVehicleData.transport_company_id,
        kilometers: Number.parseInt(quickVehicleData.kilometers) || 0,
      }

      const { error } = await supabase.from("vehicles").insert([vehicleData])

      if (error) throw error

      setQuickVehicleData({ patent_chasis: "", transport_company_id: "", kilometers: "0" })
      setIsQuickVehicleOpen(false)
      router.refresh()
      alert("Vehículo agregado exitosamente")
    } catch (error) {
      console.error("Error:", error)
      alert("Error al agregar vehículo")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cuit">CUIT *</Label>
          <Input
            id="cuit"
            value={formData.cuit}
            onChange={(e) => setFormData({ ...formData, cuit: e.target.value })}
            placeholder="20-12345678-9"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="transport_company_id">Empresa de Transporte *</Label>
          <Select
            value={formData.transport_company_id}
            onValueChange={(value) => setFormData({ ...formData, transport_company_id: value })}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar empresa" />
            </SelectTrigger>
            <SelectContent>
              {transportCompanies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="chasis">Chasis (Opcional)</Label>
          <div className="flex gap-2">
            <Select
              value={formData.chasis_id}
              onValueChange={(value) => setFormData({ ...formData, chasis_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar vehículo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ninguno</SelectItem>
                {vehicles
                  .filter((v) => v.vehicle_type === "Camión")
                  .map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.patent_chasis} - {vehicle.vehicle_type}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => {
                setQuickVehicleType("Camión")
                setIsQuickVehicleOpen(true)
              }}
              title="Agregar nuevo chasis"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="semi">Semi (Opcional)</Label>
          <div className="flex gap-2">
            <Select value={formData.semi_id} onValueChange={(value) => setFormData({ ...formData, semi_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar semi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ninguno</SelectItem>
                {vehicles
                  .filter((v) => v.vehicle_type === "Semi")
                  .map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.patent_chasis} - {vehicle.vehicle_type}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => {
                setQuickVehicleType("Semi")
                setIsQuickVehicleOpen(true)
              }}
              title="Agregar nuevo semi"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Button type="submit" className="w-full bg-[#0038ae] hover:bg-[#0038ae]/90" disabled={loading}>
          {loading ? "Agregando..." : "Agregar Chofer"}
        </Button>
      </form>

      <Dialog open={isQuickVehicleOpen} onOpenChange={setIsQuickVehicleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar {quickVehicleType === "Camión" ? "Chasis" : "Semi"} Rápido</DialogTitle>
            <DialogDescription>
              Agrega un nuevo {quickVehicleType === "Camión" ? "chasis" : "semi"} de forma rápida
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleQuickAddVehicle} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quick-patent">Patente</Label>
              <Input
                id="quick-patent"
                value={quickVehicleData.patent_chasis}
                onChange={(e) => setQuickVehicleData({ ...quickVehicleData, patent_chasis: e.target.value })}
                placeholder="AB123CD"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quick-transport">Empresa de Transporte</Label>
              <Select
                value={quickVehicleData.transport_company_id}
                onValueChange={(value) => setQuickVehicleData({ ...quickVehicleData, transport_company_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar empresa" />
                </SelectTrigger>
                <SelectContent>
                  {transportCompanies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quick-kilometers">Kilómetros</Label>
              <Input
                id="quick-kilometers"
                type="number"
                value={quickVehicleData.kilometers}
                onChange={(e) => setQuickVehicleData({ ...quickVehicleData, kilometers: e.target.value })}
                placeholder="0"
                min="0"
              />
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setIsQuickVehicleOpen(false)} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="flex-1 bg-[#0038ae] hover:bg-[#0038ae]/90">
                {loading ? "Agregando..." : "Agregar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
