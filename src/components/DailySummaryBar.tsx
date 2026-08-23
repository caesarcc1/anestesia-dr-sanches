'use client';

import React from 'react';
import { AnesthesiaRecord } from '@/types';
import { Search, AlertTriangle, ShieldAlert, Dog, Cat, CheckCircle2 } from 'lucide-react';

interface DailySummaryBarProps {
  records: AnesthesiaRecord[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
}

export function DailySummaryBar({
  records,
  searchQuery,
  onSearchChange,
  selectedFilter,
  onFilterChange,
}: DailySummaryBarProps) {
  const total = records.length;
  const canCount = records.filter(r => r.species === 'CAN').length;
  const felCount = records.filter(r => r.species === 'FEL').length;
  const maleCount = records.filter(r => r.sex === 'M').length;
  const femaleCount = records.filter(r => r.sex === 'F').length;
  const orqCount = records.filter(r => r.procedure_type === 'ORQ').length;
  const oshCount = records.filter(r => r.procedure_type === 'OSH').length;
  const complications = records.filter(r => r.has_complication);
  const complicationCount = complications.length;

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-2.5 px-3 sm:px-6 shadow-sm">
      <div className="max-w-6xl mx-auto space-y-2.5">
        {/* Metric pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          {/* Total Badge */}
          <button
            onClick={() => onFilterChange('all')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all flex-shrink-0 ${
              selectedFilter === 'all'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span>Total:</span>
            <span className="text-sm">{total}</span>
          </button>

          {/* Dogs (CAN) */}
          <button
            onClick={() => onFilterChange('CAN')}
            className={`px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1 transition-all flex-shrink-0 ${
              selectedFilter === 'CAN'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 hover:bg-blue-100'
            }`}
          >
            <Dog className="w-3.5 h-3.5" />
            <span>Cães:</span>
            <span className="font-bold">{canCount}</span>
          </button>

          {/* Cats (FEL) */}
          <button
            onClick={() => onFilterChange('FEL')}
            className={`px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1 transition-all flex-shrink-0 ${
              selectedFilter === 'FEL'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
            }`}
          >
            <Cat className="w-3.5 h-3.5" />
            <span>Gatos:</span>
            <span className="font-bold">{felCount}</span>
          </button>

          {/* OSH (Fêmeas) */}
          <button
            onClick={() => onFilterChange('OSH')}
            className={`px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1 transition-all flex-shrink-0 ${
              selectedFilter === 'OSH'
                ? 'bg-pink-600 text-white shadow-sm'
                : 'bg-pink-50 dark:bg-pink-950/50 text-pink-700 dark:text-pink-300 hover:bg-pink-100'
            }`}
          >
            <span>OSH (♀):</span>
            <span className="font-bold">{oshCount}</span>
          </button>

          {/* ORQ (Machos) */}
          <button
            onClick={() => onFilterChange('ORQ')}
            className={`px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1 transition-all flex-shrink-0 ${
              selectedFilter === 'ORQ'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100'
            }`}
          >
            <span>ORQ (♂):</span>
            <span className="font-bold">{orqCount}</span>
          </button>

          {/* Complications Alert */}
          {complicationCount > 0 && (
            <button
              onClick={() => onFilterChange('complication')}
              className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-all flex-shrink-0 animate-pulse ${
                selectedFilter === 'complication'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>Intercorrências:</span>
              <span className="bg-rose-600 text-white px-1.5 py-0.2 rounded-full text-xs">
                {complicationCount}
              </span>
            </button>
          )}
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por microchip, nome do animal, raça ou observações..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs sm:text-sm bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-vica-teal focus:bg-white dark:focus:bg-slate-800 transition-all text-slate-800 dark:text-slate-100"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold px-1.5 py-0.5 rounded"
            >
              Limpar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
