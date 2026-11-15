import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Check,
  Copy,
  Edit3,
  Feather,
  FileDown,
  Loader2,
  RefreshCw,
  Save,
  Users,
} from 'lucide-react';
import { getLanguageNameForAI, TRANSLATIONS } from '../i18n/translations';
import { StoryVoiceAssistant } from './StoryVoiceAssistant';
import { VoiceDictationButton, appendDictatedText } from './VoiceDictationButton';
import {
  GeneratedCharacterDetail,
  StoryRecord,
  WorkspacePreferences,
} from '../types/story';

interface StoryGeneratorProps {
  preferences: WorkspacePreferences;
  activeStory: StoryRecord | null;
  onSaveStory: (story: StoryRecord) => Promise<void> | void;
  onOpenLibrary: () => void;
}

const GENRES = [
  'Folklore & Magical Realism',
  'Indian Contemporary Drama',
  'Mythological Retelling',
  'Historical Sci-Fi',
  'Literary Fantasy',
  'Sci-Fi Mystery',
  'Historical Noir',
  'Psychological Thriller',
  'Speculative Romance',
];

const TONES = [
  'Atmospheric',
  'Suspenseful',
  'Heartfelt',
  'Witty',
  'Melancholic',
  'Epic',
  'Whimsical',
];

const WRITING_STYLES = [
  'Lyrical Prose',
  'Crisp & Cinematic',
  'Intimate First-Person',
  'Omniscient Classic',
  'Minimalist Literary',
];

const PROMPT_STARTERS = [
  'A late-night tea seller near Howrah Bridge discovers that every monsoon train leaves behind an unsigned letter addressed to someone in Kolkata.',
  'Inside an ancient Jaipur stepwell, a conservation architect uncovers stone acoustics that echo conversations from three centuries ago.',
  'During Onam dusk on the Kerala backwaters, a boatman pulls up a brass lantern that illuminates memories rather than water.',
];

