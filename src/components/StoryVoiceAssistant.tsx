import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Globe,
  Headphones,
  Loader2,
  Pause,
  Play,
  Square,
  Volume2,
} from 'lucide-react';
import { LANGUAGE_OPTIONS, TRANSLATIONS } from '../i18n/translations';
import { AppLanguage } from '../types/story';

export interface StoryVoiceAssistantProps {
  title: string;
  text: string;
  appLanguage: AppLanguage;
  sourceLanguage?: AppLanguage;
  tone?: string;
  compact?: boolean;
}

type NarratorVoice = 'Kore' | 'Zephyr' | 'Puck' | 'Charon' | 'Fenrir';

const NARRATOR_VOICES: { id: NarratorVoice; label: string; style: string }[] = [
  { id: 'Kore', label: 'Kore', style: 'Warm Storyteller' },
  { id: 'Zephyr', label: 'Zephyr', style: 'Calm & Clear' },
  { id: 'Puck', label: 'Puck', style: 'Lively Narrator' },
  { id: 'Charon', label: 'Charon', style: 'Deep Dramatic' },
  { id: 'Fenrir', label: 'Fenrir', style: 'Bold Epic' },
];

const BCP47_MAP: Record<AppLanguage, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  bn: 'bn-IN',
  ta: 'ta-IN',
  mr: 'mr-IN',
  te: 'te-IN',
};

const PLAYBACK_SPEEDS = [0.85, 1.0, 1.15, 1.25] as const;

function splitIntoChunks(rawText: string, maxChars = 1350): string[] {
  const cleaned = rawText.trim();
  if (!cleaned) return [];

  const paragraphs = cleaned
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = '';

  for (const para of paragraphs) {
    if ((current + '\n\n' + para).length <= maxChars) {
      current = current ? `${current}\n\n${para}` : para;
    } else {
      if (current) chunks.push(current);
      if (para.length <= maxChars) {
        current = para;
      } else {
        // Split extra-long single paragraph cleanly by sentences
        const sentences = para.match(/[^.!?।॥]+[.!?।॥]*/g) ?? [para];
        let buf = '';
        for (const sent of sentences) {
          if ((buf + ' ' + sent).length <= maxChars) {
            buf = buf ? `${buf} ${sent.trim()}` : sent.trim();
          } else {
            if (buf) chunks.push(buf);
            buf = sent.trim();
          }
        }
        current = buf;
      }
    }
  }
  if (current) chunks.push(current);
  return chunks.length > 0 ? chunks : [cleaned.slice(0, maxChars)];
}

