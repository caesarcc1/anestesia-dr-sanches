'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AnesthesiaRecord, ParsedVoiceResult, SpeciesType, SexType, ProcedureType, AnesthesiaDrugCode, PostMedCode, ANESTHESIA_DRUGS, POST_MEDS } from '@/types';
import { Mic, MicOff, Sparkles, Check, RefreshCw, X, Volume2, AlertCircle, AlertTriangle, Dog, Cat, ArrowRight, Type, Edit3, CheckCircle2 } from 'lucide-react';
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

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const liveTranscriptRef = useRef('');

  const nextDefaultOrder = existingRecords.length + 1;

  // Exemplos rápidos para testes com 1 toque
  const SAMPLE_VOICE_PROMPTS = [
    'Animal 15, gato, fêmea, SRD, princesa, 2kg, 1 ano, propofol e quetamina, dipirona de pós, procedimento 1. Sem intercorrências',
    'Animal 11, Macho, Poodle, Bob, 12kg, Propofol e Quetamina, Meloxicam de pós, Procedimento 1',
    'Animal 9, cão, de nome Lulu, 12 quilos, 3 anos, microchip 982000362, Propofol e Quetamina, pós Meloxicam e Dipirona, ORQ',
  ];

  useEffect(() => {
    if (!isOpen) {
      handleReset();
    }
  }, [isOpen]);

  const handleReset = () => {
    if (isRecording) {
      stopRecording();
    }
    setIsRecording(false);
    setRecordingTime(0);
    setIsProcessing(false);
    setLiveTranscript('');
    liveTranscriptRef.current = '';
    setManualInputText('');
    setShowTextInput(false);
    setParsedResult(null);
    setErrorMsg(null);
    setOrderWarning(null);
  };

  // Preenche todos os campos editáveis a partir do resultado retornado
  const populateEditableFields = (data: ParsedVoiceResult) => {
    setParsedResult(data);
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

    // Validação inteligente de numeração do paciente
    if (data.spoken_order_index !== undefined && data.spoken_order_index !== null && data.spoken_order_index > 0) {
      const spokenNum = data.spoken_order_index;
      const alreadyExists = existingRecords.some(r => r.order_index === spokenNum);

      // Mantém o número falado no input
      setOrderIndex(spokenNum);

      if (alreadyExists) {
        const existingRecord = existingRecords.find(r => r.order_index === spokenNum);
        setOrderWarning(
          `⚠️ Você falou Animal #${spokenNum}, mas o #${spokenNum} (${existingRecord?.patient_name || 'já registrado'}) já existe na ficha de hoje. O próximo sequencial livre é #${nextDefaultOrder}.`
        );
      } else if (spokenNum > nextDefaultOrder) {
        setOrderWarning(
          `⚠️ Você falou Animal #${spokenNum}, mas o próximo na sequência de hoje seria #${nextDefaultOrder} (pulou ${spokenNum - nextDefaultOrder} posições). Deseja manter #${spokenNum} ou ajustar para #${nextDefaultOrder}?`
        );
      } else {
        setOrderWarning(null);
      }
    } else {
      setOrderIndex(nextDefaultOrder);
      setOrderWarning(null);
    }
  };

  const startRecording = async () => {
    setErrorMsg(null);
    setLiveTranscript('');
    liveTranscriptRef.current = '';
    setParsedResult(null);
    audioChunksRef.current = [];

    // 1. Inicia Web Speech Recognition no navegador (se disponível)
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.lang = 'pt-BR';
          recognition.continuous = true;
          recognition.interimResults = true;

          recognition.onresult = (event: any) => {
            let current = '';
            for (let i = 0; i < event.results.length; i++) {
              current += event.results[i][0].transcript + ' ';
            }
            const trimmed = current.trim();
            setLiveTranscript(trimmed);
            liveTranscriptRef.current = trimmed;
          };

          recognition.onerror = (e: any) => {
            console.warn('SpeechRecognition aviso:', e);
          };

          recognition.start();
          recognitionRef.current = recognition;
        } catch (recErr) {
          console.warn('Não foi possível iniciar SpeechRecognition:', recErr);
        }
      }
    }

    // 2. Inicia gravação de áudio MediaRecorder
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      let mimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/aac')) {
          mimeType = 'audio/aac';
        }
      }

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        await processAudioAndText(audioBlob, liveTranscriptRef.current);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.warn('Microfone não acessível:', err);
      if (recognitionRef.current) {
        setIsRecording(true);
        setRecordingTime(0);
        timerRef.current = setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);
      } else {
        setErrorMsg('Microfone não autorizado ou indisponível. Você pode usar os exemplos abaixo ou digitar.');
      }
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
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

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else if (liveTranscriptRef.current) {
      handleProcessText(liveTranscriptRef.current);
    }
  };

  const processAudioAndText = async (audioBlob: Blob, textTranscript: string) => {
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      if (textTranscript && textTranscript.trim().length > 3) {
        await handleProcessText(textTranscript);
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        const response = await fetch('/api/voice-parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64: base64Audio,
            mimeType: audioBlob.type || 'audio/webm',
            text: textTranscript || '',
          }),
        });

        const data = await response.json();
        if (data.success && data.data) {
          populateEditableFields(data.data);
          setLiveTranscript(data.data.raw_transcription || 'Áudio processado com sucesso');
        } else {
          setErrorMsg(data.error || 'Não foi possível extrair os dados do áudio. Tente novamente ou use os exemplos.');
        }
        setIsProcessing(false);
      };
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMsg('Falha ao processar o áudio. Tente novamente.');
    }
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
                  v1.4.0
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Fale os dados do animal ou use os botões rápidos
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
            <div className="flex flex-col items-center justify-center py-4 text-center space-y-4">
              {/* Giant Recording Button */}
              <div className="relative">
                {isRecording && (
                  <div className="absolute -inset-3 rounded-full bg-rose-500/30 animate-ping pointer-events-none" />
                )}
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isProcessing}
                  className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-xl active:scale-95 ${
                    isRecording
                      ? 'bg-rose-600 text-white hover:bg-rose-700 ring-8 ring-rose-500/20'
                      : isProcessing
                      ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 animate-pulse'
                      : 'bg-gradient-to-tr from-vica-teal to-emerald-500 text-white hover:opacity-95 ring-8 ring-vica-teal/20'
                  }`}
                >
                  {isProcessing ? (
                    <RefreshCw className="w-8 h-8 animate-spin" />
                  ) : isRecording ? (
                    <>
                      <MicOff className="w-8 h-8 sm:w-9 sm:h-9" />
                      <span className="text-[11px] font-bold mt-1">Parar</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-8 h-8 sm:w-9 sm:h-9" />
                      <span className="text-[11px] font-bold mt-1">Toque p/ Falar</span>
                    </>
                  )}
                </button>
              </div>

              {/* Status / Live Transcription Feedback */}
              <div>
                {isRecording ? (
                  <div className="space-y-2 max-w-sm">
                    <p className="text-sm font-bold text-rose-600 dark:text-rose-400 flex items-center justify-center gap-1.5 animate-pulse">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" />
                      Ouvindo ({recordingTime}s)... Toque no botão para finalizar
                    </p>
                    {liveTranscript ? (
                      <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 italic border border-slate-200 dark:border-slate-700">
                        "{liveTranscript}"
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">Pode ditar os dados do animal...</p>
                    )}
                  </div>
                ) : isProcessing ? (
                  <p className="text-sm font-bold text-vica-teal animate-pulse">
                    ✨ Interpretando dados cirúrgicos do paciente...
                  </p>
                ) : (
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xs">
                    Ex: <span className="italic font-medium">"Animal 15, gato, fêmea, SRD, princesa, 2kg, 1 ano, propofol e quetamina, dipirona, procedimento 1"</span>
                  </p>
                )}
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs text-left flex items-start gap-2 max-w-md">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Manual text input drawer toggle */}
              <div className="w-full pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowTextInput(!showTextInput)}
                  className="text-xs font-semibold text-vica-blue hover:underline flex items-center justify-center gap-1 mx-auto"
                >
                  <Type className="w-3.5 h-3.5" />
                  {showTextInput ? 'Ocultar digitação manual' : 'Prefere digitar a frase?'}
                </button>

                {showTextInput && (
                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      placeholder="Ex: Animal 15 gato fêmea SRD princesa 2kg 1 ano Propofol..."
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

              {/* Test with Sample Prompts */}
              <div className="w-full pt-2 text-left">
                <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                  Ou teste com frases de exemplo (1 toque):
                </div>
                <div className="space-y-2">
                  {SAMPLE_VOICE_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleProcessText(prompt)}
                      disabled={isProcessing || isRecording}
                      className="w-full text-left p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 hover:bg-vica-teal/10 hover:border-vica-teal/40 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-between group"
                    >
                      <span className="truncate pr-2">{prompt}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-vica-teal flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Parsed Result Preview & Full Inline Edit Card */}
          {parsedResult && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              
              {/* Header Banner */}
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Conferência & Edição Rápida (Ajuste qualquer campo abaixo)
                </div>
                <button
                  onClick={() => setParsedResult(null)}
                  className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Falar de Novo
                </button>
              </div>

              {/* Order index conflict warning */}
              {orderWarning && (
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-xs space-y-2.5 shadow-sm">
                  <div className="flex items-start gap-2 font-medium">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span>{orderWarning}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setOrderIndex(nextDefaultOrder);
                        setOrderWarning(null);
                      }}
                      className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-sm active:scale-95"
                    >
                      ⚡ Ajustar para Sequência (#{nextDefaultOrder})
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderWarning(null)}
                      className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-100"
                    >
                      ✅ Manter #{orderIndex} (Confirmar)
                    </button>
                  </div>
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
                      placeholder="Ex: Princesa, Lulu, Bob..."
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
                      placeholder="Ex: SRD, Poodle..."
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
                      placeholder="Ex: 2"
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
                      placeholder="Ex: 1 ano"
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
                      placeholder="Descreva a intercorrência (ex: Hipotermia, Bradicardia, Hemorragia...)"
                      className="mt-2 w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 rounded-xl text-xs text-rose-900 dark:text-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  )}
                </div>

                {/* Observations */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Observações Gerais
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
