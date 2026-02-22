"use client"

import React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import * as XLSX from "xlsx"

interface ParsedFuelRecord {
  date: Date | null
  establishment: string
  address: string
  locality: string
  province: string
  driver_name: string
  vehicle_patent: string
  odometer: number | null
  receipt_number: string
  product_type: string
  liters: number | null
  price_per_liter: number | null
  total_amount: number | null
  iva: number | null
  invoice_number: string
  matchedVehicleId: string | null
  matchedDriverId: string | null
  errors: string[]
}

interface BulkImportStats {
  totalRecords: number
  totalLiters: number
  totalCost: number
  avgPricePerLiter: number
  withErrors: number
}

export function FuelBulkImport({ onSuccess }: { onSuccess?: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [parsing, setParsing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [parsedData, setParsedData] = useState<ParsedFuelRecord[]>([])
  const [stats, setStats] = useState<BulkImportStats | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setParsedData([])
      setStats(null)
      setError(null)
    }
  }

  const parseExcel = async () => {
    if (!file) return

    setParsing(true)
    setError(null)

    try {
      const supabase = createClient()

      // Load vehicles and drivers for matching
      const [vehiclesRes, driversRes] = await Promise.all([
        supabase.from("vehicles").select("id, patent_chasis, patent_semi"),
        supabase.from("drivers").select("id, name, transport_company"),
      ])

      const vehicles = vehiclesRes.data || []
      const drivers = driversRes.data || []

      // Read Excel file
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: "array", cellDates: true })
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false })

      // Skip header row and parse data
      const records: ParsedFuelRecord[] = []
      for (let i = 1; i < jsonData.length; i++) {
        const row: any = jsonData[i]

        // Skip empty rows
        if (!row || row.length === 0 || !row[13]) continue // Skip if no patent

        const errors: string[] = []

        // Parse date (Column A) - Format: DD/MM/YYYY HH:MM:SS
        let date: Date | null = null
        if (row[0]) {
          const dateValue = row[0]
          if (dateValue instanceof Date) {
            date = dateValue
          } else if (typeof dateValue === "string") {
            // Try parsing DD/MM/YYYY format
            const ddmmyyyyRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2}):(\d{1,2}))?$/
            const match = dateValue.trim().match(ddmmyyyyRegex)
            if (match) {
              const day = parseInt(match[1])
              const month = parseInt(match[2]) - 1 // JS months are 0-indexed
              const year = parseInt(match[3])
              const hours = match[4] ? parseInt(match[4]) : 0
              const minutes = match[5] ? parseInt(match[5]) : 0
              const seconds = match[6] ? parseInt(match[6]) : 0
              date = new Date(year, month, day, hours, minutes, seconds)
            } else {
              // Fallback to standard parsing
              const parsed = new Date(dateValue)
              if (!isNaN(parsed.getTime())) {
                date = parsed
              }
            }
          } else if (typeof dateValue === "number") {
            // Excel date serial number
            date = XLSX.SSF.parse_date_code(dateValue)
              ? new Date((dateValue - 25569) * 86400 * 1000)
              : null
          }
        }
        if (!date || isNaN(date.getTime())) {
          errors.push("Fecha inválida")
          date = null
        }

        // Parse patent (Column N - index 13)
        const patent = String(row[13] || "").trim().toUpperCase()
        if (!patent) errors.push("Patente faltante")

        // Match vehicle
        const matchedVehicle = vehicles.find(
          (v) =>
            v.patent_chasis?.replace(/[-\s]/g, "").toUpperCase() === patent.replace(/[-\s]/g, "").toUpperCase() ||
            v.patent_semi?.replace(/[-\s]/g, "").toUpperCase() === patent.replace(/[-\s]/g, "").toUpperCase(),
        )

        if (!matchedVehicle && patent) {
          errors.push(`Vehículo no encontrado: ${patent}`)
        }

        // Parse driver (Column J - index 9)
        const driverName = String(row[9] || "").trim()
        let matchedDriver = null
        if (driverName) {
          // Try to match with Cronos drivers
          matchedDriver = drivers.find(
            (d) =>
              d.transport_company?.toLowerCase().includes("cronos") &&
              d.name.toLowerCase().includes(driverName.toLowerCase()),
          )
        }

        // Parse numeric values
        const liters = row[19] ? parseFloat(String(row[19]).replace(",", ".")) : null
        const pricePerLiter = row[20] ? parseFloat(String(row[20]).replace(",", ".")) : null
        const totalAmount = row[21] ? parseFloat(String(row[21]).replace(",", ".")) : null
        const iva = row[25] ? parseFloat(String(row[25]).replace(",", ".")) : null
        const odometer = row[14] ? parseInt(String(row[14])) : null

        if (!liters || liters <= 0) errors.push("Litros inválidos")
        if (!totalAmount || totalAmount <= 0) errors.push("Importe inválido")

        records.push({
          date,
          establishment: String(row[4] || "").trim(), // Column E
          address: String(row[5] || "").trim(), // Column F
          locality: String(row[6] || "").trim(), // Column G
          province: String(row[7] || "").trim(), // Column H
          driver_name: driverName,
          vehicle_patent: patent,
          odometer,
          receipt_number: String(row[17] || "").trim(), // Column R
          product_type: String(row[18] || "").trim(), // Column S
          liters,
          price_per_liter: pricePerLiter,
          total_amount: totalAmount,
          iva,
          invoice_number: String(row[29] || "").trim(), // Column AD
          matchedVehicleId: matchedVehicle?.id || null,
          matchedDriverId: matchedDriver?.id || null,
          errors,
        })
      }

      // Calculate stats
      const validRecords = records.filter((r) => r.errors.length === 0)
      const totalLiters = validRecords.reduce((sum, r) => sum + (r.liters || 0), 0)
      const totalCost = validRecords.reduce((sum, r) => sum + (r.total_amount || 0), 0)

      setStats({
        totalRecords: records.length,
        totalLiters,
        totalCost,
        avgPricePerLiter: totalLiters > 0 ? totalCost / totalLiters : 0,
        withErrors: records.filter((r) => r.errors.length > 0).length,
      })

      setParsedData(records)
    } catch (err) {
      console.error("Error parsing Excel:", err)
      setError(err instanceof Error ? err.message : "Error al procesar el archivo Excel")
    } finally {
      setParsing(false)
    }
  }

  const handleImport = async () => {
    if (parsedData.length === 0) return

    setImporting(true)
    setProgress(0)

    try {
      const supabase = createClient()
      const batchId = `batch-${Date.now()}`
      const validRecords = parsedData.filter((r) => r.errors.length === 0)

      let imported = 0
      for (const record of validRecords) {
        const { error } = await supabase.from("fuel_records").insert({
          date: record.date?.toISOString().split("T")[0],
          establishment: record.establishment,
          address: record.address,
          locality: record.locality,
          province: record.province,
          driver_name: record.driver_name,
          vehicle_patent: record.vehicle_patent,
          vehicle_id: record.matchedVehicleId,
          odometer: record.odometer,
          kilometers: record.odometer, // Also populate legacy field
          receipt_number: record.receipt_number,
          product_type: record.product_type,
          liters: record.liters,
          price_per_liter: record.price_per_liter,
          total_amount: record.total_amount,
          cost: record.total_amount, // Also populate legacy field
          iva: record.iva,
          invoice_number: record.invoice_number,
          station: record.establishment, // Also populate legacy field
          import_batch_id: batchId,
        })

        if (error) {
          console.error("Error importing record:", error)
        }

        imported++
        setProgress((imported / validRecords.length) * 100)
      }

      alert(`Importación completada: ${imported} registros importados de ${validRecords.length} válidos`)
      onSuccess?.()
      
      // Reset
      setFile(null)
      setParsedData([])
      setStats(null)
    } catch (err) {
      console.error("Error importing:", err)
      setError(err instanceof Error ? err.message : "Error al importar los datos")
    } finally {
      setImporting(false)
      setProgress(0)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cargar Archivo Excel</CardTitle>
          <CardDescription>
            Selecciona un archivo Excel con el formato estándar de cargas de combustible
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              disabled={parsing || importing}
            />
            <p className="text-xs text-muted-foreground">
              Formato esperado: Columnas A (Fecha), E (Establecimiento), N (Patente), T (Litros), etc.
            </p>
          </div>

          {file && !parsedData.length && (
            <Button onClick={parseExcel} disabled={parsing} className="w-full">
              {parsing ? "Procesando..." : "Analizar Archivo"}
            </Button>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Resumen de Importación</CardTitle>
            <CardDescription>Vista previa de los datos a importar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Registros</p>
                <p className="text-2xl font-bold">{stats.totalRecords}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Litros</p>
                <p className="text-2xl font-bold">{stats.totalLiters.toFixed(0)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gasto Total</p>
                <p className="text-2xl font-bold">${stats.totalCost.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Precio Promedio</p>
                <p className="text-2xl font-bold">${stats.avgPricePerLiter.toFixed(2)}/L</p>
              </div>
            </div>

            {stats.withErrors > 0 && (
              <Alert>
                <AlertDescription>
                  {stats.withErrors} registro(s) con errores no serán importados. Revisa los detalles abajo.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Button
                onClick={handleImport}
                disabled={importing || stats.totalRecords === stats.withErrors}
                className="w-full"
              >
                {importing ? "Importando..." : `Importar ${stats.totalRecords - stats.withErrors} Registros`}
              </Button>

              {importing && (
                <div className="space-y-2">
                  <Progress value={progress} className="w-full" />
                  <p className="text-sm text-center text-muted-foreground">{Math.round(progress)}% completado</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {parsedData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detalles de Registros ({parsedData.length})</CardTitle>
            <CardDescription>Revisa los datos antes de importar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {parsedData.slice(0, 50).map((record, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border ${record.errors.length > 0 ? "bg-destructive/10 border-destructive" : "bg-muted"}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <p className="font-medium">
                        {record.vehicle_patent} - {record.liters}L - ${record.total_amount}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {record.date?.toLocaleDateString()} - {record.establishment} - {record.product_type}
                      </p>
                      {record.driver_name && (
                        <p className="text-xs text-muted-foreground">Conductor: {record.driver_name}</p>
                      )}
                    </div>
                    {record.errors.length > 0 && (
                      <div className="text-xs text-destructive">
                        {record.errors.map((err, i) => (
                          <div key={i}>• {err}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {parsedData.length > 50 && (
                <p className="text-sm text-center text-muted-foreground pt-2">
                  Mostrando 50 de {parsedData.length} registros
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default FuelBulkImport
