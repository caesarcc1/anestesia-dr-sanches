-- ==============================================================================
-- SCHEMA SUPABASE: SISTEMA DE GESTÃO ANESTÉSICA VETERINÁRIA (DR. DANIEL SANCHES)
-- CENTRO CIRÚRGICO ADOTE VI.CA
-- ==============================================================================

-- 1. Habilitar extensão para geração de UUID
create extension if not exists "uuid-ossp";

-- 2. Tabela de Sessões Diárias de Cirurgia
create table if not exists public.daily_sessions (
  id uuid primary key default gen_random_uuid(),
  vet_id uuid references auth.users(id) on delete set null,
  vet_name text not null default 'Dr. Daniel Sanches Rodriguez',
  vet_crmv text not null default 'CRMV-SP 28792',
  session_date date not null default current_date,
  location text not null default 'Centro Cirúrgico Adote Vi.Ca',
  page_start_number integer not null default 202,
  is_closed boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Tabela de Registros Anestésicos por Animal
create table if not exists public.anesthesia_records (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.daily_sessions(id) on delete cascade,
  order_index integer not null default 1,
  
  -- Identificação
  microchip text,
  patient_name text,
  species text not null check (species in ('CAN', 'FEL')),
  breed text default 'SRD',
  sex text not null check (sex in ('M', 'F')),
  weight_kg numeric(5,2),
  age text,
  
  -- Procedimento Cirúrgico
  procedure_type text not null check (procedure_type in ('ORQ', 'OSH', 'OUTROS')),
  procedure_other_desc text,
  
  -- Fármacos Anestésicos (Códigos oficiais da Adote Vi.Ca)
  -- P = Propofol, I = Isoflurano, K = Quetamina, X = Xilazina, T = Tramadol, VK = Vitamina K, TM = Transamin
  anesthesia_drugs text[] not null default '{}',
  anesthesia_others text,
  
  -- Medicação Pós-operatória (A = Agemoxi, M = Meloxicam, D = Dipirona)
  post_meds text[] not null default '{}',
  post_meds_others text,
  
  -- Intercorrências & Observações
  has_complication boolean not null default false,
  complication_notes text,
  observations text,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. Índices para consultas ultra rápidas no dashboard
create index if not exists idx_anesthesia_records_session on public.anesthesia_records(session_id);
create index if not exists idx_anesthesia_records_species on public.anesthesia_records(species);
create index if not exists idx_anesthesia_records_sex on public.anesthesia_records(sex);
create index if not exists idx_anesthesia_records_procedure on public.anesthesia_records(procedure_type);
create index if not exists idx_daily_sessions_date on public.daily_sessions(session_date);

-- 5. Row Level Security (RLS)
alter table public.daily_sessions enable row level security;
alter table public.anesthesia_records enable row level security;

-- Políticas de acesso público/autenticado (ajustáveis conforme política de Auth da clínica)
create policy "Allow all actions for authenticated users on daily_sessions"
  on public.daily_sessions for all
  using (true)
  with check (true);

create policy "Allow all actions for authenticated users on anesthesia_records"
  on public.anesthesia_records for all
  using (true)
  with check (true);

-- 6. Trigger para atualizar o campo updated_at automaticamente
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trigger_daily_sessions_updated_at
  before update on public.daily_sessions
  for each row execute function public.handle_updated_at();

create trigger trigger_anesthesia_records_updated_at
  before update on public.anesthesia_records
  for each row execute function public.handle_updated_at();
