import { AppLanguage } from '../types/story';

export const LANGUAGE_OPTIONS: {
  code: AppLanguage;
  nativeName: string;
  englishName: string;
}[] = [
  { code: 'en', nativeName: 'English', englishName: 'English' },
  { code: 'hi', nativeName: 'हिन्दी', englishName: 'Hindi' },
  { code: 'bn', nativeName: 'বাংলা', englishName: 'Bengali' },
  { code: 'ta', nativeName: 'தமிழ்', englishName: 'Tamil' },
  { code: 'mr', nativeName: 'मराठी', englishName: 'Marathi' },
  { code: 'te', nativeName: 'తెలుగు', englishName: 'Telugu' },
];

export interface TranslationStrings {
  nav: {
    features: string;
    howItWorks: string;
    exampleStories: string;
    dashboard: string;
    myStories: string;
    storyGenerator: string;
    characterStudio: string;
    plotBuilder: string;
    aiCoWriter: string;
    alternativeEndings: string;
    settings: string;
    backToLanding: string;
  };
  landing: {
    studioLabel: string;
    heroHeadline: string;
    heroDesc: string;
    startCreating: string;
    exploreFeatures: string;
    featuredCaptionLabel: string;
    featuredCaption: string;
    featuresKicker: string;
    featuresHeading: string;
    featuresSub: string;
    openInStudio: string;
    workflowKicker: string;
    workflowHeading: string;
    workflowSub: string;
    enterStudio: string;
    showcaseKicker: string;
    showcaseHeading: string;
    showcaseSub: string;
    readSample: string;
    ctaHeading: string;
    ctaSub: string;
    openStudioBtn: string;
  };
  dashboard: {
    studioTitle: string;
    newStory: string;
    welcomeKicker: string;
    welcomeTitle: string;
    welcomeDesc: string;
    createNewStory: string;
    savedStoriesStat: string;
    charactersStat: string;
    plotsStat: string;
    wordsStat: string;
    quickAccess: string;
    quickAccessHint: string;
    openModule: string;
    recentStories: string;
    viewLibrary: string;
    emptyTitle: string;
    emptyDesc: string;
    inspectShowcase: string;
  };
  storyGen: {
    kicker: string;
    title: string;
    openLibrary: string;
    storyIdea: string;
    ideaPlaceholder: string;
    quickStarters: string;
    genre: string;
    tone: string;
    writingStyle: string;
    storyLength: string;
    generateBtn: string;
    generatingBtn: string;
    emptyHeading: string;
    emptyBody: string;
    edit: string;
    doneEditing: string;
    copy: string;
    copied: string;
    regenerate: string;
    save: string;
    saved: string;
    narrative: string;
    characters: string;
    conflict: string;
    climax: string;
    resolution: string;
  };
  myStories: {
    kicker: string;
    title: string;
    generateNew: string;
    searchPlaceholder: string;
    emptyTitle: string;
    emptyDesc: string;
    createFirst: string;
    open: string;
    coWrite: string;
  };
  characters: {
    kicker: string;
    title: string;
    generateWithAi: string;
    generateBtn: string;
    generatingBtn: string;
    detailsHeading: string;
    editHeading: string;
    nameLabel: string;
    roleLabel: string;
    personalityLabel: string;
    backgroundLabel: string;
    strengthsLabel: string;
    weaknessesLabel: string;
    saveBtn: string;
    updateBtn: string;
    savedBtn: string;
    searchPlaceholder: string;
    emptyTitle: string;
    emptyDesc: string;
  };
  plotBuilder: {
    kicker: string;
    title: string;
    newOutline: string;
    saveOutline: string;
    savedOutline: string;
    generateBtn: string;
    generatingBtn: string;
    arcHeading: string;
    chaptersHeading: string;
    addChapter: string;
    addScene: string;
  };
  coWriter: {
    kicker: string;
    title: string;
    focusMode: string;
    exitFocusMode: string;
    saveToLibrary: string;
    continueWriting: string;
    rewrite: string;
    improveGrammar: string;
    addDialogue: string;
    changeStyle: string;
    makeEmotional: string;
  };
  endings: {
    kicker: string;
    title: string;
    generateBtn: string;
    generatingBtn: string;
    savePreferred: string;
    preferredLabel: string;
    emptyTitle: string;
    emptyDesc: string;
  };
  settings: {
    kicker: string;
    title: string;
    backToDashboard: string;
    appearanceHeading: string;
    themeLabel: string;
    darkMode: string;
    lightMode: string;
    languageLabel: string;
    defaultsHeading: string;
    defaultLength: string;
    defaultTone: string;
    editorScale: string;
    showWordCounts: string;
  };
  auth: {
    kicker: string;
    signInTab: string;
    registerTab: string;
    signInTitle: string;
    signInSubtitle: string;
    registerTitle: string;
    registerSubtitle: string;
    penNameLabel: string;
    penNamePlaceholder: string;
    signInGoogleBtn: string;
    registerGoogleBtn: string;
    connectingBtn: string;
    guestBtn: string;
    switchToRegister: string;
    switchToSignIn: string;
    signInNavBtn: string;
    signOutBtn: string;
    signedInAs: string;
    benefitSync: string;
    benefitMultilingual: string;
    benefitPrivate: string;
  };
  voice: {
    title: string;
    subtitle: string;
    listenBtn: string;
    pauseBtn: string;
    resumeBtn: string;
    stopBtn: string;
    synthesizing: string;
    readLanguage: string;
    narratorVoice: string;
    speed: string;
    partOf: string;
    translatedNotice: string;
    browserFallbackNote: string;
    aiVoiceLabel: string;
    browserVoiceLabel: string;
  };
}

