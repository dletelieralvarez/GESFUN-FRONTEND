import { Injectable } from '@angular/core';
import type { jsPDF } from 'jspdf';

export interface DocumentoTributarioPdfData {
  uuid: string;
  pagoUuid: string;
  cotizacionNumero: string;
  tipoDocumentoCodigo: string;
  tipoDocumentoNombre: string;
  estado: string;
  folio: string;
  trackId: string;
  proveedor: string;
  fechaEmision: string;
  montoNeto: number;
  montoExento: number;
  iva: number;
  total: number;
  rutReceptor: string;
  razonSocialReceptor: string;
  pdfUrl?: string;
  xmlUrl?: string;
  detalles: DocumentoTributarioPdfDetalle[];
}

export interface DocumentoTributarioPdfDetalle {
  codigo?: string;
  nombre: string;
  cantidad: number;
  unitario: number;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class DocumentoTributarioPdfService {
  private readonly brand: [number, number, number] = [63, 107, 84];
  private readonly brandStrong: [number, number, number] = [47, 82, 64];
  private readonly brandFaint: [number, number, number] = [243, 247, 244];
  private readonly border: [number, number, number] = [221, 226, 222];
  private readonly ink: [number, number, number] = [43, 50, 46];
  private readonly muted: [number, number, number] = [108, 117, 111];

  async generar(data: DocumentoTributarioPdfData) {
    const [{ jsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable')
    ]);
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 16;

    this.header(doc, data, pageWidth, margin);
    this.receptor(doc, autoTable, data, margin, 55);
    const detalleY = this.detalle(doc, autoTable, data, margin, 98);
    const totalesY = Math.min(Math.max(detalleY + 8, 150), 210);
    this.totales(doc, data, pageWidth, margin, totalesY);
    this.trazabilidad(doc, autoTable, data, margin, totalesY + 45);
    this.footer(doc, pageWidth, margin);

    const tipo = data.tipoDocumentoCodigo.toLocaleLowerCase('es-CL');
    doc.save(`${tipo}-${this.nombreArchivo(data.folio || data.uuid)}.pdf`);
  }

  private header(doc: jsPDF, data: DocumentoTributarioPdfData, pageWidth: number, margin: number) {
    doc.setFillColor(...this.brandStrong);
    doc.rect(0, 0, pageWidth, 7, 'F');
    this.logo(doc, margin, 17);

    doc.setFont('times', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...this.brandStrong);
    doc.text('EL SAUCE', margin + 17, 18);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...this.muted);
    doc.text('FUNERARIA', margin + 17, 23);

    doc.setFont('times', 'bold');
    doc.setFontSize(19);
    doc.setTextColor(...this.ink);
    doc.text(data.tipoDocumentoNombre.toLocaleUpperCase('es-CL'), pageWidth / 2, 18, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...this.muted);
    doc.text('Documento tributario simulado', pageWidth / 2, 24, { align: 'center' });

    const boxX = pageWidth - margin - 48;
    doc.setDrawColor(...this.brand);
    doc.setLineWidth(0.45);
    doc.roundedRect(boxX, 12, 48, 25, 2, 2, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...this.brandStrong);
    doc.text(`RUT receptor`, boxX + 24, 18, { align: 'center' });
    doc.setFontSize(10);
    doc.text(data.rutReceptor || 'No informado', boxX + 24, 24, { align: 'center' });
    doc.setFontSize(8);
    doc.text(`${data.tipoDocumentoCodigo} N°`, boxX + 24, 30, { align: 'center' });
    doc.setFontSize(11);
    doc.text(data.folio || 'Sin folio', boxX + 24, 35, { align: 'center' });

    doc.setDrawColor(...this.border);
    doc.line(margin, 43, pageWidth - margin, 43);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...this.muted);
    doc.text(`Emisión: ${this.fecha(data.fechaEmision)}`, margin, 49);
    doc.text(`Cotización N° ${data.cotizacionNumero}`, pageWidth - margin, 49, { align: 'right' });
  }

  private receptor(
    doc: jsPDF,
    autoTable: typeof import('jspdf-autotable').default,
    data: DocumentoTributarioPdfData,
    margin: number,
    y: number
  ) {
    this.sectionTitle(doc, 'Datos del receptor', margin, y);
    autoTable(doc, {
      startY: y + 5,
      margin: { left: margin, right: margin },
      body: [
        ['Razón social / nombre', data.razonSocialReceptor || 'No informado'],
        ['RUT receptor', data.rutReceptor || 'No informado'],
        ['Estado documento', data.estado],
        ['Proveedor', data.proveedor || 'DTEEMITE_SIMULADO']
      ],
      theme: 'plain',
      styles: { font: 'helvetica', fontSize: 9, cellPadding: 2, textColor: this.ink, fillColor: this.brandFaint },
      columnStyles: { 0: { cellWidth: 45, fontStyle: 'bold', textColor: this.brandStrong } }
    });
  }

  private detalle(
    doc: jsPDF,
    autoTable: typeof import('jspdf-autotable').default,
    data: DocumentoTributarioPdfData,
    margin: number,
    y: number
  ) {
    this.sectionTitle(doc, 'Detalle', margin, y);
    autoTable(doc, {
      startY: y + 5,
      margin: { left: margin, right: margin },
      head: [['Código', 'Producto o servicio', 'Cantidad', 'Unitario', 'Total']],
      body: this.detalles(data).map(item => [
        item.codigo || '-',
        item.nombre,
        this.numero(item.cantidad),
        this.moneda(item.unitario),
        this.moneda(item.total)
      ]),
      theme: 'plain',
      styles: { font: 'helvetica', fontSize: 9, cellPadding: 2.5, textColor: this.ink, lineColor: this.border, lineWidth: { bottom: 0.15 } },
      headStyles: { fillColor: this.brandStrong, textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 24 },
        2: { cellWidth: 22, halign: 'right' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' }
      }
    });
    return (doc as any).lastAutoTable.finalY;
  }

  private totales(doc: jsPDF, data: DocumentoTributarioPdfData, pageWidth: number, margin: number, y: number) {
    const boxWidth = 78;
    const boxX = pageWidth - margin - boxWidth;
    const labelX = boxX + 42;
    const valueX = pageWidth - margin - 6;

    doc.setFillColor(...this.brandFaint);
    doc.setDrawColor(...this.border);
    doc.roundedRect(boxX, y, boxWidth, 38, 2, 2, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...this.ink);
    doc.text('Monto neto:', labelX, y + 8, { align: 'right' });
    doc.text(this.moneda(data.montoNeto), valueX, y + 8, { align: 'right' });
    doc.text('Monto exento:', labelX, y + 16, { align: 'right' });
    doc.text(this.moneda(data.montoExento), valueX, y + 16, { align: 'right' });
    doc.text('IVA:', labelX, y + 24, { align: 'right' });
    doc.text(this.moneda(data.iva), valueX, y + 24, { align: 'right' });
    doc.setDrawColor(...this.brand);
    doc.line(boxX + 6, y + 27, valueX, y + 27);
    doc.setFont('times', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...this.brandStrong);
    doc.text('TOTAL:', labelX, y + 34, { align: 'right' });
    doc.text(this.moneda(data.total), valueX, y + 34, { align: 'right' });
  }

  private trazabilidad(
    doc: jsPDF,
    autoTable: typeof import('jspdf-autotable').default,
    data: DocumentoTributarioPdfData,
    margin: number,
    y: number
  ) {
    this.sectionTitle(doc, 'Trazabilidad', margin, y);
    autoTable(doc, {
      startY: y + 5,
      margin: { left: margin, right: margin },
      body: [
        ['Track ID', data.trackId || 'No informado'],
        ['Pago UUID', data.pagoUuid || 'No informado'],
        ['Documento UUID', data.uuid || 'No informado'],
        ['PDF simulado', data.pdfUrl || 'No informado'],
        ['XML simulado', data.xmlUrl || 'No informado']
      ],
      theme: 'plain',
      styles: { font: 'helvetica', fontSize: 8.5, cellPadding: 1.8, textColor: this.ink },
      columnStyles: { 0: { cellWidth: 35, fontStyle: 'bold', textColor: this.brandStrong } }
    });
  }

  private sectionTitle(doc: jsPDF, title: string, x: number, y: number) {
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...this.brandStrong);
    doc.text(title, x, y);
    doc.setDrawColor(...this.brand);
    doc.line(x, y + 2, x + Math.min(46, doc.getTextWidth(title) + 8), y + 2);
  }

  private footer(doc: jsPDF, pageWidth: number, margin: number) {
    doc.setDrawColor(...this.border);
    doc.line(margin, 278, pageWidth - margin, 278);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...this.muted);
    doc.text('Documento tributario simulado generado por GESFUN', margin, 285);
    doc.text('Proveedor: DTEEMITE_SIMULADO', pageWidth - margin, 285, { align: 'right' });
  }

  private logo(doc: jsPDF, x: number, y: number) {
    doc.setFillColor(...this.brand);
    doc.roundedRect(x, y - 4, 13, 13, 3, 3, 'F');
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.55);
    doc.line(x + 6.5, y - 1.5, x + 6.5, y + 6.5);
    doc.line(x + 6.5, y - 1.5, x + 3.7, y + 2.2);
    doc.line(x + 3.7, y + 2.2, x + 4.8, y + 5.4);
    doc.line(x + 6.5, y - 1.5, x + 9.3, y + 2.2);
    doc.line(x + 9.3, y + 2.2, x + 8.2, y + 5.4);
  }

  private fecha(value: string) {
    if (!value) return 'No informada';
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return `${date.toLocaleDateString('es-CL')} ${date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}`;
    }
    const [year, month, day] = value.slice(0, 10).split('-');
    return year && month && day ? `${day}-${month}-${year}` : value;
  }

  private moneda(value: number) {
    return `$ ${Math.round(Number(value) || 0).toLocaleString('es-CL')}`;
  }

  private numero(value: number) {
    return Number(value || 0).toLocaleString('es-CL');
  }

  private detalles(data: DocumentoTributarioPdfData) {
    if (data.detalles?.length) return data.detalles;
    return [{
      nombre: `Pago cotización ${data.cotizacionNumero}`,
      cantidad: 1,
      unitario: data.total,
      total: data.total
    }];
  }

  private nombreArchivo(value: string) {
    return String(value || 'documento').replace(/[^a-zA-Z0-9_-]/g, '-');
  }
}
