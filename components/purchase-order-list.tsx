"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PurchaseOrderForm } from "@/components/purchase-order-form"
import { canEditFinance } from "@/lib/auth/roles"
import { downloadPurchaseOrderPDF } from "@/lib/pdf/purchase-order-pdf"

interface Supplier {
  id: string
  name: string
  cuit: string
}

interface PurchaseOrderItem {
  id: string
  item_number: number
  code: string
  description: string
  quantity: number
  unit_price: number
  total_item: number
}

interface PurchaseOrder {
  id: string
  po_number: string
  supplier_id: string
  issue_date: string
  delivery_address: string
  delivery_location: string
  delivery_province: string
  delivery_date: string | null
  payment_terms: string
  total: number
  status: string
  notes: string | null
  created_at: string
  suppliers: Supplier
  purchase_order_items: PurchaseOrderItem[]
}

export function PurchaseOrderList({
  purchaseOrders,
  suppliers,
  userRole,
}: {
  purchaseOrders: PurchaseOrder[]
  suppliers: Supplier[]
  userRole: string | null
}) {
  const router = useRouter()
  const [showDialog, setShowDialog] = useState(false)
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null)

  // Filter states
  const [searchFilter, setSearchFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [supplierFilter, setSupplierFilter] = useState("all")
  const [dateFromFilter, setDateFromFilter] = useState("")
  const [dateToFilter, setDateToFilter] = useState("")

  const canEdit = canEditFinance(userRole)

  // Apply filters
  const filteredOrders = purchaseOrders.filter((order) => {
    const matchesSearch =
      !searchFilter ||
      order.po_number.toLowerCase().includes(searchFilter.toLowerCase()) ||
      order.suppliers.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      order.delivery_address.toLowerCase().includes(searchFilter.toLowerCase())

    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    const matchesSupplier = supplierFilter === "all" || order.supplier_id === supplierFilter

    const matchesDateFrom = !dateFromFilter || new Date(order.issue_date) >= new Date(dateFromFilter)
    const matchesDateTo = !dateToFilter || new Date(order.issue_date) <= new Date(dateToFilter)

    return matchesSearch && matchesStatus && matchesSupplier && matchesDateFrom && matchesDateTo
  })

  // Calculate statistics
  const totalOrders = filteredOrders.length
  const pendingOrders = filteredOrders.filter((o) => o.status === "pending").length
  const approvedOrders = filteredOrders.filter((o) => o.status === "approved").length
  const totalAmount = filteredOrders.reduce((sum, o) => sum + o.total, 0)

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "secondary", label: "Pendiente" },
      approved: { variant: "default", label: "Aprobada" },
      received: { variant: "outline", label: "Recibida" },
      cancelled: { variant: "destructive", label: "Cancelada" },
    }
    const config = variants[status] || { variant: "outline", label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const handleEdit = (order: PurchaseOrder) => {
    setEditingOrder(order)
    setShowDialog(true)
  }

  const handleSuccess = () => {
    setShowDialog(false)
    setEditingOrder(null)
    router.refresh()
  }

  const handleDownloadPDF = async (order: PurchaseOrder) => {
    const pdfData = {
      order_number: order.po_number,
      date: order.issue_date,
      supplier_name: order.suppliers.name,
      supplier_cuit: order.suppliers.cuit,
      supplier_address: order.delivery_address,
      supplier_locality: order.delivery_location,
      supplier_province: order.delivery_province,
      supplier_phone: "",
      supplier_email: "",
      supplier_iva_condition: "IVA RESPONSABLE INSCRIPTO",
      supplier_number: "",
      subtotal: order.total,
      iva_amount: 0,
      total: order.total,
      currency: "USD",
      notes: order.notes || "",
      status: order.status,
      items: order.purchase_order_items.map((item) => ({
        id: item.id,
        code: item.code,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total_item,
      })),
    }
    await downloadPurchaseOrderPDF(pdfData)
  }

  const uniqueSuppliers = Array.from(new Set(purchaseOrders.map((o) => o.suppliers)))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2">Órdenes de Compra</h2>
          <p className="text-muted-foreground">Gestión completa de órdenes de compra</p>
        </div>
        {canEdit && (
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button
                className="bg-[#0038ae] hover:bg-[#0038ae]/90"
                onClick={() => {
                  setEditingOrder(null)
                }}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nueva Orden
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingOrder ? "Editar Orden de Compra" : "Nueva Orden de Compra"}</DialogTitle>
              </DialogHeader>
              <PurchaseOrderForm
                suppliers={suppliers}
                existingOrder={editingOrder}
                onSuccess={handleSuccess}
                onCancel={() => {
                  setShowDialog(false)
                  setEditingOrder(null)
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Búsqueda</Label>
              <Input
                id="search"
                placeholder="Nº Orden, Proveedor..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="approved">Aprobada</SelectItem>
                  <SelectItem value="received">Recibida</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier">Proveedor</Label>
              <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {uniqueSuppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateFrom">Fecha desde</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFromFilter}
                onChange={(e) => setDateFromFilter(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateTo">Fecha hasta</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateToFilter}
                onChange={(e) => setDateToFilter(e.target.value)}
              />
            </div>
          </div>
          {(searchFilter || statusFilter !== "all" || supplierFilter !== "all" || dateFromFilter || dateToFilter) && (
            <div className="mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchFilter("")
                  setStatusFilter("all")
                  setSupplierFilter("all")
                  setDateFromFilter("")
                  setDateToFilter("")
                }}
              >
                Limpiar filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Órdenes</CardDescription>
            <CardTitle className="text-4xl">{totalOrders}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Filtradas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pendientes</CardDescription>
            <CardTitle className="text-4xl">{pendingOrders}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{approvedOrders} aprobadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Monto Total</CardDescription>
            <CardTitle className="text-4xl">${totalAmount.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">De órdenes filtradas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Proveedores</CardDescription>
            <CardTitle className="text-4xl">{uniqueSuppliers.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Únicos</p>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de Órdenes</CardTitle>
          <CardDescription>Todas las órdenes de compra registradas</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">
              {purchaseOrders.length === 0
                ? "No hay órdenes de compra registradas"
                : "No se encontraron órdenes con los filtros aplicados"}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº Orden</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Dirección Entrega</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono">{order.po_number}</TableCell>
                      <TableCell>{new Date(order.issue_date).toLocaleDateString("es-AR")}</TableCell>
                      <TableCell>{order.suppliers.name}</TableCell>
                      <TableCell className="max-w-xs truncate">{order.delivery_address}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="text-right font-medium">${order.total.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleDownloadPDF(order)} title="Descargar PDF">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                          </Button>
                          {canEdit && (
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(order)}>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default PurchaseOrderList
