import { useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  Edit3,
  Loader2,
  Plus,
  Search,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { TRANSLATIONS } from '../i18n/translations';
import { AppLanguage, CharacterProfile, StoryRecord } from '../types/story';

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

  // Character editor state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState('Protagonist');
  const [personality, setPersonality] = useState('');
  const [background, setBackground] = useState('');
  const [strengths, setStrengths] = useState<string[]>([]);
  const [weaknesses, setWeaknesses] = useState<string[]>([]);
  const [strengthInput, setStrengthInput] = useState('');
  const [weaknessInput, setWeaknessInput] = useState('');
  const [linkedStoryId, setLinkedStoryId] = useState('');

  // Library state
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);

  const filteredCharacters = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return characters;
    return characters.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q) ||
        c.personality.toLowerCase().includes(q)
    );
  }, [characters, searchQuery]);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setRole('Protagonist');
    setPersonality('');
    setBackground('');
    setStrengths([]);
    setWeaknesses([]);
    setStrengthInput('');
    setWeaknessInput('');
    setLinkedStoryId('');
    setError(null);
  };

  const handleLoadIntoEditor = (character: CharacterProfile) => {
    setEditingId(character.id);
    setName(character.name);
    setRole(character.role);
    setPersonality(character.personality);
    setBackground(character.background);
    setStrengths([...character.strengths]);
    setWeaknesses([...character.weaknesses]);
    setLinkedStoryId(character.linkedStoryId ?? '');
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGenerateWithAI = async () => {
    if (aiConcept.trim().length < 3) {
      setError('Enter a brief character concept (at least 3 characters) to generate with AI.');
      return;
    }
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/characters/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept: aiConcept.trim(),
          genre: aiGenre,
          roleHint: aiRole,
          language,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.character) {
        throw new Error(data?.error || 'Could not generate character.');
      }
      const c = data.character;
      setEditingId(null);
      setName(c.name || '');
      setRole(c.role || aiRole);
      setPersonality(c.personality || '');
      setBackground(c.background || '');
      setStrengths(Array.isArray(c.strengths) ? c.strengths : []);
      setWeaknesses(Array.isArray(c.weaknesses) ? c.weaknesses : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Character generation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  const addStrength = () => {
    const val = strengthInput.trim();
    if (!val) return;
    if (!strengths.includes(val)) {
      setStrengths((prev) => [...prev, val]);
    }
    setStrengthInput('');
  };

  const addWeakness = () => {
    const val = weaknessInput.trim();
    if (!val) return;
    if (!weaknesses.includes(val)) {
      setWeaknesses((prev) => [...prev, val]);
    }
    setWeaknessInput('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Character name is required.');
      return;
    }

    const profile: CharacterProfile = {
      id: editingId ?? `char-${Date.now()}`,
      name: name.trim(),
      role: role.trim() || 'Character',
      personality: personality.trim(),
      background: background.trim(),
      strengths,
      weaknesses,
      linkedStoryId: linkedStoryId || undefined,
      createdAt: new Date().toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    };

    await onSaveCharacter(profile);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
    resetForm();
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
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--accent-text)]" />
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                {t.characters.generateWithAi}
              </h2>
            </div>

            <textarea
              rows={2}
              value={aiConcept}
              onChange={(e) => {
                setAiConcept(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g., A classical sitar restorer in Varanasi hiding an ancestral secret..."
              className="w-full rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[#8B5CF6]"
            />

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

            <button
              type="button"
              onClick={handleGenerateWithAI}
              disabled={isGenerating}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] hover:brightness-110 disabled:opacity-60 transition-all cursor-pointer"
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
            onSubmit={handleSave}
            className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-6 space-y-4"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                {editingId ? t.characters.editHeading : t.characters.detailsHeading}
              </h2>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-[var(--accent-text)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  Cancel Edit
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
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g., Protagonist"
                  className="w-full rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] px-3.5 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[#8B5CF6]"
                />
              </label>
            </div>

            <label className="block space-y-1">
              <span className="text-xs font-medium text-[var(--text-muted)]">
                {t.characters.personalityLabel}
              </span>
              <textarea
                rows={2}
                value={personality}
                onChange={(e) => setPersonality(e.target.value)}
                placeholder="Temperament, speech habits, inner contradictions..."
                className="w-full rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] px-3.5 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[#8B5CF6]"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-medium text-[var(--text-muted)]">
                {t.characters.backgroundLabel}
              </span>
              <textarea
                rows={3}
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                placeholder="Origin, formative events, hidden secrets..."
                className="w-full rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] px-3.5 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[#8B5CF6]"
              />
            </label>

            {/* Strengths Editor */}
            <div className="space-y-2">
              <span className="block text-xs font-medium text-[var(--text-muted)]">
                {t.characters.strengthsLabel}
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
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
                  {strengths.map((item) => (
                    <li
                      key={item}
                      className="flex items-center justify-between gap-2 text-xs text-[var(--text-primary)] bg-[var(--bg-elevated)] rounded-lg px-3 py-1.5"
                    >
                      <span>{item}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setStrengths((prev) => prev.filter((s) => s !== item))
                        }
                        aria-label={`Remove ${item}`}
                        className="text-[var(--text-subtle)] hover:text-[var(--text-primary)] cursor-pointer"
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
                  {weaknesses.map((item) => (
                    <li
                      key={item}
                      className="flex items-center justify-between gap-2 text-xs text-[var(--text-primary)] bg-[var(--bg-elevated)] rounded-lg px-3 py-1.5"
                    >
                      <span>{item}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setWeaknesses((prev) => prev.filter((w) => w !== item))
                        }
                        aria-label={`Remove ${item}`}
                        className="text-[var(--text-subtle)] hover:text-[var(--text-primary)] cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {stories.length > 0 && (
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
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-[var(--text-primary)] bg-[var(--bg-elevated)] border border-[#8B5CF6]/45 hover:bg-[#8B5CF6]/15 transition-colors cursor-pointer"
            >
              {savedNotice ? (
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
              {filteredCharacters.map((character) => (
                <article
                  key={character.id}
                  className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-6 flex flex-col justify-between glow-border-hover"
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
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteCharacter(character.id);
                          setConfirmDeleteId(null);
                        }}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-700 dark:text-red-200 bg-red-500/15 border border-red-500/40 cursor-pointer"
                      >
                        Confirm
                      </button>
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
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
