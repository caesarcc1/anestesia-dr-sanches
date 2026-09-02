import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { DailySession } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    let sql = 'SELECT * FROM public.daily_sessions';
    const params: any[] = [];

    if (date) {
      sql += ' WHERE session_date = $1';
      params.push(date);
    }

    sql += ' ORDER BY session_date DESC, created_at DESC';

    const res = await query(sql, params);
    return NextResponse.json({ success: true, data: res.rows });
  } catch (error: any) {
    console.error('Erro ao buscar sessões:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session: Partial<DailySession> = await request.json();

    const sql = `
      INSERT INTO public.daily_sessions (
        vet_name, vet_crmv, session_date, location, page_start_number, is_closed, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;

    const params = [
      session.vet_name || 'Dr. Daniel Sanches Rodriguez',
      session.vet_crmv || 'CRMV-SP 28792',
      session.session_date || new Date().toISOString().split('T')[0],
      session.location || 'Centro Cirúrgico Adote Vi.Ca',
      session.page_start_number || 1,
      session.is_closed || false,
      session.notes || '',
    ];

    const res = await query(sql, params);
    return NextResponse.json({ success: true, data: res.rows[0] });
  } catch (error: any) {
    console.error('Erro ao criar sessão:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session: DailySession = await request.json();
    if (!session.id) {
      return NextResponse.json({ success: false, error: 'ID da sessão é obrigatório' }, { status: 400 });
    }

    const sql = `
      UPDATE public.daily_sessions
      SET
        vet_name = $1,
        vet_crmv = $2,
        session_date = $3,
        location = $4,
        page_start_number = $5,
        is_closed = $6,
        notes = $7,
        updated_at = now()
      WHERE id = $8
      RETURNING *;
    `;

    const params = [
      session.vet_name,
      session.vet_crmv,
      session.session_date,
      session.location,
      session.page_start_number,
      session.is_closed,
      session.notes,
      session.id,
    ];

    const res = await query(sql, params);
    return NextResponse.json({ success: true, data: res.rows[0] });
  } catch (error: any) {
    console.error('Erro ao atualizar sessão:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
