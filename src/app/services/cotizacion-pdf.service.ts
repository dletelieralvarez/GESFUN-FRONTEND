import { Injectable } from '@angular/core';
import type { jsPDF } from 'jspdf';

export interface CotizacionPdfPersona {
  tipoPersona: 'N' | 'J';
  rut: string;
  nombre: string;
  email?: string;
  telefono?: string;
  fechaNacimiento?: string;
  comuna?: string;
}

export interface CotizacionPdfDetalle {
  codigo?: string;
  nombre: string;
  tipo: string;
  cantidad: number;
  unitario: number;
  total: number;
  observacion?: string;
}

export interface CotizacionPdfData {
  numero: string;
  fecha: string;
  fechaValidez: string;
  sucursal: string;
  direccionSucursal?: string;
  telefonoSucursal?: string;
  plan: string;
  descripcionPlan?: string;
  formaPago: string;
  motivoFallecimiento: string;
  fechaFallecimiento?: string;
  horaFallecimiento?: string;
  lugarFallecimiento?: string;
  pagador: CotizacionPdfPersona;
  fallecido: CotizacionPdfPersona;
  detalles: CotizacionPdfDetalle[];
  subtotal: number;
  iva: number;
  total: number;
  observacion?: string;
}

@Injectable({ providedIn: 'root' })
export class CotizacionPdfService {
  private readonly brand: [number, number, number] = [63, 107, 84];
  private readonly brandStrong: [number, number, number] = [47, 82, 64];
  private readonly brandTint: [number, number, number] = [231, 239, 233];
  private readonly brandFaint: [number, number, number] = [243, 247, 244];
  private readonly ink: [number, number, number] = [43, 50, 46];
  private readonly muted: [number, number, number] = [108, 117, 111];

  async generar(data: CotizacionPdfData) {
    const [{ jsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable')
    ]);
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = this.encabezado(doc, data, pageWidth, margin);

    y = this.seccion(doc, autoTable, 'Datos de la cotizacion', [
      ['Sucursal', data.sucursal],
      ['Direccion', data.direccionSucursal || 'No informada'],
      ['Telefono', data.telefonoSucursal || 'No informado'],
      ['Plan', data.plan],
      ['Descripcion', data.descripcionPlan || 'Sin descripcion'],
      ['Forma de pago', data.formaPago]
    ], y);

    y = this.seccion(doc, autoTable, 'Cliente pagador', this.personaRows(data.pagador), y);
    y = this.seccion(doc, autoTable, 'Datos del fallecido', [
      ...this.personaRows(data.fallecido),
      ['Motivo de fallecimiento', data.motivoFallecimiento],
      ['Fecha de fallecimiento', this.fecha(data.fechaFallecimiento)],
      ['Hora', data.horaFallecimiento || 'No informada'],
      ['Lugar', data.lugarFallecimiento || 'No informado']
    ], y);

    if (y > 235) {
      doc.addPage();
      y = 18;
    }

    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...this.brandStrong);
    doc.text('Detalle de productos y servicios', margin, y);
    doc.setDrawColor(...this.brand);
    doc.setLineWidth(0.6);
    doc.line(margin, y + 2, margin + 47, y + 2);

