import { createClient } from "@/lib/supabase/server"
import { HubChartsClient } from "./hub-charts-client"

export async function HubDashboard() {
  const supabase = await createClient()

  // 1. Fetch fuel records for the last 6 months
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  
  const { data: fuelRecords } = await supabase
    .from("fuel_records")
    .select("date, cost")
    .gte("date", sixMonthsAgo.toISOString().split("T")[0])

  // 2. Fetch trips for client profits and general stats
  const { data: trips, error: tripsError } = await supabase
    .from("l2_trips")
    .select("client_id, trip_amount, third_party_amount, invoice_date, payment_date, tons_delivered, clients(company)")

  if (tripsError) {
    console.error("Error fetching l2_trips:", tripsError)
  }

  // 3. Fetch upcoming maintenance alerts
  const { data: maintenanceAlerts } = await supabase
    .from("maintenance_alerts")
    .select("id, description, urgency_level, vehicle_id, vehicles(patent_chasis, vehicle_type)")
    .order("urgency_level", { ascending: true })
    .limit(5)

  // Process Fuel Data
  const monthlyFuelMap = new Map<string, number>()
  if (fuelRecords) {
    fuelRecords.forEach((record) => {
      const date = new Date(record.date)
      const monthYear = date.toLocaleString('es-ES', { month: 'short', year: '2-digit' })
      monthlyFuelMap.set(monthYear, (monthlyFuelMap.get(monthYear) || 0) + Number(record.cost || 0))
    })
  }
  const monthlyFuelData = Array.from(monthlyFuelMap.entries()).map(([month, cost]) => ({
    name: month,
    "Gastos": cost
  })).reverse() // Simple reverse or properly sort by date

  // Process Client Profits
  const clientProfitMap = new Map<string, number>()
  if (trips) {
    trips.forEach((trip: any) => {
      let clientName = "Desconocido"
      if (trip.clients) {
        if (Array.isArray(trip.clients)) {
          clientName = trip.clients[0]?.company || "Desconocido"
        } else {
          clientName = trip.clients.company || "Desconocido"
        }
      }
      const tripAmount = Number.parseFloat(trip.trip_amount) || 0
      const thirdPartyAmount = Number.parseFloat(trip.third_party_amount) || 0
      const profit = tripAmount - thirdPartyAmount
      clientProfitMap.set(clientName, (clientProfitMap.get(clientName) || 0) + profit)
    })
  }
  const clientProfitData = Array.from(clientProfitMap.entries())
    .map(([name, profit]) => ({ name, "Ganancia": profit }))
    .sort((a, b) => b["Ganancia"] - a["Ganancia"])
    .slice(0, 5) // Top 5 clients

  return (
    <HubChartsClient 
      monthlyFuelData={monthlyFuelData} 
      clientProfitData={clientProfitData} 
      upcomingMaintenances={maintenanceAlerts || []} 
    />
  )
}
