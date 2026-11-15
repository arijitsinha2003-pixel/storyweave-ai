import { useState } from 'react';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Check,
  Layers,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { TRANSLATIONS } from '../i18n/translations';
import { VoiceDictationButton, appendDictatedText } from './VoiceDictationButton';
import {
  AppLanguage,
  CharacterProfile,
  PlotBeat,
  PlotChapter,
  PlotOutline,
  PlotStageName,
  StoryRecord,
} from '../types/story';

interface PlotBuilderProps {
  language: AppLanguage;
  plots: PlotOutline[];
  stories: StoryRecord[];
  characters: CharacterProfile[];
  onSavePlot: (plot: PlotOutline) => Promise<void> | void;
  onDeletePlot: (id: string) => Promise<void> | void;
}

const DEFAULT_STAGES: PlotStageName[] = [
  'Introduction',
  'Inciting Incident',
  'Rising Action',
  'Climax',
  'Falling Action',
  'Resolution',
];

function createEmptyBeats(): PlotBeat[] {
  return DEFAULT_STAGES.map((stage, idx) => ({
    id: `beat-${Date.now()}-${idx}`,
    stage,
    title: stage,
    summary: '',
  }));
}

export function PlotBuilder({
  language,
  plots,
  stories,
  characters,
  onSavePlot,
  onDeletePlot,
}: PlotBuilderProps) {
  const t = TRANSLATIONS[language];

  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(
    plots[0]?.id ?? null
  );
  const [title, setTitle] = useState(plots[0]?.title ?? '');
  const [premise, setPremise] = useState(plots[0]?.premise ?? '');
  const [genre, setGenre] = useState('Folklore & Magical Realism');
  const [linkedStoryId, setLinkedStoryId] = useState(plots[0]?.linkedStoryId ?? '');
  const [selectedCharNames, setSelectedCharNames] = useState<string[]>(
    plots[0]?.characterNames ?? []
  );
  const [beats, setBeats] = useState<PlotBeat[]>(plots[0]?.beats ?? createEmptyBeats());
  const [chapters, setChapters] = useState<PlotChapter[]>(plots[0]?.chapters ?? []);

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);

  const loadOutline = (outline: PlotOutline) => {
    setSelectedPlotId(outline.id);
    setTitle(outline.title);
    setPremise(outline.premise);
    setLinkedStoryId(outline.linkedStoryId ?? '');
    setSelectedCharNames(outline.characterNames);
    setBeats(outline.beats);
    setChapters(outline.chapters);
    setError(null);
  };

  const handleNewBlankOutline = () => {
    setSelectedPlotId(null);
    setTitle('');
    setPremise('');
    setLinkedStoryId('');
    setSelectedCharNames([]);
    setBeats(createEmptyBeats());
    setChapters([
      {
        id: `ch-${Date.now()}`,
        title: 'Chapter 1: Opening',
        summary: '',
        scenes: [
          {
            id: `sc-${Date.now()}-1`,
            title: 'Scene 1',
            setting: '',
            summary: '',
          },
        ],
      },
    ]);
    setError(null);
  };

  const handleStoryLink = (storyId: string) => {
    setLinkedStoryId(storyId);
    const story = stories.find((s) => s.id === storyId);
    if (story) {
      if (!title) setTitle(`${story.title} — Plot Outline`);
      setPremise(story.idea || story.description);
      setGenre(story.genre);
      const matchingChars = characters
        .filter((c) => story.characters.includes(c.name))
        .map((c) => c.name);
      if (matchingChars.length > 0) {
        setSelectedCharNames(matchingChars);
      }
    }
  };

  const toggleCharacter = (charName: string) => {
    setSelectedCharNames((prev) =>
      prev.includes(charName)
        ? prev.filter((item) => item !== charName)
        : [...prev, charName]
    );
  };

  const handleGeneratePlot = async () => {
    if (premise.trim().length < 5) {
      setError('Enter a story premise (at least 5 characters) before generating a plot.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const selectedCharactersPayload = characters
        .filter((c) => selectedCharNames.includes(c.name))
        .map((c) => ({
          name: c.name,
          role: c.role,
          personality: c.personality,
        }));

      const response = await fetch('/api/plots/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          premise: premise.trim(),
          genre,
          characters: selectedCharactersPayload,
          language,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.plot) {
        throw new Error(data?.error || 'Could not generate plot outline.');
      }

      setTitle(data.plot.title);
      setBeats(data.plot.beats);
      setChapters(data.plot.chapters);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Plot generation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    const cleanTitle = title.trim() || 'Untitled Plot Outline';
    const outline: PlotOutline = {
      id: selectedPlotId ?? `plot-${Date.now()}`,
      title: cleanTitle,
      premise: premise.trim(),
      linkedStoryId: linkedStoryId || undefined,
      characterNames: selectedCharNames,
      beats,
      chapters,
      updatedAt: new Date().toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    };
    setError(null);
    try {
      await onSavePlot(outline);
      setSelectedPlotId(outline.id);
      setTitle(cleanTitle);
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save plot outline.');
    }
  };

  const updateBeat = (id: string, field: 'title' | 'summary', value: string) => {
    setBeats((prev) =>
      prev.map((beat) => (beat.id === id ? { ...beat, [field]: value } : beat))
    );
  };

  const addChapter = () => {
    setChapters((prev) => [
      ...prev,
      {
        id: `ch-${Date.now()}`,
        title: `Chapter ${prev.length + 1}`,
        summary: '',
        scenes: [
          {
            id: `sc-${Date.now()}-1`,
            title: 'Scene 1',
            setting: '',
            summary: '',
          },
        ],
      },
    ]);
  };

  const updateChapter = (
    chapterId: string,
    field: 'title' | 'summary',
    value: string
  ) => {
    setChapters((prev) =>
      prev.map((ch) => (ch.id === chapterId ? { ...ch, [field]: value } : ch))
    );
  };

  const deleteChapter = (chapterId: string) => {
    setChapters((prev) => prev.filter((ch) => ch.id !== chapterId));
  };

  const addScene = (chapterId: string) => {
    setChapters((prev) =>
      prev.map((ch) =>
        ch.id === chapterId
          ? {
              ...ch,
              scenes: [
                ...ch.scenes,
                {
                  id: `sc-${Date.now()}`,
                  title: `Scene ${ch.scenes.length + 1}`,
                  setting: '',
                  summary: '',
                },
              ],
            }
          : ch
      )
    );
  };

  const updateScene = (
    chapterId: string,
    sceneId: string,
    field: 'title' | 'setting' | 'summary',
    value: string
  ) => {
    setChapters((prev) =>
      prev.map((ch) =>
        ch.id === chapterId
          ? {
              ...ch,
              scenes: ch.scenes.map((sc) =>
                sc.id === sceneId ? { ...sc, [field]: value } : sc
              ),
            }
          : ch
      )
    );
  };

  const moveScene = (chapterId: string, sceneIndex: number, direction: -1 | 1) => {
    setChapters((prev) =>
      prev.map((ch) => {
        if (ch.id !== chapterId) return ch;
        const nextIndex = sceneIndex + direction;
        if (nextIndex < 0 || nextIndex >= ch.scenes.length) return ch;
        const copy = [...ch.scenes];
        const [moved] = copy.splice(sceneIndex, 1);
        copy.splice(nextIndex, 0, moved);
        return { ...ch, scenes: copy };
      })
    );
  };

  const deleteScene = (chapterId: string, sceneId: string) => {
    setChapters((prev) =>
      prev.map((ch) =>
        ch.id === chapterId
          ? { ...ch, scenes: ch.scenes.filter((sc) => sc.id !== sceneId) }
          : ch
      )
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[var(--accent-text)] mb-1">
            {t.plotBuilder.kicker}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
            {t.plotBuilder.title}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleNewBlankOutline}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-[var(--text-primary)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[#8B5CF6]/50 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.plotBuilder.newOutline}</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] hover:brightness-110 cursor-pointer"
          >
            {savedNotice ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>{t.plotBuilder.savedOutline}</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{t.plotBuilder.saveOutline}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Saved Outlines Bar */}
      {plots.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pb-2">
          <span className="text-xs text-[var(--text-subtle)] mr-1">Saved Outlines:</span>
          {plots.map((p) => {
            const active = selectedPlotId === p.id;
            return (
              <div key={p.id} className="inline-flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => loadOutline(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#8B5CF6] text-white'
                      : 'bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {p.title}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await onDeletePlot(p.id);
                      if (selectedPlotId === p.id) handleNewBlankOutline();
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Could not delete plot outline.');
                    }
                  }}
                  aria-label={`Delete ${p.title}`}
                  className="w-7 h-7 rounded-lg text-[var(--text-subtle)] hover:text-red-500 dark:hover:text-red-300 flex items-center justify-center cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Plot Generator Brief */}
      <section className="glass-surface rounded-2xl p-6 space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-6 space-y-3">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-[var(--text-muted)]">Plot Title</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., The Monsoon of College Street"
                className="w-full rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] px-3.5 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[#8B5CF6]"
              />
            </label>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="plot-premise"
                  className="text-xs font-medium text-[var(--text-muted)]"
                >
                  Story Idea / Premise
                </label>
                <VoiceDictationButton
                  language={language}
                  contextHint="plot premise prompt"
                  onTranscript={(spoken) => {
                    setPremise((prev) => appendDictatedText(prev, spoken));
                    if (error) setError(null);
                  }}
                />
              </div>
              <textarea
                id="plot-premise"
                rows={3}
                value={premise}
                onChange={(e) => {
                  setPremise(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="e.g., A nocturnal bookshop in Kolkata uncovers manuscripts predicting tomorrow's headlines..."
                className="w-full rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>
          </div>

          <div className="lg:col-span-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-[var(--text-muted)]">
                  Import from Saved Story
                </span>
                <select
                  value={linkedStoryId}
                  onChange={(e) => handleStoryLink(e.target.value)}
                  className="w-full rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#8B5CF6]"
                >
                  <option value="">Custom premise</option>
                  {stories.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-[var(--text-muted)]">
                  {t.storyGen.genre}
                </span>
                <input
                  type="text"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#8B5CF6]"
                />
              </label>
            </div>

            <div className="space-y-2">
              <span className="block text-xs font-medium text-[var(--text-muted)]">
                Cast Characters into Plot ({selectedCharNames.length} selected)
              </span>
              {characters.length === 0 ? (
                <p className="text-xs text-[var(--text-subtle)]">
                  No characters created in Character Studio yet — AI will invent fitting roles.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {characters.map((c) => {
                    const selected = selectedCharNames.includes(c.name);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleCharacter(c.name)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          selected
                            ? 'bg-[#8B5CF6]/20 border border-[#8B5CF6] text-[var(--text-primary)]'
                            : 'bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        {c.name} ({c.role})
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleGeneratePlot}
              disabled={isGenerating}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] hover:brightness-110 disabled:opacity-60 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t.plotBuilder.generatingBtn}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{t.plotBuilder.generateBtn}</span>
                </>
              )}
            </button>
          </div>
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

      {/* Six-Stage Plot Arc */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            {t.plotBuilder.arcHeading}
          </h2>
          <span className="text-xs text-[var(--text-subtle)]">All beats are editable inline</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {beats.map((beat, idx) => (
            <div
              key={beat.id}
              className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-5 space-y-3"
            >
              <div className="flex items-center justify-between gap-2 text-xs text-[var(--accent-text)]">
                <span>
                  0{idx + 1}. {beat.stage}
                </span>
                <VoiceDictationButton
                  compact
                  language={language}
                  contextHint={`${beat.stage} beat`}
                  onTranscript={(spoken) =>
                    updateBeat(beat.id, 'summary', appendDictatedText(beat.summary, spoken))
                  }
                />
              </div>
              <input
                type="text"
                value={beat.title}
                onChange={(e) => updateBeat(beat.id, 'title', e.target.value)}
                aria-label={`${beat.stage} title`}
                className="w-full rounded-lg bg-[var(--bg-input)] border border-[var(--border-subtle)] px-3 py-1.5 text-sm font-semibold text-[var(--text-primary)] focus:outline-none focus:border-[#8B5CF6]"
              />
              <textarea
                rows={4}
                value={beat.summary}
                onChange={(e) => updateBeat(beat.id, 'summary', e.target.value)}
                placeholder={`Describe what happens during ${beat.stage}...`}
                aria-label={`${beat.stage} summary`}
                className="w-full rounded-lg bg-[var(--bg-input)] border border-[var(--border-subtle)] px-3 py-2 text-xs text-[var(--text-muted)] leading-relaxed focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Chapter & Scene Management */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              {t.plotBuilder.chaptersHeading}
            </h2>
            <p className="text-xs text-[var(--text-subtle)]">
              Add chapters, manage scenes, and reorder dramatic beats
            </p>
          </div>
          <button
            type="button"
            onClick={addChapter}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-primary)] bg-[var(--bg-elevated)] border border-[var(--border-strong)] hover:border-[#8B5CF6]/55 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.plotBuilder.addChapter}</span>
          </button>
        </div>

        {chapters.length === 0 ? (
          <div className="rounded-2xl bg-[var(--bg-surface)] border border-dashed border-[var(--border-strong)] p-8 text-center">
            <Layers className="w-5 h-5 text-[var(--accent-text)] mx-auto mb-2" />
            <p className="text-sm text-[var(--text-muted)] mb-4">
              No chapters outlined yet. Generate a plot above or add a chapter manually.
            </p>
            <button
              type="button"
              onClick={addChapter}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-primary)] bg-[var(--bg-elevated)] border border-[var(--border-strong)] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.plotBuilder.addChapter}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {chapters.map((chapter, cIdx) => (
              <div
                key={chapter.id}
                className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-6 space-y-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={chapter.title}
                      onChange={(e) => updateChapter(chapter.id, 'title', e.target.value)}
                      placeholder={`Chapter ${cIdx + 1} Title`}
                      className="rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] px-3.5 py-2 text-sm font-semibold text-[var(--text-primary)] focus:outline-none focus:border-[#8B5CF6]"
                    />
                    <input
                      type="text"
                      value={chapter.summary}
                      onChange={(e) => updateChapter(chapter.id, 'summary', e.target.value)}
                      placeholder="Chapter focus or goal..."
                      className="rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] px-3.5 py-2 text-xs text-[var(--text-muted)] focus:outline-none focus:border-[#8B5CF6]"
                    />
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => addScene(chapter.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--accent-text)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[#8B5CF6] cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{t.plotBuilder.addScene}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteChapter(chapter.id)}
                      aria-label={`Delete ${chapter.title}`}
                      className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-subtle)] hover:text-red-500 dark:hover:text-red-300 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Scenes List */}
                <div className="space-y-3 pt-2 border-t border-[var(--border-subtle)]">
                  {chapter.scenes.map((scene, sIdx) => (
                    <div
                      key={scene.id}
                      className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-4 space-y-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <input
                            type="text"
                            value={scene.title}
                            onChange={(e) =>
                              updateScene(chapter.id, scene.id, 'title', e.target.value)
                            }
                            placeholder={`Scene ${sIdx + 1} Title`}
                            className="rounded-lg bg-[var(--bg-input)] border border-[var(--border-subtle)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] focus:outline-none focus:border-[#8B5CF6]"
                          />
                          <input
                            type="text"
                            value={scene.setting ?? ''}
                            onChange={(e) =>
                              updateScene(chapter.id, scene.id, 'setting', e.target.value)
                            }
                            placeholder="Setting / Location"
                            className="rounded-lg bg-[var(--bg-input)] border border-[var(--border-subtle)] px-3 py-1.5 text-xs text-[var(--text-muted)] focus:outline-none focus:border-[#8B5CF6]"
                          />
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <VoiceDictationButton
                            compact
                            language={language}
                            contextHint="scene summary"
                            onTranscript={(spoken) =>
                              updateScene(
                                chapter.id,
                                scene.id,
                                'summary',
                                appendDictatedText(scene.summary, spoken)
                              )
                            }
                          />
                          <button
                            type="button"
                            disabled={sIdx === 0}
                            onClick={() => moveScene(chapter.id, sIdx, -1)}
                            aria-label="Move scene up"
                            className="w-7 h-7 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-muted)] disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={sIdx === chapter.scenes.length - 1}
                            onClick={() => moveScene(chapter.id, sIdx, 1)}
                            aria-label="Move scene down"
                            className="w-7 h-7 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-muted)] disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteScene(chapter.id, scene.id)}
                            aria-label="Delete scene"
                            className="w-7 h-7 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-subtle)] hover:text-red-500 dark:hover:text-red-300 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <textarea
                        rows={2}
                        value={scene.summary}
                        onChange={(e) =>
                          updateScene(chapter.id, scene.id, 'summary', e.target.value)
                        }
                        placeholder="Describe what unfolds in this scene..."
                        className="w-full rounded-lg bg-[var(--bg-input)] border border-[var(--border-subtle)] px-3 py-1.5 text-xs text-[var(--text-muted)] focus:outline-none focus:border-[#8B5CF6]"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
