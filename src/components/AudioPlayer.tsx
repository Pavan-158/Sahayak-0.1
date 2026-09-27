import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Volume2 } from 'lucide-react';
import { speak, stopSpeaking, pauseSpeaking, resumeSpeaking, isPaused, preloadVoices } from '../services/audioService';
import { languages } from '../data/mockData';

interface AudioPlayerProps {
  text: string;
  title?: string;
  language?: string;
  compact?: boolean;
}

export default function AudioPlayer({ text, title = 'Audio Summary', language = 'en', compact = false }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPausedState, setIsPausedState] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedLang, setSelectedLang] = useState(language);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    preloadVoices().then(() => setVoicesLoaded(true));
    
    return () => {
      stopSpeaking();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handlePlayPause = () => {
    if (isPlaying && !isPausedState) {
      // Currently playing - pause
      pauseSpeaking();
      setIsPausedState(true);
    } else if (isPausedState) {
      // Currently paused - resume
      resumeSpeaking();
      setIsPausedState(false);
    } else {
      // Start playing
      setProgress(0);
      setIsPlaying(true);
      setIsPausedState(false);
      
      speak(
        text,
        selectedLang,
        (p) => setProgress(p),
        () => {
          setIsPlaying(false);
          setIsPausedState(false);
          setProgress(0);
        },
        0.9
      );
    }
  };

  const handleStop = () => {
    stopSpeaking();
    setIsPlaying(false);
    setIsPausedState(false);
    setProgress(0);
  };

  const formatTime = (pct: number) => {
    // Rough estimate: assume 2 min total
    const totalSeconds = 120;
    const current = Math.floor((pct / 100) * totalSeconds);
    const mins = Math.floor(current / 60);
    const secs = current % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3 bg-gradient-to-r from-saffron/5 to-green-india/5 rounded-lg p-3">
        <button
          onClick={handlePlayPause}
          className="w-10 h-10 bg-saffron rounded-full flex items-center justify-center text-white hover:bg-saffron-dark transition-colors flex-shrink-0 shadow-md"
          title={isPlaying && !isPausedState ? 'Pause' : 'Play'}
        >
          {isPlaying && !isPausedState ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-saffron to-green-india rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <span className="text-xs text-gray-500 flex-shrink-0 w-10 text-right">{formatTime(progress)}</span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-saffron/5 via-white to-green-india/5 rounded-xl p-5 border border-saffron/20">
      <div className="flex items-center gap-2 mb-3">
        <Volume2 size={18} className="text-saffron" />
        <h3 className="font-semibold text-gray-800">{title}</h3>
      </div>

      <div className="flex items-center gap-4">
        {/* Play/Pause Button */}
        <button
          onClick={handlePlayPause}
          disabled={!text || !voicesLoaded}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-white transition-all shadow-lg flex-shrink-0 ${
            isPlaying && !isPausedState
              ? 'bg-green-india hover:bg-green-india-dark'
              : 'bg-saffron hover:bg-saffron-dark'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title={isPlaying && !isPausedState ? 'Pause' : isPausedState ? 'Resume' : 'Play summary'}
        >
          {isPlaying && !isPausedState ? (
            <Pause size={24} />
          ) : (
            <Play size={24} className="ml-1" />
          )}
        </button>

        {/* Progress Bar */}
        <div className="flex-1">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-saffron to-green-india rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-xs text-gray-500">
              {isPlaying && !isPausedState ? '🔊 Playing...' : isPausedState ? '⏸ Paused' : 'Click play to listen'}
            </span>
            <span className="text-xs text-gray-400 font-mono">{formatTime(progress)} / 2:00</span>
          </div>
        </div>

        {/* Stop Button */}
        {isPlaying && (
          <button
            onClick={handleStop}
            className="w-10 h-10 rounded-full bg-gray-200 hover:bg-red-100 hover:text-red-600 flex items-center justify-center text-gray-600 transition-all flex-shrink-0"
            title="Stop"
          >
            <Square size={16} />
          </button>
        )}
      </div>

      {/* Language Selector */}
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-saffron/10">
        <label className="text-xs font-medium text-gray-600">Listen in:</label>
        <select
          value={selectedLang}
          onChange={(e) => {
            if (isPlaying) handleStop();
            setSelectedLang(e.target.value);
          }}
          className="text-xs border border-gray-200 rounded-md px-2 py-1.5 bg-white focus:ring-2 focus:ring-saffron focus:border-transparent outline-none"
          disabled={isPlaying}
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>{lang.name}</option>
          ))}
        </select>
        <span className="text-xs text-gray-400 ml-auto">Powered by browser TTS</span>
      </div>
    </div>
  );
}
