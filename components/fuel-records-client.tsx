"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { FuelRecordFormCentralized } from "@/components/fuel-record-form-centralized"
import { FuelBulkImport } from "@/components/fuel-bulk-import"

interface Vehicle {
  id: string
  patent_chasis: string
  vehicle_type: string
  kilometers: number
}

export function FuelRecordsClient({ vehicles }: { vehicles: Vehicle[] }) {
  const router = useRouter()
  const [showBulkDialog, setShowBulkDialog] = useState(false)
  const [showFormDialog, setShowFormDialog] = useState(false)

  const handleRefresh = () => {
    setShowBulkDialog(false)
    setShowFormDialog(false)
    router.refresh()
  }

  return (
    <div className="flex gap-2">
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            Carga Masiva
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Importar Cargas desde Excel</DialogTitle>
          </DialogHeader>
          <FuelBulkImport onSuccess={handleRefresh} />
        </DialogContent>
      </Dialog>
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogTrigger asChild>
          <Button className="bg-[#0038ae] hover:bg-[#0038ae]/90">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Registrar Carga
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva Carga de Combustible</DialogTitle>
          </DialogHeader>
          <FuelRecordFormCentralized vehicles={vehicles || []} onSuccess={handleRefresh} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default FuelRecordsClient
