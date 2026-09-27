/**
 * Speech Recognition Service
 * Uses the browser's built-in Web Speech API (SpeechRecognition)
 * Free, no API keys needed, supports multiple Indian languages
 */

// Map language codes to Speech Recognition BCP-47 tags
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

let recognition: any = null;
let isListening = false;
let onResultCallback: ((text: string, isFinal: boolean) => void) | null = null;
let onErrorCallback: ((error: string) => void) | null = null;
let onEndCallback: (() => void) | null = null;

/**
 * Check if speech recognition is available
 */
export function isSpeechRecognitionAvailable(): boolean {
  return !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition;
}

/**
 * Request microphone permission first
 */
export async function requestMicrophonePermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Stop the stream immediately - we just needed the permission
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    console.error('Microphone permission error:', error);
    return false;
  }
}

/**
 * Initialize speech recognition
 */
export function initSpeechRecognition(): boolean {
  if (!isSpeechRecognitionAvailable()) {
    console.warn('Speech recognition not available in this browser');
    return false;
  }

  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  
  // Configure recognition
  recognition.continuous = false; // Stop after first result
  recognition.interimResults = true; // Show interim results
  recognition.maxAlternatives = 1;
  
  return true;
}

/**
 * Start listening for speech
 */
export async function startListening(
  language: string = 'en',
  onResult: (text: string, isFinal: boolean) => void,
  onError?: (error: string) => void,
  onEnd?: () => void,
): Promise<boolean> {
  // First, request microphone permission
  const hasPermission = await requestMicrophonePermission();
  if (!hasPermission) {
    onError?.('Microphone access was denied. Please allow microphone access in your browser settings.');
    return false;
  }

  if (!recognition && !initSpeechRecognition()) {
    return false;
  }

  if (isListening) {
    console.warn('Already listening');
    return false;
  }

  // Set language
  recognition.lang = LANG_MAP[language] || 'en-IN';
  
  // Set callbacks
  onResultCallback = onResult;
  onErrorCallback = onError || null;
  onEndCallback = onEnd || null;

  // Handle results
  recognition.onresult = (event: any) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }

    // Call result callback
    if (finalTranscript) {
      onResultCallback?.(finalTranscript, true);
    } else if (interimTranscript) {
      onResultCallback?.(interimTranscript, false);
    }
  };

  // Handle errors
  recognition.onerror = (event: any) => {
    console.error('Speech recognition error:', event.error);
    onErrorCallback?.(event.error);
    isListening = false;
  };

  // Handle end
  recognition.onend = () => {
    isListening = false;
    onEndCallback?.();
  };

  // Start listening
  try {
    recognition.start();
    isListening = true;
    return true;
  } catch (error) {
    console.error('Error starting recognition:', error);
    onErrorCallback?.('Failed to start recognition');
    return false;
  }
}

/**
 * Stop listening
 */
export function stopListening(): void {
  if (recognition && isListening) {
    recognition.stop();
    isListening = false;
  }
}

/**
 * Check if currently listening
 */
export function isCurrentlyListening(): boolean {
  return isListening;
}

/**
 * Get supported languages for speech recognition
 * Note: Browser support varies
 */
export function getSupportedRecognitionLanguages(): string[] {
  // Most modern browsers support these for speech recognition
  return ['en', 'hi', 'bn', 'te', 'mr', 'ta', 'gu', 'kn', 'ml', 'pa'];
}

/**
 * Check if a specific language is supported for recognition
 */
export function isLanguageSupportedForRecognition(langCode: string): boolean {
  if (!isSpeechRecognitionAvailable()) return false;
  
  // Most Indian languages are supported in Chrome/Edge
  const supported = getSupportedRecognitionLanguages();
  return supported.includes(langCode);
}
