"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, AlertCircle, CheckCircle2, Search, ChevronsUpDown, Check } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

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

interface DriverAvailability {
  id: string
  is_available: boolean
  trip_status: string | null
  maintenance_description: string | null
  pending_trips_count: number
  upcoming_maintenance_count: number
}

interface DriverAssignment {
  driver_id: string
  driver_name: string
  assignment_type: "trip" | "maintenance"
  assignment_id: string
  assignment_date: string
  status: string
  client_name: string | null
  loading_location: string | null
  unloading_location: string | null
  description: string | null
}

interface Trip {
  id: string
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
  completed_at?: string
  particularity: string | null
}

interface TripFormData {
  date: string
  client_name: string
  line: string
  driver_id: string
  product: string
  loading_location: string
  unloading_location: string
  status: string
  notes: string
  particularity: string
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
  address: string
  city?: string
  province?: string
  location_type: string
  active: boolean
}

interface TripFormProps {
  trip?: Trip
  drivers: Driver[]
  clients: Client[]
  onClientChange?: (clientId: string) => Promise<Product[]>
  onClose?: () => void
  onSuccess?: () => void
  onRefresh?: () => void
}

const getLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function TripForm({
  trip,
  drivers,
  clients,
  onClientChange,
  onClose,
  onSuccess,
  onRefresh,
}: TripFormProps) {
  const router = useRouter()
  const loadedTripIdRef = useRef<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)
  const [geocoding, setGeocoding] = useState(false)
  const [geocodeError, setGeocodeError] = useState("")
  const [driverAvailability, setDriverAvailability] = useState<Record<string, DriverAvailability>>({})
  const [loadingAvailability, setLoadingAvailability] = useState(false)
  const [driverAssignments, setDriverAssignments] = useState<DriverAssignment[]>([])
  const [loadingAssignments, setLoadingAssignments] = useState(false)
  const [openDriverCombo, setOpenDriverCombo] = useState(false)
  const [openClientCombo, setOpenClientCombo] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<string>("")
  const [availableProducts, setAvailableProducts] = useState<Product[]>([])
  const [openProductCombo, setOpenProductCombo] = useState(false)
  const [sortedDrivers, setSortedDrivers] = useState<Driver[]>([])
  const [loadingSortedDrivers, setLoadingSortedDrivers] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [locations, setLocations] = useState<Location[]>([])
  const [loadingLocations, setLoadingLocations] = useState(false)
  const [openLoadingLocationCombo, setOpenLoadingLocationCombo] = useState(false)
  const [openUnloadingLocationCombo, setOpenUnloadingLocationCombo] = useState(false)
  const [showQuickLocationDialog, setShowQuickLocationDialog] = useState(false)
  const [quickLocationType, setQuickLocationType] = useState<"loading" | "unloading">("loading")
  const [quickLocationData, setQuickLocationData] = useState({ name: "", address: "" })

  // Quick add client state
  const [showQuickClientDialog, setShowQuickClientDialog] = useState(false)
  const [quickClientData, setQuickClientData] = useState({ company: "" })
  const [quickClientSelectedProducts, setQuickClientSelectedProducts] = useState<string[]>([])
  const [quickClientNewProduct, setQuickClientNewProduct] = useState("")
  const [allProducts, setAllProducts] = useState<{ id: string; name: string }[]>([])
  const [localClients, setLocalClients] = useState<Client[]>([])

  // Quick add driver state
  const [showQuickDriverDialog, setShowQuickDriverDialog] = useState(false)
  const [quickDriverData, setQuickDriverData] = useState({ name: "", cuit: "" })

  const [formData, setFormData] = useState<TripFormData>({
    date: getLocalDateString(), // Using local date instead of UTC
    client_name: "",
    line: "L1",
    driver_id: "",
    product: "",
    loading_location: "",
    unloading_location: "",
    status: "pendiente",
    notes: "",
    particularity: "",
  })

  useEffect(() => {
    // Only load if we have a trip and it's a different trip than we already loaded
    if (trip && trip.id !== loadedTripIdRef.current) {
      setIsLoadingData(true)
      console.log("[v0] Loading trip data for edit:", trip.id)
      loadedTripIdRef.current = trip.id

      // Set form data
      setFormData({
        date: trip.date || getLocalDateString(),
        client_name: trip.client_name || "",
        line: trip.line || "L1",
        driver_id: trip.driver_id || "",
        product: trip.product || "",
        loading_location: trip.loading_location || "",
        unloading_location: trip.unloading_location || "",
        status: trip.status || "pendiente",
        notes: trip.notes || "",
        particularity: trip.particularity || "",
      })

      if (trip.driver_id && drivers.length > 0) {
        const driver = drivers.find((d) => d.id === trip.driver_id)
        if (driver) {
          console.log("[v0] Driver found and set:", driver.name)
          setSelectedDriver(driver)
          setSelectedDriverId(trip.driver_id)
        }
      }

      // Set selected client and load products
      if (trip.client_name && clients.length > 0) {
        const client = clients.find((c) => c.company === trip.client_name)
        if (client) {
          console.log("[v0] Client found:", client.company)
          setSelectedClientId(client.id)
          if (onClientChange) {
            onClientChange(client.id).then((products) => {
              console.log("[v0] Products loaded:", products.length)
              setAvailableProducts(products)
              setIsLoadingData(false)
            })
          } else {
            setIsLoadingData(false)
          }
        } else {
          setIsLoadingData(false)
        }
      } else {
        setIsLoadingData(false)
      }
    }

    // Reset the ref when there's no trip (creating new)
    if (!trip) {
      loadedTripIdRef.current = null
      setIsLoadingData(false)
    }
  }, [trip, drivers, clients, onClientChange])

  const [selectedDriverId, setSelectedDriverId] = useState<string>("")

  useEffect(() => {
    const loadDriverAvailability = async () => {
      setLoadingAvailability(true)
      try {
        const supabase = createClient()
        const { data, error } = await supabase.from("driver_availability").select("*")

        if (error) throw error

        const availabilityMap: Record<string, DriverAvailability> = {}
        data?.forEach((item: any) => {
          availabilityMap[item.id] = item
        })
        setDriverAvailability(availabilityMap)
      } catch (error) {
        console.error("Error loading driver availability:", error)
      } finally {
        setLoadingAvailability(false)
      }
    }

    loadDriverAvailability()
  }, [])

  useEffect(() => {
    const loadDriverAssignments = async () => {
      if (!selectedDriverId) {
        setDriverAssignments([])
        return
      }

      setLoadingAssignments(true)
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("driver_pending_assignments")
          .select("*")
          .eq("driver_id", selectedDriverId)
          .order("assignment_date", { ascending: true })

        if (error) throw error

        setDriverAssignments(data || [])
      } catch (error) {
        console.error("Error loading driver assignments:", error)
        setDriverAssignments([])
      } finally {
        setLoadingAssignments(false)
      }
    }

    loadDriverAssignments()
  }, [selectedDriverId])

  const sortDriversByProximity = async () => {
    if (!formData.loading_location || formData.loading_location.length < 3) {
      setSortedDrivers(drivers)
      return
    }

    setLoadingSortedDrivers(true)
    try {
      // Geocode the loading location
      const loadingCoords = await geocodeAddress(formData.loading_location)
      if (!loadingCoords) {
        setSortedDrivers(drivers)
        return
      }

      // Get last locations for all drivers
      const supabase = createClient()
      const { data: lastLocations } = await supabase
        .from("driver_last_locations")
        .select("driver_id, unloading_lat, unloading_lng")

      if (!lastLocations) {
        setSortedDrivers(drivers)
        return
      }

      // Calculate distances and sort
      const driversWithDistance = drivers.map((driver) => {
        const location = lastLocations.find((loc) => loc.driver_id === driver.id)
        if (!location || !location.unloading_lat || !location.unloading_lng) {
          return { driver, distance: Number.POSITIVE_INFINITY }
        }

        // Calculate Haversine distance
        const R = 6371 // Earth's radius in km
        const dLat = ((loadingCoords.lat - Number(location.unloading_lat)) * Math.PI) / 180
        const dLon = ((loadingCoords.lng - Number(location.unloading_lng)) * Math.PI) / 180
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((Number(location.unloading_lat) * Math.PI) / 180) *
            Math.cos((loadingCoords.lat * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        const distance = R * c

        return { driver, distance }
      })

      driversWithDistance.sort((a, b) => a.distance - b.distance)
      setSortedDrivers(driversWithDistance.map((d) => d.driver))
    } catch (error) {
      console.error("Error sorting drivers:", error)
      setSortedDrivers(drivers)
    } finally {
      setLoadingSortedDrivers(false)
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      sortDriversByProximity()
    }, 500) // Debounce for 500ms

    return () => clearTimeout(timeoutId)
  }, [formData.loading_location, drivers])

  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=ar`,
      )

      if (!response.ok) throw new Error("Error al consultar el servicio de geocodificación")

      const data = await response.json()

      if (data.length === 0) {
        return null
      }

      return {
        lat: Number.parseFloat(data[0].lat),
        lng: Number.parseFloat(data[0].lon),
      }
    } catch (error) {
      console.error("Geocoding error:", error)
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.driver_id || !formData.product || !formData.loading_location || !formData.unloading_location) {
      alert("Por favor completa todos los campos obligatorios")
      return
    }

    try {
      setIsSubmitting(true)
      const supabase = createClient()

      let coordinates = null
      if (
        (formData.status === "completado_l1" ||
          formData.status === "completado_l2" ||
          formData.status === "completado_l1_l2" ||
          formData.status === "completado_particularidad") &&
        formData.unloading_location
      ) {
        setGeocoding(true)
        coordinates = await geocodeAddress(formData.unloading_location)
        if (!coordinates) {
          setGeocodeError("No se pudo geocodificar la ubicación de descarga. El viaje se guardará sin coordenadas.")
        }
        setGeocoding(false)
      }

      const tripData: any = {
        date: formData.date,
        client_name: formData.client_name,
        line: formData.line,
        driver_id: formData.driver_id,
        product: formData.product,
        loading_location: formData.loading_location,
        unloading_location: formData.unloading_location,
        transport_company: selectedDriver?.chasis?.transport_company || null,
        status: formData.status,
        unloading_address: formData.unloading_location,
        unloading_lat: coordinates?.lat || null,
        unloading_lng: coordinates?.lng || null,
        notes: formData.notes || null,
        particularity: formData.particularity || null,
      }

      if (
        (formData.status === "completado_l1" ||
          formData.status === "completado_l2" ||
          formData.status === "completado_l1_l2" ||
          formData.status === "completado_particularidad") &&
        (!trip ||
          !["completado_l1", "completado_l2", "completado_l1_l2", "completado_particularidad"].includes(trip.status))
      ) {
        tripData.completed_at = new Date().toISOString()
      }

      let error
      if (trip) {
        const result = await supabase.from("trips").update(tripData).eq("id", trip.id)
        error = result.error
      } else {
        const result = await supabase.from("trips").insert([tripData])
        error = result.error
      }

      if (error) throw error

      setFormData({
        date: getLocalDateString(), // Using local date instead of UTC
        client_name: "",
        line: "L1",
        driver_id: "",
        product: "",
        loading_location: "",
        unloading_location: "",
        status: "pendiente",
        notes: "",
        particularity: "",
      })
      setSelectedDriver(null)
      setGeocodeError("")
      setSelectedClientId("")
      setAvailableProducts([])

      if (onSuccess) {
        onSuccess()
      }

      if (onRefresh) {
        onRefresh()
      }

      onClose()
    } catch (error) {
      console.error("Error al guardar viaje:", error)
      alert("Error al guardar viaje")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      date: getLocalDateString(), // Using local date instead of UTC
      client_name: "",
      line: "L1",
      driver_id: "",
      product: "",
      loading_location: "",
      unloading_location: "",
      status: "pendiente",
      notes: "",
      particularity: "",
    })
    setSelectedDriver(null)
    setGeocodeError("")
    setSelectedClientId("")
    setAvailableProducts([])
    if (onClose) onClose()
  }

  const getDriverAvailabilityStatus = (driverId: string) => {
    const availability = driverAvailability[driverId]
    if (!availability) return null

    const pendingCount = (availability.pending_trips_count || 0) + (availability.upcoming_maintenance_count || 0)

    if (pendingCount > 0) {
      return {
        status: "has-assignments",
        message: `${availability.pending_trips_count || 0} viajes, ${availability.upcoming_maintenance_count || 0} mantenimientos`,
        icon: AlertCircle,
        color: "text-amber-600",
      }
    }

    return { status: "available", message: "Disponible", icon: CheckCircle2, color: "text-green-600" }
  }

  const handleClientSelect = async (clientId: string) => {
    const client = localClients.find((c) => c.id === clientId) || clients.find((c) => c.id === clientId)
    if (client) {
      setSelectedClientId(clientId)
      setFormData({ ...formData, client_name: client.company })
      setOpenClientCombo(false)

      // Load products for this client
      if (onClientChange) {
        const products = await onClientChange(clientId)
        setAvailableProducts(products)
      }
    }
  }

  const handleProductSelect = (productName: string) => {
    setFormData({ ...formData, product: productName })
    setOpenProductCombo(false)
  }

  const filteredDrivers = drivers.filter((driver) =>
    driver.name.toLowerCase().includes(formData.driver_id.toLowerCase()),
  )

  // Sync local clients with props
  useEffect(() => {
    setLocalClients(clients)
  }, [clients])

  // Load all products for quick client dialog
  useEffect(() => {
    const loadAllProducts = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("products")
        .select("id, name")
        .order("name", { ascending: true })
      
      if (data) {
        // Get unique product names
        const uniqueProducts = Array.from(
          new Map(data.map((p) => [p.name.toLowerCase(), p])).values()
        )
        setAllProducts(uniqueProducts)
      }
    }
    loadAllProducts()
  }, [])

  useEffect(() => {
    const loadLocations = async () => {
      setLoadingLocations(true)
      try {
        const supabase = createClient()
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
        setLoadingLocations(false)
      }
    }

    loadLocations()
  }, [])

  const handleQuickClientSave = async () => {
    if (!quickClientData.company) {
      alert("Por favor ingresa el nombre del cliente")
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      
      // Create the client
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .insert({
          company: quickClientData.company,
        })
        .select()
        .single()

      if (clientError) throw clientError

      // Create products for this client (selected existing + new ones)
      for (const productName of quickClientSelectedProducts) {
        // First check if product already exists
        const { data: existingProduct } = await supabase
          .from("products")
          .select("id")
          .eq("name", productName)
          .single()

        let productId: string

        if (existingProduct) {
          // Product exists, use its id
          productId = existingProduct.id
        } else {
          // Create new product
          const { data: newProduct, error: productError } = await supabase
            .from("products")
            .insert({ name: productName, active: true })
            .select("id")
            .single()

          if (productError) {
            console.error("Error creating product:", productError)
            continue
          }
          productId = newProduct.id
        }

        // Create relationship in client_products
        await supabase.from("client_products").insert({
          client_id: clientData.id,
          product_id: productId,
        })
      }

      // Add to local state
      setLocalClients([...localClients, clientData])

      // Select the newly created client
      setSelectedClientId(clientData.id)
      setFormData({ ...formData, client_name: clientData.company })

      // Load products for this client
      if (onClientChange) {
        const products = await onClientChange(clientData.id)
        setAvailableProducts(products)
      }

      // Reset and close
      setQuickClientData({ company: "" })
      setQuickClientSelectedProducts([])
      setQuickClientNewProduct("")
      setShowQuickClientDialog(false)
    } catch (error) {
      console.error("Error creating client:", error)
      alert("Error al crear el cliente")
    } finally {
      setLoading(false)
    }
  }

  const handleAddNewProductToList = () => {
    if (quickClientNewProduct.trim() && !quickClientSelectedProducts.includes(quickClientNewProduct.trim())) {
      setQuickClientSelectedProducts([...quickClientSelectedProducts, quickClientNewProduct.trim()])
      // Also add to allProducts if not exists
      if (!allProducts.find((p) => p.name.toLowerCase() === quickClientNewProduct.trim().toLowerCase())) {
        setAllProducts([...allProducts, { id: `new-${Date.now()}`, name: quickClientNewProduct.trim() }])
      }
      setQuickClientNewProduct("")
    }
  }

  const handleToggleProduct = (productName: string) => {
    if (quickClientSelectedProducts.includes(productName)) {
      setQuickClientSelectedProducts(quickClientSelectedProducts.filter((p) => p !== productName))
    } else {
      setQuickClientSelectedProducts([...quickClientSelectedProducts, productName])
    }
  }

  const handleQuickDriverSave = async () => {
    if (!quickDriverData.name || !quickDriverData.cuit) {
      alert("Por favor completa nombre y CUIT")
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      
      const { data: driverData, error: driverError } = await supabase
        .from("drivers")
        .insert({
          name: quickDriverData.name,
          cuit: quickDriverData.cuit,
        })
        .select(`
          id,
          name,
          cuit,
          chasis:vehicles!drivers_chasis_id_fkey(id, patent_chasis, vehicle_type, transport_company),
          semi:vehicles!drivers_semi_id_fkey(id, patent_chasis, vehicle_type)
        `)
        .single()

      if (driverError) throw driverError

      // Format driver data to match interface
      const newDriver: Driver = {
        id: driverData.id,
        name: driverData.name,
        cuit: driverData.cuit,
        chasis: driverData.chasis || null,
        semi: driverData.semi || null,
      }

      // Add to sorted drivers
      setSortedDrivers([...sortedDrivers, newDriver])

      // Select the newly created driver
      setFormData({ ...formData, driver_id: newDriver.id })
      setSelectedDriver(newDriver)
      setSelectedDriverId(newDriver.id)

      // Reset and close
      setQuickDriverData({ name: "", cuit: "" })
      setShowQuickDriverDialog(false)
    } catch (error) {
      console.error("Error creating driver:", error)
      alert("Error al crear el chofer")
    } finally {
      setLoading(false)
    }
  }

  const handleQuickLocationSave = async () => {
    if (!quickLocationData.name || !quickLocationData.address) {
      alert("Por favor completa nombre y dirección")
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("locations")
        .insert({
          name: quickLocationData.name,
          address: quickLocationData.address,
          location_type: quickLocationType === "loading" ? "loading" : "unloading",
          active: true,
        })
        .select()
        .single()

      if (error) throw error

      // Add to local state
      setLocations([...locations, data])

      // Set the newly created location in the form
      if (quickLocationType === "loading") {
        setFormData({ ...formData, loading_location: data.name })
      } else {
        setFormData({ ...formData, unloading_location: data.name })
      }

      // Reset and close
      setQuickLocationData({ name: "", address: "" })
      setShowQuickLocationDialog(false)
    } catch (error) {
      console.error("Error creating location:", error)
      alert("Error al crear la ubicación")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {isLoadingData && trip ? (
        <div className="space-y-4">
          <div className="h-4 bg-muted animate-pulse rounded" />
          <div className="h-10 bg-muted animate-pulse rounded" />
          <div className="h-10 bg-muted animate-pulse rounded" />
          <div className="h-10 bg-muted animate-pulse rounded" />
          <div className="h-10 bg-muted animate-pulse rounded" />
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </div>
      ) : (
        <>
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm font-medium text-red-900 dark:text-red-100">{error}</p>
            </div>
          )}
          {trip && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Editando viaje #{trip.id.slice(0, 8)}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Fecha</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => {
                  // The input type="date" always returns YYYY-MM-DD string
                  // We use it directly without any Date object conversion to avoid timezone issues
                  const dateValue = e.target.value
                  console.log("[v0] Date selected from input:", dateValue)
                  setFormData({ ...formData, date: dateValue })
                }}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="line">Línea</Label>
              <Select value={formData.line} onValueChange={(value) => setFormData({ ...formData, line: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="L1">L1</SelectItem>
                  <SelectItem value="L2">L2</SelectItem>
                  <SelectItem value="L1/L2">L1/L2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Estado</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => {
                const updates: Partial<TripFormData> = { status: value }

                if (value === "completado_l1") {
                  updates.line = "L1"
                } else if (value === "completado_l2") {
                  updates.line = "L2"
                } else if (value === "completado_l1_l2") {
                  updates.line = "L1/L2"
                }

                setFormData({ ...formData, ...updates })
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendiente">Pendiente (No descargado)</SelectItem>
                <SelectItem value="completado_l1">Completado L1</SelectItem>
                <SelectItem value="completado_l2">Completado L2</SelectItem>
                <SelectItem value="completado_l1_l2">Completado L1/L2</SelectItem>
                <SelectItem value="completado_particularidad">Completado con Particularidad</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="client_name">Cliente</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowQuickClientDialog(true)}
                className="h-6 px-2"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Agregar rápido
              </Button>
            </div>
            <Popover open={openClientCombo} onOpenChange={setOpenClientCombo}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openClientCombo}
                  className="w-full justify-between bg-transparent"
                >
                  {formData.client_name || "Seleccionar cliente..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Buscar cliente..." />
                  <CommandList>
                    <CommandEmpty>No se encontró el cliente.</CommandEmpty>
                    <CommandGroup>
                      {localClients.map((client) => (
                        <CommandItem
                          key={client.id}
                          value={client.company}
                          onSelect={() => handleClientSelect(client.id)}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${selectedClientId === client.id ? "opacity-100" : "opacity-0"}`}
                          />
                          {client.company}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="driver_id">Chofer</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowQuickDriverDialog(true)}
                className="h-6 px-2"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Agregar rápido
              </Button>
            </div>
            <Popover open={openDriverCombo} onOpenChange={setOpenDriverCombo}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openDriverCombo}
                  className="w-full justify-between bg-transparent"
                  disabled={loadingAvailability}
                >
                  {selectedDriver?.name || "Seleccionar chofer..."}
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar chofer..." />
                  <CommandList>
                    <CommandEmpty>No se encontró ningún chofer.</CommandEmpty>
                    <CommandGroup>
                      {sortedDrivers.map((driver) => {
                        const availability = getDriverAvailabilityStatus(driver.id)
                        const Icon = availability?.icon
                        const canSelect = true

                        return (
                          <CommandItem
                            key={driver.id}
                            value={driver.name}
                            disabled={!canSelect}
                            onSelect={() => {
                              if (canSelect) {
                                setFormData({ ...formData, driver_id: driver.id })
                                setSelectedDriver(driver)
                                setSelectedDriverId(driver.id)
                                setOpenDriverCombo(false)
                              }
                            }}
                          >
                            <div className="flex items-center gap-2 w-full">
                              {Icon && <Icon className={`h-4 w-4 ${availability?.color}`} />}
                              <span>{driver.name}</span>
                              {availability && availability.status === "has-assignments" && (
                                <span className={`text-xs ml-auto ${availability.color}`}>
                                  ({availability.message})
                                </span>
                              )}
                            </div>
                          </CommandItem>
                        )
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {formData.driver_id && driverAssignments.length > 0 && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex items-start gap-2 mb-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-amber-900 dark:text-amber-100">
                      Este chofer tiene {driverAssignments.length} asignación(es) pendiente(s)
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      Puede asignar este viaje de todas formas. Revise las asignaciones existentes:
                    </p>
                  </div>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {driverAssignments.map((assignment) => (
                    <div
                      key={assignment.assignment_id}
                      className="p-3 bg-white dark:bg-gray-900 border border-amber-200 dark:border-amber-800 rounded text-sm"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-amber-900 dark:text-amber-100">
                          {assignment.assignment_type === "trip" ? "🚚 Viaje" : "🔧 Mantenimiento"}
                        </span>
                        <span className="text-xs text-amber-700 dark:text-amber-300">
                          {new Date(assignment.assignment_date).toLocaleDateString()}
                        </span>
                      </div>
                      {assignment.assignment_type === "trip" ? (
                        <div className="text-amber-800 dark:text-amber-200">
                          <p>
                            <strong>Cliente:</strong> {assignment.client_name}
                          </p>
                          <p>
                            <strong>Carga:</strong> {assignment.loading_location}
                          </p>
                          <p>
                            <strong>Descarga:</strong> {assignment.unloading_location}
                          </p>
                          <p>
                            <strong>Estado:</strong>{" "}
                            <span className="capitalize">{assignment.status.replace("_", " ")}</span>
                          </p>
                        </div>
                      ) : (
                        <div className="text-amber-800 dark:text-amber-200">
                          <p>
                            <strong>Descripción:</strong> {assignment.description}
                          </p>
                          <p>
                            <strong>Estado:</strong> <span className="capitalize">{assignment.status}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Remove old unavailable warning */}
          </div>

          {selectedDriver && (
            <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
              <p className="font-semibold">Datos del Chofer:</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-muted-foreground">Nombre</p>
                  <p className="font-medium">{selectedDriver.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">CUIT</p>
                  <p className="font-medium">{selectedDriver.cuit}</p>
                </div>
                {selectedDriver.chasis && (
                  <>
                    <div>
                      <p className="text-muted-foreground">Chasis</p>
                      <p className="font-medium">{selectedDriver.chasis.patent_chasis}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Transporte</p>
                      <p className="font-medium">{selectedDriver.chasis.transport_company}</p>
                    </div>
                  </>
                )}
                {selectedDriver.semi && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Semi</p>
                    <p className="font-medium">{selectedDriver.semi.patent_chasis}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="product">Producto</Label>
            <Popover open={openProductCombo} onOpenChange={setOpenProductCombo}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openProductCombo}
                  className="w-full justify-between bg-transparent"
                  disabled={!selectedClientId}
                >
                  {formData.product || "Seleccionar producto..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Buscar producto..." />
                  <CommandList>
                    <CommandEmpty>No se encontró el producto.</CommandEmpty>
                    <CommandGroup>
                      {availableProducts.map((product) => (
                        <CommandItem
                          key={product.id}
                          value={product.name}
                          onSelect={() => handleProductSelect(product.name)}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${formData.product === product.name ? "opacity-100" : "opacity-0"}`}
                          />
                          {product.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {!selectedClientId && <p className="text-xs text-muted-foreground">Primero selecciona un cliente</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="loading_location">Lugar de Carga</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setQuickLocationType("loading")
                  setShowQuickLocationDialog(true)
                }}
                className="h-6 px-2"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Agregar rápido
              </Button>
            </div>
            <Popover open={openLoadingLocationCombo} onOpenChange={setOpenLoadingLocationCombo}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openLoadingLocationCombo}
                  className="w-full justify-between bg-transparent"
                  disabled={loadingLocations}
                >
                  {formData.loading_location || "Seleccionar lugar de carga..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Buscar lugar..." />
                  <CommandList>
                    <CommandEmpty>No se encontró la ubicación.</CommandEmpty>
                    <CommandGroup>
                      {locations
                        .filter((loc) => loc.location_type === "loading" || loc.location_type === "both")
                        .map((location) => (
                          <CommandItem
                            key={location.id}
                            value={location.name}
                            onSelect={() => {
                              setFormData({ ...formData, loading_location: location.name })
                              setOpenLoadingLocationCombo(false)
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${formData.loading_location === location.name ? "opacity-100" : "opacity-0"}`}
                            />
                            <div>
                              <div className="font-medium">{location.name}</div>
                              <div className="text-xs text-muted-foreground">{location.address}</div>
                            </div>
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="unloading_location">Lugar de Descarga</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setQuickLocationType("unloading")
                  setShowQuickLocationDialog(true)
                }}
                className="h-6 px-2"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Agregar rápido
              </Button>
            </div>
            <Popover open={openUnloadingLocationCombo} onOpenChange={setOpenUnloadingLocationCombo}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openUnloadingLocationCombo}
                  className="w-full justify-between bg-transparent"
                  disabled={loadingLocations}
                >
                  {formData.unloading_location || "Seleccionar lugar de descarga..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Buscar lugar..." />
                  <CommandList>
                    <CommandEmpty>No se encontró la ubicación.</CommandEmpty>
                    <CommandGroup>
                      {locations
                        .filter((loc) => loc.location_type === "unloading" || loc.location_type === "both")
                        .map((location) => (
                          <CommandItem
                            key={location.id}
                            value={location.name}
                            onSelect={() => {
                              setFormData({ ...formData, unloading_location: location.name })
                              setOpenUnloadingLocationCombo(false)
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${formData.unloading_location === location.name ? "opacity-100" : "opacity-0"}`}
                            />
                            <div>
                              <div className="font-medium">{location.name}</div>
                              <div className="text-xs text-muted-foreground">{location.address}</div>
                            </div>
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">
              {["completado_l1", "completado_l2", "completado_l1_l2", "completado_particularidad"].includes(
                formData.status,
              )
                ? "Se geocodificará automáticamente para el mapa de última ubicación"
                : "Solo se geocodifica cuando el estado es completado"}
            </p>
            {geocoding && (
              <div className="p-2 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded text-sm text-blue-900 dark:text-blue-100">
                Geocodificando ubicación...
              </div>
            )}
            {geocodeError && (
              <div className="p-2 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded text-sm text-amber-900 dark:text-amber-100">
                {geocodeError}
              </div>
            )}
          </div>

          <Dialog open={showQuickLocationDialog} onOpenChange={setShowQuickLocationDialog}>
            <DialogContent className="sm:max-w-[500px] z-[100]">
              <DialogHeader>
                <DialogTitle>
                  Agregar {quickLocationType === "loading" ? "Lugar de Carga" : "Lugar de Descarga"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="quick-location-name">Nombre</Label>
                  <Input
                    id="quick-location-name"
                    value={quickLocationData.name}
                    onChange={(e) => setQuickLocationData({ ...quickLocationData, name: e.target.value })}
                    placeholder="Ej: Puerto de Buenos Aires"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quick-location-address">Dirección</Label>
                  <Input
                    id="quick-location-address"
                    value={quickLocationData.address}
                    onChange={(e) => setQuickLocationData({ ...quickLocationData, address: e.target.value })}
                    placeholder="Ej: Av. Eduardo Madero 235"
                  />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowQuickLocationDialog(false)
                    setQuickLocationData({ name: "", address: "" })
                  }}
                >
                  Cancelar
                </Button>
                <Button type="button" onClick={handleQuickLocationSave}>
                  Guardar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Quick Add Client Dialog */}
          <Dialog open={showQuickClientDialog} onOpenChange={setShowQuickClientDialog}>
            <DialogContent className="sm:max-w-[600px] z-[100]">
              <DialogHeader>
                <DialogTitle>Agregar Cliente Rápido</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="quick-client-company">Nombre del Cliente/Empresa</Label>
                  <Input
                    id="quick-client-company"
                    value={quickClientData.company}
                    onChange={(e) => setQuickClientData({ ...quickClientData, company: e.target.value })}
                    placeholder="Ej: Transportes ABC S.A."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Productos del Cliente</Label>
                  <div className="flex gap-2">
                    <Input
                      value={quickClientNewProduct}
                      onChange={(e) => setQuickClientNewProduct(e.target.value)}
                      placeholder="Agregar nuevo producto..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          handleAddNewProductToList()
                        }
                      }}
                    />
                    <Button type="button" variant="outline" onClick={handleAddNewProductToList}>
                      Agregar
                    </Button>
                  </div>
                  <div className="border rounded-md p-3 max-h-[200px] overflow-y-auto">
                    {allProducts.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        No hay productos cargados. Agrega uno nuevo arriba.
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {allProducts.map((product) => (
                          <label
                            key={product.id}
                            className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={quickClientSelectedProducts.includes(product.name)}
                              onChange={() => handleToggleProduct(product.name)}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm">{product.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  {quickClientSelectedProducts.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {quickClientSelectedProducts.map((product) => (
                        <span
                          key={product}
                          className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-1 rounded"
                        >
                          {product}
                          <button
                            type="button"
                            onClick={() => handleToggleProduct(product)}
                            className="hover:text-destructive"
                          >
                            x
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Selecciona productos existentes o agrega nuevos. Los productos seleccionados se asignarán al cliente.
                  </p>
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowQuickClientDialog(false)
                    setQuickClientData({ company: "" })
                    setQuickClientSelectedProducts([])
                    setQuickClientNewProduct("")
                  }}
                >
                  Cancelar
                </Button>
                <Button type="button" onClick={handleQuickClientSave} disabled={loading}>
                  {loading ? "Guardando..." : "Guardar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Quick Add Driver Dialog */}
          <Dialog open={showQuickDriverDialog} onOpenChange={setShowQuickDriverDialog}>
            <DialogContent className="sm:max-w-[500px] z-[100]">
              <DialogHeader>
                <DialogTitle>Agregar Chofer Rápido</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="quick-driver-name">Nombre del Chofer</Label>
                  <Input
                    id="quick-driver-name"
                    value={quickDriverData.name}
                    onChange={(e) => setQuickDriverData({ ...quickDriverData, name: e.target.value })}
                    placeholder="Ej: Juan Pérez"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quick-driver-cuit">CUIT</Label>
                  <Input
                    id="quick-driver-cuit"
                    value={quickDriverData.cuit}
                    onChange={(e) => setQuickDriverData({ ...quickDriverData, cuit: e.target.value })}
                    placeholder="Ej: 20-12345678-9"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Nota: El chofer se creará sin vehículo asignado. Puedes asignarle vehículos después desde la sección de Choferes.
                </p>
              </div>
              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowQuickDriverDialog(false)
                    setQuickDriverData({ name: "", cuit: "" })
                  }}
                >
                  Cancelar
                </Button>
                <Button type="button" onClick={handleQuickDriverSave} disabled={loading}>
                  {loading ? "Guardando..." : "Guardar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {(formData.status === "cancelado" || formData.status === "completado_particularidad") && (
            <div className="space-y-2">
              <Label htmlFor="particularity" className="text-red-600 dark:text-red-400 font-semibold">
                Particularidad {formData.status === "cancelado" ? "(Motivo de Cancelación)" : ""}
              </Label>
              <Textarea
                id="particularity"
                placeholder="Describe la particularidad del viaje..."
                value={formData.particularity}
                onChange={(e) => setFormData({ ...formData, particularity: e.target.value })}
                required
                className="min-h-[100px] border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-red-500"
              />
              <p className="text-xs text-red-600 dark:text-red-400">
                * Campo obligatorio. Se mostrará en la tabla de viajes.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notas Adicionales (Opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Información adicional sobre el viaje..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="min-h-[80px]"
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              className="flex-1 bg-[#0038ae] hover:bg-[#0038ae]/90"
              disabled={loading || geocoding || isSubmitting}
            >
              {geocoding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Buscando ubicación...
                </>
              ) : loading || isSubmitting ? (
                trip ? (
                  "Actualizando..."
                ) : (
                  "Registrando..."
                )
              ) : trip ? (
                "Actualizar Viaje"
              ) : (
                "Registrar Viaje"
              )}
            </Button>
            {trip && (
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={loading || geocoding || isSubmitting}
              >
                Cancelar
              </Button>
            )}
          </div>
        </>
      )}
    </form>
  )
}

export default TripForm
export { TripForm }
