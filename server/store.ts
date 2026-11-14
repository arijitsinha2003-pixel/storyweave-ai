import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export interface StoredCharacter {
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

export interface StoredPlotOutline {
  id: string;
  title: string;
  premise: string;
  linkedStoryId?: string;
  characterNames: string[];
  beats: {
    id: string;
    stage: string;
    title: string;
    summary: string;
  }[];
  chapters: {
    id: string;
    title: string;
    summary: string;
    scenes: {
      id: string;
      title: string;
      summary: string;
      setting?: string;
    }[];
  }[];
  updatedAt: string;
}

export interface StoredStory {
  id: string;
  idea?: string;
  title: string;
  description: string;
  genre: string;
  tone: string;
  writingStyle: string;
  lengthLabel: string;
  wordCount: number;
  narrative: string;
  conflict: string;
  climax: string;
  resolution: string;
  characters: string[];
  characterDetails?: { name: string; role: string; trait: string }[];
  alternativeEndings?: {
    type: string;
    title: string;
    endingText: string;
    emotionalNote: string;
  }[];
  preferredEndingType?: string;
  coverImage?: string;
  updatedAt: string;
}

export interface StoredPreferences {
  defaultLength: "Short" | "Medium" | "Long";
  defaultTone: string;
  editorFontSize: "Compact" | "Standard" | "Relaxed";
  showWordCounts: boolean;
  language?: "en" | "hi" | "bn" | "ta" | "mr" | "te";
  theme?: "dark" | "light";
}

export interface WorkspaceDatabase {
  stories: StoredStory[];
  characters: StoredCharacter[];
  plots: StoredPlotOutline[];
  preferences: StoredPreferences;
}

const PRIMARY_DATA_DIR = path.resolve(process.cwd(), "data");
const FALLBACK_DATA_DIR = path.join(os.tmpdir(), "storyweave-data");
let resolvedDataDir: string | null = null;

async function getDbFilePath(): Promise<string> {
  if (!resolvedDataDir) {
    try {
      await fs.mkdir(PRIMARY_DATA_DIR, { recursive: true });
      const testFile = path.join(PRIMARY_DATA_DIR, ".write-check");
      await fs.writeFile(testFile, "ok", "utf8");
      await fs.unlink(testFile);
      resolvedDataDir = PRIMARY_DATA_DIR;
    } catch {
      await fs.mkdir(FALLBACK_DATA_DIR, { recursive: true });
      resolvedDataDir = FALLBACK_DATA_DIR;
    }
  }
  return path.join(resolvedDataDir, "storyweave-db.json");
}

const DEFAULT_DB: WorkspaceDatabase = {
  stories: [],
  characters: [],
  plots: [],
  preferences: {
    defaultLength: "Medium",
    defaultTone: "Atmospheric",
    editorFontSize: "Standard",
    showWordCounts: true,
    language: "en",
    theme: "dark",
  },
};

export async function readWorkspaceDb(): Promise<WorkspaceDatabase> {
  const dbFile = await getDbFilePath();
  try {
    const raw = await fs.readFile(dbFile, "utf8");
    const parsed = JSON.parse(raw) as Partial<WorkspaceDatabase>;
    return {
      stories: Array.isArray(parsed.stories) ? parsed.stories : [],
      characters: Array.isArray(parsed.characters) ? parsed.characters : [],
      plots: Array.isArray(parsed.plots) ? parsed.plots : [],
      preferences: {
        ...DEFAULT_DB.preferences,
        ...(parsed.preferences ?? {}),
      },
    };
  } catch {
    await fs.writeFile(dbFile, JSON.stringify(DEFAULT_DB, null, 2), "utf8");
    return structuredClone(DEFAULT_DB);
  }
}

export async function writeWorkspaceDb(db: WorkspaceDatabase): Promise<void> {
  const dbFile = await getDbFilePath();
  const tempFile = `${dbFile}.tmp`;
  await fs.writeFile(tempFile, JSON.stringify(db, null, 2), "utf8");
  await fs.rename(tempFile, dbFile);
}
