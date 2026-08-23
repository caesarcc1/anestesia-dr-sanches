'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ParsedVoiceResult, SpeciesType, SexType, ProcedureType, AnesthesiaDrugCode, PostMedCode, ANESTHESIA_DRUGS, POST_MEDS } from '@/types';
import { Mic, MicOff, Sparkles, Check, RefreshCw, X, Volume2, AlertCircle, AlertTriangle, Dog, Cat, ArrowRight, Type } from 'lucide-react';
import confetti from 'canvas-confetti';

interface VoiceRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmRecord: (parsed: ParsedVoiceResult) => void;
  sessionId: string;
}

export function VoiceRecorderModal({
  isOpen,
  onClose,
  onConfirmRecord,
  sessionId,
}: VoiceRecorderModalProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [manualInputText, setManualInputText] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParsedVoiceResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const liveTranscriptRef = useRef('');

  // Exemplos rápidos para testes com 1 toque
  const SAMPLE_VOICE_PROMPTS = [
    'Canino fêmea Pitbull Mel 18kg 3 anos chip 982000456 Propofol Isoflurano Meloxicam Dipirona OSH sem intercorrências',
    'Felino macho Siamês Mingau 4kg 1 ano Quetamina Xilazina Meloxicam ORQ tudo tranquilo',
    'Canino fêmea SRD Frida 8kg 5 anos Propofol Quetamina Transamin Agemoxi Dipirona OSH sangramento leve controlado',
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
      // Se não der pelo MediaRecorder, tenta SpeechRecognition sozinho
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
      // Se já temos a transcrição do navegador, enviamos o texto diretamente para resposta ultrarrápida
      if (textTranscript && textTranscript.trim().length > 3) {
        await handleProcessText(textTranscript);
        return;
      }

      // Caso contrário, enviamos o áudio base64
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
          setParsedResult(data.data);
          setLiveTranscript(data.data.raw_transcription || 'Áudio processado com sucesso');
        } else {
          setErrorMsg(data.error || 'Não foi possível extrair os dados do áudio.');
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
        setParsedResult(data.data);
      } else {
        setErrorMsg(data.error || 'Erro ao processar texto.');
      }
    } catch (err: any) {
      setErrorMsg('Erro de conexão ao processar.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmAndSave = () => {
    if (!parsedResult) return;

    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch {}

    onConfirmRecord(parsedResult);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-vica-teal text-white shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                Cadastro por Comando de Voz
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Fale os dados do animal naturalmente
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
                    Ex: <span className="italic font-medium">"Canino fêmea Pitbull Mel 15kg Propofol e Queta OSH sem intercorrências"</span>
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
                      placeholder="Ex: Canino macho Thor 12kg Propofol ORQ..."
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

          {/* Parsed Result Preview Card */}
          {parsedResult && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold">
                  <Check className="w-4 h-4 text-emerald-600" />
                  Dados Extraídos com Sucesso!
                </div>
                <button
                  onClick={() => setParsedResult(null)}
                  className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Falar Novamente
                </button>
              </div>

              {/* Patient Visual Summary Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-start justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-3">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                      {parsedResult.patient_name || 'Paciente'}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 mt-0.5 flex-wrap">
                      <span>Raça: <strong>{parsedResult.breed || 'SRD'}</strong></span>
                      <span>•</span>
                      <span>Peso: <strong>{parsedResult.weight_kg ? `${parsedResult.weight_kg} kg` : 'Não inf.'}</strong></span>
                      {parsedResult.age && (
                        <>
                          <span>•</span>
                          <span>Idade: <strong>{parsedResult.age}</strong></span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
                      {parsedResult.species}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-full text-xs font-bold bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-200">
                      {parsedResult.sex}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200">
                      {parsedResult.procedure_type}
                    </span>
                  </div>
                </div>

                {/* Drugs preview */}
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold uppercase text-[10px] block">Anestesia:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {parsedResult.anesthesia_drugs && parsedResult.anesthesia_drugs.length > 0 ? (
                        parsedResult.anesthesia_drugs.map(code => (
                          <span key={code} className="px-2 py-0.5 rounded-md font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">
                            [{code}] {ANESTHESIA_DRUGS[code]?.name || code}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 italic">Nenhum detectado</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 font-semibold uppercase text-[10px] block">Pós-Operatório:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {parsedResult.post_meds && parsedResult.post_meds.length > 0 ? (
                        parsedResult.post_meds.map(code => (
                          <span key={code} className="px-2 py-0.5 rounded-md font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300">
                            [{code}] {POST_MEDS[code]?.name || code}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 italic">Nenhum</span>
                      )}
                    </div>
                  </div>

                  {parsedResult.has_complication && (
                    <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200">
                      <strong>⚠️ Intercorrência:</strong> {parsedResult.complication_notes || 'Identificada no áudio'}
                    </div>
                  )}

                  {parsedResult.observations && !parsedResult.has_complication && (
                    <div className="text-slate-500 dark:text-slate-400 italic">
                      Obs: {parsedResult.observations}
                    </div>
                  )}
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
