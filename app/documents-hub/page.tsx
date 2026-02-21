import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, AlertTriangle, Building2, Truck, Users, LogOut } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default async function DocumentsHubPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: userData } = await supabase.from("users").select("role, email").eq("id", user.id).maybeSingle()

  if (!userData || (userData.role !== "documents" && userData.role !== "admin")) {
    // If not allowed, redirect based on actual role
    if (userData?.role === "driver" || userData?.role === "company") {
      redirect("/documents")
    } else {
      redirect("/hub")
    }
  }

  // Obtener estadísticas de documentos
  const { count: totalDocsCount } = await supabase.from("documents").select("id", { count: "exact", head: true })

  const { count: alertsCount } = await supabase.from("document_alerts").select("*", { count: "exact", head: true })

  const { data: criticalAlerts } = await supabase
    .from("document_alerts")
    .select("*")
    .in("urgency_level", ["critical", "expired"])

  const { count: companyDocsCount } = await supabase
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("entity_type", "company")

  const { count: vehicleDocsCount } = await supabase
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("entity_type", "vehicle")

  const { count: driverDocsCount } = await supabase
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("entity_type", "driver")

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-6 sm:p-8 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">Portal de Documentación</h1>
            <p className="text-sm sm:text-base text-gray-600 truncate">Bienvenido, {userData?.email}</p>
          </div>
          <Link href="/auth/signout">
            <Button variant="outline" size="sm" className="text-xs sm:text-sm bg-transparent">
              <LogOut className="mr-1 sm:mr-2 h-4 w-4" />
              Cerrar Sesión
            </Button>
          </Link>
        </div>

        {/* Alertas críticas */}
        {criticalAlerts && criticalAlerts.length > 0 && (
          <Card className="mb-8 border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-5 w-5" />
                Atención Requerida
              </CardTitle>
              <CardDescription>{criticalAlerts.length} documento(s) vencido(s) o próximos a vencer</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/documents">
                <Button variant="destructive" className="w-full">
                  Ver Documentos Críticos
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Acceso principal */}
        <Card className="mb-8 border-2 border-blue-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <FileText className="h-6 w-6" />
              Gestión de Documentación
            </CardTitle>
            <CardDescription className="text-blue-100">Administre todos los documentos del sistema</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3 mb-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-blue-900">Empresa</span>
                </div>
                <p className="text-2xl font-bold text-blue-700">{companyDocsCount || 0}</p>
                <p className="text-sm text-blue-600">documentos</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-3 mb-2">
                  <Truck className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-900">Vehículos</span>
                </div>
                <p className="text-2xl font-bold text-green-700">{vehicleDocsCount || 0}</p>
                <p className="text-sm text-green-600">documentos</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  <span className="font-semibold text-purple-900">Choferes</span>
                </div>
                <p className="text-2xl font-bold text-purple-700">{driverDocsCount || 0}</p>
                <p className="text-sm text-purple-600">documentos</p>
              </div>
            </div>
            <Link href="/documents">
              <Button className="w-full" size="lg">
                Acceder a Documentación
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Resumen de estado */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Total de Documentos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl sm:text-4xl font-bold text-blue-600">{totalDocsCount || 0}</p>
              <p className="text-sm text-muted-foreground mt-2">Documentos registrados en el sistema</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Alertas Activas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-3">
                <p className="text-2xl sm:text-4xl font-bold text-orange-600">{alertsCount || 0}</p>
                {criticalAlerts && criticalAlerts.length > 0 && (
                  <Badge variant="destructive">{criticalAlerts.length} críticas</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-2">Documentos próximos a vencer</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
