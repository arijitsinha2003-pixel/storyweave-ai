import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Mic, Square, X } from 'lucide-react';
import { AppLanguage } from '../types/story';

const BCP47_MAP: Record<AppLanguage, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  bn: 'bn-IN',
  ta: 'ta-IN',
  mr: 'mr-IN',
  te: 'te-IN',
};

const MAX_RECORDING_SECONDS = 60;

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
}

interface SpeechRecognitionErrorEventLike {
  error?: string;
}

interface SpeechRecognitionInstanceLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort?: () => void;
}

type SpeechRecognitionConstructorLike = new () => SpeechRecognitionInstanceLike;

function getSpeechRecognitionCtor(): SpeechRecognitionConstructorLike | null {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructorLike;
    webkitSpeechRecognition?: SpeechRecognitionConstructorLike;
  };
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
}

function getPreferredAudioMimeType(): string {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    return 'audio/webm';
  }
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    'audio/ogg',
  ];
  for (const mime of candidates) {
    if (MediaRecorder.isTypeSupported(mime)) {
      return mime;
    }
  }
  return '';
}

function formatSeconds(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function appendDictatedText(existing: string, spoken: string): string {
  const cleanSpoken = spoken.trim();
  if (!cleanSpoken) return existing;
  if (!existing.trim()) return cleanSpoken;
  const needsSpace = !/[\s\n]$/.test(existing);
  return needsSpace ? `${existing} ${cleanSpoken}` : `${existing}${cleanSpoken}`;
}

export interface VoiceDictationButtonProps {
  language: AppLanguage;
  onTranscript: (spokenText: string) => void;
  contextHint?: string;
  compact?: boolean;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export function VoiceDictationButton({
  language,
  onTranscript,
  contextHint,
  compact = false,
  disabled = false,
  label = 'Speak',
  className = '',
}: VoiceDictationButtonProps) {
  const [mode, setMode] = useState<'idle' | 'listening' | 'recording' | 'transcribing'>('idle');
  const [interimText, setInterimText] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;

  const recognitionRef = useRef<SpeechRecognitionInstanceLike | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const unmountedRef = useRef(false);
  const receivedSpeechChunkRef = useRef(false);
  const stopIntentRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopMediaStream = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  const cleanupAll = useCallback(() => {
    stopIntentRef.current = true;
    clearTimer();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch {
        // Ignore teardown errors
      }
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current) {
      try {
        if (mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
      } catch {
        // Ignore teardown errors
      }
      mediaRecorderRef.current = null;
    }
    stopMediaStream();
    audioChunksRef.current = [];
  }, [clearTimer, stopMediaStream]);

  useEffect(() => {
    unmountedRef.current = false;
    return () => {
      unmountedRef.current = true;
      cleanupAll();
    };
  }, [cleanupAll]);

  const transcribeAudioBlob = useCallback(
    async (blob: Blob, mimeType: string) => {
      if (unmountedRef.current) return;
      if (blob.size < 256) {
        setMode('idle');
        setErrorMsg('No audio captured. Please speak clearly and try again.');
        return;
      }

      setMode('transcribing');
      setErrorMsg(null);

      try {
        const base64Audio = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === 'string') {
              resolve(reader.result);
            } else {
              reject(new Error('Could not read recorded audio.'));
            }
          };
          reader.onerror = () => reject(new Error('Failed to read recorded audio.'));
          reader.readAsDataURL(blob);
        });

        const res = await fetch('/api/voice/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64: base64Audio,
            mimeType: mimeType || blob.type || 'audio/webm',
            language,
            contextHint,
          }),
        });

        const data = (await res.json().catch(() => null)) as {
          transcript?: string;
          error?: string;
        } | null;

        if (unmountedRef.current) return;

        if (!res.ok) {
          throw new Error(data?.error || 'Voice transcription failed.');
        }

        const transcript = (data?.transcript ?? '').trim();
        if (!transcript) {
          setErrorMsg('No clear speech detected. Please try speaking closer to the mic.');
        } else {
          onTranscriptRef.current(transcript);
        }
      } catch (err) {
        if (!unmountedRef.current) {
          setErrorMsg(
            err instanceof Error ? err.message : 'Unable to transcribe audio right now.'
          );
        }
      } finally {
        if (!unmountedRef.current) {
          setMode('idle');
          setElapsedSeconds(0);
        }
      }
    },
    [language, contextHint]
  );

  const startAudioRecordingFallback = useCallback(async () => {
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getUserMedia !== 'function' ||
      typeof MediaRecorder === 'undefined'
    ) {
      setMode('idle');
      setErrorMsg('Microphone recording is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (unmountedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      mediaStreamRef.current = stream;
      audioChunksRef.current = [];
      const chosenMime = getPreferredAudioMimeType();
      const recorder = chosenMime
        ? new MediaRecorder(stream, { mimeType: chosenMime })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        clearTimer();
        stopMediaStream();
        const finalMime = recorder.mimeType || chosenMime || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: finalMime });
        audioChunksRef.current = [];
        mediaRecorderRef.current = null;
        if (!unmountedRef.current) {
          void transcribeAudioBlob(blob, finalMime);
        }
      };

      recorder.onerror = () => {
        clearTimer();
        stopMediaStream();
        mediaRecorderRef.current = null;
        if (!unmountedRef.current) {
          setMode('idle');
          setErrorMsg('Microphone recording encountered an error.');
        }
      };

      setElapsedSeconds(0);
      setErrorMsg(null);
      setMode('recording');
      recorder.start(250);

      timerRef.current = window.setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1;
          if (next >= MAX_RECORDING_SECONDS && mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop();
          }
          return next;
        });
      }, 1000);
    } catch (err) {
      stopMediaStream();
      setMode('idle');
      const name = err instanceof Error ? err.name : '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setErrorMsg('Microphone permission denied. Please enable mic access in your browser.');
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setErrorMsg('No microphone detected on this device.');
      } else {
        setErrorMsg('Could not access microphone.');
      }
    }
  }, [clearTimer, stopMediaStream, transcribeAudioBlob]);

  const startDictation = useCallback(() => {
    setErrorMsg(null);
    setInterimText('');
    stopIntentRef.current = false;
    receivedSpeechChunkRef.current = false;

    const SpeechRecognitionCtor = getSpeechRecognitionCtor();
    if (!SpeechRecognitionCtor) {
      void startAudioRecordingFallback();
      return;
    }

    try {
      const recognition = new SpeechRecognitionCtor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = BCP47_MAP[language] || 'en-IN';
      recognitionRef.current = recognition;

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        if (unmountedRef.current) return;
        let finalChunk = '';
        let interimChunk = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const text = result[0]?.transcript ?? '';
          if (!text) continue;
          if (result.isFinal) {
            finalChunk += `${text} `;
          } else {
            interimChunk += text;
          }
        }

        if (finalChunk.trim()) {
          receivedSpeechChunkRef.current = true;
          onTranscriptRef.current(finalChunk.trim());
        }
        setInterimText(interimChunk.trim());
      };

      recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
        if (unmountedRef.current) return;
        const code = event.error || '';
        recognitionRef.current = null;

        if (code === 'not-allowed' || code === 'permission-denied') {
          setMode('idle');
          setInterimText('');
          setErrorMsg('Microphone permission denied. Please enable mic access in your browser.');
          return;
        }

        // If browser SpeechRecognition network/service fails before capturing text, fall back to Gemini audio transcription
        if (
          !receivedSpeechChunkRef.current &&
          (code === 'network' ||
            code === 'service-not-allowed' ||
            code === 'language-not-supported' ||
            code === 'audio-capture')
        ) {
          setInterimText('');
          void startAudioRecordingFallback();
          return;
        }

        if (code !== 'aborted' && code !== 'no-speech') {
          setErrorMsg('Voice recognition stopped unexpectedly. Please try again.');
        }
        setMode('idle');
        setInterimText('');
      };

      recognition.onend = () => {
        if (unmountedRef.current) return;
        recognitionRef.current = null;
        setInterimText('');
        setMode((current) => (current === 'listening' ? 'idle' : current));
      };

      setMode('listening');
      recognition.start();
    } catch {
      recognitionRef.current = null;
      void startAudioRecordingFallback();
    }
  }, [language, startAudioRecordingFallback]);

  const stopDictation = useCallback(() => {
    stopIntentRef.current = true;
    clearTimer();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        recognitionRef.current = null;
      }
      setInterimText('');
      setMode('idle');
      return;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      return;
    }

    stopMediaStream();
    setMode('idle');
  }, [clearTimer, stopMediaStream]);

  const handleToggle = () => {
    if (disabled || mode === 'transcribing') return;
    if (mode === 'listening' || mode === 'recording') {
      stopDictation();
    } else {
      startDictation();
    }
  };

  const isActive = mode === 'listening' || mode === 'recording';
  const isBusy = mode === 'transcribing';

  return (
    <div className={`inline-flex flex-col items-end gap-1 ${className}`}>
      <div className="inline-flex items-center gap-1.5">
        {isActive && interimText && !compact && (
          <span
            className="max-w-[180px] sm:max-w-[240px] truncate text-[11px] italic text-[var(--accent-text)] bg-[#8B5CF6]/10 border border-[#8B5CF6]/25 px-2 py-0.5 rounded-md"
            title={interimText}
          >
            &ldquo;{interimText}&rdquo;
          </span>
        )}

        <button
          type="button"
          disabled={disabled || isBusy}
          onClick={handleToggle}
          aria-pressed={isActive}
          aria-label={
            isBusy
              ? 'Transcribing speech'
              : isActive
                ? 'Stop voice dictation'
                : `Voice input (${label})`
          }
          title={
            isBusy
              ? 'Transcribing voice...'
              : isActive
                ? 'Click to stop dictation'
                : 'Dictate with microphone'
          }
          className={`inline-flex items-center gap-1.5 rounded-lg font-medium transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
            compact ? 'px-2 py-1 text-[11px]' : 'px-2.5 py-1.5 text-xs'
          } ${
            isActive
              ? 'bg-rose-500/15 border border-rose-500/50 text-rose-600 dark:text-rose-300 shadow-sm shadow-rose-500/15'
              : isBusy
                ? 'bg-[#8B5CF6]/15 border border-[#8B5CF6]/45 text-[var(--accent-text)]'
                : 'bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[#8B5CF6]/55'
          }`}
        >
          {isBusy ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent-text)] shrink-0" />
              {!compact && <span>Transcribing...</span>}
            </>
          ) : isActive ? (
            <>
              <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
              </span>
              <Square className="w-3 h-3 shrink-0 fill-current" />
              <span>
                {mode === 'recording'
                  ? compact
                    ? formatSeconds(elapsedSeconds)
                    : `Stop (${formatSeconds(elapsedSeconds)})`
                  : compact
                    ? 'Stop'
                    : 'Listening...'}
              </span>
            </>
          ) : (
            <>
              <Mic className="w-3.5 h-3.5 text-[var(--accent-text)] shrink-0" />
              {!compact && <span>{label}</span>}
            </>
          )}
        </button>
      </div>

      {errorMsg && (
        <div
          role="status"
          className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 px-2.5 py-1 text-[11px] text-rose-700 dark:text-rose-200 max-w-xs"
        >
          <span className="leading-snug">{errorMsg}</span>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            aria-label="Dismiss microphone error"
            className="text-rose-500 hover:text-rose-300 shrink-0 cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}
