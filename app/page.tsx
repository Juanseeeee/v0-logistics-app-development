import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"

export default async function Home() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle()

    if (!userData || !userData.role) {
      await supabase.auth.signOut()
      redirect("/auth/login?error=no_role")
    }

    // Redirect based on role
    if (userData.role === "documents") {
      redirect("/documents-hub")
    } else if (userData.role === "driver" || userData.role === "company") {
      redirect("/documents")
    } else {
      // admin, owner, manager
      redirect("/hub")
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0038ae]/10 via-background to-[#0038ae]/5 p-4">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <div className="flex justify-center mb-8">
          <Image
            src="/logo.png"
            alt="Cronos Logística"
            width={600}
            height={180}
            className="w-auto h-44"
            priority
          />
        </div>

        <div className="space-y-4">
          <p className="text-xl md:text-2xl text-muted-foreground text-balance max-w-2xl mx-auto">
            Sistema de gestión integral para tu empresa de transporte
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-12 text-left">
          <div className="p-6 bg-card rounded-lg border shadow-sm">
            <div className="w-12 h-12 rounded-full bg-[#0038ae]/10 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-[#0038ae]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Control de Vehículos</h3>
            <p className="text-sm text-muted-foreground">
              Gestiona tu flota, mantenimientos y kilometraje en un solo lugar
            </p>
          </div>

          <div className="p-6 bg-card rounded-lg border shadow-sm">
            <div className="w-12 h-12 rounded-full bg-[#0038ae]/10 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-[#0038ae]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Alertas Inteligentes</h3>
            <p className="text-sm text-muted-foreground">
              Recibe notificaciones de mantenimientos y servicios próximos
            </p>
          </div>

          <div className="p-6 bg-card rounded-lg border shadow-sm">
            <div className="w-12 h-12 rounded-full bg-[#0038ae]/10 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-[#0038ae]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Reportes Detallados</h3>
            <p className="text-sm text-muted-foreground">Analiza gastos y optimiza la operación de tu negocio</p>
          </div>
        </div>

        <div className="flex gap-4 justify-center mt-12">
          <Button asChild size="lg" className="bg-[#0038ae] hover:bg-[#0038ae]/90">
            <Link href="/auth/login">Ingresar</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
