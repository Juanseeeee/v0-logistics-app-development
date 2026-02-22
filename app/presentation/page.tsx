import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Truck, MapPin, Wrench, BarChart3, Calendar, AlertTriangle } from "lucide-react"

export default function PresentationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-[#0038ae] text-white py-8">
        <div className="container mx-auto px-4">
          <Link href="/hub">
            <Button variant="ghost" className="text-white hover:bg-white/10 mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Hub
            </Button>
          </Link>
          <h1 className="text-4xl font-bold mb-2">Sistema de Gestión Cronos</h1>
          <p className="text-xl text-blue-100">Plataforma integral para gestión de flota y operaciones logísticas</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-12">
        {/* Sección 1: Hub Central */}
        <section>
          <div className="mb-6">
            <Badge className="bg-[#0038ae] text-white mb-2">Pantalla Principal</Badge>
            <h2 className="text-3xl font-bold text-gray-900">Hub Central</h2>
            <p className="text-gray-600 mt-2">Acceso rápido a las dos áreas principales del sistema</p>
          </div>

          <Card className="overflow-hidden shadow-xl">
            <CardContent className="p-8 bg-white">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-[#0038ae]">
                  <Truck className="h-12 w-12 text-[#0038ae] mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Gestión de Flota</h3>
                  <p className="text-gray-700 mb-4">Control completo de vehículos propios de Cronos</p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Vehículos (Chasis y Semiremolques)</li>
                    <li>• Mantenimientos y alertas</li>
                    <li>• Reportes de gastos</li>
                    <li>• Productos transportados</li>
                  </ul>
                </div>

                <div className="p-8 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border-2 border-purple-600">
                  <MapPin className="h-12 w-12 text-purple-600 mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Gestión Logística</h3>
                  <p className="text-gray-700 mb-4">Coordinación de viajes propios y tercerizados</p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Control de viajes</li>
                    <li>• Gestión de choferes</li>
                    <li>• Mapa de ubicaciones</li>
                    <li>• Disponibilidad en tiempo real</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Sección 2: Gestión de Flota */}
        <section>
          <div className="mb-6">
            <Badge className="bg-[#0038ae] text-white mb-2">Gestión de Flota</Badge>
            <h2 className="text-3xl font-bold text-gray-900">Dashboard de Vehículos</h2>
            <p className="text-gray-600 mt-2">Monitoreo integral de la flota propia de Cronos</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Total Vehículos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-[#0038ae]">30</div>
                <p className="text-sm text-gray-600 mt-1">15 Chasis + 15 Semiremolques</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Alertas Activas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-orange-500">8</div>
                <p className="text-sm text-gray-600 mt-1">5 críticas, 3 advertencias</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Gastos del Mes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-green-600">$245K</div>
                <p className="text-sm text-gray-600 mt-1">Combustible + Mantenimiento</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Alertas de Mantenimiento</CardTitle>
              <CardDescription>Próximos servicios programados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="font-semibold text-gray-900">VTV - Scania R450 (AA123BB)</p>
                      <p className="text-sm text-gray-600">Vence en 5 días - 20/12/2024</p>
                    </div>
                  </div>
                  <Badge variant="destructive">Crítico</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Wrench className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="font-semibold text-gray-900">Cambio de Aceite - Mercedes-Benz Actros (AA456CC)</p>
                      <p className="text-sm text-gray-600">Faltan 2,500 km</p>
                    </div>
                  </div>
                  <Badge className="bg-orange-500">Advertencia</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-semibold text-gray-900">Revisión General - Volvo FH16 (AA789DD)</p>
                      <p className="text-sm text-gray-600">Programado para 25/12/2024</p>
                    </div>
                  </div>
                  <Badge variant="secondary">Próximo</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Sección 3: Reportes */}
        <section>
          <div className="mb-6">
            <Badge className="bg-[#0038ae] text-white mb-2">Análisis y Reportes</Badge>
            <h2 className="text-3xl font-bold text-gray-900">Tabla de Gastos por Vehículo</h2>
            <p className="text-gray-600 mt-2">Vista consolidada de costos operativos</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Gastos Mensuales por Vehículo
              </CardTitle>
              <CardDescription>Filtrable por patente o categoría</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3 text-left font-semibold">Vehículo</th>
                      <th className="p-3 text-left font-semibold">Tipo</th>
                      <th className="p-3 text-right font-semibold">Combustible</th>
                      <th className="p-3 text-right font-semibold">Mantenimiento</th>
                      <th className="p-3 text-right font-semibold">Total</th>
                      <th className="p-3 text-center font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr className="hover:bg-gray-50">
                      <td className="p-3">
                        <div className="font-semibold">Scania R450</div>
                        <div className="text-sm text-gray-600">AA123BB</div>
                      </td>
                      <td className="p-3">
                        <Badge variant="secondary">Chasis</Badge>
                      </td>
                      <td className="p-3 text-right font-medium">$45,000</td>
                      <td className="p-3 text-right font-medium">$12,500</td>
                      <td className="p-3 text-right font-bold text-[#0038ae]">$57,500</td>
                      <td className="p-3 text-center">
                        <Button variant="ghost" size="sm">
                          Ver Detalle
                        </Button>
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-3">
                        <div className="font-semibold">Mercedes-Benz Actros</div>
                        <div className="text-sm text-gray-600">AA456CC</div>
                      </td>
                      <td className="p-3">
                        <Badge variant="secondary">Chasis</Badge>
                      </td>
                      <td className="p-3 text-right font-medium">$38,200</td>
                      <td className="p-3 text-right font-medium">$8,900</td>
                      <td className="p-3 text-right font-bold text-[#0038ae]">$47,100</td>
                      <td className="p-3 text-center">
                        <Button variant="ghost" size="sm">
                          Ver Detalle
                        </Button>
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-3">
                        <div className="font-semibold">Randon Sider</div>
                        <div className="text-sm text-gray-600">BB789EE</div>
                      </td>
                      <td className="p-3">
                        <Badge className="bg-purple-600">Semiremolque</Badge>
                      </td>
                      <td className="p-3 text-right font-medium">-</td>
                      <td className="p-3 text-right font-medium">$6,400</td>
                      <td className="p-3 text-right font-bold text-[#0038ae]">$6,400</td>
                      <td className="p-3 text-center">
                        <Button variant="ghost" size="sm">
                          Ver Detalle
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Sección 4: Control de Viajes */}
        <section>
          <div className="mb-6">
            <Badge className="bg-purple-600 text-white mb-2">Gestión Logística</Badge>
            <h2 className="text-3xl font-bold text-gray-900">Control de Viajes</h2>
            <p className="text-gray-600 mt-2">Sistema de seguimiento con código de colores</p>
          </div>

          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex gap-6 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-white border-2 border-gray-300 rounded"></div>
                  <span className="text-sm">Pendiente (No descargó)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-green-500 rounded"></div>
                  <span className="text-sm">Completado L2</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-purple-500 rounded"></div>
                  <span className="text-sm">Completado L1</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-red-500 rounded"></div>
                  <span className="text-sm">Cancelado</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-red-600">Texto Rojo</span>
                  <span className="text-sm">= Particularidad</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Viajes Activos</CardTitle>
              <CardDescription>Operaciones del día con estado en tiempo real</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3 text-left font-semibold">N° Viaje</th>
                      <th className="p-3 text-left font-semibold">Fecha</th>
                      <th className="p-3 text-left font-semibold">Chofer</th>
                      <th className="p-3 text-left font-semibold">Cliente</th>
                      <th className="p-3 text-left font-semibold">Producto</th>
                      <th className="p-3 text-left font-semibold">Origen → Destino</th>
                      <th className="p-3 text-center font-semibold">Línea</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr className="bg-white hover:bg-gray-50">
                      <td className="p-3 font-bold">#1523</td>
                      <td className="p-3">17/12/2024</td>
                      <td className="p-3">Carlos Rodríguez</td>
                      <td className="p-3">GBE</td>
                      <td className="p-3">Aceite</td>
                      <td className="p-3">Rosario → Buenos Aires</td>
                      <td className="p-3 text-center">
                        <Badge variant="secondary">L2</Badge>
                      </td>
                    </tr>
                    <tr className="bg-green-500 text-white hover:bg-green-600">
                      <td className="p-3 font-bold">#1522</td>
                      <td className="p-3">17/12/2024</td>
                      <td className="p-3">María González</td>
                      <td className="p-3">GBE</td>
                      <td className="p-3">Glicerina</td>
                      <td className="p-3">Ramallo → Mendoza</td>
                      <td className="p-3 text-center">
                        <Badge className="bg-green-700">L2</Badge>
                      </td>
                    </tr>
                    <tr className="bg-purple-500 text-white hover:bg-purple-600">
                      <td className="p-3 font-bold">#1521</td>
                      <td className="p-3">16/12/2024</td>
                      <td className="p-3">Jorge López</td>
                      <td className="p-3">GBE</td>
                      <td className="p-3">Gas Oil</td>
                      <td className="p-3">San Lorenzo → Córdoba</td>
                      <td className="p-3 text-center">
                        <Badge className="bg-purple-700">L1</Badge>
                      </td>
                    </tr>
                    <tr className="bg-red-500 text-white hover:bg-red-600">
                      <td className="p-3 font-bold text-red-100">#1520</td>
                      <td className="p-3">16/12/2024</td>
                      <td className="p-3">Ana Martínez</td>
                      <td className="p-3">GBE</td>
                      <td className="p-3">Combustible</td>
                      <td className="p-3">Villa Constitución → Rosario</td>
                      <td className="p-3 text-center">
                        <Badge className="bg-red-700">Cancelado</Badge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Sección 5: Mapa de Choferes */}
        <section>
          <div className="mb-6">
            <Badge className="bg-purple-600 text-white mb-2">Ubicación en Tiempo Real</Badge>
            <h2 className="text-3xl font-bold text-gray-900">Mapa de Últimas Descargas</h2>
            <p className="text-gray-600 mt-2">Optimización de asignación de viajes por proximidad</p>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="relative h-96 bg-gradient-to-br from-blue-100 to-green-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="h-16 w-16 text-[#0038ae] mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Mapa Interactivo</h3>
                  <p className="text-gray-600 max-w-md">
                    Visualización de la última ubicación de descarga de cada chofer, con marcadores tipo camión y
                    paneles informativos
                  </p>
                </div>

                {/* Marcadores simulados */}
                <div className="absolute top-20 left-32 bg-white p-2 rounded-lg shadow-lg border-2 border-[#0038ae]">
                  <Truck className="h-6 w-6 text-[#0038ae]" />
                </div>
                <div className="absolute bottom-32 right-24 bg-white p-2 rounded-lg shadow-lg border-2 border-green-600">
                  <Truck className="h-6 w-6 text-green-600" />
                </div>
                <div className="absolute top-48 right-48 bg-white p-2 rounded-lg shadow-lg border-2 border-purple-600">
                  <Truck className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Sección 6: Disponibilidad de Choferes */}
        <section>
          <div className="mb-6">
            <Badge className="bg-purple-600 text-white mb-2">Recursos Humanos</Badge>
            <h2 className="text-3xl font-bold text-gray-900">Disponibilidad de Choferes</h2>
            <p className="text-gray-600 mt-2">Estado en tiempo real para asignación eficiente</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-l-4 border-green-500">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                  <CardTitle className="text-lg">Carlos Rodríguez</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-2">Última descarga: Rosario</p>
                <p className="text-sm text-gray-600 mb-3">Hace 2 horas</p>
                <Badge className="bg-green-500">Disponible</Badge>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-orange-500">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 bg-orange-500 rounded-full animate-pulse"></div>
                  <CardTitle className="text-lg">María González</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-2">Viaje activo a Mendoza</p>
                <p className="text-sm text-gray-600 mb-3">Retorna: 18/12</p>
                <Badge className="bg-orange-500">En Viaje</Badge>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-red-500">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 bg-red-500 rounded-full"></div>
                  <CardTitle className="text-lg">Jorge López</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-2">Mantenimiento VTV</p>
                <p className="text-sm text-gray-600 mb-3">Programado: 20/12</p>
                <Badge variant="destructive">No Disponible</Badge>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center py-8 border-t">
          <p className="text-gray-600 mb-4">Sistema desarrollado para Cronos - Logística Sustentable</p>
          <Link href="/hub">
            <Button className="bg-[#0038ae] hover:bg-[#002a85]">Acceder al Sistema</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
