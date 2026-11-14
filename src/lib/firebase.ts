import { initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  User,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  getFirestore,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  AppLanguage,
  CharacterProfile,
  EndingType,
  PlotOutline,
  StoryRecord,
  ThemeMode,
  WorkspacePreferences,
} from '../types/story';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export interface UserProfileRecord {
  uid: string;
  email: string;
  displayName: string;
  penName?: string;
  photoURL?: string;
  createdAt?: string;
  updatedAt?: string;
}

const VALID_LANGUAGES: AppLanguage[] = ['en', 'hi', 'bn', 'ta', 'mr', 'te'];
const VALID_ENDING_TYPES: EndingType[] = [
  'Happy Ending',
  'Sad Ending',
  'Unexpected Twist',
  'Open Ending',
];

function sanitizeDocId(raw: string, prefix: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 128);
  return cleaned.length > 0 ? cleaned : `${prefix}-${Date.now()}`;
}

function clampString(val: unknown, max: number, fallback = ''): string {
  const str = typeof val === 'string' ? val : fallback;
  return str.slice(0, max);
}

function clampStringArray(val: unknown, maxItems: number, maxLen: number): string[] {
  if (!Array.isArray(val)) return [];
  return val
    .map((item) => clampString(String(item ?? ''), maxLen).trim())
    .filter(Boolean)
    .slice(0, maxItems);
}

