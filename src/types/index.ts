export type SpeciesType = 'CAN' | 'FEL';
export type SexType = 'M' | 'F';
export type ProcedureType = 'ORQ' | 'OSH' | 'OUTROS';

export type AnesthesiaDrugCode = 'P' | 'I' | 'K' | 'X' | 'T' | 'VK' | 'TM';
export type PostMedCode = 'A' | 'M' | 'D';

export interface DrugDefinition {
  code: AnesthesiaDrugCode;
  name: string;
  shortName: string;
  category: 'induction' | 'inhalation' | 'dissociative' | 'sedative' | 'analgesic' | 'hemostatic';
  color: string;
}

export interface PostMedDefinition {
  code: PostMedCode;
  name: string;
  color: string;
}

export interface ProcedureDefinition {
  code: ProcedureType;
  number: number;
  label: string;
  fullDescription: string;
}

export const ANESTHESIA_DRUGS: Record<AnesthesiaDrugCode, DrugDefinition> = {
  P: { code: 'P', name: 'Propofol', shortName: 'Propo', category: 'induction', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
  I: { code: 'I', name: 'Isoflurano', shortName: 'Iso', category: 'inhalation', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300' },
  K: { code: 'K', name: 'Quetamina', shortName: 'Queta', category: 'dissociative', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' },
  X: { code: 'X', name: 'Xilazina', shortName: 'Xila', category: 'sedative', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
  T: { code: 'T', name: 'Tramadol', shortName: 'Tramal', category: 'analgesic', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300' },
  VK: { code: 'VK', name: 'Vitamina K', shortName: 'Vit K', category: 'hemostatic', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
  TM: { code: 'TM', name: 'Transamin', shortName: 'Transamin', category: 'hemostatic', color: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300' },
};

export const POST_MEDS: Record<PostMedCode, PostMedDefinition> = {
  A: { code: 'A', name: 'Agemoxi', color: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300' },
  M: { code: 'M', name: 'Meloxicam', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
  D: { code: 'D', name: 'Dipirona', color: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300' },
};

export const PROCEDURES: Record<ProcedureType, ProcedureDefinition> = {
  ORQ: { code: 'ORQ', number: 1, label: '1 - ORQ', fullDescription: 'Orquiectomia (Castração Macho)' },
  OSH: { code: 'OSH', number: 2, label: '2 - OSH', fullDescription: 'Ovariosalpingohisterectomia (Castração Fêmea)' },
  OUTROS: { code: 'OUTROS', number: 3, label: '3 - Outros', fullDescription: 'Outros Procedimentos' },
};

export interface DailySession {
  id: string;
  vet_id?: string;
  vet_name: string;
  vet_crmv: string;
  session_date: string; // YYYY-MM-DD
  location: string;
  page_start_number: number;
  is_closed: boolean;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface AnesthesiaRecord {
  id: string;
  session_id: string;
  order_index: number;
  microchip: string;
  patient_name: string;
  species: SpeciesType;
  breed: string;
  sex: SexType;
  weight_kg: number | null;
  age: string;
  procedure_type: ProcedureType;
  procedure_other_desc?: string;
  anesthesia_drugs: AnesthesiaDrugCode[];
  anesthesia_others?: string;
  post_meds: PostMedCode[];
  post_meds_others?: string;
  has_complication: boolean;
  complication_notes?: string;
  observations?: string;
  created_at: string;
  updated_at?: string;
}

export interface ParsedVoiceResult {
  spoken_order_index?: number;
  microchip?: string;
  patient_name?: string;
  species?: SpeciesType;
  breed?: string;
  sex?: SexType;
  weight_kg?: number;
  age?: string;
  procedure_type?: ProcedureType;
  procedure_other_desc?: string;
  anesthesia_drugs?: AnesthesiaDrugCode[];
  anesthesia_others?: string;
  post_meds?: PostMedCode[];
  has_complication?: boolean;
  complication_notes?: string;
  observations?: string;
  confidence_summary?: string;
  raw_transcription?: string;
}

