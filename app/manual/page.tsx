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
            Versión 1.0 - Diciembre 2024
          </Badge>
        </div>

        {/* Table of Contents */}
        <Card className="mb-12 border-2 border-[#0038ae]">
          <CardHeader className="bg-[#0038ae] text-white">
            <CardTitle className="text-2xl">Contenido</CardTitle>
            <CardDescription className="text-white/80">Navegación rápida por el manual</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-4">
              <a href="#intro" className="p-3 rounded-lg hover:bg-muted transition-colors">
                <div className="font-semibold text-[#0038ae]">1. Introducción</div>
                <div className="text-sm text-muted-foreground">Descripción general del sistema</div>
              </a>
              <a href="#login" className="p-3 rounded-lg hover:bg-muted transition-colors">
                <div className="font-semibold text-[#0038ae]">2. Inicio de Sesión</div>
                <div className="text-sm text-muted-foreground">Acceso a la aplicación</div>
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
                <div className="text-sm text-muted-foreground">Viajes y choferes</div>
              </a>
              <a href="#support" className="p-3 rounded-lg hover:bg-muted transition-colors">
                <div className="font-semibold text-[#0038ae]">6. Soporte</div>
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
                para optimizar y centralizar la gestión de su flota de vehículos y operaciones logísticas.
              </p>
              <h3 className="text-xl font-semibold mb-3">Características Principales</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-6 h-6 text-[#0038ae] mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <strong>Gestión de Flota Completa:</strong> Control total de vehículos, mantenimientos programados,
                    alertas automáticas y reportes de gastos.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg
                    className="w-6 h-6 text-[#0038ae] mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <strong>Gestión Logística Eficiente:</strong> Asignación de viajes, control de disponibilidad de
                    choferes, seguimiento en tiempo real con mapas interactivos.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg
                    className="w-6 h-6 text-[#0038ae] mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <strong>Acceso Multiplataforma:</strong> Disponible desde computadoras de escritorio, tablets y
                    dispositivos móviles.
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
              <h3 className="text-xl font-semibold mb-4">Pasos para acceder</h3>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Badge
                    variant="outline"
                    className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0"
                  >
                    1
                  </Badge>
                  <div>
                    <p className="font-semibold mb-1">Acceder a la URL de la aplicación</p>
                    <p className="text-muted-foreground">
                      Ingrese a la dirección web proporcionada por su administrador.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Badge
                    variant="outline"
                    className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0"
                  >
                    2
                  </Badge>
                  <div>
                    <p className="font-semibold mb-1">Ingresar credenciales</p>
                    <p className="text-muted-foreground">
                      Complete los campos de <strong>Email</strong> y <strong>Contraseña</strong> con las credenciales
                      proporcionadas.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Badge
                    variant="outline"
                    className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0"
                  >
                    3
                  </Badge>
                  <div>
                    <p className="font-semibold mb-1">Hacer clic en "Iniciar Sesión"</p>
                    <p className="text-muted-foreground">
                      El sistema validará sus credenciales y lo redirigirá al Hub Central.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex gap-2">
                  <svg
                    className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <p className="font-semibold text-blue-900 mb-1">Nota Importante</p>
                    <p className="text-blue-800 text-sm">
                      Si olvidó su contraseña, contacte a su administrador del sistema para restablecerla.
                    </p>
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
                El Hub Central es el punto de entrada principal donde puede acceder a las dos áreas principales del
                sistema:
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="border-2 border-[#0038ae] rounded-lg p-6">
                  <div className="w-14 h-14 rounded-full bg-[#0038ae] flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-2">Gestión de Flota</h3>
                  <p className="text-muted-foreground mb-3">Para administrar vehículos propios de Cronos.</p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#0038ae]" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Registro de vehículos
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#0038ae]" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Control de mantenimientos
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#0038ae]" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Reportes de gastos
                    </li>
                  </ul>
                </div>
                <div className="border-2 border-[#0038ae] rounded-lg p-6">
                  <div className="w-14 h-14 rounded-full bg-[#0038ae] flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-2">Gestión Logística</h3>
                  <p className="text-muted-foreground mb-3">Para administrar viajes propios y tercerizados.</p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#0038ae]" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Asignación de viajes
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#0038ae]" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Gestión de choferes
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#0038ae]" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Mapa de ubicaciones
                    </li>
                  </ul>
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

          {/* 4.1 Dashboard */}
          <Card className="mb-6">
            <CardHeader className="bg-muted">
              <CardTitle className="text-xl">4.1 Dashboard de Flota</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="mb-4">
                Al ingresar a Gestión de Flota, verá un dashboard con estadísticas generales y accesos rápidos:
              </p>
              <ul className="space-y-2 ml-6">
                <li className="list-disc">
                  <strong>Total de vehículos</strong> - Cantidad de chasis y semiremolques registrados
                </li>
                <li className="list-disc">
                  <strong>Alertas de mantenimiento</strong> - Notificaciones de servicios próximos o vencidos
                </li>
                <li className="list-disc">
                  <strong>Accesos rápidos</strong> - Enlaces directos a Vehículos, Mantenimientos, Reportes y Productos
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* 4.2 Vehicles */}
          <Card className="mb-6">
            <CardHeader className="bg-muted">
              <CardTitle className="text-xl">4.2 Administración de Vehículos</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <h4 className="font-semibold text-lg mb-3">Agregar un Vehículo Nuevo</h4>
              <div className="space-y-3 mb-6">
                <div className="flex gap-3">
                  <Badge className="bg-[#0038ae] h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 p-0">
                    1
                  </Badge>
                  <p>Haga clic en el botón "Agregar Vehículo" en la parte superior</p>
                </div>
                <div className="flex gap-3">
                  <Badge className="bg-[#0038ae] h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 p-0">
                    2
                  </Badge>
                  <p>Complete los campos del formulario:</p>
                </div>
                <div className="ml-9 space-y-2 text-sm text-muted-foreground">
                  <div className="flex gap-2">
                    <span className="font-semibold text-foreground min-w-[120px]">Categoría:</span>
                    <span>Chasis o Semiremolque</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-semibold text-foreground min-w-[120px]">Patente:</span>
                    <span>Identificación única del vehículo</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-semibold text-foreground min-w-[120px]">Marca:</span>
                    <span>Fabricante del vehículo (ej: Scania, Mercedes-Benz)</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-semibold text-foreground min-w-[120px]">Modelo:</span>
                    <span>Modelo específico</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-semibold text-foreground min-w-[120px]">Año:</span>
                    <span>Año de fabricación</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-semibold text-foreground min-w-[120px]">Kilometraje:</span>
                    <span>Kilometraje actual del vehículo</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-semibold text-foreground min-w-[120px]">Transporte:</span>
                    <span>Nombre de la empresa de transporte dueña</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Badge className="bg-[#0038ae] h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 p-0">
                    3
                  </Badge>
                  <p>Haga clic en "Guardar Vehículo"</p>
                </div>
              </div>

              <h4 className="font-semibold text-lg mb-3 mt-6">Actualizar Kilometraje</h4>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <Badge className="bg-[#0038ae] h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 p-0">
                    1
                  </Badge>
                  <p>Localice el vehículo en la lista</p>
                </div>
                <div className="flex gap-3">
                  <Badge className="bg-[#0038ae] h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 p-0">
                    2
                  </Badge>
                  <p>Haga clic en el botón "Actualizar Km"</p>
                </div>
                <div className="flex gap-3">
                  <Badge className="bg-[#0038ae] h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 p-0">
                    3
                  </Badge>
                  <p>Ingrese el nuevo kilometraje y guarde</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 4.3 Maintenance */}
          <Card className="mb-6">
            <CardHeader className="bg-muted">
              <CardTitle className="text-xl">4.3 Sistema de Mantenimientos</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="mb-4">
                El sistema incluye mantenimientos programados con intervalos automáticos basados en estándares de la
                industria:
              </p>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">VTV (Verificación Técnica)</h5>
                  <p className="text-sm text-muted-foreground">Cada 12 meses</p>
                </div>
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">Cambio de Aceite</h5>
                  <p className="text-sm text-muted-foreground">Cada 15,000 km o 6 meses</p>
                </div>
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">Cambio de Filtros</h5>
                  <p className="text-sm text-muted-foreground">Cada 40,000 km</p>
                </div>
                <div className="border rounded-lg p-4">
                  <h5 className="font-semibold mb-2">Revisión de Frenos</h5>
                  <p className="text-sm text-muted-foreground">Cada 25,000 km</p>
                </div>
              </div>

              <h4 className="font-semibold text-lg mb-3">Registrar un Mantenimiento</h4>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <Badge className="bg-[#0038ae] h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 p-0">
                    1
                  </Badge>
                  <p>Acceda a la sección "Mantenimientos" desde el dashboard de flota</p>
                </div>
                <div className="flex gap-3">
                  <Badge className="bg-[#0038ae] h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 p-0">
                    2
                  </Badge>
                  <p>Haga clic en "Nuevo Mantenimiento"</p>
                </div>
                <div className="flex gap-3">
                  <Badge className="bg-[#0038ae] h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 p-0">
                    3
                  </Badge>
                  <p>Complete el formulario con la información del servicio</p>
                </div>
                <div className="flex gap-3">
                  <Badge className="bg-[#0038ae] h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 p-0">
                    4
                  </Badge>
                  <p>Si el mantenimiento requiere que un chofer no esté disponible, selecciónelo</p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex gap-2">
                  <svg
                    className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <div>
                    <p className="font-semibold text-amber-900 mb-1">Alertas Automáticas</p>
                    <p className="text-amber-800 text-sm">
                      El sistema generará alertas 30 días antes de la fecha de mantenimiento o 3,000 km antes del
                      kilometraje programado.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 4.4 Reports */}
          <Card className="mb-6">
            <CardHeader className="bg-muted">
              <CardTitle className="text-xl">4.4 Reportes de Gastos</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="mb-4">
                La sección de reportes proporciona análisis detallados de los gastos de cada vehículo.
              </p>
              <h4 className="font-semibold text-lg mb-3">Funcionalidades de Filtrado</h4>
              <div className="space-y-2 ml-6 mb-6">
                <li className="list-disc">
                  <strong>Filtrar por Patente:</strong> Busque un vehículo específico por su patente
                </li>
                <li className="list-disc">
                  <strong>Filtrar por Categoría:</strong> Visualice solo Chasis o Semiremolques
                </li>
              </div>

              <h4 className="font-semibold text-lg mb-3">Información Disponible</h4>
              <div className="space-y-2 ml-6">
                <li className="list-disc">Total de gastos por vehículo</li>
                <li className="list-disc">Desglose por tipo (mantenimiento, combustible)</li>
                <li className="list-disc">Promedios y estadísticas</li>
                <li className="list-disc">Historial completo de mantenimientos y cargas</li>
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

          {/* 5.1 Dashboard */}
          <Card className="mb-6">
            <CardHeader className="bg-muted">
              <CardTitle className="text-xl">5.1 Dashboard Logístico</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="mb-4">El dashboard logístico muestra información clave sobre las operaciones en curso:</p>
              <ul className="space-y-2 ml-6">
                <li className="list-disc">
                  <strong>Viajes activos</strong> - Cantidad de viajes en curso y pendientes
                </li>
                <li className="list-disc">
                  <strong>Choferes disponibles</strong> - Estado de disponibilidad de los conductores
                </li>
                <li className="list-disc">
                  <strong>Estadísticas del mes</strong> - Viajes completados y métricas de rendimiento
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* 5.2 Trips */}
          <Card className="mb-6">
            <CardHeader className="bg-muted">
              <CardTitle className="text-xl">5.2 Gestión de Viajes</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <h4 className="font-semibold text-lg mb-3">Crear un Viaje Nuevo</h4>
              <div className="space-y-3 mb-6">
                <div className="flex gap-3">
                  <Badge className="bg-[#0038ae] h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 p-0">
                    1
                  </Badge>
                  <p>Acceda a la sección "Viajes" y haga clic en "Nuevo Viaje"</p>
                </div>
                <div className="flex gap-3">
                  <Badge className="bg-[#0038ae] h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 p-0">
                    2
                  </Badge>
                  <p>Complete la información del viaje:</p>
                </div>
                <div className="ml-9 space-y-2 text-sm text-muted-foreground">
                  <div className="flex gap-2">
                    <span className="font-semibold text-foreground min-w-[120px]">Fecha:</span>
                    <span>Fecha del viaje (por defecto hoy)</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-semibold text-foreground min-w-[120px]">Cliente:</span>
                    <span>Nombre del cliente (ej: GBE)</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-semibold text-foreground min-w-[120px]">Línea:</span>
                    <span>L1 o L2</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-semibold text-foreground min-w-[120px]">N° Viaje:</span>
                    <span>Número autoincrementable</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-semibold text-foreground min-w-[120px]">Chofer:</span>
                    <span>Seleccione de la lista (con búsqueda integrada)</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-semibold text-foreground min-w-[120px]">Producto:</span>
                    <span>Tipo de carga (ej: Aceite, Combustible)</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-semibold text-foreground min-w-[120px]">Origen/Destino:</span>
                    <span>Puntos de carga y descarga</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Badge className="bg-[#0038ae] h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 p-0">
                    3
                  </Badge>
                  <p>El sistema validará la disponibilidad del chofer automáticamente</p>
                </div>
                <div className="flex gap-3">
                  <Badge className="bg-[#0038ae] h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 p-0">
                    4
                  </Badge>
                  <p>Haga clic en "Crear Viaje"</p>
                </div>
              </div>

              <h4 className="font-semibold text-lg mb-3">Estados del Viaje</h4>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-yellow-500">Asignado</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">El viaje ha sido asignado pero aún no comenzó</p>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-blue-500">En Viaje</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">El chofer está actualmente realizando el viaje</p>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-green-500">Completado</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    El viaje ha sido completado y se registró la ubicación de descarga
                  </p>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-red-500">Cancelado</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">El viaje fue cancelado</p>
                </div>
              </div>

              <h4 className="font-semibold text-lg mb-3">Completar un Viaje</h4>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <Badge className="bg-[#0038ae] h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 p-0">
                    1
                  </Badge>
                  <p>Localice el viaje en la lista y haga clic en "Editar"</p>
                </div>
                <div className="flex gap-3">
                  <Badge className="bg-[#0038ae] h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 p-0">
                    2
                  </Badge>
                  <p>Cambie el estado a "Completado"</p>
                </div>
                <div className="flex gap-3">
                  <Badge className="bg-[#0038ae] h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 p-0">
                    3
                  </Badge>
                  <p>Ingrese la ubicación de descarga (ej: "Ramallo, Buenos Aires, Argentina")</p>
                </div>
                <div className="flex gap-3">
                  <Badge className="bg-[#0038ae] h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 p-0">
                    4
                  </Badge>
                  <p>Guarde los cambios - el sistema geocodificará automáticamente la ubicación</p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex gap-2">
                  <svg
                    className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <p className="font-semibold text-green-900 mb-1">Geocodificación Automática</p>
                    <p className="text-green-800 text-sm">
                      El sistema convierte automáticamente las direcciones ingresadas en coordenadas para mostrarlas en
                      el mapa de choferes.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 5.3 Drivers */}
          <Card className="mb-6">
            <CardHeader className="bg-muted">
              <CardTitle className="text-xl">5.3 Gestión de Choferes</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <h4 className="font-semibold text-lg mb-3">Registrar un Chofer</h4>
              <div className="space-y-3 mb-6">
                <div className="flex gap-3">
                  <Badge className="bg-[#0038ae] h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 p-0">
                    1
                  </Badge>
                  <p>Acceda a "Choferes" y haga clic en "Agregar Chofer"</p>
                </div>
                <div className="flex gap-3">
                  <Badge className="bg-[#0038ae] h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 p-0">
                    2
                  </Badge>
                  <p>Complete la información personal y de contacto</p>
                </div>
                <div className="flex gap-3">
                  <Badge className="bg-[#0038ae] h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 p-0">
                    3
                  </Badge>
                  <p>Asigne los vehículos (Chasis y Semiremolque) que operará</p>
                </div>
                <div className="flex gap-3">
                  <Badge className="bg-[#0038ae] h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 p-0">
                    4
                  </Badge>
                  <p>Guarde el registro</p>
                </div>
              </div>

              <h4 className="font-semibold text-lg mb-3">Estados de Disponibilidad</h4>
              <p className="mb-3 text-muted-foreground">
                El sistema controla automáticamente la disponibilidad de cada chofer:
              </p>
              <div className="space-y-2 ml-6">
                <li className="list-disc">
                  <strong className="text-green-600">Disponible:</strong> El chofer puede ser asignado a nuevos viajes
                </li>
                <li className="list-disc">
                  <strong className="text-orange-600">Ocupado:</strong> El chofer tiene un viaje asignado o en curso
                </li>
                <li className="list-disc">
                  <strong className="text-red-600">En Mantenimiento:</strong> El vehículo del chofer está en servicio
                </li>
              </div>
            </CardContent>
          </Card>

          {/* 5.4 Map */}
          <Card className="mb-6">
            <CardHeader className="bg-muted">
              <CardTitle className="text-xl">5.4 Mapa de Choferes</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="mb-4">
                El mapa interactivo muestra la última ubicación de descarga de cada chofer para facilitar la asignación
                eficiente de viajes.
              </p>
              <h4 className="font-semibold text-lg mb-3">Funcionalidades</h4>
              <div className="space-y-2 ml-6 mb-6">
                <li className="list-disc">Visualización geográfica de todos los choferes</li>
                <li className="list-disc">Marcadores con información del chofer al hacer clic</li>
                <li className="list-disc">Fecha y hora de la última descarga</li>
                <li className="list-disc">Ubicación exacta (ciudad, provincia)</li>
                <li className="list-disc">Vehículos asignados (chasis y semi)</li>
              </div>

              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex gap-2">
                  <svg
                    className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                  <div>
                    <p className="font-semibold text-purple-900 mb-1">Optimización de Rutas</p>
                    <p className="text-purple-800 text-sm">
                      Use el mapa para identificar qué chofer está más cerca del punto de carga y asignarle el viaje
                      para mayor eficiencia.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 5.5 Clients */}
          <Card className="mb-6">
            <CardHeader className="bg-muted">
              <CardTitle className="text-xl">5.5 Gestión de Clientes</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="mb-4">
                Aunque los viajes permiten ingresar el cliente manualmente, puede mantener un registro de clientes con
                información detallada.
              </p>
              <h4 className="font-semibold text-lg mb-3">Registrar un Cliente</h4>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <Badge className="bg-[#0038ae] h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 p-0">
                    1
                  </Badge>
                  <p>Acceda a "Clientes" y haga clic en "Agregar Cliente"</p>
                </div>
                <div className="flex gap-3">
                  <Badge className="bg-[#0038ae] h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 p-0">
                    2
                  </Badge>
                  <p>Complete la información de contacto y ubicación</p>
                </div>
                <div className="flex gap-3">
                  <Badge className="bg-[#0038ae] h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 p-0">
                    3
                  </Badge>
                  <p>Seleccione los productos que transporta el cliente</p>
                </div>
                <div className="flex gap-3">
                  <Badge className="bg-[#0038ae] h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 p-0">
                    4
                  </Badge>
                  <p>Agregue responsables y comentarios si es necesario</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section 6: Support */}
        <div id="support" className="mb-12 scroll-mt-24">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-[#0038ae] flex items-center justify-center text-white font-bold text-xl">
              6
            </div>
            <h2 className="text-3xl font-bold">Soporte y Ayuda</h2>
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-3">Preguntas Frecuentes</h3>
                  <div className="space-y-4">
                    <div className="border-l-4 border-[#0038ae] pl-4">
                      <p className="font-semibold mb-1">¿Cómo recupero mi contraseña?</p>
                      <p className="text-sm text-muted-foreground">
                        Contacte a su administrador del sistema para restablecer su contraseña de acceso.
                      </p>
                    </div>
                    <div className="border-l-4 border-[#0038ae] pl-4">
                      <p className="font-semibold mb-1">¿Puedo usar la aplicación desde mi teléfono?</p>
                      <p className="text-sm text-muted-foreground">
                        Sí, la aplicación está optimizada para funcionar en dispositivos móviles, tablets y computadoras
                        de escritorio.
                      </p>
                    </div>
                    <div className="border-l-4 border-[#0038ae] pl-4">
                      <p className="font-semibold mb-1">¿Con qué frecuencia se actualizan las alertas?</p>
                      <p className="text-sm text-muted-foreground">
                        Las alertas se calculan en tiempo real cada vez que accede al sistema y se basan en los
                        intervalos configurados para cada tipo de mantenimiento.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3">Contacto de Soporte</h3>
                  <div className="p-6 bg-muted rounded-lg">
                    <p className="mb-4">Si tiene problemas técnicos o necesita asistencia, contacte a:</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-[#0038ae]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                        <span className="font-semibold">Email:</span>
                        <span>soporte@cronos-logistica.com</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-[#0038ae]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                        <span className="font-semibold">Teléfono:</span>
                        <span>Consulte con su administrador</span>
                      </div>
                    </div>
                  </div>
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
          <p className="text-sm">Sistema de Gestión Logística - Versión 1.0</p>
          <p className="text-sm">© 2025 Cronos. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  )
}