const EN: TranslationStrings = {
  nav: {
    features: 'Features',
    howItWorks: 'How It Works',
    exampleStories: 'Example Stories',
    dashboard: 'Dashboard',
    myStories: 'My Stories',
    storyGenerator: 'Story Generator',
    characterStudio: 'Character Studio',
    plotBuilder: 'Plot Builder',
    aiCoWriter: 'AI Co-Writer',
    alternativeEndings: 'Alternative Endings',
    settings: 'Settings',
    backToLanding: 'Back to Landing Page',
  },
  landing: {
    studioLabel: 'StoryWeave India · Creative Writing Studio',
    heroHeadline: 'Your Imagination. Our Intelligence. Infinite Stories.',
    heroDesc:
      'A creative storytelling studio built for writers across India and beyond. Craft stories in English, Hindi, Bengali, Tamil, Marathi, or Telugu—with character sheets, six-act plots, AI co-writing, and branching endings.',
    startCreating: 'Start Creating',
    exploreFeatures: 'Explore Features',
    featuredCaptionLabel: 'Multilingual Manuscript Workspace',
    featuredCaption:
      'From monsoon hills in Shillong to midnight ghats in Varanasi—weave characters, plot beats, and prose in your own language.',
    featuresKicker: 'Studio Capabilities',
    featuresHeading: 'Every tool a storyteller needs, structured in one place',
    featuresSub:
      'Move seamlessly from sparking a premise to casting characters, outlining acts, and writing in your preferred Indian or global language.',
    openInStudio: 'Open in Studio',
    workflowKicker: 'Creative Workflow',
    workflowHeading: 'How StoryWeave turns an idea into a finished narrative',
    workflowSub:
      'Designed for beginner writers and seasoned storytellers alike, every module feeds real story and character context into the next stage.',
    enterStudio: 'Enter the Studio',
    showcaseKicker: 'Stories Across India',
    showcaseHeading: 'Curated manuscripts crafted with StoryWeave',
    showcaseSub:
      'Select any Indian story below to read its opening excerpt, cast, conflict, and climax.',
    readSample: 'Read Sample Story',
    ctaHeading: 'Ready to weave your next story?',
    ctaSub:
      'Open the StoryWeave Studio to write in English, हिन्दी, বাংলা, தமிழ், मराठी, or తెలుగు with light and midnight themes.',
    openStudioBtn: 'Open StoryWeave Studio',
  },
  dashboard: {
    studioTitle: 'StoryWeave Studio',
    newStory: 'New Story',
    welcomeKicker: 'Creative Workspace',
    welcomeTitle: 'Welcome to StoryWeave Studio',
    welcomeDesc:
      'Your central hub for generating multilingual narratives, building characters, outlining plots, and testing alternate endings.',
    createNewStory: 'Create New Story',
    savedStoriesStat: 'Saved Stories',
    charactersStat: 'Characters Crafted',
    plotsStat: 'Plot Outlines',
    wordsStat: 'Total Words Written',
    quickAccess: 'Quick Access',
    quickAccessHint: 'Jump directly into a studio tool',
    openModule: 'Open Module',
    recentStories: 'Recent Stories',
    viewLibrary: 'View Library',
    emptyTitle: 'No saved stories in your library yet',
    emptyDesc:
      'Your generated manuscripts and saved drafts will appear here. Start a new story or inspect one of our India-inspired showcase tales.',
    inspectShowcase: 'Inspect Showcase Story',
  },
  storyGen: {
    kicker: 'Gemini Storytelling Engine',
    title: 'AI Story Generator',
    openLibrary: 'Open My Stories',
    storyIdea: 'Story Idea',
    ideaPlaceholder: 'Describe your premise, Indian setting, or central mystery...',
    quickStarters: 'Indian starter ideas:',
    genre: 'Genre',
    tone: 'Tone',
    writingStyle: 'Writing Style',
    storyLength: 'Story Length',
    generateBtn: 'Generate Story',
    generatingBtn: 'Generating Story...',
    emptyHeading: 'Your generated manuscript will appear here',
    emptyBody:
      'Enter a story premise on the left, tune genre, tone, style, and length, then click Generate Story.',
    edit: 'Edit',
    doneEditing: 'Done Editing',
    copy: 'Copy',
    copied: 'Copied',
    regenerate: 'Regenerate',
    save: 'Save',
    saved: 'Saved',
    narrative: 'Complete Narrative',
    characters: 'Featured Characters',
    conflict: 'Conflict',
    climax: 'Climax',
    resolution: 'Resolution',
  },
  myStories: {
    kicker: 'Manuscript Archive',
    title: 'My Stories',
    generateNew: 'Generate New Story',
    searchPlaceholder: 'Search by title, synopsis, or character...',
    emptyTitle: 'Your story library is empty',
    emptyDesc: 'Generate a story and click Save to keep it in your archive.',
    createFirst: 'Create First Story',
    open: 'Open',
    coWrite: 'Co-Write',
  },
  characters: {
    kicker: 'Character Architecture',
    title: 'Character Studio',
    generateWithAi: 'Generate Character with AI',
    generateBtn: 'Generate Character',
    generatingBtn: 'Crafting Character...',
    detailsHeading: 'Character Details',
    editHeading: 'Edit Character Profile',
    nameLabel: 'Name *',
    roleLabel: 'Role',
    personalityLabel: 'Personality',
    backgroundLabel: 'Background',
    strengthsLabel: 'Strengths',
    weaknessesLabel: 'Weaknesses',
    saveBtn: 'Save Character Profile',
    updateBtn: 'Update Character Profile',
    savedBtn: 'Character Saved',
    searchPlaceholder: 'Search characters by name, role, or personality...',
    emptyTitle: 'No character profiles saved yet',
    emptyDesc: 'Generate a character with AI or fill out the profile form on the left.',
  },
  plotBuilder: {
    kicker: 'Narrative Structure',
    title: 'Plot Builder',
    newOutline: 'New Outline',
    saveOutline: 'Save Outline',
    savedOutline: 'Saved Outline',
    generateBtn: 'Generate Structured Plot with AI',
    generatingBtn: 'Structuring Plot & Chapters...',
    arcHeading: 'Six-Stage Dramatic Arc',
    chaptersHeading: 'Chapters & Scenes',
    addChapter: 'Add Chapter',
    addScene: 'Add Scene',
  },
  coWriter: {
    kicker: 'Distraction-Free Manuscript Studio',
    title: 'AI Co-Writer',
    focusMode: 'Focus Mode',
    exitFocusMode: 'Exit Focus Mode',
    saveToLibrary: 'Save to My Stories',
    continueWriting: 'Continue Writing',
    rewrite: 'Rewrite',
    improveGrammar: 'Improve Grammar',
    addDialogue: 'Add Dialogue',
    changeStyle: 'Change Writing Style',
    makeEmotional: 'Make It More Emotional',
  },
  endings: {
    kicker: 'Narrative Branching',
    title: 'Alternative Endings',
    generateBtn: 'Generate 4 Alternative Endings',
    generatingBtn: 'Branching Four Endings...',
    savePreferred: 'Save Preferred Ending',
    preferredLabel: 'Saved Preferred Ending',
    emptyTitle: 'Explore four ways your story can end',
    emptyDesc:
      'Choose a saved story or enter a brief summary above to generate Happy, Sad, Twist, and Open endings.',
  },
  settings: {
    kicker: 'Workspace Configuration',
    title: 'Studio Settings',
    backToDashboard: 'Back to Dashboard',
    appearanceHeading: 'Language & Appearance',
    themeLabel: 'Color Theme',
    darkMode: 'Midnight Dark',
    lightMode: 'Daylight Editorial',
    languageLabel: 'App & AI Output Language',
    defaultsHeading: 'Writing & Generation Defaults',
    defaultLength: 'Default Story Length',
    defaultTone: 'Default Narrative Tone',
    editorScale: 'Co-Writer Typography Scale',
    showWordCounts: 'Show Word Counts',
  },
  auth: {
    kicker: 'StoryWeave Writer Sanctuary',
    signInTab: 'Sign In',
    registerTab: 'Register',
    signInTitle: 'Welcome back to your studio',
    signInSubtitle:
      'Sign in to open your cloud-synced manuscripts, character sheets, plot outlines, and alternative endings.',
    registerTitle: 'Create your writer account',
    registerSubtitle:
      'Claim your personal StoryWeave studio with a custom pen name and sync your stories securely across sessions.',
    penNameLabel: 'Pen Name / Writer Alias (Optional)',
    penNamePlaceholder: 'e.g., Aarav Sen, Meera Devi, Kavya Nair',
    signInGoogleBtn: 'Sign In with Google',
    registerGoogleBtn: 'Create Account with Google',
    connectingBtn: 'Connecting to StoryWeave...',
    guestBtn: 'Continue to Landing Page without signing in',
    switchToRegister: 'New to StoryWeave? Create an account',
    switchToSignIn: 'Already have a writer account? Sign in',
    signInNavBtn: 'Sign In / Register',
    signOutBtn: 'Sign Out',
    signedInAs: 'Signed in as',
    benefitSync: 'Your stories, characters, and six-act plots stay saved in your private cloud studio.',
    benefitMultilingual: 'Write in English, हिन्दी, বাংলা, தமிழ், मराठी, or తెలుగు.',
    benefitPrivate: 'Protected account workspace — only you can read or edit your drafts.',
  },
  voice: {
    title: 'Story Voice Assistant',
    subtitle: 'Listen to your story narrated in your chosen language',
    listenBtn: 'Listen',
    pauseBtn: 'Pause',
    resumeBtn: 'Resume',
    stopBtn: 'Stop',
    synthesizing: 'Preparing voice...',
    readLanguage: 'Voice Language',
    narratorVoice: 'Narrator',
    speed: 'Speed',
    partOf: 'Part',
    translatedNotice: 'Adapted for narration in',
    browserFallbackNote: 'Using device voice narration (instant / fallback mode).',
    aiVoiceLabel: 'Studio AI Voice',
    browserVoiceLabel: 'Device Voice',
  },
};

