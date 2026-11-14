import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";
import { readWorkspaceDb, writeWorkspaceDb } from "./server/store.ts";
import type {
  StoredCharacter,
  StoredPlotOutline,
  StoredPreferences,
  StoredStory,
} from "./server/store.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

let cachedAi: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!cachedAi) {
    cachedAi = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return cachedAi;
}

interface GenerateStoryRequest {
  idea?: string;
  genre?: string;
  tone?: string;
  writingStyle?: string;
  length?: "Short" | "Medium" | "Long";
  language?: string;
}

const LANGUAGE_MAP: Record<string, string> = {
  en: "English",
  hi: "Hindi (Devanagari script, natural literary Hindi)",
  bn: "Bengali (Bengali script, natural literary Bangla)",
  ta: "Tamil (Tamil script, natural literary Tamil)",
  mr: "Marathi (Devanagari script, natural literary Marathi)",
  te: "Telugu (Telugu script, natural literary Telugu)",
};

function resolveLanguageInstruction(lang?: string): string {
  const key = (lang ?? "en").trim().toLowerCase();
  return LANGUAGE_MAP[key] || (lang && lang.trim()) || "English";
}

const LENGTH_GUIDANCE: Record<string, string> = {
  Short: "approximately 450 to 650 words across 4-6 well-crafted paragraphs",
  Medium: "approximately 850 to 1,200 words across 7-10 vivid paragraphs",
  Long: "approximately 1,400 to 1,800 words across 11-15 immersive paragraphs",
};

const PRIMARY_TEXT_MODEL = "gemini-4-hydrogen";
const FALLBACK_TEXT_MODEL = "gemini-3.1-flash-lite";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isQuotaOrRateError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error ?? "");
  const status =
    typeof error === "object" && error !== null && "status" in error
      ? Number((error as { status?: unknown }).status)
      : 0;
  return (
    status === 429 ||
    status === 503 ||
    msg.includes("RESOURCE_EXHAUSTED") ||
    msg.includes("429") ||
    msg.includes("UNAVAILABLE") ||
    msg.includes("503")
  );
}