export function StoryVoiceAssistant({
  title,
  text,
  appLanguage,
  sourceLanguage,
  tone,
  compact = false,
}: StoryVoiceAssistantProps) {
  const t = TRANSLATIONS[appLanguage];

  const [voiceLanguage, setVoiceLanguage] = useState<AppLanguage>(appLanguage);
  const [narratorVoice, setNarratorVoice] = useState<NarratorVoice>('Kore');
  const [speed, setSpeed] = useState<number>(1.0);
  const [engineMode, setEngineMode] = useState<'ai' | 'browser'>('ai');

  const chunks = useMemo(() => splitIntoChunks(text), [text]);
  const [currentChunkIdx, setCurrentChunkIdx] = useState(0);

  const [status, setStatus] = useState<'idle' | 'loading' | 'playing' | 'paused'>('idle');
  const [activeEngineUsed, setActiveEngineUsed] = useState<'ai' | 'browser' | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [adaptedPreview, setAdaptedPreview] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const playbackRunIdRef = useRef(0);
  const speedRef = useRef(speed);
  speedRef.current = speed;
  const playChunkRef = useRef<
    ((chunkIdx: number, overrideEngine?: 'ai' | 'browser', overrideLang?: AppLanguage, overrideVoice?: NarratorVoice) => Promise<void>) | null
  >(null);

  // Keep default voice language synced when global app language changes while idle
  useEffect(() => {
    if (status === 'idle') {
      setVoiceLanguage(appLanguage);
    }
  }, [appLanguage, status]);

  const stopAllAudio = useCallback(() => {
    playbackRunIdRef.current += 1;

    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      utteranceRef.current = null;
    }
  }, []);

  // Stop & reset when story text changes or component unmounts
  useEffect(() => {
    stopAllAudio();
    setStatus('idle');
    setCurrentChunkIdx(0);
    setAdaptedPreview(null);
    setNotice(null);
    setActiveEngineUsed(null);
    return () => {
      stopAllAudio();
    };
  }, [text, title, stopAllAudio]);

  // Apply playback rate dynamically while playing AI audio
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, [speed]);

  const playWithBrowserSpeech = useCallback(
    (
      spokenText: string,
      chunkIdx: number,
      runId: number,
      chosenLang: AppLanguage,
      customNotice?: string
    ) => {
      if (
        typeof window === 'undefined' ||
        !('speechSynthesis' in window) ||
        typeof SpeechSynthesisUtterance === 'undefined'
      ) {
        setStatus('idle');
        setNotice('Browser speech synthesis is unavailable on this device.');
        return;
      }

      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
      const bcpTag = BCP47_MAP[chosenLang] || 'en-IN';
      const baseLang = bcpTag.split('-')[0];
      const voices = window.speechSynthesis.getVoices();
      const matchedVoice =
        voices.find((v) => v.lang.toLowerCase() === bcpTag.toLowerCase()) ||
        voices.find((v) => v.lang.toLowerCase().startsWith(baseLang)) ||
        voices.find((v) => v.default);

      const utterance = new SpeechSynthesisUtterance(spokenText);
      utterance.lang = bcpTag;
      if (matchedVoice) utterance.voice = matchedVoice;
      utterance.rate = speedRef.current;

      utterance.onend = () => {
        if (playbackRunIdRef.current !== runId) return;
        const nextIdx = chunkIdx + 1;
        if (nextIdx < chunks.length) {
          void playChunkRef.current?.(nextIdx, 'browser', chosenLang);
        } else {
          setStatus('idle');
          setCurrentChunkIdx(0);
        }
      };

      utterance.onerror = () => {
        if (playbackRunIdRef.current !== runId) return;
        setStatus('idle');
      };

      utteranceRef.current = utterance;
      setActiveEngineUsed('browser');
      if (customNotice) setNotice(customNotice);
      setStatus('playing');
      window.speechSynthesis.speak(utterance);
    },
    [chunks.length]
  );

  const playChunk = useCallback(
    async (
      chunkIdx: number,
      overrideEngine?: 'ai' | 'browser',
      overrideLang?: AppLanguage,
      overrideVoice?: NarratorVoice
    ) => {
      if (chunks.length === 0) return;
      const safeIdx = Math.max(0, Math.min(chunkIdx, chunks.length - 1));
      const chunkText = chunks[safeIdx];
      const chosenLang = overrideLang ?? voiceLanguage;
      const chosenEngine = overrideEngine ?? engineMode;
      const chosenVoice = overrideVoice ?? narratorVoice;

      stopAllAudio();
      const runId = ++playbackRunIdRef.current;
      setCurrentChunkIdx(safeIdx);
      setNotice(null);

      // Include title only on the very first part
      const textPayload =
        safeIdx === 0 && title.trim() ? `${title.trim()}.\n\n${chunkText}` : chunkText;

      if (chosenEngine === 'browser') {
        playWithBrowserSpeech(
          textPayload,
          safeIdx,
          runId,
          chosenLang,
          t.voice.browserFallbackNote
        );
        return;
      }

      setStatus('loading');

      try {
        const res = await fetch('/api/voice/read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: textPayload,
            title,
            targetLanguage: chosenLang,
            sourceLanguage: sourceLanguage ?? appLanguage,
            voiceName: chosenVoice,
            tone,
          }),
        });

        if (playbackRunIdRef.current !== runId) return;

        const data = await res.json().catch(() => null);

        if (!res.ok || !data?.audioBase64) {
          const fallbackText =
            typeof data?.spokenText === 'string' && data.spokenText.trim()
              ? data.spokenText.trim()
              : textPayload;
          if (data?.translated && typeof data?.spokenText === 'string') {
            setAdaptedPreview(data.spokenText);
          }
          const reason =
            typeof data?.error === 'string' && data.error.trim()
              ? data.error
              : t.voice.browserFallbackNote;
          playWithBrowserSpeech(fallbackText, safeIdx, runId, chosenLang, reason);
          return;
        }

        if (data.translated && typeof data.spokenText === 'string') {
          setAdaptedPreview(data.spokenText);
        } else {
          setAdaptedPreview(null);
        }

        // Convert base64 WAV to Blob URL for reliable browser audio playback
        const binaryStr = atob(data.audioBase64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        const wavBlob = new Blob([bytes], { type: data.mimeType || 'audio/wav' });
        const url = URL.createObjectURL(wavBlob);
        objectUrlRef.current = url;

        const audio = new Audio(url);
        audio.playbackRate = speedRef.current;
        audioRef.current = audio;

        audio.onended = () => {
          if (playbackRunIdRef.current !== runId) return;
          const nextIdx = safeIdx + 1;
          if (nextIdx < chunks.length) {
            void playChunkRef.current?.(nextIdx, chosenEngine, chosenLang, chosenVoice);
          } else {
            setStatus('idle');
            setCurrentChunkIdx(0);
          }
        };

        audio.onerror = () => {
          if (playbackRunIdRef.current !== runId) return;
          playWithBrowserSpeech(
            data.spokenText || textPayload,
            safeIdx,
            runId,
            chosenLang,
            t.voice.browserFallbackNote
          );
        };

        setActiveEngineUsed('ai');
        setStatus('playing');
        await audio.play();
      } catch {
        if (playbackRunIdRef.current !== runId) return;
        playWithBrowserSpeech(
          textPayload,
          safeIdx,
          runId,
          chosenLang,
          t.voice.browserFallbackNote
        );
      }
    },
    [
      chunks,
      voiceLanguage,
      engineMode,
      stopAllAudio,
      title,
      sourceLanguage,
      appLanguage,
      narratorVoice,
      tone,
      playWithBrowserSpeech,
      t.voice.browserFallbackNote,
    ]
  );

  playChunkRef.current = playChunk;

  const handlePlayPause = () => {
    if (status === 'loading') return;

    if (status === 'playing') {
      if (activeEngineUsed === 'ai' && audioRef.current) {
        audioRef.current.pause();
        setStatus('paused');
      } else if (activeEngineUsed === 'browser' && 'speechSynthesis' in window) {
        window.speechSynthesis.pause();
        setStatus('paused');
      }
      return;
    }

    if (status === 'paused') {
      if (activeEngineUsed === 'ai' && audioRef.current) {
        void audioRef.current.play();
        setStatus('playing');
      } else if (activeEngineUsed === 'browser' && 'speechSynthesis' in window) {
        window.speechSynthesis.resume();
        setStatus('playing');
      }
      return;
    }

    void playChunk(currentChunkIdx);
  };

  const handleStop = () => {
    stopAllAudio();
    setStatus('idle');
    setActiveEngineUsed(null);
  };

  const handleLanguageChange = (nextLang: AppLanguage) => {
    setVoiceLanguage(nextLang);
    setAdaptedPreview(null);
    if (status === 'playing' || status === 'paused') {
      void playChunk(currentChunkIdx, engineMode, nextLang);
    }
  };

  const handleEngineSwitch = (nextEngine: 'ai' | 'browser') => {
    setEngineMode(nextEngine);
    if (status === 'playing' || status === 'paused') {
      void playChunk(currentChunkIdx, nextEngine, voiceLanguage);
    }
  };

  const selectedLangOption = LANGUAGE_OPTIONS.find((opt) => opt.code === voiceLanguage);

  return (
    <div
      className={`rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] ${
        compact ? 'p-3.5 sm:p-4' : 'p-4 sm:p-5'
      } space-y-3`}
      aria-label={t.voice.title}
    >
      {/* Top Row: Identity + Play Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#8B5CF6]/18 border border-[#8B5CF6]/35 flex items-center justify-center text-[var(--accent-text)] shrink-0">
            {status === 'playing' ? (
              <div className="flex items-end gap-0.5 h-3.5" aria-hidden="true">
                <span className="w-0.5 bg-[#A78BFA] rounded-full animate-pulse h-2" />
                <span className="w-0.5 bg-[#A78BFA] rounded-full animate-pulse h-3.5" />
                <span className="w-0.5 bg-[#A78BFA] rounded-full animate-pulse h-2.5" />
                <span className="w-0.5 bg-[#A78BFA] rounded-full animate-pulse h-3" />
              </div>
            ) : (
              <Headphones className="w-4 h-4" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] truncate">
                {t.voice.title}
              </span>
              {chunks.length > 1 && (
                <span className="text-[11px] font-mono tabular-figures text-[var(--accent-text)] bg-[#8B5CF6]/12 px-2 py-0.5 rounded-md">
                  {t.voice.partOf} {currentChunkIdx + 1}/{chunks.length}
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-subtle)] truncate">
              {status === 'loading'
                ? t.voice.synthesizing
                : activeEngineUsed === 'browser'
                  ? t.voice.browserVoiceLabel
                  : t.voice.subtitle}
            </p>
          </div>
        </div>

        {/* Transport Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {chunks.length > 1 && (
            <button
              type="button"
              disabled={currentChunkIdx === 0 || status === 'loading'}
              onClick={() => void playChunk(Math.max(0, currentChunkIdx - 1))}
              aria-label="Previous story part"
              className="w-8 h-8 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            disabled={!text.trim() || status === 'loading'}
            onClick={handlePlayPause}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] hover:brightness-110 disabled:opacity-55 transition-all cursor-pointer shadow-sm shadow-[#8B5CF6]/20"
          >
            {status === 'loading' ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{t.voice.synthesizing}</span>
              </>
            ) : status === 'playing' ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>{t.voice.pauseBtn}</span>
              </>
            ) : status === 'paused' ? (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>{t.voice.resumeBtn}</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5" />
                <span>{t.voice.listenBtn}</span>
              </>
            )}
          </button>

          {(status === 'playing' || status === 'paused' || status === 'loading') && (
            <button
              type="button"
              onClick={handleStop}
              aria-label={t.voice.stopBtn}
              title={t.voice.stopBtn}
              className="w-8 h-8 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-rose-400/50 flex items-center justify-center text-[var(--text-muted)] hover:text-rose-400 cursor-pointer"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
          )}

          {chunks.length > 1 && (
            <button
              type="button"
              disabled={currentChunkIdx >= chunks.length - 1 || status === 'loading'}
              onClick={() => void playChunk(Math.min(chunks.length - 1, currentChunkIdx + 1))}
              aria-label="Next story part"
              className="w-8 h-8 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Controls Bar: Voice Language, Narrator, Speed, Engine */}
      <div className="pt-2.5 border-t border-[var(--border-subtle)] flex flex-wrap items-center gap-2.5 text-xs">
        <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)]">
          <Globe className="w-3.5 h-3.5 text-[var(--accent-text)] shrink-0" />
          <span className="text-[var(--text-subtle)]">{t.voice.readLanguage}:</span>
          <select
            value={voiceLanguage}
            onChange={(e) => handleLanguageChange(e.target.value as AppLanguage)}
            aria-label={t.voice.readLanguage}
            className="bg-transparent font-medium text-[var(--text-primary)] focus:outline-none cursor-pointer"
          >
            {LANGUAGE_OPTIONS.map((opt) => (
              <option
                key={opt.code}
                value={opt.code}
                className="bg-[var(--bg-surface)] text-[var(--text-primary)]"
              >
                {opt.nativeName} ({opt.englishName})
              </option>
            ))}
          </select>
        </label>

        {engineMode === 'ai' && (
          <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)]">
            <span className="text-[var(--text-subtle)]">{t.voice.narratorVoice}:</span>
            <select
              value={narratorVoice}
              onChange={(e) => {
                const nextVoice = e.target.value as NarratorVoice;
                setNarratorVoice(nextVoice);
                if (status === 'playing' || status === 'paused') {
                  void playChunk(currentChunkIdx, engineMode, voiceLanguage, nextVoice);
                }
              }}
              aria-label={t.voice.narratorVoice}
              className="bg-transparent font-medium text-[var(--text-primary)] focus:outline-none cursor-pointer"
            >
              {NARRATOR_VOICES.map((v) => (
                <option
                  key={v.id}
                  value={v.id}
                  className="bg-[var(--bg-surface)] text-[var(--text-primary)]"
                >
                  {v.label} · {v.style}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)]">
          <span className="text-[var(--text-subtle)]">{t.voice.speed}:</span>
          <select
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            aria-label={t.voice.speed}
            className="bg-transparent font-mono font-medium text-[var(--text-primary)] focus:outline-none cursor-pointer"
          >
            {PLAYBACK_SPEEDS.map((spd) => (
              <option
                key={spd}
                value={spd}
                className="bg-[var(--bg-surface)] text-[var(--text-primary)]"
              >
                {spd}x
              </option>
            ))}
          </select>
        </label>

        <div className="inline-flex items-center rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-0.5 ml-auto">
          <button
            type="button"
            onClick={() => handleEngineSwitch('ai')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
              engineMode === 'ai'
                ? 'bg-[#8B5CF6] text-white'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            {t.voice.aiVoiceLabel}
          </button>
          <button
            type="button"
            onClick={() => handleEngineSwitch('browser')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
              engineMode === 'browser'
                ? 'bg-[#8B5CF6] text-white'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            {t.voice.browserVoiceLabel}
          </button>
        </div>
      </div>

      {notice && (
        <p className="text-xs text-[var(--text-subtle)] leading-relaxed">{notice}</p>
      )}

      {adaptedPreview && (
        <div className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3 text-xs space-y-1">
          <div className="font-semibold text-[var(--accent-text)]">
            {t.voice.translatedNotice} {selectedLangOption?.nativeName}
          </div>
          <p className="text-[var(--text-muted)] leading-relaxed max-h-28 overflow-y-auto whitespace-pre-wrap">
            {adaptedPreview}
          </p>
        </div>
      )}
    </div>
  );
}