const HI: TranslationStrings = {
  ...EN,
  nav: {
    features: 'विशेषताएँ',
    howItWorks: 'यह कैसे काम करता है',
    exampleStories: 'उदाहरण कहानियाँ',
    dashboard: 'डैशबोर्ड',
    myStories: 'मेरी कहानियाँ',
    storyGenerator: 'कहानी जनरेटर',
    characterStudio: 'पात्र स्टूडियो',
    plotBuilder: 'कथानक निर्माता',
    aiCoWriter: 'AI सह-लेखक',
    alternativeEndings: 'वैकल्पिक अंत',
    settings: 'सेटिंग्स',
    backToLanding: 'मुख्य पृष्ठ पर लौटें',
  },
  landing: {
    ...EN.landing,
    studioLabel: 'StoryWeave भारत · रचनात्मक लेखन स्टूडियो',
    heroHeadline: 'आपकी कल्पना। हमारी बुद्धिमत्ता। अनंत कहानियाँ।',
    heroDesc:
      'भारत और दुनिया भर के लेखकों के लिए बनाया गया आधुनिक कहानी स्टूडियो। हिन्दी, अंग्रेज़ी, बांग्ला, तमिल, मराठी या तेलुगु में कहानियाँ, पात्र, कथानक और वैकल्पिक अंत रचें।',
    startCreating: 'लेखन शुरू करें',
    exploreFeatures: 'विशेषताएँ देखें',
    openInStudio: 'स्टूडियो में खोलें',
    enterStudio: 'स्टूडियो में प्रवेश करें',
    showcaseKicker: 'भारत की कहानियाँ',
    showcaseHeading: 'StoryWeave से रची गई चुनिंदा कहानियाँ',
    readSample: 'कहानी पढ़ें',
    ctaHeading: 'अपनी अगली कहानी बुनने के लिए तैयार हैं?',
    openStudioBtn: 'StoryWeave स्टूडियो खोलें',
  },
  dashboard: {
    ...EN.dashboard,
    studioTitle: 'StoryWeave स्टूडियो',
    newStory: 'नई कहानी',
    welcomeKicker: 'रचनात्मक कार्यक्षेत्र',
    welcomeTitle: 'StoryWeave स्टूडियो में आपका स्वागत है',
    welcomeDesc:
      'अपनी पसंद की भाषा में कहानियाँ रचने, पात्र गढ़ने, कथानक बनाने और वैकल्पिक अंत आज़माने का आपका मुख्य मंच।',
    createNewStory: 'नई कहानी बनाएँ',
    savedStoriesStat: 'सहेजी गई कहानियाँ',
    charactersStat: 'निर्मित पात्र',
    plotsStat: 'कथानक रूपरेखाएँ',
    wordsStat: 'कुल लिखे गए शब्द',
    quickAccess: 'त्वरित पहुँच',
    quickAccessHint: 'सीधे किसी स्टूडियो टूल पर जाएँ',
    openModule: 'खोलें',
    recentStories: 'हाल की कहानियाँ',
    viewLibrary: 'पुस्तकालय देखें',
    emptyTitle: 'अभी आपकी लाइब्रेरी में कोई कहानी नहीं है',
    inspectShowcase: 'नमूना कहानी देखें',
  },
  storyGen: {
    ...EN.storyGen,
    kicker: 'जेमिनी कहानी इंजन',
    title: 'AI कहानी जनरेटर',
    openLibrary: 'मेरी कहानियाँ खोलें',
    storyIdea: 'कहानी का विचार',
    ideaPlaceholder: 'अपनी कहानी की पृष्ठभूमि, भारतीय परिवेश या मुख्य रहस्य लिखें...',
    quickStarters: 'भारतीय कहानी विचार:',
    genre: 'शैली (Genre)',
    tone: 'भाव (Tone)',
    writingStyle: 'लेखन शैली',
    storyLength: 'कहानी की लंबाई',
    generateBtn: 'कहानी बनाएँ',
    generatingBtn: 'कहानी लिखी जा रही है...',
    edit: 'संपादित करें',
    doneEditing: 'संपादन पूर्ण',
    copy: 'कॉपी करें',
    copied: 'कॉपी हो गया',
    regenerate: 'फिर से बनाएँ',
    save: 'सहेजें',
    saved: 'सहेजा गया',
    narrative: 'पूर्ण कहानी',
    characters: 'प्रमुख पात्र',
    conflict: 'मुख्य संघर्ष',
    climax: 'चरम बिंदु',
    resolution: 'समाधान',
  },
  myStories: {
    ...EN.myStories,
    kicker: 'कहानी संग्रह',
    title: 'मेरी कहानियाँ',
    generateNew: 'नई कहानी बनाएँ',
    searchPlaceholder: 'शीर्षक, सारांश या पात्र से खोजें...',
    emptyTitle: 'आपकी कहानी लाइब्रेरी खाली है',
    createFirst: 'पहली कहानी बनाएँ',
    open: 'खोलें',
    coWrite: 'सह-लेखन',
  },
  characters: {
    ...EN.characters,
    kicker: 'पात्र निर्माण',
    title: 'पात्र स्टूडियो',
    generateWithAi: 'AI से पात्र बनाएँ',
    generateBtn: 'पात्र बनाएँ',
    generatingBtn: 'पात्र गढ़ा जा रहा है...',
    detailsHeading: 'पात्र विवरण',
    editHeading: 'पात्र संपादित करें',
    nameLabel: 'नाम *',
    roleLabel: 'भूमिका',
    personalityLabel: 'व्यक्तित्व',
    backgroundLabel: 'पृष्ठभूमि',
    strengthsLabel: 'शक्तियाँ',
    weaknessesLabel: 'कमज़ोरियाँ',
    saveBtn: 'पात्र सहेजें',
    updateBtn: 'पात्र अपडेट करें',
    savedBtn: 'सहेजा गया',
    searchPlaceholder: 'नाम, भूमिका या स्वभाव से खोजें...',
    emptyTitle: 'अभी कोई पात्र सहेजा नहीं गया है',
  },
  plotBuilder: {
    ...EN.plotBuilder,
    kicker: 'कथा संरचना',
    title: 'कथानक निर्माता',
    newOutline: 'नया कथानक',
    saveOutline: 'कथानक सहेजें',
    savedOutline: 'सहेजा गया',
    generateBtn: 'AI से कथानक बनाएँ',
    generatingBtn: 'कथानक तैयार हो रहा है...',
    arcHeading: 'छह-चरणीय कथा संरचना',
    chaptersHeading: 'अध्याय और दृश्य',
    addChapter: 'अध्याय जोड़ें',
    addScene: 'दृश्य जोड़ें',
  },
  coWriter: {
    ...EN.coWriter,
    kicker: 'एकाग्र लेखन संपादक',
    title: 'AI सह-लेखक',
    focusMode: 'फोकस मोड',
    exitFocusMode: 'सामान्य दृश्य',
    saveToLibrary: 'मेरी कहानियों में सहेजें',
    continueWriting: 'आगे लिखें',
    rewrite: 'पुनर्लेखन करें',
    improveGrammar: 'व्याकरण सुधारें',
    addDialogue: 'संवाद जोड़ें',
    changeStyle: 'लेखन शैली बदलें',
    makeEmotional: 'अधिक भावुक बनाएँ',
  },
  endings: {
    ...EN.endings,
    kicker: 'कहानी के विभिन्न मोड़',
    title: 'वैकल्पिक अंत',
    generateBtn: '4 वैकल्पिक अंत बनाएँ',
    generatingBtn: 'अंत तैयार हो रहे हैं...',
    savePreferred: 'पसंदीदा अंत सहेजें',
    preferredLabel: 'सहेजा गया पसंदीदा अंत',
  },
  settings: {
    ...EN.settings,
    kicker: 'कार्यक्षेत्र सेटिंग्स',
    title: 'स्टूडियो सेटिंग्स',
    backToDashboard: 'डैशबोर्ड पर लौटें',
    appearanceHeading: 'भाषा और थीम',
    themeLabel: 'रंग थीम',
    darkMode: 'डार्क मोड',
    lightMode: 'लाइट मोड',
    languageLabel: 'ऐप और AI भाषा',
    defaultsHeading: 'लेखन प्राथमिकताएँ',
    defaultLength: 'डिफ़ॉल्ट कहानी लंबाई',
    defaultTone: 'डिफ़ॉल्ट भाव',
    editorScale: 'संपादक फ़ॉन्ट आकार',
    showWordCounts: 'शब्द गणना दिखाएँ',
  },
  auth: {
    ...EN.auth,
    kicker: 'StoryWeave लेखक कक्ष',
    signInTab: 'साइन इन',
    registerTab: 'पंजीकरण (Register)',
    signInTitle: 'अपने लेखन स्टूडियो में वापस आएँ',
    signInSubtitle:
      'अपनी सहेजी गई कहानियों, पात्रों, कथानकों और वैकल्पिक अंत तक पहुँचने के लिए साइन इन करें।',
    registerTitle: 'अपना लेखक खाता बनाएँ',
    registerSubtitle:
      'अपना पेन नेम चुनें और अपनी सभी रचनाओं को सुरक्षित क्लाउड स्टूडियो में सहेजें।',
    penNameLabel: 'उपनाम / लेखकीय नाम (वैकल्पिक)',
    penNamePlaceholder: 'उदा., आरव सेन, मीरा देवी',
    signInGoogleBtn: 'Google से साइन इन करें',
    registerGoogleBtn: 'Google से नया खाता बनाएँ',
    connectingBtn: 'संपर्क हो रहा है...',
    guestBtn: 'बिना साइन इन के मुख्य पृष्ठ देखें',
    switchToRegister: 'नए उपयोगकर्ता हैं? नया खाता बनाएँ',
    switchToSignIn: 'पहले से खाता है? साइन इन करें',
    signInNavBtn: 'साइन इन / रजिस्टर',
    signOutBtn: 'साइन आउट',
    signedInAs: 'सक्रिय खाता',
  },
  voice: {
    ...EN.voice,
    title: 'कहानी वॉयस असिस्टेंट',
    subtitle: 'अपनी चुनी हुई भाषा में कहानी सुनें',
    listenBtn: 'सुनें',
    pauseBtn: 'रोकें',
    resumeBtn: 'जारी रखें',
    stopBtn: 'बंद करें',
    synthesizing: 'आवाज़ तैयार हो रही है...',
    readLanguage: 'पठन भाषा',
    narratorVoice: 'वाचक स्वर',
    speed: 'गति',
    partOf: 'भाग',
    translatedNotice: 'अनुवादित वाचन भाषा:',
    browserFallbackNote: 'डिवाइस की आवाज़ से वाचन हो रहा है।',
    aiVoiceLabel: 'स्टूडियो AI आवाज़',
    browserVoiceLabel: 'डिवाइस आवाज़',
  },
};

