"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, AlertTriangle, FileText, ChevronDown, ChevronUp, LogOut } from "lucide-react"
import { DocumentList } from "@/components/document-list"
import { DocumentUploadForm } from "@/components/document-upload-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { createClient } from "@/lib/supabase/client"

interface Alert {
  id: string
  document_type_name: string
  entity_name: string | null
  expiry_date: string
  days_until_expiry: number
  urgency_level: string
}

type DocumentType = {
  id: string
  name: string
  entity_type: string
}

export default function DocumentsPage() {
  const router = useRouter()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [showUploadForm, setShowUploadForm] = useState(false)

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      setUserId(user.id)

      const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle()

      if (!userData || !userData.role) {
        router.push("/auth/login?error=no_role")
        return
      }

      setUserRole(userData.role)

      // Fetch document types
      const { data: docTypes } = await supabase.from("document_types").select("id, name, entity_type")

      if (docTypes) {
        setDocumentTypes(docTypes)
      }

      // Fetch alerts - solo para usuarios que ven sus propios documentos
      if (userData.role === "company" || userData.role === "driver") {
        const { data: alertsData } = await supabase
          .from("document_alerts")
          .select("*")
          .eq("entity_type", userData.role === "driver" ? "driver" : "company")
          .order("days_until_expiry", { ascending: true })
          .limit(5)

        const criticalAlerts =
          alertsData?.filter((a) => a.urgency_level === "critical" || a.urgency_level === "expired") || []
        setAlerts(criticalAlerts)
      }

      setLoading(false)
    }

    checkAuth()
  }, [router, refreshKey])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando documentación...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4 sm:p-6 max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <Link href={
              userRole === "documents" ? "/documents-hub" :
              "/hub"
            }>
              <Button variant="ghost" size="icon" className="shrink-0">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-3xl font-bold truncate">
                {userRole === "company"
                  ? "Mis Documentos"
                  : userRole === "driver"
                    ? "Mis Documentos"
                    : "Gestión de Documentación"}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {userRole === "company"
                  ? "Sube y gestiona la documentación de tu empresa"
                  : userRole === "driver"
                    ? "Sube y gestiona tu documentación personal"
                    : "Control y administración de documentos legales y operativos"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <ThemeToggle />
            <Button variant="outline" onClick={handleLogout} size="sm" className="text-xs sm:text-sm bg-transparent">
              <LogOut className="mr-1 sm:mr-2 h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>

        {/* Alertas de documentos */}
        {alerts.length > 0 && (
          <Card className="mb-6 border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                <AlertTriangle className="h-5 w-5" />
                Documentos que Requieren Atención
              </CardTitle>
              <CardDescription className="dark:text-red-300/70">{alerts.length} documento(s) vencido(s) o por vencer</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {alerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-3 bg-white dark:bg-card rounded-lg border dark:border-red-900/50">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium dark:text-foreground">{alert.document_type_name}</p>
                        <p className="text-sm text-muted-foreground">{alert.entity_name || "General"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={alert.urgency_level === "expired" ? "destructive" : "outline"}
                        className={
                          alert.urgency_level === "expired"
                            ? "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/50 dark:text-red-200 dark:border-red-800"
                            : "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/50 dark:text-orange-200 dark:border-orange-800"
                        }
                      >
                        {alert.urgency_level === "expired" ? "VENCIDO" : `Vence en ${alert.days_until_expiry} días`}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(alert.expiry_date).toLocaleDateString("es-AR")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Formulario de carga */}
        <div className="mb-6">
          <Button
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="w-full mb-4"
            variant={showUploadForm ? "outline" : "default"}
          >
            {showUploadForm ? (
              <>
                <ChevronUp className="mr-2 h-4 w-4" />
                Ocultar Formulario
              </>
            ) : (
              <>
                <ChevronDown className="mr-2 h-4 w-4" />
                Subir Nuevo Documento
              </>
            )}
          </Button>

          {showUploadForm && (
            <DocumentUploadForm
              userRole={userRole || ""}
              userId={userId || ""}
              documentTypes={documentTypes}
              onSuccess={() => {
                setRefreshKey((k) => k + 1)
                setShowUploadForm(false)
              }}
            />
          )}
        </div>

        {/* Lista de documentos */}
        <DocumentList key={refreshKey} userRole={userRole || ""} userId={userId || ""} />
      </div>
    </div>
  )
}
