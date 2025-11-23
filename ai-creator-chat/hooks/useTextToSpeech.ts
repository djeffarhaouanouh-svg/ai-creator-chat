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
      // Si on joue déjà le même message, on arrête
      if (playingMessageId === messageId) {
        stopAudio();
        return;
      }

      // Arrêter l'audio en cours si nécessaire
      stopAudio();

      setIsPlaying(true);
      setPlayingMessageId(messageId);

      // Appeler l'API pour générer l'audio
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

      const { audio, contentType } = await response.json();

      // Créer un blob à partir de l'audio base64
      const audioBlob = new Blob(
        [Uint8Array.from(atob(audio), c => c.charCodeAt(0))],
        { type: contentType }
      );
      const audioUrl = URL.createObjectURL(audioBlob);

      // Créer et jouer l'audio
      const audioElement = new Audio(audioUrl);
      audioRef.current = audioElement;

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
