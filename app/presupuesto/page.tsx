"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, CheckCircle2 } from "lucide-react"

export default function PresupuestoPage() {
  const handleDownloadPDF = () => {
    window.print()
  }

  const fecha = new Date().toLocaleDateString("es-AR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header con branding */}
        <div className="mb-8 text-center">
          <div className="mb-4">
            <div className="text-5xl font-bold text-[#0038ae] mb-2">CRONOS</div>
            <div className="text-sm text-muted-foreground">Sistema de Gestión Logística</div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Presupuesto de Desarrollo</h1>
          <p className="text-muted-foreground">{fecha}</p>
        </div>

        {/* Información del Cliente */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Información del Proyecto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Cliente</p>
                <p className="font-semibold">Cronos Logística</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Proyecto</p>
                <p className="font-semibold">Sistema de Gestión Integral</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tipo</p>
                <p className="font-semibold">Aplicación Web Full-Stack</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tecnología</p>
                <p className="font-semibold">Next.js 16 + Supabase</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Descripción del Proyecto */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Descripción del Proyecto</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              Sistema integral de gestión logística desarrollado a medida para Cronos, que incluye módulos completos de
              gestión de flota, logística de viajes, control de documentación y reportes avanzados. La aplicación cuenta
              con autenticación segura, roles de usuario diferenciados y está optimizada para uso en producción con
              tecnologías modernas.
            </p>
          </CardContent>
        </Card>

        {/* Módulos Desarrollados */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Módulos Desarrollados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Módulo 1: Gestión de Flota */}
              <div className="border-l-4 border-[#0038ae] pl-4">
                <h3 className="font-bold text-lg mb-2">1. Gestión de Flota</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#0038ae] mt-0.5 flex-shrink-0" />
                    <span>Administración completa de vehículos (Tractores, Semirremolques, Acoplados)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#0038ae] mt-0.5 flex-shrink-0" />
                    <span>Gestión de choferes con documentación y disponibilidad</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#0038ae] mt-0.5 flex-shrink-0" />
                    <span>Control de mantenimiento preventivo y correctivo</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#0038ae] mt-0.5 flex-shrink-0" />
                    <span>Registro de carga de combustible con alertas de consumo</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#0038ae] mt-0.5 flex-shrink-0" />
                    <span>Reportes detallados de gastos por vehículo</span>
                  </li>
                </ul>
                <p className="text-right font-bold mt-2">ARS $1.000.000</p>
              </div>

              {/* Módulo 2: Gestión Logística */}
              <div className="border-l-4 border-[#0038ae] pl-4">
                <h3 className="font-bold text-lg mb-2">2. Gestión Logística de Viajes</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#0038ae] mt-0.5 flex-shrink-0" />
                    <span>Control integral de viajes con estados diferenciados (Línea 1 y Línea 2)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#0038ae] mt-0.5 flex-shrink-0" />
                    <span>Asignación automática de choferes según disponibilidad</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#0038ae] mt-0.5 flex-shrink-0" />
                    <span>Geocodificación de ubicaciones de carga y descarga</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#0038ae] mt-0.5 flex-shrink-0" />
                    <span>Mapa interactivo con ubicaciones de choferes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#0038ae] mt-0.5 flex-shrink-0" />
                    <span>Gestión de clientes y productos transportados</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#0038ae] mt-0.5 flex-shrink-0" />
                    <span>Exportación de viajes a Excel con filtros avanzados</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#0038ae] mt-0.5 flex-shrink-0" />
                    <span>Generación de PDF profesional por viaje</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#0038ae] mt-0.5 flex-shrink-0" />
                    <span>Sistema de paginación para manejo de grandes volúmenes</span>
                  </li>
                </ul>
                <p className="text-right font-bold mt-2">ARS $1.000.000</p>
              </div>

              {/* Módulo 3: Gestión de Documentación */}
              <div className="border-l-4 border-[#0038ae] pl-4">
                <h3 className="font-bold text-lg mb-2">3. Gestión de Documentación</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#0038ae] mt-0.5 flex-shrink-0" />
                    <span>Sistema completo de carga y gestión de documentos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#0038ae] mt-0.5 flex-shrink-0" />
                    <span>Alertas automáticas de vencimiento (crítico, advertencia)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#0038ae] mt-0.5 flex-shrink-0" />
                    <span>Categorización por tipo: Empresa, Vehículos, Choferes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#0038ae] mt-0.5 flex-shrink-0" />
                    <span>Portal específico para empresas/clientes/choferes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#0038ae] mt-0.5 flex-shrink-0" />
                    <span>Filtros avanzados por fecha y tipo de documento</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#0038ae] mt-0.5 flex-shrink-0" />
                    <span>Integración con almacenamiento en la nube (Vercel Blob)</span>
                  </li>
                </ul>
                <p className="text-right font-bold mt-2">ARS $500.000</p>
              </div>

              {/* Módulo 4: Autenticación y Seguridad */}
              <div className="border-l-4 border-[#0038ae] pl-4">
                <h3 className="font-bold text-lg mb-2">4. Autenticación y Seguridad</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#0038ae] mt-0.5 flex-shrink-0" />
                    <span>Sistema de autenticación seguro con Supabase Auth</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#0038ae] mt-0.5 flex-shrink-0" />
                    <span>Roles de usuario diferenciados (Admin, Documents, Company, Driver)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#0038ae] mt-0.5 flex-shrink-0" />
                    <span>Row Level Security (RLS) en base de datos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#0038ae] mt-0.5 flex-shrink-0" />
                    <span>Middleware de protección de rutas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#0038ae] mt-0.5 flex-shrink-0" />
                    <span>Control de acceso basado en roles</span>
                  </li>
                </ul>
                <p className="text-right font-semibold text-[#0038ae] mt-2">Incluido en el presupuesto total</p>
              </div>

              {/* Módulo 5: Base de Datos y Infraestructura */}
              <div className="border-l-4 border-[#0038ae] pl-4">
                <h3 className="font-bold text-lg mb-2">5. Base de Datos e Infraestructura</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#0038ae] mt-0.5 flex-shrink-0" />
                    <span>Diseño y modelado completo de base de datos PostgreSQL</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#0038ae] mt-0.5 flex-shrink-0" />
                    <span>18 scripts de migración y configuración</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#0038ae] mt-0.5 flex-shrink-0" />
                    <span>Datos de prueba y usuarios de demostración</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#0038ae] mt-0.5 flex-shrink-0" />
                    <span>Optimización de consultas y índices</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#0038ae] mt-0.5 flex-shrink-0" />
                    <span>Deploy en producción (Vercel)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#0038ae] mt-0.5 flex-shrink-0" />
                    <span>Configuración de dominio y SSL</span>
                  </li>
                </ul>
                <p className="text-right font-semibold text-[#0038ae] mt-2">Incluido en el presupuesto total</p>
              </div>

              {/* Módulo 6: Interfaz y Experiencia de Usuario */}
              <div className="border-l-4 border-[#0038ae] pl-4">
                <h3 className="font-bold text-lg mb-2">6. Interfaz y Experiencia de Usuario</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#0038ae] mt-0.5 flex-shrink-0" />
                    <span>Diseño profesional con branding corporativo</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#0038ae] mt-0.5 flex-shrink-0" />
                    <span>Interfaz responsive (desktop, tablet, móvil)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#0038ae] mt-0.5 flex-shrink-0" />
                    <span>Componentes reutilizables con shadcn/ui</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#0038ae] mt-0.5 flex-shrink-0" />
                    <span>Tablas interactivas con búsqueda y filtros</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#0038ae] mt-0.5 flex-shrink-0" />
                    <span>Mapas interactivos con Leaflet</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#0038ae] mt-0.5 flex-shrink-0" />
                    <span>Manual de usuario integrado</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#0038ae] mt-0.5 flex-shrink-0" />
                    <span>Página de presentación para cliente</span>
                  </li>
                </ul>
                <p className="text-right font-semibold text-[#0038ae] mt-2">Incluido en el presupuesto total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumen de Costos */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Resumen de Inversión</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal Desarrollo</span>
                <span>ARS $2.500.000</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Soporte y Correcciones (30 días)</span>
                <span>Incluido</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Capacitación de Usuario</span>
                <span>Incluido</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Documentación Técnica</span>
                <span>Incluido</span>
              </div>
              <div className="border-t pt-3 flex justify-between text-xl font-bold text-[#0038ae]">
                <span>TOTAL</span>
                <span>ARS $2.500.000</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Forma de Pago */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Forma de Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-muted-foreground">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#0038ae] mt-0.5 flex-shrink-0" />
                <span className="font-semibold">A convenir según acuerdo con la empresa</span>
              </div>
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm font-semibold mb-2">Forma de pago recomendada:</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#0038ae] mt-0.5 flex-shrink-0" />
                    <span>50% al inicio del proyecto: ARS $1.250.000</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#0038ae] mt-0.5 flex-shrink-0" />
                    <span>50% al finalizar y entregar el proyecto: ARS $1.250.000</span>
                  </div>
                </div>
              </div>
              <p className="text-sm mt-4 italic">
                * Se aceptan transferencias bancarias y otros medios de pago a acordar.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Garantía y Soporte */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Garantía y Soporte Post-Entrega</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-muted-foreground">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#0038ae] mt-0.5 flex-shrink-0" />
                <span>30 días de soporte técnico incluido sin cargo adicional</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#0038ae] mt-0.5 flex-shrink-0" />
                <span>Corrección de errores y bugs sin costo durante el período de garantía</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#0038ae] mt-0.5 flex-shrink-0" />
                <span>Soporte extendido posterior: a convenir según necesidades de la empresa</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#0038ae] mt-0.5 flex-shrink-0" />
                <span>Manual de usuario completo y documentación técnica</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Servicios Adicionales Opcionales */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Servicios Adicionales (Opcional)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Soporte mensual extendido</span>
                <span className="font-semibold">ARS $80.000/mes</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Desarrollo de nuevas funcionalidades</span>
                <span className="font-semibold">A cotizar</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hosting y mantenimiento mensual (Vercel Pro)</span>
                <span className="font-semibold">USD $25/mes</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Validez */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              Presupuesto válido por 30 días desde la fecha de emisión.
              <br />
              Los precios están expresados en Pesos Argentinos (ARS) y pueden estar sujetos a ajustes por inflación en
              caso de demora en la confirmación.
            </p>
          </CardContent>
        </Card>

        {/* Botón de Descarga */}
        <div className="flex justify-center mb-8 print:hidden">
          <Button onClick={handleDownloadPDF} size="lg" className="bg-[#0038ae] hover:bg-[#002a8a]">
            <Download className="h-5 w-5 mr-2" />
            Descargar / Imprimir PDF
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground border-t pt-4">
          <p className="font-semibold text-foreground mb-1">CRONOS - Sistema de Gestión Logística</p>
          <p>Para consultas: contacto@cronos.com | Tel: +54 11 XXXX-XXXX</p>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            margin: 2cm;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
