"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { LinkIcon, PlusIcon, TrashIcon, CheckIcon } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

import { PurchaseOrder, PurchaseOrderSelector, SelectedPOData } from "./purchase-order-selector"

interface LinkedPO {
  id: string
  purchase_order_id: string
  allocated_amount: number
  notes: string | null
  purchase_orders: PurchaseOrder
}

interface LinkedItem {
  id: string
  purchase_order_item_id: string
  quantity_used: number
  purchase_order_items: {
    id: string
    description: string
    quantity: number
    unit_price: number
    total: number
  }
}

export function LinkPurchaseOrderDialog({
  maintenanceId,
  onUpdate,
}: {
  maintenanceId: string
  onUpdate?: () => void
}) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [linkedPOs, setLinkedPOs] = useState<LinkedPO[]>([])
  const [linkedItems, setLinkedItems] = useState<LinkedItem[]>([])
  
  const fetchLinkedData = useCallback(async () => {
    const supabase = createClient()
    
    // Fetch linked POs
    const { data: pos, error: posError } = await supabase
      .from("maintenance_purchase_orders")
      .select("*, purchase_orders(id, order_number, supplier_name, order_date, total, notes)")
      .eq("maintenance_id", maintenanceId)

    if (posError) {
      console.error("Error fetching linked POs:", posError)
      return
    }
    setLinkedPOs(pos as any)

    // Fetch linked Items
    const { data: items, error: itemsError } = await supabase
      .from("maintenance_purchase_order_items")
      .select("*, purchase_order_items(id, description, quantity, unit_price, total)")
      .eq("maintenance_id", maintenanceId)

    if (itemsError) {
      console.error("Error fetching linked items:", itemsError)
      return
    }
    setLinkedItems(items as any)
  }, [maintenanceId])

  useEffect(() => {
    if (open) {
      fetchLinkedData()
    }
  }, [open, fetchLinkedData])

  const handleLink = async (data: SelectedPOData) => {
    setLoading(true)
    const supabase = createClient()

    try {
      let amountToLink = data.allocatedAmount
      const itemIds = Object.keys(data.selectedItems)
      
      if (itemIds.length > 0 && data.po.items) {
         let subtotal = 0
         itemIds.forEach(id => {
             const item = data.po.items?.find(i => i.id === id)
             if (item) subtotal += (item.unit_price || 0) * data.selectedItems[id]
         })
         
         if (data.po.iva_applied && data.po.iva_percent) {
             amountToLink = subtotal * (1 + data.po.iva_percent / 100)
         } else {
             amountToLink = subtotal
         }
      }

      // 1. Link Header
      const { error: headerError } = await supabase
        .from("maintenance_purchase_orders")
        .insert({
          maintenance_id: maintenanceId,
          purchase_order_id: data.po.id,
          allocated_amount: amountToLink,
        })

      if (headerError) throw headerError

      // 2. Link Items if selected
      const itemsToLink = Object.entries(data.selectedItems).map(([itemId, quantity]) => ({
        maintenance_id: maintenanceId,
        purchase_order_item_id: itemId,
        quantity_used: quantity,
      }))

      if (itemsToLink.length > 0) {
        const { error: itemsError } = await supabase
          .from("maintenance_purchase_order_items")
          .insert(itemsToLink)
        
        if (itemsError) throw itemsError
      }

      toast({
        title: "Vinculación exitosa",
        description: "La orden de compra ha sido vinculada correctamente",
      })

      fetchLinkedData()
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error("Error linking PO:", error)
      toast({
        title: "Error",
        description: "No se pudo vincular la orden de compra",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUnlink = async (linkId: string) => {
    if (!confirm("¿Estás seguro de desvincular esta orden?")) return

    const supabase = createClient()
    const { error } = await supabase
      .from("maintenance_purchase_orders")
      .delete()
      .eq("id", linkId)

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo desvincular",
        variant: "destructive",
      })
    } else {
      fetchLinkedData()
      if (onUpdate) onUpdate()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <LinkIcon className="h-4 w-4" />
          Vincular OC
          {linkedPOs.length > 0 && <Badge variant="secondary" className="ml-1">{linkedPOs.length}</Badge>}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Vincular Orden de Compra</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {/* Linked POs List */}
          {linkedPOs.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground">Órdenes Vinculadas</h3>
              {linkedPOs.map((link) => (
                <div key={link.id} className="border rounded-lg p-3 space-y-2 bg-muted/20">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-sm">{link.purchase_orders.order_number}</p>
                      <p className="text-xs text-muted-foreground">{link.purchase_orders.supplier_name}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleUnlink(link.id)}>
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Asignado: </span>
                    <span className="font-medium">${link.allocated_amount.toLocaleString()}</span>
                  </div>
                  
                  {/* Linked Items for this PO */}
                  {linkedItems.some(item => item.purchase_order_items && link.purchase_orders.items?.some(poItem => poItem.id === item.purchase_order_item_id)) && (
                     <div className="mt-2 pl-2 border-l-2 border-primary/20">
                       <p className="text-xs font-medium mb-1">Ítems vinculados:</p>
                       {linkedItems
                         .filter(item => link.purchase_orders.items?.some(poItem => poItem.id === item.purchase_order_item_id))
                         .map(item => (
                           <div key={item.id} className="text-xs flex justify-between">
                             <span>{item.purchase_order_items.description} (x{item.quantity_used})</span>
                           </div>
                         ))
                       }
                     </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="border-t pt-4">
            <h3 className="font-medium mb-3">Nueva Vinculación</h3>
            <PurchaseOrderSelector 
              onSelect={handleLink}
              selectedPOs={linkedPOs.map(l => ({ 
                po: l.purchase_orders, 
                allocatedAmount: l.allocated_amount, 
                selectedItems: {} 
              }))} 
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
