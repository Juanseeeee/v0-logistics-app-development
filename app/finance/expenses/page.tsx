import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ExpenseList } from "@/components/expense-list"

export default async function ExpensesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/signin")
  }

  // Get user role
  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()

  const userRole = profile?.role

  // Check permissions
  if (userRole !== "admin" && userRole !== "owner" && userRole !== "manager") {
    redirect("/hub")
  }

  // Get all expenses
  const { data: manualExpenses } = await supabase
    .from("expenses")
    .select(`
      *,
      suppliers (
        id,
        name
      )
    `)
    .order("date", { ascending: false })

  // Get L2 trips for client statistics and to include as income
  const { data: l2Trips } = await supabase
    .from("l2_trips")
    .select("id, client_id, trip_amount, third_party_amount, invoice_date, payment_date, client_invoice_date, client_payment_date, third_party_payment_date, tons_delivered, clients(company)")

  // Get fuel records to include as expenses
  const { data: fuelRecords } = await supabase
    .from("fuel_records")
    .select("*")
    .order("date", { ascending: false })

  // Get maintenances to include as expenses
  const { data: maintenances } = await supabase
    .from("maintenances")
    .select("*, maintenance_types(name)")
    .eq("completed", true)
    .order("date", { ascending: false })

  // Merge all records into a single expenses array
  const expenses = [...(manualExpenses || [])]

  // Add L2 Trips as Income
  if (l2Trips) {
    l2Trips.forEach((trip) => {
      const revenue = Number(trip.trip_amount) || 0
      const cost = Number(trip.third_party_amount) || 0
      const profit = revenue - cost

      if (profit > 0) {
        let clientName = "Sin Cliente"
        if (trip.clients) {
          if (Array.isArray(trip.clients)) {
            clientName = trip.clients[0]?.company || "Sin Cliente"
          } else {
            clientName = trip.clients.company || "Sin Cliente"
          }
        }

        expenses.push({
          id: `l2-${trip.id}`,
          date: trip.client_payment_date || trip.client_invoice_date || trip.invoice_date || trip.payment_date || new Date().toISOString().split("T")[0],
          category: "L2 Viaje (Ganancia)",
          description: `Ganancia Viaje L2 - ${clientName}`,
          amount: profit,
          supplier_id: null,
          suppliers: null,
          payment_method: "transfer", // Default or unknown
          invoice_number: null,
          status: "paid", // Assuming completed/profit is realized
          notes: "Generado automáticamente desde viajes L2",
          source: "l2_trip",
          is_income: true,
        })
      }
    })
  }

  // Add Fuel Records as Expenses
  if (fuelRecords) {
    fuelRecords.forEach((record) => {
      if (record.cost > 0) {
        expenses.push({
          id: `fuel-${record.id}`,
          date: record.date,
          category: "fuel",
          description: `Combustible ${record.vehicle_patent ? `(${record.vehicle_patent})` : ""} - ${record.establishment || record.station || "Estación"}`,
          amount: Number(record.cost),
          supplier_id: null,
          suppliers: null,
          payment_method: "transfer", // Usually transfer/card
          invoice_number: record.invoice_number || record.receipt_number || null,
          status: "paid",
          notes: "Generado automáticamente desde registros de combustible",
          source: "fuel",
        })
      }
    })
  }

  // Add Maintenances as Expenses
  if (maintenances) {
    maintenances.forEach((m) => {
      if (m.cost > 0) {
        expenses.push({
          id: `maint-${m.id}`,
          date: m.date,
          category: "maintenance",
          description: `Mantenimiento: ${m.maintenance_types?.name || m.description}`,
          amount: Number(m.cost),
          supplier_id: null,
          suppliers: null,
          payment_method: "transfer",
          invoice_number: null,
          status: "paid",
          notes: "Generado automáticamente desde registros de mantenimiento",
          source: "maintenance",
        })
      }
    })
  }

  // Sort merged array by date descending
  expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link href="/finance" prefetch={false}>
                ← Volver a Finanzas
              </Link>
            </Button>
            <div className="h-6 w-px bg-border mx-2" />
            <h1 className="text-xl font-bold">Estadísticas y Control Financiero</h1>
          </div>
          <Link href="/auth/signout" prefetch={false}>
            <Button variant="ghost">Cerrar Sesión</Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <ExpenseList expenses={expenses || []} l2Trips={l2Trips || []} userRole={userRole} />
      </div>
    </div>
  )
}
