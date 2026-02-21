"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import * as XLSX from "xlsx"
import { createClient } from "@/lib/supabase/client"

interface ImportResult {
  success: boolean
  message: string
  details?: {
    vehiclesCreated?: number
    driversCreated?: number
    clientsCreated?: number
    errors: string[]
  }
}

export default function ImportDataPage() {
  const [driversFile, setDriversFile] = useState<File | null>(null)
  const [clientsFile, setClientsFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  const handleDriversFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setDriversFile(selectedFile)
      setResult(null)
    }
  }

  const handleClientsFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setClientsFile(selectedFile)
      setResult(null)
    }
  }

  const processDriversExcel = async () => {
    if (!driversFile) return

    setLoading(true)
    setResult(null)

    try {
      const supabase = createClient()

      const data = await driversFile.arrayBuffer()
      const workbook = XLSX.read(data, { type: "array" })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      console.log("[v0] Excel data loaded, processing", jsonData.length, "rows")

      const vehiclesToInsert: any[] = []
      const driversData: any[] = []
      const errors: string[] = []
      const vehiclesMap = new Map<string, boolean>()

      for (const row of jsonData as any[]) {
        try {
          const codigo = row.codigo || row.Codigo || row.CODIGO || row["Código"]
          const nombre = row.nombre || row.Nombre || row.NOMBRE
          const fletero = row.fletero || row.Fletero || row.FLETERO
          const dni = row.dni || row.DNI || row["DNI/LE"]
          const cuil = row.cuil || row.CUIL || row.Cuil
          const equipo = row.equipo || row.Equipo || row.EQUIPO
          const acoplado = row.acoplado || row.Acoplado || row.ACOPLADO

          if (equipo && equipo !== ".NULL." && !vehiclesMap.has(equipo)) {
            vehiclesToInsert.push({
              patent_chasis: equipo,
              patent_semi: null,
              vehicle_type: "Camión",
              transport_company: fletero || "Cronos",
              kilometers: 0,
            })
            vehiclesMap.set(equipo, true)
          }

          if (acoplado && acoplado !== ".NULL." && !vehiclesMap.has(acoplado)) {
            vehiclesToInsert.push({
              patent_chasis: acoplado,
              patent_semi: null,
              vehicle_type: "Semi",
              transport_company: fletero || "Cronos",
              kilometers: 0,
            })
            vehiclesMap.set(acoplado, true)
          }

          if (nombre && typeof nombre === "string") {
            let cuilValue = null
            if (cuil && String(cuil) !== ".NULL.") {
              cuilValue = String(cuil).replace(/[^0-9]/g, "")
            } else if (dni && String(dni) !== ".NULL.") {
              cuilValue = String(dni).replace(/[^0-9]/g, "")
            } else if (codigo) {
              cuilValue = `99${String(codigo).padStart(8, "0")}9`
            } else {
              cuilValue = `99${Math.floor(Math.random() * 100000000)
                .toString()
                .padStart(8, "0")}9`
            }

            if (cuilValue) {
              driversData.push({
                name: nombre,
                cuit: cuilValue,
                transport_company: fletero || "Cronos",
                equipoPatente: equipo && equipo !== ".NULL." ? equipo : null,
                acopladoPatente: acoplado && acoplado !== ".NULL." ? acoplado : null,
                active: true,
              })
            }
          }
        } catch (error: any) {
          errors.push(`Error procesando fila: ${error.message}`)
          console.error("[v0] Row processing error:", error)
        }
      }

      let vehiclesCreated = 0
      if (vehiclesToInsert.length > 0) {
        const batchSize = 100
        for (let i = 0; i < vehiclesToInsert.length; i += batchSize) {
          const batch = vehiclesToInsert.slice(i, i + batchSize)
          const { data, error } = await supabase.from("vehicles").insert(batch).select()

          if (error) {
            errors.push(`Error insertando vehículos (batch ${i / batchSize + 1}): ${error.message}`)
          } else {
            vehiclesCreated += data?.length || 0
          }
        }
      }

      const { data: allVehicles, error: vehiclesError } = await supabase
        .from("vehicles")
        .select("id, patent_chasis, vehicle_type")

      if (vehiclesError) {
        errors.push(`Error obteniendo vehículos: ${vehiclesError.message}`)
      }

      const vehicleIdMap = new Map<string, string>()
      if (allVehicles) {
        for (const vehicle of allVehicles) {
          vehicleIdMap.set(vehicle.patent_chasis, vehicle.id)
        }
      }

      const driversToInsert: any[] = []
      const driversMap = new Map<string, boolean>()

      for (const driverData of driversData) {
        if (!driversMap.has(driverData.name)) {
          const chasisId = driverData.equipoPatente ? vehicleIdMap.get(driverData.equipoPatente) : null
          const semiId = driverData.acopladoPatente ? vehicleIdMap.get(driverData.acopladoPatente) : null

          driversToInsert.push({
            name: driverData.name,
            cuit: driverData.cuit,
            transport_company: driverData.transport_company,
            chasis_id: chasisId || null,
            semi_id: semiId || null,
            active: driverData.active,
          })

          driversMap.set(driverData.name, true)
        }
      }

      let driversCreated = 0
      if (driversToInsert.length > 0) {
        const batchSize = 100
        for (let i = 0; i < driversToInsert.length; i += batchSize) {
          const batch = driversToInsert.slice(i, i + batchSize)
          const { data, error } = await supabase.from("drivers").insert(batch).select()

          if (error) {
            errors.push(`Error insertando choferes (batch ${i / batchSize + 1}): ${error.message}`)
          } else {
            driversCreated += data?.length || 0
          }
        }
      }

      setResult({
        success: true,
        message: "Importación de choferes completada",
        details: {
          vehiclesCreated,
          driversCreated,
          errors,
        },
      })
    } catch (error: any) {
      console.error("[v0] Import error:", error)
      setResult({
        success: false,
        message: `Error al procesar el archivo: ${error.message}`,
      })
    } finally {
      setLoading(false)
    }
  }

  const processClientsExcel = async () => {
    if (!clientsFile) return

    setLoading(true)
    setResult(null)

    try {
      const supabase = createClient()

      const data = await clientsFile.arrayBuffer()
      const workbook = XLSX.read(data, { type: "array" })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: "A" })

      console.log("[v0] Clients Excel loaded, processing", jsonData.length, "rows")

      const clientsToInsert: any[] = []
      const errors: string[] = []
      const clientsMap = new Map<string, boolean>()

      for (const row of jsonData as any[]) {
        try {
          const nombre = row.C
          const direccion = row.E
          const localidad = row.G
          const telefono = row.H
          const contacto = row.I
          const condicionVenta = row.L
          const tipoDocumento = row.AS
          const cuit = row.AU
          const tipoResponsable = row.AT

          if (!nombre || nombre === ".NULL." || typeof nombre !== "string" || nombre.length < 2) {
            continue
          }

          const clientKey = cuit && cuit !== ".NULL." ? String(cuit) : nombre
          if (clientsMap.has(clientKey)) {
            continue
          }

          clientsToInsert.push({
            company: nombre,
            address: direccion && direccion !== ".NULL." ? String(direccion) : null,
            location: localidad && localidad !== ".NULL." ? String(localidad) : null,
            contact_phone: telefono && telefono !== ".NULL." ? String(telefono) : null,
            contact_name: contacto && contacto !== ".NULL." ? String(contacto) : null,
            sale_condition: condicionVenta && condicionVenta !== ".NULL." ? String(condicionVenta) : null,
            document_type: tipoDocumento && tipoDocumento !== ".NULL." ? String(tipoDocumento) : "CUIT",
            cuit: cuit && cuit !== ".NULL." ? String(cuit).replace(/[^0-9-]/g, "") : null,
            taxpayer_type: tipoResponsable && tipoResponsable !== ".NULL." ? String(tipoResponsable) : null,
          })

          clientsMap.set(clientKey, true)
        } catch (error: any) {
          errors.push(`Error procesando fila: ${error.message}`)
          console.error("[v0] Row processing error:", error)
        }
      }

      console.log("[v0] Prepared clients:", clientsToInsert.length)

      let clientsCreated = 0
      if (clientsToInsert.length > 0) {
        const batchSize = 100
        for (let i = 0; i < clientsToInsert.length; i += batchSize) {
          const batch = clientsToInsert.slice(i, i + batchSize)
          const { data, error } = await supabase.from("clients").insert(batch).select()

          if (error) {
            errors.push(`Error insertando clientes (batch ${i / batchSize + 1}): ${error.message}`)
            console.error("[v0] Clients insert error:", error)
          } else {
            clientsCreated += data?.length || 0
          }
        }
      }

      console.log("[v0] Clients import completed:", { clientsCreated, errors: errors.length })

      setResult({
        success: true,
        message: "Importación de clientes completada",
        details: {
          clientsCreated,
          errors,
        },
      })
    } catch (error: any) {
      console.error("[v0] Import error:", error)
      setResult({
        success: false,
        message: `Error al procesar el archivo: ${error.message}`,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Importar Datos desde Excel</h1>
        <p className="text-muted-foreground mb-8">
          Sube archivos Excel con los datos de choferes, vehículos o clientes
        </p>

        <Tabs defaultValue="drivers" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="drivers">Choferes y Vehículos</TabsTrigger>
            <TabsTrigger value="clients">Clientes</TabsTrigger>
          </TabsList>

          <TabsContent value="drivers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Formato del Excel - Choferes</CardTitle>
                <CardDescription>El archivo debe contener las siguientes columnas:</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>
                    <strong>codigo</strong> - Código del chofer (opcional)
                  </li>
                  <li>
                    <strong>nombre</strong> - Nombre completo del chofer
                  </li>
                  <li>
                    <strong>fletero</strong> - Empresa de transporte
                  </li>
                  <li>
                    <strong>DNI</strong> - Número de DNI
                  </li>
                  <li>
                    <strong>cuil</strong> - Número de CUIL
                  </li>
                  <li>
                    <strong>equipo</strong> - Patente del vehículo/camión
                  </li>
                  <li>
                    <strong>acoplado</strong> - Patente del acoplado/semi
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cargar Archivo de Choferes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="drivers-file">Archivo Excel (.xlsx, .xls)</Label>
                  <Input
                    id="drivers-file"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleDriversFileChange}
                    disabled={loading}
                  />
                </div>

                {driversFile && (
                  <Alert>
                    <Upload className="h-4 w-4" />
                    <AlertDescription>
                      Archivo seleccionado: <strong>{driversFile.name}</strong>
                    </AlertDescription>
                  </Alert>
                )}

                <Button onClick={processDriversExcel} disabled={!driversFile || loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importando choferes...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Importar Choferes y Vehículos
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clients" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Formato del Excel - Clientes</CardTitle>
                <CardDescription>El archivo debe contener las siguientes columnas:</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>
                    <strong>Columna C</strong> - Nombre/Empresa del cliente
                  </li>
                  <li>
                    <strong>Columna E</strong> - Dirección
                  </li>
                  <li>
                    <strong>Columna G</strong> - Localidad
                  </li>
                  <li>
                    <strong>Columna H</strong> - Teléfono
                  </li>
                  <li>
                    <strong>Columna I</strong> - Contacto
                  </li>
                  <li>
                    <strong>Columna L</strong> - Condición de venta
                  </li>
                  <li>
                    <strong>Columna AS</strong> - Tipo de documento (CUIT, DNI, etc)
                  </li>
                  <li>
                    <strong>Columna AU</strong> - CUIT
                  </li>
                  <li>
                    <strong>Columna AT</strong> - Tipo responsable (RI, Monotributista, etc)
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cargar Archivo de Clientes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="clients-file">Archivo Excel (.xlsx, .xls)</Label>
                  <Input
                    id="clients-file"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleClientsFileChange}
                    disabled={loading}
                  />
                </div>

                {clientsFile && (
                  <Alert>
                    <Upload className="h-4 w-4" />
                    <AlertDescription>
                      Archivo seleccionado: <strong>{clientsFile.name}</strong>
                    </AlertDescription>
                  </Alert>
                )}

                <Button onClick={processClientsExcel} disabled={!clientsFile || loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importando clientes...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Importar Clientes
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {result && (
          <Alert variant={result.success ? "default" : "destructive"} className="mt-6">
            {result.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertDescription>
              <p className="font-semibold mb-2">{result.message}</p>
              {result.details && (
                <div className="text-sm space-y-1">
                  {result.details.vehiclesCreated !== undefined && (
                    <p>✓ Vehículos creados: {result.details.vehiclesCreated}</p>
                  )}
                  {result.details.driversCreated !== undefined && (
                    <p>✓ Choferes creados: {result.details.driversCreated}</p>
                  )}
                  {result.details.clientsCreated !== undefined && (
                    <p>✓ Clientes creados: {result.details.clientsCreated}</p>
                  )}
                  {result.details.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="font-semibold text-destructive">Errores:</p>
                      <ul className="list-disc list-inside">
                        {result.details.errors.slice(0, 5).map((error, i) => (
                          <li key={i}>{error}</li>
                        ))}
                      </ul>
                      {result.details.errors.length > 5 && (
                        <p className="text-xs mt-1">... y {result.details.errors.length - 5} errores más</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        <Card className="mt-6 border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Zona de Peligro</CardTitle>
            <CardDescription>Acciones irreversibles - Usar con precaución</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Esta acción eliminará TODOS los datos de la base de datos (excepto usuarios). No se puede deshacer.
              </AlertDescription>
            </Alert>
            <Button
              variant="destructive"
              onClick={async () => {
                if (
                  confirm("¿Estás seguro de que quieres eliminar TODOS los datos? Esta acción no se puede deshacer.")
                ) {
                  alert("Funcionalidad de limpieza lista. Ejecuta el script 21-clear-database.sql desde la consola.")
                }
              }}
            >
              Limpiar Base de Datos
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