function extractRetryHint(message: string): string | null {
  const match =
    message.match(/Please retry in ([^."\\]+)/i) ||
    message.match(/"retryDelay"\s*:\s*"([^"]+)"/i);
  return match?.[1]?.trim() || null;
}

function parseJsonSafe(rawText: string): Record<string, unknown> {
  const cleaned = rawText
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return JSON.parse(cleaned) as Record<string, unknown>;
}

async function generateWithFallback(params: {
  contents: string;
  config?: {
    systemInstruction?: string;
    responseMimeType?: string;
    responseSchema?: unknown;
  };
}) {
  const ai = getAiClient();
  const baseConfig = params.config ?? {};

  try {
    return await ai.models.generateContent({
      model: PRIMARY_TEXT_MODEL,
      contents: params.contents,
      config: {
        ...baseConfig,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      } as Parameters<typeof ai.models.generateContent>[0]["config"],
    });
  } catch (primaryErr) {
    if (!isQuotaOrRateError(primaryErr)) {
      throw primaryErr;
    }

    console.warn(
      `Primary model (${PRIMARY_TEXT_MODEL}) hit rate/quota limit; falling back to ${FALLBACK_TEXT_MODEL}.`
    );
    await sleep(450);

    return await ai.models.generateContent({
      model: FALLBACK_TEXT_MODEL,
      contents: params.contents,
      config: baseConfig as Parameters<typeof ai.models.generateContent>[0]["config"],
    });
  }
}

function handleGeminiError(res: express.Response, error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;

  if (
    message.includes("API_KEY_INVALID") ||
    message.includes("PERMISSION_DENIED") ||
    message.includes("403")
  ) {
    console.warn(`${fallback}: authorization/key issue.`);
    return res.status(403).json({
      error:
        "Gemini API authorization failed. Please verify your GEMINI_API_KEY in Settings > Secrets.",
    });
  }

  if (isQuotaOrRateError(error)) {
    const retryHint = extractRetryHint(message);
    console.warn(`${fallback}: Gemini quota/rate limit reached.`);
    return res.status(429).json({
      error: retryHint
        ? `Gemini Free Tier quota reached (retry available in ${retryHint}). For uninterrupted generation, you can select a billing-enabled API key in Settings > Secrets.`
        : "Gemini API quota or rate limit reached. Please wait a moment and retry, or select a billing-enabled API key in Settings > Secrets.",
    });
  }

  console.error(`${fallback}:`, message);
  return res.status(500).json({
    error: `${fallback}: ${message}`,
  });
}

function ensureGeminiKey(res: express.Response): boolean {
  if (!process.env.GEMINI_API_KEY) {
    res.status(500).json({
      error:
        "GEMINI_API_KEY is not configured. Please add your Gemini API key in Settings > Secrets.",
    });
    return false;
  }
  return true;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "2mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  // --- Workspace Persistence Endpoints ---
  app.get("/api/workspace", async (_req, res) => {
    try {
      const db = await readWorkspaceDb();
      return res.json(db);
    } catch (error) {
      console.error("Failed to read workspace:", error);
      return res.status(500).json({ error: "Failed to load saved workspace." });
    }
  });

  app.post("/api/stories", async (req, res) => {
    try {
      const story = req.body as StoredStory;
      if (
        typeof story?.id !== "string" ||
        !story.id.trim() ||
        typeof story?.title !== "string" ||
        !story.title.trim()
      ) {
        return res.status(400).json({ error: "Invalid story payload." });
      }
      const db = await readWorkspaceDb();
      const idx = db.stories.findIndex((s) => s.id === story.id);
      if (idx >= 0) {
        db.stories[idx] = story;
      } else {
        db.stories.unshift(story);
      }
      await writeWorkspaceDb(db);
      return res.json({ story, stories: db.stories });
    } catch (error) {
      console.error("Failed to save story:", error);
      return res.status(500).json({ error: "Failed to save story." });
    }
  });

  app.delete("/api/stories/:id", async (req, res) => {
    try {
      const db = await readWorkspaceDb();
      db.stories = db.stories.filter((s) => s.id !== req.params.id);
      await writeWorkspaceDb(db);
      return res.json({ stories: db.stories });
    } catch (error) {
      console.error("Failed to delete story:", error);
      return res.status(500).json({ error: "Failed to delete story." });
    }
  });

  app.post("/api/characters", async (req, res) => {
    try {
      const character = req.body as StoredCharacter;
      if (
        typeof character?.id !== "string" ||
        !character.id.trim() ||
        typeof character?.name !== "string" ||
        !character.name.trim()
      ) {
        return res.status(400).json({ error: "Invalid character payload." });
      }
      const db = await readWorkspaceDb();
      const idx = db.characters.findIndex((c) => c.id === character.id);
      if (idx >= 0) {
        db.characters[idx] = character;
      } else {
        db.characters.unshift(character);
      }
      await writeWorkspaceDb(db);
      return res.json({ character, characters: db.characters });
    } catch (error) {
      console.error("Failed to save character:", error);
      return res.status(500).json({ error: "Failed to save character." });
    }
  });

  app.delete("/api/characters/:id", async (req, res) => {
    try {
      const db = await readWorkspaceDb();
      db.characters = db.characters.filter((c) => c.id !== req.params.id);
      await writeWorkspaceDb(db);
      return res.json({ characters: db.characters });
    } catch (error) {
      console.error("Failed to delete character:", error);
      return res.status(500).json({ error: "Failed to delete character." });
    }
  });

  app.post("/api/plots", async (req, res) => {
    try {
      const plot = req.body as StoredPlotOutline;
      if (
        typeof plot?.id !== "string" ||
        !plot.id.trim() ||
        typeof plot?.title !== "string" ||
        !plot.title.trim()
      ) {
        return res.status(400).json({ error: "Invalid plot payload." });
      }
      const db = await readWorkspaceDb();
      const idx = db.plots.findIndex((p) => p.id === plot.id);
      if (idx >= 0) {
        db.plots[idx] = plot;
      } else {
        db.plots.unshift(plot);
      }
      await writeWorkspaceDb(db);
      return res.json({ plot, plots: db.plots });
    } catch (error) {
      console.error("Failed to save plot:", error);
      return res.status(500).json({ error: "Failed to save plot outline." });
    }
  });

  app.delete("/api/plots/:id", async (req, res) => {
    try {
      const db = await readWorkspaceDb();
      db.plots = db.plots.filter((p) => p.id !== req.params.id);
      await writeWorkspaceDb(db);
      return res.json({ plots: db.plots });
    } catch (error) {
      console.error("Failed to delete plot:", error);
      return res.status(500).json({ error: "Failed to delete plot outline." });
    }
  });

  app.put("/api/preferences", async (req, res) => {
    try {
      const incoming = (req.body ?? {}) as Partial<StoredPreferences>;
      const db = await readWorkspaceDb();
      db.preferences = {
        ...db.preferences,
        defaultLength:
          incoming.defaultLength === "Short" ||
          incoming.defaultLength === "Medium" ||
          incoming.defaultLength === "Long"
            ? incoming.defaultLength
            : db.preferences.defaultLength,
        defaultTone:
          typeof incoming.defaultTone === "string" && incoming.defaultTone.trim()
            ? incoming.defaultTone.trim()
            : db.preferences.defaultTone,
        editorFontSize:
          incoming.editorFontSize === "Compact" ||
          incoming.editorFontSize === "Standard" ||
          incoming.editorFontSize === "Relaxed"
            ? incoming.editorFontSize
            : db.preferences.editorFontSize,
        showWordCounts:
          typeof incoming.showWordCounts === "boolean"
            ? incoming.showWordCounts
            : db.preferences.showWordCounts,
        language:
          incoming.language && LANGUAGE_MAP[incoming.language]
            ? incoming.language
            : db.preferences.language,
        theme:
          incoming.theme === "light" || incoming.theme === "dark"
            ? incoming.theme
            : db.preferences.theme,
      };
      await writeWorkspaceDb(db);
      return res.json({ preferences: db.preferences });
    } catch (error) {
      console.error("Failed to save preferences:", error);
      return res.status(500).json({ error: "Failed to save preferences." });
    }
  });

  // --- AI: Story Generator ---
  app.post("/api/stories/generate", async (req, res) => {
    if (!ensureGeminiKey(res)) return;
    try {
      const body = (req.body ?? {}) as GenerateStoryRequest;
      const idea = (body.idea ?? "").trim();
      const genre = (body.genre ?? "Literary Fantasy").trim();
      const tone = (body.tone ?? "Atmospheric").trim();
      const writingStyle = (body.writingStyle ?? "Lyrical Prose").trim();
      const length = body.length && LENGTH_GUIDANCE[body.length] ? body.length : "Medium";
      const targetLanguage = resolveLanguageInstruction(body.language);

      if (!idea || idea.length < 5) {
        return res.status(400).json({
          error: "Please enter a story idea (at least 5 characters) before generating.",
        });
      }

      const prompt = [
        `Craft an original, publication-quality story based on the following creative brief:`,
        `- Story Idea: ${idea}`,
        `- Genre: ${genre}`,
        `- Tone: ${tone}`,
        `- Writing Style: ${writingStyle}`,
        `- Output Language: ${targetLanguage}`,
        `- Target Narrative Length: ${LENGTH_GUIDANCE[length]}`,
        ``,
        `Requirements:`,
        `1. Write EVERY field's text content (title, description, character names/roles/traits, conflict, climax, resolution, and narrative) in ${targetLanguage}. Keep JSON property keys in English.`,
        `2. Create a memorable title and a concise 2-sentence description.`,
        `3. Write a complete, cohesive narrative separated into paragraphs using double newlines (\\n\\n), with sensory detail, authentic dialogue where appropriate, strong pacing, and a satisfying arc.`,
        `4. Include 3 to 4 distinct, interesting characters who appear in the story, specifying their name, story role, and defining trait/motivation.`,
        `5. Summarize the story's central conflict, climax, and resolution clearly.`,
      ].join("\n");

      const response = await generateWithFallback({
        contents: prompt,
        config: {
          systemInstruction:
            "You are StoryWeave's senior fiction editor and creative author. Write vivid, emotionally resonant, original fiction free of clichés. Always populate every field in the JSON schema completely, including the full multi-paragraph narrative.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            required: [
              "title",
              "description",
              "narrative",
              "characters",
              "conflict",
              "climax",
              "resolution",
            ],
            propertyOrdering: [
              "title",
              "description",
              "characters",
              "conflict",
              "climax",
              "resolution",
              "narrative",
            ],
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              characters: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  required: ["name", "role", "trait"],
                  properties: {
                    name: { type: Type.STRING },
                    role: { type: Type.STRING },
                    trait: { type: Type.STRING },
                  },
                },
              },
              conflict: { type: Type.STRING },
              climax: { type: Type.STRING },
              resolution: { type: Type.STRING },
              narrative: { type: Type.STRING },
            },
          },
        },
      });

      const rawText = (response.text ?? "").trim();
      if (!rawText) {
        return res.status(502).json({
          error: "Gemini returned an empty response. Please try generating again.",
        });
      }

      const parsed = parseJsonSafe(rawText);
      const narrative = String(parsed.narrative ?? "").trim();
      if (!narrative) {
        return res.status(502).json({
          error: "The generated story was incomplete. Please try generating again.",
        });
      }

      const rawChars = Array.isArray(parsed.characters) ? parsed.characters : [];
      const sanitizedChars = rawChars.map((c) => ({
        name: String((c as { name?: unknown })?.name ?? "Character").trim(),
        role: String((c as { role?: unknown })?.role ?? "Supporting").trim(),
        trait: String((c as { trait?: unknown })?.trait ?? "").trim(),
      }));

      const wordCount = narrative.split(/\s+/).filter(Boolean).length;
      return res.json({
        story: {
          title: String(parsed.title ?? "Untitled Story").trim(),
          description: String(parsed.description ?? "").trim(),
          narrative,
          characters: sanitizedChars,
          conflict: String(parsed.conflict ?? "").trim(),
          climax: String(parsed.climax ?? "").trim(),
          resolution: String(parsed.resolution ?? "").trim(),
          genre,
          tone,
          writingStyle,
          lengthLabel: `${length} Story`,
          wordCount,
        },
      });
    } catch (error) {
      return handleGeminiError(res, error, "Could not generate story");
    }
  });

  // --- AI: Character Studio ---
  app.post("/api/characters/generate", async (req, res) => {
    if (!ensureGeminiKey(res)) return;
    try {
      const { concept, genre, roleHint, language } = (req.body ?? {}) as {
        concept?: string;
        genre?: string;
        roleHint?: string;
        language?: string;
      };
      const targetLanguage = resolveLanguageInstruction(language);

      const cleanConcept = (concept ?? "").trim();
      if (cleanConcept.length < 3) {
        return res.status(400).json({
          error: "Please enter a brief character concept (at least 3 characters).",
        });
      }

      const prompt = [
        `Create a deeply layered fictional character profile based on:`,
        `- Concept: ${cleanConcept}`,
        genre ? `- Story Genre / Setting: ${genre}` : "",
        roleHint ? `- Desired Story Role: ${roleHint}` : "",
        `- Output Language: ${targetLanguage}`,
        ``,
        `Write ALL text values (name, role, personality, background, strengths, weaknesses) in ${targetLanguage}. Provide an original full name, clear narrative role, vivid personality summary, compelling background history, 3 distinct strengths, and 3 meaningful weaknesses/flaws.`,
      ]
        .filter(Boolean)
        .join("\n");

      const response = await generateWithFallback({
        contents: prompt,
        config: {
          systemInstruction:
            "You are a master character architect for novelists and screenwriters. Create human, memorable, flawed, multi-dimensional characters.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            required: ["name", "role", "personality", "background", "strengths", "weaknesses"],
            propertyOrdering: ["name", "role", "personality", "background", "strengths", "weaknesses"],
            properties: {
              name: { type: Type.STRING },
              role: { type: Type.STRING },
              personality: { type: Type.STRING },
              background: { type: Type.STRING },
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
          },
        },
      });

      const rawText = (response.text ?? "").trim();
      if (!rawText) {
        return res.status(502).json({ error: "Empty response from Gemini." });
      }
      const parsed = parseJsonSafe(rawText);
      return res.json({
        character: {
          name: String(parsed.name ?? "Unnamed Character").trim(),
          role: String(parsed.role ?? "Protagonist").trim(),
          personality: String(parsed.personality ?? "").trim(),
          background: String(parsed.background ?? "").trim(),
          strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(String) : [],
          weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses.map(String) : [],
        },
      });
    } catch (error) {
      return handleGeminiError(res, error, "Could not generate character");
    }
  });

  // --- AI: Plot Builder ---
  app.post("/api/plots/generate", async (req, res) => {
    if (!ensureGeminiKey(res)) return;
    try {
      const { premise, genre, characters, language } = (req.body ?? {}) as {
        premise?: string;
        genre?: string;
        characters?: { name: string; role: string; personality?: string }[];
        language?: string;
      };
      const targetLanguage = resolveLanguageInstruction(language);

      const cleanPremise = (premise ?? "").trim();
      if (cleanPremise.length < 5) {
        return res.status(400).json({
          error: "Please enter a story idea or premise (at least 5 characters).",
        });
      }

      const charText =
        Array.isArray(characters) && characters.length > 0
          ? characters
              .map(
                (c) =>
                  `- ${c.name} (${c.role})${c.personality ? `: ${c.personality}` : ""}`
              )
              .join("\n")
          : "No pre-cast characters specified; invent appropriate cast members.";

      const prompt = [
        `Build a complete 6-stage dramatic plot outline and chapter/scene breakdown:`,
        `- Story Premise: ${cleanPremise}`,
        genre ? `- Genre: ${genre}` : "",
        `- Output Language: ${targetLanguage}`,
        `- Cast Characters:\n${charText}`,
        ``,
        `Requirements:`,
        `1. Generate an evocative plot title in ${targetLanguage}.`,
        `2. Populate ALL 6 story arc beats keeping the exact English stage names ("Introduction", "Inciting Incident", "Rising Action", "Climax", "Falling Action", "Resolution") for the "stage" field, while writing each beat's "title" and "summary" in ${targetLanguage}.`,
        `3. Organize the narrative into 3 structured chapters in ${targetLanguage}, each containing 2 concrete scenes with a scene title, setting, and action summary.`,
      ]
        .filter(Boolean)
        .join("\n");

      const response = await generateWithFallback({
        contents: prompt,
        config: {
          systemInstruction:
            "You are a structural story editor. Build tight, causal plot arcs where every scene advances character motivation and conflict.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            required: ["title", "beats", "chapters"],
            propertyOrdering: ["title", "beats", "chapters"],
            properties: {
              title: { type: Type.STRING },
              beats: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  required: ["stage", "title", "summary"],
                  properties: {
                    stage: { type: Type.STRING },
                    title: { type: Type.STRING },
                    summary: { type: Type.STRING },
                  },
                },
              },
              chapters: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  required: ["title", "summary", "scenes"],
                  properties: {
                    title: { type: Type.STRING },
                    summary: { type: Type.STRING },
                    scenes: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        required: ["title", "setting", "summary"],
                        properties: {
                          title: { type: Type.STRING },
                          setting: { type: Type.STRING },
                          summary: { type: Type.STRING },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      const rawText = (response.text ?? "").trim();
      if (!rawText) {
        return res.status(502).json({ error: "Empty plot response from Gemini." });
      }
      const parsed = parseJsonSafe(rawText);
      const stages = [
        "Introduction",
        "Inciting Incident",
        "Rising Action",
        "Climax",
        "Falling Action",
        "Resolution",
      ];

      const rawBeats = Array.isArray(parsed.beats) ? parsed.beats : [];
      const normalizedBeats = stages.map((stage, idx) => {
        const match =
          rawBeats.find(
            (b: { stage?: string }) =>
              String(b.stage ?? "").toLowerCase() === stage.toLowerCase()
          ) ?? rawBeats[idx];
        return {
          id: `beat-${Date.now()}-${idx}`,
          stage,
          title: String(match?.title ?? stage).trim(),
          summary: String(match?.summary ?? "").trim(),
        };
      });

      const rawChapters = Array.isArray(parsed.chapters) ? parsed.chapters : [];
      const normalizedChapters = rawChapters.map(
        (
          ch: {
            title?: string;
            summary?: string;
            scenes?: { title?: string; setting?: string; summary?: string }[];
          },
          cIdx: number
        ) => ({
          id: `ch-${Date.now()}-${cIdx}`,
          title: String(ch.title ?? `Chapter ${cIdx + 1}`).trim(),
          summary: String(ch.summary ?? "").trim(),
          scenes: Array.isArray(ch.scenes)
            ? ch.scenes.map((sc, sIdx) => ({
                id: `sc-${Date.now()}-${cIdx}-${sIdx}`,
                title: String(sc.title ?? `Scene ${sIdx + 1}`).trim(),
                setting: String(sc.setting ?? "").trim(),
                summary: String(sc.summary ?? "").trim(),
              }))
            : [],
        })
      );

      return res.json({
        plot: {
          title: String(parsed.title ?? "Structured Plot Outline").trim(),
          beats: normalizedBeats,
          chapters: normalizedChapters,
        },
      });
    } catch (error) {
      return handleGeminiError(res, error, "Could not generate plot outline");
    }
  });

  // --- AI: Co-Writer Assistant ---
  app.post("/api/cowriter/assist", async (req, res) => {
    if (!ensureGeminiKey(res)) return;
    try {
      const {
        action,
        text,
        selectedText,
        targetStyle,
        storyContext,
        charactersContext,
        language,
      } = (req.body ?? {}) as {
        action?:
          | "continue"
          | "rewrite"
          | "grammar"
          | "dialogue"
          | "style"
          | "emotional";
        text?: string;
        selectedText?: string;
        targetStyle?: string;
        storyContext?: string;
        charactersContext?: string;
        language?: string;
      };
      const targetLanguage = resolveLanguageInstruction(language);

      const draftText = (text ?? "").trim();
      const focusPassage = (selectedText ?? "").trim() || draftText;
      if (!focusPassage && action !== "continue") {
        return res.status(400).json({
          error: "Please write or paste some text in the editor first.",
        });
      }
      if (!draftText && !storyContext) {
        return res.status(400).json({
          error: "Please write an opening sentence or link a story for context.",
        });
      }

      const actionInstructions: Record<string, string> = {
        continue:
          "Write the next 2 to 3 natural, vivid paragraphs continuing directly from where the manuscript leaves off. Match the existing voice, tense, and point of view. Return ONLY the new continuation paragraphs.",
        rewrite:
          "Rewrite the target passage to improve rhythm, imagery, clarity, and narrative momentum while preserving the core meaning and plot facts. Return ONLY the rewritten prose.",
        grammar:
          "Polish grammar, punctuation, syntax, and flow in the target passage while keeping the author's original voice intact. Return ONLY the corrected prose.",
        dialogue:
          "Write or weave natural, character-revealing dialogue into the scene (either continuing with dialogue or enriching the target passage with spoken lines and subtle action beats). Return ONLY the prose.",
        style: `Transform the target passage into the following writing style: ${targetStyle || "Lyrical Prose"}. Preserve the events and character details while shifting diction, cadence, and sentence structure. Return ONLY the transformed prose.`,
        emotional:
          "Deepen the emotional resonance, interiority, and sensory atmosphere of the target passage so the reader feels the stakes viscerally. Return ONLY the enhanced prose.",
      };

      const selectedAction = action && actionInstructions[action] ? action : "continue";
      const mode = selectedAction === "continue" ? "append" : "replace";

      const prompt = [
        `Output Language: ${targetLanguage}`,
        storyContext ? `Story Context:\n${storyContext}` : "",
        charactersContext ? `Active Characters:\n${charactersContext}` : "",
        selectedAction === "continue"
          ? `Manuscript So Far:\n${draftText}`
          : `Target Passage to Transform:\n${focusPassage}`,
        selectedAction !== "continue" && selectedText && draftText !== selectedText
          ? `\nBroader Draft Context (for continuity):\n${draftText.slice(-1600)}`
          : "",
        `\nTask: ${actionInstructions[selectedAction]}\nWrite the output prose in ${targetLanguage}.`,
      ]
        .filter(Boolean)
        .join("\n\n");

      const response = await generateWithFallback({
        contents: prompt,
        config: {
          systemInstruction:
            "You are StoryWeave's collaborative literary co-writer. Output clean, publication-ready prose with no meta-commentary, no markdown wrappers, and no introductory explanations.",
        },
      });

      const resultText = (response.text ?? "").trim();
      if (!resultText) {
        return res.status(502).json({ error: "Gemini returned empty co-writer text." });
      }

      return res.json({ resultText, mode });
    } catch (error) {
      return handleGeminiError(res, error, "AI Co-Writer request failed");
    }
  });

  // --- AI: Alternative Endings ---
  app.post("/api/endings/generate", async (req, res) => {
    if (!ensureGeminiKey(res)) return;
    try {
      const { title, premise, narrative, conflict, climax, language } = (req.body ?? {}) as {
        title?: string;
        premise?: string;
        narrative?: string;
        conflict?: string;
        climax?: string;
        language?: string;
      };
      const targetLanguage = resolveLanguageInstruction(language);

      const sourceMaterial = [premise, narrative, conflict, climax]
        .filter(Boolean)
        .join("\n")
        .trim();

      if (sourceMaterial.length < 10) {
        return res.status(400).json({
          error: "Please select a saved story or enter a story summary first.",
        });
      }

      const prompt = [
        `Generate 4 distinct alternative endings for this story:`,
        title ? `Title: ${title}` : "",
        premise ? `Premise: ${premise}` : "",
        conflict ? `Central Conflict: ${conflict}` : "",
        climax ? `Climax: ${climax}` : "",
        `- Output Language: ${targetLanguage}`,
        narrative ? `Story Excerpt / Draft:\n${narrative.slice(0, 3000)}` : "",
        ``,
        `You MUST generate exactly 4 endings using these exact English strings for the "type" field:`,
        `1. "Happy Ending"`,
        `2. "Sad Ending"`,
        `3. "Unexpected Twist"`,
        `4. "Open Ending"`,
        `Write each ending's "title", "endingText" (2-3 cohesive paragraphs), and "emotionalNote" in ${targetLanguage}.`,
      ]
        .filter(Boolean)
        .join("\n");

      const response = await generateWithFallback({
        contents: prompt,
        config: {
          systemInstruction:
            "You are a master fiction editor crafting distinct, believable, emotionally earned story endings.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            required: ["endings"],
            properties: {
              endings: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  required: ["type", "title", "endingText", "emotionalNote"],
                  propertyOrdering: ["type", "title", "endingText", "emotionalNote"],
                  properties: {
                    type: { type: Type.STRING },
                    title: { type: Type.STRING },
                    endingText: { type: Type.STRING },
                    emotionalNote: { type: Type.STRING },
                  },
                },
              },
            },
          },
        },
      });

      const rawText = (response.text ?? "").trim();
      if (!rawText) {
        return res.status(502).json({ error: "Gemini returned an empty endings response." });
      }
      const parsed = parseJsonSafe(rawText);
      const expectedTypes = [
        "Happy Ending",
        "Sad Ending",
        "Unexpected Twist",
        "Open Ending",
      ];
      const rawEndings = Array.isArray(parsed.endings) ? parsed.endings : [];

      const endings = expectedTypes.map((typeName, idx) => {
        const match =
          rawEndings.find(
            (e: { type?: string }) =>
              String(e.type ?? "").toLowerCase() === typeName.toLowerCase()
          ) ?? rawEndings[idx];
        return {
          type: typeName,
          title: String(match?.title ?? typeName).trim(),
          endingText: String(match?.endingText ?? "").trim(),
          emotionalNote: String(match?.emotionalNote ?? "").trim(),
        };
      });

      return res.json({ endings });
    } catch (error) {
      return handleGeminiError(res, error, "Could not generate alternative endings");
    }
  });

  // --- AI: Voice Assistant Story Reader (Gemini 3.8 TTS + Cross-Language Adaptation) ---
  app.post("/api/voice/read", async (req, res) => {
    if (!ensureGeminiKey(res)) return;
    const allowedVoices = new Set(["Kore", "Puck", "Charon", "Fenrir", "Zephyr"]);
    let preparedSpokenText = "";
    let wasTranslated = false;

    try {
      const {
        text,
        title,
        targetLanguage,
        sourceLanguage,
        voiceName,
        tone,
      } = (req.body ?? {}) as {
        text?: string;
        title?: string;
        targetLanguage?: string;
        sourceLanguage?: string;
        voiceName?: string;
        tone?: string;
      };

      const cleanText = (text ?? "").trim().slice(0, 2600);
      if (cleanText.length < 2) {
        return res.status(400).json({ error: "No story text provided to read aloud." });
      }

      const targetCode = (targetLanguage ?? "en").trim().toLowerCase();
      const sourceCode = (sourceLanguage ?? "").trim().toLowerCase();
      const targetLangInstruction = resolveLanguageInstruction(targetCode);
      const safeVoice = voiceName && allowedVoices.has(voiceName) ? voiceName : "Kore";

      // Script-aware detection for whether the passage needs translation/adaptation
      const hasDevanagari = /[\u0900-\u097F]/.test(cleanText);
      const hasBengali = /[\u0980-\u09FF]/.test(cleanText);
      const hasTamil = /[\u0B80-\u0BFF]/.test(cleanText);
      const hasTelugu = /[\u0C00-\u0C7F]/.test(cleanText);
      const hasAnyIndic = /[\u0900-\u0D7F]/.test(cleanText);

      let needsAdaptation = false;
      if (targetCode === "en") {
        needsAdaptation = hasAnyIndic;
      } else if (targetCode === "bn") {
        needsAdaptation = !hasBengali;
      } else if (targetCode === "ta") {
        needsAdaptation = !hasTamil;
      } else if (targetCode === "te") {
        needsAdaptation = !hasTelugu;
      } else if (targetCode === "hi" || targetCode === "mr") {
        needsAdaptation =
          !hasDevanagari ||
          ((sourceCode === "hi" || sourceCode === "mr") && sourceCode !== targetCode);
      } else if (sourceCode && sourceCode !== targetCode) {
        needsAdaptation = true;
      }

      preparedSpokenText = cleanText;

      if (needsAdaptation) {
        try {
          const translatePrompt = [
            `Translate and naturally adapt this story passage for spoken audiobook narration in ${targetLangInstruction}.`,
            title ? `Story Title context: ${title}` : "",
            tone ? `Tone: ${tone}` : "",
            `Rules: Output ONLY the fluent spoken-ready ${targetLangInstruction} prose (no commentary, no quotes around the whole passage, no markdown). Keep paragraph breaks intact.`,
            ``,
            `Passage:\n${cleanText}`,
          ]
            .filter(Boolean)
            .join("\n");

          const translatedResp = await generateWithFallback({
            contents: translatePrompt,
            config: {
              systemInstruction:
                "You are a literary translator and audiobook script adapter. Produce natural, expressive, ready-to-read prose strictly in the target language.",
            },
          });

          const adapted = (translatedResp.text ?? "").trim();
          if (adapted) {
            preparedSpokenText = adapted;
            wasTranslated = true;
          }
        } catch (transErr) {
          if (isQuotaOrRateError(transErr)) {
            throw transErr;
          }
          // Non-quota translation error: fall through and narrate original text
          console.warn("Voice adaptation skipped due to translation error; reading original text.");
        }
      }

      const ttsResponse = await getAiClient().models.generateContent({
        model: "gemini-3.8-flash-lite-tts",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: preparedSpokenText,
                speechMetadata: {
                  style: `Warm, expressive literary storyteller narrating naturally in ${targetLangInstruction}${
                    tone ? ` with ${tone.toLowerCase()} pacing` : ""
                  }`,
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: safeVoice },
            },
          },
        },
      });

      const audioPart = ttsResponse.candidates?.[0]?.content?.parts?.find(
        (part) => Boolean(part?.inlineData?.data)
      );
      const base64Audio = audioPart?.inlineData?.data;
      const mimeType = audioPart?.inlineData?.mimeType || "audio/wav";

      if (!base64Audio) {
        return res.status(502).json({
          error: "Voice synthesizer returned empty audio. Switching to device voice.",
          spokenText: preparedSpokenText,
          translated: wasTranslated,
        });
      }

      return res.json({
        audioBase64: base64Audio,
        mimeType,
        spokenText: preparedSpokenText,
        translated: wasTranslated,
        voiceName: safeVoice,
      });
    } catch (error) {
      if (isQuotaOrRateError(error)) {
        const message = error instanceof Error ? error.message : "";
        const retryHint = extractRetryHint(message);
        console.warn("Voice TTS endpoint hit Gemini quota/rate limit.");
        return res.status(429).json({
          error: retryHint
            ? `Gemini TTS quota reached (retry in ${retryHint}). Switched to device voice.`
            : "Gemini TTS quota reached. Switched to device voice.",
          spokenText: preparedSpokenText || undefined,
          translated: wasTranslated,
        });
      }
      return handleGeminiError(res, error, "Could not synthesize story voice");
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("/{*path}", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`StoryWeave server listening on http://localhost:${PORT}`);
  });
}

startServer();
