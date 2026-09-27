/**
 * Audio Service - Uses the browser's built-in Web Speech API (SpeechSynthesis)
 * Free, no API keys needed, supports Indian languages
 */

// Map our language codes to Web Speech API BCP-47 tags
const LANG_MAP: Record<string, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  bn: 'bn-IN',
  te: 'te-IN',
  mr: 'mr-IN',
  ta: 'ta-IN',
  gu: 'gu-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  pa: 'pa-IN',
  or: 'or-IN',
};

// Human-readable names for languages
const LANG_NAMES: Record<string, string> = {
  en: 'English',
  hi: 'Hindi',
  bn: 'Bengali',
  te: 'Telugu',
  mr: 'Marathi',
  ta: 'Tamil',
  gu: 'Gujarati',
  kn: 'Kannada',
  ml: 'Malayalam',
  pa: 'Punjabi',
  or: 'Odia',
};

let currentUtterance: SpeechSynthesisUtterance | null = null;
let onProgressCallback: ((progress: number) => void) | null = null;
let onEndCallback: (() => void) | null = null;
let progressInterval: ReturnType<typeof setInterval> | null = null;
let cachedVoices: SpeechSynthesisVoice[] = [];

/**
 * Check if speech synthesis is available
 */
export function isTTSAvailable(): boolean {
  return 'speechSynthesis' in window;
}

/**
 * Get all available voices (cached)
 */
export function getAllVoices(): SpeechSynthesisVoice[] {
  if (cachedVoices.length === 0 && isTTSAvailable()) {
    cachedVoices = window.speechSynthesis.getVoices();
  }
  return cachedVoices;
}

/**
 * Check if a specific language is supported by available voices
 */
export function isLanguageSupported(langCode: string): boolean {
  const voices = getAllVoices();
  const bcp47 = LANG_MAP[langCode] || 'en-IN';
  const langPrefix = bcp47.split('-')[0];
  
  return voices.some(v => v.lang.toLowerCase().startsWith(langPrefix.toLowerCase()));
}

/**
 * Get list of supported languages from available voices
 */
export function getSupportedLanguages(): string[] {
  const voices = getAllVoices();
  const supported = new Set<string>();
  
  for (const [code, bcp47] of Object.entries(LANG_MAP)) {
    const langPrefix = bcp47.split('-')[0];
    if (voices.some(v => v.lang.toLowerCase().startsWith(langPrefix.toLowerCase()))) {
      supported.add(code);
    }
  }
  
  return Array.from(supported);
}

/**
 * Get the best voice for a language.
 * CRITICAL: Only returns a voice if it actually matches the target language.
 * Returns null if no matching voice is found (so browser uses its default).
 */
function getBestVoice(langCode: string): SpeechSynthesisVoice | null {
  const voices = getAllVoices();
  const bcp47 = LANG_MAP[langCode] || 'en-IN';
  const langPrefix = bcp47.split('-')[0].toLowerCase();
  
  if (voices.length === 0) return null;
  
  // 1. Try exact BCP-47 match (e.g., 'hi-IN')
  let voice = voices.find(v => v.lang.toLowerCase() === bcp47.toLowerCase());
  if (voice) return voice;
  
  // 2. Try language + country match (e.g., any 'hi-*')
  voice = voices.find(v => v.lang.toLowerCase().startsWith(langPrefix + '-'));
  if (voice) return voice;
  
  // 3. Try just language prefix (e.g., 'hi')
  voice = voices.find(v => v.lang.toLowerCase().split('-')[0] === langPrefix);
  if (voice) return voice;
  
  // 4. Try Google voice for this language (usually best quality)
  voice = voices.find(v => 
    v.lang.toLowerCase().startsWith(langPrefix) && 
    v.name.toLowerCase().includes('google')
  );
  if (voice) return voice;
  
  // 5. DO NOT fall back to English! Return null so browser picks default for the lang.
  return null;
}

/**
 * Speak text aloud
 * 
 * KEY FIX: We only set utterance.voice if we found a voice that matches the target language.
 * If no matching voice exists, we ONLY set utterance.lang and let the browser handle it.
 * This prevents English voice from being forced when user selects Hindi/Tamil/etc.
 */
