"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface DriverLocation {
  id: string
  driver_id: string
  unloading_location: string
  unloading_address: string | null
  unloading_lat: number
  unloading_lng: number
  date: string
  completed_at: string | null
  product: string
  driver: {
    id: string
    name: string
    chasis: {
      id: string
      patent_chasis: string
      vehicle_type: string
    } | null
    semi: {
      id: string
      patent_chasis: string
      vehicle_type: string
    } | null
  }
}

export function DriverMap({ locations }: { locations: DriverLocation[] }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const [selectedDriver, setSelectedDriver] = useState<DriverLocation | null>(null)
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current || locations.length === 0) return

    if (mapInstanceRef.current) {
      return
    }

    const initMap = async () => {
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement("link")
        link.rel = "stylesheet"
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        link.crossOrigin = ""
        document.head.appendChild(link)
      }

      const L = (await import("leaflet")).default

      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      })

      const map = L.map(mapRef.current!, {
        center: [-35.0, -63.0],
        zoom: 5,
        scrollWheelZoom: true,
        zoomControl: true,
        attributionControl: false,
      })

      mapInstanceRef.current = map

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
      }).addTo(map)

      setTimeout(() => {
        map.invalidateSize()
        setMapReady(true)
      }, 300)

      const truckIcon = L.divIcon({
        className: "custom-marker",
        html: `
          <div style="
            background: #0038ae;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.25);
          ">
            <svg width="20" height="20" fill="white" viewBox="0 0 24 24">
              <path d="M18 18.5a1.5 1.5 0 0 1-1.5-1.5a1.5 1.5 0 0 1 1.5-1.5a1.5 1.5 0 0 1 1.5 1.5a1.5 1.5 0 0 1-1.5 1.5m1.5-9l1.96 2.5H17V9.5m-11 9A1.5 1.5 0 0 1 4.5 17A1.5 1.5 0 0 1 6 15.5A1.5 1.5 0 0 1 7.5 17A1.5 1.5 0 0 1 6 18.5M20 8h-3V4H3c-1.11 0-2 .89-2 2v11h2a3 3 0 0 0 3 3a3 3 0 0 0 3-3h6a3 3 0 0 0 3 3a3 3 0 0 0 3-3h2v-5z"/>
            </svg>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18],
      })

      const bounds = L.latLngBounds([])

      locations.forEach((location) => {
        const lat = location.unloading_lat
        const lng = location.unloading_lng

        if (!lat || !lng) return

        bounds.extend([lat, lng])

        const marker = L.marker([lat, lng], { icon: truckIcon }).addTo(map)

        const completedDate = location.completed_at ? new Date(location.completed_at) : new Date(location.date)

        const popupContent = `
          <div style="min-width: 220px; font-family: system-ui;">
            <div style="font-weight: 600; font-size: 15px; color: #0038ae; margin-bottom: 8px;">
              ${location.driver.name}
            </div>
            <div style="font-size: 13px; line-height: 1.6;">
              <div style="margin-bottom: 4px;">
                <span style="color: #666;">Ubicación:</span><br/>
                <strong>${location.unloading_address || location.unloading_location}</strong>
              </div>
              <div style="margin-bottom: 4px;">
                <span style="color: #666;">Producto:</span> <strong>${location.product}</strong>
              </div>
              <div style="margin-bottom: 4px;">
                <span style="color: #666;">Descarga:</span><br/>
                <strong>${completedDate.toLocaleString("es-AR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}</strong>
              </div>
              ${
                location.driver.chasis
                  ? `<div style="margin-bottom: 4px;">
                <span style="color: #666;">Chasis:</span> <strong>${location.driver.chasis.patent_chasis}</strong>
              </div>`
                  : ""
              }
              ${
                location.driver.semi
                  ? `<div>
                <span style="color: #666;">Semi:</span> <strong>${location.driver.semi.patent_chasis}</strong>
              </div>`
                  : ""
              }
            </div>
          </div>
        `

        marker.bindPopup(popupContent, {
          maxWidth: 300,
          className: "custom-popup",
        })

        marker.on("click", () => {
          setSelectedDriver(location)
        })
      })

      if (locations.length > 0 && bounds.isValid()) {
        setTimeout(() => {
          map.fitBounds(bounds, {
            padding: [50, 50],
            maxZoom: 12,
          })
        }, 400)
      }
    }

    initMap()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [locations])

  return (
    <div className="grid lg:grid-cols-[1fr_400px] gap-6">
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Última Ubicación de Choferes
            <Badge variant="secondary">
              {locations.length} chofer{locations.length !== 1 ? "es" : ""}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {locations.length === 0 ? (
            <div className="h-[600px] flex items-center justify-center bg-muted">
              <div className="text-center space-y-3 p-6">
                <svg
                  className="w-16 h-16 mx-auto text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
                <p className="text-lg font-medium text-muted-foreground">No hay viajes completados con ubicación</p>
                <p className="text-sm text-muted-foreground max-w-md">
                  Completa viajes con ubicación de descarga para ver la última posición de cada chofer en el mapa
                </p>
              </div>
            </div>
          ) : (
            <div>
              <div ref={mapRef} className="h-[700px] w-full bg-muted" style={{ minHeight: "700px" }} />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Información del Chofer</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDriver ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{selectedDriver.driver.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Última descarga:{" "}
                    {selectedDriver.completed_at
                      ? new Date(selectedDriver.completed_at).toLocaleString("es-AR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : new Date(selectedDriver.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Ubicación</p>
                    <p className="font-medium">
                      {selectedDriver.unloading_address || selectedDriver.unloading_location}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Producto</p>
                    <p className="font-medium">{selectedDriver.product}</p>
                  </div>
                  {selectedDriver.driver.chasis && (
                    <div>
                      <p className="text-muted-foreground">Chasis</p>
                      <p className="font-medium">
                        {selectedDriver.driver.chasis.patent_chasis} - {selectedDriver.driver.chasis.vehicle_type}
                      </p>
                    </div>
                  )}
                  {selectedDriver.driver.semi && (
                    <div>
                      <p className="text-muted-foreground">Semi</p>
                      <p className="font-medium">
                        {selectedDriver.driver.semi.patent_chasis} - {selectedDriver.driver.semi.vehicle_type}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground">Coordenadas</p>
                    <p className="font-mono text-xs">
                      {selectedDriver.unloading_lat}, {selectedDriver.unloading_lng}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center py-12 text-muted-foreground">Haz clic en un marcador para ver la información</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Choferes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {locations.map((location) => (
                <button
                  key={location.id}
                  onClick={() => setSelectedDriver(location)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedDriver?.id === location.id
                      ? "bg-[#0038ae] text-white border-[#0038ae]"
                      : "bg-background hover:bg-muted"
                  }`}
                >
                  <p className="font-medium">{location.driver.name}</p>
                  <p className="text-xs opacity-90 mt-1">{location.unloading_address || location.unloading_location}</p>
                  <p className="text-xs opacity-75">
                    {location.completed_at
                      ? new Date(location.completed_at).toLocaleString("es-AR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : new Date(location.date).toLocaleDateString()}
                  </p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
