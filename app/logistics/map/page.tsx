import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { DriverMap } from "@/components/driver-map"

export default async function MapPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: lastLocations } = await supabase
    .from("trips")
    .select(
      `
      id,
      driver_id,
      unloading_location,
      unloading_address,
      unloading_lat,
      unloading_lng,
      date,
      completed_at,
      product,
      status,
      driver:driver_id(
        id,
        name,
        chasis:chasis_id(id, patent_chasis, vehicle_type),
        semi:semi_id(id, patent_chasis, vehicle_type)
      )
    `,
    )
    .in("status", ["completado_l1", "completado_l2"])
    .not("unloading_lat", "is", null)
    .not("unloading_lng", "is", null)
    .order("completed_at", { ascending: false })

  // Get unique drivers with their last location
  const driverLocations = lastLocations?.reduce((acc: any[], trip: any) => {
    if (!acc.find((item) => item.driver_id === trip.driver_id)) {
      acc.push(trip)
    }
    return acc
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="icon">
              <Link href="/logistics">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#0038ae] flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
              </div>
              <h1 className="text-xl font-bold">Mapa de Choferes</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <DriverMap locations={driverLocations || []} />
      </div>
    </div>
  )
}
