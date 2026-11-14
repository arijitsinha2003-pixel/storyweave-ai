/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { Globe, Menu, Moon, Plus, Sun, X } from 'lucide-react';
import { LandingPage } from './components/LandingPage';
import { AuthGate } from './components/AuthGate';
import { Sidebar } from './components/Sidebar';
import { DashboardHome } from './components/DashboardHome';
import { ModuleWorkspace } from './components/ModuleWorkspace';
import { StoryGenerator } from './components/StoryGenerator';
import { MyStories } from './components/MyStories';
import { CharacterStudio } from './components/CharacterStudio';
import { PlotBuilder } from './components/PlotBuilder';
import { AiCoWriter } from './components/AiCoWriter';
import { AlternativeEndings } from './components/AlternativeEndings';
import { StoryVoiceAssistant } from './components/StoryVoiceAssistant';
import { CinematicIntro } from './components/cinematic/CinematicIntro';
import { LANGUAGE_OPTIONS, TRANSLATIONS } from './i18n/translations';
import {
  UserProfileRecord,
  deleteUserCharacter,
  deleteUserPlot,
  deleteUserStory,
  ensureUserProfile,
  saveUserCharacter,
  saveUserPlot,
  saveUserPreferences,
  saveUserStory,
  signOutAccount,
  subscribeAuthState,
  subscribeUserWorkspace,
} from './lib/firebase';
import {
  AppLanguage,
  AppView,
  CharacterProfile,
  NavSection,
  PlotOutline,
  StoryRecord,
  ThemeMode,
  WorkspacePreferences,
} from './types/story';

const PREFS_STORAGE_KEY = 'storyweave-preferences-cache';

