'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DailySession, AnesthesiaRecord, ANESTHESIA_DRUGS, POST_MEDS, AnesthesiaDrugCode, PostMedCode } from '@/types';
import { storage } from '@/lib/offline-storage';
import { Header } from '@/components/Header';
import { PdfPreviewModal } from '@/components/PdfPreviewModal';
import { SessionConfigModal } from '@/components/SessionConfigModal';
import {
  BarChart3,
  FileSpreadsheet,
  Dog,
  Cat,
  ShieldAlert,
  Download,
  Calendar,
  Pill,
  Activity,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export default function DashboardPage() {
  const [sessions, setSessions] = useState<DailySession[]>([]);
  const [activeSession, setActiveSession] = useState<DailySession | null>(null);
  const [records, setRecords] = useState<AnesthesiaRecord[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('all');
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  useEffect(() => {
    const loadedSessions = storage.getSessions();
    setSessions(loadedSessions);
    const activeId = storage.getActiveSessionId();
    const current = loadedSessions.find(s => s.id === activeId) || loadedSessions[0];
    if (current) {
      setActiveSession(current);
    }
    setRecords(storage.getRecords());
  }, []);

  // Filter records based on selected session ('all' or specific session_id)
  const displayedRecords = selectedSessionId === 'all'
    ? records
    : records.filter(r => r.session_id === selectedSessionId);

  // Totals
  const totalAnimals = displayedRecords.length;
  const canines = displayedRecords.filter(r => r.species === 'CAN');
  const felines = displayedRecords.filter(r => r.species === 'FEL');
  const males = displayedRecords.filter(r => r.sex === 'M');
  const females = displayedRecords.filter(r => r.sex === 'F');
  const orqProcedures = displayedRecords.filter(r => r.procedure_type === 'ORQ');
  const oshProcedures = displayedRecords.filter(r => r.procedure_type === 'OSH');
  const otherProcedures = displayedRecords.filter(r => r.procedure_type === 'OUTROS');
  const complications = displayedRecords.filter(r => r.has_complication);

  // Drugs tally
  const drugCounts: Record<AnesthesiaDrugCode, number> = {
    P: 0,
    I: 0,
    K: 0,
    X: 0,
    T: 0,
    VK: 0,
    TM: 0,
  };

  const postMedCounts: Record<PostMedCode, number> = {
    A: 0,
    M: 0,
    D: 0,
  };

  displayedRecords.forEach(rec => {
    rec.anesthesia_drugs.forEach(d => {
      if (drugCounts[d] !== undefined) drugCounts[d]++;
    });
    rec.post_meds.forEach(m => {
      if (postMedCounts[m] !== undefined) postMedCounts[m]++;
    });
  });

  // Export to CSV
  const handleExportCSV = () => {
    if (displayedRecords.length === 0) return;

    const headers = [
      'Ordem',
      'Data',
      'Microchip',
      'Nome',
      'Raça',
      'Espécie',
      'Sexo',
      'Peso (kg)',
      'Idade',
      'Procedimento',
      'Fármacos Anestésicos',
      'Outros Fármacos',
      'Pós-Operatório',
      'Teve Complicação',
      'Notas da Complicação',
      'Observações',
    ];

    const rows = displayedRecords.map(r => {
      const sess = sessions.find(s => s.id === r.session_id);
      return [
        r.order_index,
        sess?.session_date || '',
        `"${r.microchip || ''}"`,
        `"${r.patient_name || ''}"`,
        `"${r.breed || ''}"`,
        r.species,
        r.sex,
        r.weight_kg ?? '',
        `"${r.age || ''}"`,
        r.procedure_type,
        `"${r.anesthesia_drugs.join(', ')}"`,
        `"${r.anesthesia_others || ''}"`,
        `"${r.post_meds.join(', ')}"`,
        r.has_complication ? 'SIM' : 'NÃO',
        `"${r.complication_notes || ''}"`,
        `"${r.observations || ''}"`,
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Relatorio_Anestesico_ViCa_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!activeSession) return null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-16">
      {/* Header */}
      <Header
        session={activeSession}
        recordCount={records.length}
        onOpenVoiceModal={() => {}}
        onOpenManualModal={() => {}}
        onOpenPdfModal={() => setIsPdfModalOpen(true)}
        onOpenConfigModal={() => setIsConfigModalOpen(true)}
        currentView="dashboard"
      />

      <main className="max-w-6xl mx-auto px-3 sm:px-6 py-6 w-full flex-1 space-y-6">
        
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              title="Voltar para a Ficha"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h2 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-vica-teal" />
                Painel Analítico e Métricas Cirúrgicas
              </h2>
              <p className="text-xs text-slate-500">
                Auditoria de volume, consumo de fármacos e intercorrências
              </p>
            </div>
          </div>

          {/* Session filter & CSV Export */}
          <div className="flex items-center gap-2">
            <select
              value={selectedSessionId}
              onChange={e => setSelectedSessionId(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-vica-teal focus:outline-none"
            >
              <option value="all">Todas as Sessões ({sessions.length})</option>
              {sessions.map(s => (
                <option key={s.id} value={s.id}>
                  {s.session_date} — {s.location}
                </option>
              ))}
            </select>

            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Excel (CSV)</span>
            </button>
          </div>
        </div>

        {/* Big Numbers Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          
          {/* Total */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <div className="text-xs font-semibold text-slate-500">Total de Animais</div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {totalAnimals}
            </div>
            <div className="text-[11px] text-slate-400">
              {sessions.length} {sessions.length === 1 ? 'dia cirúrgico' : 'dias cirúrgicos'}
            </div>
          </div>

          {/* Cães vs Gatos */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <div className="text-xs font-semibold text-slate-500">Por Espécie</div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                🐶 {canines.length}
              </span>
              <span className="text-slate-300">/</span>
              <span className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400">
                🐱 {felines.length}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              {canines.length} caninos • {felines.length} felinos
            </div>
          </div>

          {/* OSH vs ORQ */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <div className="text-xs font-semibold text-slate-500">Procedimentos</div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-bold text-pink-600 dark:text-pink-400">
                ♀ {oshProcedures.length}
              </span>
              <span className="text-slate-300">/</span>
              <span className="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                ♂ {orqProcedures.length}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              {oshProcedures.length} OSH • {orqProcedures.length} ORQ {otherProcedures.length > 0 && `• ${otherProcedures.length} outros`}
            </div>
          </div>

          {/* Intercorrências */}
          <div className={`p-4 rounded-2xl border shadow-sm space-y-1 ${
            complications.length > 0
              ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}>
            <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
              <span>Intercorrências</span>
              {complications.length > 0 && <ShieldAlert className="w-4 h-4 text-rose-600" />}
            </div>
            <div className={`text-2xl sm:text-3xl font-extrabold ${
              complications.length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
            }`}>
              {complications.length}
            </div>
            <div className="text-[11px] text-slate-400">
              {totalAnimals > 0 ? `${((complications.length / totalAnimals) * 100).toFixed(1)}% do total` : '0%'}
            </div>
          </div>

        </div>

        {/* Drug Consumption Section */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Pill className="w-4 h-4 text-vica-teal" />
              Consumo Total de Fármacos Anestésicos e Pós-Operatórios
            </h3>
            <span className="text-xs text-slate-400 font-medium">Contagem exata de aplicações</span>
          </div>

          {/* Anesthesia Drugs Grid */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Anestesia & Fármacos Adjuvantes
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
              {(Object.keys(drugCounts) as AnesthesiaDrugCode[]).map(code => {
                const drug = ANESTHESIA_DRUGS[code];
                const count = drugCounts[code];
                const percent = totalAnimals > 0 ? Math.round((count / totalAnimals) * 100) : 0;
                return (
                  <div
                    key={code}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 dark:text-white">[{code}] {drug.shortName}</span>
                      <span className="text-[11px] font-semibold text-slate-400">{percent}%</span>
                    </div>
                    <div className="text-lg font-black text-vica-teal">{count} <span className="text-xs font-normal text-slate-500">animais</span></div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-vica-teal h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Post Meds Grid */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Medicação Pós-Operatória
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {(Object.keys(postMedCounts) as PostMedCode[]).map(code => {
                const med = POST_MEDS[code];
                const count = postMedCounts[code];
                const percent = totalAnimals > 0 ? Math.round((count / totalAnimals) * 100) : 0;
                return (
                  <div
                    key={code}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white">
                        [{code}] {med.name}
                      </div>
                      <div className="text-[11px] text-slate-400">{percent}% dos pacientes</div>
                    </div>
                    <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                      {count}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Complications Audit Table */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              Auditoria de Intercorrências Cirúrgicas
            </h3>
            <span className="text-xs font-bold text-rose-600">
              {complications.length} {complications.length === 1 ? 'registro' : 'registros'}
            </span>
          </div>

          {complications.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
              Nenhuma intercorrência registrada no período selecionado. Cirurgias 100% estáveis!
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {complications.map(rec => (
                <div key={rec.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-start gap-2.5">
                    <span className="px-2 py-0.5 rounded-lg bg-slate-900 text-white font-bold text-[11px]">
                      #{rec.order_index}
                    </span>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        {rec.patient_name} ({rec.species} - {rec.breed}) • {rec.weight_kg} kg
                      </div>
                      <div className="text-rose-700 dark:text-rose-300 font-semibold mt-0.5">
                        ⚠️ {rec.complication_notes || 'Intercorrência sem notas adicionais'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                    <span>Procedimento: <strong>{rec.procedure_type}</strong></span>
                    <span>•</span>
                    <span>Fármacos: <strong>{rec.anesthesia_drugs.join(', ')}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>

      {/* PDF & Config Modals */}
      <PdfPreviewModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        session={activeSession}
        records={displayedRecords}
      />

      <SessionConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        sessions={sessions}
        activeSession={activeSession}
        onSelectSession={id => {
          setSelectedSessionId(id);
          const s = sessions.find(item => item.id === id);
          if (s) setActiveSession(s);
        }}
        onCreateSession={() => {}}
        onUpdateSession={() => {}}
      />
    </div>
  );
}
