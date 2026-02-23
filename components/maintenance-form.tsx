"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PurchaseOrderSelector, SelectedPOData } from "@/components/maintenance/purchase-order-selector"
import { TrashIcon } from "lucide-react"

interface Driver {
  id: string
  name: string
  cuit: string
}

interface Vehicle {
  id: string
  patent_chasis: string
  vehicle_type: string
  current_km: number
}

interface SparePart {
  id: string
  name: string
  stock_quantity: number
  unit_cost: number | null
  category: string
}

interface SelectedSparePart {
  spare_part_id: string
  name: string
  quantity_used: number
  unit_cost: number | null
}

export function MaintenanceForm({
  vehicleId,
  currentKm,
  drivers = [],
  vehicles = [],
  spareParts = [],
  onSuccess,
}: {
  vehicleId?: string | null
  currentKm?: number
  drivers?: Driver[]
  vehicles?: Vehicle[]
  spareParts?: SparePart[]
  onSuccess?: () => void
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selectedVehicleId, setSelectedVehicleId] = useState(vehicleId || "")
  const [formData, setFormData] = useState({
    description: "",
    cost: "",
    date: new Date().toISOString().split("T")[0],
    kilometers_at_service: currentKm || 0,
    next_service_date: "",
    next_service_km: "",
    has_next_date: false,
    has_next_km: false,
    driver_id: "",
  })
  const [useOwnSpareParts, setUseOwnSpareParts] = useState(false)
  const [selectedSpareParts, setSelectedSpareParts] = useState<SelectedSparePart[]>([])
  
  // Purchase Order Linking
  const [showPOSelector, setShowPOSelector] = useState(false)
  const [selectedPOs, setSelectedPOs] = useState<SelectedPOData[]>([])

  const handleVehicleChange = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId)
    const vehicle = vehicles.find((v) => v.id === vehicleId)
    if (vehicle) {
      setFormData({ ...formData, kilometers_at_service: vehicle.current_km })
    }
  }

  const handleAddSparePart = (sparePartId: string) => {
    const sparePart = spareParts.find((sp) => sp.id === sparePartId)
    if (!sparePart) return

    if (selectedSpareParts.some((sp) => sp.spare_part_id === sparePartId)) {
      alert("Este repuesto ya está agregado")
      return
    }

    setSelectedSpareParts([
      ...selectedSpareParts,
      {
        spare_part_id: sparePartId,
        name: sparePart.name,
        quantity_used: 1,
        unit_cost: sparePart.unit_cost,
      },
    ])
  }

  const handleRemoveSparePart = (sparePartId: string) => {
    setSelectedSpareParts(selectedSpareParts.filter((sp) => sp.spare_part_id !== sparePartId))
  }

  const handleQuantityChange = (sparePartId: string, quantity: number) => {
    setSelectedSpareParts(
      selectedSpareParts.map((sp) =>
        sp.spare_part_id === sparePartId ? { ...sp, quantity_used: Math.max(1, quantity) } : sp,
      ),
    )
  }

  const handlePOSelect = (data: SelectedPOData) => {
    setSelectedPOs([...selectedPOs, data])
    setShowPOSelector(false)
  }

  const handlePORemove = (poId: string) => {
    setSelectedPOs(selectedPOs.filter(p => p.po.id !== poId))
  }

  // Auto-calculate cost and description from selected POs
  useEffect(() => {
    if (selectedPOs.length === 0) return

    let totalCost = 0
    const descriptionItems: string[] = []

    selectedPOs.forEach((poData) => {
      const { po, selectedItems, allocatedAmount } = poData
      
      const itemIds = Object.keys(selectedItems)
      
      if (itemIds.length > 0 && po.items) {
        // Calculate from specific items
        let poSubtotal = 0
        itemIds.forEach((itemId) => {
          const item = po.items?.find((i) => i.id === itemId)
          if (item) {
            const quantity = selectedItems[itemId]
            poSubtotal += (item.unit_price || 0) * quantity
            descriptionItems.push(`${item.description}`)
          }
        })

        // Apply IVA if applicable
        if (po.iva_applied && po.iva_percent) {
          totalCost += poSubtotal * (1 + po.iva_percent / 100)
        } else {
          totalCost += poSubtotal
        }
      } else {
        // Fallback to allocated amount
        totalCost += Number(allocatedAmount) || 0
        descriptionItems.push(`OC #${po.order_number}`)
      }
    })

    setFormData((prev) => ({
      ...prev,
      cost: totalCost > 0 ? totalCost.toFixed(2) : prev.cost,
      description: descriptionItems.length > 0 ? descriptionItems.join(", ") : prev.description,
    }))
  }, [selectedPOs])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()

      const maintenanceData = {
        vehicle_id: selectedVehicleId,
        description: formData.description,
        cost: formData.cost ? Number.parseFloat(formData.cost) : null,
        date: formData.date,
        kilometers_at_service: formData.kilometers_at_service,
        next_service_date: formData.has_next_date && formData.next_service_date ? formData.next_service_date : null,
        next_service_km:
          formData.has_next_km && formData.next_service_km ? Number.parseInt(formData.next_service_km) : null,
        driver_id: formData.driver_id || null,
        completed: false,
        uses_own_spare_parts: useOwnSpareParts,
      }

      const { data: maintenance, error } = await supabase
        .from("maintenances")
        .insert([maintenanceData])
        .select()
        .single()

      if (error) throw error

      if (useOwnSpareParts && selectedSpareParts.length > 0 && maintenance) {
        const sparePartsRelations = selectedSpareParts.map((sp) => ({
          maintenance_id: maintenance.id,
          spare_part_id: sp.spare_part_id,
          quantity_used: sp.quantity_used,
        }))

        const { error: relError } = await supabase.from("maintenance_spare_parts").insert(sparePartsRelations)
        if (relError) throw relError

        for (const sp of selectedSpareParts) {
          const currentSparePart = spareParts.find((part) => part.id === sp.spare_part_id)
          if (currentSparePart) {
            const newStock = currentSparePart.stock_quantity - sp.quantity_used
            await supabase
              .from("spare_parts")
              .update({ stock_quantity: Math.max(0, newStock) })
              .eq("id", sp.spare_part_id)
          }
        }
      }

      // Handle Linked Purchase Orders
      if (selectedPOs.length > 0 && maintenance) {
        for (const poData of selectedPOs) {
          let amountToLink = poData.allocatedAmount
          const itemIds = Object.keys(poData.selectedItems)
          
          if (itemIds.length > 0 && poData.po.items) {
             let subtotal = 0
             itemIds.forEach(id => {
                 const item = poData.po.items?.find(i => i.id === id)
                 if (item) subtotal += (item.unit_price || 0) * poData.selectedItems[id]
             })
             
             if (poData.po.iva_applied && poData.po.iva_percent) {
                 amountToLink = subtotal * (1 + poData.po.iva_percent / 100)
             } else {
                 amountToLink = subtotal
             }
          }

          // 1. Link Header
          const { error: headerError } = await supabase
            .from("maintenance_purchase_orders")
            .insert({
              maintenance_id: maintenance.id,
              purchase_order_id: poData.po.id,
              allocated_amount: amountToLink,
            })
          
          if (headerError) throw headerError

          // 2. Link Items
          const itemsToLink = Object.entries(poData.selectedItems).map(([itemId, quantity]) => ({
            maintenance_id: maintenance.id,
            purchase_order_item_id: itemId,
            quantity_used: quantity,
          }))

          if (itemsToLink.length > 0) {
             const { error: itemsError } = await supabase
              .from("maintenance_purchase_order_items")
              .insert(itemsToLink)
             if (itemsError) throw itemsError
          }
        }
      }

      setFormData({
        description: "",
        cost: "",
        date: new Date().toISOString().split("T")[0],
        kilometers_at_service: currentKm || 0,
        next_service_date: "",
        next_service_km: "",
        has_next_date: false,
        has_next_km: false,
        driver_id: "",
      })
      setUseOwnSpareParts(false)
      setSelectedSpareParts([])
      setSelectedPOs([])

      if (onSuccess) {
        onSuccess()
      } else {
        router.refresh()
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error al registrar mantenimiento")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Linked Purchase Orders Section (Top) */}
      <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
        <div className="flex justify-between items-center">
          <Label className="text-base font-semibold">Vincular Orden de Compra (Opcional)</Label>
          {!showPOSelector && (
            <Button type="button" variant="outline" size="sm" onClick={() => setShowPOSelector(true)}>
              {selectedPOs.length > 0 ? "Agregar otra OC" : "Buscar OC"}
            </Button>
          )}
        </div>
        
        {showPOSelector && (
          <div className="space-y-2">
            <PurchaseOrderSelector 
              onSelect={handlePOSelect} 
              selectedPOs={selectedPOs} 
            />
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowPOSelector(false)} className="w-full text-muted-foreground">
              Cancelar búsqueda
            </Button>
          </div>
        )}

        {selectedPOs.length > 0 && !showPOSelector && (
          <div className="space-y-2">
            {selectedPOs.map((data) => (
              <div key={data.po.id} className="flex items-start justify-between p-3 bg-background rounded border">
                <div>
                  <p className="font-bold text-sm">{data.po.order_number}</p>
                  <p className="text-xs text-muted-foreground">{data.po.supplier_name}</p>
                  <p className="text-xs mt-1">Asignado: ${data.allocatedAmount.toLocaleString()}</p>
                  {Object.keys(data.selectedItems).length > 0 && (
                    <p className="text-xs text-blue-600 mt-1">{Object.keys(data.selectedItems).length} ítems vinculados</p>
                  )}
                </div>
                <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handlePORemove(data.po.id)}>
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {!vehicleId && vehicles.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="vehicle">Vehículo</Label>
          <Select value={selectedVehicleId} onValueChange={handleVehicleChange} required>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar vehículo" />
            </SelectTrigger>
            <SelectContent>
              {vehicles.map((vehicle) => (
                <SelectItem key={vehicle.id} value={vehicle.id}>
                  {vehicle.vehicle_type} - {vehicle.patent_chasis}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Ej: VTV, Cambio de aceite, Cambio de vujes..."
          required
          rows={3}
        />
      </div>

      {drivers.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="driver_id">Chofer (Opcional)</Label>
          <Select value={formData.driver_id} onValueChange={(value) => setFormData({ ...formData, driver_id: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar chofer si está involucrado" />
            </SelectTrigger>
            <SelectContent>
              {drivers.map((driver) => (
                <SelectItem key={driver.id} value={driver.id}>
                  {driver.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Si asignas un chofer, no estará disponible para viajes en esta fecha
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="cost">Costo</Label>
        <Input
          id="cost"
          type="number"
          step="0.01"
          min="0"
          value={formData.cost}
          onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
          placeholder="0.00"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
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
          <Label htmlFor="kilometers">KM al servicio</Label>
          <Input
            id="kilometers"
            type="number"
            min="0"
            value={formData.kilometers_at_service}
            onChange={(e) => setFormData({ ...formData, kilometers_at_service: Number.parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div className="border-t pt-4 space-y-4">
        <p className="text-sm font-medium">Próximo Servicio (Opcional)</p>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="has_next_date"
            checked={formData.has_next_date}
            onCheckedChange={(checked) => setFormData({ ...formData, has_next_date: !!checked })}
          />
          <Label htmlFor="has_next_date" className="font-normal">
            Programar por fecha
          </Label>
        </div>

        {formData.has_next_date && (
          <div className="space-y-2">
            <Label htmlFor="next_service_date">Fecha próximo servicio</Label>
            <Input
              id="next_service_date"
              type="date"
              value={formData.next_service_date}
              onChange={(e) => setFormData({ ...formData, next_service_date: e.target.value })}
            />
          </div>
        )}

        <div className="flex items-center space-x-2">
          <Checkbox
            id="has_next_km"
            checked={formData.has_next_km}
            onCheckedChange={(checked) => setFormData({ ...formData, has_next_km: !!checked })}
          />
          <Label htmlFor="has_next_km" className="font-normal">
            Programar por kilometraje
          </Label>
        </div>

        {formData.has_next_km && (
          <div className="space-y-2">
            <Label htmlFor="next_service_km">KM próximo servicio</Label>
            <Input
              id="next_service_km"
              type="number"
              min="0"
              value={formData.next_service_km}
              onChange={(e) => setFormData({ ...formData, next_service_km: e.target.value })}
              placeholder="Ej: 60000"
            />
          </div>
        )}
      </div>

      <div className="border-t pt-4 space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="useOwnSpareParts"
            checked={useOwnSpareParts}
            onCheckedChange={(checked) => {
              setUseOwnSpareParts(!!checked)
              if (!checked) setSelectedSpareParts([])
            }}
          />
          <Label htmlFor="useOwnSpareParts" className="font-medium">
            Usar repuestos propios
          </Label>
        </div>

        {useOwnSpareParts && (
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <div className="space-y-2">
              <Label>Seleccionar Repuestos</Label>
              <Select onValueChange={handleAddSparePart}>
                <SelectTrigger>
                  <SelectValue placeholder="Agregar repuesto..." />
                </SelectTrigger>
                <SelectContent>
                  {spareParts
                    .filter((sp) => sp.stock_quantity > 0)
                    .map((sp) => (
                      <SelectItem key={sp.id} value={sp.id}>
                        {sp.name} (Stock: {sp.stock_quantity})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {selectedSpareParts.length > 0 && (
              <div className="space-y-2">
                <Label>Repuestos Seleccionados</Label>
                {selectedSpareParts.map((sp) => (
                  <div key={sp.spare_part_id} className="flex items-center gap-2 p-2 bg-background rounded border">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{sp.name}</p>
                      {sp.unit_cost && (
                        <p className="text-xs text-muted-foreground">${Number(sp.unit_cost).toLocaleString()} c/u</p>
                      )}
                    </div>
                    <Input
                      type="number"
                      min="1"
                      value={sp.quantity_used}
                      onChange={(e) => handleQuantityChange(sp.spare_part_id, Number(e.target.value))}
                      className="w-20"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveSparePart(sp.spare_part_id)}
                    >
                      ✕
                    </Button>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">
                  El stock se actualizará automáticamente al registrar el mantenimiento
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <Button type="submit" className="w-full bg-[#0038ae] hover:bg-[#0038ae]/90" disabled={loading}>
        {loading ? "Registrando..." : "Registrar Mantenimiento"}
      </Button>
    </form>
  )
}
