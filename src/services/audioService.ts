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

let currentUtterance: SpeechSynthesisUtterance | null = null;
let onProgressCallback: ((progress: number) => void) | null = null;
let onEndCallback: (() => void) | null = null;
let progressInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Check if speech synthesis is available
 */
export function isTTSAvailable(): boolean {
  return 'speechSynthesis' in window;
}

/**
 * Get available voices for a language
 */
export function getVoicesForLanguage(langCode: string): SpeechSynthesisVoice[] {
  const voices = window.speechSynthesis.getVoices();
  const bcp47 = LANG_MAP[langCode] || 'en-IN';
  const langPrefix = bcp47.split('-')[0];
  
  // Prefer voices matching the language
  return voices.filter(v => 
    v.lang.startsWith(langPrefix) || v.lang === bcp47
  );
}

/**
 * Get the best voice for a language
 */
function getBestVoice(langCode: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  const bcp47 = LANG_MAP[langCode] || 'en-IN';
  const langPrefix = bcp47.split('-')[0];
  
  // Try exact match first
  let voice = voices.find(v => v.lang === bcp47);
  if (voice) return voice;
  
  // Try language prefix match
  voice = voices.find(v => v.lang.startsWith(langPrefix));
  if (voice) return voice;
  
  // Try Google voice (usually better quality)
  voice = voices.find(v => v.lang.startsWith(langPrefix) && v.name.includes('Google'));
  if (voice) return voice;
  
  // Fallback to first available
  return voices.find(v => v.lang.startsWith('en')) || voices[0] || null;
}

/**
 * Speak text aloud
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
  const voice = getBestVoice(langCode);
  
  if (voice) {
    utterance.voice = voice;
  }
  utterance.lang = LANG_MAP[langCode] || 'en-IN';
  utterance.rate = rate;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  currentUtterance = utterance;
  onProgressCallback = onProgress || null;
  onEndCallback = onEnd || null;

  // Estimate duration for progress tracking (rough: ~150 words per minute)
  const wordCount = cleanText.split(/\s+/).length;
  const estimatedDurationMs = (wordCount / (150 * rate)) * 60 * 1000;
  const startTime = Date.now();

  // Progress tracking
  if (onProgressCallback) {
    progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / estimatedDurationMs) * 100);
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
      progressInterval = setInterval(() => {
        // We don't know exact progress after resume, so just keep incrementing
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
 * Preload voices (needed for some browsers)
 */
export function preloadVoices(): Promise<void> {
  return new Promise((resolve) => {
    if (!isTTSAvailable()) {
      resolve();
      return;
    }
    
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve();
      return;
    }
    
    // Wait for voices to load
    window.speechSynthesis.onvoiceschanged = () => {
      resolve();
    };
    
    // Timeout fallback
    setTimeout(resolve, 1000);
  });
}
