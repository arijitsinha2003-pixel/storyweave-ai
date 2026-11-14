import {
  ArrowRight,
  BookOpen,
  Feather,
  GitBranch,
  Layers,
  PenTool,
  Plus,
  Users,
} from 'lucide-react';
import { EXAMPLE_STORIES } from '../data/showcaseStories';
import { TRANSLATIONS } from '../i18n/translations';
import {
  AppLanguage,
  CharacterProfile,
  NavSection,
  PlotOutline,
  StoryRecord,
} from '../types/story';

interface DashboardHomeProps {
  stories: StoryRecord[];
  characters: CharacterProfile[];
  plots: PlotOutline[];
  language: AppLanguage;
  onNavigate: (section: NavSection) => void;
  onInspectShowcase: (story: StoryRecord) => void;
}

export function DashboardHome({
  stories,
  characters,
  plots,
  language,
  onNavigate,
  onInspectShowcase,
}: DashboardHomeProps) {
  const t = TRANSLATIONS[language];
  const totalWords = stories.reduce((sum, story) => sum + story.wordCount, 0);

  const stats = [
    { label: t.dashboard.savedStoriesStat, value: stories.length.toString() },
    { label: t.dashboard.charactersStat, value: characters.length.toString() },
    { label: t.dashboard.plotsStat, value: plots.length.toString() },
    { label: t.dashboard.wordsStat, value: totalWords.toLocaleString() },
  ];

  const quickAccess = [
    {
      section: NavSection.StoryGenerator,
      title: t.nav.storyGenerator,
      description: 'Generate a complete story from a premise, genre, tone, and style.',
      icon: Feather,
    },
    {
      section: NavSection.CharacterStudio,
      title: t.nav.characterStudio,
      description: 'Build detailed characters with strengths, flaws, and backgrounds.',
      icon: Users,
    },
    {
      section: NavSection.PlotBuilder,
      title: t.nav.plotBuilder,
      description: 'Outline your six-stage plot and organize chapter beats.',
      icon: Layers,
    },
    {
      section: NavSection.AiCoWriter,
      title: t.nav.aiCoWriter,
      description: 'Draft in a calm editor with intelligent continuation and rewrites.',
      icon: PenTool,
    },
    {
      section: NavSection.AlternativeEndings,
      title: t.nav.alternativeEndings,
      description: 'Compare happy, sad, twist, and open conclusions for any draft.',
      icon: GitBranch,
    },
  ];

  return (
    <div className="space-y-10">
      {/* Welcome Banner */}
      <section className="glass-surface-elevated rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <p className="text-xs font-medium text-[var(--accent-text)] mb-2">
            {t.dashboard.welcomeKicker}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-2">
            {t.dashboard.welcomeTitle}
          </h1>
          <p className="text-sm sm:text-base text-[var(--text-muted)] max-w-2xl leading-relaxed">
            {t.dashboard.welcomeDesc}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate(NavSection.StoryGenerator)}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] hover:brightness-110 transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-md shadow-[#8B5CF6]/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A78BFA]"
        >
          <Plus className="w-4 h-4" />
          <span>{t.dashboard.createNewStory}</span>
        </button>
      </section>

      {/* Statistics Strip */}
      <section aria-label="Workspace Statistics">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-5"
            >
              <div className="text-xs font-medium text-[var(--text-subtle)] mb-2">
                {stat.label}
              </div>
              <div className="font-mono text-2xl sm:text-3xl font-semibold text-[var(--text-primary)] tabular-figures">
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Access Tools */}
      <section>
        <div className="flex items-center justify-between gap-4 mb-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            {t.dashboard.quickAccess}
          </h2>
          <span className="text-xs text-[var(--text-subtle)]">{t.dashboard.quickAccessHint}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {quickAccess.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.section}
                type="button"
                onClick={() => onNavigate(tool.section)}
                className="group text-left rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-6 glow-border-hover cursor-pointer flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 flex items-center justify-center text-[var(--accent-text)] mb-4">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1.5 group-hover:text-[var(--accent-text)] transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                    {tool.description}
                  </p>
                </div>
                <div className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent-text)]">
                  <span>{t.dashboard.openModule}</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Recent Stories / Empty State */}
      <section>
        <div className="flex items-center justify-between gap-4 mb-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            {t.dashboard.recentStories}
          </h2>
          <button
            type="button"
            onClick={() => onNavigate(NavSection.MyStories)}
            className="text-xs font-medium text-[var(--accent-text)] hover:opacity-80 transition-opacity cursor-pointer"
          >
            {t.dashboard.viewLibrary}
          </button>
        </div>

        {stories.length === 0 ? (
          <div className="rounded-2xl bg-[var(--bg-surface)] border border-dashed border-[var(--border-strong)] p-8 sm:p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 flex items-center justify-center text-[var(--accent-text)] mx-auto mb-4">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              {t.dashboard.emptyTitle}
            </h3>
            <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto leading-relaxed mb-6">
              {t.dashboard.emptyDesc}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate(NavSection.StoryGenerator)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] hover:brightness-110 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{t.dashboard.createNewStory}</span>
              </button>
              <button
                type="button"
                onClick={() => onInspectShowcase(EXAMPLE_STORIES[0])}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[#8B5CF6]/50 transition-colors cursor-pointer"
              >
                <span>{t.dashboard.inspectShowcase}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {stories.slice(0, 6).map((story) => (
              <div
                key={story.id}
                className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 text-xs text-[var(--accent-text)] mb-2">
                    <span>{story.genre}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-figures">
                      {story.wordCount.toLocaleString()} words
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2">
                    {story.title}
                  </h3>
                  <p className="text-sm text-[var(--text-muted)] line-clamp-3">
                    {story.description}
                  </p>
                </div>
                <div className="mt-5 pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--text-subtle)]">
                  <span>{story.updatedAt}</span>
                  <button
                    type="button"
                    onClick={() => onInspectShowcase(story)}
                    className="font-semibold text-[var(--accent-text)] hover:opacity-80 cursor-pointer"
                  >
                    {t.myStories.open}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
