import { useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  Copy,
  Feather,
  Heart,
  Loader2,
  Maximize2,
  MessageSquare,
  Minimize2,
  RefreshCw,
  RotateCcw,
  Save,
  Sparkles,
  SpellCheck,
  Wand2,
} from 'lucide-react';
import { TRANSLATIONS } from '../i18n/translations';
import { StoryVoiceAssistant } from './StoryVoiceAssistant';
import {
  CharacterProfile,
  StoryRecord,
  WorkspacePreferences,
} from '../types/story';

interface AiCoWriterProps {
  stories: StoryRecord[];
  characters: CharacterProfile[];
  preferences: WorkspacePreferences;
  initialStory?: StoryRecord | null;
  onSaveStory: (story: StoryRecord) => Promise<void> | void;
}

type CoWriterAction =
  | 'continue'
  | 'rewrite'
  | 'grammar'
  | 'dialogue'
  | 'style'
  | 'emotional';

const TARGET_STYLES = [
  'Lyrical Prose',
  'Crisp & Cinematic',
  'Folklore & Poetic',
  'Minimalist Literary',
  'Atmospheric Suspense',
  'Classic Omniscient',
];

export function AiCoWriter({
  stories,
  characters,
  preferences,
  initialStory,
  onSaveStory,
}: AiCoWriterProps) {
  const t = TRANSLATIONS[preferences.language];

  const [linkedStoryId, setLinkedStoryId] = useState<string>(initialStory?.id ?? '');
  const [manuscriptTitle, setManuscriptTitle] = useState<string>(
    initialStory?.title ?? 'Untitled Manuscript'
  );
  const [text, setText] = useState<string>(initialStory?.narrative ?? '');
  const [undoSnapshot, setUndoSnapshot] = useState<string | null>(null);
  const [activeCharIds, setActiveCharIds] = useState<string[]>([]);
  const [targetStyle, setTargetStyle] = useState<string>(TARGET_STYLES[0]);
  const [focusMode, setFocusMode] = useState(false);

  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number }>({
    start: 0,
    end: 0,
  });
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [pendingSuggestion, setPendingSuggestion] = useState<{
    action: CoWriterAction;
    resultText: string;
    mode: 'append' | 'replace';
    usedSelection: { start: number; end: number } | null;
  } | null>(null);

  const [loadingAction, setLoadingAction] = useState<CoWriterAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);
  const [copied, setCopied] = useState(false);

  const fontSizeClass =
    preferences.editorFontSize === 'Compact'
      ? 'text-[15px]'
      : preferences.editorFontSize === 'Relaxed'
      ? 'text-[18px]'
      : 'text-[16px]';

  const wordCount = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;

  const selectedText =
    selectionRange.end > selectionRange.start
      ? text.slice(selectionRange.start, selectionRange.end)
      : '';

  const captureSelection = () => {
    const el = textareaRef.current;
    if (!el) return;
    setSelectionRange({
      start: el.selectionStart ?? 0,
      end: el.selectionEnd ?? 0,
    });
  };

  const handleSelectStory = (storyId: string) => {
    setLinkedStoryId(storyId);
    const found = stories.find((s) => s.id === storyId);
    if (found) {
      setManuscriptTitle(found.title);
      setText(found.narrative);
      setUndoSnapshot(null);
      setPendingSuggestion(null);
    }
  };

  const toggleCharacter = (id: string) => {
    setActiveCharIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const runAssist = async (action: CoWriterAction) => {
    const linkedStory = stories.find((s) => s.id === linkedStoryId);
    const storyContext = linkedStory
      ? `Title: ${linkedStory.title}\nGenre: ${linkedStory.genre}\nTone: ${linkedStory.tone}\nPremise: ${linkedStory.description}\nConflict: ${linkedStory.conflict}`
      : `Title: ${manuscriptTitle}`;

    const charsContext = characters
      .filter((c) => activeCharIds.includes(c.id))
      .map(
        (c) =>
          `${c.name} (${c.role}): ${c.personality}. Strengths: ${c.strengths.join(', ')}. Weaknesses: ${c.weaknesses.join(', ')}.`
      )
      .join('\n');

    setLoadingAction(action);
    setError(null);

    const activeSelection =
      selectionRange.end > selectionRange.start ? { ...selectionRange } : null;

    try {
      const response = await fetch('/api/cowriter/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          text,
          selectedText: activeSelection ? text.slice(activeSelection.start, activeSelection.end) : '',
          targetStyle: action === 'style' ? targetStyle : undefined,
          storyContext,
          charactersContext: charsContext || undefined,
          language: preferences.language,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.resultText) {
        throw new Error(data?.error || 'AI Co-Writer request failed.');
      }

      setPendingSuggestion({
        action,
        resultText: data.resultText,
        mode: data.mode,
        usedSelection: activeSelection,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to run AI Co-Writer action.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleApplySuggestion = () => {
    if (!pendingSuggestion) return;
    setUndoSnapshot(text);

    if (pendingSuggestion.mode === 'append') {
      const separator = text.trim().length > 0 ? '\n\n' : '';
      setText(`${text.trimEnd()}${separator}${pendingSuggestion.resultText}`);
    } else if (pendingSuggestion.usedSelection) {
      const { start, end } = pendingSuggestion.usedSelection;
      setText(
        `${text.slice(0, start)}${pendingSuggestion.resultText}${text.slice(end)}`
      );
    } else {
      setText(pendingSuggestion.resultText);
    }
    setPendingSuggestion(null);
  };

  const handleUndo = () => {
    if (undoSnapshot === null) return;
    setText(undoSnapshot);
    setUndoSnapshot(null);
  };

  const handleSaveManuscript = async () => {
    const existing = stories.find((s) => s.id === linkedStoryId);
    const updatedStory: StoryRecord = existing
      ? {
          ...existing,
          title: manuscriptTitle.trim() || existing.title,
          narrative: text,
          language: preferences.language,
          wordCount,
          updatedAt: new Date().toLocaleDateString('en-IN', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
        }
      : {
          id: `story-${Date.now()}`,
          title: manuscriptTitle.trim() || 'Untitled Manuscript',
          description: text.trim().slice(0, 180) + (text.length > 180 ? '...' : ''),
          genre: 'Co-Written Draft',
          tone: preferences.defaultTone,
          writingStyle: targetStyle,
          lengthLabel: wordCount > 1200 ? 'Long Story' : wordCount > 650 ? 'Medium Story' : 'Short Story',
          language: preferences.language,
          wordCount,
          narrative: text,
          conflict: 'Drafted in AI Co-Writer',
          climax: 'In progress',
          resolution: 'In progress',
          characters: characters
            .filter((c) => activeCharIds.includes(c.id))
            .map((c) => c.name),
          updatedAt: new Date().toLocaleDateString('en-IN', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
        };

    setError(null);
    try {
      await onSaveStory(updatedStory);
      setLinkedStoryId(updatedStory.id);
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save manuscript.');
    }
  };

  const handleCopy = async () => {
    if (!text.trim()) return;
    try {
      await navigator.clipboard.writeText(`${manuscriptTitle}\n\n${text}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Clipboard copy failed. You can select and copy your manuscript directly.');
    }
  };

  const tools: {
    id: CoWriterAction;
    label: string;
    icon: typeof Feather;
  }[] = [
    { id: 'continue', label: t.coWriter.continueWriting, icon: Feather },
    { id: 'rewrite', label: t.coWriter.rewrite, icon: RefreshCw },
    { id: 'grammar', label: t.coWriter.improveGrammar, icon: SpellCheck },
    { id: 'dialogue', label: t.coWriter.addDialogue, icon: MessageSquare },
    { id: 'style', label: t.coWriter.changeStyle, icon: Wand2 },
    { id: 'emotional', label: t.coWriter.makeEmotional, icon: Heart },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[var(--accent-text)] mb-1">
            {t.coWriter.kicker}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
            {t.coWriter.title}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFocusMode((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-[var(--text-primary)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[#8B5CF6]/50 cursor-pointer"
          >
            {focusMode ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span>{t.coWriter.exitFocusMode}</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span>{t.coWriter.focusMode}</span>
              </>
            )}
          </button>

          {undoSnapshot !== null && (
            <button
              type="button"
              onClick={handleUndo}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-[var(--text-primary)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[#8B5CF6]/50 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Undo AI Edit</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-[var(--text-primary)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[#8B5CF6]/50 cursor-pointer"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>{copied ? t.storyGen.copied : t.storyGen.copy}</span>
          </button>

          <button
            type="button"
            onClick={handleSaveManuscript}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] hover:brightness-110 cursor-pointer"
          >
            {savedNotice ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>{t.storyGen.saved}</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{t.coWriter.saveToLibrary}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Story & Character Context Panel (Hidden in Focus Mode) */}
      {!focusMode && (
        <section className="glass-surface rounded-2xl p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-[var(--text-muted)]">
                Load Story Context
              </span>
              <select
                value={linkedStoryId}
                onChange={(e) => handleSelectStory(e.target.value)}
                className="w-full rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] px-3.5 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#8B5CF6]"
              >
                <option value="">Start fresh manuscript</option>
                {stories.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-[var(--text-muted)]">
                Manuscript Title
              </span>
              <input
                type="text"
                value={manuscriptTitle}
                onChange={(e) => setManuscriptTitle(e.target.value)}
                className="w-full rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] px-3.5 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#8B5CF6]"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-[var(--text-muted)]">
                Target Style (for Style Shift)
              </span>
              <select
                value={targetStyle}
                onChange={(e) => setTargetStyle(e.target.value)}
                className="w-full rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] px-3.5 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#8B5CF6]"
              >
                {TARGET_STYLES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {characters.length > 0 && (
            <div className="pt-3 border-t border-[var(--border-subtle)] flex flex-wrap items-center gap-2">
              <span className="text-xs text-[var(--text-subtle)] mr-1">
                Active Character Context:
              </span>
              {characters.map((c) => {
                const active = activeCharIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCharacter(c.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#8B5CF6]/20 border border-[#8B5CF6] text-[var(--text-primary)]'
                        : 'bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* AI Co-Writer Action Bar */}
      <section className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-[var(--accent-text)]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {selectedText
                ? `Selected passage (${selectedText.trim().split(/\s+/).length} words) will be transformed`
                : 'Tools act on your full draft (highlight text to target a specific passage)'}
            </span>
          </div>
          {preferences.showWordCounts && (
            <span className="text-xs font-mono tabular-figures text-[var(--text-muted)]">
              {wordCount.toLocaleString()} words · {text.length.toLocaleString()} chars
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const busy = loadingAction === tool.id;
            return (
              <button
                key={tool.id}
                type="button"
                disabled={loadingAction !== null}
                onClick={() => runAssist(tool.id)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-[var(--text-primary)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[#8B5CF6]/60 disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap"
              >
                {busy ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent-text)]" />
                ) : (
                  <Icon className="w-3.5 h-3.5 text-[var(--accent-text)]" />
                )}
                <span>{tool.label}</span>
              </button>
            );
          })}
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 flex items-start gap-2 text-xs text-red-700 dark:text-red-200"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </section>

      {/* Pending AI Suggestion Preview */}
      {pendingSuggestion && (
        <section className="glass-surface-elevated rounded-2xl p-6 space-y-4 border border-[#8B5CF6]/45">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-[var(--accent-text)]">
                AI Co-Writer Suggestion (
                {pendingSuggestion.mode === 'append' ? 'Continuation' : 'Revision'})
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPendingSuggestion(null)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-[var(--text-muted)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={handleApplySuggestion}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>
                  {pendingSuggestion.mode === 'append'
                    ? 'Append to Manuscript'
                    : 'Apply Revision'}
                </span>
              </button>
            </div>
          </div>
          <div className="rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] p-4 text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto">
            {pendingSuggestion.resultText}
          </div>
        </section>
      )}

      {/* Voice Assistant Story Reader */}
      {!focusMode && text.trim().length > 0 && (
        <StoryVoiceAssistant
          title={manuscriptTitle}
          text={selectedText || text}
          appLanguage={preferences.language}
          sourceLanguage={
            stories.find((s) => s.id === linkedStoryId)?.language ?? preferences.language
          }
          tone={stories.find((s) => s.id === linkedStoryId)?.tone ?? preferences.defaultTone}
          compact
        />
      )}

      {/* Distraction-Free Writing Surface */}
      <section className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-6 sm:p-10">
        <div className="max-w-3xl mx-auto space-y-4">
          <input
            type="text"
            value={manuscriptTitle}
            onChange={(e) => setManuscriptTitle(e.target.value)}
            aria-label="Manuscript title"
            className="w-full bg-transparent text-2xl sm:text-3xl font-bold text-[var(--text-primary)] focus:outline-none border-b border-transparent focus:border-[#8B5CF6]/40 pb-2"
          />
          <textarea
            ref={textareaRef}
            rows={18}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onSelect={captureSelection}
            onKeyUp={captureSelection}
            onMouseUp={captureSelection}
            placeholder="Begin writing your scene here, or load a saved story from the context bar above..."
            className={`w-full bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-subtle)] focus:outline-none leading-[1.85] resize-y ${fontSizeClass}`}
          />
        </div>
      </section>
    </div>
  );
}
