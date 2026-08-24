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
2. Nome: Extraia com precisão (ex: "nome César" -> "César", "nome Priscila" -> "Priscila", "Spike" -> "Spike", "Zeus" -> "Zeus").
3. Microchip: Extraia números de chip (ex: "microchip 811" -> "811", "final de microchip 116" -> "116").
4. Raça: Identifique raças caninas e felinas (ex: "Pinscher", "Malamute", "Galgo Italiano", "Pitbull", "Poodle", "Shih Tzu", "Rottweiler", "SRD", etc.).
5. Espécie: "CAN" (cão/canino), "FEL" (gato/felino).
6. Sexo: "M" (macho), "F" (fêmea).
7. Procedimento: "ORQ" (orquiectomia / castração de macho), "OSH" (ovariohisterectomia / castração de fêmea), "OUTROS" (procedimento 3 / outros).
8. Fármacos: "P"(Propofol), "I"(Isoflurano), "K"(Quetamina), "X"(Xilazina), "T"(Tramadol), "VK"(Vit K), "TM"(Transamin).
9. Pós: "A"(Agemoxi / Agemox / Amoxicilina), "M"(Meloxicam / Maxicam / Meloxivet), "D"(Dipirona / Novalgina). Se disser "agemox maxicam dipirona", retorne ["A", "M", "D"].
10. Observações: Extraia notas como "Piometra", "Jejum ok", "Nódulo", etc.
11. "has_complication": true apenas se houver intercorrência cirúrgica/anestésica real (apneia, bradicardia, hemorragia). Se disser "sem intercorrências", marque false.
12. Retorne apenas o JSON puro.`;

    if (apiKey) {
      const genAI = new GoogleGenerativeAI(apiKey);
      const modelCandidates = ['gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-3.5-flash', 'gemini-flash-latest', 'gemini-2.5-flash'];

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
              'Transcreva o áudio e extraia rigorosamente os campos clínicos no JSON estruturado.',
            ]);
          } else {
            result = await model.generateContent([
              systemPrompt,
              `Texto falado: "${transcriptText}". Extraia com precisão clínica todos os campos no JSON.`,
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
