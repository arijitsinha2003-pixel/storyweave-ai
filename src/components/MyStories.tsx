import { useMemo, useState } from 'react';
import { BookOpen, Edit3, Headphones, PenTool, Plus, Search, Trash2, X } from 'lucide-react';
import { TRANSLATIONS } from '../i18n/translations';
import { StoryVoiceAssistant } from './StoryVoiceAssistant';
import { AppLanguage, StoryRecord } from '../types/story';

interface MyStoriesProps {
  stories: StoryRecord[];
  language: AppLanguage;
  onCreateNew: () => void;
  onOpenStory: (story: StoryRecord) => void;
  onCoWriteStory: (story: StoryRecord) => void;
  onDeleteStory: (id: string) => Promise<void> | void;
}

export function MyStories({
  stories,
  language,
  onCreateNew,
  onOpenStory,
  onCoWriteStory,
  onDeleteStory,
}: MyStoriesProps) {
  const t = TRANSLATIONS[language];
  const [searchQuery, setSearchQuery] = useState('');
  const [genreFilter, setGenreFilter] = useState('All');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [listeningStoryId, setListeningStoryId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const listeningStory = useMemo(
    () => stories.find((s) => s.id === listeningStoryId) ?? null,
    [stories, listeningStoryId]
  );

  const genres = useMemo(() => {
    const unique = Array.from(new Set(stories.map((s) => s.genre).filter(Boolean)));
    return ['All', ...unique];
  }, [stories]);

  const filteredStories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return stories.filter((story) => {
      const matchesGenre = genreFilter === 'All' || story.genre === genreFilter;
      const matchesQuery =
        !q ||
        story.title.toLowerCase().includes(q) ||
        story.description.toLowerCase().includes(q) ||
        story.characters.some((c) => c.toLowerCase().includes(q));
      return matchesGenre && matchesQuery;
    });
  }, [stories, searchQuery, genreFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[var(--accent-text)] mb-1">
            {t.myStories.kicker}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
            {t.myStories.title}
          </h1>
        </div>
        <button
          type="button"
          onClick={onCreateNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] hover:brightness-110 transition-all cursor-pointer self-start sm:self-auto whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>{t.myStories.generateNew}</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[var(--text-subtle)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.myStories.searchPlaceholder}
            aria-label="Search stories"
            className="w-full rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] pl-10 pr-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-[#8B5CF6]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {genres.map((genre) => {
            const active = genreFilter === genre;
            return (
              <button
                key={genre}
                type="button"
                onClick={() => setGenreFilter(genre)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-[#8B5CF6] text-white'
                    : 'bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {genre}
              </button>
            );
          })}
        </div>
      </div>

      {deleteError && (
        <div
          role="alert"
          className="rounded-xl bg-rose-500/10 border border-rose-500/35 px-4 py-3 text-xs text-rose-700 dark:text-rose-200"
        >
          {deleteError}
        </div>
      )}

      {/* Active Voice Reader Bar for Selected Story */}
      {listeningStory && (
        <div className="rounded-2xl bg-[var(--bg-surface)] border border-[#8B5CF6]/45 p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Headphones className="w-4 h-4 text-[var(--accent-text)] shrink-0" />
              <span className="text-sm font-semibold text-[var(--text-primary)] truncate">
                {listeningStory.title}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setListeningStoryId(null)}
              aria-label="Close voice player"
              className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <StoryVoiceAssistant
            title={listeningStory.title}
            text={listeningStory.narrative}
            appLanguage={language}
            sourceLanguage={listeningStory.language ?? language}
            tone={listeningStory.tone}
            compact
          />
        </div>
      )}

      {/* Story Cards or Empty State */}
      {stories.length === 0 ? (
        <div className="rounded-2xl bg-[var(--bg-surface)] border border-dashed border-[var(--border-strong)] p-10 sm:p-14 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 flex items-center justify-center text-[var(--accent-text)] mx-auto mb-4">
            <BookOpen className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            {t.myStories.emptyTitle}
          </h2>
          <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto leading-relaxed mb-6">
            {t.myStories.emptyDesc}
          </p>
          <button
            type="button"
            onClick={onCreateNew}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.myStories.createFirst}</span>
          </button>
        </div>
      ) : filteredStories.length === 0 ? (
        <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-10 text-center">
          <p className="text-sm text-[var(--text-muted)]">
            No stories match your current search or genre filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredStories.map((story) => (
            <article
              key={story.id}
              className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-6 flex flex-col justify-between glow-border-hover"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--accent-text)] mb-2.5">
                  <span>{story.genre}</span>
                  <span aria-hidden="true">·</span>
                  <span>{story.tone}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-figures">
                    {story.wordCount.toLocaleString()} words
                  </span>
                </div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                  {story.title}
                </h2>
                <p className="text-sm text-[var(--text-muted)] line-clamp-3 leading-relaxed mb-3">
                  {story.description}
                </p>
                {story.preferredEndingType && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-300 mb-3">
                    Ending: {story.preferredEndingType}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-[var(--text-subtle)]">{story.updatedAt}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setListeningStoryId((prev) => (prev === story.id ? null : story.id))
                    }
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                      listeningStoryId === story.id
                        ? 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-[var(--text-primary)]'
                        : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--accent-text)] hover:border-[#8B5CF6]/55'
                    }`}
                  >
                    <Headphones className="w-3.5 h-3.5" />
                    <span>{t.voice.listenBtn}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenStory(story)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--text-primary)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[#8B5CF6]/55 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{t.myStories.open}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onCoWriteStory(story)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--accent-text)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[#8B5CF6]/55 transition-colors cursor-pointer"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>{t.myStories.coWrite}</span>
                  </button>

                  {confirmDeleteId === story.id ? (
                    <button
                      type="button"
                      onClick={async () => {
                        setConfirmDeleteId(null);
                        setDeleteError(null);
                        try {
                          await onDeleteStory(story.id);
                        } catch (err) {
                          setDeleteError(
                            err instanceof Error ? err.message : 'Unable to delete story.'
                          );
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-700 dark:text-red-200 bg-red-500/15 border border-red-400/40 cursor-pointer"
                    >
                      Confirm
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(story.id)}
                      aria-label={`Delete ${story.title}`}
                      className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-subtle)] hover:text-red-500 hover:border-red-400/40 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