export function StoryGenerator({
  preferences,
  activeStory,
  onSaveStory,
  onOpenLibrary,
}: StoryGeneratorProps) {
  const t = TRANSLATIONS[preferences.language];

  const [idea, setIdea] = useState(activeStory?.idea ?? '');
  const [genre, setGenre] = useState(activeStory?.genre ?? GENRES[0]);
  const [tone, setTone] = useState(activeStory?.tone ?? preferences.defaultTone);
  const [writingStyle, setWritingStyle] = useState(
    activeStory?.writingStyle ?? WRITING_STYLES[0]
  );
  const [length, setLength] = useState<'Short' | 'Medium' | 'Long'>(() => {
    if (activeStory?.lengthLabel?.startsWith('Short')) return 'Short';
    if (activeStory?.lengthLabel?.startsWith('Long')) return 'Long';
    return preferences.defaultLength;
  });

  const [draft, setDraft] = useState<StoryRecord | null>(activeStory);
  const [isEditing, setIsEditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfSavedNotice, setPdfSavedNotice] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const prevActiveStoryRef = useRef<StoryRecord | null>(activeStory);
  const draftRef = useRef<StoryRecord | null>(draft);
  draftRef.current = draft;
  const abortControllerRef = useRef<AbortController | null>(null);
  const copyTimerRef = useRef<number | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const pdfTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current);
      if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
      if (pdfTimerRef.current !== null) window.clearTimeout(pdfTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const prev = prevActiveStoryRef.current;
    prevActiveStoryRef.current = activeStory;
    const currentDraft = draftRef.current;

    if (activeStory === prev) {
      if (!activeStory && !currentDraft) {
        setTone(preferences.defaultTone);
        setLength(preferences.defaultLength);
      }
      return;
    }

    if (activeStory) {
      const isSameDraftSave =
        currentDraft !== null &&
        activeStory.id === currentDraft.id &&
        activeStory.title === currentDraft.title &&
        activeStory.narrative === currentDraft.narrative;

      setDraft(activeStory);
      setIdea(activeStory.idea ?? activeStory.description);
      setGenre(activeStory.genre || GENRES[0]);
      setTone(activeStory.tone || preferences.defaultTone);
      setWritingStyle(activeStory.writingStyle || WRITING_STYLES[0]);
      if (activeStory.lengthLabel?.startsWith('Short')) setLength('Short');
      else if (activeStory.lengthLabel?.startsWith('Long')) setLength('Long');
      else setLength('Medium');

      if (!isSameDraftSave) {
        setIsEditing(false);
        setError(null);
        setSavedNotice(false);
        setPdfSavedNotice(false);
        setPdfError(null);
      }
    } else if (prev !== null) {
      // Reset cleanly when switching from an opened/saved story to "+ New Story"
      setDraft(null);
      setIdea('');
      setGenre(GENRES[0]);
      setTone(preferences.defaultTone);
      setWritingStyle(WRITING_STYLES[0]);
      setLength(preferences.defaultLength);
      setIsEditing(false);
      setError(null);
      setSavedNotice(false);
      setPdfSavedNotice(false);
      setPdfError(null);
    }
  }, [activeStory, preferences.defaultLength, preferences.defaultTone]);

  const genreOptions = GENRES.includes(genre) ? GENRES : [genre, ...GENRES];
  const toneOptions = TONES.includes(tone) ? TONES : [tone, ...TONES];
  const styleOptions = WRITING_STYLES.includes(writingStyle)
    ? WRITING_STYLES
    : [writingStyle, ...WRITING_STYLES];

  const computeWordCount = (text: string) =>
    text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;

  const handleGenerate = async (
    e?: React.FormEvent,
    options?: { regenerate?: boolean }
  ) => {
    if (e) e.preventDefault();

    const trimmedIdea = idea.trim();
    if (trimmedIdea.length < 5) {
      setError('Please describe your story idea (at least 5 characters) before generating.');
      return;
    }

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeoutId = window.setTimeout(() => controller.abort(), 100000);

    setIsGenerating(true);
    setError(null);
    setSavedNotice(false);
    setIsEditing(false);

    const isSameDraftIdea = Boolean(draft && (draft.idea ?? '').trim() === trimmedIdea);
    const keepExistingDraftId = Boolean(options?.regenerate || isSameDraftIdea);

    try {
      const response = await fetch('/api/stories/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          idea: trimmedIdea,
          genre,
          tone,
          writingStyle,
          length,
          language: preferences.language,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.story) {
        throw new Error(payload?.error || 'Unable to generate story right now.');
      }

      const generated = payload.story;
      const charDetails: GeneratedCharacterDetail[] = Array.isArray(generated.characters)
        ? generated.characters
        : [];
      const cleanNarrative = String(generated.narrative ?? '')
        .replace(/\r\n/g, '\n')
        .replace(/\\n/g, '\n')
        .trim();

      const nextRecord: StoryRecord = {
        id: keepExistingDraftId && draft?.id ? draft.id : `story-${Date.now()}`,
        idea: trimmedIdea,
        title: String(generated.title ?? 'Untitled Story').trim(),
        description: String(generated.description ?? '').trim(),
        genre: String(generated.genre ?? genre),
        tone: String(generated.tone ?? tone),
        writingStyle: String(generated.writingStyle ?? writingStyle),
        lengthLabel: String(generated.lengthLabel ?? `${length} Story`),
        language: preferences.language,
        wordCount: generated.wordCount ?? computeWordCount(cleanNarrative),
        narrative: cleanNarrative,
        conflict: String(generated.conflict ?? '').trim(),
        climax: String(generated.climax ?? '').trim(),
        resolution: String(generated.resolution ?? '').trim(),
        characters: charDetails.map((c) => c.name),
        characterDetails: charDetails,
        coverImage: keepExistingDraftId ? draft?.coverImage : undefined,
        updatedAt: new Date().toLocaleDateString('en-IN', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
      };

      setDraft(nextRecord);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError(
          'Story generation timed out while waiting for the AI response. Please try again or choose Short/Medium length.'
        );
        return;
      }
      const msg = err instanceof Error ? err.message : 'Unexpected error while generating story.';
      setError(msg);
    } finally {
      window.clearTimeout(timeoutId);
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!draft) return;
    const formatted = [
      draft.title,
      `${draft.genre} · ${draft.tone} · ${draft.writingStyle}`,
      '',
      draft.description,
      '',
      draft.narrative,
      '',
      `${t.storyGen.conflict}: ${draft.conflict}`,
      `${t.storyGen.climax}: ${draft.climax}`,
      `${t.storyGen.resolution}: ${draft.resolution}`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(formatted);
      setCopied(true);
      if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current);
      copyTimerRef.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Clipboard copy failed. You can select and copy the text directly.');
    }
  };

  const handleSave = async () => {
    if (!draft) return;
    setError(null);
    const updatedStory: StoryRecord = {
      ...draft,
      wordCount: computeWordCount(draft.narrative),
      updatedAt: new Date().toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    };
    setDraft(updatedStory);
    try {
      await onSaveStory(updatedStory);
      setSavedNotice(true);
      if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = window.setTimeout(() => setSavedNotice(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save story right now.');
    }
  };

  const handleSaveAsPdf = async () => {
    if (!draft || isExportingPdf) return;
    setPdfError(null);
    setIsExportingPdf(true);
    try {
      const { exportStoryToPdf } = await import('../utils/exportStoryPdf');
      await exportStoryToPdf({
        ...draft,
        wordCount: computeWordCount(draft.narrative),
      });
      setPdfSavedNotice(true);
      if (pdfTimerRef.current !== null) window.clearTimeout(pdfTimerRef.current);
      pdfTimerRef.current = window.setTimeout(() => setPdfSavedNotice(false), 3000);
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : 'Unable to export PDF right now.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const updateDraftField = (
    field: 'title' | 'description' | 'narrative' | 'conflict' | 'climax' | 'resolution',
    value: string
  ) => {
    if (!draft) return;
    setSavedNotice(false);
    setDraft({
      ...draft,
      [field]: value,
      wordCount: field === 'narrative' ? computeWordCount(value) : draft.wordCount,
    });
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[var(--accent-text)] mb-1">
            {t.storyGen.kicker} · {getLanguageNameForAI(preferences.language)}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
            {t.storyGen.title}
          </h1>
        </div>
        <button
          type="button"
          onClick={onOpenLibrary}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-[var(--text-primary)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[#8B5CF6]/50 transition-colors cursor-pointer self-start sm:self-auto whitespace-nowrap"
        >
          <BookOpen className="w-3.5 h-3.5 text-[var(--accent-text)]" />
          <span>{t.storyGen.openLibrary}</span>
        </button>
      </div>

      {/* Main Split Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-7 items-start">
        {/* Left: Generator Brief Form */}
        <form
          onSubmit={handleGenerate}
          className="xl:col-span-5 glass-surface rounded-2xl p-6 space-y-5"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <label
                htmlFor="story-idea"
                className="text-sm font-semibold text-[var(--text-primary)]"
              >
                {t.storyGen.storyIdea}
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--text-subtle)] font-mono tabular-figures">
                  {idea.trim().length} chars
                </span>
                <VoiceDictationButton
                  language={preferences.language}
                  contextHint="story idea prompt"
                  onTranscript={(spoken) => {
                    setIdea((prev) => appendDictatedText(prev, spoken));
                    if (error) setError(null);
                  }}
                />
              </div>
            </div>
            <textarea
              id="story-idea"
              rows={4}
              value={idea}
              onChange={(e) => {
                setIdea(e.target.value);
                if (error) setError(null);
              }}
              placeholder={t.storyGen.ideaPlaceholder}
              className="w-full rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[#8B5CF6] leading-relaxed resize-y"
            />
            <div className="mt-2.5 space-y-1.5">
              <div className="text-xs text-[var(--text-subtle)]">{t.storyGen.quickStarters}</div>
              <div className="flex flex-col gap-1.5">
                {PROMPT_STARTERS.map((starter, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      setIdea(starter);
                      setError(null);
                    }}
                    className="text-left text-xs text-[var(--accent-text)] hover:text-[var(--text-primary)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 transition-colors cursor-pointer line-clamp-2"
                  >
                    {starter}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-[var(--text-muted)]">
                {t.storyGen.genre}
              </span>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#8B5CF6]"
              >
                {genreOptions.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-[var(--text-muted)]">
                {t.storyGen.tone}
              </span>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#8B5CF6]"
              >
                {toneOptions.map((tOpt) => (
                  <option key={tOpt} value={tOpt}>
                    {tOpt}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-[var(--text-muted)]">
              {t.storyGen.writingStyle}
            </span>
            <select
              value={writingStyle}
              onChange={(e) => setWritingStyle(e.target.value)}
              className="w-full rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#8B5CF6]"
            >
              {styleOptions.map((style) => (
                <option key={style} value={style}>
                  {style}
                </option>
              ))}
            </select>
          </label>

          {/* Story Length Segmented Control */}
          <div className="space-y-2">
            <span className="block text-xs font-medium text-[var(--text-muted)]">
              {t.storyGen.storyLength}
            </span>
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
              {(['Short', 'Medium', 'Long'] as const).map((option) => {
                const active = length === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setLength(option)}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      active
                        ? 'bg-[#8B5CF6] text-white shadow-sm'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl bg-red-500/10 border border-red-400/35 p-3.5 flex items-start gap-2.5 text-xs text-red-600 dark:text-red-200"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isGenerating}
            className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed transition-all cursor-pointer shadow-lg shadow-[#8B5CF6]/20"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t.storyGen.generatingBtn}</span>
              </>
            ) : (
              <>
                <Feather className="w-4 h-4" />
                <span>{t.storyGen.generateBtn}</span>
              </>
            )}
          </button>
        </form>

        {/* Right: Generated Manuscript Output */}
        <div className="xl:col-span-7">
          {isGenerating ? (
            <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-6 sm:p-8 space-y-6 animate-pulse">
              <div className="space-y-3">
                <div className="h-3 w-40 rounded bg-[var(--bg-elevated)]" />
                <div className="h-8 w-3/4 rounded bg-[var(--bg-elevated)]" />
                <div className="h-4 w-full rounded bg-[var(--bg-elevated)]" />
                <div className="h-4 w-5/6 rounded bg-[var(--bg-elevated)]" />
              </div>
              <div className="pt-6 border-t border-[var(--border-subtle)] space-y-3">
                <div className="h-4 w-full rounded bg-[var(--bg-elevated)]" />
                <div className="h-4 w-full rounded bg-[var(--bg-elevated)]" />
                <div className="h-4 w-11/12 rounded bg-[var(--bg-elevated)]" />
                <div className="h-4 w-full rounded bg-[var(--bg-elevated)]" />
              </div>
            </div>
          ) : !draft ? (
            <div className="rounded-2xl bg-[var(--bg-surface)] border border-dashed border-[var(--border-strong)] p-8 sm:p-14 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 flex items-center justify-center text-[var(--accent-text)] mx-auto mb-4">
                <Feather className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                {t.storyGen.emptyHeading}
              </h2>
              <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto leading-relaxed">
                {t.storyGen.emptyBody}
              </p>
            </div>
          ) : (
            <article className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-strong)] overflow-hidden">
              {/* Action Toolbar */}
              <div className="px-6 py-4 bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--accent-text)]">
                  <span>{draft.genre}</span>
                  <span aria-hidden="true">·</span>
                  <span>{draft.tone}</span>
                  <span aria-hidden="true">·</span>
                  <span>{draft.writingStyle}</span>
                  {preferences.showWordCounts && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-figures text-[var(--text-muted)]">
                        {draft.wordCount.toLocaleString()} words
                      </span>
                    </>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing((prev) => !prev)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                      isEditing
                        ? 'bg-[#8B5CF6]/20 border-[#8B5CF6]/50 text-[var(--text-primary)]'
                        : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isEditing ? t.storyGen.doneEditing : t.storyGen.edit}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{t.storyGen.copied}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>{t.storyGen.copy}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleGenerate(undefined, { regenerate: true })}
                    disabled={isGenerating}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{t.storyGen.regenerate}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSave}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] hover:brightness-110 transition-all cursor-pointer whitespace-nowrap"
                  >
                    {savedNotice ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>{t.storyGen.saved}</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>{t.storyGen.save}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveAsPdf}
                    disabled={isExportingPdf}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-primary)] bg-[var(--bg-surface)] border border-[#8B5CF6]/45 hover:border-[#8B5CF6] hover:bg-[#8B5CF6]/10 disabled:opacity-60 disabled:cursor-not-allowed transition-all cursor-pointer whitespace-nowrap"
                  >
                    {isExportingPdf ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent-text)]" />
                        <span>Exporting PDF...</span>
                      </>
                    ) : pdfSavedNotice ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>PDF Saved</span>
                      </>
                    ) : (
                      <>
                        <FileDown className="w-3.5 h-3.5 text-[var(--accent-text)]" />
                        <span>Save as PDF</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {pdfError && (
                <div
                  role="alert"
                  className="mx-6 mt-4 rounded-xl bg-red-500/10 border border-red-500/30 p-3 flex items-start gap-2 text-xs text-red-700 dark:text-red-200"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{pdfError}</span>
                </div>
              )}

              <div className="p-6 sm:p-8 space-y-7">
                {/* Title & Description */}
                <div className="space-y-3">
                  {isEditing ? (
                    <>
                      <input
                        type="text"
                        value={draft.title}
                        onChange={(e) => updateDraftField('title', e.target.value)}
                        aria-label="Story Title"
                        className="w-full rounded-xl bg-[var(--bg-input)] border border-[#8B5CF6]/40 px-4 py-2.5 text-xl sm:text-2xl font-bold text-[var(--text-primary)] focus:outline-none focus:border-[#8B5CF6]"
                      />
                      <div className="space-y-1.5">
                        <div className="flex justify-end">
                          <VoiceDictationButton
                            compact
                            language={draft.language ?? preferences.language}
                            contextHint="story description"
                            onTranscript={(spoken) =>
                              updateDraftField(
                                'description',
                                appendDictatedText(draft.description, spoken)
                              )
                            }
                          />
                        </div>
                        <textarea
                          rows={2}
                          value={draft.description}
                          onChange={(e) => updateDraftField('description', e.target.value)}
                          aria-label="Story Description"
                          className="w-full rounded-xl bg-[var(--bg-input)] border border-[var(--border-strong)] px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#8B5CF6]"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] leading-tight">
                        {draft.title}
                      </h2>
                      <p className="text-sm sm:text-base text-[var(--text-muted)] leading-relaxed">
                        {draft.description}
                      </p>
                    </>
                  )}
                </div>

                {/* Story Voice Assistant */}
                <StoryVoiceAssistant
                  title={draft.title}
                  text={draft.narrative}
                  appLanguage={preferences.language}
                  sourceLanguage={draft.language ?? preferences.language}
                  tone={draft.tone}
                />

                {/* Complete Narrative */}
                <div className="pt-6 border-t border-[var(--border-subtle)]">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <h3 className="text-xs font-semibold text-[var(--accent-text)]">
                      {t.storyGen.narrative}
                    </h3>
                    {isEditing && (
                      <VoiceDictationButton
                        compact
                        language={draft.language ?? preferences.language}
                        contextHint="story narrative"
                        onTranscript={(spoken) =>
                          updateDraftField(
                            'narrative',
                            appendDictatedText(draft.narrative, spoken)
                          )
                        }
                      />
                    )}
                  </div>
                  {isEditing ? (
                    <textarea
                      rows={14}
                      value={draft.narrative}
                      onChange={(e) => updateDraftField('narrative', e.target.value)}
                      aria-label="Complete Narrative"
                      className="w-full rounded-xl bg-[var(--bg-input)] border border-[var(--border-strong)] px-4 py-3 text-base text-[var(--text-primary)] leading-relaxed focus:outline-none focus:border-[#8B5CF6]"
                    />
                  ) : (
                    <div className="space-y-4 text-[var(--text-primary)] text-base leading-[1.75]">
                      {draft.narrative
                        .split(/\n+/)
                        .map((p) => p.trim())
                        .filter(Boolean)
                        .map((paragraph, index) => (
                          <p key={index}>{paragraph}</p>
                        ))}
                    </div>
                  )}
                </div>

                {/* Characters */}
                <div className="pt-6 border-t border-[var(--border-subtle)]">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-4 h-4 text-[var(--accent-text)]" />
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                      {t.storyGen.characters}
                    </h3>
                  </div>

                  {draft.characterDetails && draft.characterDetails.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {draft.characterDetails.map((character, idx) => (
                        <div
                          key={`${character.name}-${idx}`}
                          className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-4"
                        >
                          <div className="text-sm font-semibold text-[var(--text-primary)]">
                            {character.name}
                          </div>
                          <div className="text-xs text-[var(--accent-text)] mt-0.5 mb-2">
                            {character.role}
                          </div>
                          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                            {character.trait}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-[var(--text-muted)]">
                      {draft.characters.join(' · ')}
                    </div>
                  )}
                </div>

                {/* Conflict, Climax & Resolution */}
                <div className="pt-6 border-t border-[var(--border-subtle)] grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-semibold text-[var(--accent-text)]">
                      {t.storyGen.conflict}
                    </h3>
                    {isEditing ? (
                      <textarea
                        rows={4}
                        value={draft.conflict}
                        onChange={(e) => updateDraftField('conflict', e.target.value)}
                        aria-label="Conflict"
                        className="w-full rounded-xl bg-[var(--bg-input)] border border-[var(--border-strong)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#8B5CF6]"
                      />
                    ) : (
                      <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                        {draft.conflict}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-xs font-semibold text-[var(--accent-text)]">
                      {t.storyGen.climax}
                    </h3>
                    {isEditing ? (
                      <textarea
                        rows={4}
                        value={draft.climax}
                        onChange={(e) => updateDraftField('climax', e.target.value)}
                        aria-label="Climax"
                        className="w-full rounded-xl bg-[var(--bg-input)] border border-[var(--border-strong)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#8B5CF6]"
                      />
                    ) : (
                      <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                        {draft.climax}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-xs font-semibold text-[var(--accent-text)]">
                      {t.storyGen.resolution}
                    </h3>
                    {isEditing ? (
                      <textarea
                        rows={4}
                        value={draft.resolution}
                        onChange={(e) => updateDraftField('resolution', e.target.value)}
                        aria-label="Resolution"
                        className="w-full rounded-xl bg-[var(--bg-input)] border border-[var(--border-strong)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#8B5CF6]"
                      />
                    ) : (
                      <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                        {draft.resolution}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </article>
          )}
        </div>
      </div>
    </div>
  );
}
