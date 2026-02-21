import { TableCell } from "@/components/ui/table"
import { TableBody } from "@/components/ui/table"
import { TableHead } from "@/components/ui/table"
import { TableRow } from "@/components/ui/table"
import { TableHeader } from "@/components/ui/table"
import { Table } from "@/components/ui/table"
import { CardContent } from "@/components/ui/card"
import { CardTitle } from "@/components/ui/card"
import { CardDescription } from "@/components/ui/card"
import { CardHeader } from "@/components/ui/card"
import { Card } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import FuelRecordsClient from "@/components/fuel-records-client"
import { FuelRecordListFiltered } from "@/components/fuel-record-list-filtered"

export default async function FuelRecordsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get all fuel records with all fields
  const { data: fuelRecords } = await supabase
    .from("fuel_records")
    .select("*")
    .order("date", { ascending: false })

  // Get all vehicles for the form
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id, patent_chasis, vehicle_type, kilometers")
    .order("patent_chasis")

return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link href="/fleet" prefetch={false}>
                ← Volver a Flota
              </Link>
            </Button>
            <div className="h-6 w-px bg-border mx-2" />
            <h1 className="text-xl font-bold">Cargas de Combustible</h1>
          </div>
          <Link href="/auth/signout" prefetch={false}>
            <Button variant="ghost">Cerrar Sesión</Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Gestión de Combustible</h2>
            <p className="text-muted-foreground">Registro centralizado de cargas para todos los vehículos</p>
          </div>
          <FuelRecordsClient vehicles={vehicles || []} />
        </div>

        <FuelRecordListFiltered fuelRecords={fuelRecords || []} />
      </div>
    </div>
  )
}
