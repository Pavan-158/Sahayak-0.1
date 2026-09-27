/**
 * Speech Recognition Service
 * Uses the browser's built-in Web Speech API (SpeechRecognition)
 * Free, no API keys needed, supports multiple Indian languages
 * 
 * IMPORTANT: Requires HTTPS or localhost to work!
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

// Language display names
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

let recognition: any = null;
let isListening = false;

/**
 * Check if speech recognition is available
 */
export function isSpeechRecognitionAvailable(): boolean {
  return typeof window !== 'undefined' && 
    (!!((window as any).SpeechRecognition) || !!((window as any).webkitSpeechRecognition));
}

/**
 * Check if we're in a secure context (HTTPS or localhost)
 * Speech recognition REQUIRES this!
 */
export function isSecureContext(): boolean {
  if (typeof window === 'undefined') return false;
  // window.isSecureContext is true for HTTPS and localhost
  return window.isSecureContext === true || 
         window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1' ||
         window.location.protocol === 'https:';
}

/**
 * Get a detailed diagnostic message about what's wrong
 */
export function getDiagnosticMessage(): string {
  if (!isSpeechRecognitionAvailable()) {
    return 'Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.';
  }
  
  if (!isSecureContext()) {
    return 'Speech recognition requires a secure connection (HTTPS). The current page is served over HTTP. Please access this app via HTTPS or localhost.';
  }
  
  return '';
}

/**
 * Request microphone permission first
 */
export async function requestMicrophonePermission(): Promise<{ success: boolean; error?: string }> {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return { success: false, error: 'MediaDevices API not available' };
    }
    
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Stop the stream immediately - we just needed the permission
    stream.getTracks().forEach(track => track.stop());
    return { success: true };
  } catch (error: any) {
    console.error('Microphone permission error:', error);
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      return { success: false, error: 'Microphone access was denied by the user' };
    }
    if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      return { success: false, error: 'No microphone device found' };
    }
    if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      return { success: false, error: 'Microphone is being used by another application' };
    }
    return { success: false, error: error.message || 'Unknown microphone error' };
  }
}

/**
 * Create a fresh recognition instance
 * We create a new one each time to avoid state issues
 */
function createRecognition(language: string): any {
  if (!isSpeechRecognitionAvailable()) return null;
  
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const rec = new SpeechRecognition();
  
  // Configure
  rec.continuous = false;
  rec.interimResults = true;
  rec.maxAlternatives = 1;
  rec.lang = LANG_MAP[language] || 'en-IN';
  
  return rec;
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
  // Pre-flight checks
  if (!isSpeechRecognitionAvailable()) {
    onError?.('Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
    return false;
  }
  
  if (!isSecureContext()) {
    onError?.('Speech recognition requires HTTPS. Please access this app via a secure connection (HTTPS) or localhost.');
    return false;
  }

  // Stop any existing recognition first
  if (recognition && isListening) {
    try {
      recognition.abort();
    } catch (e) {
      // Ignore abort errors
    }
    recognition = null;
    isListening = false;
  }

  // Request microphone permission first
  const permResult = await requestMicrophonePermission();
  if (!permResult.success) {
    onError?.(permResult.error || 'Microphone permission denied');
    return false;
  }

  // Create a FRESH recognition instance
  try {
    recognition = createRecognition(language);
    if (!recognition) {
      onError?.('Failed to create speech recognition instance');
      return false;
    }

    // Set up handlers BEFORE starting
    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        const confidence = event.results[i][0].confidence;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        onResult(finalTranscript, true);
      } else if (interimTranscript) {
        onResult(interimTranscript, false);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error, event.message);
      isListening = false;
      
      let errorMsg = '';
      switch (event.error) {
        case 'no-speech':
          errorMsg = 'No speech was detected. Please try again and speak clearly.';
          break;
        case 'audio-capture':
          errorMsg = 'Could not access microphone. Please check your microphone connection.';
          break;
        case 'not-allowed':
          errorMsg = 'Microphone permission was denied. Please allow microphone access in your browser settings.';
          break;
        case 'network':
          errorMsg = 'Network error. Speech recognition requires internet connection for cloud-based processing.';
          break;
        case 'aborted':
          // User cancelled, don't show error
          onEnd?.();
          return;
        case 'service-not-allowed':
          errorMsg = 'Speech recognition service is not allowed. Try using Chrome or Edge browser.';
          break;
        case 'language-not-supported':
          errorMsg = `Language "${LANG_NAMES[language] || language}" is not supported for speech recognition in this browser.`;
          break;
        case 'bad-grammar':
          errorMsg = 'Invalid grammar specification.';
          break;
        default:
          errorMsg = `Speech recognition error: ${event.error || 'unknown'}. Please try again.`;
      }
      
      onError?.(errorMsg);
    };

    recognition.onend = () => {
      isListening = false;
      onEnd?.();
    };

    recognition.onstart = () => {
      isListening = true;
    };

    // Start with a small delay to ensure everything is ready
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      recognition.start();
      isListening = true;
      return true;
    } catch (startError: any) {
      console.error('Error calling recognition.start():', startError);
      
      // Common error: InvalidStateError when recognition is in wrong state
      if (startError.name === 'InvalidStateError') {
        onError?.('Speech recognition is in an invalid state. Please try again.');
      } else {
        onError?.(`Failed to start speech recognition: ${startError.message || 'Unknown error'}`);
      }
      return false;
    }
  } catch (error: any) {
    console.error('Unexpected error in startListening:', error);
    onError?.(`Unexpected error: ${error.message || 'Unknown error'}`);
    return false;
  }
}

/**
 * Stop listening
 */
export function stopListening(): void {
  if (recognition) {
    try {
      if (isListening) {
        recognition.stop();
      }
    } catch (e) {
      // Ignore stop errors
    }
    isListening = false;
    recognition = null;
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
 */
export function getSupportedRecognitionLanguages(): string[] {
  return ['en', 'hi', 'bn', 'te', 'mr', 'ta', 'gu', 'kn', 'ml', 'pa'];
}

/**
 * Check if a specific language is supported for recognition
 */
export function isLanguageSupportedForRecognition(langCode: string): boolean {
  if (!isSpeechRecognitionAvailable()) return false;
  return getSupportedRecognitionLanguages().includes(langCode);
}

/**
 * Get language name
 */
export function getLanguageName(langCode: string): string {
  return LANG_NAMES[langCode] || langCode;
}
