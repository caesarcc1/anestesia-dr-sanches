import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { AnesthesiaRecord } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    let sql = 'SELECT * FROM public.anesthesia_records';
    const params: any[] = [];

    if (sessionId) {
      sql += ' WHERE session_id = $1';
      params.push(sessionId);
    }

    sql += ' ORDER BY order_index ASC, created_at ASC';

    const res = await query(sql, params);
    return NextResponse.json({ success: true, data: res.rows });
  } catch (error: any) {
    console.error('Erro ao buscar registros anestésicos:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const rec: Partial<AnesthesiaRecord> = await request.json();

    if (!rec.session_id) {
      return NextResponse.json({ success: false, error: 'session_id é obrigatório' }, { status: 400 });
    }

    const sql = `
      INSERT INTO public.anesthesia_records (
        session_id, order_index, microchip, patient_name, species, breed, sex,
        weight_kg, age, procedure_type, procedure_other_desc, anesthesia_drugs,
        anesthesia_others, post_meds, post_meds_others, has_complication,
        complication_notes, observations
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *;
    `;

    const params = [
      rec.session_id,
      rec.order_index || 1,
      rec.microchip || null,
      rec.patient_name || 'Paciente',
      rec.species || 'CAN',
      rec.breed || 'SRD',
      rec.sex || 'M',
      rec.weight_kg || null,
      rec.age || null,
      rec.procedure_type || 'ORQ',
      rec.procedure_other_desc || null,
      rec.anesthesia_drugs || ['P'],
      rec.anesthesia_others || null,
      rec.post_meds || ['A', 'M', 'D'],
      null,
      rec.has_complication || false,
      rec.complication_notes || null,
      rec.observations || null,
    ];

    const res = await query(sql, params);
    return NextResponse.json({ success: true, data: res.rows[0] });
  } catch (error: any) {
    console.error('Erro ao salvar registro:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const rec: AnesthesiaRecord = await request.json();
    if (!rec.id) {
      return NextResponse.json({ success: false, error: 'ID do registro é obrigatório' }, { status: 400 });
    }

    const sql = `
      UPDATE public.anesthesia_records
      SET
        order_index = $1,
        microchip = $2,
        patient_name = $3,
        species = $4,
        breed = $5,
        sex = $6,
        weight_kg = $7,
        age = $8,
        procedure_type = $9,
        procedure_other_desc = $10,
        anesthesia_drugs = $11,
        anesthesia_others = $12,
        post_meds = $13,
        has_complication = $14,
        complication_notes = $15,
        observations = $16,
        updated_at = now()
      WHERE id = $17
      RETURNING *;
    `;

    const params = [
      rec.order_index,
      rec.microchip,
      rec.patient_name,
      rec.species,
      rec.breed,
      rec.sex,
      rec.weight_kg,
      rec.age,
      rec.procedure_type,
      rec.procedure_other_desc,
      rec.anesthesia_drugs,
      rec.anesthesia_others,
      rec.post_meds,
      rec.has_complication,
      rec.complication_notes,
      rec.observations,
      rec.id,
    ];

    const res = await query(sql, params);
    return NextResponse.json({ success: true, data: res.rows[0] });
  } catch (error: any) {
    console.error('Erro ao atualizar registro:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID é obrigatório' }, { status: 400 });
    }

    await query('DELETE FROM public.anesthesia_records WHERE id = $1', [id]);
    return NextResponse.json({ success: true, message: 'Registro excluído com sucesso' });
  } catch (error: any) {
    console.error('Erro ao excluir registro:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
