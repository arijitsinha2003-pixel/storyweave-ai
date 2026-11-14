import {
  ArrowLeft,
  BookOpen,
  Feather,
  GitBranch,
  Layers,
  LayoutDashboard,
  LogIn,
  LogOut,
  PenTool,
  Settings,
  Users,
  X,
} from 'lucide-react';
import { BrandMark } from './BrandMark';
import { TRANSLATIONS } from '../i18n/translations';
import { UserProfileRecord } from '../lib/firebase';
import { AppLanguage, NavSection } from '../types/story';

interface SidebarProps {
  activeSection: NavSection;
  language: AppLanguage;
  userProfile?: UserProfileRecord | null;
  onSelectSection: (section: NavSection) => void;
  onBackToLanding: () => void;
  onOpenAuth?: (mode?: 'signin' | 'register') => void;
  onSignOut?: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  activeSection,
  language,
  userProfile,
  onSelectSection,
  onBackToLanding,
  onOpenAuth,
  onSignOut,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const t = TRANSLATIONS[language];

  const navItems: { id: NavSection; label: string; icon: typeof LayoutDashboard }[] = [
    { id: NavSection.Dashboard, label: t.nav.dashboard, icon: LayoutDashboard },
    { id: NavSection.MyStories, label: t.nav.myStories, icon: BookOpen },
    { id: NavSection.StoryGenerator, label: t.nav.storyGenerator, icon: Feather },
    { id: NavSection.CharacterStudio, label: t.nav.characterStudio, icon: Users },
    { id: NavSection.PlotBuilder, label: t.nav.plotBuilder, icon: Layers },
    { id: NavSection.AiCoWriter, label: t.nav.aiCoWriter, icon: PenTool },
    { id: NavSection.AlternativeEndings, label: t.nav.alternativeEndings, icon: GitBranch },
    { id: NavSection.Settings, label: t.nav.settings, icon: Settings },
  ];

  const handleSelect = (section: NavSection) => {
    onSelectSection(section);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="h-full flex flex-col bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] w-[264px]">
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-[var(--border-subtle)] flex items-center justify-between shrink-0">
        <button
          type="button"
          onClick={onBackToLanding}
          className="flex items-center gap-2.5 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] rounded-lg px-1"
        >
          <BrandMark className="w-7 h-7" />
          <span className="font-display text-base font-bold text-[var(--text-primary)] whitespace-nowrap">
            StoryWeave
          </span>
        </button>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close sidebar"
          className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav aria-label="Workspace Navigation" className="flex-1 overflow-y-auto px-3 py-5 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer whitespace-nowrap min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] ${
                isActive
                  ? 'bg-[#8B5CF6]/15 text-[var(--text-primary)] border border-[#8B5CF6]/40 shadow-sm shadow-[#8B5CF6]/10'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] border border-transparent'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? 'text-[var(--accent-text)]' : 'text-[var(--text-subtle)]'
                }`}
              />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Account & Return Actions */}
      <div className="p-4 border-t border-[var(--border-subtle)] space-y-2.5">
        {userProfile ? (
          <div className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-3 space-y-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              {userProfile.photoURL ? (
                <img
                  src={userProfile.photoURL}
                  alt={userProfile.penName || userProfile.displayName}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-lg object-cover shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/20 text-[var(--accent-text)] font-bold flex items-center justify-center text-xs shrink-0">
                  {(userProfile.penName || userProfile.displayName).charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-[var(--text-primary)] truncate">
                  {userProfile.penName || userProfile.displayName}
                </div>
                <div className="text-[11px] text-[var(--text-subtle)] truncate">
                  {userProfile.email}
                </div>
              </div>
            </div>
            {onSignOut && (
              <button
                type="button"
                onClick={() => {
                  onCloseMobile();
                  onSignOut();
                }}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[#8B5CF6]/45 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                <span>{t.auth.signOutBtn}</span>
              </button>
            )}
          </div>
        ) : (
          onOpenAuth && (
            <button
              type="button"
              onClick={() => {
                onCloseMobile();
                onOpenAuth('signin');
              }}
              className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] hover:brightness-110 transition-all cursor-pointer whitespace-nowrap min-h-[40px]"
            >
              <LogIn className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{t.auth.signInNavBtn}</span>
            </button>
          )
        )}

        <button
          type="button"
          onClick={onBackToLanding}
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-medium text-[var(--text-muted)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[#8B5CF6]/45 hover:text-[var(--text-primary)] transition-colors cursor-pointer whitespace-nowrap min-h-[40px]"
        >
          <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{t.nav.backToLanding}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block shrink-0">{sidebarContent}</aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex"
          role="dialog"
          aria-modal="true"
          aria-label="Sidebar Menu"
        >
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 h-full">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}
