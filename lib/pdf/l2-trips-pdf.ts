import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { L2Trip, Client, TripGroup } from "@/types/l2-trip"

// Helper function to format dates
const formatLocalDate = (dateString?: string) => {
  if (!dateString) return "-"
  const [year, month, day] = dateString.split("-")
  return `${day}/${month}/${year}`
}

// Helper to add logo
const addLogo = async (): Promise<string | null> => {
  try {
    const response = await fetch("/logo.png")
    if (response.ok) {
      const blob = await response.blob()
      const reader = new FileReader()
      return new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(blob)
      })
    }
  } catch (e) {
    console.error("Error loading logo", e)
  }
  return null
}

interface ExportListOptions {
  filteredTrips: L2Trip[];
  activeTab: string;
  dateFrom: string;
  dateTo: string;
  clientFilter: string;
  thirdPartyTransportFilter: string;
  clients: Client[];
}

export const generateL2TripsListPDF = async (options: ExportListOptions) => {
  const {
    filteredTrips,
    activeTab,
    dateFrom,
    dateTo,
    clientFilter,
    thirdPartyTransportFilter,
    clients
  } = options

  const doc = new jsPDF()
  
  const logoData = await addLogo()
  if (logoData) {
    doc.addImage(logoData, "PNG", 14, 10, 30, 15)
  }

  // Determine report context
  let reportTitle = "Reporte de Viajes L2"
  let reportSubtitle = `Emisión: ${new Date().toLocaleDateString()}`
  
  // Filters text
  let filtersText = []
  if (dateFrom || dateTo) {
    filtersText.push(`Periodo: ${dateFrom ? formatLocalDate(dateFrom) : "Inicio"} - ${dateTo ? formatLocalDate(dateTo) : "Actualidad"}`)
  }
  
  // Specific logic per tab
  let columns: string[] = []
  let data: (string | number | undefined)[][] = []
  let themeColor = [41, 128, 185] // Default Blue
  
  if (activeTab === "l2_settled") {
    reportTitle = "Reporte de Liquidación"
    themeColor = [211, 84, 0] // Orange
    
    if (thirdPartyTransportFilter) {
      filtersText.push(`Transporte: ${thirdPartyTransportFilter}`)
    }

    columns = ["Fecha", "N° Viaje", "Chofer / Transporte", "Origen", "Destino", "Neto", "Tarifa", "Total"]
    
    data = filteredTrips.map(trip => [
      formatLocalDate(trip.date),
      trip.trip_number,
      trip.third_party_transport || trip.drivers?.name || "-",
      trip.origin,
      trip.destination,
      trip.net_destination || trip.net_origin || "-",
      `$${Number(trip.third_party_rate || 0).toLocaleString("es-AR")}`,
      `$${Number(trip.third_party_amount || 0).toLocaleString("es-AR")}`
    ])

  } else if (activeTab === "l2_billed") {
    reportTitle = "Reporte de Facturación"
    themeColor = [39, 174, 96] // Green
    
    if (clientFilter && clientFilter !== "all") {
      const clientName = clients.find(c => c.id === clientFilter)?.company
      if (clientName) filtersText.push(`Cliente: ${clientName}`)
    }

    columns = ["Fecha", "N° Viaje", "Cliente", "Producto", "Origen", "Destino", "Neto", "Tarifa", "Total"]
    
    data = filteredTrips.map(trip => [
      formatLocalDate(trip.date),
      trip.trip_number,
      trip.clients?.company || "-",
      trip.products?.name || "-",
      trip.origin,
      trip.destination,
      trip.net_destination || trip.net_origin || "-",
      `$${Number(trip.tariff_rate || 0).toLocaleString("es-AR")}`,
      `$${Number(trip.trip_amount || 0).toLocaleString("es-AR")}`
    ])

  } else if (activeTab === "l2_completed_all") {
    reportTitle = "Reporte de Viajes Completados"
    themeColor = [142, 68, 173] // Purple

    columns = ["Fecha", "N° Viaje", "Cliente", "Chofer", "Facturado", "Liquidado", "Margen"]
    
    data = filteredTrips.map(trip => {
      const billed = Number(trip.trip_amount || 0)
      const settled = Number(trip.third_party_amount || 0)
      const margin = billed - settled
      return [
        formatLocalDate(trip.date),
        trip.trip_number,
        trip.clients?.company || "-",
        trip.drivers?.name || trip.third_party_transport || "-",
        `$${billed.toLocaleString("es-AR")}`,
        `$${settled.toLocaleString("es-AR")}`,
        `$${margin.toLocaleString("es-AR")}`
      ]
    })
  } else {
    // Default / Pending / All L2
    columns = ["Fecha", "N° Viaje", "Cliente", "Chofer", "Origen", "Destino", "Monto", "Estado"]
    data = filteredTrips.map(trip => [
      formatLocalDate(trip.date),
      trip.trip_number,
      trip.clients?.company,
      trip.drivers?.name || trip.third_party_transport,
      trip.origin,
      trip.destination,
      `$${Number(trip.trip_amount || 0).toLocaleString("es-AR")}`,
      trip.client_payment_status
    ])
  }

  // Header positioning
  doc.setFontSize(18)
  doc.setTextColor(40)
  doc.text(reportTitle, 50, 20)
  
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(reportSubtitle, 50, 26)
  
  if (filtersText.length > 0) {
    doc.text(filtersText.join(" | "), 14, 35)
  }

  // Table
  autoTable(doc, {
    head: [columns],
    body: data,
    startY: filtersText.length > 0 ? 40 : 35,
    styles: { fontSize: 8 },
    headStyles: { fillColor: themeColor },
    didDrawPage: (data: any) => {
      // Footer
      const pageSize = doc.internal.pageSize
      const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight()
      doc.setFontSize(8)
      doc.text(`Página ${data.pageCount}`, data.settings.margin.left, pageHeight - 10)
    }
  })
  
  // Totals
  const finalY = ((doc as any).lastAutoTable?.finalY || 35) + 10
  doc.setFontSize(10)
  doc.setTextColor(0)
  
  if (activeTab === "l2_settled") {
    const totalSettled = filteredTrips.reduce((sum, t) => sum + (Number(t.third_party_amount) || 0), 0)
    doc.text(`Total Liquidado: $${totalSettled.toLocaleString("es-AR")}`, 14, finalY)
  } else if (activeTab === "l2_billed") {
    const totalBilled = filteredTrips.reduce((sum, t) => sum + (Number(t.trip_amount) || 0), 0)
    doc.text(`Total Facturado: $${totalBilled.toLocaleString("es-AR")}`, 14, finalY)
  } else if (activeTab === "l2_completed_all") {
    const totalBilled = filteredTrips.reduce((sum, t) => sum + (Number(t.trip_amount) || 0), 0)
    const totalSettled = filteredTrips.reduce((sum, t) => sum + (Number(t.third_party_amount) || 0), 0)
    const totalMargin = totalBilled - totalSettled
    
    doc.text(`Total Facturado: $${totalBilled.toLocaleString("es-AR")}`, 14, finalY)
    doc.text(`Total Liquidado: $${totalSettled.toLocaleString("es-AR")}`, 14, finalY + 6)
    doc.text(`Margen Total: $${totalMargin.toLocaleString("es-AR")}`, 14, finalY + 12)
  } else {
     const totalAmount = filteredTrips.reduce((sum, t) => sum + (Number(t.trip_amount) || 0), 0)
     doc.text(`Total Monto: $${totalAmount.toLocaleString("es-AR")}`, 14, finalY)
  }

  doc.save(`${reportTitle.replace(/ /g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`)
}

