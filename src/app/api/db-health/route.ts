import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const versionRes = await query('SELECT version();');
    const sessionsCountRes = await query('SELECT count(*) FROM public.daily_sessions;');
    const recordsCountRes = await query('SELECT count(*) FROM public.anesthesia_records;');

    return NextResponse.json({
      status: 'online',
      message: 'Conectado ao PostgreSQL da VPS com sucesso!',
      database: 'db_drsanches',
      host: '178.156.222.232',
      pg_version: versionRes.rows[0]?.version,
      stats: {
        daily_sessions: parseInt(sessionsCountRes.rows[0]?.count || '0', 10),
        anesthesia_records: parseInt(recordsCountRes.rows[0]?.count || '0', 10),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Erro de conexão ao banco PostgreSQL:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Falha ao conectar ao PostgreSQL',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
