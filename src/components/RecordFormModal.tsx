'use client';

import React, { useState, useEffect } from 'react';
import { AnesthesiaRecord, SpeciesType, SexType, ProcedureType, AnesthesiaDrugCode, PostMedCode, ANESTHESIA_DRUGS, POST_MEDS, PROCEDURES } from '@/types';
import { X, Check, Dog, Cat, AlertTriangle, Plus, Minus } from 'lucide-react';

interface RecordFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (recordData: Partial<AnesthesiaRecord>) => void;
  initialRecord?: AnesthesiaRecord | null;
  sessionId: string;
}

export function RecordFormModal({
  isOpen,
  onClose,
  onSave,
  initialRecord,
  sessionId,
}: RecordFormModalProps) {
  const [patientName, setPatientName] = useState('');
  const [breed, setBreed] = useState('SRD');
  const [species, setSpecies] = useState<SpeciesType>('CAN');
  const [sex, setSex] = useState<SexType>('M');
  const [weightKg, setWeightKg] = useState<number | ''>('');
  const [age, setAge] = useState('');
  const [microchip, setMicrochip] = useState('');
  const [procedureType, setProcedureType] = useState<ProcedureType>('ORQ');
  const [procedureOtherDesc, setProcedureOtherDesc] = useState('');
  const [anesthesiaDrugs, setAnesthesiaDrugs] = useState<AnesthesiaDrugCode[]>(['P', 'K']);
  const [anesthesiaOthers, setAnesthesiaOthers] = useState('');
  const [postMeds, setPostMeds] = useState<PostMedCode[]>(['M', 'D']);
  const [hasComplication, setHasComplication] = useState(false);
  const [complicationNotes, setComplicationNotes] = useState('');
  const [observations, setObservations] = useState('');

  useEffect(() => {
    if (initialRecord) {
      setPatientName(initialRecord.patient_name || '');
      setBreed(initialRecord.breed || 'SRD');
      setSpecies(initialRecord.species || 'CAN');
      setSex(initialRecord.sex || 'M');
      setWeightKg(initialRecord.weight_kg ?? '');
      setAge(initialRecord.age || '');
      setMicrochip(initialRecord.microchip || '');
      setProcedureType(initialRecord.procedure_type || 'ORQ');
      setProcedureOtherDesc(initialRecord.procedure_other_desc || '');
      setAnesthesiaDrugs(initialRecord.anesthesia_drugs || ['P', 'K']);
      setAnesthesiaOthers(initialRecord.anesthesia_others || '');
      setPostMeds(initialRecord.post_meds || ['M', 'D']);
      setHasComplication(initialRecord.has_complication || false);
      setComplicationNotes(initialRecord.complication_notes || '');
      setObservations(initialRecord.observations || '');
    } else {
      setPatientName('');
      setBreed('SRD');
      setSpecies('CAN');
      setSex('M');
      setWeightKg('');
      setAge('');
      setMicrochip('');
      setProcedureType('ORQ');
      setProcedureOtherDesc('');
      setAnesthesiaDrugs(['P', 'K']);
      setAnesthesiaOthers('');
      setPostMeds(['M', 'D']);
      setHasComplication(false);
      setComplicationNotes('');
      setObservations('');
    }
  }, [initialRecord, isOpen]);

  // Adjust default procedure when changing sex
  const handleSexChange = (newSex: SexType) => {
    setSex(newSex);
    if (!initialRecord) {
      if (newSex === 'M') setProcedureType('ORQ');
      if (newSex === 'F') setProcedureType('OSH');
    }
  };

  const toggleDrug = (code: AnesthesiaDrugCode) => {
    if (anesthesiaDrugs.includes(code)) {
      setAnesthesiaDrugs(anesthesiaDrugs.filter(c => c !== code));
    } else {
      setAnesthesiaDrugs([...anesthesiaDrugs, code]);
    }
  };

  const togglePostMed = (code: PostMedCode) => {
    if (postMeds.includes(code)) {
      setPostMeds(postMeds.filter(c => c !== code));
    } else {
      setPostMeds([...postMeds, code]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      patient_name: patientName.trim() || 'Sem nome',
      breed: breed.trim() || 'SRD',
      species,
      sex,
      weight_kg: weightKg === '' ? null : Number(weightKg),
      age: age.trim(),
      microchip: microchip.trim(),
      procedure_type: procedureType,
      procedure_other_desc: procedureOtherDesc.trim(),
      anesthesia_drugs: anesthesiaDrugs,
      anesthesia_others: anesthesiaOthers.trim(),
      post_meds: postMeds,
      has_complication: hasComplication,
      complication_notes: hasComplication ? complicationNotes.trim() : '',
      observations: observations.trim(),
    });
    onClose();
  };

  if (!isOpen) return null;

  const ALL_DRUG_CODES: AnesthesiaDrugCode[] = ['P', 'I', 'K', 'X', 'T', 'VK', 'TM'];
  const ALL_POST_CODES: PostMedCode[] = ['A', 'M', 'D'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden max-h-[94vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div>
            <h2 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
              {initialRecord ? `Editar Paciente #${initialRecord.order_index}` : 'Novo Paciente Cirúrgico'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Formulário tátil de preenchimento rápido
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form id="record-form" onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs sm:text-sm">
          
          {/* Row 1: Espécie & Sexo (Grandes Botões Táteis) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Espécie *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSpecies('CAN')}
                  className={`py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                    species === 'CAN'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  <Dog className="w-4 h-4" /> Cão (CAN)
                </button>
                <button
                  type="button"
                  onClick={() => setSpecies('FEL')}
                  className={`py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                    species === 'FEL'
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  <Cat className="w-4 h-4" /> Gato (FEL)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Sexo *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSexChange('M')}
                  className={`py-2.5 rounded-xl font-bold flex items-center justify-center transition-all ${
                    sex === 'M'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  ♂ Macho (M)
                </button>
                <button
                  type="button"
                  onClick={() => handleSexChange('F')}
                  className={`py-2.5 rounded-xl font-bold flex items-center justify-center transition-all ${
                    sex === 'F'
                      ? 'bg-pink-600 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  ♀ Fêmea (F)
                </button>
              </div>
            </div>
          </div>

          {/* Row 2: Nome e Raça */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Nome do Animal
              </label>
              <input
                type="text"
                placeholder="Ex: Thor, Mel, Bob..."
                value={patientName}
                onChange={e => setPatientName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-vica-teal focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Raça
              </label>
              <input
                type="text"
                placeholder="Ex: SRD, Pitbull, Poodle..."
                value={breed}
                onChange={e => setBreed(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-vica-teal focus:outline-none"
              />
            </div>
          </div>

          {/* Row 3: Peso, Idade, Microchip */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Peso (kg)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="Ex: 12.5"
                value={weightKg}
                onChange={e => setWeightKg(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-vica-teal focus:outline-none text-center font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Idade
              </label>
              <input
                type="text"
                placeholder="Ex: 2 anos"
                value={age}
                onChange={e => setAge(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-vica-teal focus:outline-none text-center"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Microchip
              </label>
              <input
                type="text"
                placeholder="Nº chip"
                value={microchip}
                onChange={e => setMicrochip(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-vica-teal focus:outline-none font-mono text-center text-xs"
              />
            </div>
          </div>

          {/* Row 4: Procedimento (1-ORQ, 2-OSH, 3-Outros) */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Procedimento Cirúrgico *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setProcedureType('ORQ')}
                className={`py-2 px-1 rounded-xl font-bold text-xs flex flex-col items-center transition-all ${
                  procedureType === 'ORQ'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span>[1] ORQ</span>
                <span className="text-[10px] font-normal opacity-90">Orquiectomia</span>
              </button>
              <button
                type="button"
                onClick={() => setProcedureType('OSH')}
                className={`py-2 px-1 rounded-xl font-bold text-xs flex flex-col items-center transition-all ${
                  procedureType === 'OSH'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span>[2] OSH</span>
                <span className="text-[10px] font-normal opacity-90">Castração Fêmea</span>
              </button>
              <button
                type="button"
                onClick={() => setProcedureType('OUTROS')}
                className={`py-2 px-1 rounded-xl font-bold text-xs flex flex-col items-center transition-all ${
                  procedureType === 'OUTROS'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span>[3] Outros</span>
                <span className="text-[10px] font-normal opacity-90">Especiais</span>
              </button>
            </div>
          </div>

          {/* Row 5: Fármacos Anestésicos */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Anestesia (Selecione os administrados)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {ALL_DRUG_CODES.map(code => {
                const drug = ANESTHESIA_DRUGS[code];
                const isSelected = anesthesiaDrugs.includes(code);
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => toggleDrug(code)}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-between border transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span>[{code}] {drug.shortName}</span>
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              placeholder="Outros fármacos anestésicos (Ex: Fentanil, Dexmedetomidina)..."
              value={anesthesiaOthers}
              onChange={e => setAnesthesiaOthers(e.target.value)}
              className="mt-2 w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-vica-teal focus:outline-none"
            />
          </div>

          {/* Row 6: Medicação Pós-Operatória */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Medicação Pós-Operatória
            </label>
            <div className="grid grid-cols-3 gap-2">
              {ALL_POST_CODES.map(code => {
                const med = POST_MEDS[code];
                const isSelected = postMeds.includes(code);
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => togglePostMed(code)}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-between border transition-all ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span>[{code}] {med.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 7: Intercorrências & Complicações */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Houve Intercorrência?
              </label>
              <button
                type="button"
                onClick={() => setHasComplication(!hasComplication)}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                  hasComplication ? 'bg-rose-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    hasComplication ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {hasComplication && (
              <textarea
                placeholder="Descreva a complicação (ex: Hipotermia, Bradicardia, Hemorragia...)"
                rows={2}
                value={complicationNotes}
                onChange={e => setComplicationNotes(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 rounded-xl text-xs text-rose-900 dark:text-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            )}
          </div>

          {/* Row 8: Observações Gerais */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Observações Gerais
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Jejum ok, tártaro moderado, ectoparasitas..."
              value={observations}
              onChange={e => setObservations(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-vica-teal focus:outline-none"
            />
          </div>

        </form>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="record-form"
            className="px-6 py-2.5 text-xs font-bold bg-vica-teal hover:bg-emerald-600 text-white rounded-xl shadow-lg transition-transform active:scale-95 flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            {initialRecord ? 'Salvar Alterações' : 'Adicionar Paciente'}
          </button>
        </div>
      </div>
    </div>
  );
}
