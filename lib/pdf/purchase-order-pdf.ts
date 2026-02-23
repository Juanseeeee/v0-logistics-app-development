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

type LoadedImage = { data: string; width: number; height: number }

async function loadImageWithSize(path: string): Promise<LoadedImage | null> {
  try {
    const response = await fetch(path)
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const data = reader.result as string
        const img = new Image()
        img.onload = () => resolve({ data, width: img.naturalWidth, height: img.naturalHeight })
        img.onerror = reject
        img.src = data
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
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
  logo: LoadedImage | null,
  copyLabel: string
) {
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const marginLeft = 10
  const marginRight = pageW - 10
  const contentW = marginRight - marginLeft

  const headerTopY = 12

  const centerX = pageW / 2
  const boxSize = 16

  if (logo) {
    const targetW = 45
    const ratio = logo.height / logo.width
    const targetH = targetW * ratio
    const logoY = headerTopY + 1 + boxSize / 2 - targetH / 2
    doc.addImage(logo.data, "PNG", marginLeft + 3, logoY, targetW, targetH)
  }
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.5)
  doc.rect(centerX - boxSize / 2, headerTopY + 1, boxSize, boxSize)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(22)
  doc.setTextColor(0, 0, 0)
  doc.text("R", centerX, headerTopY + 12.5, { align: "center" })

  // --- RIGHT side of header ---
  const rightBlockX = centerX + boxSize / 2 + 6
  doc.setFontSize(7)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(0, 0, 0)

  // OC number and date (top-right block)
  const formattedDate = new Date(order.date).toLocaleDateString("es-AR")
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.text(`ORDEN DE COMPRA N\u00BA: ${order.order_number}`, marginRight - 3, headerTopY + 4, { align: "right" })
  doc.setFont("helvetica", "normal")
  doc.setFontSize(7)
  doc.text(`Fecha: ${formattedDate}`, rightBlockX, headerTopY + 8)

  // "Comprobante no valido como Factura" debajo del recuadro
  doc.setFontSize(6)
  doc.text("Comprobante no v\u00e1lido", centerX, headerTopY + boxSize + 6, { align: "center" })
  doc.text("como Factura", centerX, headerTopY + boxSize + 9, { align: "center" })

  // Copia (ORIGINAL / DUPLICADO) centrado bajo el recuadro
  doc.setFontSize(7)
  doc.setFont("helvetica", "bold")
  doc.text(copyLabel, centerX, headerTopY + boxSize + 12, { align: "center" })
  // Línea divisoria vertical al medio, a la derecha de los datos de Grupo Pintar, comenzando bajo "Original"
  const dividerX = centerX + 12
  const lineStartY = headerTopY + boxSize + 14
  doc.setLineWidth(0.3)
  doc.line(dividerX, lineStartY + 2, dividerX, lineStartY + 30)
  // Datos fiscales bajo la fecha, más abajo con espacio; "Inicio" alineado con arranque de la línea
  doc.setFontSize(6.5)
  doc.text("CUIT: 30-71448102-5", rightBlockX, lineStartY - 6)
  doc.text("Ingresos Brutos: 30714481025", rightBlockX, lineStartY - 3)
  doc.text("Inicio Actividades: 21/04/2014", rightBlockX, lineStartY)

  const ivaBarY = headerTopY + boxSize + 3

  // ========== COMPANY INFO SECTION ==========
  const companyY = ivaBarY + 12

  doc.setLineWidth(0.3)

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
  doc.text("2364572146", marginLeft + 46, companyY + 19.5)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(6.5)
  doc.text("Condici\u00f3n IVA:", marginLeft + 3, companyY + 29.5)
  doc.setFont("helvetica", "normal")
  doc.text("IVA RESPONSABLE INSCRIPTO", marginLeft + 28, companyY + 29.5)

  // RIGHT: Fiscal data
  const fiscalX = centerX + 15
  doc.setFont("helvetica", "bold")
  doc.setFontSize(6.5)

  // (Condición IVA se muestra más abajo, antes de los datos del proveedor)

  // (Se evita duplicar fecha, ingresos, CUIT e inicio actividades en esta sección)

  doc.setLineWidth(0.3)

  const supplierY = companyY + 31

  // Horizontal separator
  doc.line(marginLeft, supplierY, marginRight, supplierY)

  // "Hoja 1" at the right
  doc.setFont("helvetica", "normal")
  doc.setFontSize(6.5)
  doc.text("Hoja", marginRight - 12, supplierY + 4)
  doc.text("1", marginRight - 3, supplierY + 4)

  // Nro. Proveedor (top-right, aligned with Hoja)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(6.5)
  doc.text("Nro. Proveedor:", marginRight - 45, supplierY + 4)
  doc.setFont("helvetica", "normal")
  doc.text(order.supplier_number || "", marginRight - 3, supplierY + 4, { align: "right" })

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
  doc.text("- CPA", suppValueX + 60, suppStartY + 8)
  doc.setFont("helvetica", "bold")
  doc.text("CUIT:", suppValueX + 75, suppStartY + 8)
  doc.setFont("helvetica", "normal")
  doc.text(order.supplier_cuit || "", suppValueX + 95, suppStartY + 8)

  doc.setFont("helvetica", "bold")
  doc.text("Provincia:", suppLabelX, suppStartY + 12)
  doc.setFont("helvetica", "normal")
  doc.text(order.supplier_province || "BUENOS AIRES", suppValueX, suppStartY + 12)
  
  doc.setFont("helvetica", "bold")
  doc.text("Condici\u00f3n IVA:", suppLabelX, suppStartY + 16)
  doc.setFont("helvetica", "normal")
  doc.text(order.supplier_iva_condition || "IVA RESPONSABLE INSCRIPTO", suppValueX, suppStartY + 16)

  doc.setFont("helvetica", "bold")
  doc.text("Tel\u00e9fono:", suppValueX + 75, suppStartY + 12)
  doc.setFont("helvetica", "normal")
  doc.text(order.supplier_phone || "", suppValueX + 95, suppStartY + 12)

  // (Sin línea divisoria vertical: bloque proveedor completo)

  const supplierEndY = suppStartY + 16
  const dividerY = supplierEndY + 1
  doc.setLineWidth(0.2)
  doc.line(marginLeft, dividerY, marginRight, dividerY)
  const tableY = supplierEndY + 2

  // Encabezado de tabla: rellenado y cerrar arriba, izquierda y derecha
  doc.setLineWidth(0.2)
  doc.setFillColor(230, 230, 230)
  doc.rect(marginLeft, tableY, contentW, 5.5, "F")
  doc.line(marginLeft, tableY, marginRight, tableY) // arriba
  doc.line(marginLeft, tableY, marginLeft, tableY + 5.5) // izquierda
  doc.line(marginRight, tableY, marginRight, tableY + 5.5) // derecha

  // Column definitions to match the provided model:
  // Ítem | Código | Artículo | Cantidad | Costo | Total Ítem
  const colX = {
    item: marginLeft + 3,
    codigo: marginLeft + 15,
    articulo: marginLeft + 35,
    cantidad: marginLeft + 120,
    costoItem: marginLeft + 140,
    totalItem: marginLeft + 170,
  }

  // Header
  doc.setFont("helvetica", "bold")
  doc.setFontSize(6.5)
  doc.text("\u00cdtem", colX.item, tableY + 3.5)
  doc.text("C\u00f3digo", colX.codigo, tableY + 3.5)
  doc.text("Art\u00edculo", colX.articulo, tableY + 3.5)
  doc.text("Cantidad", colX.cantidad, tableY + 3.5)
  doc.text("Costo", colX.costoItem, tableY + 3.5)
  doc.text("Total \u00cdtem", colX.totalItem, tableY + 3.5)

  // Header bottom line
  const headerBottomY = tableY + 5.5
  doc.line(marginLeft, headerBottomY, marginRight, headerBottomY)

  // Sin líneas divisorias verticales entre títulos

  // Item rows
  doc.setFont("helvetica", "normal")
  doc.setFontSize(6.5)
  let rowY = headerBottomY + 4

  order.items.forEach((item, index) => {
    // Item number
    doc.text(String(index + 1), colX.item, rowY)

    // Code
    doc.text(item.code || "", colX.codigo, rowY)

    // Description - wrap if needed
    const descLines = doc.splitTextToSize(item.description, 80)
    descLines.forEach((line: string, i: number) => {
      doc.text(line, colX.articulo, rowY + i * 3.5)
    })

    // Quantity
    doc.text(formatNumber(item.quantity, 3), colX.cantidad, rowY)

    // Cost per item
    doc.text(formatNumber(item.unit_price, 3), colX.costoItem, rowY)

    // Total item
    doc.text(formatNumber(item.total, 3), colX.totalItem, rowY)

    const lineHeight = Math.max(5, descLines.length * 3.5 + 1.5)
    rowY += lineHeight
  })

  // Bottom of items table line (sin dividir filas)
  const tableEndY = rowY + 1

  // Bottom of items table line
  doc.line(marginLeft, tableEndY, marginRight, tableEndY)

  // ========== FOOTER: Currency, Observations, Total ==========
  const footerY = tableEndY + 1

  const bottomRowY = footerY + 3

  doc.setFont("helvetica", "bold")
  doc.setFontSize(6.5)
  const obsLabelY = bottomRowY + 3.5
  doc.text("Observaciones", marginLeft + 3, obsLabelY)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(6)
  const obsText = order.notes && order.notes.trim().length > 0 ? order.notes : `Precios expresados en ${order.currency || "USD"}`
  const obsX = marginLeft + 28
  const obsLines = doc.splitTextToSize(obsText, marginRight - obsX)
  doc.text(obsLines, obsX, obsLabelY)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(6.5)
  doc.text("Total O.C.", marginRight - 50, bottomRowY + 3.5)
  doc.text(formatNumber(order.total, 3), marginRight - 3, bottomRowY + 3.5, { align: "right" })

  // (Se eliminan recuadro y líneas divisorias del pie)
}

export async function generatePurchaseOrderPDF(order: PurchaseOrder) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  const logo = await loadImageWithSize("/images/logo-pintar-junin.png")
  drawSinglePage(doc, order, logo, "ORIGINAL")
  doc.addPage()
  drawSinglePage(doc, order, logo, "DUPLICADO")

  return doc
}

export async function downloadPurchaseOrderPDF(order: PurchaseOrder) {
  const doc = await generatePurchaseOrderPDF(order)
  doc.save(`Orden_Compra_${order.order_number}.pdf`)
}