    autoTable(doc, {
      startY: y + 6,
      margin: { left: margin, right: margin },
      head: [['Codigo', 'Producto o servicio', 'Tipo', 'Cant.', 'Unitario', 'Total']],
      body: data.detalles.map(item => [
        item.codigo || '-',
        item.observacion ? `${item.nombre}\n${item.observacion}` : item.nombre,
        item.tipo,
        this.numero(item.cantidad),
        this.moneda(item.unitario),
        this.moneda(item.total)
      ]),
      theme: 'plain',
      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: 2.4,
        textColor: this.ink,
        lineColor: [221, 226, 222],
        lineWidth: { bottom: 0.15 }
      },
      headStyles: {
        fillColor: this.brandStrong,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        cellPadding: 2.8
      },
      alternateRowStyles: { fillColor: this.brandFaint },
      columnStyles: {
        0: { cellWidth: 22 },
        2: { cellWidth: 20 },
        3: { cellWidth: 13, halign: 'right' },
        4: { cellWidth: 25, halign: 'right' },
        5: { cellWidth: 27, halign: 'right' }
      }
    });

    y = (doc as any).lastAutoTable.finalY + 7;
    if (y > 250) {
      doc.addPage();
      y = 18;
    }

    const totalBoxWidth = 72;
    const totalBoxX = pageWidth - margin - totalBoxWidth;
    const totalX = pageWidth - margin - 5;
    doc.setFillColor(...this.brandFaint);
    doc.setDrawColor(...this.brandTint);
    doc.roundedRect(totalBoxX, y - 4, totalBoxWidth, 27, 2, 2, 'FD');
    doc.setFontSize(10);
    doc.setTextColor(...this.ink);
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal:', totalX - 45, y, { align: 'right' });
    doc.text(this.moneda(data.subtotal), totalX, y, { align: 'right' });
    doc.text('IVA (19%):', totalX - 45, y + 7, { align: 'right' });
    doc.text(this.moneda(data.iva), totalX, y + 7, { align: 'right' });
    doc.setDrawColor(...this.brand);
    doc.line(totalBoxX + 5, y + 10, totalX, y + 10);
    doc.setFont('times', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...this.brandStrong);
    doc.text('TOTAL:', totalX - 45, y + 16, { align: 'right' });
    doc.text(this.moneda(data.total), totalX, y + 16, { align: 'right' });
    y += 27;

    if (data.observacion) {
      if (y > 255) {
        doc.addPage();
        y = 18;
      }
      doc.setFontSize(11);
      doc.setFont('times', 'bold');
      doc.setTextColor(...this.brandStrong);
      doc.text('Observaciones', margin, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...this.ink);
      doc.setFillColor(...this.brandFaint);
      const lines = doc.splitTextToSize(data.observacion, pageWidth - margin * 2 - 10);
      const boxHeight = Math.max(15, lines.length * 4.2 + 8);
      doc.roundedRect(margin, y + 3, pageWidth - margin * 2, boxHeight, 2, 2, 'F');
      doc.text(lines, margin + 5, y + 9);
    }

    const pages = doc.getNumberOfPages();
    for (let page = 1; page <= pages; page++) {
      doc.setPage(page);
      doc.setDrawColor(...this.brandTint);
      doc.line(margin, 284, pageWidth - margin, 284);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...this.muted);
      doc.text('Funeraria El Sauce · Documento generado por GESFUN', margin, 290);
      doc.text(`Pagina ${page} de ${pages}`, pageWidth - margin, 290, { align: 'right' });
    }

    doc.save(`cotizacion-${this.nombreArchivo(data.numero)}.pdf`);
  }

  async generarContrato(data: CotizacionPdfData) {
    const [{ jsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable')
    ]);
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 18;
    let y = this.encabezadoContrato(doc, data, pageWidth, margin);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...this.ink);
    const introduccion =
      `En ${data.sucursal}, con fecha ${this.fecha(data.fecha)}, comparecen Funeraria El Sauce y ` +
      `${data.pagador.nombre}, RUT ${data.pagador.rut}, en adelante “el cliente”, quienes acuerdan ` +
      `el siguiente contrato de prestación de servicios funerarios para ${data.fallecido.nombre}.`;
    const introLines = doc.splitTextToSize(introduccion, pageWidth - margin * 2);
    doc.text(introLines, margin, y);
    y += introLines.length * 4.5 + 7;

    y = this.clausula(doc, 'PRIMERO: Objeto del contrato',
      `La funeraria prestará los productos y servicios correspondientes al plan ${data.plan}, junto con los adicionales detallados en este documento.`, y, pageWidth, margin);
    y = this.clausula(doc, 'SEGUNDO: Precio y forma de pago',
      `El precio total convenido es ${this.moneda(data.total)}, IVA incluido. La forma de pago acordada es ${data.formaPago}.`, y, pageWidth, margin);
    y = this.clausula(doc, 'TERCERO: Prestaciones contratadas',
      'Las prestaciones contratadas se individualizan en la siguiente tabla y forman parte íntegra de este contrato.', y, pageWidth, margin);

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Código', 'Producto o servicio', 'Cant.', 'Total']],
      body: data.detalles.map(item => [
        item.codigo || '-',
        item.nombre,
        this.numero(item.cantidad),
        this.moneda(item.total)
      ]),
      theme: 'plain',
      styles: { font: 'helvetica', fontSize: 8.5, cellPadding: 2.5, textColor: this.ink },
      headStyles: { fillColor: this.brandStrong, textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: this.brandFaint },
      columnStyles: {
        0: { cellWidth: 24 },
        2: { cellWidth: 16, halign: 'right' },
        3: { cellWidth: 30, halign: 'right' }
      }
    });
    y = (doc as any).lastAutoTable.finalY + 9;

    if (y > 210) {
      doc.addPage();
      y = 20;
    }
    y = this.clausula(doc, 'CUARTO: Aceptación',
      'Las partes declaran haber leído y aceptado las condiciones, valores y prestaciones individualizadas en este contrato.', y, pageWidth, margin);

    if (data.observacion) {
      y = this.clausula(doc, 'CONDICIONES PARTICULARES', data.observacion, y, pageWidth, margin);
    }

    if (y > 225) {
      doc.addPage();
      y = 25;
    }
    this.bloquesFirma(doc, data, y, pageWidth, margin);
    this.piePaginas(doc, pageWidth, margin, 'Contrato generado por GESFUN');
    doc.save(`contrato-${this.nombreArchivo(data.numero)}.pdf`);
  }

  private seccion(
    doc: jsPDF,
    autoTable: typeof import('jspdf-autotable').default,
    titulo: string,
    rows: string[][],
    startY: number
  ) {
    if (startY > 235) {
      doc.addPage();
      startY = 18;
    }
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...this.brandStrong);
    doc.text(titulo, 15, startY);
    doc.setDrawColor(...this.brand);
    doc.setLineWidth(0.6);
    doc.line(15, startY + 2, 15 + Math.min(48, doc.getTextWidth(titulo) + 8), startY + 2);
    autoTable(doc, {
      startY: startY + 6,
      margin: { left: 15, right: 15 },
      body: rows,
      theme: 'plain',
      styles: {
        font: 'helvetica',
        fontSize: 9,
        cellPadding: 1.6,
        textColor: this.ink,
        fillColor: this.brandFaint
      },
      columnStyles: {
        0: { cellWidth: 43, fontStyle: 'bold', textColor: this.brandStrong }
      }
    });
    return (doc as any).lastAutoTable.finalY + 7;
  }

  private encabezado(doc: jsPDF, data: CotizacionPdfData, pageWidth: number, margin: number) {
    doc.setFillColor(...this.brandStrong);
    doc.rect(0, 0, pageWidth, 5, 'F');

    this.logo(doc, margin, 12);
    doc.setFont('times', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...this.brandStrong);
    doc.text('EL SAUCE', margin + 17, 17);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...this.muted);
    doc.text('FUNERARIA', margin + 17, 22);

    doc.setFont('times', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...this.ink);
    doc.text('Cotizacion de servicios', pageWidth / 2, 17, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...this.muted);
    doc.text('Propuesta comercial para servicios funerarios', pageWidth / 2, 22, { align: 'center' });

    const boxX = pageWidth - margin - 43;
    doc.setFillColor(...this.brandFaint);
    doc.setDrawColor(...this.brandTint);
    doc.roundedRect(boxX, 10, 43, 17, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...this.muted);
    doc.text('COTIZACION N°', boxX + 4, 16);
    doc.setFont('times', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...this.brandStrong);
    doc.text(String(data.numero), boxX + 4, 23);

    doc.setDrawColor(...this.brandTint);
    doc.setLineWidth(0.3);
    doc.line(margin, 32, pageWidth - margin, 32);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...this.muted);
    doc.text(`Emision: ${this.fecha(data.fecha)}`, margin, 38);
    doc.text(`Valida hasta: ${this.fecha(data.fechaValidez)}`, pageWidth - margin, 38, { align: 'right' });
    return 48;
  }

  private encabezadoContrato(doc: jsPDF, data: CotizacionPdfData, pageWidth: number, margin: number) {
    doc.setFillColor(...this.brandStrong);
    doc.rect(0, 0, pageWidth, 6, 'F');
    this.logo(doc, margin, 14);
    doc.setFont('times', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(...this.brandStrong);
    doc.text('EL SAUCE', margin + 17, 19);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...this.muted);
    doc.text('FUNERARIA', margin + 17, 24);
    doc.setFont('times', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...this.ink);
    doc.text('CONTRATO DE PRESTACIÓN DE SERVICIOS', pageWidth / 2, 38, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...this.muted);
    doc.text(`Contrato asociado a cotización N° ${data.numero}`, pageWidth / 2, 45, { align: 'center' });
    doc.setDrawColor(...this.brandTint);
    doc.line(margin, 51, pageWidth - margin, 51);
    return 60;
  }

  private clausula(
    doc: jsPDF,
    titulo: string,
    contenido: string,
    y: number,
    pageWidth: number,
    margin: number
  ) {
    const lines = doc.splitTextToSize(contenido, pageWidth - margin * 2);
    const required = 7 + lines.length * 4.3 + 5;
    if (y + required > 272) {
      doc.addPage();
      y = 20;
    }
    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...this.brandStrong);
    doc.text(titulo, margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.3);
    doc.setTextColor(...this.ink);
    doc.text(lines, margin, y + 6);
    return y + required;
  }

  private bloquesFirma(doc: jsPDF, data: CotizacionPdfData, y: number, pageWidth: number, margin: number) {
    const gap = 16;
    const width = (pageWidth - margin * 2 - gap) / 2;
    const leftX = margin;
    const rightX = margin + width + gap;
    doc.setDrawColor(...this.brand);
    doc.setLineWidth(0.35);
    doc.line(leftX, y + 20, leftX + width, y + 20);
    doc.line(rightX, y + 20, rightX + width, y + 20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...this.ink);
    doc.text(data.pagador.nombre, leftX + width / 2, y + 26, { align: 'center' });
    doc.text('Representante Funeraria El Sauce', rightX + width / 2, y + 26, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...this.muted);
    doc.text(`RUT ${data.pagador.rut}`, leftX + width / 2, y + 31, { align: 'center' });
    doc.text('Firma del cliente', leftX + width / 2, y + 36, { align: 'center' });
    doc.text('Firma y timbre', rightX + width / 2, y + 31, { align: 'center' });

    doc.setFillColor(...this.brandFaint);
    doc.roundedRect(margin, y + 45, pageWidth - margin * 2, 15, 2, 2, 'F');
    doc.setFontSize(7.5);
    doc.text(
      'Espacio preparado para firma manuscrita o para aplicar una firma electrónica mediante una plataforma certificada.',
      pageWidth / 2,
      y + 54,
      { align: 'center' }
    );
  }

  private piePaginas(doc: jsPDF, pageWidth: number, margin: number, texto: string) {
    const pages = doc.getNumberOfPages();
    for (let page = 1; page <= pages; page++) {
      doc.setPage(page);
      doc.setDrawColor(...this.brandTint);
      doc.line(margin, 284, pageWidth - margin, 284);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...this.muted);
      doc.text(texto, margin, 290);
      doc.text(`Página ${page} de ${pages}`, pageWidth - margin, 290, { align: 'right' });
    }
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

  private personaRows(persona: CotizacionPdfPersona) {
    return [
      ['Tipo de persona', persona.tipoPersona === 'J' ? 'Persona juridica' : 'Persona natural'],
      ['RUT', persona.rut],
      ['Nombre', persona.nombre],
      ['Email', persona.email || 'No informado'],
      ['Telefono', persona.telefono || 'No informado'],
      ['Fecha de nacimiento', this.fecha(persona.fechaNacimiento)],
      ['Comuna', persona.comuna || 'No informada']
    ];
  }

  private fecha(value?: string) {
    if (!value) return 'No informada';
    const [year, month, day] = value.slice(0, 10).split('-');
    return year && month && day ? `${day}-${month}-${year}` : value;
  }

  private moneda(value: number) {
    return `$ ${Math.round(Number(value) || 0).toLocaleString('es-CL')}`;
  }

  private numero(value: number) {
    return Number(value || 0).toLocaleString('es-CL');
  }

  private nombreArchivo(value: string) {
    return String(value || 'sin-folio').replace(/[^a-zA-Z0-9_-]/g, '-');
  }
}
