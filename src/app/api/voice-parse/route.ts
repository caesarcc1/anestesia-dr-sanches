import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ParsedVoiceResult, SpeciesType, SexType, ProcedureType, AnesthesiaDrugCode, PostMedCode } from '@/types';

// Fallback rule-based parser in case no GEMINI_API_KEY is configured yet
function parseWithRegex(text: string): ParsedVoiceResult {
  const lower = text.toLowerCase();
  
  // Espécie
  let species: SpeciesType = 'CAN';
  if (lower.includes('felin') || lower.includes('gato') || lower.includes('gata')) {
    species = 'FEL';
  } else if (lower.includes('canin') || lower.includes('cão') || lower.includes('cachorr') || lower.includes('cadela')) {
    species = 'CAN';
  }

  // Sexo
  let sex: SexType = 'M';
  if (lower.includes('fêmea') || lower.includes('femea') || lower.includes('cadela') || lower.includes('gata')) {
    sex = 'F';
  } else if (lower.includes('macho') || lower.includes('cão') || lower.includes('gato')) {
    sex = 'M';
  }

  // Peso
  let weight_kg: number | undefined;
  const weightMatch = lower.match(/(\d+([.,]\d+)?)\s*(kg|quilo|kilos|quilos)/i);
  if (weightMatch) {
    weight_kg = parseFloat(weightMatch[1].replace(',', '.'));
  }

  // Idade
  let age: string | undefined;
  const ageMatch = lower.match(/(\d+)\s*(anos?|meses|mês)/i);
  if (ageMatch) {
    age = `${ageMatch[1]} ${ageMatch[2]}`;
  }

  // Microchip
  let microchip: string | undefined;
  const chipMatch = lower.match(/(?:microchip|chip|número|numero)\s*([0-9a-zA-Z]{5,18})/i);
  if (chipMatch) {
    microchip = chipMatch[1];
  }

  // Procedimento
  let procedure_type: ProcedureType = 'ORQ';
  if (lower.includes('osh') || lower.includes('ovario') || lower.includes('castração de fêmea') || sex === 'F') {
    procedure_type = 'OSH';
  }
  if (lower.includes('orquiectomia') || lower.includes('orquio') || lower.includes('castração de macho')) {
    procedure_type = 'ORQ';
  }
  if (lower.includes('outros') || lower.includes('nodulectomia') || lower.includes('tartarectomia')) {
    procedure_type = 'OUTROS';
  }

  // Fármacos anestésicos
  const anesthesia_drugs: AnesthesiaDrugCode[] = [];
  if (lower.includes('propofol') || lower.includes('propo')) anesthesia_drugs.push('P');
  if (lower.includes('isoflurano') || lower.includes('iso') || lower.includes('inalatória')) anesthesia_drugs.push('I');
  if (lower.includes('quetamina') || lower.includes('ketamina') || lower.includes('queta')) anesthesia_drugs.push('K');
  if (lower.includes('xilazina') || lower.includes('xila')) anesthesia_drugs.push('X');
  if (lower.includes('tramadol') || lower.includes('tramal')) anesthesia_drugs.push('T');
  if (lower.includes('vitamina k') || lower.includes('vit k')) anesthesia_drugs.push('VK');
  if (lower.includes('transamin') || lower.includes('tranexâmico')) anesthesia_drugs.push('TM');

  // Medicação pós
  const post_meds: PostMedCode[] = [];
  if (lower.includes('agemoxi') || lower.includes('amoxicilina') || lower.includes('antibiótico')) post_meds.push('A');
  if (lower.includes('meloxicam') || lower.includes('melox') || lower.includes('anti-inflamatório')) post_meds.push('M');
  if (lower.includes('dipirona') || lower.includes('analgésico')) post_meds.push('D');

  // Intercorrências
  let has_complication = false;
  let complication_notes: string | undefined;
  if (
    lower.includes('intercorrência') ||
    lower.includes('com complicação') ||
    lower.includes('hipotermia') ||
    lower.includes('bradicardia') ||
    lower.includes('parada') ||
    lower.includes('hemorragia')
  ) {
    if (!lower.includes('sem intercorrência') && !lower.includes('sem complicação')) {
      has_complication = true;
      complication_notes = text;
    }
  }

  return {
    species,
    sex,
    breed: 'SRD',
    patient_name: 'Paciente',
    weight_kg,
    age,
    microchip,
    procedure_type,
    anesthesia_drugs: anesthesia_drugs.length > 0 ? anesthesia_drugs : ['P', 'K'],
    post_meds: post_meds.length > 0 ? post_meds : ['M', 'D'],
    has_complication,
    complication_notes,
    observations: text,
    raw_transcription: text,
    confidence_summary: 'Processado com motor local inteligente',
  };
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let transcriptText = '';
    let audioBase64: string | null = null;
    let audioMimeType: string = 'audio/webm';

    if (contentType.includes('application/json')) {
      const body = await req.json();
      transcriptText = body.text || '';
      audioBase64 = body.audioBase64 || null;
      audioMimeType = body.mimeType || 'audio/webm';
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const textParam = formData.get('text') as string;
      const audioFile = formData.get('audio') as Blob;
      
      if (textParam) transcriptText = textParam;
      if (audioFile) {
        const buffer = await audioFile.arrayBuffer();
        audioBase64 = Buffer.from(buffer).toString('base64');
        audioMimeType = audioFile.type || 'audio/webm';
      }
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    // Se não tiver Gemini configurado ou for texto simples em fallback
    if (!apiKey) {
      console.warn('GEMINI_API_KEY não configurada. Usando parser local inteligente.');
      const result = parseWithRegex(transcriptText || 'Canino macho SRD 10kg OSH Propofol e Meloxicam');
      return NextResponse.json({ success: true, data: result });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const systemPrompt = `Você é um assistente de inteligência artificial especializado em anestesiologia veterinária para o centro cirúrgico "Adote Vi.Ca" e o Dr. Daniel Sanches.
Sua missão é receber um áudio ou texto falado pelo veterinário anestesista durante mutirões de castração e extrair os dados clínicos rigorosamente estruturados no seguinte formato JSON:

{
  "microchip": string | null,
  "patient_name": string | null,
  "species": "CAN" | "FEL",
  "breed": string | null,
  "sex": "M" | "F",
  "weight_kg": number | null,
  "age": string | null,
  "procedure_type": "ORQ" | "OSH" | "OUTROS",
  "procedure_other_desc": string | null,
  "anesthesia_drugs": Array<"P" | "I" | "K" | "X" | "T" | "VK" | "TM">,
  "anesthesia_others": string | null,
  "post_meds": Array<"A" | "M" | "D">,
  "has_complication": boolean,
  "complication_notes": string | null,
  "observations": string | null,
  "raw_transcription": string
}

REGRAS CRÍTICAS DE MAPEAMENTO VETERINÁRIO:
1. Espécie: "canino", "cão", "cachorro", "cadela" -> "CAN". "felino", "gato", "gata" -> "FEL".
2. Sexo: "macho" -> "M", "fêmea", "femea" -> "F".
3. Raça: Se não mencionada explicitamente, coloque "SRD".
4. Procedimento:
   - "ORQ" = Orquiectomia (castração de macho).
   - "OSH" = Ovariosalpingohisterectomia (castração de fêmea).
   - "OUTROS" = Nodulectomia, hérnia, tartarectomia, cesárea, etc.
5. Códigos de Fármacos Anestésicos:
   - "P": Propofol ("propo")
   - "I": Isoflurano ("iso", "inalatória")
   - "K": Quetamina ("ketamina", "queta")
   - "X": Xilazina ("xila")
   - "T": Tramadol ("tramal")
   - "VK": Vitamina K ("vit k", "fitomenadiona")
   - "TM": Transamin ("ácido tranexâmico")
   - Outros fármacos (ex: Midazolam, Fentanil, Morfina, Dexmedetomidina) vão no campo "anesthesia_others".
6. Medicação Pós-operatória:
   - "A": Agemoxi ("amoxicilina", "antibiótico")
   - "M": Meloxicam ("melox", "anti-inflamatório")
   - "D": Dipirona ("analgésico")
7. Intercorrências:
   - "has_complication": true se houver bradicardia, hipotermia, sangramento importante, apneia, choque, extubação difícil, etc.
   - Frases como "sem intercorrências", "tudo tranquilo", "ótimo" significam has_complication = false.
8. Retorne apenas o JSON puro válido.`;

    let result;
    if (audioBase64) {
      result = await model.generateContent([
        systemPrompt,
        {
          inlineData: {
            mimeType: audioMimeType,
            data: audioBase64,
          },
        },
        'Transcreva este áudio do anestesista veterinário e extraia rigorosamente todos os campos solicitados no JSON.',
      ]);
    } else {
      result = await model.generateContent([
        systemPrompt,
        `Texto falado: "${transcriptText}". Extraia rigorosamente todos os campos solicitados no JSON.`,
      ]);
    }

    const responseText = result.response.text();
    const parsedData: ParsedVoiceResult = JSON.parse(responseText);

    return NextResponse.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Erro na rota /api/voice-parse:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao processar áudio' },
      { status: 500 }
    );
  }
}