const BN: TranslationStrings = {
  ...EN,
  nav: {
    features: 'বৈশিষ্ট্য',
    howItWorks: 'কাজের ধারা',
    exampleStories: 'উদাহরণ গল্প',
    dashboard: 'ড্যাশবোর্ড',
    myStories: 'আমার গল্প',
    storyGenerator: 'গল্প জেনারেটর',
    characterStudio: 'চরিত্র স্টুডিও',
    plotBuilder: 'প্লট নির্মাতা',
    aiCoWriter: 'AI সহ-লেখক',
    alternativeEndings: 'বিকল্প সমাপ্তি',
    settings: 'সেটিংস',
    backToLanding: 'মূল পাতায় ফিরুন',
  },
  landing: {
    ...EN.landing,
    studioLabel: 'StoryWeave ভারত · সৃজনশীল লেখার স্টুডিও',
    heroHeadline: 'আপনার কল্পনা। আমাদের বুদ্ধিমত্তা। অসংখ্য গল্প।',
    heroDesc:
      'ভারত ও বিশ্বের লেখকদের জন্য তৈরি আধুনিক গল্প-রচনা স্টুডিও। বাংলা, হিন্দি, ইংরেজি, তামিল, মারাঠি বা তেলেগু ভাষায় গল্প, চরিত্র, প্লট ও বিকল্প সমাপ্তি তৈরি করুন।',
    startCreating: 'লেখা শুরু করুন',
    exploreFeatures: 'বৈশিষ্ট্য দেখুন',
    openInStudio: 'স্টুডিওতে খুলুন',
    enterStudio: 'স্টুডিওতে প্রবেশ করুন',
    showcaseKicker: 'ভারতের গল্প',
    showcaseHeading: 'StoryWeave-এ রচিত নির্বাচিত গল্প',
    readSample: 'নমুনা গল্প পড়ুন',
    ctaHeading: 'নতুন গল্প বুনতে প্রস্তুত?',
    openStudioBtn: 'StoryWeave স্টুডিও খুলুন',
  },
  dashboard: {
    ...EN.dashboard,
    studioTitle: 'StoryWeave স্টুডিও',
    newStory: 'নতুন গল্প',
    welcomeKicker: 'সৃজনশীল কর্মক্ষেত্র',
    welcomeTitle: 'StoryWeave স্টুডিওতে স্বাগতম',
    welcomeDesc:
      'আপনার পছন্দের ভাষায় মৌলিক গল্প তৈরি, চরিত্র নির্মাণ, প্লট সাজানো ও বিকল্প সমাপ্তি পরীক্ষার কেন্দ্রীয় মঞ্চ।',
    createNewStory: 'নতুন গল্প তৈরি করুন',
    savedStoriesStat: 'সংরক্ষিত গল্প',
    charactersStat: 'তৈরি চরিত্র',
    plotsStat: 'প্লট রূপরেখা',
    wordsStat: 'মোট লিখিত শব্দ',
    quickAccess: 'দ্রুত প্রবেশ',
    quickAccessHint: 'সরাসরি যেকোনো টুলে যান',
    openModule: 'খুলুন',
    recentStories: 'সাম্প্রতিক গল্প',
    viewLibrary: 'সংগ্রহ দেখুন',
    emptyTitle: 'এখনও কোনো গল্প সংরক্ষিত নেই',
    inspectShowcase: 'নমুনা গল্প দেখুন',
  },
  storyGen: {
    ...EN.storyGen,
    kicker: 'জেমিনি গল্প ইঞ্জিন',
    title: 'AI গল্প জেনারেটর',
    openLibrary: 'আমার গল্প খুলুন',
    storyIdea: 'গল্পের মূল ভাবনা',
    ideaPlaceholder: 'আপনার গল্পের পটভূমি, ভারতীয় পরিবেশ বা মূল রহস্য লিখুন...',
    quickStarters: 'ভারতীয় গল্পের ধারণা:',
    genre: 'ধরন (Genre)',
    tone: 'মেজাজ (Tone)',
    writingStyle: 'লেখার ধরন',
    storyLength: 'গল্পের দৈর্ঘ্য',
    generateBtn: 'গল্প তৈরি করুন',
    generatingBtn: 'গল্প তৈরি হচ্ছে...',
    edit: 'সম্পাদনা',
    doneEditing: 'সম্পাদনা শেষ',
    copy: 'কপি',
    copied: 'কপি হয়েছে',
    regenerate: 'পুনরায় তৈরি',
    save: 'সংরক্ষণ করুন',
    saved: 'সংরক্ষিত',
    narrative: 'সম্পূর্ণ গল্প',
    characters: 'উল্লেখযোগ্য চরিত্র',
    conflict: 'মূল দ্বন্দ্ব',
    climax: 'চরম মুহূর্ত',
    resolution: 'সমাপ্তি',
  },
  myStories: {
    ...EN.myStories,
    kicker: 'পাণ্ডুলিপি সংগ্রহ',
    title: 'আমার গল্প',
    generateNew: 'নতুন গল্প তৈরি করুন',
    searchPlaceholder: 'শিরোনাম, সারসংক্ষেপ বা চরিত্র দিয়ে খুঁজুন...',
    emptyTitle: 'আপনার গল্পের সংগ্রহ খালি',
    createFirst: 'প্রথম গল্প তৈরি করুন',
    open: 'খুলুন',
    coWrite: 'সহ-রচনা',
  },
  characters: {
    ...EN.characters,
    kicker: 'চরিত্র নির্মাণ',
    title: 'চরিত্র স্টুডিও',
    generateWithAi: 'AI দিয়ে চরিত্র তৈরি করুন',
    generateBtn: 'চরিত্র তৈরি করুন',
    generatingBtn: 'চরিত্র তৈরি হচ্ছে...',
    detailsHeading: 'চরিত্রের বিবরণ',
    editHeading: 'চরিত্র সম্পাদনা',
    nameLabel: 'নাম *',
    roleLabel: 'ভূমিকা',
    personalityLabel: 'ব্যক্তিত্ব',
    backgroundLabel: 'পটভূমি',
    strengthsLabel: 'শক্তি',
    weaknessesLabel: 'দুর্বলতা',
    saveBtn: 'চরিত্র সংরক্ষণ করুন',
    updateBtn: 'চরিত্র আপডেট করুন',
    savedBtn: 'সংরক্ষিত',
    searchPlaceholder: 'নাম বা ভূমিকা দিয়ে খুঁজুন...',
    emptyTitle: 'এখনও কোনো চরিত্র সংরক্ষিত নেই',
  },
  plotBuilder: {
    ...EN.plotBuilder,
    kicker: 'গল্পের কাঠামো',
    title: 'প্লট নির্মাতা',
    newOutline: 'নতুন রূপরেখা',
    saveOutline: 'রূপরেখা সংরক্ষণ',
    savedOutline: 'সংরক্ষিত',
    generateBtn: 'AI দিয়ে প্লট তৈরি করুন',
    generatingBtn: 'প্লট ও অধ্যায় সাজানো হচ্ছে...',
    arcHeading: 'ছয়-ধাপের নাটকীয় কাঠামো',
    chaptersHeading: 'অধ্যায় ও দৃশ্য',
    addChapter: 'অধ্যায় যোগ করুন',
    addScene: 'দৃশ্য যোগ করুন',
  },
  coWriter: {
    ...EN.coWriter,
    kicker: 'নিরিবিলি লেখার মঞ্চ',
    title: 'AI সহ-লেখক',
    focusMode: 'ফোকাস মোড',
    exitFocusMode: 'ফোকাস বন্ধ',
    saveToLibrary: 'আমার গল্পে সংরক্ষণ করুন',
    continueWriting: 'লেখা এগিয়ে নিন',
    rewrite: 'পুনরায় লিখুন',
    improveGrammar: 'ব্যাকরণ ঠিক করুন',
    addDialogue: 'সংলাপ যোগ করুন',
    changeStyle: 'লেখার ভঙ্গি বদলান',
    makeEmotional: 'আরও আবেগপূর্ণ করুন',
  },
  endings: {
    ...EN.endings,
    kicker: 'কাহিনির মোড়',
    title: 'বিকল্প সমাপ্তি',
    generateBtn: '৪টি বিকল্প সমাপ্তি তৈরি করুন',
    generatingBtn: 'সমাপ্তি তৈরি হচ্ছে...',
    savePreferred: 'পছন্দের সমাপ্তি সংরক্ষণ',
    preferredLabel: 'সংরক্ষিত পছন্দের সমাপ্তি',
  },
  settings: {
    ...EN.settings,
    kicker: 'স্টুডিও কনফিগারেশন',
    title: 'সেটিংস',
    backToDashboard: 'ড্যাশবোর্ডে ফিরুন',
    appearanceHeading: 'ভাষা ও থিম',
    themeLabel: 'রঙের থিম',
    darkMode: 'ডার্ক মোড',
    lightMode: 'লাইট মোড',
    languageLabel: 'অ্যাপ ও AI ভাষা',
    defaultsHeading: 'লেখার ডিফল্ট পছন্দ',
    defaultLength: 'ডিফল্ট গল্পের দৈর্ঘ্য',
    defaultTone: 'ডিফল্ট মেজাজ',
    editorScale: 'এডিটর ফন্টের আকার',
    showWordCounts: 'শব্দ সংখ্যা দেখান',
  },
  auth: {
    ...EN.auth,
    kicker: 'StoryWeave লেখক কক্ষ',
    signInTab: 'সাইন ইন',
    registerTab: 'নিবন্ধন (Register)',
    signInTitle: 'আপনার লেখার স্টুডিওতে স্বাগতম',
    signInSubtitle:
      'সংরক্ষিত গল্প, চরিত্র, প্লট ও বিকল্প সমাপ্তি খুলতে আপনার অ্যাকাউন্টে সাইন ইন করুন।',
    registerTitle: 'নতুন লেখক অ্যাকাউন্ট খুলুন',
    registerSubtitle:
      'নিজের কলমি নাম বেছে নিন এবং সমস্ত লেখা সুরক্ষিতভাবে সংরক্ষণ করুন।',
    penNameLabel: 'কলমি নাম (ঐচ্ছিক)',
    penNamePlaceholder: 'যেমন: আরভ সেন, মীরা দেবী',
    signInGoogleBtn: 'Google দিয়ে সাইন ইন করুন',
    registerGoogleBtn: 'Google দিয়ে অ্যাকাউন্ট খুলুন',
    connectingBtn: 'সংযুক্ত হচ্ছে...',
    guestBtn: 'সাইন ইন ছাড়াই মূল পাতায় যান',
    switchToRegister: 'নতুন লেখক? অ্যাকাউন্ট তৈরি করুন',
    switchToSignIn: 'আগেই অ্যাকাউন্ট আছে? সাইন ইন করুন',
    signInNavBtn: 'সাইন ইন / নিবন্ধন',
    signOutBtn: 'সাইন আউট',
    signedInAs: 'সাইন ইন করা অ্যাকাউন্ট',
  },
  voice: {
    ...EN.voice,
    title: 'গল্প ভয়েস অ্যাসিস্ট্যান্ট',
    subtitle: 'আপনার পছন্দের ভাষায় গল্পটি শুনুন',
    listenBtn: 'শুনুন',
    pauseBtn: 'বিরতি',
    resumeBtn: 'চালিয়ে যান',
    stopBtn: 'বন্ধ করুন',
    synthesizing: 'কণ্ঠস্বর তৈরি হচ্ছে...',
    readLanguage: 'পাঠের ভাষা',
    narratorVoice: 'কণ্ঠ',
    speed: 'গতি',
    partOf: 'অংশ',
    translatedNotice: 'অনূদিত পাঠের ভাষা:',
    browserFallbackNote: 'ডিভাইসের ভয়েস ব্যবহার করে পড়া হচ্ছে।',
    aiVoiceLabel: 'স্টুডিও AI ভয়েস',
    browserVoiceLabel: 'ডিভাইস ভয়েস',
  },
};