function getInitialPreferences(): WorkspacePreferences {
  const defaults: WorkspacePreferences = {
    defaultLength: 'Medium',
    defaultTone: 'Atmospheric',
    editorFontSize: 'Standard',
    showWordCounts: true,
    language: 'en',
    theme: 'dark',
  };
  try {
    const raw = localStorage.getItem(PREFS_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<WorkspacePreferences>;
    return {
      ...defaults,
      ...parsed,
      language: parsed.language ?? 'en',
      theme: parsed.theme === 'light' ? 'light' : 'dark',
    };
  } catch {
    return defaults;
  }
}

export default function App() {
  const [view, setView] = useState<AppView>(AppView.Landing);
  const [showIntro, setShowIntro] = useState<boolean>(true);
  const [activeSection, setActiveSection] = useState<NavSection>(NavSection.Dashboard);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [authReady, setAuthReady] = useState(false);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileRecord | null>(null);
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'signin' | 'register'>('signin');

  const [stories, setStories] = useState<StoryRecord[]>([]);
  const [characters, setCharacters] = useState<CharacterProfile[]>([]);
  const [plots, setPlots] = useState<PlotOutline[]>([]);
  const [activeGeneratorStory, setActiveGeneratorStory] = useState<StoryRecord | null>(null);
  const [activeCoWriterStory, setActiveCoWriterStory] = useState<StoryRecord | null>(null);
  const [inspectedStory, setInspectedStory] = useState<StoryRecord | null>(null);

  const [preferences, setPreferences] = useState<WorkspacePreferences>(getInitialPreferences);

  const t = TRANSLATIONS[preferences.language];

  const sectionLabels: Record<NavSection, string> = {
    [NavSection.Dashboard]: t.nav.dashboard,
    [NavSection.MyStories]: t.nav.myStories,
    [NavSection.StoryGenerator]: t.nav.storyGenerator,
    [NavSection.CharacterStudio]: t.nav.characterStudio,
    [NavSection.PlotBuilder]: t.nav.plotBuilder,
    [NavSection.AiCoWriter]: t.nav.aiCoWriter,
    [NavSection.AlternativeEndings]: t.nav.alternativeEndings,
    [NavSection.Settings]: t.nav.settings,
  };

  // Sync Tailwind dark-mode class and local cache whenever preferences change
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', preferences.theme === 'dark');
    root.lang = preferences.language;
    try {
      localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // Ignore storage quota errors
    }
  }, [preferences]);

  // Listen to Firebase Auth state
  useEffect(() => {
    let active = true;
    const unsub = subscribeAuthState(async (user) => {
      if (!active) return;
      setAuthUser(user);
      setAuthReady(true);

      if (user) {
        try {
          const profile = await ensureUserProfile(user);
          if (active) {
            setUserProfile(profile);
            setShowAuthGate(false);
          }
        } catch (err) {
          console.error('Failed to sync writer profile:', err);
        }
      } else {
        setUserProfile(null);
      }
    });

    return () => {
      active = false;
      unsub();
    };
  }, []);

  // Load workspace from Firestore when authenticated, or local server fallback in guest mode
  useEffect(() => {
    if (!authReady) return;

    if (authUser) {
      const unsubscribeWorkspace = subscribeUserWorkspace(authUser.uid, {
        onStories: (items) => setStories(items),
        onCharacters: (items) => setCharacters(items),
        onPlots: (items) => setPlots(items),
        onPreferences: (prefs) =>
          setPreferences((prev) => ({
            ...prev,
            ...prefs,
          })),
        onError: (err) => console.error('Workspace sync error:', err),
      });
      return () => unsubscribeWorkspace();
    }

    let active = true;
    async function loadGuestWorkspace() {
      try {
        const res = await fetch('/api/workspace');
        if (!res.ok) return;
        const data = await res.json();
        if (!active) return;
        if (Array.isArray(data.stories)) setStories(data.stories);
        if (Array.isArray(data.characters)) setCharacters(data.characters);
        if (Array.isArray(data.plots)) setPlots(data.plots);
        if (data.preferences) {
          setPreferences((prev) => ({
            ...prev,
            ...data.preferences,
            language: data.preferences.language ?? prev.language ?? 'en',
            theme:
              data.preferences.theme === 'light'
                ? 'light'
                : data.preferences.theme === 'dark'
                  ? 'dark'
                  : prev.theme,
          }));
        }
      } catch {
        // Ignore transient startup error
      }
    }
    loadGuestWorkspace();
    return () => {
      active = false;
    };
  }, [authReady, authUser]);

  const handleEnterStudio = (initialSection: NavSection = NavSection.Dashboard) => {
    if (initialSection === NavSection.StoryGenerator) {
      setActiveGeneratorStory(null);
    }
    setActiveSection(initialSection);
    setView(AppView.Dashboard);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveStory = async (story: StoryRecord) => {
    setStories((prev) => {
      const exists = prev.some((item) => item.id === story.id);
      return exists
        ? prev.map((item) => (item.id === story.id ? story : item))
        : [story, ...prev];
    });
    setActiveGeneratorStory(story);

    if (authUser) {
      await saveUserStory(authUser.uid, story);
      return;
    }

    try {
      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(story),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.stories)) setStories(data.stories);
      }
    } catch {
      // Optimistic state already updated
    }
  };

  const handleDeleteStory = async (id: string) => {
    setStories((prev) => prev.filter((item) => item.id !== id));
    if (activeGeneratorStory?.id === id) setActiveGeneratorStory(null);
    if (activeCoWriterStory?.id === id) setActiveCoWriterStory(null);

    if (authUser) {
      await deleteUserStory(authUser.uid, id);
      return;
    }

    try {
      await fetch(`/api/stories/${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch {
      // Ignore network error
    }
  };

  const handleSaveCharacter = async (character: CharacterProfile) => {
    setCharacters((prev) => {
      const exists = prev.some((c) => c.id === character.id);
      return exists
        ? prev.map((c) => (c.id === character.id ? character : c))
        : [character, ...prev];
    });

    if (authUser) {
      await saveUserCharacter(authUser.uid, character);
      return;
    }

    try {
      const res = await fetch('/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(character),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.characters)) setCharacters(data.characters);
      }
    } catch {
      // Optimistic state already updated
    }
  };

  const handleDeleteCharacter = async (id: string) => {
    setCharacters((prev) => prev.filter((c) => c.id !== id));

    if (authUser) {
      await deleteUserCharacter(authUser.uid, id);
      return;
    }

    try {
      await fetch(`/api/characters/${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch {
      // Ignore network error
    }
  };

  const handleSavePlot = async (plot: PlotOutline) => {
    setPlots((prev) => {
      const exists = prev.some((p) => p.id === plot.id);
      return exists
        ? prev.map((p) => (p.id === plot.id ? plot : p))
        : [plot, ...prev];
    });

    if (authUser) {
      await saveUserPlot(authUser.uid, plot);
      return;
    }

    try {
      const res = await fetch('/api/plots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plot),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.plots)) setPlots(data.plots);
      }
    } catch {
      // Optimistic state already updated
    }
  };

  const handleDeletePlot = async (id: string) => {
    setPlots((prev) => prev.filter((p) => p.id !== id));

    if (authUser) {
      await deleteUserPlot(authUser.uid, id);
      return;
    }

    try {
      await fetch(`/api/plots/${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch {
      // Ignore network error
    }
  };

  const handleUpdatePreferences = async (next: WorkspacePreferences) => {
    setPreferences(next);

    if (authUser) {
      await saveUserPreferences(authUser.uid, next);
      return;
    }

    try {
      await fetch('/api/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      });
    } catch {
      // Ignore network error
    }
  };

  const handleChangeLanguage = (language: AppLanguage) => {
    handleUpdatePreferences({ ...preferences, language });
  };

  const handleToggleTheme = () => {
    const nextTheme: ThemeMode = preferences.theme === 'dark' ? 'light' : 'dark';
    handleUpdatePreferences({ ...preferences, theme: nextTheme });
  };

  const handleOpenInGenerator = (story: StoryRecord) => {
    setActiveGeneratorStory(story);
    setActiveSection(NavSection.StoryGenerator);
  };

  const handleOpenInCoWriter = (story: StoryRecord) => {
    setActiveCoWriterStory(story);
    setActiveSection(NavSection.AiCoWriter);
  };

  const handleIntroComplete = () => {
    setShowIntro(false);
  };

  const handleReplayIntro = () => {
    setShowAuthGate(false);
    setView(AppView.Landing);
    window.scrollTo({ top: 0, behavior: 'auto' });
    setShowIntro(true);
  };

  const handleOpenAuth = (mode: 'signin' | 'register' = 'signin') => {
    setAuthInitialMode(mode);
    setShowAuthGate(true);
  };

  const handleAuthSuccess = (profile: UserProfileRecord) => {
    setUserProfile(profile);
    setShowAuthGate(false);
    try {
      sessionStorage.removeItem('storyweave-auth-dismissed');
    } catch {
      // Ignore storage availability errors
    }
    setView(AppView.Dashboard);
    setActiveSection(NavSection.Dashboard);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleContinueGuest = () => {
    try {
      sessionStorage.setItem('storyweave-auth-dismissed', 'true');
    } catch {
      // Ignore storage availability errors
    }
    setShowAuthGate(false);
  };

  const handleSignOut = async () => {
    try {
      await signOutAccount();
      setUserProfile(null);
      setStories([]);
      setCharacters([]);
      setPlots([]);
      setActiveGeneratorStory(null);
      setActiveCoWriterStory(null);
      setView(AppView.Landing);
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  const authOverlay = showAuthGate && !showIntro && (
    <AuthGate
      language={preferences.language}
      theme={preferences.theme}
      preferences={preferences}
      initialMode={authInitialMode}
      onChangeLanguage={handleChangeLanguage}
      onToggleTheme={handleToggleTheme}
      onAuthSuccess={(profile) => handleAuthSuccess(profile)}
      onContinueGuest={handleContinueGuest}
    />
  );

  if (view === AppView.Landing) {
    return (
      <>
        <LandingPage
          language={preferences.language}
          theme={preferences.theme}
          preferences={preferences}
          userProfile={userProfile}
          onChangeLanguage={handleChangeLanguage}
          onToggleTheme={handleToggleTheme}
          onStartCreating={handleEnterStudio}
          onReplayIntro={handleReplayIntro}
          onOpenAuth={handleOpenAuth}
          onAuthSuccess={handleAuthSuccess}
          onSignOut={handleSignOut}
        />
        {authOverlay}
        {showIntro && <CinematicIntro onComplete={handleIntroComplete} />}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex transition-colors duration-200">
      <Sidebar
        activeSection={activeSection}
        language={preferences.language}
        userProfile={userProfile}
        onSelectSection={setActiveSection}
        onBackToLanding={() => {
          setView(AppView.Landing);
          setMobileSidebarOpen(false);
        }}
        onOpenAuth={handleOpenAuth}
        onSignOut={handleSignOut}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Dashboard Top Bar */}
        <header className="h-16 px-4 sm:px-8 border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)]/90 backdrop-blur-xl sticky top-0 z-30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden w-10 h-10 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-primary)] cursor-pointer shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-[var(--text-subtle)] hidden sm:inline whitespace-nowrap">
                {t.dashboard.studioTitle}
              </span>
              <span className="text-[var(--text-subtle)] hidden sm:inline" aria-hidden="true">
                /
              </span>
              <span className="font-semibold text-[var(--text-primary)] truncate">
                {sectionLabels[activeSection]}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Compact Language Switcher */}
            <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)]">
              <Globe className="w-3.5 h-3.5 text-[var(--accent-text)] shrink-0" />
              <select
                value={preferences.language}
                onChange={(e) => handleChangeLanguage(e.target.value as AppLanguage)}
                aria-label="Select app language"
                className="bg-transparent text-xs font-medium text-[var(--text-primary)] focus:outline-none cursor-pointer"
              >
                {LANGUAGE_OPTIONS.map((opt) => (
                  <option
                    key={opt.code}
                    value={opt.code}
                    className="bg-[var(--bg-surface)] text-[var(--text-primary)]"
                  >
                    {opt.nativeName}
                  </option>
                ))}
              </select>
            </label>

            {/* Light / Dark Theme Toggle */}
            <button
              type="button"
              onClick={handleToggleTheme}
              aria-label={
                preferences.theme === 'dark'
                  ? 'Switch to Light Mode'
                  : 'Switch to Dark Mode'
              }
              title={
                preferences.theme === 'dark'
                  ? t.settings.lightMode
                  : t.settings.darkMode
              }
              className="w-9 h-9 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[#8B5CF6]/55 flex items-center justify-center text-[var(--text-primary)] cursor-pointer transition-colors"
            >
              {preferences.theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-[var(--accent-text)]" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveGeneratorStory(null);
                setActiveSection(NavSection.StoryGenerator);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] hover:brightness-110 transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.dashboard.newStory}</span>
            </button>
          </div>
        </header>

        {/* Main Workspace Content */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {activeSection === NavSection.Dashboard && (
            <DashboardHome
              language={preferences.language}
              stories={stories}
              characters={characters}
              plots={plots}
              onNavigate={(section) => {
                if (section === NavSection.StoryGenerator) {
                  setActiveGeneratorStory(null);
                }
                setActiveSection(section);
              }}
              onInspectShowcase={(story) => {
                if (story.id.startsWith('example-')) {
                  setInspectedStory(story);
                } else {
                  handleOpenInGenerator(story);
                }
              }}
            />
          )}

          {activeSection === NavSection.StoryGenerator && (
            <StoryGenerator
              preferences={preferences}
              activeStory={activeGeneratorStory}
              onSaveStory={handleSaveStory}
              onOpenLibrary={() => setActiveSection(NavSection.MyStories)}
            />
          )}

          {activeSection === NavSection.MyStories && (
            <MyStories
              language={preferences.language}
              stories={stories}
              onCreateNew={() => {
                setActiveGeneratorStory(null);
                setActiveSection(NavSection.StoryGenerator);
              }}
              onOpenStory={handleOpenInGenerator}
              onCoWriteStory={handleOpenInCoWriter}
              onDeleteStory={handleDeleteStory}
            />
          )}

          {activeSection === NavSection.CharacterStudio && (
            <CharacterStudio
              language={preferences.language}
              characters={characters}
              stories={stories}
              onSaveCharacter={handleSaveCharacter}
              onDeleteCharacter={handleDeleteCharacter}
            />
          )}

          {activeSection === NavSection.PlotBuilder && (
            <PlotBuilder
              language={preferences.language}
              plots={plots}
              stories={stories}
              characters={characters}
              onSavePlot={handleSavePlot}
              onDeletePlot={handleDeletePlot}
            />
          )}

          {activeSection === NavSection.AiCoWriter && (
            <AiCoWriter
              stories={stories}
              characters={characters}
              preferences={preferences}
              initialStory={activeCoWriterStory}
              onSaveStory={handleSaveStory}
            />
          )}

          {activeSection === NavSection.AlternativeEndings && (
            <AlternativeEndings
              language={preferences.language}
              stories={stories}
              onSaveStory={handleSaveStory}
            />
          )}

          {activeSection === NavSection.Settings && (
            <ModuleWorkspace
              preferences={preferences}
              onUpdatePreferences={handleUpdatePreferences}
              onBackToDashboard={() => setActiveSection(NavSection.Dashboard)}
              onReplayIntro={handleReplayIntro}
            />
          )}
        </main>
      </div>

      {/* Showcase Story Inspection Modal from Dashboard */}
      {inspectedStory && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="dashboard-story-title"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
          onClick={() => setInspectedStory(null)}
        >
          <div
            className="w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-strong)] shadow-2xl p-6 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--accent-text)] mb-2">
                  <span>{inspectedStory.genre}</span>
                  <span aria-hidden="true">·</span>
                  <span>{inspectedStory.tone}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-figures">
                    {inspectedStory.wordCount.toLocaleString()} words
                  </span>
                </div>
                <h3
                  id="dashboard-story-title"
                  className="text-2xl font-bold text-[var(--text-primary)]"
                >
                  {inspectedStory.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectedStory(null)}
                aria-label="Close story modal"
                className="w-10 h-10 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-5 text-sm leading-relaxed text-[var(--text-muted)]">
              <StoryVoiceAssistant
                title={inspectedStory.title}
                text={inspectedStory.narrative}
                appLanguage={preferences.language}
                sourceLanguage={inspectedStory.language ?? 'en'}
                tone={inspectedStory.tone}
                compact
              />
              <p className="text-base leading-7 text-[var(--text-primary)]">
                {inspectedStory.narrative}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[var(--border-subtle)]">
                <div>
                  <h4 className="text-xs font-semibold text-[var(--accent-text)] mb-1">
                    {t.storyGen.conflict}
                  </h4>
                  <p className="text-[var(--text-muted)]">{inspectedStory.conflict}</p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[var(--accent-text)] mb-1">
                    {t.storyGen.climax} & {t.storyGen.resolution}
                  </h4>
                  <p className="text-[var(--text-muted)]">
                    {inspectedStory.climax} {inspectedStory.resolution}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {authOverlay}
    </div>
  );
}
