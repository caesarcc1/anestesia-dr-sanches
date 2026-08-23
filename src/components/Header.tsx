'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { DailySession } from '@/types';
import { Calendar, FileSpreadsheet, BarChart3, Settings, Sparkles, Plus, Share2 } from 'lucide-react';

interface HeaderProps {
  session: DailySession;
  recordCount: number;
  onOpenVoiceModal: () => void;
  onOpenManualModal: () => void;
  onOpenPdfModal: () => void;
  onOpenConfigModal: () => void;
  currentView?: 'records' | 'dashboard';
}

export function Header({
  session,
  recordCount,
  onOpenVoiceModal,
  onOpenManualModal,
  onOpenPdfModal,
  onOpenConfigModal,
  currentView = 'records',
}: HeaderProps) {
  const [year, month, day] = session.session_date.split('-');
  const formattedDate = `${day}/${month}/${year}`;

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm safe-top">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2.5">
        <div className="flex items-center justify-between gap-2">
          {/* Logo & Clinic Information */}
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-xl overflow-hidden shadow-inner border border-slate-200 dark:border-slate-700 bg-white flex-shrink-0">
              <Image
                src="/logo-vica.png"
                alt="Adote Vi.Ca Logo"
                fill
                className="object-contain p-1"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
                  Adote Vi.Ca
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-vica-teal/15 text-vica-teal border border-vica-teal/30">
                    Anestesia
                  </span>
                </h1>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 truncate">
                <span>{session.vet_name}</span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <button
                  onClick={onOpenConfigModal}
                  className="hover:underline text-vica-blue font-medium flex items-center gap-0.5"
                  title="Configurar sessão"
                >
                  <Calendar className="w-3 h-3 inline" /> {formattedDate} (Pág. {session.page_start_number})
                </button>
              </p>
            </div>
          </div>

          {/* Quick Navigation & Action Bar */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Toggle view between Records and Dashboard */}
            {currentView === 'records' ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                title="Ver Dashboard e Estatísticas"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Métricas</span>
              </Link>
            ) : (
              <Link
                href="/"
                className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                title="Voltar para a Ficha Cirúrgica"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ficha</span>
              </Link>
            )}

            {/* PDF & WhatsApp Button */}
            <button
              onClick={onOpenPdfModal}
              className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-transform active:scale-95"
              title="Gerar PDF Oficial e Compartilhar no WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">PDF / WhatsApp</span>
            </button>

            {/* Settings button */}
            <button
              onClick={onOpenConfigModal}
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="Configurações da Sessão"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