function formatTimestampLabel(value: unknown): string {
  if (value instanceof Timestamp) {
    return value.toDate().toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
  if (typeof value === 'string' && value.trim()) {
    return value;
  }
  return new Date().toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function timestampMillis(value: unknown): number {
  if (value instanceof Timestamp) {
    return value.toMillis();
  }
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

export async function signInWithGoogleAccount(
  penName?: string,
  initialPreferences?: WorkspacePreferences
): Promise<{ user: User; profile: UserProfileRecord }> {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  const profile = await ensureUserProfile(user, penName, initialPreferences);
  return { user, profile };
}

export async function signOutAccount(): Promise<void> {
  await signOut(auth);
}

export function subscribeAuthState(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

export async function ensureUserProfile(
  user: User,
  penName?: string,
  initialPreferences?: WorkspacePreferences
): Promise<UserProfileRecord> {
  const profilePath = `users/${user.uid}`;
  const profileRef = doc(db, 'users', user.uid);
  const cleanDisplayName = clampString(
    user.displayName || user.email?.split('@')[0] || 'StoryWeave Writer',
    120,
    'StoryWeave Writer'
  );
  const cleanEmail = clampString(user.email || 'writer@storyweave.app', 254);
  const cleanPhotoUrl = user.photoURL ? clampString(user.photoURL, 1000) : undefined;
  const cleanPenName = penName?.trim() ? clampString(penName.trim(), 120) : undefined;

  let existingSnap;
  try {
    existingSnap = await getDoc(profileRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, profilePath);
  }

  if (!existingSnap.exists()) {
    const payload: Record<string, unknown> = {
      uid: user.uid,
      email: cleanEmail,
      displayName: cleanDisplayName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (cleanPenName) payload.penName = cleanPenName;
    if (cleanPhotoUrl) payload.photoURL = cleanPhotoUrl;

    try {
      await setDoc(profileRef, payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, profilePath);
    }

    if (initialPreferences) {
      await saveUserPreferences(user.uid, initialPreferences);
    }

    return {
      uid: user.uid,
      email: cleanEmail,
      displayName: cleanDisplayName,
      penName: cleanPenName,
      photoURL: cleanPhotoUrl,
    };
  }

  const data = existingSnap.data();
  const updates: Record<string, unknown> = {
    displayName: cleanDisplayName,
    updatedAt: serverTimestamp(),
  };
  if (cleanPenName) updates.penName = cleanPenName;
  if (cleanPhotoUrl) updates.photoURL = cleanPhotoUrl;

  try {
    await updateDoc(profileRef, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, profilePath);
  }

  return {
    uid: user.uid,
    email: clampString(data.email, 254, cleanEmail),
    displayName: cleanDisplayName,
    penName: cleanPenName ?? (typeof data.penName === 'string' ? data.penName : undefined),
    photoURL: cleanPhotoUrl ?? (typeof data.photoURL === 'string' ? data.photoURL : undefined),
  };
}

export async function fetchUserProfile(uid: string): Promise<UserProfileRecord | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      uid,
      email: clampString(data.email, 254),
      displayName: clampString(data.displayName, 120, 'Writer'),
      penName: typeof data.penName === 'string' ? data.penName : undefined,
      photoURL: typeof data.photoURL === 'string' ? data.photoURL : undefined,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function updateUserPenName(uid: string, penName: string): Promise<void> {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      penName: clampString(penName.trim(), 120),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function subscribeUserWorkspace(
  uid: string,
  handlers: {
    onStories: (stories: StoryRecord[]) => void;
    onCharacters: (characters: CharacterProfile[]) => void;
    onPlots: (plots: PlotOutline[]) => void;
    onPreferences: (prefs: WorkspacePreferences) => void;
    onError?: (err: Error) => void;
  }
): () => void {
  const storiesPath = `users/${uid}/stories`;
  const charactersPath = `users/${uid}/characters`;
  const plotsPath = `users/${uid}/plots`;
  const prefPath = `users/${uid}/preferences/workspace`;

  const unsubStories = onSnapshot(
    query(collection(db, 'users', uid, 'stories'), where('userId', '==', uid)),
    (snapshot) => {
      const items = snapshot.docs
        .map((docSnap) => {
          const d = docSnap.data();
          const record: StoryRecord = {
            id: clampString(d.id || docSnap.id, 128),
            idea: typeof d.idea === 'string' ? d.idea : undefined,
            title: clampString(d.title, 240, 'Untitled Story'),
            description: clampString(d.description, 2000),
            genre: clampString(d.genre, 100, 'Literary Fiction'),
            tone: clampString(d.tone, 100, 'Atmospheric'),
            writingStyle: clampString(d.writingStyle, 100, 'Lyrical Prose'),
            lengthLabel: clampString(d.lengthLabel, 60, 'Medium Story'),
            language: VALID_LANGUAGES.includes(d.language) ? d.language : 'en',
            wordCount: typeof d.wordCount === 'number' ? d.wordCount : 0,
            narrative: clampString(d.narrative, 100000),
            conflict: clampString(d.conflict, 4000),
            climax: clampString(d.climax, 4000),
            resolution: clampString(d.resolution, 4000),
            characters: Array.isArray(d.characters) ? d.characters.map(String) : [],
            characterDetails: Array.isArray(d.characterDetails) ? d.characterDetails : undefined,
            alternativeEndings: Array.isArray(d.alternativeEndings) ? d.alternativeEndings : undefined,
            preferredEndingType: VALID_ENDING_TYPES.includes(d.preferredEndingType)
              ? d.preferredEndingType
              : undefined,
            coverImage: typeof d.coverImage === 'string' ? d.coverImage : undefined,
            updatedAt: formatTimestampLabel(d.updatedAt),
          };
          return { record, sortMs: timestampMillis(d.updatedAt) };
        })
        .sort((a, b) => b.sortMs - a.sortMs)
        .map((entry) => entry.record);
      handlers.onStories(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, storiesPath);
      } catch (wrapped) {
        handlers.onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );

  const unsubCharacters = onSnapshot(
    query(collection(db, 'users', uid, 'characters'), where('userId', '==', uid)),
    (snapshot) => {
      const items = snapshot.docs
        .map((docSnap) => {
          const d = docSnap.data();
          const record: CharacterProfile = {
            id: clampString(d.id || docSnap.id, 128),
            name: clampString(d.name, 160, 'Unnamed Character'),
            role: clampString(d.role, 160),
            personality: clampString(d.personality, 3000),
            background: clampString(d.background, 5000),
            strengths: Array.isArray(d.strengths) ? d.strengths.map(String) : [],
            weaknesses: Array.isArray(d.weaknesses) ? d.weaknesses.map(String) : [],
            linkedStoryId: typeof d.linkedStoryId === 'string' ? d.linkedStoryId : undefined,
            createdAt: formatTimestampLabel(d.createdAt),
          };
          return { record, sortMs: timestampMillis(d.updatedAt) };
        })
        .sort((a, b) => b.sortMs - a.sortMs)
        .map((entry) => entry.record);
      handlers.onCharacters(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, charactersPath);
      } catch (wrapped) {
        handlers.onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );

  const unsubPlots = onSnapshot(
    query(collection(db, 'users', uid, 'plots'), where('userId', '==', uid)),
    (snapshot) => {
      const items = snapshot.docs
        .map((docSnap) => {
          const d = docSnap.data();
          const record: PlotOutline = {
            id: clampString(d.id || docSnap.id, 128),
            title: clampString(d.title, 240, 'Untitled Plot'),
            premise: clampString(d.premise, 4000),
            linkedStoryId: typeof d.linkedStoryId === 'string' ? d.linkedStoryId : undefined,
            characterNames: Array.isArray(d.characterNames) ? d.characterNames.map(String) : [],
            beats: Array.isArray(d.beats) ? d.beats : [],
            chapters: Array.isArray(d.chapters) ? d.chapters : [],
            updatedAt: formatTimestampLabel(d.updatedAt),
          };
          return { record, sortMs: timestampMillis(d.updatedAt) };
        })
        .sort((a, b) => b.sortMs - a.sortMs)
        .map((entry) => entry.record);
      handlers.onPlots(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, plotsPath);
      } catch (wrapped) {
        handlers.onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );

  const unsubPrefs = onSnapshot(
    doc(db, 'users', uid, 'preferences', 'workspace'),
    (docSnap) => {
      if (!docSnap.exists()) return;
      const d = docSnap.data();
      const prefs: WorkspacePreferences = {
        defaultLength:
          d.defaultLength === 'Short' || d.defaultLength === 'Long' ? d.defaultLength : 'Medium',
        defaultTone: clampString(d.defaultTone, 100, 'Atmospheric'),
        editorFontSize:
          d.editorFontSize === 'Compact' || d.editorFontSize === 'Relaxed'
            ? d.editorFontSize
            : 'Standard',
        showWordCounts: typeof d.showWordCounts === 'boolean' ? d.showWordCounts : true,
        language: VALID_LANGUAGES.includes(d.language) ? d.language : 'en',
        theme: (d.theme === 'light' ? 'light' : 'dark') as ThemeMode,
      };
      handlers.onPreferences(prefs);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, prefPath);
      } catch (wrapped) {
        handlers.onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );

  return () => {
    unsubStories();
    unsubCharacters();
    unsubPlots();
    unsubPrefs();
  };
}

export async function saveUserStory(uid: string, story: StoryRecord): Promise<StoryRecord> {
  const cleanId = sanitizeDocId(story.id, 'story');
  const path = `users/${uid}/stories/${cleanId}`;
  const ref = doc(db, 'users', uid, 'stories', cleanId);

  let existingSnap;
  try {
    existingSnap = await getDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }

  const basePayload: Record<string, unknown> = {
    id: cleanId,
    userId: uid,
    title: clampString(story.title.trim() || 'Untitled Story', 240, 'Untitled Story'),
    description: clampString(story.description ?? '', 2000),
    genre: clampString(story.genre || 'Literary Fiction', 100, 'Literary Fiction'),
    tone: clampString(story.tone || 'Atmospheric', 100, 'Atmospheric'),
    writingStyle: clampString(story.writingStyle || 'Lyrical Prose', 100, 'Lyrical Prose'),
    lengthLabel: clampString(story.lengthLabel || 'Medium Story', 60, 'Medium Story'),
    language: story.language && VALID_LANGUAGES.includes(story.language) ? story.language : 'en',
    wordCount: Math.max(0, Math.min(500000, Number(story.wordCount) || 0)),
    narrative: clampString(story.narrative ?? '', 100000),
    conflict: clampString(story.conflict ?? '', 4000),
    climax: clampString(story.climax ?? '', 4000),
    resolution: clampString(story.resolution ?? '', 4000),
    characters: clampStringArray(story.characters, 20, 120),
    updatedAt: serverTimestamp(),
  };

  if (typeof story.idea === 'string' && story.idea.trim()) {
    basePayload.idea = clampString(story.idea.trim(), 2000);
  }
  if (Array.isArray(story.characterDetails) && story.characterDetails.length > 0) {
    basePayload.characterDetails = story.characterDetails.slice(0, 20);
  }
  if (Array.isArray(story.alternativeEndings) && story.alternativeEndings.length > 0) {
    basePayload.alternativeEndings = story.alternativeEndings.slice(0, 6);
  }
  if (story.preferredEndingType && VALID_ENDING_TYPES.includes(story.preferredEndingType)) {
    basePayload.preferredEndingType = story.preferredEndingType;
  }
  if (typeof story.coverImage === 'string' && story.coverImage.trim()) {
    basePayload.coverImage = clampString(story.coverImage.trim(), 1000);
  }

  if (!existingSnap.exists()) {
    try {
      await setDoc(ref, {
        ...basePayload,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  } else {
    const existingData = existingSnap.data();
    const updatePayload: Record<string, unknown> = {
      ...basePayload,
      createdAt: existingData.createdAt,
    };
    try {
      await updateDoc(ref, updatePayload);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  return { ...story, id: cleanId };
}

export async function deleteUserStory(uid: string, storyId: string): Promise<void> {
  const cleanId = sanitizeDocId(storyId, 'story');
  const path = `users/${uid}/stories/${cleanId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'stories', cleanId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveUserCharacter(
  uid: string,
  character: CharacterProfile
): Promise<CharacterProfile> {
  const cleanId = sanitizeDocId(character.id, 'char');
  const path = `users/${uid}/characters/${cleanId}`;
  const ref = doc(db, 'users', uid, 'characters', cleanId);

  let existingSnap;
  try {
    existingSnap = await getDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }

  const basePayload: Record<string, unknown> = {
    id: cleanId,
    userId: uid,
    name: clampString(character.name.trim() || 'Unnamed Character', 160, 'Unnamed Character'),
    role: clampString(character.role ?? '', 160),
    personality: clampString(character.personality ?? '', 3000),
    background: clampString(character.background ?? '', 5000),
    strengths: clampStringArray(character.strengths, 15, 240),
    weaknesses: clampStringArray(character.weaknesses, 15, 240),
    updatedAt: serverTimestamp(),
  };

  if (typeof character.linkedStoryId === 'string' && character.linkedStoryId.trim()) {
    basePayload.linkedStoryId = clampString(character.linkedStoryId.trim(), 128);
  }

  if (!existingSnap.exists()) {
    try {
      await setDoc(ref, {
        ...basePayload,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  } else {
    const existingData = existingSnap.data();
    try {
      await updateDoc(ref, {
        ...basePayload,
        createdAt: existingData.createdAt,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  return { ...character, id: cleanId };
}

export async function deleteUserCharacter(uid: string, characterId: string): Promise<void> {
  const cleanId = sanitizeDocId(characterId, 'char');
  const path = `users/${uid}/characters/${cleanId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'characters', cleanId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveUserPlot(uid: string, plot: PlotOutline): Promise<PlotOutline> {
  const cleanId = sanitizeDocId(plot.id, 'plot');
  const path = `users/${uid}/plots/${cleanId}`;
  const ref = doc(db, 'users', uid, 'plots', cleanId);

  let existingSnap;
  try {
    existingSnap = await getDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }

  const basePayload: Record<string, unknown> = {
    id: cleanId,
    userId: uid,
    title: clampString(plot.title.trim() || 'Untitled Plot', 240, 'Untitled Plot'),
    premise: clampString(plot.premise ?? '', 4000),
    characterNames: clampStringArray(plot.characterNames, 20, 120),
    beats: Array.isArray(plot.beats) ? plot.beats.slice(0, 10) : [],
    chapters: Array.isArray(plot.chapters) ? plot.chapters.slice(0, 25) : [],
    updatedAt: serverTimestamp(),
  };

  if (typeof plot.linkedStoryId === 'string' && plot.linkedStoryId.trim()) {
    basePayload.linkedStoryId = clampString(plot.linkedStoryId.trim(), 128);
  }

  if (!existingSnap.exists()) {
    try {
      await setDoc(ref, {
        ...basePayload,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  } else {
    const existingData = existingSnap.data();
    try {
      await updateDoc(ref, {
        ...basePayload,
        createdAt: existingData.createdAt,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  return { ...plot, id: cleanId };
}

export async function deleteUserPlot(uid: string, plotId: string): Promise<void> {
  const cleanId = sanitizeDocId(plotId, 'plot');
  const path = `users/${uid}/plots/${cleanId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'plots', cleanId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveUserPreferences(
  uid: string,
  prefs: WorkspacePreferences
): Promise<void> {
  const path = `users/${uid}/preferences/workspace`;
  const ref = doc(db, 'users', uid, 'preferences', 'workspace');

  let existingSnap;
  try {
    existingSnap = await getDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }

  const payload = {
    userId: uid,
    defaultLength:
      prefs.defaultLength === 'Short' || prefs.defaultLength === 'Long'
        ? prefs.defaultLength
        : 'Medium',
    defaultTone: clampString(prefs.defaultTone || 'Atmospheric', 100, 'Atmospheric'),
    editorFontSize:
      prefs.editorFontSize === 'Compact' || prefs.editorFontSize === 'Relaxed'
        ? prefs.editorFontSize
        : 'Standard',
    showWordCounts: Boolean(prefs.showWordCounts),
    language: VALID_LANGUAGES.includes(prefs.language) ? prefs.language : 'en',
    theme: prefs.theme === 'light' ? 'light' : 'dark',
    updatedAt: serverTimestamp(),
  };

  if (!existingSnap.exists()) {
    try {
      await setDoc(ref, {
        ...payload,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  } else {
    const existingData = existingSnap.data();
    try {
      await updateDoc(ref, {
        ...payload,
        createdAt: existingData.createdAt,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }
}

export async function migrateGuestWorkspaceToUser(
  uid: string,
  guestStories: StoryRecord[],
  guestCharacters: CharacterProfile[],
  guestPlots: PlotOutline[]
): Promise<void> {
  const existingStoriesPath = `users/${uid}/stories`;
  try {
    const snap = await getDocs(
      query(collection(db, 'users', uid, 'stories'), where('userId', '==', uid))
    );
    if (!snap.empty) return;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, existingStoriesPath);
  }

  for (const s of guestStories.slice(0, 10)) {
    await saveUserStory(uid, s);
  }
  for (const c of guestCharacters.slice(0, 15)) {
    await saveUserCharacter(uid, c);
  }
  for (const p of guestPlots.slice(0, 10)) {
    await saveUserPlot(uid, p);
  }
}
