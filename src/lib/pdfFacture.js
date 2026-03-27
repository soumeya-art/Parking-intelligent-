import { jsPDF } from 'jspdf'

export function genererFacturePDF(item) {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' })
  const m = 20
  let y = m

  doc.setFontSize(22)
  doc.setTextColor(0, 150, 105)
  doc.text('MOUBARIK Parking', m, y)
  y += 10

  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text('Djibouti • Gestion intelligente des places', m, y)
  y += 15

  doc.setDrawColor(0, 150, 105)
  doc.setLineWidth(0.5)
  doc.line(m, y, 210 - m, y)
  y += 12

  doc.setFontSize(14)
  doc.setTextColor(0)
  doc.text('Facture', m, y)
  y += 10

  doc.setFontSize(10)
  doc.text(`N° MOUBARIK-${item.id}`, m, y)
  y += 7
  doc.text(`Date : ${item.date} • ${item.startTime} - ${item.endTime}`, m, y)
  y += 10

  doc.setFontSize(11)
  doc.text(`Place : ${item.spot}`, m, y)
  y += 7
  doc.text(`Durée : ${item.duration}`, m, y)
  y += 7
  doc.text(`Montant : ${item.montant ?? 0} FDJ`, m, y)
  y += 15

  doc.setFontSize(9)
  doc.setTextColor(100)
  doc.text('Merci pour votre confiance. MOUBARIK Parking — Djibouti', m, y)
  doc.text('Validation à l\'entrée : MOUBARIK-' + item.id + '-' + item.spot, m, y + 5)

  doc.save(`MOUBARIK-Facture-${item.id}.pdf`)
}