export const generateSingleL2TripPDF = async (trip: L2Trip) => {
  const doc = new jsPDF()
  
  const logoData = await addLogo()
  if (logoData) doc.addImage(logoData, "PNG", 14, 10, 30, 15)

  // Header
  doc.setFontSize(18)
  doc.text(`Detalle de Viaje L2 #${trip.trip_number}`, 50, 20)
  doc.setFontSize(10)
  doc.text(`Fecha: ${formatLocalDate(trip.date)}`, 50, 26)

  let yPos = 40

  // General Info
  doc.setFontSize(12)
  doc.setFillColor(230, 230, 230)
  doc.rect(14, yPos - 5, 182, 8, "F")
  doc.text("Información General", 16, yPos)
  yPos += 10
  
  const generalData = [
    ["Cliente:", trip.clients?.company || "-"],
    ["Producto:", trip.products?.name || "-"],
    ["Rubro:", trip.category || "-"],
    ["Chofer:", trip.drivers?.name || "-"],
    ["Transporte:", trip.third_party_transport || "-"],
    ["Patente Chasis:", trip.chasis_patent || "-"],
    ["Patente Semi:", trip.semi_patent || "-"]
  ]
  
  autoTable(doc, {
    body: generalData,
    startY: yPos,
    theme: 'plain',
    styles: { cellPadding: 1, fontSize: 10 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } }
  })
  yPos = (doc as any).lastAutoTable.finalY + 10

  // Carga y Descarga
  doc.setFontSize(12)
  doc.setFillColor(230, 230, 230)
  doc.rect(14, yPos - 5, 182, 8, "F")
  doc.text("Logística", 16, yPos)
  yPos += 10

  const logisticsData = [
    ["Origen:", trip.origin || "-", "Destino:", trip.destination || "-"],
    ["Empresa Origen:", trip.origin_company || "-", "Empresa Destino:", trip.destination_company || "-"],
    ["Tara Origen:", trip.tare_origin || "-", "Tara Destino:", trip.tare_destination || "-"],
    ["Bruto Origen:", trip.gross_weight || "-", "Bruto Destino:", trip.gross_destination || "-"],
    ["Neto Origen:", trip.net_origin || "-", "Neto Destino:", trip.net_destination || "-"],
    ["Diferencia:", trip.weight_difference || "-", "TN Descarga:", trip.tons_delivered || "-"]
  ]

  autoTable(doc, {
    body: logisticsData,
    startY: yPos,
    theme: 'plain',
    styles: { cellPadding: 1, fontSize: 10 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 30 }, 2: { fontStyle: 'bold', cellWidth: 30 } }
  })
  yPos = (doc as any).lastAutoTable.finalY + 10

  // Facturación y Liquidación
  doc.setFontSize(12)
  doc.setFillColor(230, 230, 230)
  doc.rect(14, yPos - 5, 182, 8, "F")
  doc.text("Facturación y Liquidación", 16, yPos)
  yPos += 10

  const financeData = [
    ["Facturación (Cliente)", "", "Liquidación (Tercero)", ""],
    ["Tarifa:", `$${Number(trip.tariff_rate || 0).toLocaleString("es-AR")}`, "Tarifa Tercero:", `$${Number(trip.third_party_rate || 0).toLocaleString("es-AR")}`],
    ["Total:", `$${Number(trip.trip_amount || 0).toLocaleString("es-AR")}`, "Total:", `$${Number(trip.third_party_amount || 0).toLocaleString("es-AR")}`],
    ["N° Factura:", trip.client_invoice_number || "-", "N° Factura:", trip.third_party_invoice || "-"],
    ["Fecha Factura:", formatLocalDate(trip.client_invoice_date), "Fecha Pago:", formatLocalDate(trip.third_party_payment_date)],
    ["Estado:", trip.client_payment_status || "-", "Estado:", trip.third_party_payment_status || "-"]
  ]

  autoTable(doc, {
    body: financeData,
    startY: yPos,
    theme: 'plain',
    styles: { cellPadding: 1, fontSize: 10 },
    columnStyles: { 
      0: { fontStyle: 'bold', cellWidth: 30 },
      2: { fontStyle: 'bold', cellWidth: 30 }
    },
    didParseCell: (data: any) => {
      if (data.row.index === 0) data.cell.styles.fontStyle = 'bold'
    }
  })
  yPos = (doc as any).lastAutoTable.finalY + 10

  // Margen
  const margin = (Number(trip.trip_amount) || 0) - (Number(trip.third_party_amount) || 0)
  doc.setFontSize(12)
  doc.text(`Margen del Viaje: $${margin.toLocaleString("es-AR")}`, 14, yPos + 5)

  doc.save(`${trip.trip_number ? `Viaje_L2_${trip.trip_number}` : 'Detalle_Viaje'}.pdf`)
}