export function speak(
  text: string,
  langCode: string = 'en',
  onProgress?: (progress: number) => void,
  onEnd?: () => void,
  rate: number = 0.9,
): void {
  if (!isTTSAvailable()) {
    console.warn('Speech synthesis not available');
    return;
  }

  // Stop any current speech
  stopSpeaking();

  // Clean text for speech (remove markdown, special chars)
  const cleanText = text
    .replace(/[*_#`~\[\](){}]/g, '')
    .replace(/\n+/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanText) return;

  const utterance = new SpeechSynthesisUtterance(cleanText);
  
  // CRITICAL: Always set the correct language first
  const targetLang = LANG_MAP[langCode] || 'en-IN';
  utterance.lang = targetLang;
  
  // Only set voice if we found one that MATCHES the target language
  const voice = getBestVoice(langCode);
  if (voice) {
    utterance.voice = voice;
    console.log(`🔊 Using voice: ${voice.name} (${voice.lang}) for ${LANG_NAMES[langCode] || langCode}`);
  } else {
    // No specific voice found - let browser use its default for this language
    console.log(`🔊 No specific voice for ${LANG_NAMES[langCode] || langCode}, using browser default with lang=${targetLang}`);
  }
  
  utterance.rate = rate;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  currentUtterance = utterance;
  onProgressCallback = onProgress || null;
  onEndCallback = onEnd || null;

  // Estimate duration for progress tracking (rough: ~130 words per minute)
  const wordCount = cleanText.split(/\s+/).length;
  const estimatedDurationMs = Math.max(5000, (wordCount / (130 * rate)) * 60 * 1000);
  const startTime = Date.now();

  // Progress tracking
  if (onProgressCallback) {
    progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(99, (elapsed / estimatedDurationMs) * 100);
      onProgressCallback?.(progress);
    }, 200);
  }

  utterance.onend = () => {
    if (progressInterval) {
      clearInterval(progressInterval);
      progressInterval = null;
    }
    onProgressCallback?.(100);
    onEndCallback?.();
    currentUtterance = null;
  };

  utterance.onerror = (event) => {
    if (progressInterval) {
      clearInterval(progressInterval);
      progressInterval = null;
    }
    if (event.error !== 'canceled') {
      console.error('Speech error:', event.error);
    }
    onEndCallback?.();
    currentUtterance = null;
  };

  // Chrome bug workaround: long texts get cut off. Split into chunks if needed.
  if (cleanText.length > 200) {
    // For Chrome, we need to resume periodically
    const resumeInterval = setInterval(() => {
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 10000);
    
    utterance.onend = () => {
      clearInterval(resumeInterval);
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
      onProgressCallback?.(100);
      onEndCallback?.();
      currentUtterance = null;
    };
  }

  window.speechSynthesis.speak(utterance);
}

/**
 * Pause current speech
 */
export function pauseSpeaking(): void {
  if (isTTSAvailable() && window.speechSynthesis.speaking) {
    window.speechSynthesis.pause();
    if (progressInterval) {
      clearInterval(progressInterval);
      progressInterval = null;
    }
  }
}

/**
 * Resume paused speech
 */
export function resumeSpeaking(): void {
  if (isTTSAvailable() && window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
    
    // Restart progress tracking
    if (onProgressCallback && currentUtterance) {
      const startTime = Date.now();
      progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        // Just increment slowly since we don't know exact position
      }, 200);
    }
  }
}

/**
 * Stop current speech completely
 */
export function stopSpeaking(): void {
  if (isTTSAvailable()) {
    window.speechSynthesis.cancel();
  }
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }
  currentUtterance = null;
}

/**
 * Check if currently speaking
 */
export function isSpeaking(): boolean {
  return isTTSAvailable() && window.speechSynthesis.speaking;
}

/**
 * Check if paused
 */
export function isPaused(): boolean {
  return isTTSAvailable() && window.speechSynthesis.paused;
}

/**
 * Preload voices (needed for some browsers - Chrome loads voices async)
 */
export function preloadVoices(): Promise<void> {
  return new Promise((resolve) => {
    if (!isTTSAvailable()) {
      resolve();
      return;
    }
    
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      cachedVoices = voices;
      resolve();
      return;
    }
    
    // Wait for voices to load (Chrome loads them asynchronously)
    let resolved = false;
    const handler = () => {
      cachedVoices = window.speechSynthesis.getVoices();
      if (!resolved) {
        resolved = true;
        resolve();
      }
    };
    
    window.speechSynthesis.onvoiceschanged = handler;
    
    // Also try immediately after a short delay (some browsers)
    setTimeout(() => {
      cachedVoices = window.speechSynthesis.getVoices();
      if (!resolved) {
        resolved = true;
        resolve();
      }
    }, 500);
    
    // Final timeout fallback
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        cachedVoices = window.speechSynthesis.getVoices();
        resolve();
      }
    }, 2000);
  });
}

/**
 * Get language name
 */
export function getLanguageName(langCode: string): string {
  return LANG_NAMES[langCode] || langCode;
}
