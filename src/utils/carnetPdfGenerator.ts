import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { DelegateLookupResult, BIMUNSettings } from '../types';

export interface CarnetData {
  delegate: DelegateLookupResult['registration'];
  settings?: Partial<BIMUNSettings>;
}

/**
 * Generates an official, high-resolution digital badge (Carnet) in PDF format
 * for delegates participating in BIMUN.
 */
export async function generateDelegateCarnetPdf(data: CarnetData): Promise<void> {
  const { delegate, settings } = data;

  // Carnet standard conference badge dimensions in mm (Vertical 95mm x 145mm)
  const widthMm = 95;
  const heightMm = 145;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [widthMm, heightMm],
  });

  const bimunName = settings?.bimun_name || 'BIMUN';
  const bimunEdition = settings?.bimun_edition || '2026';
  const schoolName = settings?.institution_name || 'Colegio Bilingüe de Valledupar';
  const eventDates = settings?.event_date_display || '2026';

  // 1. Background base
  doc.setFillColor(248, 250, 252); // slate-50
  doc.rect(0, 0, widthMm, heightMm, 'F');

  // Double outer security border
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.4);
  doc.rect(3, 3, widthMm - 6, heightMm - 6);

  doc.setDrawColor(30, 58, 138); // blue-900
  doc.setLineWidth(0.6);
  doc.rect(4.2, 4.2, widthMm - 8.4, heightMm - 8.4);

  // 2. Top Header Banner (Deep Navy Gradient representation)
  doc.setFillColor(15, 23, 42); // slate-900 / navy
  doc.rect(4.5, 4.5, widthMm - 9, 32, 'F');

  // Gold accent line under header
  doc.setFillColor(217, 119, 6); // amber-600 gold
  doc.rect(4.5, 36.5, widthMm - 9, 1.8, 'F');

  // BIMUN Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(bimunName.toUpperCase(), widthMm / 2, 13, { align: 'center' });

  // Edition & Model subtitle
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(251, 191, 36); // amber-300
  doc.text(`${bimunEdition.toUpperCase()} • MODELO DE NACIONES UNIDAS`, widthMm / 2, 18, { align: 'center' });

  // Host institution
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(226, 232, 240); // slate-200
  doc.text(schoolName.toUpperCase(), widthMm / 2, 22.5, { align: 'center' });

  // Lanyard hole placeholder guide (aesthetic top notch)
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(widthMm / 2 - 6, 5, 12, 2.5, 1.2, 1.2, 'F');

  // Badge Category Pill (DELEGADO OFICIAL)
  doc.setFillColor(30, 58, 138); // blue-800
  doc.roundedRect(widthMm / 2 - 24, 27, 48, 7, 3.5, 3.5, 'F');
  doc.setDrawColor(245, 158, 11); // amber-500
  doc.setLineWidth(0.5);
  doc.roundedRect(widthMm / 2 - 24, 27, 48, 7, 3.5, 3.5, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('DELEGADO OFICIAL / OFFICIAL DELEGATE', widthMm / 2, 31.8, { align: 'center' });

  // 3. Delegate Identification Section
  let currentY = 44;

  // Delegate Name
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont('helvetica', 'bold');
  
  // Dynamic font sizing if name is very long
  const rawName = (delegate.full_name || 'DELEGADO').toUpperCase();
  const nameFontSize = rawName.length > 26 ? 10 : rawName.length > 20 ? 11.5 : 13;
  doc.setFontSize(nameFontSize);

  const splitName = doc.splitTextToSize(rawName, widthMm - 18);
  doc.text(splitName, widthMm / 2, currentY, { align: 'center' });
  currentY += splitName.length * 5.2;

  // Delegate School / Institution
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105); // slate-600
  const schoolText = (delegate.school || schoolName).toUpperCase();
  const splitSchool = doc.splitTextToSize(schoolText, widthMm - 20);
  doc.text(splitSchool, widthMm / 2, currentY, { align: 'center' });
  currentY += splitSchool.length * 3.8;

  // Grade / Delegation Type info
  const gradeLabel = delegate.grade ? `Grado: ${delegate.grade}` : '';
  const typeLabel = delegate.delegation_type === 'individual'
    ? 'Delegación Individual'
    : delegate.delegation_type === 'delegacion_colegial'
    ? 'Delegación Colegial'
    : 'Delegado';
  const subInfo = [gradeLabel, typeLabel].filter(Boolean).join(' • ');

  if (subInfo) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(subInfo, widthMm / 2, currentY, { align: 'center' });
    currentY += 4.5;
  } else {
    currentY += 2;
  }

  // 4. Official Assignment Card (Committee & Country)
  const boxX = 7;
  const boxWidth = widthMm - 14;
  const boxHeight = 29;
  const boxY = currentY;

  // Assignment Box Container
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 2, 2, 'S');

  // Decorative top bar of card
  doc.setFillColor(241, 245, 249);
  doc.rect(boxX + 0.3, boxY + 0.3, boxWidth - 0.6, 5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text('ASIGNACIÓN OFICIAL DE DIPLOMACIA', widthMm / 2, boxY + 3.8, { align: 'center' });

  // Committee details
  const comName = delegate.assigned_committee
    ? `${delegate.assigned_committee.name} (${delegate.assigned_committee.code || delegate.assigned_committee.abbreviation})`
    : 'POR ASIGNAR EN CONFERENCIA';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(30, 58, 138); // blue-900
  doc.text('COMITÉ / COMISIÓN:', boxX + 4, boxY + 9.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  const splitCom = doc.splitTextToSize(comName.toUpperCase(), boxWidth - 8);
  doc.text(splitCom, boxX + 4, boxY + 13.5);

  // Country details
  const cntryName = delegate.assigned_country
    ? `${delegate.assigned_country.name} ${delegate.assigned_country.flag_emoji || ''}`
    : 'POR CONFIRMAR';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(180, 83, 9); // amber-700
  doc.text('PAÍS O ROL REPRESENTADO:', boxX + 4, boxY + 19.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  const splitCntry = doc.splitTextToSize(cntryName.toUpperCase(), boxWidth - 8);
  doc.text(splitCntry, boxX + 4, boxY + 24.5);

  currentY = boxY + boxHeight + 4;

  // 5. QR Code and Verification Section
  const qrSizeMm = 24;
  const qrX = 9;
  const qrY = currentY;

  // Generate QR Code data
  const qrContent = JSON.stringify({
    event: 'BIMUN',
    edition: bimunEdition,
    id: delegate.id,
    delegate: delegate.full_name,
    school: delegate.school,
    committee: delegate.assigned_committee?.code || 'ASG',
    country: delegate.assigned_country?.name || 'ASG',
    status: delegate.status,
  });

  try {
    const qrDataUrl = await QRCode.toDataURL(qrContent, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 250,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });

    // Add white box for QR code
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(qrX - 1, qrY - 1, qrSizeMm + 2, qrSizeMm + 2, 1.5, 1.5, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.roundedRect(qrX - 1, qrY - 1, qrSizeMm + 2, qrSizeMm + 2, 1.5, 1.5, 'S');

    doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSizeMm, qrSizeMm);
  } catch (qrErr) {
    console.error('Error rendering QR code into PDF:', qrErr);
  }

  // QR Side Text (Verification & Security info)
  const sideX = qrX + qrSizeMm + 4;
  doc.setTextColor(30, 58, 138);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('CREDENCIAL DIGITAL SEGURA', sideX, qrY + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(71, 85, 105);
  doc.text('Escanee el código QR para validar', sideX, qrY + 8);
  doc.text('la autenticidad de la delegación en', sideX, qrY + 11.5);
  doc.text('el registro oficial de BIMUN.', sideX, qrY + 15);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`ID: ${delegate.id}`, sideX, qrY + 20);

  // Status Badge next to QR
  doc.setFillColor(220, 252, 231); // green-100
  doc.roundedRect(sideX, qrY + 22, 28, 4.2, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(21, 128, 61); // green-700
  doc.text('✓ INSCRIPCIÓN APROBADA', sideX + 14, qrY + 25, { align: 'center' });

  // 6. Footer (Event Date, Security code & Official note)
  doc.setFillColor(15, 23, 42);
  doc.rect(4.5, heightMm - 14, widthMm - 9, 9.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(251, 191, 36); // amber-300
  doc.text(`CONFERENCIA BIMUN • ${eventDates.toUpperCase()}`, widthMm / 2, heightMm - 9, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5);
  doc.setTextColor(203, 213, 225);
  doc.text('Portar esta credencial en todo momento durante las sesiones de debate.', widthMm / 2, heightMm - 6, { align: 'center' });

  // Save PDF
  const safeName = (delegate.full_name || 'Delegado')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .substring(0, 30);

  doc.save(`Carnet-BIMUN-${safeName}.pdf`);
}
