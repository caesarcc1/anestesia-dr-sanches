'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AnesthesiaRecord, ParsedVoiceResult, SpeciesType, SexType, ProcedureType, AnesthesiaDrugCode, PostMedCode, ANESTHESIA_DRUGS, POST_MEDS } from '@/types';
import { cleanAndDeduplicateSpeech } from '@/lib/voice-parser';
import { Mic, MicOff, Sparkles, Check, RefreshCw, X, AlertCircle, AlertTriangle, ArrowRight, Type, Edit3, CheckCircle2, Waves } from 'lucide-react';
import confetti from 'canvas-confetti';

interface VoiceRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmRecord: (data: Partial<AnesthesiaRecord> & { order_index?: number }) => void;
  sessionId: string;
  existingRecords: AnesthesiaRecord[];
}

export function VoiceRecorderModal({
  isOpen,
  onClose,
  onConfirmRecord,
  sessionId,
  existingRecords,
}: VoiceRecorderModalProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [manualInputText, setManualInputText] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParsedVoiceResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Editable fields in preview card
  const [patientName, setPatientName] = useState('');
  const [breed, setBreed] = useState('SRD');
  const [species, setSpecies] = useState<SpeciesType>('CAN');
  const [sex, setSex] = useState<SexType>('M');
  const [weightKg, setWeightKg] = useState<number | ''>('');
  const [age, setAge] = useState('');
  const [microchip, setMicrochip] = useState('');
  const [procedureType, setProcedureType] = useState<ProcedureType>('ORQ');
  const [anesthesiaDrugs, setAnesthesiaDrugs] = useState<AnesthesiaDrugCode[]>(['P', 'K']);
  const [anesthesiaOthers, setAnesthesiaOthers] = useState('');
  const [postMeds, setPostMeds] = useState<PostMedCode[]>(['M', 'D']);
  const [hasComplication, setHasComplication] = useState(false);
  const [complicationNotes, setComplicationNotes] = useState('');
  const [observations, setObservations] = useState('');
  const [orderIndex, setOrderIndex] = useState<number>(1);
  const [orderWarning, setOrderWarning] = useState<string | null>(null);
  const [spokenNumberOverride, setSpokenNumberOverride] = useState<number | null>(null);

  // Editable raw transcript box
  const [rawEditableText, setRawEditableText] = useState('');
  const [showTranscriptEditor, setShowTranscriptEditor] = useState(true);

  const recognitionRef = useRef<any>(null);
  const isRecordingRef = useRef(false);
  const finalizedSegmentsRef = useRef<string[]>([]);
  const liveTranscriptRef = useRef('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const nextDefaultOrder = existingRecords.length + 1;

  // 10 Exemplos reais e práticos para testes com 1 toque
  const SAMPLE_VOICE_PROMPTS = [
    {
      title: '1. Bento (Shih Tzu c/ Nodulectomia / Proc. 3)',
      text: 'Animal 1, cão, macho, Shih Tzu, Bento, 6kg, 7 anos, propofol e isoflurano, pós melox e agemoxi, procedimento 3 nodulectomia. Sem intercorrências.',
    },
    {
      title: '2. Luna (Gata Persa Chipada c/ Hipotermia)',
      text: 'Animal 2, felino, fêmea, persa, Luna, 3.5kg, 3 anos, microchip 982000543210, propofol e quetamina, feito dipirona no pós, OSH. Intercorrência: Hipotermia leve revertida com colchão térmico.',
    },
    {
      title: '3. Zeus (Rottweiler Pesado c/ Xilazina e Tramal)',
      text: 'Animal 3, canino, macho, Rottweiler, Zeus, 42kg, 4 anos, xila e tramal e propo, agemoxi e melox de pós, castração de macho. Sem intercorrências.',
    },
    {
      title: '4. Mimi (Gata SRD Filhote c/ Vitamina K e Transamin)',
      text: 'Animal 4, gato, fêmea, SRD, Mimi, 1.8kg, 8 meses, quetamina e transamin e vit k, pós meloxicam e dipirona, procedimento 2. Obs: Sangramento capilar discreto estancado.',
    },
    {
      title: '5. Spike (Pinscher Idoso c/ Apneia Transitória)',
      text: 'Animal 5, cão, macho, Pinscher, Spike, 3kg, 10 anos, microchip 982000887766, propofol e iso, dipi de pós, orqui. Intercorrência: Apneia transitória após indução.',
    },
    {
      title: '6. Hugo (Gato Siamês c/ abreviações e bradicardia)',
      text: 'Animal 2, gato, macho, siamês, Hugo, 4 anos, 2kg, propofol e iso, melox e dipi de pós, orqui. Intercorrência: Pequena bradicardia no início.',
    },
    {
      title: '7. Miguel (Galgo Italiano c/ xilazina e tramadol)',
      text: 'Animal 9, cão, macho, galgo italiano, nome Miguel, 24kg, 5 anos, xilazina e tramadol, feito agemoxi no pós, procedimento 2. Sem intercorrências.',
    },
    {
      title: '8. Princesa (Gata Fêmea SRD c/ dipirona)',
      text: 'Animal 15, gato, fêmea, SRD, princesa, 2kg, 1 ano, propofol e quetamina, dipirona de pós, procedimento 1. Sem intercorrências',
    },
    {
      title: '9. Bob (Poodle Macho c/ propofol e queta)',
      text: 'Animal 11, Macho, Poodle, Bob, 12kg, Propofol e Quetamina, Meloxicam de pós, Procedimento 1',
    },
    {
      title: '10. Mel (Cadela Pitbull Chipada c/ OSH)',
      text: 'Paciente 3 cadela Pitbull Mel 18kg 3 anos Microchip 982000456 Propofol Isoflurano Meloxicam Dipirona OSH',
    },
  ];

  useEffect(() => {
    if (!isOpen) {
      handleReset();
    }
  }, [isOpen]);

  const handleReset = () => {
    if (isRecordingRef.current) {
      stopRecording();
    }
    setIsRecording(false);
    isRecordingRef.current = false;
    setRecordingTime(0);
    setIsProcessing(false);
    setLiveTranscript('');
    finalizedSegmentsRef.current = [];
    liveTranscriptRef.current = '';
    setManualInputText('');
    setShowTextInput(false);
    setParsedResult(null);
    setErrorMsg(null);
    setOrderWarning(null);
    setSpokenNumberOverride(null);
    setRawEditableText('');
  };

  // Preenche todos os campos editáveis a partir do resultado retornado
  const populateEditableFields = (data: ParsedVoiceResult) => {
    setParsedResult(data);
    setRawEditableText(data.raw_transcription || '');
    setPatientName(data.patient_name || 'Paciente');
    setBreed(data.breed || 'SRD');
    setSpecies(data.species || 'CAN');
    setSex(data.sex || 'M');
    setWeightKg(data.weight_kg ?? '');
    setAge(data.age || '');
    setMicrochip(data.microchip || '');
    setProcedureType(data.procedure_type || (data.sex === 'F' ? 'OSH' : 'ORQ'));
    setAnesthesiaDrugs(data.anesthesia_drugs || ['P', 'K']);
    setAnesthesiaOthers(data.anesthesia_others || '');
    setPostMeds(data.post_meds || ['M', 'D']);
    setHasComplication(data.has_complication || false);
    setComplicationNotes(data.complication_notes || '');
    setObservations(data.observations || '');

    // Numeração Inteligente: se falou errado/pulou, preenche com o correto da fila e dá opção de usar o falado
    if (data.spoken_order_index !== undefined && data.spoken_order_index !== null && data.spoken_order_index > 0) {
      const spokenNum = data.spoken_order_index;
      const alreadyExists = existingRecords.some(r => r.order_index === spokenNum);

      if (alreadyExists || spokenNum > nextDefaultOrder) {
        setOrderIndex(nextDefaultOrder);
        setSpokenNumberOverride(spokenNum);
        setOrderWarning(
          `ℹ️ Número ajustado automaticamente para o próximo da fila (#${nextDefaultOrder}). Você falou "#${spokenNum}".`
        );
      } else {
        setOrderIndex(spokenNum);
        setOrderWarning(null);
        setSpokenNumberOverride(null);
      }
    } else {
      setOrderIndex(nextDefaultOrder);
      setOrderWarning(null);
      setSpokenNumberOverride(null);
    }
  };

  const startRecording = async () => {
    setErrorMsg(null);
    setLiveTranscript('');
    finalizedSegmentsRef.current = [];
    liveTranscriptRef.current = '';
    setParsedResult(null);

    const SpeechRecognition = typeof window !== 'undefined'
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : null;

    if (!SpeechRecognition) {
      setErrorMsg('O seu navegador não possui reconhecimento de voz direto. Use os botões de exemplo ou digite a frase.');
      setShowTextInput(true);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        let finalChunk = '';
        let interimChunk = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res.isFinal) {
            finalChunk += res[0].transcript + ' ';
          } else {
            interimChunk = res[0].transcript;
          }
        }

        if (finalChunk) {
          finalizedSegmentsRef.current.push(finalChunk.trim());
        }

        const allFinal = finalizedSegmentsRef.current.filter(Boolean).join(' ');
        const currentCombined = (allFinal + ' ' + interimChunk).trim();
        setLiveTranscript(currentCombined);
        liveTranscriptRef.current = currentCombined;
      };

      recognition.onerror = (e: any) => {
        console.warn('SpeechRecognition erro:', e.error);
        if (e.error === 'not-allowed') {
          setErrorMsg('Microfone bloqueado. Por favor, libere a permissão de microfone no navegador.');
        }
      };

      recognition.onend = () => {
        if (isRecordingRef.current) {
          try {
            recognition.start();
          } catch {}
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsRecording(true);
      isRecordingRef.current = true;
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.warn('Falha ao iniciar microfone:', err);
      setErrorMsg('Não foi possível ligar o microfone. Tente novamente ou digite a frase.');
      setShowTextInput(true);
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    isRecordingRef.current = false;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }

    setIsProcessing(true);

    // Aguarda 400ms para que o último buffer de fala do navegador finalize
    setTimeout(() => {
      const textToParse = (liveTranscriptRef.current || finalizedSegmentsRef.current.join(' ')).trim();

      if (textToParse && textToParse.length > 2) {
        handleProcessText(textToParse);
      } else {
        setIsProcessing(false);
        setErrorMsg('Nenhuma fala foi capturada. Fale mais perto do microfone ou use os exemplos rápidos.');
      }
    }, 400);
  };

  const handleProcessText = async (textToProcess: string) => {
    if (!textToProcess.trim()) return;
    setIsProcessing(true);
    setErrorMsg(null);
    setLiveTranscript(textToProcess);

    try {
      const response = await fetch('/api/voice-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToProcess }),
      });

      const data = await response.json();
      if (data.success && data.data) {
        populateEditableFields(data.data);
      } else {
        setErrorMsg(data.error || 'Erro ao processar texto.');
      }
    } catch (err: any) {
      setErrorMsg('Erro de conexão ao processar.');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleDrug = (code: AnesthesiaDrugCode) => {
    if (anesthesiaDrugs.includes(code)) {
      setAnesthesiaDrugs(anesthesiaDrugs.filter(c => c !== code));
    } else {
      setAnesthesiaDrugs([...anesthesiaDrugs, code]);
    }
  };

  const togglePostMed = (code: PostMedCode) => {
    if (postMeds.includes(code)) {
      setPostMeds(postMeds.filter(c => c !== code));
    } else {
      setPostMeds([...postMeds, code]);
    }
  };

  const handleConfirmAndSave = () => {
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch {}

    onConfirmRecord({
      order_index: orderIndex,
      patient_name: patientName.trim() || 'Paciente',
      breed: breed.trim() || 'SRD',
      species,
      sex,
      weight_kg: weightKg === '' ? null : Number(weightKg),
      age: age.trim(),
      microchip: microchip.trim(),
      procedure_type: procedureType,
      anesthesia_drugs: anesthesiaDrugs,
      anesthesia_others: anesthesiaOthers.trim(),
      post_meds: postMeds,
      has_complication: hasComplication,
      complication_notes: hasComplication ? complicationNotes.trim() : '',
      observations: observations.trim(),
    });
    onClose();
  };

  if (!isOpen) return null;

  const ALL_DRUG_CODES: AnesthesiaDrugCode[] = ['P', 'I', 'K', 'X', 'T', 'VK', 'TM'];
  const ALL_POST_CODES: PostMedCode[] = ['A', 'M', 'D'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden max-h-[94vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-vica-teal text-white shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                  Cadastro por Comando de Voz
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  v2.3.0
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Grave os dados do animal e toque em Concluir
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          
          {/* Main Recording Station */}
          {!parsedResult && (
            <div className="flex flex-col items-center justify-center py-3 text-center space-y-4">
              
              {/* Recording Animation Wave / Pulse */}
              {isRecording ? (
                <div className="space-y-3 w-full max-w-sm py-2">
                  {/* Soundwave bars */}
                  <div className="flex items-center justify-center gap-1.5 h-16">
                    <div className="w-2 bg-rose-500 rounded-full animate-pulse h-8" />
                    <div className="w-2 bg-rose-600 rounded-full animate-bounce h-14" />
                    <div className="w-2 bg-rose-500 rounded-full animate-pulse h-10" />
                    <div className="w-2 bg-rose-600 rounded-full animate-bounce h-16" />
                    <div className="w-2 bg-rose-500 rounded-full animate-pulse h-12" />
                    <div className="w-2 bg-rose-600 rounded-full animate-bounce h-14" />
                    <div className="w-2 bg-rose-500 rounded-full animate-pulse h-8" />
                  </div>
                  
                  {liveTranscript ? (
                    <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-left text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-300 text-[11px]">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Ouvindo e captando ao vivo:
                      </div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        "{liveTranscript}"
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-center">
                      <p className="text-xs sm:text-sm font-bold text-rose-700 dark:text-rose-300">
                        🎙️ Gravando áudio ({recordingTime}s)...
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Fale todos os dados do paciente com calma e toque no botão abaixo ao terminar.
                      </p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={stopRecording}
                    className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 ring-4 ring-rose-500/20"
                  >
                    <MicOff className="w-5 h-5" />
                    Concluir e Preencher Ficha
                  </button>
                </div>
              ) : (
                /* Giant Start Recording Button */
                <div className="flex flex-col items-center space-y-3">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={startRecording}
                      disabled={isProcessing}
                      className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-xl active:scale-95 ${
                        isProcessing
                          ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 animate-pulse'
                          : 'bg-gradient-to-tr from-vica-teal to-emerald-500 text-white hover:opacity-95 ring-8 ring-vica-teal/20'
                      }`}
                    >
                      {isProcessing ? (
                        <RefreshCw className="w-8 h-8 animate-spin" />
                      ) : (
                        <>
                          <Mic className="w-8 h-8 sm:w-9 sm:h-9" />
                          <span className="text-[11px] font-bold mt-1">Toque p/ Falar</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="w-full max-w-md">
                    {isProcessing ? (
                      <p className="text-sm font-bold text-vica-teal animate-pulse">
                        ✨ Transcrevendo áudio e interpretando dados com IA...
                      </p>
                    ) : (
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                        Toque no microfone, fale todos os dados e toque em <b>Concluir</b> ao terminar.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Error Message */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs text-left flex items-start gap-2 max-w-md">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Manual text input drawer toggle */}
              {!isRecording && (
                <div className="w-full pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowTextInput(!showTextInput)}
                    className="text-xs font-semibold text-vica-blue hover:underline flex items-center justify-center gap-1 mx-auto"
                  >
                    <Type className="w-3.5 h-3.5" />
                    {showTextInput ? 'Ocultar digitação manual' : 'Prefere digitar ou colar a frase?'}
                  </button>

                  {showTextInput && (
                    <div className="mt-3 flex gap-2">
                      <input
                        type="text"
                        placeholder="Ex: Animal 2 felino fêmea persa Luna 3.5kg propofol e quetamina..."
                        value={manualInputText}
                        onChange={e => setManualInputText(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleProcessText(manualInputText);
                        }}
                        className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-vica-teal focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleProcessText(manualInputText)}
                        disabled={isProcessing || !manualInputText.trim()}
                        className="px-4 py-2 bg-vica-teal text-white rounded-xl text-xs font-bold shadow-sm"
                      >
                        Processar
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 10 Exemplos Clínicos Reais para Teste com 1 Toque */}
              {!isRecording && (
                <div className="w-full pt-2 text-left">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    💡 10 Frases Prontas para Teste (Toque para Simular):
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {SAMPLE_VOICE_PROMPTS.map((prompt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleProcessText(prompt.text)}
                        disabled={isProcessing || isRecording}
                        className="w-full text-left p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 hover:bg-vica-teal/10 hover:border-vica-teal/40 border border-slate-200 dark:border-slate-700 transition-colors flex items-start justify-between group"
                      >
                        <div className="pr-1.5 min-w-0">
                          <div className="text-[11px] font-bold text-vica-blue dark:text-sky-400 truncate">
                            {prompt.title}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            "{prompt.text}"
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-vica-teal flex-shrink-0 mt-0.5" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Parsed Result Preview & Full Inline Edit Card */}
          {parsedResult && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              
              {/* Header Banner */}
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Ficha Interpretada com Sucesso
                </div>
                <button
                  onClick={() => setParsedResult(null)}
                  className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Falar Outro Paciente
                </button>
              </div>

              {/* Box da Frase Transcrita com Opção de Editar e Reprocessar com IA */}
              <div className="p-3 rounded-2xl bg-sky-50/80 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sky-900 dark:text-sky-200 flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-sky-600" />
                    Frase Reconhecida (Edite se quiser ajustar e reprocessar):
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowTranscriptEditor(!showTranscriptEditor)}
                    className="text-sky-700 dark:text-sky-300 hover:underline text-[11px]"
                  >
                    {showTranscriptEditor ? 'Recolher' : 'Expandir'}
                  </button>
                </div>

                {showTranscriptEditor && (
                  <div className="space-y-2 pt-1">
                    <textarea
                      rows={2}
                      value={rawEditableText}
                      onChange={e => setRawEditableText(e.target.value)}
                      placeholder="Texto reconhecido..."
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleProcessText(rawEditableText)}
                      disabled={isProcessing || !rawEditableText.trim()}
                      className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs shadow-xs flex items-center gap-1.5 transition-transform active:scale-95"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Reprocessar Frase com IA
                    </button>
                  </div>
                )}
              </div>

              {/* Order index conflict / auto-adjust alert */}
              {orderWarning && (
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-xs space-y-2 shadow-sm">
                  <div className="flex items-start gap-2 font-medium">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span>{orderWarning}</span>
                  </div>
                  {spokenNumberOverride && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setOrderIndex(spokenNumberOverride);
                          setOrderWarning(null);
                        }}
                        className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-xs active:scale-95"
                      >
                        ↩️ Usar #{spokenNumberOverride} (número falado)
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrderWarning(null)}
                        className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold"
                      >
                        ✓ Manter #{orderIndex} (próximo da fila)
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Editable Fields Grid */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3.5">
                
                {/* Row 1: Order Number, Name and Breed */}
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-3 sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Nº Animal
                    </label>
                    <input
                      type="number"
                      value={orderIndex}
                      onChange={e => setOrderIndex(parseInt(e.target.value) || 1)}
                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-center font-bold text-xs"
                    />
                  </div>

                  <div className="col-span-5 sm:col-span-6">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Nome do Animal
                    </label>
                    <input
                      type="text"
                      value={patientName}
                      onChange={e => setPatientName(e.target.value)}
                      placeholder="Ex: Luna, Bento, Zeus..."
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl font-bold text-xs"
                    />
                  </div>

                  <div className="col-span-4">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Raça
                    </label>
                    <input
                      type="text"
                      value={breed}
                      onChange={e => setBreed(e.target.value)}
                      placeholder="Ex: Persa, Shih Tzu..."
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-semibold"
                    />
                  </div>
                </div>

                {/* Row 2: Species, Sex and Procedure Toggles */}
                <div className="grid grid-cols-3 gap-2">
                  {/* Espécie */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Espécie
                    </label>
                    <div className="grid grid-cols-2 gap-1">
                      <button
                        type="button"
                        onClick={() => setSpecies('CAN')}
                        className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                          species === 'CAN'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-900 border text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        CAN
                      </button>
                      <button
                        type="button"
                        onClick={() => setSpecies('FEL')}
                        className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                          species === 'FEL'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-900 border text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        FEL
                      </button>
                    </div>
                  </div>

                  {/* Sexo */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Sexo
                    </label>
                    <div className="grid grid-cols-2 gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSex('M');
                          setProcedureType('ORQ');
                        }}
                        className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                          sex === 'M'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-900 border text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        M
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSex('F');
                          setProcedureType('OSH');
                        }}
                        className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                          sex === 'F'
                            ? 'bg-pink-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-900 border text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        F
                      </button>
                    </div>
                  </div>

                  {/* Procedimento */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Procedimento
                    </label>
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        type="button"
                        onClick={() => setProcedureType('ORQ')}
                        className={`py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                          procedureType === 'ORQ'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-900 border text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        ORQ
                      </button>
                      <button
                        type="button"
                        onClick={() => setProcedureType('OSH')}
                        className={`py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                          procedureType === 'OSH'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-900 border text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        OSH
                      </button>
                      <button
                        type="button"
                        onClick={() => setProcedureType('OUTROS')}
                        className={`py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                          procedureType === 'OUTROS'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-900 border text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Out
                      </button>
                    </div>
                  </div>
                </div>

                {/* Row 3: Weight, Age and Microchip */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Peso (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={weightKg}
                      onChange={e => setWeightKg(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      placeholder="Ex: 3.5"
                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-center font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Idade
                    </label>
                    <input
                      type="text"
                      value={age}
                      onChange={e => setAge(e.target.value)}
                      placeholder="Ex: 3 anos"
                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-center text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Microchip
                    </label>
                    <input
                      type="text"
                      value={microchip}
                      onChange={e => setMicrochip(e.target.value)}
                      placeholder="Nº chip"
                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-center font-mono text-xs"
                    />
                  </div>
                </div>

                {/* Anesthesia Drugs Multi-select Chips */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Anestesia (Toque para alternar)
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {ALL_DRUG_CODES.map(code => {
                      const drug = ANESTHESIA_DRUGS[code];
                      const isSelected = anesthesiaDrugs.includes(code);
                      return (
                        <button
                          key={code}
                          type="button"
                          onClick={() => toggleDrug(code)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs font-bold'
                              : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          [{code}] {drug.shortName}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Post Meds Multi-select Chips */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Medicação Pós-Operatória
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {ALL_POST_CODES.map(code => {
                      const med = POST_MEDS[code];
                      const isSelected = postMeds.includes(code);
                      return (
                        <button
                          key={code}
                          type="button"
                          onClick={() => togglePostMed(code)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs font-bold'
                              : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          [{code}] {med.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Complications toggle */}
                <div className="pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      Intercorrência Cirúrgica?
                    </label>
                    <button
                      type="button"
                      onClick={() => setHasComplication(!hasComplication)}
                      className={`w-10 h-5 rounded-full transition-colors relative p-0.5 ${
                        hasComplication ? 'bg-rose-600' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          hasComplication ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {hasComplication && (
                    <textarea
                      rows={2}
                      value={complicationNotes}
                      onChange={e => setComplicationNotes(e.target.value)}
                      placeholder="Descreva a intercorrência (ex: Hipotermia leve revertida com colchão térmico...)"
                      className="mt-2 w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 rounded-xl text-xs text-rose-900 dark:text-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  )}
                </div>

                {/* Observations */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Observações Gerais (Opcional)
                  </label>
                  <input
                    type="text"
                    value={observations}
                    onChange={e => setObservations(e.target.value)}
                    placeholder="Ex: Jejum ok, sem intercorrências..."
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-xs"
                  />
                </div>

              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          {parsedResult && (
            <button
              type="button"
              onClick={handleConfirmAndSave}
              className="px-6 py-2.5 text-xs font-bold bg-vica-teal hover:bg-emerald-600 text-white rounded-xl shadow-lg transition-transform active:scale-95 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Confirmar & Salvar no Registro
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
