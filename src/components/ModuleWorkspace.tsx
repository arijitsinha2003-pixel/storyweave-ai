import { ArrowLeft, Check, Film, Globe, Moon, Sun } from 'lucide-react';
import { LANGUAGE_OPTIONS, TRANSLATIONS } from '../i18n/translations';
import { AppLanguage, WorkspacePreferences } from '../types/story';

interface SettingsViewProps {
  preferences: WorkspacePreferences;
  onUpdatePreferences: (next: WorkspacePreferences) => Promise<void> | void;
  onBackToDashboard: () => void;
  onReplayIntro?: () => void;
}

export function ModuleWorkspace({
  preferences,
  onUpdatePreferences,
  onBackToDashboard,
  onReplayIntro,
}: SettingsViewProps) {
  const t = TRANSLATIONS[preferences.language];

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[var(--accent-text)] mb-1">
            {t.settings.kicker}
          </p>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{t.settings.title}</h1>
        </div>
        <button
          type="button"
          onClick={onBackToDashboard}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-[var(--text-muted)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[#8B5CF6]/50 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t.settings.backToDashboard}</span>
        </button>
      </div>

      {/* Language & Theme Card */}
      <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-1">
            {t.settings.appearanceHeading}
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            Switch between Dark and Light mode or choose your preferred Indian / English working
            language for both the interface and Gemini AI writing tools.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-[var(--border-subtle)]">
          {/* Theme Mode */}
          <div className="space-y-2">
            <span className="block text-xs font-medium text-[var(--text-muted)]">
              {t.settings.themeLabel}
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  onUpdatePreferences({ ...preferences, theme: 'dark' })
                }
                className={`flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                  preferences.theme === 'dark'
                    ? 'bg-[#8B5CF6]/18 border-[#8B5CF6] text-[var(--text-primary)]'
                    : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>{t.settings.darkMode}</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdatePreferences({ ...preferences, theme: 'light' })
                }
                className={`flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                  preferences.theme === 'light'
                    ? 'bg-[#8B5CF6]/18 border-[#8B5CF6] text-[var(--text-primary)]'
                    : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>{t.settings.lightMode}</span>
              </button>
            </div>
          </div>

          {/* Language Selection */}
          <label className="block space-y-2">
            <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)]">
              <Globe className="w-3.5 h-3.5 text-[var(--accent-text)]" />
              <span>{t.settings.languageLabel}</span>
            </span>
            <select
              value={preferences.language}
              onChange={(e) =>
                onUpdatePreferences({
                  ...preferences,
                  language: e.target.value as AppLanguage,
                })
              }
              className="w-full rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#8B5CF6]"
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.nativeName} ({opt.englishName})
                </option>
              ))}
            </select>
          </label>
        </div>

        {onReplayIntro && (
          <div className="pt-4 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-[var(--text-primary)]">
                Cinematic Opening Sequence
              </div>
              <div className="text-xs text-[var(--text-subtle)]">
                Plays automatically on launch and every reload. Replay the 3D universe &amp; book opening anytime.
              </div>
            </div>
            <button
              type="button"
              onClick={onReplayIntro}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-primary)] bg-[var(--bg-elevated)] border border-[var(--border-strong)] hover:border-[#8B5CF6] transition-colors cursor-pointer shrink-0"
            >
              <Film className="w-3.5 h-3.5 text-[var(--accent-text)]" />
              <span>Replay Intro</span>
            </button>
          </div>
        )}
      </div>

      {/* Writing Defaults Card */}
      <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-1">
            {t.settings.defaultsHeading}
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            Changes save automatically to your StoryWeave workspace and apply across Story
            Generator and AI Co-Writer.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-[var(--border-subtle)]">
          <label className="block space-y-2">
            <span className="text-xs font-medium text-[var(--text-muted)]">
              {t.settings.defaultLength}
            </span>
            <select
              value={preferences.defaultLength}
              onChange={(e) =>
                onUpdatePreferences({
                  ...preferences,
                  defaultLength: e.target.value as WorkspacePreferences['defaultLength'],
                })
              }
              className="w-full rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#8B5CF6]"
            >
              <option value="Short">Short (450–650 words)</option>
              <option value="Medium">Medium (850–1,200 words)</option>
              <option value="Long">Long (1,400–1,800 words)</option>
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-medium text-[var(--text-muted)]">
              {t.settings.defaultTone}
            </span>
            <select
              value={preferences.defaultTone}
              onChange={(e) =>
                onUpdatePreferences({
                  ...preferences,
                  defaultTone: e.target.value,
                })
              }
              className="w-full rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#8B5CF6]"
            >
              <option value="Atmospheric">Atmospheric</option>
              <option value="Suspenseful">Suspenseful</option>
              <option value="Heartfelt">Heartfelt</option>
              <option value="Witty">Witty</option>
              <option value="Melancholic">Melancholic</option>
              <option value="Epic">Epic</option>
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-xs font-medium text-[var(--text-muted)]">
              {t.settings.editorScale}
            </span>
            <select
              value={preferences.editorFontSize}
              onChange={(e) =>
                onUpdatePreferences({
                  ...preferences,
                  editorFontSize: e.target.value as WorkspacePreferences['editorFontSize'],
                })
              }
              className="w-full rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#8B5CF6]"
            >
              <option value="Compact">Compact (15px)</option>
              <option value="Standard">Standard (16px)</option>
              <option value="Relaxed">Relaxed (18px)</option>
            </select>
          </label>

          <div className="flex items-center justify-between rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] px-4 py-3 self-end">
            <div>
              <div className="text-sm font-medium text-[var(--text-primary)]">
                {t.settings.showWordCounts}
              </div>
              <div className="text-xs text-[var(--text-subtle)]">
                Display live counters on drafts
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={preferences.showWordCounts}
              onClick={() =>
                onUpdatePreferences({
                  ...preferences,
                  showWordCounts: !preferences.showWordCounts,
                })
              }
              className={`w-11 h-6 rounded-full transition-colors p-0.5 cursor-pointer ${
                preferences.showWordCounts
                  ? 'bg-[#8B5CF6]'
                  : 'bg-[var(--bg-canvas)] border border-[var(--border-strong)]'
              }`}
            >
              <span
                className={`block w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                  preferences.showWordCounts ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="pt-5 border-t border-[var(--border-subtle)] space-y-2 text-xs text-[var(--text-muted)] leading-relaxed">
          <div className="flex items-center gap-2 text-[var(--accent-text)] font-medium">
            <Check className="w-3.5 h-3.5" />
            <span>Server-Side Gemini API & Workspace Persistence Active</span>
          </div>
          <p>
            All AI generation runs securely on the Node.js server using your configured{' '}
            <code className="text-[var(--text-primary)]">GEMINI_API_KEY</code> secret.
          </p>
        </div>
      </div>
    </div>
  );
}
