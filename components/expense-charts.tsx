"use client"

import React, { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"

const COLORS = ["#0038ae", "#10b981", "#f59e0b", "#f43f5e", "#ef4444", "#8b5cf6", "#6366f1", "#0ea5e9"]

interface Expense {
  id: string
  date: string
  category: string
  amount: number
  status: string
  payment_method: string
  suppliers: {
    id: string
    name: string
  } | null
}

export function ExpenseCharts({ expenses, l2Trips = [] }: { expenses: Expense[], l2Trips?: any[] }) {
  const chartData = useMemo(() => {
    // Gastos Logic
    // 1. Gastos por Categoría
    const byCategory = expenses.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount
      return acc
    }, {} as Record<string, number>)

    const categoryData = Object.entries(byCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    // Sort expenses chronologically for time-based charts
    const sortedExpenses = [...expenses].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // 2. Gastos por Mes
    const byMonth = sortedExpenses.reduce((acc, curr) => {
      const month = format(parseISO(curr.date), "MMM yyyy", { locale: es })
      acc[month] = (acc[month] || 0) + curr.amount
      return acc
    }, {} as Record<string, number>)

    const monthlyData = Object.entries(byMonth).map(([name, value]) => ({ name, Gasto: value }))

    // 3. Gastos por Estado
    const byStatus = expenses.reduce((acc, curr) => {
      const statusName = curr.status === "paid" ? "Pagado" : curr.status === "pending" ? "Pendiente" : "Cancelado"
      acc[statusName] = (acc[statusName] || 0) + curr.amount
      return acc
    }, {} as Record<string, number>)

    const statusData = Object.entries(byStatus).map(([name, value]) => ({ name, value }))

    // 4. Gastos por Método de Pago
    const byPaymentMethod = expenses.reduce((acc, curr) => {
      const methods: Record<string, string> = {
        cash: "Efectivo",
        transfer: "Transferencia",
        check: "Cheque",
        credit_card: "Tarjeta de Crédito",
        debit_card: "Tarjeta de Débito",
      }
      const methodName = methods[curr.payment_method] || curr.payment_method
      acc[methodName] = (acc[methodName] || 0) + curr.amount
      return acc
    }, {} as Record<string, number>)

    const paymentMethodData = Object.entries(byPaymentMethod)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    // 5. Top 5 Proveedores
    const bySupplier = expenses.reduce((acc, curr) => {
      const supplierName = curr.suppliers?.name || "Sin Proveedor"
      acc[supplierName] = (acc[supplierName] || 0) + curr.amount
      return acc
    }, {} as Record<string, number>)

    const supplierData = Object.entries(bySupplier)
      .map(([name, value]) => ({ name, Gasto: value }))
      .sort((a, b) => b.Gasto - a.Gasto)
      .slice(0, 5)

    // 6. Evolución Diaria (últimos 30 días con datos)
    const byDate = sortedExpenses.reduce((acc, curr) => {
      const date = format(parseISO(curr.date), "dd MMM", { locale: es })
      acc[date] = (acc[date] || 0) + curr.amount
      return acc
    }, {} as Record<string, number>)

    const dailyData = Object.entries(byDate)
      .map(([name, Gasto]) => ({ name, Gasto }))
      .slice(-30)

    // L2 Trips Logic (Client Stats)
    const sortedTrips = [...l2Trips].sort((a, b) => {
      const dateA = a.client_payment_date || a.client_invoice_date || a.invoice_date || a.payment_date || new Date().toISOString().split("T")[0]
      const dateB = b.client_payment_date || b.client_invoice_date || b.invoice_date || b.payment_date || new Date().toISOString().split("T")[0]
      return new Date(dateA).getTime() - new Date(dateB).getTime()
    })

    // C1: Ingresos y Ganancias por Cliente
    const byClientStats = l2Trips.reduce((acc, curr) => {
      const clientName = curr.clients?.company || "Sin Cliente"
      if (!acc[clientName]) acc[clientName] = { revenue: 0, profit: 0, tons: 0, trips: 0 }
      const revenue = Number(curr.trip_amount) || 0
      const cost = Number(curr.third_party_amount) || 0
      const tons = Number(curr.tons_delivered) || 0
      
      acc[clientName].revenue += revenue
      acc[clientName].profit += (revenue - cost)
      acc[clientName].tons += tons
      acc[clientName].trips += 1
      return acc
    }, {} as Record<string, { revenue: number, profit: number, tons: number, trips: number }>)

    const topClientsRevenueData = Object.entries(byClientStats)
      .map(([name, stats]) => ({ name, Ingresos: stats.revenue, Ganancia: stats.profit }))
      .sort((a, b) => b.Ingresos - a.Ingresos)
      .slice(0, 5)

    const topClientsTonsData = Object.entries(byClientStats)
      .map(([name, stats]) => ({ name, Toneladas: stats.tons }))
      .sort((a, b) => b.Toneladas - a.Toneladas)
      .slice(0, 5)

    // C2: Evolución de Ingresos Mensuales
    const byMonthRevenue = sortedTrips.reduce((acc, curr) => {
      const tripDate = curr.client_payment_date || curr.client_invoice_date || curr.invoice_date || curr.payment_date || new Date().toISOString().split("T")[0]
      const month = format(parseISO(tripDate), "MMM yyyy", { locale: es })
      acc[month] = (acc[month] || 0) + (Number(curr.trip_amount) || 0)
      return acc
    }, {} as Record<string, number>)
    
    const monthlyRevenueData = Object.entries(byMonthRevenue).map(([name, Ingresos]) => ({ name, Ingresos }))

    // C3: Viajes por Estado
    const tripsByStatus = l2Trips.reduce((acc, curr) => {
      const statusMap: Record<string, string> = {
        liquidado: "Liquidado",
        facturado: "Facturado",
        completado: "Completado",
      }
      const s = statusMap[curr.status] || curr.status || "Pendiente"
      acc[s] = (acc[s] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const tripsStatusData = Object.entries(tripsByStatus).map(([name, value]) => ({ name, value }))

    return {
      categoryData,
      monthlyData,
      statusData,
      paymentMethodData,
      supplierData,
      dailyData,
      topClientsRevenueData,
      topClientsTonsData,
      monthlyRevenueData,
      tripsStatusData,
    }
  }, [expenses, l2Trips])

  if (expenses.length === 0 && l2Trips.length === 0) {
    return null
  }

  const formatCurrency = (value: number) => `$${value.toLocaleString("es-AR")}`

  return (
    <div className="space-y-6 mb-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico 1: Evolución Mensual */}
        <Card>
          <CardHeader>
            <CardTitle>Evolución de Gastos Mensuales</CardTitle>
            <CardDescription>Total gastado por mes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: number) => [formatCurrency(value), "Gasto"]} />
                  <Bar dataKey="Gasto" fill="#0038ae" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico 2: Top Proveedores */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Proveedores</CardTitle>
            <CardDescription>Proveedores con mayor volumen de gasto</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.supplierData} layout="vertical" margin={{ left: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => [formatCurrency(value), "Gasto"]} />
                  <Bar dataKey="Gasto" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico 3: Gastos por Categoría */}
        <Card>
          <CardHeader>
            <CardTitle>Gastos por Categoría</CardTitle>
            <CardDescription>Distribución del gasto total</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [formatCurrency(value), "Gasto"]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico 4: Gastos por Estado */}
        <Card>
          <CardHeader>
            <CardTitle>Estado de Pagos</CardTitle>
            <CardDescription>Proporción de gastos pagados vs pendientes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.statusData.map((entry, index) => {
                      const color = entry.name === "Pagado" ? "#10b981" : entry.name === "Pendiente" ? "#f59e0b" : "#ef4444"
                      return <Cell key={`cell-${index}`} fill={color} />
                    })}
                  </Pie>
                  <Tooltip formatter={(value: number) => [formatCurrency(value), "Monto"]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico 5: Métodos de Pago */}
        <Card>
          <CardHeader>
            <CardTitle>Métodos de Pago</CardTitle>
            <CardDescription>Medios utilizados para cancelar gastos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.paymentMethodData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: number) => [formatCurrency(value), "Monto"]} />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                    {chartData.paymentMethodData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico 6: Evolución Diaria (Línea) */}
        <Card>
          <CardHeader>
            <CardTitle>Flujo de Gastos (Últimos Días)</CardTitle>
            <CardDescription>Evolución del gasto diario</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: number) => [formatCurrency(value), "Gasto"]} />
                  <Line type="monotone" dataKey="Gasto" stroke="#0038ae" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico 7: Ingresos Mensuales */}
        {chartData.monthlyRevenueData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Ingresos Mensuales por Viajes</CardTitle>
              <CardDescription>Facturación total por mes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.monthlyRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value: number) => [formatCurrency(value), "Ingresos"]} />
                    <Bar dataKey="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Gráfico 8: Top Clientes por Ingresos */}
        {chartData.topClientsRevenueData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Top Clientes (Ingresos y Ganancias)</CardTitle>
              <CardDescription>Los 5 clientes con mayor volumen de facturación</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.topClientsRevenueData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value: number) => [formatCurrency(value), ""]} />
                    <Legend />
                    <Bar dataKey="Ingresos" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Ganancia" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Gráfico 9: Top Clientes por Toneladas */}
        {chartData.topClientsTonsData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Top Clientes por Toneladas</CardTitle>
              <CardDescription>Volumen de carga entregada (Top 5)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.topClientsTonsData} layout="vertical" margin={{ left: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value: number) => [`${value} tn`, "Toneladas"]} />
                    <Bar dataKey="Toneladas" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Gráfico 10: Estado de Viajes */}
        {chartData.tripsStatusData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Estado de los Viajes</CardTitle>
              <CardDescription>Distribución general de los viajes registrados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.tripsStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.tripsStatusData.map((entry, index) => {
                        const color = entry.name === "Facturado" ? "#10b981" : entry.name === "Liquidado" ? "#3b82f6" : entry.name === "Completado" ? "#f59e0b" : "#64748b"
                        return <Cell key={`cell-${index}`} fill={color} />
                      })}
                    </Pie>
                    <Tooltip formatter={(value: number) => [value, "Viajes"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
