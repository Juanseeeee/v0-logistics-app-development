"use client"

import React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"

interface Supplier {
  id: string
  name: string
  cuit: string
}

interface PurchaseOrderItem {
  id?: string
  code: string
  description: string
  quantity: number
  unit_price: number
  total_item: number
}

interface ExistingOrder {
  id: string
  po_number: string
  supplier_id: string
  issue_date: string
  delivery_address: string
  delivery_location: string
  delivery_province: string
  delivery_date: string | null
  payment_terms: string
  subtotal: number
  iva: number
  total: number
  status: string
  notes: string | null
  purchase_order_items: PurchaseOrderItem[]
}

export function PurchaseOrderForm({
  suppliers,
  existingOrder,
  onSuccess,
  onCancel,
}: {
  suppliers: Supplier[]
  existingOrder?: ExistingOrder | null
  onSuccess: () => void
  onCancel: () => void
}) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    supplier_id: existingOrder?.supplier_id || "",
    issue_date: existingOrder?.issue_date?.split("T")[0] || new Date().toISOString().split("T")[0],
    delivery_address: existingOrder?.delivery_address || "",
    delivery_location: existingOrder?.delivery_location || "",
    delivery_province: existingOrder?.delivery_province || "",
    delivery_date: existingOrder?.delivery_date?.split("T")[0] || "",
    payment_terms: existingOrder?.payment_terms || "Contado",
    status: existingOrder?.status || "pending",
    notes: existingOrder?.notes || "",
  })

  const [items, setItems] = useState<PurchaseOrderItem[]>(
    existingOrder?.purchase_order_items || [
      { code: "", description: "", quantity: 1, unit_price: 0, total_item: 0 },
    ]
  )

  const [applyIva, setApplyIva] = useState(Boolean(existingOrder?.iva && existingOrder?.iva > 0))
  const [ivaRate, setIvaRate] = useState<number>(() => {
    if (existingOrder?.subtotal && existingOrder?.iva && existingOrder.subtotal > 0) {
      return Math.round((existingOrder.iva / existingOrder.subtotal) * 1000) / 10
    }
    return 21
  })

  const subtotal = items.reduce((sum, item) => sum + item.total_item, 0)
  const ivaAmount = applyIva ? parseFloat(((subtotal * ivaRate) / 100).toFixed(2)) : 0
  const total = parseFloat((subtotal + ivaAmount).toFixed(2))

  const handleAddItem = () => {
    setItems([...items, { code: "", description: "", quantity: 1, unit_price: 0, total_item: 0 }])
  }

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const handleItemChange = (index: number, field: keyof PurchaseOrderItem, value: string | number) => {
    const newItems = [...items]
    newItems[index] = {
      ...newItems[index],
      [field]: value,
    }
    
    // Recalculate total_item
    if (field === "quantity" || field === "unit_price") {
      newItems[index].total_item = newItems[index].quantity * newItems[index].unit_price
    }
    
    setItems(newItems)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.supplier_id) {
      alert("Por favor selecciona un proveedor")
      return
    }

    if (items.length === 0 || !items[0].description) {
      alert("Por favor agrega al menos un item")
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()

      // Get supplier data
      const { data: supplierData, error: supplierError } = await supabase
        .from("suppliers")
        .select("name, cuit, address")
        .eq("id", formData.supplier_id)
        .single()

      if (supplierError) throw supplierError

      // Generate PO number if creating new
      let poNumber = existingOrder?.po_number
      if (!poNumber) {
        const { count } = await supabase
          .from("purchase_orders")
          .select("*", { count: "exact", head: true })
        
        poNumber = `OCPR${String(Date.now()).slice(-8)}_${String((count || 0) + 1).padStart(6, "0")}`
      }

      const notesWithIva =
        applyIva
          ? `${formData.notes || ""}${formData.notes ? " | " : ""}IVA:${ivaRate}%`
          : formData.notes || ""

      const orderData = {
        order_number: poNumber,
        po_number: poNumber,
        order_date: formData.issue_date,
        supplier_id: formData.supplier_id,
        supplier_name: supplierData.name,
        supplier_cuit: supplierData.cuit || "",
        supplier_address: supplierData.address || "",
        issue_date: formData.issue_date,
        delivery_address: formData.delivery_address,
        delivery_location: formData.delivery_location,
        delivery_province: formData.delivery_province,
        delivery_date: formData.delivery_date || null,
        payment_terms: formData.payment_terms,
        total,
        status: formData.status,
        notes: notesWithIva || null,
      }

      if (existingOrder) {
        // Update existing order
        const { error: orderError } = await supabase
          .from("purchase_orders")
          .update(orderData)
          .eq("id", existingOrder.id)

        if (orderError) throw orderError

        // Delete old items
        await supabase.from("purchase_order_items").delete().eq("purchase_order_id", existingOrder.id)

        // Insert new items
        const itemsData = items.map((item, index) => ({
          purchase_order_id: existingOrder.id,
          item_number: index + 1,
          code: item.code || "",
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_item: item.total_item,
        }))

        const { error: itemsError } = await supabase.from("purchase_order_items").insert(itemsData)
        if (itemsError) throw itemsError
      } else {
        // Create new order
        const { data: newOrder, error: orderError } = await supabase
          .from("purchase_orders")
          .insert(orderData)
          .select()
          .single()

        if (orderError) throw orderError

        // Insert items
        const itemsData = items.map((item, index) => ({
          purchase_order_id: newOrder.id,
          item_number: index + 1,
          code: item.code || "",
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_item: item.total_item,
        }))

        const { error: itemsError } = await supabase.from("purchase_order_items").insert(itemsData)
        if (itemsError) throw itemsError
      }

      toast({
        title: "Orden de compra guardada",
        description: existingOrder ? "La orden de compra se actualizó correctamente." : "La orden de compra se creó correctamente.",
      })
      onSuccess()
    } catch (error) {
      console.error("Error saving purchase order:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar la orden de compra. Por favor, intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Supplier and Dates */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="supplier_id">Proveedor *</Label>
          <Select value={formData.supplier_id} onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar proveedor" />
            </SelectTrigger>
            <SelectContent>
              {suppliers.map((supplier) => (
                <SelectItem key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="issue_date">Fecha de Emisión *</Label>
          <Input
            id="issue_date"
            type="date"
            value={formData.issue_date}
            onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="delivery_date">Fecha de Entrega</Label>
          <Input
            id="delivery_date"
            type="date"
            value={formData.delivery_date}
            onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
          />
        </div>
      </div>

      {/* Delivery Address */}
      <div className="space-y-4">
        <h3 className="font-semibold">Dirección de Entrega</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="delivery_address">Dirección *</Label>
            <Input
              id="delivery_address"
              value={formData.delivery_address}
              onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
              placeholder="Ej: Av. Corrientes 1234"
              required
            />
          </div>
          <div>
            <Label htmlFor="delivery_location">Localidad *</Label>
            <Input
              id="delivery_location"
              value={formData.delivery_location}
              onChange={(e) => setFormData({ ...formData, delivery_location: e.target.value })}
              placeholder="Ej: Buenos Aires"
              required
            />
          </div>
          <div>
            <Label htmlFor="delivery_province">Provincia *</Label>
            <Input
              id="delivery_province"
              value={formData.delivery_province}
              onChange={(e) => setFormData({ ...formData, delivery_province: e.target.value })}
              placeholder="Ej: Buenos Aires"
              required
            />
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Items de la Orden</h3>
          <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
            + Agregar Item
          </Button>
        </div>
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-1">
                <Label htmlFor={`code-${index}`}>Código</Label>
                <Input
                  id={`code-${index}`}
                  value={item.code}
                  onChange={(e) => handleItemChange(index, "code", e.target.value)}
                  placeholder="Cód."
                />
              </div>
              <div className="col-span-4">
                <Label htmlFor={`desc-${index}`}>Artículo</Label>
                <Input
                  id={`desc-${index}`}
                  value={item.description}
                  onChange={(e) => handleItemChange(index, "description", e.target.value)}
                  placeholder="Descripción del artículo"
                  required
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor={`qty-${index}`}>Cantidad</Label>
                <Input
                  id={`qty-${index}`}
                  type="number"
                  min="1"
                  step="1"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, "quantity", Number(e.target.value))}
                  required
                  className="text-center"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor={`price-${index}`}>Costo</Label>
                <Input
                  id={`price-${index}`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unit_price}
                  onChange={(e) => handleItemChange(index, "unit_price", Number(e.target.value))}
                  required
                />
              </div>
              <div className="col-span-2">
                <Label>Total Item</Label>
                <Input value={`$${item.total_item.toLocaleString()}`} disabled />
              </div>
              <div className="col-span-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveItem(index)}
                  disabled={items.length === 1}
                  className="text-destructive"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Total */}
      <div className="border-t pt-4 space-y-3">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={applyIva}
            onCheckedChange={(v) => setApplyIva(Boolean(v))}
            id="apply_iva"
          />
          <Label htmlFor="apply_iva">Aplicar IVA</Label>
          {applyIva && (
            <div className="flex items-center gap-2">
              <Label>Porcentaje</Label>
              <Select value={String(ivaRate)} onValueChange={(v) => setIvaRate(Number(v))}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="27">27%</SelectItem>
                  <SelectItem value="21">21%</SelectItem>
                  <SelectItem value="10.5">10.5%</SelectItem>
                  <SelectItem value="5">5%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <div className="flex justify-end">
          <div className="w-64 space-y-1">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>${subtotal.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>IVA {applyIva ? `${ivaRate}%` : "0%"}</span>
              <span>${ivaAmount.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-xl font-bold">
              <span>Total O.C.</span>
              <span>${total.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Terms and Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="payment_terms">Condiciones de Pago</Label>
          <Input
            id="payment_terms"
            value={formData.payment_terms}
            onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
            placeholder="Ej: Contado, 30 días"
          />
        </div>
        <div>
          <Label htmlFor="status">Estado</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="approved">Aprobada</SelectItem>
              <SelectItem value="received">Recibida</SelectItem>
              <SelectItem value="cancelled">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Notes */}
      <div>
        <Label htmlFor="notes">Notas</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Observaciones adicionales..."
          rows={3}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading} className="bg-[#0038ae] hover:bg-[#0038ae]/90">
          {loading ? "Guardando..." : existingOrder ? "Actualizar" : "Crear Orden"}
        </Button>
      </div>
    </form>
  )
}

export default PurchaseOrderForm
