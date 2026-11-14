import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Check,
  Copy,
  GitBranch,
  Loader2,
  Save,
  Sparkles,
} from 'lucide-react';
import { TRANSLATIONS } from '../i18n/translations';
import {
  AlternativeEndingOption,
  AppLanguage,
  EndingType,
  StoryRecord,
} from '../types/story';

interface AlternativeEndingsProps {
  language: AppLanguage;
  stories: StoryRecord[];
  onSaveStory: (story: StoryRecord) => Promise<void> | void;
}

export function AlternativeEndings({
  language,
  stories,
  onSaveStory,
}: AlternativeEndingsProps) {
  const t = TRANSLATIONS[language];

  const [selectedStoryId, setSelectedStoryId] = useState<string>(stories[0]?.id ?? '');
  const [customTitle, setCustomTitle] = useState(stories[0]?.title ?? '');
  const [customPremise, setCustomPremise] = useState(
    stories[0]?.description ?? ''
  );
  const [customNarrative, setCustomNarrative] = useState(
    stories[0]?.narrative ?? ''
  );
  const [endings, setEndings] = useState<AlternativeEndingOption[]>(
    stories[0]?.alternativeEndings ?? []
  );
  const [preferredType, setPreferredType] = useState<EndingType | undefined>(
    stories[0]?.preferredEndingType
  );

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [savedType, setSavedType] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedStoryId && stories.length > 0) {
      const first = stories[0];
      setSelectedStoryId(first.id);
      setCustomTitle(first.title);
      setCustomPremise(first.description);
      setCustomNarrative(first.narrative);
      setEndings(first.alternativeEndings ?? []);
      setPreferredType(first.preferredEndingType);
    }
  }, [stories, selectedStoryId]);

  const handleSelectStory = (id: string) => {
    setSelectedStoryId(id);
    setError(null);
    const story = stories.find((s) => s.id === id);
    if (story) {
      setCustomTitle(story.title);
      setCustomPremise(story.description);
      setCustomNarrative(story.narrative);
      setEndings(story.alternativeEndings ?? []);
      setPreferredType(story.preferredEndingType);
    } else {
      setCustomTitle('');
      setCustomPremise('');
      setCustomNarrative('');
      setEndings([]);
      setPreferredType(undefined);
    }
  };

  const handleGenerate = async () => {
    const linked = stories.find((s) => s.id === selectedStoryId);
    const sourceText = [customPremise, customNarrative].filter(Boolean).join('\n').trim();
    if (sourceText.length < 10) {
      setError('Please select a saved story or provide a story summary/excerpt first.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/endings/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: customTitle || linked?.title,
          premise: customPremise,
          narrative: customNarrative,
          conflict: linked?.conflict,
          climax: linked?.climax,
          language,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || !Array.isArray(data?.endings)) {
        throw new Error(data?.error || 'Could not generate alternative endings.');
      }
      setEndings(data.endings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Alternative endings generation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSavePreferred = async (option: AlternativeEndingOption) => {
    const existing = stories.find((s) => s.id === selectedStoryId);
    const updatedStory: StoryRecord = existing
      ? {
          ...existing,
          resolution: option.endingText,
          alternativeEndings: endings,
          preferredEndingType: option.type,
          updatedAt: new Date().toLocaleDateString('en-IN', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
        }
      : {
          id: `story-${Date.now()}`,
          title: customTitle.trim() || 'Branched Story',
          description: customPremise.trim() || 'Story with custom branched ending.',
          genre: 'Folklore & Magical Realism',
          tone: 'Atmospheric',
          writingStyle: 'Lyrical Prose',
          lengthLabel: 'Short Story',
          language,
          wordCount: (customNarrative + ' ' + option.endingText)
            .trim()
            .split(/\s+/)
            .filter(Boolean).length,
          narrative: customNarrative.trim()
            ? `${customNarrative.trim()}\n\n${option.endingText}`
            : option.endingText,
          conflict: customPremise.trim() || 'Custom conflict',
          climax: 'Resolved via Alternative Endings studio',
          resolution: option.endingText,
          characters: [],
          alternativeEndings: endings,
          preferredEndingType: option.type,
          updatedAt: new Date().toLocaleDateString('en-IN', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
        };

    setError(null);
    try {
      await onSaveStory(updatedStory);
      setSelectedStoryId(updatedStory.id);
      setPreferredType(option.type);
      setSavedType(option.type);
      setTimeout(() => setSavedType(null), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save preferred ending.');
    }
  };

  const handleCopyEnding = async (option: AlternativeEndingOption) => {
    try {
      await navigator.clipboard.writeText(
        `${option.type}: ${option.title}\n\n${option.endingText}`
      );
      setCopiedType(option.type);
      setTimeout(() => setCopiedType(null), 2000);
    } catch {
      setError('Clipboard copy failed. You can select and copy the ending text directly.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs font-medium text-[var(--accent-text)] mb-1">
          {t.endings.kicker}
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
          {t.endings.title}
        </h1>
      </div>

      {/* Story Brief Selector */}
      <section className="glass-surface rounded-2xl p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-[var(--text-muted)]">
              Select Saved Story
            </span>
            <select
              value={selectedStoryId}
              onChange={(e) => handleSelectStory(e.target.value)}
              className="w-full rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#8B5CF6]"
            >
              <option value="">Custom Story Summary</option>
              {stories.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-[var(--text-muted)]">Story Title</span>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="e.g., Echoes on the Hooghly"
              className="w-full rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[#8B5CF6]"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-[var(--text-muted)]">
              Premise / Stakes
            </span>
            <textarea
              rows={3}
              value={customPremise}
              onChange={(e) => setCustomPremise(e.target.value)}
              placeholder="Summarize the central conflict or premise..."
              className="w-full rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[#8B5CF6]"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-[var(--text-muted)]">
              Current Draft / Climax Context
            </span>
            <textarea
              rows={3}
              value={customNarrative}
              onChange={(e) => setCustomNarrative(e.target.value)}
              placeholder="Paste the scene leading up to the ending..."
              className="w-full rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[#8B5CF6]"
            />
          </label>
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

        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] hover:brightness-110 disabled:opacity-60 cursor-pointer"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{t.endings.generatingBtn}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>{t.endings.generateBtn}</span>
            </>
          )}
        </button>
      </section>

      {/* Four Branched Endings */}
      {isGenerating ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-6"
            />
          ))}
        </div>
      ) : endings.length === 0 ? (
        <div className="rounded-2xl bg-[var(--bg-surface)] border border-dashed border-[var(--border-strong)] p-10 sm:p-14 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 flex items-center justify-center text-[var(--accent-text)] mx-auto mb-4">
            <GitBranch className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            {t.endings.emptyTitle}
          </h2>
          <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto leading-relaxed">
            {t.endings.emptyDesc}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {endings.map((option) => {
            const isPreferred = preferredType === option.type;
            return (
              <article
                key={option.type}
                className={`rounded-2xl bg-[var(--bg-surface)] p-6 flex flex-col justify-between transition-colors ${
                  isPreferred
                    ? 'border border-[#8B5CF6] shadow-lg shadow-[#8B5CF6]/15'
                    : 'border border-[var(--border-subtle)]'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-[var(--accent-text)]">
                      {option.type}
                    </span>
                    {isPreferred && (
                      <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                        {t.endings.preferredLabel}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                    {option.title}
                  </h3>

                  <div className="space-y-3 text-sm text-[var(--text-muted)] leading-relaxed whitespace-pre-wrap">
                    {option.endingText}
                  </div>

                  {option.emotionalNote && (
                    <p className="pt-3 border-t border-[var(--border-subtle)] text-xs text-[var(--text-subtle)]">
                      <span className="text-[var(--accent-text)] font-medium">Impact: </span>
                      {option.emotionalNote}
                    </p>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => handleCopyEnding(option)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--text-primary)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[#8B5CF6]/50 cursor-pointer"
                  >
                    {copiedType === option.type ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
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
                    onClick={() => handleSavePreferred(option)}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isPreferred
                        ? 'bg-[#8B5CF6]/20 border border-[#8B5CF6] text-[var(--text-primary)]'
                        : 'bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] text-white hover:brightness-110'
                    }`}
                  >
                    {savedType === option.type ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>{t.storyGen.saved}</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>
                          {isPreferred ? t.endings.preferredLabel : t.endings.savePreferred}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