const TA: TranslationStrings = {
  ...EN,
  nav: {
    ...EN.nav,
    dashboard: 'முகப்பு',
    myStories: 'என் கதைகள்',
    storyGenerator: 'கதை உருவாக்கி',
    characterStudio: 'கதாபாத்திர ஸ்டுடியோ',
    plotBuilder: 'கதைக்களம்',
    aiCoWriter: 'AI இணை எழுத்தாளர்',
    alternativeEndings: 'மாற்று முடிவுகள்',
    settings: 'அமைப்புகள்',
    backToLanding: 'முகப்புப் பக்கத்திற்கு',
  },
  landing: {
    ...EN.landing,
    heroHeadline: 'உங்கள் கற்பனை. எங்கள் நுண்ணறிவு. முடிவற்ற கதைகள்.',
    startCreating: 'எழுதத் தொடங்குங்கள்',
    exploreFeatures: 'அம்சங்களைப் பார்க்க',
    readSample: 'கதையைப் படிக்க',
  },
  dashboard: {
    ...EN.dashboard,
    newStory: 'புதிய கதை',
    welcomeTitle: 'StoryWeave ஸ்டுடியோவிற்கு வரவேற்கிறோம்',
    createNewStory: 'புதிய கதை உருவாக்கு',
    savedStoriesStat: 'சேமித்த கதைகள்',
    charactersStat: 'கதாபாத்திரங்கள்',
    plotsStat: 'கதைக்களங்கள்',
    wordsStat: 'மொத்த வார்த்தைகள்',
  },
  settings: {
    ...EN.settings,
    title: 'அமைப்புகள்',
    appearanceHeading: 'மொழி மற்றும் தோற்றம்',
    themeLabel: 'வண்ணத் தீம்',
    darkMode: 'இருண்ட பயன்முறை',
    lightMode: 'ஒளி பயன்முறை',
    languageLabel: 'பயன்பாடு மற்றும் AI மொழி',
  },
  auth: {
    ...EN.auth,
    signInTab: 'உள்நுழைக',
    registerTab: 'பதிவு செய்க',
    signInNavBtn: 'உள்நுழை / பதிவு',
    signOutBtn: 'வெளியேறு',
  },
  voice: {
    ...EN.voice,
    title: 'கதை குரல் உதவியாளர்',
    subtitle: 'நீங்கள் தேர்ந்தெடுத்த மொழியில் கதையைக் கேளுங்கள்',
    listenBtn: 'கேளுங்கள்',
    pauseBtn: 'இடைநிறுத்து',
    resumeBtn: 'தொடரவும்',
    stopBtn: 'நிறுத்து',
    synthesizing: 'குரல் தயாராகிறது...',
    readLanguage: 'வாசிப்பு மொழி',
    narratorVoice: 'குரல்',
    speed: 'வேகம்',
    partOf: 'பகுதி',
  },
};

