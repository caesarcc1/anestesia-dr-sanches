'use client';

import React, { useState } from 'react';
import { DailySession, AnesthesiaRecord } from '@/types';
import { generateViCaPdf, shareViCaPdfViaWhatsApp } from '@/lib/pdf-generator';
import { X, Share2, Download, Printer, FileText, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: DailySession;
  records: AnesthesiaRecord[];
}

export function PdfPreviewModal({
  isOpen,
  onClose,
  session,
  records,
}: PdfPreviewModalProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalPages = Math.max(1, Math.ceil(records.length / 8));
  const startPage = session.page_start_number || 202;

  const handleShareWhatsApp = async () => {
    setIsSharing(true);
    setShareFeedback(null);
    try {
      const result = await shareViCaPdfViaWhatsApp(session, records);
      if (result.method === 'share') {
        setShareFeedback('Ficha enviada através do menu de compartilhamento!');
      } else {
        setShareFeedback('PDF baixado e WhatsApp aberto para envio!');
      }
    } catch (err: any) {
      setShareFeedback('Erro ao compartilhar. Tente baixar o arquivo diretamente.');
    } finally {
      setIsSharing(false);
    }
  };

  const handleDownloadPdf = () => {
    const doc = generateViCaPdf({ session, records });
    const filename = `Ficha_Castracao_ViCa_${session.session_date}_Pag${session.page_start_number}.pdf`;
    doc.save(filename);
  };

  const handlePrintPdf = () => {
    const doc = generateViCaPdf({ session, records });
    doc.autoPrint();
    const pdfBlob = doc.output('bloburl');
    window.open(pdfBlob.toString(), '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                Ficha Oficial Adote Vi.Ca
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                PDF formatado no padrão físico (8 por página)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs sm:text-sm">
          
          {/* Summary Box */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 dark:text-slate-400">Local:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{session.location}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 dark:text-slate-400">Data da Cirurgia:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{session.session_date}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 dark:text-slate-400">Veterinário Responsável:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{session.vet_name} ({session.vet_crmv})</span>
            </div>
            <div className="flex justify-between items-center text-xs border-t border-slate-200 dark:border-slate-700 pt-2">
              <span className="text-slate-500 dark:text-slate-400">Total de Animais / Páginas:</span>
              <span className="font-bold text-vica-teal text-sm">
                {records.length} animais ({totalPages} {totalPages === 1 ? 'página' : 'páginas'} • Pág. {startPage} a {startPage + totalPages - 1})
              </span>
            </div>
          </div>

          {/* Feedback message */}
          {shareFeedback && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{shareFeedback}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2.5 pt-2">
            {/* WhatsApp Big Green Button */}
            <button
              onClick={handleShareWhatsApp}
              disabled={isSharing}
              className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              <Share2 className="w-5 h-5" />
              {isSharing ? 'Preparando arquivo...' : 'Enviar Ficha Completa pelo WhatsApp'}
            </button>

            {/* Direct Download button */}
            <button
              onClick={handleDownloadPdf}
              className="w-full py-3 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all"
            >
              <Download className="w-4 h-4 text-slate-500" />
              Baixar Arquivo PDF (A4 Paisagem)
            </button>

            {/* Print button */}
            <button
              onClick={handlePrintPdf}
              className="w-full py-2.5 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-medium text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Printer className="w-4 h-4" />
              Imprimir Ficha
            </button>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
