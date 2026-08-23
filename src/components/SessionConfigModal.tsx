'use client';

import React, { useState } from 'react';
import { DailySession } from '@/types';
import { X, Check, Calendar, Plus, MapPin, User, FileText } from 'lucide-react';

interface SessionConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: DailySession[];
  activeSession: DailySession;
  onSelectSession: (id: string) => void;
  onCreateSession: (session: Omit<DailySession, 'id' | 'created_at'>) => void;
  onUpdateSession: (session: DailySession) => void;
}

export function SessionConfigModal({
  isOpen,
  onClose,
  sessions,
  activeSession,
  onSelectSession,
  onCreateSession,
  onUpdateSession,
}: SessionConfigModalProps) {
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [date, setDate] = useState(activeSession.session_date);
  const [pageStart, setPageStart] = useState(activeSession.page_start_number);
  const [location, setLocation] = useState(activeSession.location);
  const [vetName, setVetName] = useState(activeSession.vet_name);
  const [vetCrmv, setVetCrmv] = useState(activeSession.vet_crmv);

  if (!isOpen) return null;

  const handleSaveCurrent = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreatingNew) {
      onCreateSession({
        session_date: date,
        page_start_number: Number(pageStart) || 202,
        location: location.trim() || 'Centro Cirúrgico Adote Vi.Ca',
        vet_name: vetName.trim() || 'Dr. Daniel Sanches',
        vet_crmv: vetCrmv.trim() || 'CRMV-SP',
        is_closed: false,
      });
    } else {
      onUpdateSession({
        ...activeSession,
        session_date: date,
        page_start_number: Number(pageStart) || 202,
        location: location.trim() || 'Centro Cirúrgico Adote Vi.Ca',
        vet_name: vetName.trim() || 'Dr. Daniel Sanches',
        vet_crmv: vetCrmv.trim() || 'CRMV-SP',
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div>
            <h2 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
              Configurações da Sessão Cirúrgica
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Controle de datas, numeração de páginas e dados da clínica
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs sm:text-sm">
          
          {/* Switch Session selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Sessão Ativa
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingNew(true);
                  setDate(new Date().toISOString().split('T')[0]);
                  setPageStart(202);
                }}
                className="text-xs font-bold text-vica-teal hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Nova Sessão / Outro Dia
              </button>
            </div>
            <select
              value={activeSession.id}
              onChange={e => {
                setIsCreatingNew(false);
                onSelectSession(e.target.value);
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-vica-teal focus:outline-none"
            >
              {sessions.map(s => (
                <option key={s.id} value={s.id}>
                  {s.session_date} — {s.location} (Pág. {s.page_start_number})
                </option>
              ))}
            </select>
          </div>

          {/* Form */}
          <form id="session-form" onSubmit={handleSaveCurrent} className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Data da Cirurgia
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-vica-teal focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" /> Número da Página Inicial na Prancheta
              </label>
              <input
                type="number"
                value={pageStart}
                onChange={e => setPageStart(parseInt(e.target.value) || 202)}
                required
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-vica-teal focus:outline-none font-bold"
              />
              <p className="text-[11px] text-slate-400 mt-1">Ex: 202, 203, 204... para continuar a numeração física das fichas.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> Nome do Local / Centro Cirúrgico
              </label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-vica-teal focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" /> Anestesista
                </label>
                <input
                  type="text"
                  value={vetName}
                  onChange={e => setVetName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-vica-teal focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  CRMV
                </label>
                <input
                  type="text"
                  value={vetCrmv}
                  onChange={e => setVetCrmv(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-vica-teal focus:outline-none"
                />
              </div>
            </div>
          </form>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="session-form"
            className="px-5 py-2 text-xs font-bold bg-vica-teal hover:bg-emerald-600 text-white rounded-xl shadow-md transition-transform active:scale-95 flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            {isCreatingNew ? 'Criar Nova Sessão' : 'Salvar Configuração'}
          </button>
        </div>
      </div>
    </div>
  );
}
