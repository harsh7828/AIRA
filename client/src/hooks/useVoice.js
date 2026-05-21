import { useState, useEffect, useRef, useCallback } from 'react';

const useVoice = (voicePreference = 'standard') => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState(null);
  const audioRef = useRef(null);

  // Stop current playback
  const stop = useCallback(() => {
    if (voicePreference === 'standard') {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlaying(false);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsPlaying(false);
    }
  }, [voicePreference]);

  // Play audio from URL (ElevenLabs)
  const playAudio = useCallback((audioUrl, onEnd = null) => {
    return new Promise((resolve, reject) => {
      if (!audioUrl) {
        reject(new Error('No audio URL provided'));
        return;
      }

      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => setIsPlaying(true);
      audio.onpause = () => setIsPlaying(false);
      audio.onended = () => {
        setIsPlaying(false);
        audioRef.current = null;
        if (onEnd) onEnd();
        resolve();
      };
      audio.onerror = (event) => {
        console.error('Audio playback error:', event);
        setIsPlaying(false);
        audioRef.current = null;
        reject(event);
      };

      audio.play().catch(reject);
    });
  }, []);

  // Speak using standard Web Speech API
  const speakStandard = useCallback((text, onEnd = null) => {
    if (!('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Try to select a professional English voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Google US English') || 
      voice.name.includes('Samantha') ||
      voice.lang === 'en-US'
    );
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => {
      setIsPlaying(false);
      if (onEnd) onEnd();
    };
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsPlaying(false);
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  // Speak with automatic fallback
  const speak = useCallback(async (text, audioUrl = null, onEnd = null) => {
    if (voicePreference === 'elevenlabs' && audioUrl) {
      try {
        await playAudio(audioUrl, onEnd);
      } catch (error) {
        console.warn('ElevenLabs audio failed, falling back to standard voice:', error.message);
        speakStandard(text, onEnd);
      }
    } else {
      speakStandard(text, onEnd);
    }
  }, [voicePreference, playAudio, speakStandard]);

  // Prefetch audio for next question
  const prefetchAudio = useCallback(async (audioUrl) => {
    if (!audioUrl || voicePreference !== 'elevenlabs') return;

    try {
      const response = await fetch(audioUrl);
      if (response.ok) {
        const blob = await response.blob();
        const audioBlobUrl = URL.createObjectURL(blob);
        // Store for later use
        setCurrentAudio(audioBlobUrl);
      }
    } catch (error) {
      console.warn('Failed to prefetch audio:', error.message);
    }
  }, [voicePreference]);

  return {
    isPlaying,
    speak,
    speakStandard,
    playAudio,
    prefetchAudio,
    stop,
    hasPrefetchedAudio: !!currentAudio
  };
};

export default useVoice;