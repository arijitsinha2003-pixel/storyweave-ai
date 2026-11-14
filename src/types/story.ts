export enum NavSection {
  Dashboard = 'dashboard',
  MyStories = 'my-stories',
  StoryGenerator = 'story-generator',
  CharacterStudio = 'character-studio',
  PlotBuilder = 'plot-builder',
  AiCoWriter = 'ai-co-writer',
  AlternativeEndings = 'alternative-endings',
  Settings = 'settings',
}

export enum AppView {
  Landing = 'landing',
  Dashboard = 'dashboard',
}

export type AppLanguage = 'en' | 'hi' | 'bn' | 'ta' | 'mr' | 'te';

export type ThemeMode = 'dark' | 'light';

export interface CharacterProfile {
  id: string;
  name: string;
  role: string;
  personality: string;
  background: string;
  strengths: string[];
  weaknesses: string[];
  linkedStoryId?: string;
  createdAt: string;
}

export type PlotStageName =
  | 'Introduction'
  | 'Inciting Incident'
  | 'Rising Action'
  | 'Climax'
  | 'Falling Action'
  | 'Resolution';

export interface PlotBeat {
  id: string;
  stage: PlotStageName;
  title: string;
  summary: string;
}

export interface PlotScene {
  id: string;
  title: string;
  summary: string;
  setting?: string;
}

export interface PlotChapter {
  id: string;
  title: string;
  summary: string;
  scenes: PlotScene[];
}

export interface PlotOutline {
  id: string;
  title: string;
  premise: string;
  linkedStoryId?: string;
  characterNames: string[];
  beats: PlotBeat[];
  chapters: PlotChapter[];
  updatedAt: string;
}

export type EndingType =
  | 'Happy Ending'
  | 'Sad Ending'
  | 'Unexpected Twist'
  | 'Open Ending';

export interface AlternativeEndingOption {
  type: EndingType;
  title: string;
  endingText: string;
  emotionalNote: string;
}

export interface GeneratedCharacterDetail {
  name: string;
  role: string;
  trait: string;
}

export interface StoryRecord {
  id: string;
  idea?: string;
  title: string;
  description: string;
  genre: string;
  tone: string;
  writingStyle: string;
  lengthLabel: string;
  language?: AppLanguage;
  wordCount: number;
  narrative: string;
  conflict: string;
  climax: string;
  resolution: string;
  characters: string[];
  characterDetails?: GeneratedCharacterDetail[];
  alternativeEndings?: AlternativeEndingOption[];
  preferredEndingType?: EndingType;
  coverImage?: string;
  updatedAt: string;
}

export interface WorkspacePreferences {
  defaultLength: 'Short' | 'Medium' | 'Long';
  defaultTone: string;
  editorFontSize: 'Compact' | 'Standard' | 'Relaxed';
  showWordCounts: boolean;
  language: AppLanguage;
  theme: ThemeMode;
}
