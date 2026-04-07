import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function ManualPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/hub">
              <Button variant="ghost" size="sm">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Volver al Hub
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#0038ae] flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold">Manual de Usuario</h1>
          </div>
          <div className="w-32" />
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <div className="w-20 h-20 rounded-full bg-[#0038ae] flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h1 className="text-5xl font-bold mb-4">Manual de Usuario</h1>
          <p className="text-xl text-muted-foreground mb-2">Sistema de Gestión Logística Cronos</p>
          <Badge variant="outline" className="text-sm">
            Versión 1.2 - Abril 2026
          </Badge>
        </div>

        {/* Table of Contents */}
        <Card className="mb-12 border-2 border-[#0038ae]">
          <CardHeader className="bg-[#0038ae] text-white">
            <CardTitle className="text-2xl">Contenido</CardTitle>
            <CardDescription className="text-white/80">Navegación rápida por el manual</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <a href="#intro" className="p-3 rounded-lg hover:bg-muted transition-colors">
                <div className="font-semibold text-[#0038ae]">1. Introducción</div>
                <div className="text-sm text-muted-foreground">Descripción general del sistema</div>
              </a>
              <a href="#login" className="p-3 rounded-lg hover:bg-muted transition-colors">
                <div className="font-semibold text-[#0038ae]">2. Inicio de Sesión</div>
                <div className="text-sm text-muted-foreground">Acceso de personal y choferes</div>
              </a>
              <a href="#hub" className="p-3 rounded-lg hover:bg-muted transition-colors">
                <div className="font-semibold text-[#0038ae]">3. Hub Central</div>
                <div className="text-sm text-muted-foreground">Navegación principal</div>
              </a>
              <a href="#fleet" className="p-3 rounded-lg hover:bg-muted transition-colors">
                <div className="font-semibold text-[#0038ae]">4. Gestión de Flota</div>
                <div className="text-sm text-muted-foreground">Vehículos y mantenimientos</div>
              </a>
              <a href="#logistics" className="p-3 rounded-lg hover:bg-muted transition-colors">
                <div className="font-semibold text-[#0038ae]">5. Gestión Logística</div>
                <div className="text-sm text-muted-foreground">Viajes y operaciones masivas</div>
              </a>
              <a href="#finance" className="p-3 rounded-lg hover:bg-muted transition-colors">
                <div className="font-semibold text-[#0038ae]">6. Gestión Financiera</div>
                <div className="text-sm text-muted-foreground">Ingresos, gastos y estadísticas</div>
              </a>
              <a href="#documents" className="p-3 rounded-lg hover:bg-muted transition-colors">
                <div className="font-semibold text-[#0038ae]">7. Documentación</div>
                <div className="text-sm text-muted-foreground">Gestión de archivos y vencimientos</div>
              </a>
              <a href="#support" className="p-3 rounded-lg hover:bg-muted transition-colors">
                <div className="font-semibold text-[#0038ae]">8. Soporte</div>
                <div className="text-sm text-muted-foreground">Contacto y ayuda</div>
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Section 1: Introduction */}
        <div id="intro" className="mb-12 scroll-mt-24">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-[#0038ae] flex items-center justify-center text-white font-bold text-xl">
              1
            </div>
            <h2 className="text-3xl font-bold">Introducción</h2>
          </div>
          <Card>
            <CardContent className="pt-6">
              <p className="text-lg mb-4">
                Bienvenido al Sistema de Gestión Logística de <strong>Cronos</strong>. Esta aplicación ha sido diseñada
                para optimizar y centralizar la gestión de su flota de vehículos, operaciones logísticas, documentación y control financiero.
              </p>
              <h3 className="text-xl font-semibold mb-3">Características Principales</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-[#0038ae] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <strong>Gestión de Flota Completa:</strong> Control total de vehículos, mantenimientos programados,
                    alertas automáticas y reportes de gastos.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-[#0038ae] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <strong>Gestión Logística Eficiente:</strong> Asignación de viajes, operaciones masivas de facturación y liquidación L2, y reportes detallados en PDF/Excel.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-[#0038ae] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <strong>Control Financiero y Documental:</strong> Consolidación de ingresos y egresos, junto con un sistema integral de documentación y alertas de vencimiento.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section 2: Login */}
        <div id="login" className="mb-12 scroll-mt-24">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-[#0038ae] flex items-center justify-center text-white font-bold text-xl">
              2
            </div>
            <h2 className="text-3xl font-bold">Inicio de Sesión</h2>
          </div>
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-xl font-semibold mb-4">Acceso de Personal Administrativo</h3>
              <p className="text-muted-foreground mb-4">Para administradores, gerentes y operadores:</p>
              <div className="space-y-4 mb-8">
                <div className="flex gap-4">
                  <Badge variant="outline" className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0">1</Badge>
                  <div>
                    <p className="font-semibold mb-1">Ingresar credenciales</p>
                    <p className="text-muted-foreground">Complete los campos de <strong>Email</strong> y <strong>Contraseña</strong> proporcionados.</p>
                  </div>
                </div>
              </div>

              <h3 className="text-xl font-semibold mb-4">Acceso para Choferes</h3>
              <p className="text-muted-foreground mb-4">Los choferes disponen de un método de acceso simplificado:</p>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Badge variant="outline" className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0">1</Badge>
                  <div>
                    <p className="font-semibold mb-1">Acceso con CUIT</p>
                    <p className="text-muted-foreground">En el campo "Email o CUIT", ingrese directamente su número de <strong>CUIT</strong> (sin guiones).</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Badge variant="outline" className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0">2</Badge>
                  <div>
                    <p className="font-semibold mb-1">Primer Inicio de Sesión</p>
                    <p className="text-muted-foreground">La primera vez, la contraseña será su mismo CUIT. El sistema le pedirá <strong>obligatoriamente</strong> cambiarla por una nueva contraseña segura.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Badge variant="outline" className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0">3</Badge>
                  <div>
                    <p className="font-semibold mb-1">Redirección a Documentos</p>
                    <p className="text-muted-foreground">Los choferes son redirigidos automáticamente a la sección de <strong>Documentación</strong> y no tienen acceso al Hub Central ni a otras áreas operativas.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section 3: Hub */}
        <div id="hub" className="mb-12 scroll-mt-24">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-[#0038ae] flex items-center justify-center text-white font-bold text-xl">
              3
            </div>
            <h2 className="text-3xl font-bold">Hub Central</h2>
          </div>
          <Card>
            <CardContent className="pt-6">
              <p className="text-lg mb-6">
                El Hub Central es el punto de entrada principal donde puede acceder a todas las áreas del sistema, dependiendo de su rol:
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="border-2 border-[#0038ae] rounded-lg p-6">
                  <h3 className="text-xl font-bold mb-2">Gestión de Flota</h3>
                  <p className="text-muted-foreground mb-3">Administración de vehículos propios, mantenimientos y reportes de gastos.</p>
                </div>
                <div className="border-2 border-[#0038ae] rounded-lg p-6">
                  <h3 className="text-xl font-bold mb-2">Gestión Logística</h3>
                  <p className="text-muted-foreground mb-3">Administración de viajes (L1 y L2), asignación de choferes y operaciones masivas.</p>
                </div>
                <div className="border-2 border-[#0038ae] rounded-lg p-6">
                  <h3 className="text-xl font-bold mb-2">Gestión Financiera</h3>
                  <p className="text-muted-foreground mb-3">Control de ingresos, egresos, órdenes de compra y estadísticas financieras.</p>
                </div>
                <div className="border-2 border-[#0038ae] rounded-lg p-6">
                  <h3 className="text-xl font-bold mb-2">Documentación</h3>
                  <p className="text-muted-foreground mb-3">Archivos empresariales, papeles de vehículos y documentos de choferes con alertas de vencimiento.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section 4: Fleet Management */}
        <div id="fleet" className="mb-12 scroll-mt-24">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-[#0038ae] flex items-center justify-center text-white font-bold text-xl">
              4
            </div>
            <h2 className="text-3xl font-bold">Gestión de Flota</h2>
          </div>

          <Card className="mb-6">
            <CardHeader className="bg-muted">
              <CardTitle className="text-xl">4.1 Administración de Vehículos</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="mb-4">Podrá agregar y modificar Chasis y Semiremolques. Es fundamental mantener el <strong>kilometraje actualizado</strong>, ya que de esto dependen las alertas de mantenimiento preventivo.</p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader className="bg-muted">
              <CardTitle className="text-xl">4.2 Sistema de Mantenimientos</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="mb-4">
                El sistema soporta dos estados para los formularios de mantenimiento:
              </p>
              <ul className="space-y-2 ml-6 mb-4">
                <li className="list-disc"><strong>Completado:</strong> Registros históricos que incluyen costo, fecha de ejecución y repuestos utilizados.</li>
                <li className="list-disc"><strong>Programado:</strong> Alertas futuras basadas en fecha o kilometraje próximo (ej: VTV cada 12 meses, Cambio de aceite cada 15,000 km).</li>
              </ul>
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="font-semibold text-amber-900 mb-1">Alertas Automáticas</p>
                <p className="text-amber-800 text-sm">
                  Las alertas se disparan automáticamente en el dashboard 30 días antes del vencimiento por fecha, o 3,000 km antes del kilometraje límite.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section 5: Logistics Management */}
        <div id="logistics" className="mb-12 scroll-mt-24">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-[#0038ae] flex items-center justify-center text-white font-bold text-xl">
              5
            </div>
            <h2 className="text-3xl font-bold">Gestión Logística</h2>
          </div>

          <Card className="mb-6">
            <CardHeader className="bg-muted">
              <CardTitle className="text-xl">5.1 Gestión de Viajes</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="mb-4">Al crear un viaje, el sistema validará automáticamente la disponibilidad del chofer seleccionado. Los viajes transitan por los estados: Asignado, En Viaje, Completado y Cancelado.</p>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader className="bg-muted">
              <CardTitle className="text-xl">5.2 Operaciones Masivas (Línea 2)</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="mb-4">
                Para optimizar la gestión de múltiples viajes de terceros, la pestaña <strong>"Viajes Completados"</strong> permite realizar operaciones en lote:
              </p>
              <h4 className="font-semibold text-lg mb-3">Facturación y Liquidación</h4>
              <ul className="space-y-2 ml-6 mb-6">
                <li className="list-disc"><strong>Facturar:</strong> Seleccione múltiples viajes y aplique un mismo N° de Factura y Fecha a todos.</li>
                <li className="list-disc"><strong>Liquidar:</strong> Marque los viajes pagados a los transportistas con N° de Comprobante en un solo paso.</li>
              </ul>
              <h4 className="font-semibold text-lg mb-3">Vistas y Exportación</h4>
              <p className="mb-4">Utilice los filtros para ver viajes: Todos, Facturados, Liquidados o Completos (ambos). Además, podrá exportar estos listados en <strong>PDF o Excel</strong> con totales calculados y el branding de la empresa.</p>
            </CardContent>
          </Card>
        </div>

        {/* Section 6: Finance */}
        <div id="finance" className="mb-12 scroll-mt-24">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-[#0038ae] flex items-center justify-center text-white font-bold text-xl">
              6
            </div>
            <h2 className="text-3xl font-bold">Gestión Financiera</h2>
          </div>
          <Card>
            <CardContent className="pt-6">
              <p className="mb-4">El módulo de finanzas consolida toda la información económica del sistema para proporcionar un balance claro:</p>
              <ul className="space-y-2 ml-6 mb-6">
                <li className="list-disc"><strong>Ingresos (Viajes L2):</strong> Ganancia neta calculada a partir de los viajes completados (Monto cobrado al cliente - Costo pagado al tercero).</li>
                <li className="list-disc"><strong>Egresos:</strong> Sumatoria de gastos manuales, costos de mantenimientos de flota completados y cargas de combustible.</li>
              </ul>
              <p>El dashboard financiero muestra gráficos comparativos y permite filtrar por mes y año para evaluar la rentabilidad general de la empresa.</p>
            </CardContent>
          </Card>
        </div>

        {/* Section 7: Documents */}
        <div id="documents" className="mb-12 scroll-mt-24">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-[#0038ae] flex items-center justify-center text-white font-bold text-xl">
              7
            </div>
            <h2 className="text-3xl font-bold">Documentación</h2>
          </div>
          <Card>
            <CardContent className="pt-6">
              <p className="mb-4">Gestione todos los archivos legales y operativos en tres categorías principales: <strong>Empresas, Vehículos y Choferes</strong>.</p>
              <ul className="space-y-2 ml-6 mb-6">
                <li className="list-disc"><strong>Subida de Archivos:</strong> Soporte para PDFs y formatos de imagen.</li>
                <li className="list-disc"><strong>Fechas de Vencimiento:</strong> Asigne vencimientos a pólizas, licencias, y VTVs. El sistema le alertará automáticamente cuando un documento esté próximo a vencer.</li>
                <li className="list-disc"><strong>Seguridad (RLS):</strong> Las vistas de documentos heredan permisos seguros, asegurando que los choferes solo puedan visualizar su propia documentación y no la de la empresa.</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Section 8: Support */}
        <div id="support" className="mb-12 scroll-mt-24">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-[#0038ae] flex items-center justify-center text-white font-bold text-xl">
              8
            </div>
            <h2 className="text-3xl font-bold">Soporte y Ayuda</h2>
          </div>
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-xl font-semibold mb-3">Contacto de Soporte</h3>
              <div className="p-6 bg-muted rounded-lg">
                <p className="mb-4">Si tiene problemas técnicos o necesita asistencia, contacte a su administrador del sistema o envíe un correo a:</p>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#0038ae]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="font-semibold">Email:</span>
                  <span>soporte@cronos-logistica.com</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="border-t pt-8 mt-12 text-center text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-[#0038ae] flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-bold text-foreground">Cronos Logística</span>
          </div>
          <p className="text-sm">Sistema de Gestión Logística - Versión 1.2</p>
          <p className="text-sm">© 2026 Cronos. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  )
}
