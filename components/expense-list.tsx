"use client"

import React from "react"

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
import { Textarea } from "@/components/ui/textarea"
import { canEditFinance } from "@/lib/auth/roles"
import { createClient } from "@/lib/supabase/client"

interface Expense {
  id: string
  date: string
  category: string
  description: string
  amount: number
  supplier_id: string | null
  suppliers: {
    id: string
    name: string
  } | null
  payment_method: string
  invoice_number: string | null
  status: string
  notes: string | null
}

interface Supplier {
  id: string
  name: string
}

export function ExpenseList({
  expenses,
  suppliers,
  userRole,
}: {
  expenses: Expense[]
  suppliers: Supplier[]
  userRole: string | null
}) {
  const router = useRouter()
  const [showDialog, setShowDialog] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("maintenance")
  const [statusFilter, setStatusFilter] = useState("pending")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const canEdit = canEditFinance(userRole)

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense)
    setShowDialog(true)
  }

  const handleSuccess = () => {
    setShowDialog(false)
    setEditingExpense(null)
    router.refresh()
  }

  // Filter expenses
  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch =
      searchTerm === "" ||
      expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.suppliers?.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = categoryFilter === "all" || expense.category === categoryFilter
    const matchesStatus = statusFilter === "all" || expense.status === statusFilter

    const expenseDate = new Date(expense.date)
    const matchesStartDate = !startDate || expenseDate >= new Date(startDate)
    const matchesEndDate = !endDate || expenseDate <= new Date(endDate)

    return matchesSearch && matchesCategory && matchesStatus && matchesStartDate && matchesEndDate
  })

  // Calculate statistics
  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  const paidExpenses = filteredExpenses.filter((e) => e.status === "paid").reduce((sum, e) => sum + e.amount, 0)
  const pendingExpenses = filteredExpenses.filter((e) => e.status === "pending").reduce((sum, e) => sum + e.amount, 0)

  const categories = Array.from(new Set(expenses.map((e) => e.category))).sort()

  return (
    <div className="space-y-6">
      {/* Create Button */}
      {canEdit && (
        <div className="flex justify-end">
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button className="bg-[#0038ae] hover:bg-[#0038ae]/90">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Registrar Gasto
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingExpense ? "Editar Gasto" : "Nuevo Gasto"}</DialogTitle>
              </DialogHeader>
              <ExpenseForm expense={editingExpense} suppliers={suppliers} onSuccess={handleSuccess} />
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total de Gastos</CardDescription>
            <CardTitle className="text-3xl">${totalExpenses.toLocaleString("es-AR")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{filteredExpenses.length} registros</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pagados</CardDescription>
            <CardTitle className="text-3xl text-green-600">${paidExpenses.toLocaleString("es-AR")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {filteredExpenses.filter((e) => e.status === "paid").length} gastos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pendientes</CardDescription>
            <CardTitle className="text-3xl text-orange-600">${pendingExpenses.toLocaleString("es-AR")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {filteredExpenses.filter((e) => e.status === "pending").length} gastos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Promedio</CardDescription>
            <CardTitle className="text-3xl">
              ${filteredExpenses.length > 0 ? (totalExpenses / filteredExpenses.length).toLocaleString("es-AR", { maximumFractionDigits: 0 }) : 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Por gasto</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Label>Búsqueda</Label>
              <Input
                placeholder="Buscar por descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div>
              <Label>Categoría</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Estado</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="paid">Pagado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Fecha Desde</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>

            <div>
              <Label>Fecha Hasta</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Gastos Registrados</CardTitle>
          <CardDescription>Lista completa de gastos de la empresa</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredExpenses.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">
              {expenses.length === 0 ? "No hay gastos registrados" : "No se encontraron gastos con los filtros aplicados"}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead>Método de Pago</TableHead>
                    <TableHead>N° Factura</TableHead>
                    <TableHead>Estado</TableHead>
                    {canEdit && <TableHead className="text-right">Acciones</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="whitespace-nowrap">
                        {new Date(expense.date).toLocaleDateString("es-AR")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{expense.category}</Badge>
                      </TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell>{expense.suppliers?.name || "-"}</TableCell>
                      <TableCell className="text-right font-medium">${expense.amount.toLocaleString("es-AR")}</TableCell>
                      <TableCell className="capitalize">{expense.payment_method}</TableCell>
                      <TableCell>{expense.invoice_number || "-"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            expense.status === "paid"
                              ? "default"
                              : expense.status === "pending"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {expense.status === "paid" ? "Pagado" : expense.status === "pending" ? "Pendiente" : "Cancelado"}
                        </Badge>
                      </TableCell>
                      {canEdit && (
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(expense)}>
                            Editar
                          </Button>
                        </TableCell>
                      )}
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

function ExpenseForm({
  expense,
  suppliers,
  onSuccess,
}: {
  expense: Expense | null
  suppliers: Supplier[]
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    date: expense?.date || new Date().toISOString().split("T")[0],
    category: expense?.category || "maintenance",
    description: expense?.description || "",
    amount: expense?.amount || 0,
    supplier_id: expense?.supplier_id || "",
    payment_method: expense?.payment_method || "cash",
    invoice_number: expense?.invoice_number || "",
    status: expense?.status || "pending",
    notes: expense?.notes || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()

      const dataToSubmit = {
        ...formData,
        supplier_id: formData.supplier_id || null,
        invoice_number: formData.invoice_number || null,
        notes: formData.notes || null,
      }

      if (expense) {
        const { error } = await supabase.from("expenses").update(dataToSubmit).eq("id", expense.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from("expenses").insert(dataToSubmit)
        if (error) throw error
      }

      onSuccess()
    } catch (error) {
      console.error("Error saving expense:", error)
      alert("Error al guardar el gasto")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="date">Fecha</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
        </div>

        <div>
          <Label htmlFor="category">Categoría</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="maintenance">Mantenimiento</SelectItem>
              <SelectItem value="fuel">Combustible</SelectItem>
              <SelectItem value="parts">Repuestos</SelectItem>
              <SelectItem value="insurance">Seguros</SelectItem>
              <SelectItem value="administrative">Administrativos</SelectItem>
              <SelectItem value="salary">Salarios</SelectItem>
              <SelectItem value="other">Otros</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Descripción</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Descripción del gasto"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="amount">Monto</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
            required
          />
        </div>

        <div>
          <Label htmlFor="supplier_id">Proveedor (opcional)</Label>
          <Select value={formData.supplier_id} onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar proveedor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Sin proveedor</SelectItem>
              {suppliers.map((supplier) => (
                <SelectItem key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="payment_method">Método de Pago</Label>
          <Select
            value={formData.payment_method}
            onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Efectivo</SelectItem>
              <SelectItem value="transfer">Transferencia</SelectItem>
              <SelectItem value="check">Cheque</SelectItem>
              <SelectItem value="credit_card">Tarjeta de Crédito</SelectItem>
              <SelectItem value="debit_card">Tarjeta de Débito</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="invoice_number">N° Factura (opcional)</Label>
          <Input
            id="invoice_number"
            value={formData.invoice_number}
            onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
            placeholder="Ej: A-0001-00001234"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="status">Estado</Label>
        <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="paid">Pagado</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="notes">Notas (opcional)</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Notas adicionales sobre el gasto"
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={loading} className="bg-[#0038ae] hover:bg-[#0038ae]/90">
          {loading ? "Guardando..." : expense ? "Actualizar Gasto" : "Registrar Gasto"}
        </Button>
      </div>
    </form>
  )
}

export default ExpenseList
