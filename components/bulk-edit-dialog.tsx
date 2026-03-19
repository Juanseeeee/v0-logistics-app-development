"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { L2Trip } from "@/types/l2-trip"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface BulkEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedTripIds: string[]
  onSuccess: () => void
  mode?: "full" | "billing" | "settlement"
}

export function BulkEditDialog({ open, onOpenChange, selectedTripIds, onSuccess, mode = "full" }: BulkEditDialogProps) {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [errorLog, setErrorLog] = useState<string[]>([])
  
  // Form fields - Billing
  const [clientInvoicePassed, setClientInvoicePassed] = useState(false)
  const [clientInvoiceNumber, setClientInvoiceNumber] = useState("")
  const [clientInvoiceDate, setClientInvoiceDate] = useState("")
  const [clientPaymentDate, setClientPaymentDate] = useState("")
  const [clientFcaNumber, setClientFcaNumber] = useState("")
  const [clientPaymentStatus, setClientPaymentStatus] = useState("")

  // Form fields - Settlement
  const [thirdPartyPaymentStatus, setThirdPartyPaymentStatus] = useState("")
  const [thirdPartyPaymentDate, setThirdPartyPaymentDate] = useState("")
  const [thirdPartyInvoice, setThirdPartyInvoice] = useState("")

  const handleUpdate = async () => {
    // Validations
    if (mode === "billing" || mode === "full") {
      // If invoice number is provided, date is mandatory
      if (clientInvoiceNumber.trim() && !clientInvoiceDate) {
        toast.error("Si ingresa N° de comprobante, la fecha es obligatoria")
        return
      }

      const today = new Date()
      if (clientInvoiceDate) {
        const invoiceDate = new Date(clientInvoiceDate)
        if (invoiceDate > today) {
          toast.error("La fecha pasada no puede ser futura")
          return
        }

        if (clientPaymentDate) {
          const paymentDate = new Date(clientPaymentDate)
          if (paymentDate < invoiceDate) {
            toast.error("La fecha de cobro debe ser igual o posterior a la fecha pasada")
            return
          }
        }
      }
    }

    if (mode === "settlement" || mode === "full") {
       // Validations for settlement if needed
    }


    // Confirmation
    if (!confirm(`¿Está seguro de actualizar ${selectedTripIds.length} viajes con estos datos? Esta acción no se puede deshacer fácilmente.`)) {
      return
    }

    setLoading(true)
    setProgress(0)
    setErrorLog([])

    const supabase = createClient()
    const batchSize = 10 // Update in chunks to avoid timeouts/limits
    const totalBatches = Math.ceil(selectedTripIds.length / batchSize)
    let processedCount = 0
    let successCount = 0
    let failedCount = 0
    const errors: string[] = []

    try {
      // 1. Fetch original data for potential rollback
      let originalData: L2Trip[] = []
      const { data, error: fetchError } = await supabase
        .from("l2_trips")
        .select("*")
        .in("id", selectedTripIds)

      if (fetchError) throw new Error(`Error fetching original data: ${fetchError.message}`)
      originalData = data || []

      // Prepare update object
    const updateData: Partial<L2Trip> = {
      updated_at: new Date().toISOString()
    }

    if (mode === "billing" || mode === "full") {
      // Only update fields if they are provided (or if we want to enforce clearing, but here we assume additive/corrective)
      // Special case: Invoice Passed is a boolean. If user interacts with it, we might want to update. 
      // But for bulk, usually we want to set it to TRUE or FALSE explicitly.
      // Let's assume if the user is in Billing mode, they might want to set this.
      // However, to avoid accidental overwrites, maybe we only update it if clientInvoiceNumber is also set?
      // Or just always update it? The UI has a Switch. 
      // Let's make it so that we update it.
      updateData.client_invoice_passed = clientInvoicePassed
      
      if (clientInvoiceNumber) updateData.client_invoice_number = clientInvoiceNumber
      if (clientInvoiceDate) updateData.client_invoice_date = clientInvoiceDate
      if (clientPaymentStatus) updateData.client_payment_status = clientPaymentStatus
      if (clientPaymentDate) updateData.client_payment_date = clientPaymentDate
      if (clientFcaNumber) updateData.client_fca_number = clientFcaNumber
    }

    if (mode === "settlement" || mode === "full") {
      if (thirdPartyPaymentStatus) updateData.third_party_payment_status = thirdPartyPaymentStatus
      if (thirdPartyPaymentDate) updateData.third_party_payment_date = thirdPartyPaymentDate
      if (thirdPartyInvoice) updateData.third_party_invoice = thirdPartyInvoice
    }

      // Process in batches
      for (let i = 0; i < selectedTripIds.length; i += batchSize) {
        const batchIds = selectedTripIds.slice(i, i + batchSize)
        
        let error = null

        // Update mode
        const { error: updateError } = await supabase
          .from("l2_trips")
          .update(updateData)
          .in("id", batchIds)
        error = updateError

        if (error) {
          console.error(`Error processing batch ${i}:`, error)
          errors.push(`Error en lote ${Math.floor(i/batchSize) + 1}: ${error.message}`)
          failedCount += batchIds.length
          
          // Attempt rollback for previously successful batches
          if (successCount > 0) {
            const rollbackIds = selectedTripIds.slice(0, i)
            
            // Rollback is upsert original data
            const rollbackData = originalData?.filter(d => rollbackIds.includes(d.id)) || []
            if (rollbackData.length > 0) {
              const { error: rollbackError } = await supabase
                .from("l2_trips")
                .upsert(rollbackData)
              
              if (rollbackError) {
                errors.push(`FALLO CRÍTICO EN ROLLBACK: ${rollbackError.message}`)
              } else {
                errors.push("Se realizó rollback de los cambios exitosos previos.")
                successCount = 0 
              }
            }
          }
          break // Stop processing further batches
        } else {
          successCount += batchIds.length
        }

        processedCount += batchIds.length
        setProgress(Math.round((processedCount / selectedTripIds.length) * 100))
      }

      // Log operation
      await supabase.from("bulk_operations_logs").insert({
        operation_type: "bulk_edit",
        trip_ids: selectedTripIds,
        details: {
          update_data: updateData,
          success_count: successCount,
          failed_count: failedCount,
          errors: errors
        }
      })

      if (failedCount > 0) {
        setErrorLog(errors)
        toast.warning(`Proceso finalizado con errores.`)
      } else {
        toast.success(`Se actualizaron exitosamente ${successCount} viajes`)
        onSuccess()
        onOpenChange(false)
      }

    } catch (err: any) {
      console.error("Critical error during bulk update:", err)
      toast.error("Error crítico durante la actualización")
      setErrorLog((prev) => [...prev, `Error crítico: ${err.message}`])
    } finally {
      setLoading(false)
    }
  }

  const getTitle = () => {
    switch (mode) {
      case "billing": return "Facturación Masiva"
      case "settlement": return "Liquidación Masiva"
      default: return "Facturar y Liquidar Masivamente"
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !loading && onOpenChange(val)}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>
            Se actualizarán {selectedTripIds.length} viajes seleccionados.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Progress Bar */}
          {loading && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Procesando...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Billing Section */}
          {(mode === "billing" || mode === "full") && (
            <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
              <h3 className="font-medium flex items-center gap-2">
                <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">Cliente</span>
                Datos de Facturación
              </h3>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="passed" className="flex flex-col gap-1">
                  <span>Pasada</span>
                  <span className="text-xs font-normal text-muted-foreground">Marcar como pasada al cliente</span>
                </Label>
                <Switch
                  id="passed"
                  checked={clientInvoicePassed}
                  onCheckedChange={setClientInvoicePassed}
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoice-number">N° Comprobante</Label>
                  <Input
                    id="invoice-number"
                    value={clientInvoiceNumber}
                    onChange={(e) => setClientInvoiceNumber(e.target.value)}
                    placeholder="Ej: A-0001-12345678"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoice-date">Fecha Pasada</Label>
                  <Input
                    id="invoice-date"
                    type="date"
                    value={clientInvoiceDate}
                    onChange={(e) => setClientInvoiceDate(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fca-number">NRO FCA</Label>
                  <Input
                    id="fca-number"
                    value={clientFcaNumber}
                    onChange={(e) => setClientFcaNumber(e.target.value)}
                    placeholder="Opcional"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment-status">Estado Pago</Label>
                  <Select 
                    value={clientPaymentStatus} 
                    onValueChange={setClientPaymentStatus}
                    disabled={loading}
                  >
                    <SelectTrigger id="payment-status">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDIENTE">PENDIENTE</SelectItem>
                      <SelectItem value="PARCIAL">PARCIAL</SelectItem>
                      <SelectItem value="COBRADO">COBRADO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-date">Fecha de Cobro</Label>
                <Input
                  id="payment-date"
                  type="date"
                  value={clientPaymentDate}
                  onChange={(e) => setClientPaymentDate(e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">Opcional. Debe ser posterior a la fecha pasada.</p>
              </div>
            </div>
          )}

          {/* Settlement Section */}
          {(mode === "settlement" || mode === "full") && (
            <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
              <h3 className="font-medium flex items-center gap-2">
                <span className="bg-orange-600 text-white text-xs px-2 py-0.5 rounded">Tercero</span>
                Datos de Liquidación
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <Label htmlFor="tp-payment-status">Estado Pago</Label>
                   <Select 
                     value={thirdPartyPaymentStatus} 
                     onValueChange={setThirdPartyPaymentStatus}
                     disabled={loading}
                   >
                     <SelectTrigger id="tp-payment-status">
                       <SelectValue placeholder="Seleccionar..." />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="IMPAGO">IMPAGO</SelectItem>
                       <SelectItem value="PAGADO">PAGADO</SelectItem>
                       <SelectItem value="PARCIAL">PARCIAL</SelectItem>
                     </SelectContent>
                   </Select>
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="tp-invoice">N° Factura Tercero</Label>
                  <Input
                    id="tp-invoice"
                    value={thirdPartyInvoice}
                    onChange={(e) => setThirdPartyInvoice(e.target.value)}
                    placeholder="Opcional"
                    disabled={loading}
                  />
                </div>
              </div>

               <div className="space-y-2">
                <Label htmlFor="tp-payment-date">Fecha de Pago</Label>
                <Input
                  id="tp-payment-date"
                  type="date"
                  value={thirdPartyPaymentDate}
                  onChange={(e) => setThirdPartyPaymentDate(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {/* Error Log */}
          {errorLog.length > 0 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800 max-h-32 overflow-y-auto">
              <div className="flex items-center gap-2 mb-2 font-semibold">
                <AlertCircle className="h-4 w-4" />
                Errores detectados:
              </div>
              <ul className="list-disc pl-4 space-y-1">
                {errorLog.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleUpdate} 
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar Actualización
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
