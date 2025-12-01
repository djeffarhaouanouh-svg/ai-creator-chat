'use client';

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { getCreatorById } from '@/data/creators';
import { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft, MoreVertical, Volume2, VolumeX } from 'lucide-react';
import { storage } from '@/lib/storage';
import { Message } from '@/lib/types';
import Button from '@/components/ui/Button';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const creatorId = params.id as string;
  const creator = getCreatorById(creatorId);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isPlaying, playingMessageId, playAudio, stopAudio } = useTextToSpeech();

  const [isModeOpen, setIsModeOpen] = useState(false);
  const [mode, setMode] = useState<'friend' | 'girlfriend' | 'seductive'>('friend'); // mode par défaut = amie

  // Si créateur introuvable
  if (!creator) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p>Créatrice introuvable</p>
      </div>
    );
  }

  // Charger l'historique + message de bienvenue
  useEffect(() => {
    if (!creator) return;

    const subscribed = storage.isSubscribed(creator.id);
    setIsSubscribed(subscribed);

    if (!subscribed) {
      router.push(`/creator/${creator.username}`);
      return;
    }

    const session = storage.getChatSession(creator.id);

    if (session && session.messages && session.messages.length > 0) {
      setMessages(session.messages);
    } else {
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Salut ! C'est ${creator.name} 😊 Ravie de discuter avec toi ! Tu veux commencer par quoi ?`,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
      storage.addMessage(creator.id, welcomeMessage);
    }
  }, [creator, router]);

  // Scroll automatiquement en bas
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getModeLabel = () => {
    switch (mode) {
      case 'girlfriend':
        return 'Petite copine 💕';
      case 'seductive':
        return 'Séduisante 😏';
      case 'friend':
      default:
        return 'Amie 💛';
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !creator || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    storage.addMessage(creator.id, userMessage);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          creatorId: creator.id,
          mode: mode, // IMPORTANT : mode actuel
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'envoi du message");
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      storage.addMessage(creator.id, assistantMessage);
    } catch (error) {
      console.error('Erreur:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          "Oups, j'ai un petit souci technique 😅 Tu peux réessayer dans un instant ?",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* HEADER */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm relative">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/')}
            className="mr-2"
          >
            <ArrowLeft size={20} />
          </Button>

          <div className="relative w-10 h-10 rounded-full overflow-hidden">
            <Image
              src={creator.avatar}
              alt={creator.name}
              fill
              className="object-cover"
            />
          </div>

          <div className="flex flex-col">
            <h2 className="font-semibold text-gray-900">{creator.name}</h2>
            <p className="text-xs text-green-600">En ligne</p>
            <p className="text-[11px] text-gray-500">
              Mode de discussion : <span className="font-medium">{getModeLabel()}</span>
            </p>
          </div>
        </div>

        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsModeOpen((v) => !v)}
            className="flex items-center gap-1"
          >
            <MoreVertical size={20} />
          </Button>

          {/* MENU MODE DE DISCUSSION */}
          {isModeOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white shadow-lg rounded-xl border border-gray-200 py-2 z-50">
              <p className="px-4 pb-2 text-xs text-gray-500 uppercase tracking-wide">
                Mode de discussion
              </p>

              <button
                onClick={() => {
                  setMode('girlfriend');
                  setIsModeOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-100"
              >
                💕 Petite copine
              </button>

              <button
                onClick={() => {
                  setMode('friend');
                  setIsModeOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-100"
              >
                💛 Amie
              </button>

              <button
                onClick={() => {
                  setMode('seductive');
                  setIsModeOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-100"
              >
                😏 Séduisante
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ZONE MESSAGES */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div className="flex gap-2 max-w-[70%]">
                {message.role === 'assistant' && (
                  <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                    <Image
                      src={creator.avatar}
                      alt={creator.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-gray-900 shadow-sm'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </p>
                    <p
                      className={`text-xs mt-1 ${
                        message.role === 'user'
                          ? 'text-primary-100'
                          : 'text-gray-400'
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  {/* Bouton audio pour les messages IA */}
                  {message.role === 'assistant' && (
                    <button
                      onClick={() =>
                        playingMessageId === message.id
                          ? stopAudio()
                          : playAudio(message.content, message.id, creator.id)
                      }
                      className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-all ${
                        playingMessageId === message.id
                          ? 'bg-primary-100 text-primary-600'
                          : 'text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      {playingMessageId === message.id ? (
                        <>
                          <VolumeX size={14} />
                          <span>Arrêter</span>
                        </>
                      ) : (
                        <>
                          <Volume2 size={14} />
                          <span>🔉 Écouter</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-2 max-w-[70%]">
                <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                  <Image
                    src={creator.avatar}
                    alt={creator.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="bg-white rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* INPUT */}
      <div className="bg-white border-t px-4 py-4">
        <div className="max-w-3xl mx-auto flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Message à ${creator.name}...`}
            className="flex-1 resize-none rounded-2xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
            rows={1}
            disabled={isLoading}
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="px-6"
          >
            <Send size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
}