export const generateGroupedTripsPDF = async (groups: TripGroup[], activeTab: "l2_billed" | "l2_settled") => {
  const doc = new jsPDF()
  const logoData = await addLogo()

  const isBilled = activeTab === "l2_billed"
  const themeColor = isBilled ? [39, 174, 96] : [211, 84, 0] // Green or Orange
  
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i]
    if (i > 0) doc.addPage()
    
    if (logoData) doc.addImage(logoData, "PNG", 14, 10, 30, 15)

    const title = isBilled ? "Facturación de Viajes" : "Liquidación a Terceros"
    
    // Header
    doc.setFontSize(18)
    doc.setTextColor(40)
    doc.text(title, 50, 20)
    
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(`Fecha de Emisión: ${formatLocalDate(new Date().toISOString().split("T")[0])}`, 50, 26)

    let yPos = 40

    // General Info Box
    doc.setFontSize(12)
    doc.setTextColor(40)
    doc.setFillColor(240, 240, 240)
    doc.rect(14, yPos - 5, 182, 8, "F")
    doc.text("Detalle del Comprobante", 16, yPos)
    yPos += 10
    
    const generalData = [
      ["Nº Comprobante:", group.invoiceNumber || "Sin Especificar", isBilled ? "Cliente:" : "Transportista:", group.clientOrTransport || "-"],
      ["Fecha Comprobante:", formatLocalDate(group.date), "Estado:", group.status],
      ["Total:", `$${group.amount.toLocaleString("es-AR")}`, "", ""]
    ]
    
    autoTable(doc, {
      body: generalData,
      startY: yPos,
      theme: 'plain',
      styles: { cellPadding: 1, fontSize: 10 },
      columnStyles: { 
        0: { fontStyle: 'bold', cellWidth: 40 },
        2: { fontStyle: 'bold', cellWidth: 35 }
      }
    })
    
    yPos = (doc as any).lastAutoTable.finalY + 15
    
    // Trips Table
    doc.setFontSize(12)
    doc.setFillColor(240, 240, 240)
    doc.rect(14, yPos - 5, 182, 8, "F")
    doc.text("Viajes Asociados", 16, yPos)
    yPos += 5
    
    const columns = ["Fecha", "Viaje", "RTO", "Origen", "Destino", "Tarifa", "Monto"]
    const data = group.trips.map(trip => {
      const date = trip.date || trip.invoice_date || ""
      const amount = Number(isBilled ? trip.trip_amount : trip.third_party_amount) || 0
      const tariff = Number(isBilled ? trip.tariff_rate : trip.third_party_rate) || 0
      return [
        formatLocalDate(date),
        trip.trip_number || "-",
        trip.invoice_number || "-",
        trip.origin || "-",
        trip.destination || "-",
        `$${tariff.toLocaleString("es-AR")}`,
        `$${amount.toLocaleString("es-AR")}`
      ]
    })
    
    autoTable(doc, {
      head: [columns],
      body: data,
      startY: yPos,
      styles: { fontSize: 8 },
      headStyles: { fillColor: themeColor },
      foot: [["", "", "", "", "", "TOTAL", `$${group.amount.toLocaleString("es-AR")}`]],
      footStyles: { fillColor: [220, 220, 220], textColor: [0,0,0], fontStyle: 'bold' }
    })
  }

  const fileName = `Comprobantes_${isBilled ? 'Facturacion' : 'Liquidacion'}_${new Date().toISOString().split("T")[0]}.pdf`
  doc.save(fileName)
}
