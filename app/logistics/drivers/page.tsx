import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DriverForm } from "@/components/driver-form"
import { DriverList } from "@/components/driver-list"

export default async function DriversPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle()

  const { data: drivers } = await supabase
    .from("drivers")
    .select(
      `
      *,
      chasis:chasis_id(id, patent_chasis, vehicle_type),
      semi:semi_id(id, patent_chasis, vehicle_type),
      transport_company:transport_company_id(id, name)
    `,
    )
    .order("name", { ascending: true })

  const { data: vehicles } = await supabase.from("vehicles").select("*").order("patent_chasis", { ascending: true })

  const { data: transportCompanies } = await supabase
    .from("transport_companies")
    .select("id, name")
    .eq("active", true)
    .order("name")

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
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <h1 className="text-xl font-bold">Choferes</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[400px_1fr] gap-6">
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Agregar Chofer</CardTitle>
              </CardHeader>
              <CardContent>
                <DriverForm vehicles={vehicles || []} transportCompanies={transportCompanies || []} />
              </CardContent>
            </Card>
          </div>

          <div>
            <DriverList
              drivers={drivers || []}
              userRole={userData?.role}
              vehicles={vehicles || []}
              transportCompanies={transportCompanies || []}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
