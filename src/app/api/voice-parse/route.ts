import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ParsedVoiceResult } from '@/types';
import { parseWithRegex } from '@/lib/voice-parser';

export async function POST(req: NextRequest) {
  let transcriptText = '';
  let audioBase64: string | null = null;
  let audioMimeType: string = 'audio/webm';

  try {
    const contentType = req.headers.get('content-type') || '';

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

    const cleanMimeType = (audioMimeType || 'audio/webm').split(';')[0].trim();
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    // Se temos texto transcrito e não há Gemini configurado
    if (!apiKey) {
      if (transcriptText && transcriptText.trim().length > 1) {
        const result = parseWithRegex(transcriptText);
        return NextResponse.json({ success: true, data: result });
      } else if (!audioBase64) {
        return NextResponse.json(
          { success: false, error: 'Nenhuma fala detectada. Fale mais perto do microfone ou use a digitação rápida.' },
          { status: 400 }
        );
      }
    }

    const systemPrompt = `Você é um assistente de IA especializado em anestesiologia veterinária para o "Centro Cirúrgico Adote Vi.Ca" e o Dr. Daniel Sanches.
Sua missão é extrair dados clínicos rigorosamente estruturados no seguinte formato JSON:

{
  "spoken_order_index": number | null,
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

REGRAS:
1. "spoken_order_index": Se falar "animal 9", "paciente 14", "número 11", extraia o número inteiro (ex: 9, 14, 11).
2. Nome: Extraia com precisão (ex: "nome Miguel" -> "Miguel", "princesa" -> "Princesa").
3. Raça: Identifique raças como "Galgo Italiano", "Pitbull", "Poodle", "SRD", etc.
4. "CAN" (cão), "FEL" (gato).
5. Sexo: "M" (macho), "F" (fêmea).
6. Procedimento: "ORQ" (procedimento 1 / macho), "OSH" (procedimento 2 / fêmea), "OUTROS" (procedimento 3).
7. Fármacos: "P"(Propofol), "I"(Isoflurano), "K"(Quetamina), "X"(Xilazina), "T"(Tramadol), "VK"(Vit K), "TM"(Transamin).
8. Pós: "A"(Agemoxi), "M"(Meloxicam), "D"(Dipirona).
9. "has_complication": true apenas se houver intercorrência clínica. Se disser "sem intercorrências", marque false.
10. Retorne apenas o JSON puro.`;

    if (apiKey) {
      const genAI = new GoogleGenerativeAI(apiKey);
      const modelCandidates = ['gemini-1.5-flash-latest', 'gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];

      for (const modelName of modelCandidates) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.1,
            },
          });

          let result;
          if (audioBase64) {
            result = await model.generateContent([
              systemPrompt,
              {
                inlineData: {
                  mimeType: cleanMimeType,
                  data: audioBase64,
                },
              },
              'Transcreva o áudio e extraia os campos no JSON estruturado.',
            ]);
          } else {
            result = await model.generateContent([
              systemPrompt,
              `Texto falado: "${transcriptText}". Extraia os campos no JSON.`,
            ]);
          }

          let responseText = result.response.text();
          responseText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
          const parsedData: ParsedVoiceResult = JSON.parse(responseText);

          return NextResponse.json({ success: true, data: parsedData });
        } catch (err: any) {
          console.warn(`Tentativa com modelo ${modelName} falhou:`, err.message);
        }
      }
    }

    // Se o processamento em nuvem falhar ou não houver API key, usa o parser local sobre o texto transcrito
    if (transcriptText && transcriptText.trim().length > 1) {
      const fallbackResult = parseWithRegex(transcriptText);
      return NextResponse.json({ success: true, data: fallbackResult });
    }

    return NextResponse.json(
      { success: false, error: 'Não foi possível captar o áudio com clareza. Fale novamente ou use a digitação rápida.' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('Erro global na rota:', error);
    if (transcriptText && transcriptText.trim().length > 1) {
      const fallbackResult = parseWithRegex(transcriptText);
      return NextResponse.json({ success: true, data: fallbackResult });
    }
    return NextResponse.json(
      { success: false, error: 'Erro ao processar áudio. Tente novamente.' },
      { status: 500 }
    );
  }
}
