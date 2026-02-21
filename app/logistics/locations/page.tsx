"use client"

import { createBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { LocationList } from "@/components/location-list"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function LocationsPage() {
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const loadLocations = async () => {
    setLoading(true)
    try {
      const supabase = createBrowserClient()
      const { data, error } = await supabase
        .from("locations")
        .select("*")
        .eq("active", true)
        .order("name", { ascending: true })

      if (error) throw error
      setLocations(data || [])
    } catch (error) {
      console.error("Error loading locations:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLocations()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link href="/logistics" prefetch={false}>
                ← Volver
              </Link>
            </Button>
            <div className="h-6 w-px bg-border mx-2" />
            <h1 className="text-xl font-bold">Ubicaciones</h1>
          </div>
          <Link href="/auth/signout" prefetch={false}>
            <Button variant="ghost">Cerrar Sesión</Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
          </div>
        ) : (
          <LocationList locations={locations} onRefresh={loadLocations} />
        )}
      </div>
    </div>
  )
}
