"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { L2Trip } from "@/types/l2-trip"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { AlertCircle, CheckCircle2, Loader2, FileText, MapPin, DollarSign } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

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
  const [tripsData, setTripsData] = useState<L2Trip[]>([])
  
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

  useEffect(() => {
    if (open && selectedTripIds.length > 0) {
      loadInitialData()
    } else {
      resetForm()
    }
  }, [open, selectedTripIds])

  const resetForm = () => {
    setClientInvoicePassed(false)
    setClientInvoiceNumber("")
    setClientInvoiceDate("")
    setClientPaymentDate("")
    setClientFcaNumber("")
    setClientPaymentStatus("")
    setThirdPartyPaymentStatus("")
    setThirdPartyPaymentDate("")
    setThirdPartyInvoice("")
    setErrorLog([])
    setProgress(0)
    setTripsData([])
  }

  const loadInitialData = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.from("l2_trips").select("*, clients(company), products(name)").in("id", selectedTripIds)
    
    if (data && data.length > 0) {
      setTripsData(data)
      
      // Billing common values
      const invNumbers = [...new Set(data.map(d => d.client_invoice_number).filter(Boolean))]
      if (invNumbers.length === 1) setClientInvoiceNumber(invNumbers[0])
      
      const invDates = [...new Set(data.map(d => d.client_invoice_date).filter(Boolean))]
      if (invDates.length === 1) setClientInvoiceDate(invDates[0])
      
      const payStatuses = [...new Set(data.map(d => d.client_payment_status).filter(Boolean))]
      if (payStatuses.length === 1) setClientPaymentStatus(payStatuses[0])

      const payDates = [...new Set(data.map(d => d.client_payment_date).filter(Boolean))]
      if (payDates.length === 1) setClientPaymentDate(payDates[0])

      const fcaNumbers = [...new Set(data.map(d => d.client_fca_number).filter(Boolean))]
      if (fcaNumbers.length === 1) setClientFcaNumber(fcaNumbers[0])

      const invoicePassed = data.every(d => d.client_invoice_passed)
      if (invoicePassed) setClientInvoicePassed(true)

      // Settlement common values
      const tpPayStatuses = [...new Set(data.map(d => d.third_party_payment_status).filter(Boolean))]
      if (tpPayStatuses.length === 1) setThirdPartyPaymentStatus(tpPayStatuses[0])

      const tpPayDates = [...new Set(data.map(d => d.third_party_payment_date).filter(Boolean))]
      if (tpPayDates.length === 1) setThirdPartyPaymentDate(tpPayDates[0])

      const tpInvoices = [...new Set(data.map(d => d.third_party_invoice).filter(Boolean))]
      if (tpInvoices.length === 1) setThirdPartyInvoice(tpInvoices[0])
    }
    setLoading(false)
  }

  const handleUpdate = async () => {
    // Validations
    if (mode === "billing" || mode === "full") {
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

      // Determine block IDs and dates
      const uniqueBillingIds = [...new Set(originalData.map(d => d.bulk_billing_id).filter(Boolean))]
      const keepBillingBlock = uniqueBillingIds.length === 1 && originalData.every(d => d.bulk_billing_id === uniqueBillingIds[0])
      
      const uniqueSettlementIds = [...new Set(originalData.map(d => d.bulk_settlement_id).filter(Boolean))]
      const keepSettlementBlock = uniqueSettlementIds.length === 1 && originalData.every(d => d.bulk_settlement_id === uniqueSettlementIds[0])

      // Prepare update object
    const updateData: Partial<L2Trip> & { updated_at?: string } = {
      updated_at: new Date().toISOString()
    }

    if (mode === "billing" || mode === "full") {
      updateData.client_invoice_passed = clientInvoicePassed
      if (!keepBillingBlock) {
        updateData.bulk_billing_id = crypto.randomUUID()
        updateData.bulk_billing_date = new Date().toISOString()
      }
      
      if (clientInvoiceNumber) updateData.client_invoice_number = clientInvoiceNumber
      if (clientInvoiceDate) updateData.client_invoice_date = clientInvoiceDate
      if (clientPaymentStatus) updateData.client_payment_status = clientPaymentStatus
      if (clientPaymentDate) updateData.client_payment_date = clientPaymentDate
      if (clientFcaNumber) updateData.client_fca_number = clientFcaNumber
    }

    if (mode === "settlement" || mode === "full") {
      if (!keepSettlementBlock) {
        updateData.bulk_settlement_id = crypto.randomUUID()
        updateData.bulk_settlement_date = new Date().toISOString()
      }
      if (thirdPartyPaymentStatus) updateData.third_party_payment_status = thirdPartyPaymentStatus
      if (thirdPartyPaymentDate) updateData.third_party_payment_date = thirdPartyPaymentDate
      if (thirdPartyInvoice) updateData.third_party_invoice = thirdPartyInvoice
    }

      // Process single transactional update
      const { error: updateError } = await supabase
        .from("l2_trips")
        .update(updateData)
        .in("id", selectedTripIds)

      if (updateError) {
        console.error(`Error processing bulk update:`, updateError)
        errors.push(`Error en la base de datos: ${updateError.message}`)
        failedCount = selectedTripIds.length
      } else {
        successCount = selectedTripIds.length
        processedCount = selectedTripIds.length
        setProgress(100)
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
        toast.error(`Error en la operación`, {
          description: `Se encontraron problemas al actualizar los viajes. Código de error: ERR_BULK_UPDATE_FAILED. Detalles: ${errors[0]}`,
        })
      } else {
        const operationId = crypto.randomUUID().split('-')[0].toUpperCase();
        const actionText = mode === "billing" ? "Facturación masiva" : mode === "settlement" ? "Liquidación masiva" : "Operación masiva"
        
        toast.success(`${actionText} exitosa`, {
          description: `Se actualizaron ${successCount} viajes. OP #${operationId}`,
        })
        onSuccess()
        onOpenChange(false)
      }

    } catch (err: any) {
      console.error("Critical error during bulk update:", err)
      toast.error("Error crítico durante la actualización", {
        description: `Ocurrió un error inesperado. ERR_CRITICAL. Detalle: ${err.message}`
      })
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
                  <span className="text-xs font-normal opacity-80">Marcar como pasada al cliente</span>
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
                  <Label htmlFor="invoice-number">
                    N° Comprobante
                  </Label>
                  <Input
                    id="invoice-number"
                    value={clientInvoiceNumber}
                    onChange={(e) => setClientInvoiceNumber(e.target.value)}
                    placeholder="Ej: A-0001-12345678"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoice-date">
                    Fecha Pasada
                  </Label>
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
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800 max-h-32 overflow-y-auto">
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

          {/* List of trips in the block */}
          {tripsData.length > 0 && (
            <div className="space-y-2 border rounded-lg overflow-hidden">
              <div className="bg-muted/50 px-4 py-2 border-b flex justify-between items-center">
                <h3 className="font-semibold text-sm">Viajes en este bloque ({tripsData.length})</h3>
              </div>
              <ScrollArea className="h-[250px] w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Origen</TableHead>
                      <TableHead>Destino</TableHead>
                      {mode === "billing" || mode === "full" ? (
                        <>
                          <TableHead>Monto Viaje</TableHead>
                          <TableHead>Estado Cobro</TableHead>
                        </>
                      ) : null}
                      {mode === "settlement" || mode === "full" ? (
                        <>
                          <TableHead>Monto Tercero</TableHead>
                          <TableHead>Estado Pago</TableHead>
                        </>
                      ) : null}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tripsData.map((trip) => (
                      <TableRow key={trip.id}>
                        <TableCell className="text-xs whitespace-nowrap">{trip.date?.split('-').reverse().join('/') || "-"}</TableCell>
                        <TableCell className="text-xs truncate max-w-[120px]">{trip.origin || "-"}</TableCell>
                        <TableCell className="text-xs truncate max-w-[120px]">{trip.destination || "-"}</TableCell>
                        
                        {mode === "billing" || mode === "full" ? (
                          <>
                            <TableCell className="text-xs">${Number(trip.trip_amount || 0).toLocaleString("es-AR")}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`text-[10px] ${trip.client_payment_status === 'COBRADO' ? 'bg-green-50 text-green-700' : ''}`}>
                                {trip.client_payment_status || "PENDIENTE"}
                              </Badge>
                            </TableCell>
                          </>
                        ) : null}

                        {mode === "settlement" || mode === "full" ? (
                          <>
                            <TableCell className="text-xs">${Number(trip.third_party_amount || 0).toLocaleString("es-AR")}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`text-[10px] ${trip.third_party_payment_status === 'PAGADO' ? 'bg-green-50 text-green-700' : ''}`}>
                                {trip.third_party_payment_status || "IMPAGO"}
                              </Badge>
                            </TableCell>
                          </>
                        ) : null}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
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
