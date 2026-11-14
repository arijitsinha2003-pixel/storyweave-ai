import { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BookMarked,
  BookOpenCheck,
  Feather,
  GitBranch,
  Globe,
  Layers,
  Loader2,
  Lock,
  LogIn,
  LogOut,
  Menu,
  Moon,
  PenTool,
  Play,
  RotateCcw,
  Sparkles,
  Sun,
  Users,
  X,
} from 'lucide-react';
import { BrandMark } from './BrandMark';
import { SafeImage } from './SafeImage';
import { StoryVoiceAssistant } from './StoryVoiceAssistant';
import { EXAMPLE_STORIES, HERO_CANVAS_IMAGE } from '../data/showcaseStories';
import { LANGUAGE_OPTIONS, TRANSLATIONS } from '../i18n/translations';
import { signInWithGoogleAccount, UserProfileRecord } from '../lib/firebase';
import {
  AppLanguage,
  NavSection,
  StoryRecord,
  ThemeMode,
  WorkspacePreferences,
} from '../types/story';

interface LandingPageProps {
  language: AppLanguage;
  theme: ThemeMode;
  preferences?: WorkspacePreferences;
  userProfile?: UserProfileRecord | null;
  onChangeLanguage: (lang: AppLanguage) => void;
  onToggleTheme: () => void;
  onStartCreating: (initialSection?: NavSection) => void;
  onReplayIntro?: () => void;
  onOpenAuth?: (mode?: 'signin' | 'register') => void;
  onAuthSuccess?: (profile: UserProfileRecord) => void;
  onSignOut?: () => void;
}

