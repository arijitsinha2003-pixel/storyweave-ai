import { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BookOpenCheck,
  Globe,
  Loader2,
  Lock,
  Moon,
  Sparkles,
  Sun,
} from 'lucide-react';
import { BrandMark } from './BrandMark';
import { LANGUAGE_OPTIONS, TRANSLATIONS } from '../i18n/translations';
import { signInWithGoogleAccount, UserProfileRecord } from '../lib/firebase';
import { AppLanguage, ThemeMode, WorkspacePreferences } from '../types/story';

interface AuthGateProps {
  language: AppLanguage;
  theme: ThemeMode;
  preferences: WorkspacePreferences;
  initialMode?: 'signin' | 'register';
  onChangeLanguage: (lang: AppLanguage) => void;
  onToggleTheme: () => void;
  onAuthSuccess: (profile: UserProfileRecord, mode: 'signin' | 'register') => void;
  onContinueGuest: () => void;
}

function GoogleIcon() {
  return (
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
  );
}

export function AuthGate({
  language,
  theme,
  preferences,
  initialMode = 'signin',
  onChangeLanguage,
  onToggleTheme,
  onAuthSuccess,
  onContinueGuest,
}: AuthGateProps) {
  const [mode, setMode] = useState<'signin' | 'register'>(initialMode);
  const [penName, setPenName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = TRANSLATIONS[language];

  const handleGoogleAuth = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const cleanPenName = mode === 'register' ? penName.trim() : undefined;
      const { profile } = await signInWithGoogleAccount(cleanPenName, preferences);
      onAuthSuccess(profile, mode);
    } catch (err: unknown) {
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code?: unknown }).code)
          : '';
      if (code === 'auth/popup-closed-by-user') {
        setError('Sign-in popup was closed before completing. Please try again.');
      } else if (code === 'auth/popup-blocked') {
        setError('Your browser blocked the sign-in popup. Please allow popups for this site and retry.');
      } else if (code === 'auth/unauthorized-domain') {
        setError(
          `This domain (${window.location.hostname}) is not authorized in Firebase Auth settings.`
        );
      } else {
        setError(
          err instanceof Error
            ? err.message
            : 'Could not complete authentication. Please try again.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[90] bg-[var(--bg-canvas)] text-[var(--text-primary)] overflow-y-auto flex flex-col justify-between transition-colors duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-gate-heading"
    >
      {/* Ambient Cosmic Backdrop matching Intro Crossfade */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/3 w-[560px] h-[560px] rounded-full bg-[#8B5CF6]/18 blur-[150px]" />
        <div className="absolute -bottom-32 right-1/4 w-[480px] h-[480px] rounded-full bg-[#6366F1]/14 blur-[150px]" />
      </div>

      {/* Top Controls Bar */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <BrandMark className="w-7 h-7" />
          <span className="font-display text-lg font-bold tracking-tight text-[var(--text-primary)]">
            StoryWeave
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)]">
            <Globe className="w-3.5 h-3.5 text-[var(--accent-text)] shrink-0" />
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
                  {opt.nativeName}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="w-9 h-9 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[#8B5CF6]/55 flex items-center justify-center text-[var(--text-primary)] cursor-pointer transition-colors"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-[var(--accent-text)]" />
            )}
          </button>
        </div>
      </header>

      {/* Main Split Editorial Auth Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Left Editorial Column */}
          <div className="lg:col-span-6 space-y-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent-text)]">
              {t.auth.kicker}
            </p>
            <h1
              id="auth-gate-heading"
              className="text-3xl sm:text-4xl lg:text-[2.65rem] font-bold leading-[1.12] tracking-tight text-[var(--text-primary)]"
            >
              {mode === 'signin' ? t.auth.signInTitle : t.auth.registerTitle}
            </h1>
            <p className="text-base text-[var(--text-muted)] leading-relaxed max-w-lg">
              {mode === 'signin' ? t.auth.signInSubtitle : t.auth.registerSubtitle}
            </p>

            <ul className="space-y-4 pt-2">
              <li className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 flex items-center justify-center text-[var(--accent-text)] shrink-0 mt-0.5">
                  <BookOpenCheck className="w-4 h-4" />
                </div>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                  {t.auth.benefitSync}
                </p>
              </li>
              <li className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 flex items-center justify-center text-[var(--accent-text)] shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                  {t.auth.benefitMultilingual}
                </p>
              </li>
              <li className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 flex items-center justify-center text-[var(--accent-text)] shrink-0 mt-0.5">
                  <Lock className="w-4 h-4" />
                </div>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                  {t.auth.benefitPrivate}
                </p>
              </li>
            </ul>
          </div>

          {/* Right Sign In / Register Panel */}
          <div className="lg:col-span-6">
            <div className="glass-surface-elevated rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/25">
              {/* Sign In / Register Mode Switcher */}
              <div
                role="tablist"
                aria-label="Authentication mode"
                className="grid grid-cols-2 gap-1.5 p-1.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] mb-6"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'signin'}
                  onClick={() => {
                    setMode('signin');
                    setError(null);
                  }}
                  className={`py-2.5 px-4 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                    mode === 'signin'
                      ? 'bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] text-white shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {t.auth.signInTab}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'register'}
                  onClick={() => {
                    setMode('register');
                    setError(null);
                  }}
                  className={`py-2.5 px-4 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                    mode === 'register'
                      ? 'bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] text-white shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {t.auth.registerTab}
                </button>
              </div>

              <div className="space-y-5">
                {mode === 'register' && (
                  <div>
                    <label
                      htmlFor="register-pen-name"
                      className="block text-xs font-semibold text-[var(--text-primary)] mb-2"
                    >
                      {t.auth.penNameLabel}
                    </label>
                    <input
                      id="register-pen-name"
                      type="text"
                      maxLength={120}
                      value={penName}
                      onChange={(e) => setPenName(e.target.value)}
                      placeholder={t.auth.penNamePlaceholder}
                      className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] focus:border-[#8B5CF6] focus:outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-subtle)] transition-colors"
                    />
                  </div>
                )}

                {error && (
                  <div
                    role="alert"
                    className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleGoogleAuth}
                  className="w-full py-3.5 px-5 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] border border-[var(--border-strong)] hover:border-[#8B5CF6]/60 text-sm font-semibold text-[var(--text-primary)] flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-text)]" />
                      <span>{t.auth.connectingBtn}</span>
                    </>
                  ) : (
                    <>
                      <GoogleIcon />
                      <span>
                        {mode === 'signin'
                          ? t.auth.signInGoogleBtn
                          : t.auth.registerGoogleBtn}
                      </span>
                    </>
                  )}
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMode(mode === 'signin' ? 'register' : 'signin');
                      setError(null);
                    }}
                    className="text-xs font-medium text-[var(--accent-text)] hover:underline cursor-pointer"
                  >
                    {mode === 'signin' ? t.auth.switchToRegister : t.auth.switchToSignIn}
                  </button>
                </div>

                <div className="pt-4 border-t border-[var(--border-subtle)]">
                  <button
                    type="button"
                    onClick={onContinueGuest}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] border border-transparent hover:border-[var(--border-subtle)] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>{t.auth.guestBtn}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 w-full max-w-6xl mx-auto px-6 py-4 text-center text-xs text-[var(--text-subtle)]">
        StoryWeave · Your Imagination. Our Intelligence. Infinite Stories.
      </footer>
    </div>
  );
}
