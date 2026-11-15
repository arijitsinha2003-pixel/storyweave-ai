import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Check,
  Edit3,
  Loader2,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { TRANSLATIONS } from '../i18n/translations';
import { AppLanguage, CharacterProfile, StoryRecord } from '../types/story';
import { VoiceDictationButton, appendDictatedText } from './VoiceDictationButton';

interface CharacterStudioProps {
  language: AppLanguage;
  characters: CharacterProfile[];
  stories: StoryRecord[];
  onSaveCharacter: (character: CharacterProfile) => Promise<void> | void;
  onDeleteCharacter: (id: string) => Promise<void> | void;
}

const ROLE_OPTIONS = [
  'Protagonist',
  'Antagonist',
  'Deuteragonist',
  'Mentor',
  'Rival',
  'Confidant',
  'Wildcard',
];

const CONCEPT_STARTERS = [
  'A classical sitar restorer in Varanasi hiding an ancestral secret',
  'A retired monsoon meteorologist tracking impossible storms along the Konkan coast',
  'A midnight archivist in Old Delhi who translates torn family letters',
];

export function CharacterStudio({
  language,
  characters,
  stories,
  onSaveCharacter,
  onDeleteCharacter,
}: CharacterStudioProps) {
  const t = TRANSLATIONS[language];

  // AI generation controls
  const [aiConcept, setAiConcept] = useState('');
  const [aiGenre, setAiGenre] = useState('Folklore & Magical Realism');
  const [aiRole, setAiRole] = useState('Protagonist');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiPopulatedNotice, setAiPopulatedNotice] = useState(false);

  // Character editor state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingCreatedAt, setEditingCreatedAt] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState('Protagonist');
  const [personality, setPersonality] = useState('');
  const [background, setBackground] = useState('');
  const [strengths, setStrengths] = useState<string[]>([]);
  const [weaknesses, setWeaknesses] = useState<string[]>([]);
  const [strengthInput, setStrengthInput] = useState('');
  const [weaknessInput, setWeaknessInput] = useState('');
  const [linkedStoryId, setLinkedStoryId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Library state
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const aiTimerRef = useRef<number | null>(null);
  const formHeadingRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
      if (aiTimerRef.current !== null) window.clearTimeout(aiTimerRef.current);
    };
  }, []);

  const storyTitleById = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of stories) {
      map.set(s.id, s.title);
    }
    return map;
  }, [stories]);

  const filteredCharacters = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return characters;
    return characters.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q) ||
        c.personality.toLowerCase().includes(q) ||
        c.background.toLowerCase().includes(q)
    );
  }, [characters, searchQuery]);

  const hasFormContent = Boolean(
    editingId ||
      name.trim() ||
      personality.trim() ||
      background.trim() ||
      strengths.length > 0 ||
      weaknesses.length > 0 ||
      strengthInput.trim() ||
      weaknessInput.trim() ||
      linkedStoryId
  );

  const resetForm = () => {
    setEditingId(null);
    setEditingCreatedAt(null);
    setName('');
    setRole('Protagonist');
    setPersonality('');
    setBackground('');
    setStrengths([]);
    setWeaknesses([]);
    setStrengthInput('');
    setWeaknessInput('');
    setLinkedStoryId('');
    setAiPopulatedNotice(false);
    setError(null);
  };

  const handleLoadIntoEditor = (character: CharacterProfile) => {
    setEditingId(character.id);
    setEditingCreatedAt(character.createdAt);
    setName(character.name);
    setRole(character.role);
    setPersonality(character.personality);
    setBackground(character.background);
    setStrengths([...character.strengths]);
    setWeaknesses([...character.weaknesses]);
    setStrengthInput('');
    setWeaknessInput('');
    setLinkedStoryId(character.linkedStoryId ?? '');
    setAiPopulatedNotice(false);
    setError(null);
    setSavedNotice(false);
    formHeadingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleGenerateWithAI = async () => {
    const concept = aiConcept.trim();
    if (concept.length < 3) {
      setAiError('Enter a brief character concept (at least 3 characters) to generate with AI.');
      return;
    }

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeoutId = window.setTimeout(() => controller.abort(), 100000);

    setIsGenerating(true);
    setAiError(null);
    setError(null);
    setSavedNotice(false);
    setAiPopulatedNotice(false);

    try {
      const response = await fetch('/api/characters/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          concept,
          genre: aiGenre.trim(),
          roleHint: aiRole,
          language,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.character) {
        throw new Error(data?.error || 'Could not generate character.');
      }

      const c = data.character;
      const cleanList = (arr: unknown): string[] =>
        Array.isArray(arr)
          ? Array.from(
              new Set(
                arr.map((item) => String(item ?? '').trim()).filter(Boolean)
              )
            ).slice(0, 15)
          : [];

      setEditingId(null);
      setEditingCreatedAt(null);
      setName(String(c.name ?? '').trim());
      setRole(String(c.role ?? aiRole).trim() || aiRole);
      setPersonality(String(c.personality ?? '').trim());
      setBackground(String(c.background ?? '').trim());
      setStrengths(cleanList(c.strengths));
      setWeaknesses(cleanList(c.weaknesses));
      setStrengthInput('');
      setWeaknessInput('');
      setLinkedStoryId('');
      setAiPopulatedNotice(true);
      if (aiTimerRef.current !== null) window.clearTimeout(aiTimerRef.current);
      aiTimerRef.current = window.setTimeout(() => setAiPopulatedNotice(false), 5000);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setAiError('Character generation timed out. Please try again.');
        return;
      }
      setAiError(err instanceof Error ? err.message : 'Character generation failed.');
    } finally {
      window.clearTimeout(timeoutId);
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      setIsGenerating(false);
    }
  };

  const addStrength = () => {
    const val = strengthInput.trim().slice(0, 240);
    if (!val) return;
    if (strengths.length >= 15) {
      setError('You can add up to 15 strengths per character.');
      return;
    }
    if (!strengths.includes(val)) {
      setStrengths((prev) => [...prev, val]);
    }
    setStrengthInput('');
    setError(null);
  };

  const addWeakness = () => {
    const val = weaknessInput.trim().slice(0, 240);
    if (!val) return;
    if (weaknesses.length >= 15) {
      setError('You can add up to 15 weaknesses per character.');
      return;
    }
    if (!weaknesses.includes(val)) {
      setWeaknesses((prev) => [...prev, val]);
    }
    setWeaknessInput('');
    setError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    const cleanName = name.trim().slice(0, 160);
    if (!cleanName) {
      setError('Character name is required.');
      return;
    }

    const finalStrengths = Array.from(
      new Set([
        ...strengths.map((s) => s.trim()).filter(Boolean),
        ...(strengthInput.trim() ? [strengthInput.trim().slice(0, 240)] : []),
      ])
    ).slice(0, 15);

    const finalWeaknesses = Array.from(
      new Set([
        ...weaknesses.map((w) => w.trim()).filter(Boolean),
        ...(weaknessInput.trim() ? [weaknessInput.trim().slice(0, 240)] : []),
      ])
    ).slice(0, 15);

    const profile: CharacterProfile = {
      id: editingId ?? `char-${Date.now()}`,
      name: cleanName,
      role: (role.trim() || 'Character').slice(0, 160),
      personality: personality.trim().slice(0, 3000),
      background: background.trim().slice(0, 5000),
      strengths: finalStrengths,
      weaknesses: finalWeaknesses,
      linkedStoryId: linkedStoryId || undefined,
      createdAt:
        editingCreatedAt ??
        new Date().toLocaleDateString('en-IN', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
    };

    setIsSaving(true);
    setError(null);
    try {
      await onSaveCharacter(profile);
      setSavedNotice(true);
      if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = window.setTimeout(() => setSavedNotice(false), 2500);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save character.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[var(--accent-text)] mb-1">
            {t.characters.kicker}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
            {t.characters.title}
          </h1>
        </div>
        <div className="text-xs text-[var(--text-muted)] font-mono tabular-figures">
          {characters.length} {characters.length === 1 ? 'profile' : 'profiles'}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-7 items-start">
        {/* Left: AI Generator + Profile Form */}
        <div className="xl:col-span-5 space-y-6">
          {/* AI Quick Generator */}
          <section className="glass-surface rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--accent-text)]" />
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                  {t.characters.generateWithAi}
                </h2>
              </div>
              <VoiceDictationButton
                language={language}
                contextHint="character concept prompt"
                onTranscript={(spoken) => {
                  setAiConcept((prev) => appendDictatedText(prev, spoken));
                  if (aiError) setAiError(null);
                }}
              />
            </div>

            <textarea
              rows={2}
              value={aiConcept}
              onChange={(e) => {
                setAiConcept(e.target.value);
                if (aiError) setAiError(null);
              }}
              placeholder="e.g., A classical sitar restorer in Varanasi hiding an ancestral secret..."
              aria-label="Character concept"
              className="w-full rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[#8B5CF6]"
            />

            <div className="flex flex-col gap-1.5">
              {CONCEPT_STARTERS.map((starter, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setAiConcept(starter);
                    setAiError(null);
                  }}
                  className="text-left text-xs text-[var(--accent-text)] hover:text-[var(--text-primary)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 transition-colors cursor-pointer line-clamp-1"
                >
                  {starter}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-xs text-[var(--text-muted)]">{t.storyGen.genre}</span>
                <input
                  type="text"
                  value={aiGenre}
                  onChange={(e) => setAiGenre(e.target.value)}
                  className="w-full rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#8B5CF6]"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs text-[var(--text-muted)]">{t.characters.roleLabel}</span>
                <select
                  value={aiRole}
                  onChange={(e) => setAiRole(e.target.value)}
                  className="w-full rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#8B5CF6]"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {aiError && (
              <div
                role="alert"
                className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 flex items-start gap-2 text-xs text-red-700 dark:text-red-200"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{aiError}</span>
              </div>
            )}

            {aiPopulatedNotice && (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-200">
                <Check className="w-4 h-4 shrink-0" />
                <span>Character profile generated below. Review or click Save Character to add to your roster.</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleGenerateWithAI}
              disabled={isGenerating}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{t.characters.generatingBtn}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t.characters.generateBtn}</span>
                </>
              )}
            </button>
          </section>

          {/* Manual / Edit Profile Form */}
          <form
            ref={formHeadingRef}
            onSubmit={handleSave}
            className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-6 space-y-4"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                {editingId ? t.characters.editHeading : t.characters.detailsHeading}
              </h2>
              {(editingId || hasFormContent) && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center gap-1 text-xs text-[var(--accent-text)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{editingId ? 'Cancel Edit' : 'Clear'}</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <label className="block space-y-1">
                <span className="text-xs font-medium text-[var(--text-muted)]">
                  {t.characters.nameLabel}
                </span>
                <input
                  type="text"
                  maxLength={160}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="e.g., Aarav Chatterjee"
                  className="w-full rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] px-3.5 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[#8B5CF6]"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-medium text-[var(--text-muted)]">
                  {t.characters.roleLabel}
                </span>
                <input
                  type="text"
                  maxLength={160}
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g., Protagonist"
                  className="w-full rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] px-3.5 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[#8B5CF6]"
                />
              </label>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="character-personality"
                  className="text-xs font-medium text-[var(--text-muted)]"
                >
                  {t.characters.personalityLabel}
                </label>
                <VoiceDictationButton
                  compact
                  language={language}
                  contextHint="character personality"
                  onTranscript={(spoken) =>
                    setPersonality((prev) => appendDictatedText(prev, spoken))
                  }
                />
              </div>
              <textarea
                id="character-personality"
                rows={2}
                maxLength={3000}
                value={personality}
                onChange={(e) => setPersonality(e.target.value)}
                placeholder="Temperament, speech habits, inner contradictions..."
                className="w-full rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] px-3.5 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="character-background"
                  className="text-xs font-medium text-[var(--text-muted)]"
                >
                  {t.characters.backgroundLabel}
                </label>
                <VoiceDictationButton
                  compact
                  language={language}
                  contextHint="character background"
                  onTranscript={(spoken) =>
                    setBackground((prev) => appendDictatedText(prev, spoken))
                  }
                />
              </div>
              <textarea
                id="character-background"
                rows={3}
                maxLength={5000}
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                placeholder="Origin, formative events, hidden secrets..."
                className="w-full rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] px-3.5 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>

            {/* Strengths Editor */}
            <div className="space-y-2">
              <span className="block text-xs font-medium text-[var(--text-muted)]">
                {t.characters.strengthsLabel}
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={240}
                  value={strengthInput}
                  onChange={(e) => setStrengthInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addStrength();
                    }
                  }}
                  placeholder="Add a strength..."
                  className="flex-1 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[#8B5CF6]"
                />
                <button
                  type="button"
                  onClick={addStrength}
                  aria-label="Add strength"
                  className="px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs font-medium text-[var(--text-primary)] hover:border-[#8B5CF6] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              {strengths.length > 0 && (
                <ul className="space-y-1 pt-1">
                  {strengths.map((item, idx) => (
                    <li
                      key={`${item}-${idx}`}
                      className="flex items-center justify-between gap-2 text-xs text-[var(--text-primary)] bg-[var(--bg-elevated)] rounded-lg px-3 py-1.5"
                    >
                      <span>{item}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setStrengths((prev) => prev.filter((_, i) => i !== idx))
                        }
                        aria-label={`Remove ${item}`}
                        className="text-[var(--text-subtle)] hover:text-[var(--text-primary)] cursor-pointer shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Weaknesses Editor */}
            <div className="space-y-2">
              <span className="block text-xs font-medium text-[var(--text-muted)]">
                {t.characters.weaknessesLabel}
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={240}
                  value={weaknessInput}
                  onChange={(e) => setWeaknessInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addWeakness();
                    }
                  }}
                  placeholder="Add a weakness or flaw..."
                  className="flex-1 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[#8B5CF6]"
                />
                <button
                  type="button"
                  onClick={addWeakness}
                  aria-label="Add weakness"
                  className="px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs font-medium text-[var(--text-primary)] hover:border-[#8B5CF6] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              {weaknesses.length > 0 && (
                <ul className="space-y-1 pt-1">
                  {weaknesses.map((item, idx) => (
                    <li
                      key={`${item}-${idx}`}
                      className="flex items-center justify-between gap-2 text-xs text-[var(--text-primary)] bg-[var(--bg-elevated)] rounded-lg px-3 py-1.5"
                    >
                      <span>{item}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setWeaknesses((prev) => prev.filter((_, i) => i !== idx))
                        }
                        aria-label={`Remove ${item}`}
                        className="text-[var(--text-subtle)] hover:text-[var(--text-primary)] cursor-pointer shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {(stories.length > 0 || linkedStoryId) && (
              <label className="block space-y-1">
                <span className="text-xs font-medium text-[var(--text-muted)]">
                  Link to Story (Optional)
                </span>
                <select
                  value={linkedStoryId}
                  onChange={(e) => setLinkedStoryId(e.target.value)}
                  className="w-full rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] px-3.5 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#8B5CF6]"
                >
                  <option value="">Standalone character</option>
                  {stories.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                  {linkedStoryId && !storyTitleById.has(linkedStoryId) && (
                    <option value={linkedStoryId}>Linked story ({linkedStoryId})</option>
                  )}
                </select>
              </label>
            )}

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
              type="submit"
              disabled={isSaving}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-[var(--text-primary)] bg-[var(--bg-elevated)] border border-[#8B5CF6]/45 hover:bg-[#8B5CF6]/15 disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-text)]" />
                  <span>Saving...</span>
                </>
              ) : savedNotice ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                  <span>{t.characters.savedBtn}</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 text-[var(--accent-text)]" />
                  <span>{editingId ? t.characters.updateBtn : t.characters.saveBtn}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right: Saved Character Roster */}
        <div className="xl:col-span-7 space-y-5">
          <div className="relative">
            <Search className="w-4 h-4 text-[var(--text-subtle)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.characters.searchPlaceholder}
              aria-label="Search characters"
              className="w-full rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] pl-10 pr-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[#8B5CF6]"
            />
          </div>

          {characters.length === 0 ? (
            <div className="rounded-2xl bg-[var(--bg-surface)] border border-dashed border-[var(--border-strong)] p-10 sm:p-14 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 flex items-center justify-center text-[var(--accent-text)] mx-auto mb-4">
                <Users className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                {t.characters.emptyTitle}
              </h2>
              <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto leading-relaxed">
                {t.characters.emptyDesc}
              </p>
            </div>
          ) : filteredCharacters.length === 0 ? (
            <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-8 text-center text-sm text-[var(--text-muted)]">
              No characters match your search.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredCharacters.map((character) => {
                const linkedTitle = character.linkedStoryId
                  ? storyTitleById.get(character.linkedStoryId)
                  : undefined;

                return (
                  <article
                    key={character.id}
                    className={`rounded-2xl bg-[var(--bg-surface)] border p-6 flex flex-col justify-between glow-border-hover ${
                      editingId === character.id
                        ? 'border-[#8B5CF6]/65'
                        : 'border-[var(--border-subtle)]'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs text-[var(--accent-text)] mb-1">
                            {character.role} · {character.createdAt}
                          </div>
                          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                            {character.name}
                          </h3>
                        </div>
                      </div>

                      {linkedTitle && (
                        <div className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg px-2.5 py-1 max-w-full">
                          <BookOpen className="w-3 h-3 text-[var(--accent-text)] shrink-0" />
                          <span className="truncate">{linkedTitle}</span>
                        </div>
                      )}

                      {character.personality && (
                        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                          <span className="text-[var(--text-subtle)] font-medium">
                            {t.characters.personalityLabel}:{' '}
                          </span>
                          {character.personality}
                        </p>
                      )}

                      {character.background && (
                        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                          <span className="text-[var(--text-subtle)] font-medium">
                            {t.characters.backgroundLabel}:{' '}
                          </span>
                          {character.background}
                        </p>
                      )}

                      {(character.strengths.length > 0 || character.weaknesses.length > 0) && (
                        <div className="pt-2 border-t border-[var(--border-subtle)] space-y-1.5 text-xs">
                          {character.strengths.length > 0 && (
                            <div className="text-[var(--text-muted)]">
                              <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                                {t.characters.strengthsLabel}:{' '}
                              </span>
                              {character.strengths.join(' · ')}
                            </div>
                          )}
                          {character.weaknesses.length > 0 && (
                            <div className="text-[var(--text-muted)]">
                              <span className="text-amber-700 dark:text-amber-300 font-medium">
                                {t.characters.weaknessesLabel}:{' '}
                              </span>
                              {character.weaknesses.join(' · ')}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mt-5 pt-4 border-t border-[var(--border-subtle)] flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleLoadIntoEditor(character)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--text-primary)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[#8B5CF6]/55 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{t.storyGen.edit}</span>
                      </button>

                      {confirmDeleteId === character.id ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--text-muted)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:text-[var(--text-primary)] cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={deletingId === character.id}
                            onClick={async () => {
                              setDeletingId(character.id);
                              setConfirmDeleteId(null);
                              try {
                                await onDeleteCharacter(character.id);
                                if (editingId === character.id) {
                                  resetForm();
                                }
                              } catch (err) {
                                setError(
                                  err instanceof Error
                                    ? err.message
                                    : 'Could not delete character.'
                                );
                              } finally {
                                setDeletingId(null);
                              }
                            }}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-700 dark:text-red-200 bg-red-500/15 border border-red-500/40 disabled:opacity-60 cursor-pointer"
                          >
                            Confirm
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(character.id)}
                          aria-label={`Delete ${character.name}`}
                          className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-subtle)] hover:text-red-500 dark:hover:text-red-300 hover:border-red-400/40 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
