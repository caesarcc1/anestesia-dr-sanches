import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DailySession, AnesthesiaRecord } from '@/types';

interface GeneratePdfOptions {
  session: DailySession;
  records: AnesthesiaRecord[];
}

export function generateViCaPdf({ session, records }: GeneratePdfOptions): jsPDF {
  // A4 Landscape layout for optimal tabular fit matching the physical sheet
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const RECORDS_PER_PAGE = 8;
  const totalPages = Math.max(1, Math.ceil(records.length / RECORDS_PER_PAGE));
  const startPageNumber = session.page_start_number || 202;

  // Format Brazilian date DD/MM/YYYY
  const [year, month, day] = session.session_date.split('-');
  const formattedDate = `${day}/${month}/${year}`;

  for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
    if (pageIdx > 0) {
      doc.addPage('a4', 'landscape');
    }

    const currentPageNum = startPageNumber + pageIdx;
    const pageRecords = records.slice(pageIdx * RECORDS_PER_PAGE, (pageIdx + 1) * RECORDS_PER_PAGE);

    // Header styling
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Planilha1', 14, 10);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Centro Cirúrgico Adote Vi.Ca', 148.5, 12, { align: 'center' });

    doc.setFontSize(10);
    doc.text('Controle de animais castrados', 14, 18);

    doc.setFont('helvetica', 'normal');
    doc.text(`Data: ${formattedDate}`, 200, 18);
    doc.setFont('helvetica', 'bold');
    doc.text(`Pag: ${currentPageNum}`, 250, 18);

    // Build 8 animal blocks (each block has 2 rows: data row + observations row)
    const tableBody: any[] = [];

    for (let i = 0; i < RECORDS_PER_PAGE; i++) {
      const rec = pageRecords[i];

      if (rec) {
        // Format Species
        const canMark = rec.species === 'CAN' ? '[CAN]' : '(CAN)';
        const felMark = rec.species === 'FEL' ? '[FEL]' : '(FEL)';
        const speciesCol = `${canMark} ${felMark}`;

        // Format Sex
        const mMark = rec.sex === 'M' ? '[M]' : '(M)';
        const fMark = rec.sex === 'F' ? '[F]' : '(F)';
        const sexCol = `${mMark} ${fMark}`;

        // Format Weight & Age
        const weightCol = rec.weight_kg !== null && rec.weight_kg !== undefined ? `${rec.weight_kg} kg` : '-';
        const ageCol = rec.age || '-';

        // Format Name + Breed
        const nameBreedCol = rec.patient_name
          ? `${rec.patient_name}${rec.breed ? ` (${rec.breed})` : ''}`
          : (rec.breed || '-');

        // Format Anesthesia Drugs
        const drugsList = ['P', 'I', 'K', 'X', 'T', 'VK', 'TM'];
        const drugsFormatted = drugsList
          .map(d => (rec.anesthesia_drugs.includes(d as any) ? `[${d}]` : `(${d})`))
          .join(' ');

        // Format Post Meds
        const postList = ['A', 'M', 'D'];
        const postFormatted = postList
          .map(m => (rec.post_meds.includes(m as any) ? `[${m}]` : `(${m})`))
          .join(' ');

        // Format Procedure
        let procFormatted = '(1) (2) (3)';
        if (rec.procedure_type === 'ORQ') procFormatted = '[1] (2) (3)';
        else if (rec.procedure_type === 'OSH') procFormatted = '(1) [2] (3)';
        else if (rec.procedure_type === 'OUTROS') procFormatted = '(1) (2) [3]';

        // Row 1: Dados do animal
        tableBody.push([
          { content: rec.microchip || `Nº ${rec.order_index}`, styles: { fontStyle: 'bold' } },
          { content: speciesCol, styles: { halign: 'center' } },
          { content: sexCol, styles: { halign: 'center' } },
          { content: weightCol, styles: { halign: 'center' } },
          { content: ageCol, styles: { halign: 'center' } },
          { content: nameBreedCol, styles: { fontStyle: 'bold' } },
          { content: drugsFormatted, styles: { halign: 'center', fontSize: 7 } },
          { content: rec.anesthesia_others || '-', styles: { fontSize: 7 } },
          { content: postFormatted, styles: { halign: 'center', fontSize: 7 } },
          { content: procFormatted, styles: { halign: 'center', fontStyle: 'bold' } },
        ]);

        // Row 2: Observações / Intercorrências
        let obsText = 'Observações: ';
        if (rec.has_complication && rec.complication_notes) {
          obsText += `[INTERCORRÊNCIA: ${rec.complication_notes}] `;
        }
        if (rec.observations) {
          obsText += rec.observations;
        }
        if (!rec.observations && !rec.has_complication) {
          obsText += 'Sem intercorrências registradas.';
        }

        tableBody.push([
          {
            content: obsText,
            colSpan: 10,
            styles: {
              fontStyle: rec.has_complication ? 'bold' : 'normal',
              textColor: rec.has_complication ? [180, 20, 20] : [70, 70, 70],
              fontSize: 7.5,
              fillColor: rec.has_complication ? [254, 242, 242] : [255, 255, 255],
            },
          },
        ]);
      } else {
        // Blank row for printing / filling if under 8 records
        tableBody.push([
          { content: '' },
          { content: '(CAN) (FEL)', styles: { halign: 'center', textColor: [160, 160, 160] } },
          { content: '(M) (F)', styles: { halign: 'center', textColor: [160, 160, 160] } },
          { content: '' },
          { content: '' },
          { content: '' },
          { content: '(P) (I) (K) (X) (T) (VK) (TM)', styles: { halign: 'center', fontSize: 7, textColor: [160, 160, 160] } },
          { content: '' },
          { content: '(A) (M) (D)', styles: { halign: 'center', fontSize: 7, textColor: [160, 160, 160] } },
          { content: '(1) (2) (3)', styles: { halign: 'center', textColor: [160, 160, 160] } },
        ]);
        tableBody.push([
          { content: 'Observações: ', colSpan: 10, styles: { fontSize: 7.5, textColor: [180, 180, 180] } },
        ]);
      }
    }

    // Render Table
    autoTable(doc, {
      startY: 22,
      head: [
        [
          'Microchip',
          'Espécie\n(CAN) (FEL)',
          'Sexo\n(M) (F)',
          'Peso (kg)',
          'Idade',
          'Nome / Raça',
          'Anestesia\n(P)(I)(K)(X)(T)(VK)(TM)',
          'Outros',
          'Med Pós\n(A)(M)(D)',
          'Procedimento\n(1)(2)(3)',
        ],
      ],
      body: tableBody,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 1.2,
        lineColor: [0, 0, 0],
        lineWidth: 0.2,
        textColor: [0, 0, 0],
        valign: 'middle',
      },
      headStyles: {
        fillColor: [245, 245, 245],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'center',
        lineWidth: 0.3,
        lineColor: [0, 0, 0],
        fontSize: 7.5,
      },
      columnStyles: {
        0: { cellWidth: 32 }, // Microchip
        1: { cellWidth: 24, halign: 'center' }, // Espécie
        2: { cellWidth: 18, halign: 'center' }, // Sexo
        3: { cellWidth: 18, halign: 'center' }, // Peso
        4: { cellWidth: 18, halign: 'center' }, // Idade
        5: { cellWidth: 38 }, // Nome / Raça
        6: { cellWidth: 50, halign: 'center' }, // Anestesia
        7: { cellWidth: 26 }, // Outros
        8: { cellWidth: 22, halign: 'center' }, // Med Pós
        9: { cellWidth: 24, halign: 'center' }, // Procedimento
      },
      margin: { left: 14, right: 14 },
    });

    // Footer - Legenda e Assinatura
    const finalY = 186;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    const legend1 = 'Legenda: P-propofol  I-Isoflurano  K-Quetamina  X-Xilazina  TM-Transamin  VK-Vitamina K  T-Tramadol  A-Agemoxi  M-Meloxicam  D-Dipirona  1-ORQ  2-OSH  3-Outros';
    doc.text(legend1, 14, finalY);

    doc.setFont('helvetica', 'bold');
    doc.text(`Assinatura Vet: ${session.vet_name || 'Dr. Daniel Sanches'} (${session.vet_crmv || 'CRMV-SP'}) ________________________`, 14, finalY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Página ${pageIdx + 1} de ${totalPages}`, 148.5, finalY + 12, { align: 'center' });
  }

  return doc;
}

export async function shareViCaPdfViaWhatsApp(session: DailySession, records: AnesthesiaRecord[]) {
  const doc = generateViCaPdf({ session, records });
  const pdfBlob = doc.output('blob');
  const filename = `Ficha_Castracao_ViCa_${session.session_date}_Pag${session.page_start_number}.pdf`;
  const file = new File([pdfBlob], filename, { type: 'application/pdf' });

  // Web Share API (Mobile native share to WhatsApp)
  if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: `Ficha Anestésica Adote Vi.Ca - ${session.session_date}`,
        text: `Ficha de controle de castração do Centro Cirúrgico Adote Vi.Ca (${session.session_date}) - Dr. Daniel Sanches. Total: ${records.length} animais.`,
      });
      return { success: true, method: 'share' };
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Erro no navigator.share:', err);
      }
    }
  }

  // Fallback: Download file directly and open WhatsApp Web/App
  const fileUrl = URL.createObjectURL(pdfBlob);
  const downloadLink = document.createElement('a');
  downloadLink.href = fileUrl;
  downloadLink.download = filename;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);

  const whatsappMessage = encodeURIComponent(
    `📋 *Centro Cirúrgico Adote Vi.Ca - Ficha Anestésica*\n` +
    `📅 Data: ${session.session_date}\n` +
    `👨‍⚕️ Veterinário: ${session.vet_name}\n` +
    `🐾 Total de animais operados: ${records.length}\n` +
    `📄 O PDF (${filename}) foi baixado no seu dispositivo para envio neste chat.`
  );

  window.open(`https://api.whatsapp.com/send?text=${whatsappMessage}`, '_blank');
  return { success: true, method: 'download_and_whatsapp' };
}
