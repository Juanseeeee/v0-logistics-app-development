import { jsPDF } from "jspdf"

interface PurchaseOrderItem {
  id: string
  code?: string
  description: string
  quantity: number
  unit_price: number
  total: number
}

interface PurchaseOrder {
  order_number: string
  date: string
  supplier_name: string
  supplier_cuit: string
  supplier_address: string
  supplier_locality?: string
  supplier_province?: string
  supplier_phone?: string
  supplier_email?: string
  supplier_iva_condition?: string
  supplier_number?: string
  subtotal: number
  iva_amount: number
  total: number
  currency?: string
  notes?: string
  status: string
  items: PurchaseOrderItem[]
}

async function loadImageAsBase64(path: string): Promise<string> {
  try {
    const response = await fetch(path)
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch {
    return ""
  }
}

function formatNumber(n: number, decimals = 3): string {
  return n.toLocaleString("es-AR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

function drawSinglePage(
  doc: jsPDF,
  order: PurchaseOrder,
  logoBase64: string,
  copyLabel: string
) {
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const halfH = pageH / 2
  const marginLeft = 10
  const marginRight = pageW - 10
  const contentW = marginRight - marginLeft

  // Offset: 0 for ORIGINAL (top half), halfH for DUPLICADO (bottom half)
  const offsetY = copyLabel === "DUPLICADO" ? halfH : 0

  // Draw outer border for this half
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.4)
  doc.rect(marginLeft, offsetY + 3, contentW, halfH - 6)

  // ========== TOP HEADER SECTION ==========
  const headerTopY = offsetY + 5

  // --- LEFT: Logo ---
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, "PNG", marginLeft + 3, headerTopY + 2, 50, 16)
    } catch {
      // fallback text
      doc.setTextColor(0, 56, 174)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(8)
      doc.text("GRUPO PINTAR JUNIN", marginLeft + 5, headerTopY + 10)
    }
  }

  // --- CENTER: Large "O" in a box ---
  const centerX = pageW / 2
  const boxSize = 16
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.5)
  doc.rect(centerX - boxSize / 2, headerTopY + 1, boxSize, boxSize)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(22)
  doc.setTextColor(0, 0, 0)
  doc.text("O", centerX, headerTopY + 12.5, { align: "center" })

  // --- RIGHT side of header ---
  const rightBlockX = centerX + boxSize / 2 + 6
  doc.setFontSize(7)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(0, 0, 0)

  // Date
  const formattedDate = new Date(order.date).toLocaleDateString("es-AR")
  doc.text(formattedDate, marginRight - 3, headerTopY + 4, { align: "right" })

  // CUIT at top-right area
  doc.setFontSize(6.5)
  doc.text("30716042819", marginRight - 3, headerTopY + 8, { align: "right" })

  // "Comprobante no valido como Factura"
  doc.setFontSize(5.5)
  doc.text("Comprobante no v\u00e1lido", rightBlockX, headerTopY + 4)
  doc.text("como Factura", rightBlockX, headerTopY + 7.5)

  // "250" (punto de venta)
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.text("250", rightBlockX + 28, headerTopY + 7)

  // --- IVA RESPONSABLE INSCRIPTO bar ---
  const ivaBarY = headerTopY + boxSize + 2.5
  doc.setFillColor(0, 0, 0)
  doc.rect(marginLeft, ivaBarY, contentW, 5, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(7)
  doc.text("IVA RESPONSABLE INSCRIPTO", centerX, ivaBarY + 3.5, { align: "center" })

  // --- Copy label (ORIGINAL / DUPLICADO) ---
  doc.setTextColor(0, 0, 0)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(7)
  doc.text(copyLabel, centerX, ivaBarY + 8.5, { align: "center" })

  // ========== COMPANY INFO SECTION ==========
  const companyY = ivaBarY + 12

  // Horizontal line separator
  doc.setLineWidth(0.3)
  doc.line(marginLeft, companyY, marginRight, companyY)

  // LEFT: Company name and address
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.text("PINTAR JUNIN SERVICIOS INDUSTRIALES SRL", marginLeft + 3, companyY + 5)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(6.5)
  doc.text("Rivadavia 448", marginLeft + 3, companyY + 9)
  doc.text("B6000", marginLeft + 3, companyY + 12.5)
  doc.text("JUNIN", marginLeft + 20, companyY + 12.5)
  doc.text("- CPA", marginLeft + 32, companyY + 12.5)
  doc.text("BUENOS AIRES", marginLeft + 3, companyY + 16)
  doc.text("info@pintarjunin.com.ar", marginLeft + 3, companyY + 19.5)

  // RIGHT: Fiscal data
  const fiscalX = centerX + 15
  doc.setFont("helvetica", "bold")
  doc.setFontSize(6.5)

  // Condicion IVA
  doc.text("Condici\u00f3n IVA:", fiscalX, companyY + 5)
  doc.setFont("helvetica", "normal")
  doc.text("IVA RESPONSABLE INSCRIPTO", fiscalX + 22, companyY + 5)

  // Fecha
  doc.setFont("helvetica", "bold")
  doc.text("Fecha:", fiscalX, companyY + 9)
  doc.setFont("helvetica", "normal")
  doc.text(formattedDate, fiscalX + 22, companyY + 9)

  // Ingresos Brutos
  doc.setFont("helvetica", "bold")
  doc.text("Ingresos Brutos:", fiscalX, companyY + 12.5)
  doc.setFont("helvetica", "normal")
  doc.text("30714481025", fiscalX + 22, companyY + 12.5)

  // CUIT
  doc.setFont("helvetica", "bold")
  doc.text("CUIT:", fiscalX, companyY + 16)
  doc.setFont("helvetica", "normal")
  doc.text("30-71448102-5", fiscalX + 22, companyY + 16)

  // Inicio Actividades
  doc.setFont("helvetica", "bold")
  doc.text("Inicio Actividades:", fiscalX, companyY + 19.5)
  doc.setFont("helvetica", "normal")
  doc.text("21/04/2014", fiscalX + 22, companyY + 19.5)

  // Vertical line dividing company from fiscal
  doc.setLineWidth(0.3)
  doc.line(fiscalX - 3, companyY, fiscalX - 3, companyY + 22)

  // ========== SUPPLIER SECTION ==========
  const supplierY = companyY + 23

  // Horizontal separator
  doc.line(marginLeft, supplierY, marginRight, supplierY)

  // "Hoja 1" at the right
  doc.setFont("helvetica", "normal")
  doc.setFontSize(6.5)
  doc.text("Hoja", marginRight - 12, supplierY + 4)
  doc.text("1", marginRight - 3, supplierY + 4)

  // ORDEN DE COMPRA title
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.text(`ORDEN DE COMPRA N\u00BA: ${order.order_number}`, centerX, supplierY + 4, { align: "center" })

  // Supplier labels (left)
  const suppLabelX = marginLeft + 3
  const suppValueX = marginLeft + 28
  const suppStartY = supplierY + 9

  doc.setFontSize(6.5)
  doc.setFont("helvetica", "bold")
  doc.text("Se\u00f1or/es:", suppLabelX, suppStartY)
  doc.setFont("helvetica", "normal")
  doc.text(order.supplier_name || "", suppValueX, suppStartY)

  doc.setFont("helvetica", "bold")
  doc.text("Domicilio:", suppLabelX, suppStartY + 4)
  doc.setFont("helvetica", "normal")
  doc.text(order.supplier_address || "", suppValueX, suppStartY + 4)

  doc.setFont("helvetica", "bold")
  doc.text("Localidad:", suppLabelX, suppStartY + 8)
  doc.setFont("helvetica", "normal")
  doc.text(order.supplier_locality || "", suppValueX, suppStartY + 8)

  doc.setFont("helvetica", "bold")
  doc.text("Provincia:", suppLabelX, suppStartY + 12)
  doc.setFont("helvetica", "normal")
  doc.text(order.supplier_province || "BUENOS AIRES", suppValueX, suppStartY + 12)

  // Right column supplier info
  const suppRightLabelX = fiscalX
  const suppRightValueX = fiscalX + 25

  doc.setFont("helvetica", "bold")
  doc.text("Condici\u00f3n IVA:", suppRightLabelX, suppStartY)
  doc.setFont("helvetica", "normal")
  doc.text(order.supplier_iva_condition || "IVA RESPONSABLE INSCRIPTO", suppRightValueX, suppStartY)

  doc.setFont("helvetica", "bold")
  doc.text("CUIT:", suppRightLabelX, suppStartY + 4)
  doc.setFont("helvetica", "normal")
  doc.text(order.supplier_cuit || "", suppRightValueX, suppStartY + 4)

  doc.setFont("helvetica", "bold")
  doc.text("Nro. Proveedor:", suppRightLabelX, suppStartY + 8)
  doc.setFont("helvetica", "normal")
  doc.text(order.supplier_number || "", suppRightValueX, suppStartY + 8)

  doc.setFont("helvetica", "bold")
  doc.text("Tel\u00e9fono:", suppRightLabelX, suppStartY + 12)
  doc.setFont("helvetica", "normal")
  doc.text(order.supplier_phone || "", suppRightValueX, suppStartY + 12)

  // Vertical divider in supplier section
  doc.line(fiscalX - 3, supplierY, fiscalX - 3, supplierY + suppStartY - supplierY + 15)

  // ========== ITEMS TABLE ==========
  const tableY = suppStartY + 17

  // Table header separator
  doc.setLineWidth(0.3)
  doc.line(marginLeft, tableY, marginRight, tableY)

  // Column definitions matching the model exactly:
  // Codigo | Articulo | Cantidad | Costo Item | Total Item
  const colX = {
    codigo: marginLeft + 3,
    articulo: marginLeft + 25,
    cantidad: marginLeft + 100,
    costoItem: marginLeft + 120,
    totalItem: marginLeft + 150,
  }

  // Header
  doc.setFont("helvetica", "bold")
  doc.setFontSize(6.5)
  doc.text("C\u00f3digo", colX.codigo, tableY + 3.5)
  doc.text("Art\u00edculo", colX.articulo, tableY + 3.5)
  doc.text("Cantidad", colX.cantidad, tableY + 3.5)
  doc.text("Costo \u00cdtem", colX.costoItem, tableY + 3.5)
  doc.text("Total \u00cdtem", colX.totalItem, tableY + 3.5)

  // Header bottom line
  const headerBottomY = tableY + 5.5
  doc.line(marginLeft, headerBottomY, marginRight, headerBottomY)

  // Vertical lines for header
  doc.line(marginLeft + 22, tableY, marginLeft + 22, headerBottomY)
  doc.line(marginLeft + 97, tableY, marginLeft + 97, headerBottomY)
  doc.line(marginLeft + 117, tableY, marginLeft + 117, headerBottomY)
  doc.line(marginLeft + 147, tableY, marginLeft + 147, headerBottomY)

  // Item rows
  doc.setFont("helvetica", "normal")
  doc.setFontSize(6.5)
  let rowY = headerBottomY + 4

  order.items.forEach((item, index) => {
    // Code
    doc.text(item.code || String(index + 1).padStart(3, "0"), colX.codigo, rowY)

    // Description - wrap if needed
    const descLines = doc.splitTextToSize(item.description, 70)
    descLines.forEach((line: string, i: number) => {
      doc.text(line, colX.articulo, rowY + i * 3.5)
    })

    // Quantity
    doc.text(
      formatNumber(item.quantity, 3),
      colX.cantidad + 14,
      rowY,
      { align: "right" }
    )

    // Cost per item
    doc.text(
      formatNumber(item.unit_price, 3),
      colX.costoItem + 24,
      rowY,
      { align: "right" }
    )

    // Total item
    doc.text(
      formatNumber(item.total, 3),
      colX.totalItem + 30,
      rowY,
      { align: "right" }
    )

    const lineHeight = Math.max(5, descLines.length * 3.5 + 1.5)
    rowY += lineHeight
  })

  // Extend vertical lines through items
  const tableEndY = rowY + 1
  doc.line(marginLeft + 22, headerBottomY, marginLeft + 22, tableEndY)
  doc.line(marginLeft + 97, headerBottomY, marginLeft + 97, tableEndY)
  doc.line(marginLeft + 117, headerBottomY, marginLeft + 117, tableEndY)
  doc.line(marginLeft + 147, headerBottomY, marginLeft + 147, tableEndY)

  // Bottom of items table line
  doc.line(marginLeft, tableEndY, marginRight, tableEndY)

  // ========== FOOTER: Currency, Observations, Total ==========
  const footerY = tableEndY + 2

  // Currency note
  const currencyLabel = order.currency === "USD" ? "USD" : "pesos"
  doc.setFont("helvetica", "italic")
  doc.setFontSize(6.5)
  doc.text(`Precios expresados en ${currencyLabel}`, marginLeft + 3, footerY + 3.5)

  // Observations and Total row
  const bottomRowY = footerY + 7
  doc.line(marginLeft, bottomRowY, marginRight, bottomRowY)

  // Observations (left)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(6.5)
  doc.text("Observaciones", marginLeft + 3, bottomRowY + 3.5)

  if (order.notes) {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(6)
    const notesLines = doc.splitTextToSize(order.notes, 90)
    notesLines.forEach((line: string, i: number) => {
      doc.text(line, marginLeft + 3, bottomRowY + 7.5 + i * 3)
    })
  }

  // Total (right)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(6.5)
  doc.text("Total O.C.", colX.costoItem, bottomRowY + 3.5)
  doc.text(
    formatNumber(order.total, 3),
    colX.totalItem + 30,
    bottomRowY + 3.5,
    { align: "right" }
  )

  // Vertical divider between observations and total
  doc.line(colX.costoItem - 5, bottomRowY, colX.costoItem - 5, bottomRowY + 6)

  // Bottom line of observations/total section
  doc.line(marginLeft, bottomRowY + 6, marginRight, bottomRowY + 6)
}

export async function generatePurchaseOrderPDF(order: PurchaseOrder) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  // Load the Pintar Junin logo
  const logoBase64 = await loadImageAsBase64("/images/logo-pintar-junin.png")

  // Draw ORIGINAL (top half)
  drawSinglePage(doc, order, logoBase64, "ORIGINAL")

  // Draw dashed separator line at the middle
  const pageH = doc.internal.pageSize.getHeight()
  const midY = pageH / 2
  doc.setDrawColor(180, 180, 180)
  doc.setLineWidth(0.2)
  doc.setLineDashPattern([2, 2], 0)
  doc.line(5, midY, doc.internal.pageSize.getWidth() - 5, midY)
  doc.setLineDashPattern([], 0)

  // Draw DUPLICADO (bottom half)
  drawSinglePage(doc, order, logoBase64, "DUPLICADO")

  return doc
}

export async function downloadPurchaseOrderPDF(order: PurchaseOrder) {
  const doc = await generatePurchaseOrderPDF(order)
  doc.save(`Orden_Compra_${order.order_number}.pdf`)
}
