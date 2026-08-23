'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { DailySession } from '@/types';
import { Calendar, FileSpreadsheet, BarChart3, Settings, Sparkles, Plus, Share2, ChevronLeft, ChevronRight } from 'lucide-react';

interface HeaderProps {
  session: DailySession;
  recordCount: number;
  onOpenVoiceModal: () => void;
  onOpenManualModal: () => void;
  onOpenPdfModal: () => void;
  onOpenConfigModal: () => void;
  onNavigateDay?: (offset: number) => void;
  onGoToToday?: () => void;
  currentView?: 'records' | 'dashboard';
}

export function Header({
  session,
  recordCount,
  onOpenVoiceModal,
  onOpenManualModal,
  onOpenPdfModal,
  onOpenConfigModal,
  onNavigateDay,
  onGoToToday,
  currentView = 'records',
}: HeaderProps) {
  const [year, month, day] = session.session_date.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const now = new Date();
  const isToday = now.getFullYear() === year && (now.getMonth() + 1) === month && now.getDate() === day;
  const weekdayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const weekday = weekdayNames[dateObj.getDay()] || '';
  const formattedDate = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm safe-top">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2">
        <div className="flex items-center justify-between gap-2">
          
          {/* Logo & Clinic Information */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden shadow-inner border border-slate-200 dark:border-slate-700 bg-white flex-shrink-0">
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
                <h1 className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
                  Adote Vi.Ca
                  <span className="text-[11px] px-1.5 py-0.2 rounded-full font-semibold bg-vica-teal/15 text-vica-teal border border-vica-teal/30">
                    Anestesia
                  </span>
                </h1>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                <span>{session.vet_name}</span>
                <span className="text-slate-300 dark:text-slate-700 mx-1">•</span>
                <span>Pág. {session.page_start_number}</span>
              </p>
            </div>
          </div>

          {/* Center: Day Switcher Navigation with Arrows */}
          <div className="flex items-center gap-1">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-0.5 shadow-xs">
              <button
                onClick={() => onNavigateDay && onNavigateDay(-1)}
                className="p-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors"
                title="Dia Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenConfigModal}
                className="px-2 py-0.5 text-xs font-bold text-slate-800 dark:text-slate-100 hover:text-vica-teal flex items-center gap-1"
                title="Configurar data da sessão"
              >
                <Calendar className="w-3.5 h-3.5 text-vica-teal flex-shrink-0" />
                <span className="hidden xs:inline">{weekday},</span>
                <span>{day.toString().padStart(2, '0')}/{month.toString().padStart(2, '0')}</span>
                {isToday && (
                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-emerald-500 text-white ml-0.5">
                    Hoje
                  </span>
                )}
              </button>

              <button
                onClick={() => onNavigateDay && onNavigateDay(1)}
                className="p-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors"
                title="Próximo Dia"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {!isToday && onGoToToday && (
              <button
                onClick={onGoToToday}
                className="hidden sm:inline-flex px-2 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 transition-colors"
              >
                Ir p/ Hoje
              </button>
            )}
          </div>

          {/* Quick Navigation & Action Bar */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Toggle view between Records and Dashboard */}
            {currentView === 'records' ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                title="Ver Dashboard e Estatísticas"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Métricas</span>
              </Link>
            ) : (
              <Link
                href="/"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
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
              <span className="hidden md:inline">PDF / WhatsApp</span>
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
