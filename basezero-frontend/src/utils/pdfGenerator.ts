import jsPDF from 'jspdf';
import type { EmpresaConfig } from '../store/empresaStore';

const CYAN = '#00B4D8';
const DARK = '#0D1B2A';
const GRAY = '#718096';
const LIGHT = '#F8FAFC';
const BORDER = '#E2E8F0';

const fmt = (n: number) => (n || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface LineaPDF {
  producto?: string;
  nombre: string;
  descripcion?: string;
  unidades: number;
  precio: number;
  descuento?: number;
  iva: number;
  total: number;
}

interface DocumentoPDFData {
  tipo: 'FACTURA' | 'PRESUPUESTO' | 'ALBARAN' | 'INFORME_COBROS';
  numero: string;
  fecha: string;
  vencimiento?: string;
  metodoPago?: string;
  cliente?: {
    nombre: string;
    cifNif?: string;
    direccion?: string;
    email?: string;
    telefono?: string;
  };
  lineas?: LineaPDF[];
  cobros?: {
    id: number;
    fecha: string;
    cantidad: number;
    metodoPago: string;
    ventaCodigo?: string;
  }[];
  notas?: string;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  return [parseInt(clean.slice(0,2),16), parseInt(clean.slice(2,4),16), parseInt(clean.slice(4,6),16)];
}

function setRgb(doc: jsPDF, hex: string) {
  const [r,g,b] = hexToRgb(hex);
  doc.setTextColor(r,g,b);
}

function fillR(doc: jsPDF, x: number, y: number, w: number, h: number, hex: string) {
  const [r,g,b] = hexToRgb(hex);
  doc.setFillColor(r,g,b);
  doc.rect(x,y,w,h,'F');
}

function drawL(doc: jsPDF, x1: number, y: number, x2: number, hex: string = BORDER) {
  const [r,g,b] = hexToRgb(hex);
  doc.setDrawColor(r,g,b);
  doc.setLineWidth(0.3);
  doc.line(x1,y,x2,y);
}

export function generarPDF(empresa: EmpresaConfig, data: DocumentoPDFData): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, margin = 15, contentW = W - margin * 2;
  let y = margin;

  const tipoLabels: Record<string,string> = {
    FACTURA: 'FACTURA', PRESUPUESTO: 'PRESUPUESTO',
    ALBARAN: 'ALBARÁN', INFORME_COBROS: 'INFORME DE COBROS',
  };

  // Top bar
  fillR(doc, 0, 0, W, 2, CYAN);

  // Company block
  fillR(doc, margin, y+2, 90, 35, DARK);
  doc.setFont('helvetica','bold'); doc.setFontSize(16);
  doc.setTextColor(255,255,255);
  doc.text('BASE', margin+5, y+13);
  const bw = doc.getTextWidth('BASE');
  setRgb(doc, CYAN);
  doc.text('ZERO', margin+5+bw, y+13);
  doc.setFont('helvetica','normal'); doc.setFontSize(7);
  doc.setTextColor(160,180,200);
  doc.text('SYSTEM · GESTIÓN EMPRESARIAL', margin+5, y+19);
  doc.setFont('helvetica','bold'); doc.setFontSize(8);
  doc.setTextColor(255,255,255);
  doc.text(empresa.nombre, margin+5, y+25);
  doc.setFont('helvetica','normal'); doc.setFontSize(6.5);
  doc.setTextColor(180,200,215);
  doc.text(empresa.direccion, margin+5, y+29);
  doc.text(`${empresa.telefono}  ·  ${empresa.email}`, margin+5, y+33);

  // Document type block
  fillR(doc, W-margin-75, y+2, 75, 35, CYAN);
  doc.setFont('helvetica','bold'); doc.setFontSize(12);
  setRgb(doc, DARK);
  doc.text(tipoLabels[data.tipo]||data.tipo, W-margin-70, y+12);
  doc.setFontSize(9);
  doc.text(`Nº ${data.numero}`, W-margin-70, y+19);
  doc.setFont('helvetica','normal'); doc.setFontSize(8);
  doc.text(`Fecha: ${data.fecha}`, W-margin-70, y+25);
  if (data.vencimiento) doc.text(`Venc.: ${data.vencimiento}`, W-margin-70, y+31);

  y += 45;

  // Client block
  if (data.cliente) {
    fillR(doc, margin, y, contentW, 6, DARK);
    doc.setFont('helvetica','bold'); doc.setFontSize(7);
    doc.setTextColor(255,255,255);
    doc.text('DATOS DEL CLIENTE', margin+3, y+4.2);
    y += 6;
    fillR(doc, margin, y, contentW, 18, LIGHT);
    const [br,bg,bb] = hexToRgb(BORDER);
    doc.setDrawColor(br,bg,bb); doc.setLineWidth(0.3);
    doc.rect(margin, y, contentW, 18);
    doc.setFont('helvetica','bold'); doc.setFontSize(9);
    setRgb(doc, DARK);
    doc.text(data.cliente.nombre, margin+4, y+6);
    doc.setFont('helvetica','normal'); doc.setFontSize(7.5);
    setRgb(doc, GRAY);
    if (data.cliente.cifNif) doc.text(`CIF/NIF: ${data.cliente.cifNif}`, margin+4, y+11);
    if (data.cliente.direccion) doc.text(data.cliente.direccion, margin+4, y+15);
    if (data.cliente.email) doc.text(data.cliente.email, W/2, y+11);
    if (data.cliente.telefono) doc.text(data.cliente.telefono, W/2, y+15);
    y += 23;
  }

  if (data.metodoPago) {
    doc.setFont('helvetica','normal'); doc.setFontSize(7.5);
    setRgb(doc, GRAY);
    doc.text(`Método de pago: ${data.metodoPago}`, margin, y+4);
    y += 9;
  }

  // Lines table
  if (data.lineas && data.lineas.length > 0) {
    fillR(doc, margin, y, contentW, 7, DARK);
    doc.setFont('helvetica','bold'); doc.setFontSize(6.5);
    doc.setTextColor(255,255,255);
    doc.text('DESCRIPCIÓN', margin+3, y+4.8);
    doc.text('UDS', margin+78, y+4.8);
    doc.text('PRECIO', margin+92, y+4.8);
    doc.text('DTO%', margin+116, y+4.8);
    doc.text('IVA%', margin+134, y+4.8);
    doc.text('TOTAL', margin+152, y+4.8);
    y += 7;

    let subtotal = 0, totalIva = 0;

    data.lineas.forEach((l, i) => {
      const rowH = 9;
      fillR(doc, margin, y, contentW, rowH, i%2===0?'#FFFFFF':LIGHT);
      doc.setFont('helvetica','bold'); doc.setFontSize(7.5);
      setRgb(doc, DARK);
      doc.text((l.nombre||'—').slice(0,40), margin+3, y+5.5);
      if (l.descripcion) {
        doc.setFont('helvetica','normal'); doc.setFontSize(6.5);
        setRgb(doc, GRAY);
        doc.text(l.descripcion.slice(0,45), margin+3, y+8);
      }
      doc.setFont('helvetica','normal'); doc.setFontSize(7.5);
      setRgb(doc, DARK);
      doc.text(String(l.unidades), margin+78, y+5.5);
      doc.text(`${fmt(l.precio)} €`, margin+92, y+5.5);
      doc.text(`${l.descuento||0}%`, margin+116, y+5.5);
      doc.text(`${l.iva}%`, margin+134, y+5.5);
      doc.setFont('helvetica','bold');
      doc.text(`${fmt(l.total)} €`, margin+152, y+5.5);
      drawL(doc, margin, y+rowH, margin+contentW);
      y += rowH;
      const base = l.unidades * l.precio * (1-(l.descuento||0)/100);
      subtotal += base;
      totalIva += l.total - base;
    });

    y += 4;
    const tX = margin+100, tW = contentW-100, total = subtotal+totalIva;

    fillR(doc, tX, y, tW, 7, LIGHT);
    doc.setFont('helvetica','normal'); doc.setFontSize(8);
    setRgb(doc, GRAY); doc.text('Base imponible:', tX+3, y+5);
    setRgb(doc, DARK);
    const bs = `${fmt(subtotal)} €`;
    doc.text(bs, tX+tW-3-doc.getTextWidth(bs), y+5);
    y += 7;

    fillR(doc, tX, y, tW, 7, LIGHT);
    setRgb(doc, GRAY); doc.text('IVA total:', tX+3, y+5);
    setRgb(doc, DARK);
    const is = `${fmt(totalIva)} €`;
    doc.text(is, tX+tW-3-doc.getTextWidth(is), y+5);
    y += 7;

    fillR(doc, tX, y, tW, 10, CYAN);
    doc.setFont('helvetica','bold'); doc.setFontSize(10);
    setRgb(doc, DARK);
    doc.text('TOTAL:', tX+3, y+7);
    const ts = `${fmt(total)} €`;
    doc.text(ts, tX+tW-3-doc.getTextWidth(ts), y+7);
    y += 14;
  }

  // Cobros table
  if (data.cobros && data.cobros.length > 0) {
    fillR(doc, margin, y, contentW, 7, DARK);
    doc.setFont('helvetica','bold'); doc.setFontSize(6.5);
    doc.setTextColor(255,255,255);
    doc.text('FECHA', margin+3, y+4.8);
    doc.text('REFERENCIA', margin+38, y+4.8);
    doc.text('MÉTODO', margin+100, y+4.8);
    doc.text('IMPORTE', margin+150, y+4.8);
    y += 7;

    let totalC = 0;
    data.cobros.forEach((c,i) => {
      const rowH = 7;
      fillR(doc, margin, y, contentW, rowH, i%2===0?'#FFFFFF':LIGHT);
      doc.setFont('helvetica','normal'); doc.setFontSize(7.5);
      setRgb(doc, DARK);
      doc.text(String(c.fecha), margin+3, y+4.8);
      doc.text(c.ventaCodigo||`#${c.id}`, margin+38, y+4.8);
      doc.text(c.metodoPago, margin+100, y+4.8);
      doc.setFont('helvetica','bold');
      const cs = `${fmt(c.cantidad)} €`;
      doc.text(cs, margin+contentW-3-doc.getTextWidth(cs), y+4.8);
      drawL(doc, margin, y+rowH, margin+contentW);
      y += rowH;
      totalC += c.cantidad;
    });

    y += 4;
    const tX = margin+100, tW = contentW-100;
    fillR(doc, tX, y, tW, 10, CYAN);
    doc.setFont('helvetica','bold'); doc.setFontSize(10);
    setRgb(doc, DARK);
    doc.text('TOTAL COBRADO:', tX+3, y+7);
    const tcs = `${fmt(totalC)} €`;
    doc.text(tcs, tX+tW-3-doc.getTextWidth(tcs), y+7);
    y += 14;
  }

  // Notes
  if (data.notas) {
    y += 4;
    doc.setFont('helvetica','bold'); doc.setFontSize(7);
    setRgb(doc, GRAY);
    doc.text('NOTAS:', margin, y);
    y += 5;
    doc.setFont('helvetica','normal');
    doc.text(data.notas, margin, y);
  }

  // Footer
  drawL(doc, margin, 287, W-margin, BORDER);
  doc.setFont('helvetica','normal'); doc.setFontSize(6.5);
  setRgb(doc, GRAY);
  doc.text(`${empresa.nombre} · CIF: ${empresa.cif} · ${empresa.direccion}`, margin, 291);
  const fs = `Generado con BASEZERO SYSTEM · ${new Date().toLocaleDateString('es-ES')}`;
  doc.text(fs, W-margin-doc.getTextWidth(fs), 291);

  doc.save(`${data.tipo.toLowerCase()}_${data.numero}_${data.fecha}.pdf`);
}