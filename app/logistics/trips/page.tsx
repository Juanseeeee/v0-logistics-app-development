"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { TripControlTable } from "@/components/trip-control-table"
import {
  EMPTY_TRIP_FILTERS,
  fetchTripFacets,
  fetchTripStats,
  fetchTripsPage,
  type TripFacets,
  type TripFilters,
  type TripStats,
} from "@/lib/trips/query"

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
  active?: boolean
  chasis: {
    id: string
    patent_chasis: string
    vehicle_type: string
    transport_company: string
    transport_company_id?: string | null
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

interface TransportCompany {
  id: string
  name: string
}

/** How long to wait after the last keystroke before querying. */
const SEARCH_DEBOUNCE_MS = 350

export default function TripsPage() {
  const router = useRouter()

  // Reference data, loaded once.
  const [allDrivers, setAllDrivers] = useState<Driver[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [transportCompanies, setTransportCompanies] = useState<TransportCompany[]>([])
  const [facets, setFacets] = useState<TripFacets | null>(null)
  const [stats, setStats] = useState<TripStats | undefined>(undefined)

  // The current page of trips, resolved server-side from the filters below.
  const [trips, setTrips] = useState<Trip[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [filters, setFilters] = useState<TripFilters>(EMPTY_TRIP_FILTERS)
  const [currentPage, setCurrentPage] = useState(1)

  const [loading, setLoading] = useState(true)
  const [tableLoading, setTableLoading] = useState(false)
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null)
  const [products, setProducts] = useState<Product[]>([])

  // Only the free-text search is debounced; picking from a dropdown queries at once.
  const [debouncedSearch, setDebouncedSearch] = useState("")
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filters.search), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [filters.search])

  const queryFilters = useMemo<TripFilters>(
    () => ({ ...filters, search: debouncedSearch }),
    [filters, debouncedSearch],
  )

  const loadReferenceData = useCallback(async () => {
    const supabase = createClient()

    const [driversRes, clientsRes, locationsRes, companiesRes, facetsData, statsData] = await Promise.all([
      supabase
        .from("drivers")
        .select(
          `
          *,
          chasis:chasis_id(id, patent_chasis, vehicle_type, transport_company, transport_company_id),
          semi:semi_id(id, patent_chasis, vehicle_type)
        `,
        )
        .order("name", { ascending: true }),
      supabase.from("clients").select("id, company").order("company", { ascending: true }),
      supabase.from("locations").select("id, name, city, active").eq("active", true).order("name", { ascending: true }),
      supabase.from("transport_companies").select("id, name").order("name", { ascending: true }),
      fetchTripFacets(supabase),
      fetchTripStats(supabase),
    ])

    setAllDrivers((driversRes.data as Driver[]) || [])
    setClients(clientsRes.data || [])
    setLocations(locationsRes.data || [])
    setTransportCompanies(companiesRes.data || [])
    setFacets(facetsData)
    setStats(statsData)
  }, [])

  // Stale responses must not overwrite a newer one; typing fires several in a row.
  const requestIdRef = useRef(0)

  const loadTripsPage = useCallback(async () => {
    const requestId = ++requestIdRef.current
    setTableLoading(true)
    try {
      const supabase = createClient()
      const { rows, total } = await fetchTripsPage(supabase, queryFilters, currentPage, allDrivers)
      if (requestId !== requestIdRef.current) return
      setTrips(rows as Trip[])
      setTotalCount(total)
    } catch (error) {
      if (requestId === requestIdRef.current) console.error("Error loading trips:", error)
    } finally {
      if (requestId === requestIdRef.current) setTableLoading(false)
    }
  }, [queryFilters, currentPage, allDrivers])

  useEffect(() => {
    loadReferenceData()
      .catch((error) => console.error("Error loading reference data:", error))
      .finally(() => setLoading(false))
  }, [loadReferenceData])

  useEffect(() => {
    loadTripsPage()
  }, [loadTripsPage])

  const handleFiltersChange = (next: Partial<TripFilters>) => {
    setFilters((prev) => ({ ...prev, ...next }))
    setCurrentPage(1)
  }

  const handleResetFilters = () => {
    setFilters(EMPTY_TRIP_FILTERS)
    setCurrentPage(1)
  }

  /** Refresh after an edit: the current page plus the counts it may have changed. */
  const handleRefresh = useCallback(async () => {
    const supabase = createClient()
    await Promise.all([
      loadTripsPage(),
      fetchTripStats(supabase)
        .then(setStats)
        .catch((error) => console.error("Error refreshing stats:", error)),
    ])
  }, [loadTripsPage])

  // Only drivers that actually appear on a trip are worth offering as a filter.
  const driverOptions = useMemo(
    () => (facets ? allDrivers.filter((d) => facets.driverIds.has(d.id)) : []),
    [allDrivers, facets],
  )

  // Likewise for transport companies, reached through the drivers that have trips.
  const transportCompanyOptions = useMemo(() => {
    const used = new Set(
      driverOptions.map((d) => d.chasis?.transport_company_id).filter((id): id is string => Boolean(id)),
    )
    return transportCompanies.filter((c) => used.has(c.id))
  }, [driverOptions, transportCompanies])

  // The edit form should only offer drivers still in service.
  const activeDrivers = useMemo(() => allDrivers.filter((d) => d.active !== false), [allDrivers])

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
    handleRefresh()
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
          totalCount={totalCount}
          tableLoading={tableLoading}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onResetFilters={handleResetFilters}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          drivers={activeDrivers}
          searchDrivers={allDrivers}
          driverOptions={driverOptions}
          transportCompanyOptions={transportCompanyOptions}
          productOptions={facets?.products ?? []}
          loadingLocationOptions={facets?.loadingLocations ?? []}
          unloadingLocationOptions={facets?.unloadingLocations ?? []}
          clients={clients}
          locations={locations}
          onClientChange={handleClientChange}
          onRefresh={handleRefresh}
          stats={stats}
        />
      </div>
    </div>
  )
}
