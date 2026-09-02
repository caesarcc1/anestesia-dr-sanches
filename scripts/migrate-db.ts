import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://user_drsanches:DrS4nch3s_An3st_Sec2026@178.156.222.232:5432/db_drsanches?schema=public';

const pool = new Pool({
  connectionString,
  ssl: false,
});

async function runMigration() {
  console.log('🚀 Iniciando conexão com o PostgreSQL na VPS dedicada (178.156.222.232)...');
  const client = await pool.connect();
  
  try {
    console.log('✅ Conexão estabelecida com sucesso!');

    // 1. Extensões
    console.log('📦 Habilitando extensões uuid-ossp e pgcrypto...');
    await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
    await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

    // 2. Tabela daily_sessions
    console.log('📋 Criando/verificando tabela daily_sessions...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.daily_sessions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        vet_id uuid,
        vet_name text NOT NULL DEFAULT 'Dr. Daniel Sanches Rodriguez',
        vet_crmv text NOT NULL DEFAULT 'CRMV-SP 28792',
        session_date date NOT NULL DEFAULT current_date,
        location text NOT NULL DEFAULT 'Centro Cirúrgico Adote Vi.Ca',
        page_start_number integer NOT NULL DEFAULT 202,
        is_closed boolean NOT NULL DEFAULT false,
        notes text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    // 3. Tabela anesthesia_records
    console.log('📋 Criando/verificando tabela anesthesia_records...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.anesthesia_records (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id uuid NOT NULL REFERENCES public.daily_sessions(id) ON DELETE CASCADE,
        order_index integer NOT NULL DEFAULT 1,
        
        -- Identificação
        microchip text,
        patient_name text,
        species text NOT NULL CHECK (species IN ('CAN', 'FEL')),
        breed text DEFAULT 'SRD',
        sex text NOT NULL CHECK (sex IN ('M', 'F')),
        weight_kg numeric(5,2),
        age text,
        
        -- Procedimento Cirúrgico
        procedure_type text NOT NULL CHECK (procedure_type IN ('ORQ', 'OSH', 'OUTROS')),
        procedure_other_desc text,
        
        -- Fármacos Anestésicos
        anesthesia_drugs text[] NOT NULL DEFAULT '{}',
        anesthesia_others text,
        
        -- Medicação Pós-operatória
        post_meds text[] NOT NULL DEFAULT '{}',
        post_meds_others text,
        
        -- Intercorrências & Observações
        has_complication boolean NOT NULL DEFAULT false,
        complication_notes text,
        observations text,
        
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    // 4. Índices
    console.log('⚡ Criando índices de performance...');
    await client.query(`CREATE INDEX IF NOT EXISTS idx_anesthesia_records_session ON public.anesthesia_records(session_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_anesthesia_records_species ON public.anesthesia_records(species);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_anesthesia_records_sex ON public.anesthesia_records(sex);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_anesthesia_records_procedure ON public.anesthesia_records(procedure_type);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_daily_sessions_date ON public.daily_sessions(session_date);`);

    // 5. Trigger updated_at
    console.log('⏱️ Configurando triggers automáticos de updated_at...');
    await client.query(`
      CREATE OR REPLACE FUNCTION public.handle_updated_at()
      RETURNS trigger AS $$
      BEGIN
        new.updated_at = now();
        return new;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_daily_sessions_updated_at') THEN
          CREATE TRIGGER trigger_daily_sessions_updated_at
            BEFORE UPDATE ON public.daily_sessions
            FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_anesthesia_records_updated_at') THEN
          CREATE TRIGGER trigger_anesthesia_records_updated_at
            BEFORE UPDATE ON public.anesthesia_records
            FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
        END IF;
      END $$;
    `);

    // 6. Verificar dados e criar seed se necessário
    console.log('🌱 Verificando dados da base...');
    const sessionCountRes = await client.query(`SELECT count(*) FROM public.daily_sessions;`);
    const sessionCount = parseInt(sessionCountRes.rows[0].count, 10);
    console.log(`📊 Sessões existentes no banco: ${sessionCount}`);

    if (sessionCount === 0) {
      console.log('✨ Base vazia: inserindo sessão inicial padrão do Dr. Daniel Sanches Rodriguez...');
      const insertSessionRes = await client.query(`
        INSERT INTO public.daily_sessions (
          vet_name, vet_crmv, session_date, location, page_start_number, is_closed, notes
        ) VALUES (
          'Dr. Daniel Sanches Rodriguez',
          'CRMV-SP 28792',
          current_date,
          'Centro Cirúrgico Adote Vi.Ca',
          1,
          false,
          'Sessão inicial do sistema'
        ) RETURNING id;
      `);
      console.log(`🎉 Sessão inicial criada com ID: ${insertSessionRes.rows[0].id}`);
    }

    // 7. Teste de Leitura Geral
    const verifyRes = await client.query(`
      SELECT 
        table_name, 
        (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public';
    `);
    console.log('📋 Tabelas ativas no schema public:');
    console.table(verifyRes.rows);

    console.log('🎉 MIGRAÇÃO CONCLUÍDA COM 100% DE SUCESSO!');
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
