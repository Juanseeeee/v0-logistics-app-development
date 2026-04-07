"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, AlertTriangle, FileText, ChevronDown, ChevronUp, LogOut, Clock3 } from "lucide-react"
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

type TransportCompany = {
  id: string
  name: string
}

type StatusFilter = "all" | "expired_or_critical" | "warning" | "valid" | "no_expiry"

export default function DocumentsPage() {
  const router = useRouter()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [urgentAlerts, setUrgentAlerts] = useState<Alert[]>([])
  const [upcomingAlerts, setUpcomingAlerts] = useState<Alert[]>([])
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([])
  const [transportCompanies, setTransportCompanies] = useState<TransportCompany[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [statusFilterPreset, setStatusFilterPreset] = useState<StatusFilter>("all")

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

      const { data: companiesData } = await supabase
        .from("transport_companies")
        .select("id, name")
        .eq("active", true)
        .order("name")

      if (companiesData) {
        setTransportCompanies(companiesData)
      }

      let alertsQuery = supabase.from("document_alerts").select("*").order("days_until_expiry", { ascending: true })

      if (userData.role === "company" || userData.role === "driver") {
        alertsQuery = alertsQuery.eq("entity_type", userData.role === "driver" ? "driver" : "company")
      }

      const { data: alertsData } = await alertsQuery

      setUrgentAlerts(alertsData?.filter((a) => a.urgency_level === "critical" || a.urgency_level === "expired") || [])
      setUpcomingAlerts(alertsData?.filter((a) => a.urgency_level === "warning") || [])

      setLoading(false)
    }

    checkAuth()
  }, [router, refreshKey])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  const openFilteredDocuments = (filter: StatusFilter) => {
    setStatusFilterPreset(filter)
    document.getElementById("documents-list-section")?.scrollIntoView({ behavior: "smooth", block: "start" })
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
            {userRole !== "driver" && (
              <Link href={
                userRole === "documents" ? "/documents-hub" :
                "/hub"
              }>
                <Button variant="ghost" size="icon" className="shrink-0">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
            )}
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

        {/* Alertas de documentos (Estilo Banner) */}
        {(urgentAlerts.length > 0 || upcomingAlerts.length > 0) && (
          <div className="grid gap-3 mb-6">
            {urgentAlerts.length > 0 && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:px-4 sm:py-3 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-full shrink-0">
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-red-800 dark:text-red-300 text-sm sm:text-base">
                      Atención requerida: {urgentAlerts.length} documento(s) vencidos o urgentes
                    </h3>
                    <p className="text-xs sm:text-sm text-red-600/80 dark:text-red-400/80">
                      Revise la documentación crítica para evitar problemas operativos.
                    </p>
                  </div>
                </div>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="w-full sm:w-auto shrink-0" 
                  onClick={() => openFilteredDocuments("expired_or_critical")}
                >
                  Revisar urgentes
                </Button>
              </div>
            )}

            {upcomingAlerts.length > 0 && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:px-4 sm:py-3 rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-full shrink-0">
                    <Clock3 className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-yellow-800 dark:text-yellow-300 text-sm sm:text-base">
                      Aviso: {upcomingAlerts.length} documento(s) próximos a vencer
                    </h3>
                    <p className="text-xs sm:text-sm text-yellow-700/80 dark:text-yellow-400/80">
                      Programe la renovación de estos documentos pronto.
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full sm:w-auto shrink-0 border-yellow-300 text-yellow-800 hover:bg-yellow-100 dark:border-yellow-700 dark:text-yellow-200 dark:hover:bg-yellow-900/50" 
                  onClick={() => openFilteredDocuments("warning")}
                >
                  Ver próximos
                </Button>
              </div>
            )}
          </div>
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
              transportCompanies={transportCompanies}
              onSuccess={() => {
                setRefreshKey((k) => k + 1)
                setShowUploadForm(false)
              }}
            />
          )}
        </div>

        {/* Lista de documentos */}
        <div id="documents-list-section">
          <DocumentList
            key={refreshKey}
            userRole={userRole || ""}
            userId={userId || ""}
            transportCompanies={transportCompanies}
            statusFilterPreset={statusFilterPreset}
          />
        </div>
      </div>
    </div>
  )
}
