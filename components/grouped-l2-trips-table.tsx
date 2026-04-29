"use client"

import React, { useState, useMemo } from "react"
import { L2Trip, TripGroup } from "@/types/l2-trip"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight, Edit, FileIcon, ChevronLeft, ListChecks } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Checkbox } from "@/components/ui/checkbox"

interface TripGroup {
  id: string
  invoiceNumber: string
  date: string
  clientOrTransport: string
  amount: number
  status: string
  blockId?: string
  trips: L2Trip[]
}

interface GroupedL2TripsTableProps {
  trips: L2Trip[]
  activeTab: "l2_billed" | "l2_settled"
  selectedGroupIds?: string[]
  onSelectGroup?: (groupId: string, checked: boolean) => void
  onSelectAllGroups?: (checked: boolean, allGroupIds: string[]) => void
  onEditTrip: (trip: L2Trip) => void
  onExportTripPDF: (trip: L2Trip) => void
  onExportGroupPDF?: (group: TripGroup) => void
  onEditBlock: (blockId: string, type: "billing" | "settlement") => void
}

export function GroupedL2TripsTable({ 
  trips, 
  activeTab, 
  selectedGroupIds = [],
  onSelectGroup,
  onSelectAllGroups,
  onEditTrip, 
  onExportTripPDF,
  onExportGroupPDF,
  onEditBlock 
}: GroupedL2TripsTableProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const groupedTrips = useMemo(() => {
    const groups: Record<string, TripGroup> = {}
    
    trips.forEach((trip) => {
      const isBilled = activeTab === "l2_billed"
      
      const invoiceNumber = isBilled ? trip.client_invoice_number : trip.third_party_invoice
      const clientOrTransport = isBilled 
        ? trip.clients?.company 
        : trip.drivers?.transport_company?.name || trip.drivers?.name
        
      const date = isBilled 
        ? (trip.client_invoice_date || trip.bulk_billing_date || trip.invoice_date)
        : (trip.third_party_payment_date || trip.bulk_settlement_date || trip.invoice_date)
        
      const status = isBilled ? trip.client_payment_status : trip.third_party_payment_status
      
      const amountStr = isBilled ? trip.trip_amount : trip.third_party_amount
      const amount = Number(amountStr) || 0
      
      const blockId = isBilled ? trip.bulk_billing_id : trip.bulk_settlement_id
      
      const key = `${invoiceNumber || "SIN-COMP"}-${clientOrTransport || "SIN-CLI"}`
      
      if (!groups[key]) {
        groups[key] = {
          id: key,
          invoiceNumber: invoiceNumber || "Sin Comprobante",
          date: date || "",
          clientOrTransport: clientOrTransport || "Sin Especificar",
          amount: 0,
          status: status || (isBilled ? "PENDIENTE" : "IMPAGO"),
          blockId,
          trips: []
        }
      }
      
      groups[key].amount += amount
      groups[key].trips.push(trip)
    })
    
    // Sort groups by date descending
    return Object.values(groups).sort((a, b) => {
      if (!a.date) return 1
      if (!b.date) return -1
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })
  }, [trips, activeTab])

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) newSet.delete(id)
      else newSet.add(id)
      return newSet
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-"
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      return d.toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      })
    } catch {
      return dateStr
    }
  }

  const getStatusColor = (status: string, isBilled: boolean) => {
    if (isBilled) {
      if (status === "COBRADO") return "bg-green-100 text-green-800"
      if (status === "PARCIAL") return "bg-yellow-100 text-yellow-800"
      return "bg-gray-100 text-gray-800"
    } else {
      if (status === "PAGADO") return "bg-green-100 text-green-800"
      if (status === "PARCIAL") return "bg-yellow-100 text-yellow-800"
      return "bg-red-100 text-red-800"
    }
  }

  const paginatedGroups = groupedTrips.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className="flex flex-col">
      <Table>
      <TableHeader>
        <TableRow className="bg-muted/50">
          {onSelectGroup && (
            <TableHead className="w-[40px]">
              <Checkbox 
                checked={groupedTrips.length > 0 && selectedGroupIds.length === groupedTrips.length}
                onCheckedChange={(checked) => onSelectAllGroups && onSelectAllGroups(!!checked, groupedTrips.map(g => g.id))}
              />
            </TableHead>
          )}
          <TableHead className="w-[50px]"></TableHead>
          <TableHead>Nº COMPROBANTE</TableHead>
          <TableHead>FECHA</TableHead>
          <TableHead>{activeTab === "l2_billed" ? "CLIENTE" : "TRANSPORTISTA"}</TableHead>
          <TableHead className="text-right">MONTO</TableHead>
          <TableHead className="text-center">ESTADO</TableHead>
          <TableHead className="w-[80px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {groupedTrips.length === 0 ? (
          <TableRow>
            <TableCell colSpan={onSelectGroup ? 8 : 7} className="text-center text-muted-foreground py-8">
              No hay viajes que coincidan con los filtros
            </TableCell>
          </TableRow>
        ) : (
          paginatedGroups.map((group) => (
            <React.Fragment key={group.id}>
              <TableRow className="hover:bg-muted/30 cursor-pointer font-medium" onClick={() => toggleGroup(group.id)}>
                {onSelectGroup && (
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox 
                      checked={selectedGroupIds.includes(group.id)}
                      onCheckedChange={(checked) => onSelectGroup(group.id, !!checked)}
                    />
                  </TableCell>
                )}
                <TableCell>
                  {expandedGroups.has(group.id) ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </TableCell>
                <TableCell>{group.invoiceNumber}</TableCell>
                <TableCell>{formatDate(group.date)}</TableCell>
                <TableCell>{group.clientOrTransport}</TableCell>
                <TableCell className="text-right">{formatCurrency(group.amount)}</TableCell>
                <TableCell className="text-center">
                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${getStatusColor(group.status, activeTab === "l2_billed")}`}>
                    {group.status}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 justify-end">
                    {onExportGroupPDF && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-blue-600 hover:text-blue-800 hover:bg-blue-100" 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                onExportGroupPDF(group); 
                              }}
                            >
                              <FileIcon className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Exportar PDF del Comprobante</p></TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    {group.blockId && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-blue-600 hover:text-blue-800 hover:bg-blue-100" 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                onEditBlock(group.blockId!, activeTab === "l2_billed" ? "billing" : "settlement"); 
                              }}
                            >
                              <ListChecks className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Editar Bloque</p></TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </TableCell>
              </TableRow>
              
              {expandedGroups.has(group.id) && (
                <TableRow className="bg-muted/10">
                  <TableCell colSpan={onSelectGroup ? 8 : 7} className="p-0">
                    <div className="p-4 pl-12">
                      <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Viajes asociados al comprobante</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Viaje</TableHead>
                            <TableHead className="text-xs">Fecha</TableHead>
                            <TableHead className="text-xs">RTO</TableHead>
                            <TableHead className="text-xs">Origen</TableHead>
                            <TableHead className="text-xs">Destino</TableHead>
                            <TableHead className="text-xs text-right">Monto Individual</TableHead>
                            <TableHead className="text-xs text-right">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.trips.map(trip => {
                            const individualAmount = activeTab === "l2_billed" ? trip.trip_amount : trip.third_party_amount;
                            return (
                              <TableRow key={trip.id} className="bg-background">
                                <TableCell className="text-sm">{trip.trip_number || "-"}</TableCell>
                                <TableCell className="text-sm">{formatDate(trip.date || trip.invoice_date || "")}</TableCell>
                                <TableCell className="text-sm">{trip.invoice_number}</TableCell>
                                <TableCell className="text-sm">{trip.origin}</TableCell>
                                <TableCell className="text-sm">{trip.destination}</TableCell>
                                <TableCell className="text-sm text-right">{formatCurrency(Number(individualAmount) || 0)}</TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-1">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onExportTripPDF(trip); }}>
                                            <FileIcon className="h-3 w-3" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>Exportar PDF</p></TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>

                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onEditTrip(trip); }}>
                                            <Edit className="h-3 w-3" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>Editar Viaje</p></TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))
        )}
      </TableBody>
    </Table>
      {groupedTrips.length > itemsPerPage && (
        <div className="flex items-center justify-between px-4 py-4 border-t">
          <div className="text-sm text-muted-foreground">
            Mostrando {(currentPage - 1) * itemsPerPage + 1} a{" "}
            {Math.min(currentPage * itemsPerPage, groupedTrips.length)} de {groupedTrips.length} comprobantes
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) =>
                  Math.min(prev + 1, Math.ceil(groupedTrips.length / itemsPerPage)),
                )
              }
              disabled={currentPage === Math.ceil(groupedTrips.length / itemsPerPage)}
            >
              Siguiente
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
