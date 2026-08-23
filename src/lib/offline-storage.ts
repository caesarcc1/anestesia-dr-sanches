import { DailySession, AnesthesiaRecord } from '@/types';
import { supabase, isSupabaseConfigured } from './supabase';

const SESSIONS_KEY = 'vica_anesthesia_sessions_v1';
const RECORDS_KEY = 'vica_anesthesia_records_v1';
const ACTIVE_SESSION_ID_KEY = 'vica_active_session_id';

const INITIAL_SESSIONS: DailySession[] = [
  {
    id: 'session-demo-today',
    vet_name: 'Dr. Daniel Sanches',
    vet_crmv: 'CRMV-SP 34.567',
    session_date: new Date().toISOString().split('T')[0],
    location: 'Centro Cirúrgico Adote Vi.Ca',
    page_start_number: 202,
    is_closed: false,
    notes: 'Mutirão de castração de cães e gatos da região.',
    created_at: new Date().toISOString(),
  },
];

const INITIAL_RECORDS: AnesthesiaRecord[] = [
  {
    id: 'rec-1',
    session_id: 'session-demo-today',
    order_index: 1,
    microchip: '982000362145890',
    patient_name: 'Thor',
    species: 'CAN',
    breed: 'Pitbull',
    sex: 'M',
    weight_kg: 24.5,
    age: '2 anos',
    procedure_type: 'ORQ',
    anesthesia_drugs: ['P', 'K', 'I'],
    post_meds: ['M', 'D', 'A'],
    has_complication: false,
    observations: 'Pré-operatório em jejum de 8h. Tranquilo.',
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'rec-2',
    session_id: 'session-demo-today',
    order_index: 2,
    microchip: '982000362145891',
    patient_name: 'Luna',
    species: 'FEL',
    breed: 'SRD',
    sex: 'F',
    weight_kg: 3.2,
    age: '1 ano',
    procedure_type: 'OSH',
    anesthesia_drugs: ['K', 'X', 'I'],
    post_meds: ['M', 'D'],
    has_complication: false,
    observations: 'Fêmea jovem, recuperação rápida.',
    created_at: new Date(Date.now() - 3600000 * 2.5).toISOString(),
  },
  {
    id: 'rec-3',
    session_id: 'session-demo-today',
    order_index: 3,
    microchip: '982000362145892',
    patient_name: 'Bob',
    species: 'CAN',
    breed: 'Poodle',
    sex: 'M',
    weight_kg: 6.8,
    age: '7 anos',
    procedure_type: 'ORQ',
    anesthesia_drugs: ['P', 'I', 'T'],
    post_meds: ['M', 'D'],
    has_complication: true,
    complication_notes: 'Hipotermia leve transitória no pós-imediato. Aquecido com manta térmica.',
    observations: 'Paciente sênior.',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'rec-4',
    session_id: 'session-demo-today',
    order_index: 4,
    microchip: '982000362145893',
    patient_name: 'Mel',
    species: 'CAN',
    breed: 'Golden Retriever',
    sex: 'F',
    weight_kg: 28.0,
    age: '3 anos',
    procedure_type: 'OSH',
    anesthesia_drugs: ['P', 'K', 'I', 'TM'],
    anesthesia_others: 'Fentanil 0.05mg',
    post_meds: ['A', 'M', 'D'],
    has_complication: false,
    observations: 'Útero vascularizado, administrado Transamin profilático.',
    created_at: new Date(Date.now() - 3600000 * 1.5).toISOString(),
  },
  {
    id: 'rec-5',
    session_id: 'session-demo-today',
    order_index: 5,
    microchip: '982000362145894',
    patient_name: 'Simba',
    species: 'FEL',
    breed: 'Siamês',
    sex: 'M',
    weight_kg: 4.1,
    age: '1.5 anos',
    procedure_type: 'ORQ',
    anesthesia_drugs: ['K', 'X'],
    post_meds: ['M', 'D'],
    has_complication: false,
    observations: 'Procedimento rápido 7 min.',
    created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
  {
    id: 'rec-6',
    session_id: 'session-demo-today',
    order_index: 6,
    microchip: '982000362145895',
    patient_name: 'Frida',
    species: 'CAN',
    breed: 'Bulldog Francês',
    sex: 'F',
    weight_kg: 11.2,
    age: '4 anos',
    procedure_type: 'OSH',
    anesthesia_drugs: ['P', 'I', 'T'],
    post_meds: ['A', 'M', 'D'],
    has_complication: true,
    complication_notes: 'Braquicefálica, intubação prolongada para extubação tardia segura.',
    observations: 'Monitorização estrita de saturação SpO2.',
    created_at: new Date(Date.now() - 3600000 * 0.5).toISOString(),
  },
  {
    id: 'rec-7',
    session_id: 'session-demo-today',
    order_index: 7,
    microchip: '982000362145896',
    patient_name: 'Mingau',
    species: 'FEL',
    breed: 'Persa',
    sex: 'M',
    weight_kg: 3.8,
    age: '2 anos',
    procedure_type: 'ORQ',
    anesthesia_drugs: ['K', 'X', 'I'],
    post_meds: ['M', 'D'],
    has_complication: false,
    observations: 'Sem intercorrências.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'rec-8',
    session_id: 'session-demo-today',
    order_index: 8,
    microchip: '982000362145897',
    patient_name: 'Belinha',
    species: 'CAN',
    breed: 'Pinscher',
    sex: 'F',
    weight_kg: 2.8,
    age: '5 anos',
    procedure_type: 'OSH',
    anesthesia_drugs: ['P', 'I', 'K', 'VK'],
    post_meds: ['A', 'M', 'D'],
    has_complication: false,
    observations: 'Vitamina K aplicada pós sangramento capilar menor.',
    created_at: new Date().toISOString(),
  },
];

export const storage = {
  getSessions: (): DailySession[] => {
    if (typeof window === 'undefined') return INITIAL_SESSIONS;
    const stored = localStorage.getItem(SESSIONS_KEY);
    if (!stored) {
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(INITIAL_SESSIONS));
      return INITIAL_SESSIONS;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return INITIAL_SESSIONS;
    }
  },

  saveSessions: (sessions: DailySession[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  },

  getActiveSessionId: (): string => {
    if (typeof window === 'undefined') return INITIAL_SESSIONS[0].id;
    const active = localStorage.getItem(ACTIVE_SESSION_ID_KEY);
    if (!active) {
      const sessions = storage.getSessions();
      const current = sessions[0]?.id || INITIAL_SESSIONS[0].id;
      localStorage.setItem(ACTIVE_SESSION_ID_KEY, current);
      return current;
    }
    return active;
  },

  setActiveSessionId: (id: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ACTIVE_SESSION_ID_KEY, id);
  },

  getRecords: (sessionId?: string): AnesthesiaRecord[] => {
    if (typeof window === 'undefined') {
      return sessionId ? INITIAL_RECORDS.filter(r => r.session_id === sessionId) : INITIAL_RECORDS;
    }
    const stored = localStorage.getItem(RECORDS_KEY);
    let allRecords: AnesthesiaRecord[] = [];
    if (!stored) {
      localStorage.setItem(RECORDS_KEY, JSON.stringify(INITIAL_RECORDS));
      allRecords = INITIAL_RECORDS;
    } else {
      try {
        allRecords = JSON.parse(stored);
      } catch {
        allRecords = INITIAL_RECORDS;
      }
    }

    if (sessionId) {
      return allRecords
        .filter(r => r.session_id === sessionId)
        .sort((a, b) => a.order_index - b.order_index);
    }
    return allRecords.sort((a, b) => a.order_index - b.order_index);
  },

  saveRecords: (records: AnesthesiaRecord[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  },

  addRecord: (record: Omit<AnesthesiaRecord, 'id' | 'order_index' | 'created_at'>): AnesthesiaRecord => {
    const allRecords = storage.getRecords();
    const sessionRecords = allRecords.filter(r => r.session_id === record.session_id);
    const nextOrder = sessionRecords.length + 1;

    const newRecord: AnesthesiaRecord = {
      ...record,
      id: 'rec-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      order_index: nextOrder,
      created_at: new Date().toISOString(),
    };

    allRecords.push(newRecord);
    storage.saveRecords(allRecords);

    // Tenta sincronizar com Supabase se configurado
    if (isSupabaseConfigured() && supabase) {
      supabase.from('anesthesia_records').insert([newRecord]).then();
    }

    return newRecord;
  },

  updateRecord: (updated: AnesthesiaRecord): AnesthesiaRecord => {
    const allRecords = storage.getRecords();
    const index = allRecords.findIndex(r => r.id === updated.id);
    if (index !== -1) {
      allRecords[index] = { ...updated, updated_at: new Date().toISOString() };
      storage.saveRecords(allRecords);

      if (isSupabaseConfigured() && supabase) {
        supabase.from('anesthesia_records').update(allRecords[index]).eq('id', updated.id).then();
      }
    }
    return updated;
  },

  deleteRecord: (id: string) => {
    const allRecords = storage.getRecords();
    const target = allRecords.find(r => r.id === id);
    if (!target) return;

    const filtered = allRecords.filter(r => r.id !== id);
    // Reajusta order_index dos registros da mesma sessão
    let reindexed = filtered.map(r => {
      if (r.session_id === target.session_id && r.order_index > target.order_index) {
        return { ...r, order_index: r.order_index - 1 };
      }
      return r;
    });

    storage.saveRecords(reindexed);

    if (isSupabaseConfigured() && supabase) {
      supabase.from('anesthesia_records').delete().eq('id', id).then();
    }
  },

  createSession: (session: Omit<DailySession, 'id' | 'created_at'>): DailySession => {
    const sessions = storage.getSessions();
    const newSession: DailySession = {
      ...session,
      id: 'session-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    sessions.unshift(newSession);
    storage.saveSessions(sessions);
    storage.setActiveSessionId(newSession.id);

    if (isSupabaseConfigured() && supabase) {
      supabase.from('daily_sessions').insert([newSession]).then();
    }

    return newSession;
  },
};