const MR: TranslationStrings = {
  ...EN,
  nav: {
    ...EN.nav,
    dashboard: 'डॅशबोर्ड',
    myStories: 'माझ्या कथा',
    storyGenerator: 'कथा जनरेटर',
    characterStudio: 'पात्र स्टुडिओ',
    plotBuilder: 'कथानक निर्माता',
    aiCoWriter: 'AI सह-लेखक',
    alternativeEndings: 'पर्यायी शेवट',
    settings: 'सेटिंग्ज',
    backToLanding: 'मुख्य पृष्ठावर जा',
  },
  landing: {
    ...EN.landing,
    heroHeadline: 'तुमची कल्पना. आमची बुद्धिमत्ता. अनंत कथा.',
    startCreating: 'लेखन सुरू करा',
    exploreFeatures: 'वैशिष्ट्ये पहा',
    readSample: 'कथा वाचा',
  },
  dashboard: {
    ...EN.dashboard,
    newStory: 'नवीन कथा',
    welcomeTitle: 'StoryWeave स्टुडिओमध्ये स्वागत आहे',
    createNewStory: 'नवीन कथा तयार करा',
    savedStoriesStat: 'जतन केलेल्या कथा',
    charactersStat: 'तयार केलेली पात्रे',
    plotsStat: 'कथानक आराखडे',
    wordsStat: 'एकूण शब्द',
  },
  settings: {
    ...EN.settings,
    title: 'स्टुडिओ सेटिंग्ज',
    appearanceHeading: 'भाषा आणि थीम',
    themeLabel: 'रंग थीम',
    darkMode: 'डार्क मोड',
    lightMode: 'लाइट मोड',
    languageLabel: 'अ‍ॅप आणि AI भाषा',
  },
  auth: {
    ...EN.auth,
    signInTab: 'साइन इन',
    registerTab: 'नोंदणी करा',
    signInNavBtn: 'साइन इन / नोंदणी',
    signOutBtn: 'साइन आउट',
  },
  voice: {
    ...EN.voice,
    title: 'कथा व्हॉइस असिस्टंट',
    subtitle: 'तुमच्या निवडलेल्या भाषेत कथा ऐका',
    listenBtn: 'ऐका',
    pauseBtn: 'थांबवा',
    resumeBtn: 'पुढे चालू ठेवा',
    stopBtn: 'बंद करा',
    synthesizing: 'आवाज तयार होत आहे...',
    readLanguage: 'वाचन भाषा',
    narratorVoice: 'निवेदक',
    speed: 'वेग',
    partOf: 'भाग',
  },
};

