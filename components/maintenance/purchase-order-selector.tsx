"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { PlusIcon } from "lucide-react"

export interface PurchaseOrder {
  id: string
  order_number: string
  supplier_name: string
  order_date: string
  total: number
  notes: string | null
  items?: PurchaseOrderItem[]
  iva_applied?: boolean
  iva_percent?: number
}

export interface PurchaseOrderItem {
  id: string
  description: string
  quantity: number
  unit_price: number
  total: number
}

export interface SelectedPOData {
  po: PurchaseOrder
  allocatedAmount: number
  selectedItems: { [key: string]: number } // itemId -> quantity
}

interface PurchaseOrderSelectorProps {
  onSelect: (data: SelectedPOData) => void
  selectedPOs?: SelectedPOData[]
}

export function PurchaseOrderSelector({ onSelect, selectedPOs = [] }: PurchaseOrderSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null)
  const [allocationAmount, setAllocationAmount] = useState<string>("")
  const [selectedItems, setSelectedItems] = useState<{ [key: string]: number }>({})

  useEffect(() => {
    // Initial fetch only
    handleSearch(true)
  }, [])

  const handleSearch = async (isInitial = false) => {
    setLoading(true)
    const supabase = createClient()
    
    // Base query
    let query = supabase
      .from("purchase_orders")
      .select("*, items:purchase_order_items(*)")
      .order("created_at", { ascending: false })
      .limit(5)

    if (searchTerm && !isInitial) {
      // If we have a search term, we want to filter
      // Since we can't easily do OR across tables with simple query, we'll try to match order_number
      query = query.ilike("order_number", `%${searchTerm}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error searching POs:", error)
    } else {
      setSearchResults(data as any)
    }
    setLoading(false)
  }

  // Effect to re-run search when searchTerm changes (debounce)
  useEffect(() => {
    // Skip if empty search term (initial load handles it, or clearing it returns to default)
    // If we want clearing to return to default list:
    
    const timeoutId = setTimeout(() => {
      handleSearch(false)
    }, 500)
    
    return () => clearTimeout(timeoutId)
  }, [searchTerm])


  const handleSelectPO = (po: PurchaseOrder) => {
    // Check if already selected in parent
    if (selectedPOs.some(p => p.po.id === po.id)) {
        alert("Esta orden de compra ya ha sido seleccionada")
        return
    }

    setSelectedPO(po)
    setAllocationAmount(po.total.toString())
    setSelectedItems({})
  }

  const handleConfirmSelection = () => {
    if (!selectedPO) return
    
    onSelect({
      po: selectedPO,
      allocatedAmount: parseFloat(allocationAmount) || 0,
      selectedItems
    })

    // Reset local selection
    setSelectedPO(null)
    setSearchTerm("")
    handleSearch(true) // Refresh recent list
  }

  return (
    <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
      {!selectedPO ? (
        <div className="space-y-3">
          <Label>Buscar Orden de Compra (Opcional)</Label>
          <div className="flex gap-2">
            <Input 
              placeholder="Buscar por número..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button type="button" onClick={() => handleSearch()} disabled={loading} variant="secondary">
              Buscar
            </Button>
          </div>
          
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {searchResults.map((po) => (
              <div key={po.id} className="flex items-center justify-between p-3 border rounded bg-background hover:bg-muted/50 cursor-pointer" onClick={() => handleSelectPO(po)}>
                <div>
                  <p className="font-medium">{po.order_number}</p>
                  <p className="text-xs text-muted-foreground">{po.supplier_name} - ${po.total.toLocaleString()}</p>
                </div>
                <PlusIcon className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
            {searchResults.length === 0 && !loading && (
              <p className="text-center text-sm text-muted-foreground py-2">
                {searchTerm ? "No se encontraron resultados" : "No hay órdenes recientes"}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4 bg-background p-4 rounded-lg border">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-bold">{selectedPO.order_number}</h4>
              <p className="text-sm text-muted-foreground">{selectedPO.supplier_name}</p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedPO(null)}>Cambiar</Button>
          </div>

          <div className="space-y-2">
            <Label>Monto a asignar</Label>
            <Input 
              type="number" 
              value={allocationAmount} 
              onChange={(e) => setAllocationAmount(e.target.value)}
            />
          </div>

          {selectedPO.items && selectedPO.items.length > 0 && (
            <div className="space-y-2">
              <Label>Vincular Ítems Específicos</Label>
              <div className="border rounded-md divide-y max-h-40 overflow-y-auto">
                {selectedPO.items.map(item => (
                  <div key={item.id} className="p-2 flex items-center gap-2 text-sm">
                    <Checkbox 
                      checked={!!selectedItems[item.id]}
                      onCheckedChange={(checked) => {
                        const newSelected = { ...selectedItems }
                        if (checked) {
                          newSelected[item.id] = item.quantity
                        } else {
                          delete newSelected[item.id]
                        }
                        setSelectedItems(newSelected)
                      }}
                    />
                    <div className="flex-1">
                      <p className="truncate">{item.description}</p>
                      <p className="text-xs text-muted-foreground">${item.unit_price} x {item.quantity}</p>
                    </div>
                    {selectedItems[item.id] && (
                      <Input 
                        type="number" 
                        className="w-16 h-7 text-xs" 
                        value={selectedItems[item.id]}
                        onChange={(e) => setSelectedItems({ ...selectedItems, [item.id]: parseFloat(e.target.value) })}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button type="button" className="w-full" onClick={handleConfirmSelection}>
            Confirmar Selección
          </Button>
        </div>
      )}
    </div>
  )
}
