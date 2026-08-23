'use client';

import React, { useState, useEffect } from 'react';
import { DailySession, AnesthesiaRecord, ParsedVoiceResult, AnesthesiaDrugCode, PostMedCode } from '@/types';
import { storage } from '@/lib/offline-storage';
import { Header } from '@/components/Header';
import { DailySummaryBar } from '@/components/DailySummaryBar';
import { RecordCard } from '@/components/RecordCard';
import { VoiceRecorderModal } from '@/components/VoiceRecorderModal';
import { RecordFormModal } from '@/components/RecordFormModal';
import { PdfPreviewModal } from '@/components/PdfPreviewModal';
import { SessionConfigModal } from '@/components/SessionConfigModal';
import { Mic, Plus, FileSpreadsheet, Sparkles, Share2, AlertCircle, FileText } from 'lucide-react';

export default function HomePage() {
  const [sessions, setSessions] = useState<DailySession[]>([]);
  const [activeSession, setActiveSession] = useState<DailySession | null>(null);
  const [records, setRecords] = useState<AnesthesiaRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Modals state
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AnesthesiaRecord | null>(null);

  // Load from local storage / Supabase on mount
  useEffect(() => {
    const loadedSessions = storage.getSessions();
    setSessions(loadedSessions);
    const activeId = storage.getActiveSessionId();
    const current = loadedSessions.find(s => s.id === activeId) || loadedSessions[0];
    if (current) {
      setActiveSession(current);
      setRecords(storage.getRecords(current.id));
    }
  }, []);

  const reloadRecords = (sessionId?: string) => {
    const sid = sessionId || activeSession?.id;
    if (sid) {
      setRecords(storage.getRecords(sid));
    }
  };

  const handleSelectSession = (sessionId: string) => {
    storage.setActiveSessionId(sessionId);
    const current = sessions.find(s => s.id === sessionId);
    if (current) {
      setActiveSession(current);
      setRecords(storage.getRecords(sessionId));
    }
  };

  const handleCreateSession = (newSessionData: Omit<DailySession, 'id' | 'created_at'>) => {
    const created = storage.createSession(newSessionData);
    const updatedSessions = storage.getSessions();
    setSessions(updatedSessions);
    setActiveSession(created);
    setRecords([]);
  };

  const handleUpdateSession = (updated: DailySession) => {
    const all = storage.getSessions().map(s => (s.id === updated.id ? updated : s));
    storage.saveSessions(all);
    setSessions(all);
    setActiveSession(updated);
  };

  // Add parsed voice record to active session
  const handleConfirmVoiceRecord = (parsed: ParsedVoiceResult) => {
    if (!activeSession) return;

    storage.addRecord({
      session_id: activeSession.id,
      patient_name: parsed.patient_name || 'Paciente',
      breed: parsed.breed || 'SRD',
      species: parsed.species || 'CAN',
      sex: parsed.sex || 'M',
      weight_kg: parsed.weight_kg ?? null,
      age: parsed.age || '',
      microchip: parsed.microchip || '',
      procedure_type: parsed.procedure_type || 'ORQ',
      procedure_other_desc: parsed.procedure_other_desc || '',
      anesthesia_drugs: parsed.anesthesia_drugs || ['P', 'K'],
      anesthesia_others: parsed.anesthesia_others || '',
      post_meds: parsed.post_meds || ['M', 'D'],
      has_complication: parsed.has_complication || false,
      complication_notes: parsed.complication_notes || '',
      observations: parsed.observations || '',
    });

    reloadRecords();
  };

  const handleSaveManualRecord = (data: Partial<AnesthesiaRecord>) => {
    if (!activeSession) return;

    if (editingRecord) {
      storage.updateRecord({
        ...editingRecord,
        ...data,
      } as AnesthesiaRecord);
      setEditingRecord(null);
    } else {
      storage.addRecord({
        session_id: activeSession.id,
        patient_name: data.patient_name || 'Paciente',
        breed: data.breed || 'SRD',
        species: data.species || 'CAN',
        sex: data.sex || 'M',
        weight_kg: data.weight_kg ?? null,
        age: data.age || '',
        microchip: data.microchip || '',
        procedure_type: data.procedure_type || 'ORQ',
        procedure_other_desc: data.procedure_other_desc || '',
        anesthesia_drugs: data.anesthesia_drugs || ['P', 'K'],
        anesthesia_others: data.anesthesia_others || '',
        post_meds: data.post_meds || ['M', 'D'],
        has_complication: data.has_complication || false,
        complication_notes: data.complication_notes || '',
        observations: data.observations || '',
      });
    }

    reloadRecords();
  };

  const handleDeleteRecord = (id: string) => {
    if (window.confirm('Tem certeza que deseja remover este animal da ficha?')) {
      storage.deleteRecord(id);
      reloadRecords();
    }
  };

  const handleToggleDrug = (record: AnesthesiaRecord, code: AnesthesiaDrugCode) => {
    const isSelected = record.anesthesia_drugs.includes(code);
    const updatedDrugs = isSelected
      ? record.anesthesia_drugs.filter(c => c !== code)
      : [...record.anesthesia_drugs, code];

    storage.updateRecord({
      ...record,
      anesthesia_drugs: updatedDrugs,
    });
    reloadRecords();
  };

  const handleTogglePostMed = (record: AnesthesiaRecord, code: PostMedCode) => {
    const isSelected = record.post_meds.includes(code);
    const updatedPost = isSelected
      ? record.post_meds.filter(c => c !== code)
      : [...record.post_meds, code];

    storage.updateRecord({
      ...record,
      post_meds: updatedPost,
    });
    reloadRecords();
  };

  // Filter and search records
  const filteredRecords = records.filter(rec => {
    // Category filter
    if (selectedFilter === 'CAN' && rec.species !== 'CAN') return false;
    if (selectedFilter === 'FEL' && rec.species !== 'FEL') return false;
    if (selectedFilter === 'OSH' && rec.procedure_type !== 'OSH') return false;
    if (selectedFilter === 'ORQ' && rec.procedure_type !== 'ORQ') return false;
    if (selectedFilter === 'complication' && !rec.has_complication) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = rec.patient_name?.toLowerCase().includes(q);
      const matchBreed = rec.breed?.toLowerCase().includes(q);
      const matchChip = rec.microchip?.toLowerCase().includes(q);
      const matchObs = rec.observations?.toLowerCase().includes(q);
      const matchComp = rec.complication_notes?.toLowerCase().includes(q);
      return matchName || matchBreed || matchChip || matchObs || matchComp;
    }

    return true;
  });

  if (!activeSession) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-950">
        <div className="animate-pulse text-sm font-semibold text-slate-500">
          Carregando prontuário anestésico...
        </div>
      </div>
    );
  }

  // Group records by page (8 per page)
  const RECORDS_PER_PAGE = 8;
  const startPageNum = activeSession.page_start_number || 202;
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / RECORDS_PER_PAGE));

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-28">
      
      {/* Header */}
      <Header
        session={activeSession}
        recordCount={records.length}
        onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
        onOpenManualModal={() => {
          setEditingRecord(null);
          setIsManualModalOpen(true);
        }}
        onOpenPdfModal={() => setIsPdfModalOpen(true)}
        onOpenConfigModal={() => setIsConfigModalOpen(true)}
        currentView="records"
      />

      {/* Summary and Filter Bar */}
      <DailySummaryBar
        records={records}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedFilter={selectedFilter}
        onFilterChange={setSelectedFilter}
      />

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-3 sm:px-6 py-4 w-full flex-1">
        
        {/* Banner with Quick PDF / WhatsApp reminder */}
        <div className="mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-vica-teal/15 via-vica-blue/10 to-transparent border border-vica-teal/20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-vica-teal text-white shadow-sm flex-shrink-0">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <p className="font-bold text-slate-900 dark:text-white">
                Ficha Oficial da Prancheta (8 animais por folha)
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                Pág. {startPageNum} • {records.length} {records.length === 1 ? 'animal registrado' : 'animais registrados'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsPdfModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 flex-shrink-0 transition-transform active:scale-95"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Gerar PDF</span>
          </button>
        </div>

        {/* Empty State */}
        {filteredRecords.length === 0 && (
          <div className="p-8 sm:p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 my-6">
            <div className="w-16 h-16 rounded-full bg-vica-teal/10 text-vica-teal flex items-center justify-center mx-auto shadow-inner">
              <Mic className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                {searchQuery ? 'Nenhum animal encontrado para esta busca' : 'Nenhum animal registrado nesta sessão'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                {searchQuery
                  ? 'Verifique a digitação ou limpe o filtro.'
                  : 'Toque no microfone flutuante abaixo para ditar os dados do animal em segundos.'}
              </p>
            </div>
            {!searchQuery && (
              <button
                onClick={() => setIsVoiceModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-vica-teal hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                Cadastrar 1º Animal por Voz
              </button>
            )}
          </div>
        )}

        {/* Records Grouped by Sheet Pages (8 animals per page block) */}
        {Array.from({ length: totalPages }).map((_, pageIdx) => {
          const currentPageNum = startPageNum + pageIdx;
          const pageRecords = filteredRecords.slice(pageIdx * RECORDS_PER_PAGE, (pageIdx + 1) * RECORDS_PER_PAGE);

          if (pageRecords.length === 0) return null;

          return (
            <div key={currentPageNum} className="mb-6 space-y-3">
              {/* Page Section Title */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg font-mono font-bold text-xs bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs">
                    Página {currentPageNum}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    (Animais {pageIdx * RECORDS_PER_PAGE + 1} a {Math.min((pageIdx + 1) * RECORDS_PER_PAGE, filteredRecords.length)} de {records.length})
                  </span>
                </div>
              </div>

              {/* Grid of Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {pageRecords.map(record => (
                  <RecordCard
                    key={record.id}
                    record={record}
                    onEdit={rec => {
                      setEditingRecord(rec);
                      setIsManualModalOpen(true);
                    }}
                    onDelete={handleDeleteRecord}
                    onToggleDrug={handleToggleDrug}
                    onTogglePostMed={handleTogglePostMed}
                  />
                ))}
              </div>
            </div>
          );
        })}

      </main>

      {/* Floating Bottom Control Bar (Mobile-First Ergonomic Floating Dock) */}
      <div className="fixed bottom-3 inset-x-0 z-30 flex items-center justify-center px-4 safe-bottom pointer-events-none">
        <div className="bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md text-white p-2 rounded-3xl shadow-2xl border border-slate-700/50 flex items-center gap-2 pointer-events-auto">
          
          {/* Manual Entry button */}
          <button
            onClick={() => {
              setEditingRecord(null);
              setIsManualModalOpen(true);
            }}
            className="px-3.5 py-2.5 rounded-2xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors active:scale-95"
            title="Preencher ficha manualmente"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden xs:inline">Manual</span>
          </button>

          {/* Giant Voice Microfone Button (Main Action) */}
          <button
            onClick={() => setIsVoiceModalOpen(true)}
            className="px-5 sm:px-6 py-2.5 rounded-2xl bg-gradient-to-r from-vica-teal to-emerald-500 hover:opacity-95 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-vica-teal/30 transition-transform active:scale-95 animate-pulse"
          >
            <Mic className="w-5 h-5" />
            <span>Falar Paciente (Voz)</span>
          </button>

          {/* WhatsApp PDF Quick Share */}
          <button
            onClick={() => setIsPdfModalOpen(true)}
            className="p-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors active:scale-95"
            title="Gerar PDF Oficial e Compartilhar no WhatsApp"
          >
            <Share2 className="w-4 h-4" />
          </button>

        </div>
      </div>

      {/* Modals */}
      <VoiceRecorderModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onConfirmRecord={handleConfirmVoiceRecord}
        sessionId={activeSession.id}
      />

      <RecordFormModal
        isOpen={isManualModalOpen}
        onClose={() => {
          setIsManualModalOpen(false);
          setEditingRecord(null);
        }}
        onSave={handleSaveManualRecord}
        initialRecord={editingRecord}
        sessionId={activeSession.id}
      />

      <PdfPreviewModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        session={activeSession}
        records={records}
      />

      <SessionConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        sessions={sessions}
        activeSession={activeSession}
        onSelectSession={handleSelectSession}
        onCreateSession={handleCreateSession}
        onUpdateSession={handleUpdateSession}
      />

    </div>
  );
}