const TE: TranslationStrings = {
  ...EN,
  nav: {
    ...EN.nav,
    dashboard: 'డ్యాష్‌బోర్డ్',
    myStories: 'నా కథలు',
    storyGenerator: 'కథ జనరేటర్',
    characterStudio: 'పాత్రల స్టూడియో',
    plotBuilder: 'కథా నిర్మాణం',
    aiCoWriter: 'AI సహ-రచయిత',
    alternativeEndings: 'ప్రత్యామ్నాయ ముగింపులు',
    settings: 'సెట్టింగులు',
    backToLanding: 'హోమ్ పేజీకి వెళ్ళండి',
  },
  landing: {
    ...EN.landing,
    heroHeadline: 'మీ ఊహ. మా మేధస్సు. అనంతమైన కథలు.',
    startCreating: 'రాయడం ప్రారంభించండి',
    exploreFeatures: 'ఫీచర్లు చూడండి',
    readSample: 'కథ చదవండి',
  },
  dashboard: {
    ...EN.dashboard,
    newStory: 'కొత్త కథ',
    welcomeTitle: 'StoryWeave స్టూడియోకు స్వాగతం',
    createNewStory: 'కొత్త కథ సృష్టించండి',
    savedStoriesStat: 'సేవ్ చేసిన కథలు',
    charactersStat: 'పాత్రలు',
    plotsStat: 'కథా రూపరేఖలు',
    wordsStat: 'మొత్తం పదాలు',
  },
  settings: {
    ...EN.settings,
    title: 'సెట్టింగులు',
    appearanceHeading: 'భాష మరియు థీమ్',
    themeLabel: 'రంగు థీమ్',
    darkMode: 'డార్క్ మోడ్',
    lightMode: 'లైట్ మోడ్',
    languageLabel: 'యాప్ మరియు AI భాష',
  },
  auth: {
    ...EN.auth,
    signInTab: 'సైన్ ఇన్',
    registerTab: 'నమోదు చేసుకోండి',
    signInNavBtn: 'సైన్ ఇన్ / నమోదు',
    signOutBtn: 'సైన్ అవుట్',
  },
  voice: {
    ...EN.voice,
    title: 'కథ వాయిస్ అసిస్టెంట్',
    subtitle: 'మీరు ఎంచుకున్న భాషలో కథను వినండి',
    listenBtn: 'వినండి',
    pauseBtn: 'పాజ్',
    resumeBtn: 'కొనసాగించండి',
    stopBtn: 'ఆపండి',
    synthesizing: 'వాయిస్ సిద్ధమవుతోంది...',
    readLanguage: 'చదివే భాష',
    narratorVoice: 'వ్యాఖ్యాత',
    speed: 'వేగం',
    partOf: 'భాగం',
  },
};

export const TRANSLATIONS: Record<AppLanguage, TranslationStrings> = {
  en: EN,
  hi: HI,
  bn: BN,
  ta: TA,
  mr: MR,
  te: TE,
};

export function getLanguageNameForAI(code: AppLanguage): string {
  const match = LANGUAGE_OPTIONS.find((opt) => opt.code === code);
  return match ? `${match.englishName} (${match.nativeName})` : 'English';
}
