"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { TripControlTable } from "@/components/trip-control-table"

interface Trip {
  id: string
  trip_number: number
  date: string
  client_name: string
  line: string
  driver_id: string
  product: string
  loading_location: string
  unloading_location: string
  status: string
  unloading_address: string | null
  unloading_lat: number | null
  unloading_lng: number | null
  notes: string | null
  completed_at: string | null
  driver: {
    id: string
    name: string
    cuit: string
    chasis: {
      id: string
      patent_chasis: string
      vehicle_type: string
      transport_company: string
      transport_company_id: string
      transport_companies: {
        id: string
        name: string
      }
    } | null
    semi: {
      id: string
      patent_chasis: string
      vehicle_type: string
    } | null
  }
}

interface Driver {
  id: string
  name: string
  cuit: string
  chasis: {
    id: string
    patent_chasis: string
    vehicle_type: string
    transport_company: string
  } | null
  semi: {
    id: string
    patent_chasis: string
    vehicle_type: string
  } | null
}

interface Client {
  id: string
  company: string
}

interface Product {
  id: string
  name: string
}

interface Location {
  id: string
  name: string
  city: string | null
  active: boolean
}

export default function TripsPage() {
  const router = useRouter()
  const [trips, setTrips] = useState<Trip[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null)
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const supabase = createClient()

      const { data: tripsData } = await supabase
        .from("trips")
        .select(
          `
          *,
          driver:driver_id(
            id,
            name,
            cuit,
            chasis:chasis_id(
              id, 
              patent_chasis, 
              vehicle_type, 
              transport_company,
              transport_company_id,
              transport_companies:transport_company_id(id, name)
            ),
            semi:semi_id(id, patent_chasis, vehicle_type)
          )
        `,
        )
        .order("date", { ascending: false })
        .order("trip_number", { ascending: false })

      const { data: driversData } = await supabase
        .from("drivers")
        .select(
          `
          *,
          chasis:chasis_id(id, patent_chasis, vehicle_type, transport_company),
          semi:semi_id(id, patent_chasis, vehicle_type)
        `,
        )
        .eq("active", true)
        .order("name", { ascending: true })

      const { data: clientsData } = await supabase
        .from("clients")
        .select("id, company")
        .order("company", { ascending: true })

      const { data: locationsData } = await supabase
        .from("locations")
        .select("id, name, city, active")
        .eq("active", true)
        .order("name", { ascending: true })

      setTrips(tripsData || [])
      setDrivers(driversData || [])
      setClients(clientsData || [])
      setLocations(locationsData || [])
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleClientChange = async (clientId: string): Promise<Product[]> => {
    try {
      const supabase = createClient()

      const { data: clientProducts } = await supabase
        .from("client_products")
        .select(`
          product_id,
          products:product_id(id, name)
        `)
        .eq("client_id", clientId)

      if (!clientProducts) return []

      const productsList = clientProducts.map((cp: any) => ({
        id: cp.products.id,
        name: cp.products.name,
      }))

      setProducts(productsList)
      return productsList
    } catch (error) {
      console.error("Error loading client products:", error)
      return []
    }
  }

  const handleEdit = (trip: Trip) => {
    setEditingTrip(trip)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleCancelEdit = () => {
    setEditingTrip(null)
  }

  const handleFormSubmit = () => {
    setEditingTrip(null)
    loadData()
  }

  const stats = {
    total: trips.length,
    byStatus: {
      pending: trips.filter((t) => t.status === "pendiente").length,
      completado_l2: trips.filter((t) => t.status === "completado_l2").length,
      completado_l1: trips.filter((t) => t.status === "completado_l1").length,
      completado_l1_l2: trips.filter((t) => t.status === "completado_l1_l2").length,
      completado_particularidad: trips.filter((t) => t.status === "completado_particularidad").length,
      cancelled: trips.filter((t) => t.status === "cancelado").length,
    },
    byLine: {
      L1: trips.filter((t) => t.line === "L1").length,
      L2: trips.filter((t) => t.line === "L2").length,
      L1_L2: trips.filter((t) => t.line === "L1/L2").length,
    },
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Cargando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="icon">
              <Link href="/logistics">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#0038ae] flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <h1 className="text-xl font-bold">Control de Viajes</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <TripControlTable
          trips={trips}
          drivers={drivers}
          clients={clients}
          locations={locations}
          onClientChange={handleClientChange}
          onRefresh={loadData}
          stats={stats}
        />
      </div>
    </div>
  )
}
