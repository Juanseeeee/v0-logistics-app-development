"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MaintenanceList } from "@/components/maintenance-list"
import { MaintenanceForm } from "@/components/maintenance-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

import { Maintenance } from "@/components/maintenance-list"

export function VehicleMaintenanceClient({ 
  maintenances, 
  vehicleId, 
  vehicles,
  drivers, 
  spareParts 
}: { 
  maintenances: Maintenance[], 
  vehicleId: string,
  vehicles: any[],
  drivers: any[], 
  spareParts: any[] 
}) {
  const [editingMaintenance, setEditingMaintenance] = useState<Maintenance | null>(null)
  const router = useRouter()

  return (
    <>
      <MaintenanceList 
        maintenances={maintenances} 
        onEdit={(m) => setEditingMaintenance(m)} 
      />
      
      <Dialog open={!!editingMaintenance} onOpenChange={(isOpen) => !isOpen && setEditingMaintenance(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Mantenimiento</DialogTitle>
            <DialogDescription>Actualizar la información de este registro</DialogDescription>
          </DialogHeader>
          {editingMaintenance && (
            <MaintenanceForm
              key={editingMaintenance.id}
              maintenance={editingMaintenance}
              vehicleId={vehicleId}
              vehicles={vehicles}
              drivers={drivers}
              spareParts={spareParts}
              onSuccess={() => {
                setEditingMaintenance(null)
                router.refresh()
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