export function LandingPage({
  language,
  theme,
  preferences,
  userProfile,
  onChangeLanguage,
  onToggleTheme,
  onStartCreating,
  onReplayIntro,
  onOpenAuth,
  onAuthSuccess,
  onSignOut,
}: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedStory, setSelectedStory] = useState<StoryRecord | null>(null);
  const [authTab, setAuthTab] = useState<'signin' | 'register'>('signin');
  const [penName, setPenName] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleInlineGoogleAuth = async () => {
    setAuthSubmitting(true);
    setAuthError(null);
    try {
      const cleanPen = authTab === 'register' ? penName.trim() : undefined;
      const { profile } = await signInWithGoogleAccount(cleanPen, preferences);
      onAuthSuccess?.(profile);
    } catch (err: unknown) {
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code?: unknown }).code)
          : '';
      if (code === 'auth/popup-closed-by-user') {
        setAuthError('Sign-in popup was closed before completing. Please try again.');
      } else if (code === 'auth/popup-blocked') {
        setAuthError('Your browser blocked the sign-in popup. Please allow popups and try again.');
      } else {
        setAuthError(
          err instanceof Error ? err.message : 'Authentication failed. Please try again.'
        );
      }
    } finally {
      setAuthSubmitting(false);
    }
  };

  const t = TRANSLATIONS[language];

  const features = [
    {
      id: NavSection.StoryGenerator,
      title: t.nav.storyGenerator,
      description:
        'Turn a single premise into a complete narrative in English or regional Indian languages with characters, conflict, climax, and resolution.',
      icon: Feather,
      span: 'lg:col-span-2',
      meta: 'Premise to full draft',
    },
    {
      id: NavSection.CharacterStudio,
      title: t.nav.characterStudio,
      description:
        'Craft memorable protagonists and antagonists with distinct personalities, cultural backgrounds, strengths, and flaws.',
      icon: Users,
      span: 'lg:col-span-1',
      meta: 'Reusable character profiles',
    },
    {
      id: NavSection.PlotBuilder,
      title: t.nav.plotBuilder,
      description:
        'Map six-stage dramatic arcs from inciting incident to resolution and organize every chapter and scene cleanly.',
      icon: Layers,
      span: 'lg:col-span-1',
      meta: 'Structured narrative beats',
    },
    {
      id: NavSection.AiCoWriter,
      title: t.nav.aiCoWriter,
      description:
        'Write inside a distraction-free manuscript editor with instant continuation, dialogue weaving, style shifts, and emotional depth.',
      icon: PenTool,
      span: 'lg:col-span-2',
      meta: 'Context-aware prose assistant',
    },
    {
      id: NavSection.AlternativeEndings,
      title: t.nav.alternativeEndings,
      description:
        'Explore happy, bittersweet, twist, or open conclusions for any draft and save the version that resonates most.',
      icon: GitBranch,
      span: 'lg:col-span-1',
      meta: 'Four distinct trajectories',
    },
    {
      id: NavSection.MyStories,
      title: t.nav.myStories,
      description:
        'Search, filter, reopen, and refine your saved manuscripts and character worlds across sessions.',
      icon: BookMarked,
      span: 'lg:col-span-2',
      meta: 'Organized creative archive',
    },
  ];

  const steps = [
    {
      number: '01. Spark the Premise',
      detail:
        'Pick your working language, describe a story idea, and set genre, tone, writing style, and length.',
    },
    {
      number: '02. Cast Your Characters',
      detail:
        'Build nuanced character sheets with clear motivations, strengths, and vulnerabilities that guide every scene.',
    },
    {
      number: '03. Architect the Plot',
      detail:
        'Organize introduction, rising tension, climax, and resolution into clear chapter and scene beats.',
    },
    {
      number: '04. Co-Write & Branch',
      detail:
        'Refine prose line by line in the distraction-free editor and test alternative endings before saving.',
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] relative overflow-x-clip">
      {/* Ambient background gradients */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute -top-40 left-1/4 w-[520px] h-[520px] rounded-full bg-[#8B5CF6]/10 blur-[140px]" />
        <div className="absolute top-1/3 -right-32 w-[460px] h-[460px] rounded-full bg-[#6366F1]/10 blur-[140px]" />
      </div>

      {/* Top Navigation Bar (Strict 3-Zone Contract) */}
      <header className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)]/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Wordmark */}
          <a
            href="#top"
            className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-[var(--text-primary)] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] rounded-lg px-1"
          >
            <BrandMark className="w-7 h-7" />
            <span>StoryWeave</span>
          </a>

          {/* Zone 2: 4 Concise Nav Links */}
          <nav
            aria-label="Primary Navigation"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-[var(--text-muted)]"
          >
            <a
              href="#features"
              className="hover:text-[var(--text-primary)] transition-colors whitespace-nowrap shrink-0 py-1"
            >
              {t.nav.features}
            </a>
            <a
              href="#how-it-works"
              className="hover:text-[var(--text-primary)] transition-colors whitespace-nowrap shrink-0 py-1"
            >
              {t.nav.howItWorks}
            </a>
            <a
              href="#example-stories"
              className="hover:text-[var(--text-primary)] transition-colors whitespace-nowrap shrink-0 py-1"
            >
              {t.nav.exampleStories}
            </a>
            <button
              type="button"
              onClick={() => onStartCreating(NavSection.Dashboard)}
              className="hover:text-[var(--text-primary)] transition-colors whitespace-nowrap shrink-0 py-1 cursor-pointer"
            >
              {t.nav.dashboard}
            </button>
          </nav>

          {/* Zone 3: Auth + Primary Action + Mobile Menu Trigger */}
          <div className="flex items-center gap-2.5 shrink-0">
            {userProfile ? (
              <div className="hidden sm:flex items-center gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)]">
                  {userProfile.photoURL ? (
                    <img
                      src={userProfile.photoURL}
                      alt={userProfile.penName || userProfile.displayName}
                      referrerPolicy="no-referrer"
                      className="w-5 h-5 rounded-md object-cover"
                    />
                  ) : (
                    <span className="w-5 h-5 rounded-md bg-[#8B5CF6]/20 text-[var(--accent-text)] font-bold flex items-center justify-center text-[11px]">
                      {(userProfile.penName || userProfile.displayName).charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="font-medium max-w-[120px] truncate">
                    {userProfile.penName || userProfile.displayName}
                  </span>
                </div>
                {onSignOut && (
                  <button
                    type="button"
                    onClick={onSignOut}
                    title={t.auth.signOutBtn}
                    aria-label={t.auth.signOutBtn}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[#8B5CF6]/50 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              onOpenAuth && (
                <button
                  type="button"
                  onClick={() => onOpenAuth('signin')}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-[var(--text-primary)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[#8B5CF6]/55 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5 text-[var(--accent-text)]" />
                  <span>{t.auth.signInNavBtn}</span>
                </button>
              )
            )}

            <button
              type="button"
              onClick={() => onStartCreating(NavSection.Dashboard)}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] hover:opacity-95 transition-opacity whitespace-nowrap shrink-0 cursor-pointer shadow-sm shadow-[#8B5CF6]/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A78BFA]"
            >
              <span>{t.landing.startCreating}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] px-6 py-4 space-y-2">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              {t.nav.features}
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              {t.nav.howItWorks}
            </a>
            <a
              href="#example-stories"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              {t.nav.exampleStories}
            </a>
            {userProfile ? (
              onSignOut && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onSignOut();
                  }}
                  className="w-full mt-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>
                    {t.auth.signOutBtn} ({userProfile.penName || userProfile.displayName})
                  </span>
                </button>
              )
            ) : (
              onOpenAuth && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth('signin');
                  }}
                  className="w-full mt-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-[var(--text-primary)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] cursor-pointer"
                >
                  <LogIn className="w-4 h-4 text-[var(--accent-text)]" />
                  <span>{t.auth.signInNavBtn}</span>
                </button>
              )
            )}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onStartCreating(NavSection.Dashboard);
              }}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] cursor-pointer"
            >
              <span>{t.landing.startCreating}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </header>

      <main id="top" className="relative z-10">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 pt-12 pb-20 lg:pt-18 lg:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            {/* Hero Copy Column */}
            <div className="lg:col-span-6 flex flex-col justify-center">
              <p className="text-sm font-medium text-[var(--accent-text)] mb-4">
                {t.landing.studioLabel}
              </p>
              <h1
                style={{ textWrap: 'balance' }}
                className="text-[clamp(2.25rem,4vw,3.75rem)] font-bold leading-[1.08] tracking-tight text-[var(--text-primary)] mb-6"
              >
                {t.landing.heroHeadline}
              </h1>
              <p className="text-base sm:text-lg text-[var(--text-muted)] leading-relaxed max-w-xl mb-8">
                {t.landing.heroDesc}
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => onStartCreating(NavSection.Dashboard)}
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] hover:brightness-110 transition-all cursor-pointer shadow-lg shadow-[#8B5CF6]/25 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A78BFA]"
                >
                  <span>{t.landing.startCreating}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <a
                  href="#features"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-[var(--text-primary)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[#8B5CF6]/50 hover:bg-[var(--bg-elevated)] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
                >
                  <span>{t.landing.exploreFeatures}</span>
                </a>
              </div>

              {/* Language & Theme Bar */}
              <div className="mt-8 pt-6 border-t border-[var(--border-subtle)] flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)]">
                  <Globe className="w-3.5 h-3.5 text-[var(--accent-text)] shrink-0" />
                  <span className="sr-only">Select Language</span>
                  <select
                    value={language}
                    onChange={(e) => onChangeLanguage(e.target.value as AppLanguage)}
                    aria-label="Choose application language"
                    className="bg-transparent text-xs font-medium text-[var(--text-primary)] focus:outline-none cursor-pointer"
                  >
                    {LANGUAGE_OPTIONS.map((opt) => (
                      <option
                        key={opt.code}
                        value={opt.code}
                        className="bg-[var(--bg-surface)] text-[var(--text-primary)]"
                      >
                        {opt.nativeName} · {opt.englishName}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  type="button"
                  onClick={onToggleTheme}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[#8B5CF6]/50 text-xs font-medium text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  {theme === 'dark' ? (
                    <>
                      <Sun className="w-3.5 h-3.5 text-[#A78BFA]" />
                      <span>{t.settings.lightMode}</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-3.5 h-3.5 text-[#6D28D9]" />
                      <span>{t.settings.darkMode}</span>
                    </>
                  )}
                </button>

                {onReplayIntro && (
                  <button
                    type="button"
                    onClick={onReplayIntro}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[#8B5CF6]/55 text-xs font-medium text-[var(--accent-text)] transition-colors cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Watch Opening</span>
                  </button>
                )}
              </div>
            </div>

            {/* Hero Visual Carrier */}
            <div className="lg:col-span-6 flex">
              <div className="relative w-full min-h-[300px] lg:min-h-[460px] rounded-2xl overflow-hidden border border-[var(--border-strong)] bg-[var(--bg-surface)] shadow-2xl shadow-black/20">
                <SafeImage
                  src={HERO_CANVAS_IMAGE}
                  alt="Atmospheric midnight study with open manuscripts and violet window light"
                  className="w-full h-full object-cover"
                  fallbackLabel="StoryWeave Studio"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-[#0B0B14]/90 via-[#0B0B14]/25 to-transparent"
                />
                <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8">
                  <div className="text-xs text-[#A78BFA] mb-1.5">
                    {t.landing.featuredCaptionLabel}
                  </div>
                  <p className="text-sm sm:text-base text-[#F8FAFC]/92 font-medium max-w-md">
                    {t.landing.featuredCaption}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Post-Video Writer Access: Sign In / Register Section */}
        <section
          id="writer-access"
          className="max-w-7xl mx-auto px-6 py-14 border-t border-[var(--border-subtle)]"
        >
          {userProfile ? (
            <div className="glass-surface-elevated rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                {userProfile.photoURL ? (
                  <img
                    src={userProfile.photoURL}
                    alt={userProfile.penName || userProfile.displayName}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-xl object-cover border border-[var(--border-strong)]"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center text-lg font-bold text-[var(--accent-text)]">
                    {(userProfile.penName || userProfile.displayName).charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-xs font-medium text-[var(--accent-text)]">
                    {t.auth.signedInAs}
                  </p>
                  <h2 className="text-xl font-bold text-[var(--text-primary)]">
                    {userProfile.penName || userProfile.displayName}
                  </h2>
                  <p className="text-xs text-[var(--text-subtle)]">{userProfile.email}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {onSignOut && (
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[#8B5CF6]/45 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{t.auth.signOutBtn}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onStartCreating(NavSection.Dashboard)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] hover:brightness-110 transition-all cursor-pointer shadow-md shadow-[#8B5CF6]/25"
                >
                  <span>{t.landing.openStudioBtn}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-surface-elevated rounded-2xl p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent-text)]">
                  {t.auth.kicker}
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
                  {authTab === 'signin' ? t.auth.signInTitle : t.auth.registerTitle}
                </h2>
                <p className="text-sm sm:text-base text-[var(--text-muted)] leading-relaxed">
                  {authTab === 'signin' ? t.auth.signInSubtitle : t.auth.registerSubtitle}
                </p>
                <ul className="space-y-2.5 pt-1 text-xs sm:text-sm text-[var(--text-muted)]">
                  <li className="flex items-center gap-2.5">
                    <BookOpenCheck className="w-4 h-4 text-[var(--accent-text)] shrink-0" />
                    <span>{t.auth.benefitSync}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-[var(--accent-text)] shrink-0" />
                    <span>{t.auth.benefitMultilingual}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Lock className="w-4 h-4 text-[var(--accent-text)] shrink-0" />
                    <span>{t.auth.benefitPrivate}</span>
                  </li>
                </ul>
              </div>

              <div className="lg:col-span-6">
                <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-5 sm:p-6 space-y-4">
                  <div
                    role="tablist"
                    aria-label="Writer Sign In or Register"
                    className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)]"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={authTab === 'signin'}
                      onClick={() => {
                        setAuthTab('signin');
                        setAuthError(null);
                      }}
                      className={`py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                        authTab === 'signin'
                          ? 'bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] text-white shadow-sm'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {t.auth.signInTab}
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={authTab === 'register'}
                      onClick={() => {
                        setAuthTab('register');
                        setAuthError(null);
                      }}
                      className={`py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                        authTab === 'register'
                          ? 'bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] text-white shadow-sm'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {t.auth.registerTab}
                    </button>
                  </div>

                  {authTab === 'register' && (
                    <div>
                      <label
                        htmlFor="landing-pen-name"
                        className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5"
                      >
                        {t.auth.penNameLabel}
                      </label>
                      <input
                        id="landing-pen-name"
                        type="text"
                        maxLength={120}
                        value={penName}
                        onChange={(e) => setPenName(e.target.value)}
                        placeholder={t.auth.penNamePlaceholder}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] focus:border-[#8B5CF6] focus:outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-subtle)]"
                      />
                    </div>
                  )}

                  {authError && (
                    <div
                      role="alert"
                      className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-700 dark:text-rose-300"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{authError}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={authSubmitting}
                    onClick={handleInlineGoogleAuth}
                    className="w-full py-3 px-4 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-canvas)] border border-[var(--border-strong)] hover:border-[#8B5CF6]/60 text-sm font-semibold text-[var(--text-primary)] flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-60"
                  >
                    {authSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-text)]" />
                        <span>{t.auth.connectingBtn}</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                          <path
                            fill="#EA4335"
                            d="M12 10.2v3.9h5.4c-.2 1.3-1.5 3.8-5.4 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.3 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z"
                          />
                          <path
                            fill="#34A853"
                            d="M3.5 7.4l3.2 2.3C7.5 7.7 9.6 6.2 12 6.2c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.3 14.6 2.4 12 2.4 8.3 2.4 5.1 4.5 3.5 7.4z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M12 21.6c2.6 0 4.8-.9 6.4-2.4l-3-2.4c-.8.6-1.9 1-3.4 1-3.8 0-5.1-2.5-5.4-3.7l-3.2 2.5C5 19.6 8.2 21.6 12 21.6z"
                          />
                          <path
                            fill="#4285F4"
                            d="M21.2 12.2c0-.6-.1-1.1-.2-1.6H12v3.9h5.4c-.3 1.4-1.1 2.4-2 3l3 2.4c1.8-1.6 2.8-4.1 2.8-7.7z"
                          />
                        </svg>
                        <span>
                          {authTab === 'signin'
                            ? t.auth.signInGoogleBtn
                            : t.auth.registerGoogleBtn}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Features Bento Grid */}
        <section
          id="features"
          className="max-w-7xl mx-auto px-6 py-20 border-t border-[var(--border-subtle)]"
        >
          <div className="max-w-2xl mb-12">
            <p className="text-sm font-medium text-[var(--accent-text)] mb-2">
              {t.landing.featuresKicker}
            </p>
            <h2 className="text-2xl sm:text-4xl font-bold text-[var(--text-primary)] mb-4">
              {t.landing.featuresHeading}
            </h2>
            <p className="text-base text-[var(--text-muted)] leading-relaxed">
              {t.landing.featuresSub}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <button
                  key={feature.id}
                  type="button"
                  onClick={() => onStartCreating(feature.id)}
                  className={`${feature.span} group text-left glass-surface glow-border-hover rounded-2xl p-7 flex flex-col justify-between cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-4 mb-5">
                      <div className="w-11 h-11 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 flex items-center justify-center text-[var(--accent-text)]">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-xs text-[var(--text-subtle)]">{feature.meta}</span>
                    </div>
                    <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2.5 group-hover:text-[var(--accent-text)] transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                  <div className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent-text)]">
                    <span>{t.landing.openInStudio}</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* How It Works */}
        <section
          id="how-it-works"
          className="max-w-7xl mx-auto px-6 py-20 border-t border-[var(--border-subtle)]"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-5">
              <p className="text-sm font-medium text-[var(--accent-text)] mb-2">
                {t.landing.workflowKicker}
              </p>
              <h2 className="text-2xl sm:text-4xl font-bold text-[var(--text-primary)] mb-4">
                {t.landing.workflowHeading}
              </h2>
              <p className="text-base text-[var(--text-muted)] leading-relaxed mb-8">
                {t.landing.workflowSub}
              </p>
              <button
                type="button"
                onClick={() => onStartCreating(NavSection.Dashboard)}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-[var(--text-primary)] bg-[var(--bg-elevated)] border border-[var(--border-strong)] hover:border-[#8B5CF6]/55 transition-colors cursor-pointer"
              >
                <span>{t.landing.enterStudio}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {steps.map((step) => (
                <div
                  key={step.number}
                  className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-6"
                >
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2.5">
                    {step.number}
                  </h3>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                    {step.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Example Stories Showcase (India-based) */}
        <section
          id="example-stories"
          className="max-w-7xl mx-auto px-6 py-20 border-t border-[var(--border-subtle)]"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="max-w-2xl">
              <p className="text-sm font-medium text-[var(--accent-text)] mb-2">
                {t.landing.showcaseKicker}
              </p>
              <h2 className="text-2xl sm:text-4xl font-bold text-[var(--text-primary)]">
                {t.landing.showcaseHeading}
              </h2>
            </div>
            <p className="text-sm text-[var(--text-subtle)] max-w-sm">
              {t.landing.showcaseSub}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {EXAMPLE_STORIES.map((story) => (
              <article
                key={story.id}
                className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] overflow-hidden flex flex-col glow-border-hover"
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-[var(--bg-elevated)]">
                  <SafeImage
                    src={story.coverImage || ''}
                    alt={`Illustration for ${story.title}`}
                    className="w-full h-full object-cover"
                    fallbackLabel={story.genre}
                  />
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--accent-text)] mb-2.5">
                      <span>{story.genre}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-figures">
                        {story.wordCount.toLocaleString()} words
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{story.tone}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                      {story.title}
                    </h3>
                    <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-6">
                      {story.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedStory(story)}
                    className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-[var(--text-primary)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[#8B5CF6]/55 transition-colors cursor-pointer"
                  >
                    {t.landing.readSample}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Bottom Conversion Band */}
        <section className="max-w-7xl mx-auto px-6 py-20 border-t border-[var(--border-subtle)]">
          <div className="glass-surface-elevated rounded-2xl p-8 sm:p-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="max-w-xl">
              <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-3">
                {t.landing.ctaHeading}
              </h2>
              <p className="text-base text-[var(--text-muted)] leading-relaxed">
                {t.landing.ctaSub}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onStartCreating(NavSection.Dashboard)}
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] hover:brightness-110 transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-lg shadow-[#8B5CF6]/25"
            >
              <span>{t.landing.openStudioBtn}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-canvas)]">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <BrandMark className="w-6 h-6" />
            <span className="font-display font-bold text-[var(--text-primary)]">
              StoryWeave
            </span>
            <span className="text-xs text-[var(--text-subtle)] ml-2">
              Your Imagination. Our Intelligence. Infinite Stories.
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-xs text-[var(--text-muted)]">
            <a href="#features" className="hover:text-[var(--text-primary)] transition-colors">
              {t.nav.features}
            </a>
            <a
              href="#how-it-works"
              className="hover:text-[var(--text-primary)] transition-colors"
            >
              {t.nav.howItWorks}
            </a>
            <a
              href="#example-stories"
              className="hover:text-[var(--text-primary)] transition-colors"
            >
              {t.nav.exampleStories}
            </a>
            {onReplayIntro && (
              <button
                type="button"
                onClick={onReplayIntro}
                className="inline-flex items-center gap-1.5 text-[var(--accent-text)] hover:text-[var(--text-primary)] transition-colors cursor-pointer font-medium"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Replay Intro</span>
              </button>
            )}
            <span>© {new Date().getFullYear()} StoryWeave</span>
          </div>
        </div>
      </footer>

      {/* Example Story Reader Modal */}
      {selectedStory && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="sample-story-title"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
          onClick={() => setSelectedStory(null)}
        >
          <div
            className="w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-strong)] shadow-2xl p-6 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--accent-text)] mb-2">
                  <span>{selectedStory.genre}</span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedStory.tone}</span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedStory.writingStyle}</span>
                </div>
                <h3
                  id="sample-story-title"
                  className="text-2xl font-bold text-[var(--text-primary)]"
                >
                  {selectedStory.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStory(null)}
                aria-label="Close story preview"
                className="w-10 h-10 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-6 text-sm leading-relaxed text-[var(--text-muted)]">
              <StoryVoiceAssistant
                title={selectedStory.title}
                text={selectedStory.narrative}
                appLanguage={language}
                sourceLanguage={selectedStory.language ?? 'en'}
                tone={selectedStory.tone}
                compact
              />

              <div>
                <h4 className="text-xs font-semibold text-[var(--accent-text)] mb-2">
                  Opening Excerpt
                </h4>
                <p className="text-base leading-7 text-[var(--text-primary)]">
                  {selectedStory.narrative}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-5 border-t border-[var(--border-subtle)]">
                <div>
                  <h4 className="text-xs font-semibold text-[var(--accent-text)] mb-1.5">
                    {t.storyGen.conflict}
                  </h4>
                  <p>{selectedStory.conflict}</p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[var(--accent-text)] mb-1.5">
                    {t.storyGen.climax} & {t.storyGen.resolution}
                  </h4>
                  <p>
                    {selectedStory.climax} {selectedStory.resolution}
                  </p>
                </div>
              </div>

              <div className="pt-5 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-xs text-[var(--text-subtle)]">
                  {t.storyGen.characters}: {selectedStory.characters.join(' · ')}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStory(null);
                    onStartCreating(NavSection.StoryGenerator);
                  }}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] cursor-pointer whitespace-nowrap shrink-0"
                >
                  <span>{t.landing.openInStudio}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
