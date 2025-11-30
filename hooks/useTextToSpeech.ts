import { useState, useCallback, useRef } from 'react';

interface UseTextToSpeechReturn {
  isPlaying: boolean;
  playingMessageId: string | null;
  playAudio: (text: string, messageId: string, creatorId: string) => Promise<void>;
  stopAudio: () => void;
}

export function useTextToSpeech(): UseTextToSpeechReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsPlaying(false);
    setPlayingMessageId(null);
  }, []);

  const playAudio = useCallback(async (text: string, messageId: string, creatorId: string) => {
    try {
      if (playingMessageId === messageId) {
        stopAudio();
        return;
      }

      stopAudio();

      setIsPlaying(true);
      setPlayingMessageId(messageId);

      // Appeler l'API en mode streaming
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, creatorId }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la génération audio');
      }

      // Récupérer le stream audio directement
      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);

      // Créer l'élément audio et démarrer immédiatement
      const audioElement = new Audio(audioUrl);
      audioRef.current = audioElement;

      // Démarrer la lecture dès que possible (streaming)
      audioElement.preload = 'auto';
      
      audioElement.onended = () => {
        setIsPlaying(false);
        setPlayingMessageId(null);
        URL.revokeObjectURL(audioUrl);
      };

      audioElement.onerror = () => {
        console.error('Erreur lors de la lecture audio');
        setIsPlaying(false);
        setPlayingMessageId(null);
        URL.revokeObjectURL(audioUrl);
      };

      // Lecture immédiate dès que les premières données arrivent
      await audioElement.play();
    } catch (error) {
      console.error('Erreur:', error);
      setIsPlaying(false);
      setPlayingMessageId(null);
    }
  }, [playingMessageId, stopAudio]);

  return {
    isPlaying,
    playingMessageId,
    playAudio,
    stopAudio,
  };
}