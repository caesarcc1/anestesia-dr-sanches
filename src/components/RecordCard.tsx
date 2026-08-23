'use client';

import React from 'react';
import { AnesthesiaRecord, ANESTHESIA_DRUGS, POST_MEDS, PROCEDURES, AnesthesiaDrugCode, PostMedCode } from '@/types';
import { Edit2, Trash2, AlertCircle, CheckCircle2, ShieldAlert, Dog, Cat } from 'lucide-react';

interface RecordCardProps {
  record: AnesthesiaRecord;
  onEdit: (record: AnesthesiaRecord) => void;
  onDelete: (id: string) => void;
  onToggleDrug: (record: AnesthesiaRecord, drugCode: AnesthesiaDrugCode) => void;
  onTogglePostMed: (record: AnesthesiaRecord, medCode: PostMedCode) => void;
}

export function RecordCard({
  record,
  onEdit,
  onDelete,
  onToggleDrug,
  onTogglePostMed,
}: RecordCardProps) {
  const isCanine = record.species === 'CAN';
  const isMale = record.sex === 'M';

  const ALL_DRUG_CODES: AnesthesiaDrugCode[] = ['P', 'I', 'K', 'X', 'T', 'VK', 'TM'];
  const ALL_POST_CODES: PostMedCode[] = ['A', 'M', 'D'];

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 shadow-sm hover:shadow-md bg-white dark:bg-slate-900 ${
        record.has_complication
          ? 'border-rose-300 dark:border-rose-900/80 bg-rose-50/30 dark:bg-rose-950/10'
          : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      {/* Card Header: Sequence Number, Patient Name, Breed, Species, Sex */}
      <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          {/* Order Badge */}
          <div className="flex flex-col items-center justify-center w-8 h-8 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs flex-shrink-0 shadow-inner">
            #{record.order_index}
          </div>

          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {record.patient_name || 'Paciente sem nome'}
              </h3>
              {record.breed && (
                <span className="text-xs px-2 py-0.5 rounded-md font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {record.breed}
                </span>
              )}
            </div>

            {/* Microchip & Weight */}
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
              <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[11px]">
                {record.microchip ? `Chip: ${record.microchip}` : 'Sem microchip'}
              </span>
              {record.weight_kg !== null && record.weight_kg !== undefined && (
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  ⚖️ {record.weight_kg} kg
                </span>
              )}
              {record.age && <span>• {record.age}</span>}
            </div>
          </div>
        </div>

        {/* Species, Sex & Procedure badges + Edit/Delete Actions */}
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-1">
            {/* Species Pill */}
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 ${
                isCanine
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200'
              }`}
            >
              {isCanine ? <Dog className="w-3 h-3" /> : <Cat className="w-3 h-3" />}
              {record.species}
            </span>

            {/* Sex Pill */}
            <span
              className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                isMale
                  ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200'
                  : 'bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-200'
              }`}
            >
              {record.sex}
            </span>

            {/* Procedure Pill */}
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200">
              {record.procedure_type}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(record)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Editar animal"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(record.id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Excluir animal"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Drugs & Post-op Meds interactive quick-tap section */}
      <div className="p-3.5 sm:p-4 space-y-3">
        {/* Anesthesia Drugs */}
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
            Fármacos Anestésicos (1-toque para alternar)
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ALL_DRUG_CODES.map(code => {
              const drug = ANESTHESIA_DRUGS[code];
              const isSelected = record.anesthesia_drugs.includes(code);
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => onToggleDrug(record, code)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all active:scale-95 flex items-center gap-1 ${
                    isSelected
                      ? `${drug.color} border-current shadow-xs font-bold`
                      : 'bg-slate-50 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-100'
                  }`}
                  title={`${drug.name} (${drug.category})`}
                >
                  <span className="font-bold">[{code}]</span>
                  <span>{drug.shortName}</span>
                </button>
              );
            })}
            {record.anesthesia_others && (
              <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                + {record.anesthesia_others}
              </span>
            )}
          </div>
        </div>

        {/* Post-Op Medications */}
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
            Medicação Pós-Operatória
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ALL_POST_CODES.map(code => {
              const med = POST_MEDS[code];
              const isSelected = record.post_meds.includes(code);
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => onTogglePostMed(record, code)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all active:scale-95 flex items-center gap-1 ${
                    isSelected
                      ? `${med.color} border-current shadow-xs font-bold`
                      : 'bg-slate-50 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-100'
                  }`}
                  title={med.name}
                >
                  <span className="font-bold">[{code}]</span>
                  <span>{med.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Complications Alert or Observations */}
        {record.has_complication && (
          <div className="p-2.5 rounded-xl bg-rose-100/70 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Intercorrência Cirúrgica / Anestésica:</span>{' '}
              {record.complication_notes || 'Intercorrência registrada sem detalhamento.'}
            </div>
          </div>
        )}

        {record.observations && !record.has_complication && (
          <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Obs:</span> {record.observations}
          </div>
        )}
      </div>
    </div>
  );
}
