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

  useEffect(() => {
    if (!creator) return;
    
    // Vérifier l'abonnement
    const subscribed = storage.isSubscribed(creator.id);
    setIsSubscribed(subscribed);
    
    if (!subscribed) {
      router.push(`/creator/${creator.username}`);
      return;
    }

    // Charger l'historique des messages
    const session = storage.getChatSession(creator.id);
    if (session) {
      setMessages(session.messages);
    } else {
      // Premier message de bienvenue
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Salut ! C'est ${creator.name} 😊 Ravie de discuter avec toi ! Comment ça va ?`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
      storage.addMessage(creator.id, welcomeMessage);
    }
  }, [creator, router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!input.trim() || !creator || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
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
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          }))
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi du message');
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      storage.addMessage(creator.id, assistantMessage);
    } catch (error) {
      console.error('Erreur:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Désolée, j\'ai un petit problème technique 😅 Peux-tu réessayer ?',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!creator) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Créatrice introuvable</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm">
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
          <div>
            <h2 className="font-semibold text-gray-900">{creator.name}</h2>
            <p className="text-xs text-green-600">En ligne</p>
          </div>
        </div>
        <Button variant="ghost" size="sm">
          <MoreVertical size={20} />
        </Button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
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
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-primary-100' : 'text-gray-400'}`}>
                      {message.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {message.role === 'assistant' && (
                    <button
                      onClick={() => playAudio(message.content, message.id, creator.id)}
                      disabled={isPlaying && playingMessageId !== message.id}
                      className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-all ${
                        playingMessageId === message.id
                          ? 'bg-primary-100 text-primary-600'
                          : 'text-gray-500 hover:bg-gray-100'
                      } disabled:opacity-50`}
                      title={playingMessageId === message.id ? 'Arrêter' : 'Écouter'}
                    >
                      {playingMessageId === message.id ? (
                        <>
                          <VolumeX size={14} />
                          <span>En lecture...</span>
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
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t px-4 py-4">
        <div className="max-w-3xl mx-auto flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Message à ${creator.name}...`}
            className="flex-1 resize-none rounded-2xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
