import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle()

  if (!userData || !userData.role) {
    await supabase.auth.signOut()
    redirect("/auth/login?error=no_role")
  }

  const userRole = userData.role

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Cronos Logística"
              width={280}
              height={70}
              className="h-10 sm:h-14 w-auto"
              priority
            />
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <form action="/auth/signout" method="post">
              <Button variant="ghost" type="submit" size="sm" className="text-xs sm:text-sm">
                Cerrar Sesión
              </Button>
            </form>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="mb-8 sm:mb-12 text-center">
          <h2 className="text-2xl sm:text-4xl font-bold mb-3">Hub Central</h2>
          <p className="text-muted-foreground text-sm sm:text-lg">Selecciona el área que deseas gestionar</p>
        </div>

        <div className="flex justify-center gap-3 sm:gap-4 mb-8 flex-wrap px-2">
          <Link href="/manual" prefetch={false}>
            <Button variant="outline" size="lg" className="gap-2 bg-transparent">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              Manual de Usuario
            </Button>
          </Link>

          <Link href="/presentation" prefetch={false}>
            <Button size="lg" className="gap-2 bg-[#0038ae] hover:bg-[#002a85]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Ver Presentación
            </Button>
          </Link>

          {userRole === "admin" && (
            <Link href="/admin/users" prefetch={false}>
              <Button size="lg" variant="outline" className="gap-2 bg-purple-600 text-white hover:bg-purple-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                Gestionar Usuarios
              </Button>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 max-w-5xl mx-auto">
          {(userRole === "admin" || userRole === "owner" || userRole === "manager" || userRole === "reporter" || userRole === "fleet_docs") && (
            <Link href="/fleet" prefetch={false}>
              <Card className="h-full hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer border-2 hover:border-[#0038ae] bg-gradient-to-br from-card to-card/50 shadow-lg active:scale-[0.98] active:shadow-xl active:border-[#0050d5] hover:bg-gradient-to-br hover:from-[#0038ae]/5 hover:to-card/50">
                <CardHeader className="pb-4">
                  <div className="w-16 h-16 rounded-full bg-[#0038ae] flex items-center justify-center mb-4 mx-auto">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </div>
                  <CardTitle className="text-2xl text-center">Gestión de Flota</CardTitle>
                  <CardDescription className="text-center text-base">Vehículos propios de Cronos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-[#0038ae]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Administración de vehículos (chasis y semis)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-[#0038ae]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Control de mantenimientos y alertas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-[#0038ae]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Registro de combustible y gastos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-[#0038ae]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Reportes y estadísticas de flota</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}

          {(userRole === "admin" ||
            userRole === "owner" ||
            userRole === "manager" ||
            userRole === "trip_manager" ||
            userRole === "reporter") && (
            <Link href="/logistics" prefetch={false}>
              <Card className="h-full hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer border-2 hover:border-[#0038ae] bg-gradient-to-br from-card to-card/50 shadow-lg active:scale-[0.98] active:shadow-xl active:border-[#0050d5] hover:bg-gradient-to-br hover:from-[#0038ae]/5 hover:to-card/50">
                <CardHeader className="pb-4">
                  <div className="w-16 h-16 rounded-full bg-[#0038ae] flex items-center justify-center mb-4 mx-auto">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <CardTitle className="text-2xl text-center">Gestión Logística</CardTitle>
                  <CardDescription className="text-center text-base">Viajes propios y tercerizados</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-[#0038ae]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Asignación y seguimiento de viajes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-[#0038ae]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Gestión de choferes y disponibilidad</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-[#0038ae]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Mapa de ubicaciones en tiempo real</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-[#0038ae]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Estadísticas y reportes de viajes</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}

          {(userRole === "admin" || userRole === "owner" || userRole === "manager") && (
            <Link href="/finance" prefetch={false}>
              <Card className="h-full hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer border-2 hover:border-[#0038ae] bg-gradient-to-br from-card to-card/50 shadow-lg active:scale-[0.98] active:shadow-xl active:border-[#0050d5] hover:bg-gradient-to-br hover:from-[#0038ae]/5 hover:to-card/50">
                <CardHeader className="pb-4">
                  <div className="w-16 h-16 rounded-full bg-[#0038ae] flex items-center justify-center mb-4 mx-auto">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <CardTitle className="text-2xl text-center">Gestión Financiera</CardTitle>
                  <CardDescription className="text-center text-base">
                    Órdenes de compra, proveedores y control financiero
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-[#0038ae]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Órdenes de compra con PDF</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-[#0038ae]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Gestión de proveedores</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-[#0038ae]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Control de gastos</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}

          {(userRole === "admin" || userRole === "documents" || userRole === "fleet_docs") && (
            <Link href="/documents" prefetch={false}>
              <Card className="h-full hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer border-2 hover:border-[#0038ae]">
                <CardHeader className="pb-4">
                  <div className="w-16 h-16 rounded-full bg-[#0038ae] flex items-center justify-center mb-4 mx-auto">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </div>
                  <CardTitle className="text-2xl text-center">Gestión de Documentación</CardTitle>
                  <CardDescription className="text-center text-base">
                    Documentos de empresas, vehículos y choferes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-[#0038ae]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Documentación empresarial y legal</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-[#0038ae]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Papeles de vehículos y seguros</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-[#0038ae]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Documentos de choferes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-[#0038ae]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Alertas de vencimientos</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
