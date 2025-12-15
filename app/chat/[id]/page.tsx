'use client';

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { localCreators } from '@/data/creators';
import { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft, MoreVertical, Volume2, VolumeX } from 'lucide-react';
import { storage } from '@/lib/storage';
import { Message } from '@/lib/types';
import Button from '@/components/ui/Button';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';

/* -------------------------------------------------------------------------- */
/*   🔗 Fonction : rendre cliquable UNIQUEMENT les liens MYM / ONLYFANS       */
/*   + afficher un texte court : "Accéder à mon espace officiel 🔥"           */
/* -------------------------------------------------------------------------- */
function linkifyMYMOF(text: string) {
  if (!text) return '';

  const regex = /(https?:\/\/[^\s]+)/g;

  return text.split(regex).map((part, i) => {
    const isOFOrMYM =
      part.includes('mym.fans') || part.includes('onlyfans.com');

    if (isOFOrMYM) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#e31fc1] underline break-words hover:opacity-80"
        >
          Accéder à mon espace officiel 🔥
        </a>
      );
    }

    return part;
  });
}

async function saveMessageToDB(
  message: Message,
  creatorSlug: string
) {
  try {
    // Récupérer l'userId depuis localStorage
    const userId = localStorage.getItem('userId');

    // Si pas d'userId, on ne sauvegarde pas (utilisateur non connecté)
    if (!userId) {
      console.log('User not logged in, skipping DB save');
      return;
    }

    await fetch('/api/messages/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        creatorSlug, // On envoie le slug, l'API fera la conversion
        role: message.role,
        content: message.content,
      }),
    });
  } catch (err) {
    console.error('DB Save Error:', err);
  }
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const creatorId = params.id as string;
  const creator = localCreators.find(c => c.slug === creatorId);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { playingMessageId, playAudio, stopAudio } = useTextToSpeech();

  const [isModeOpen, setIsModeOpen] = useState(false);
  const [mode, setMode] =
    useState<'friend' | 'girlfriend' | 'seductive'>('friend');

  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [requestInput, setRequestInput] = useState('');

  if (!creator) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p>Créatrice introuvable</p>
      </div>
    );
  }

  /* ---------------------------- Chargement session --------------------------- */
  useEffect(() => {
    // Vérifier si l'utilisateur est la créatrice elle-même
    const creatorSlug = localStorage.getItem('creatorSlug');
    const isOwnProfile = creatorSlug === (creator.slug || creator.id);

    // Vérifier l'abonnement dans le localStorage
    const subscribed = storage.isSubscribed(creator.slug || creator.id);
    const hasAccess = isOwnProfile || subscribed;
    setIsSubscribed(hasAccess);

    // Bloquer l'accès au chat si non abonné ET pas la créatrice
    if (!hasAccess) {
      router.push(`/creator/${creator.slug || creator.username}`);
      return;
    }

    const session = storage.getChatSession(creator.slug || creator.id);

    if (session && session.messages?.length > 0) {
      setMessages(session.messages);
    } else {
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Salut ! C'est ${creator.name} 😊 Ravie de discuter avec toi ! Tu veux commencer par quoi ?`,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
      storage.addMessage(creator.slug || creator.id, welcomeMessage);
    }
  }, [creator, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getModeLabel = () => {
    switch (mode) {
      case 'girlfriend':
        return 'Petite copine 💕';
      case 'seductive':
        return 'Séduisante 😏';
      default:
        return 'Amie 💛';
    }
  };

  /* ------------------------------- Envoi message ----------------------------- */
  const sendMessage = async () => {
    if (!input.trim() || !creator || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    storage.addMessage(creator.slug || creator.id, userMessage);
    saveMessageToDB(userMessage, creator.slug || creator.id);

    setInput('');
    setIsLoading(true);

    console.log('🔍 Creator info:', {
      slug: creator.slug,
      id: creator.id,
      name: creator.name,
      sending: creator.slug || creator.id
    });

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: creator.slug || creator.id,
          mode: mode,
          messages: [...messages, userMessage]
            .filter((m) => m.content) // Filtrer les messages sans content
            .map((m) => ({
              role: m.role,
              content: m.content,
            })),
        }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      storage.addMessage(creator.slug || creator.id, assistantMessage);
      saveMessageToDB(assistantMessage, creator.slug || creator.id);
    } catch {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Oups, petit souci 😅 Réessaie dans un instant !",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    }

    setIsLoading(false);
  };

  /* ------------ Envoi FAKE pour demande de contenu personnalisé ------------- */
  const sendRequest = () => {
    if (!requestInput.trim()) return;

    const link = creator.mymLink || creator.onlyfansLink || null;

    let replyText = '';

    if (link) {
      replyText = `
Je peux pas encore envoyer du contenu privé directement ici 😔
Mais tu peux l'obtenir sur mon espace officiel 🔥

👉 [ICI mon MYM](${link})
      `;
    } else {
      replyText = `
Impossible d'envoyer du contenu ici 😔  
La créatrice doit ajouter son lien MYM / OF dans l'administration.
      `;
    }

    const assistantMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: replyText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMessage]);
    storage.addMessage(creator.slug || creator.id, assistantMessage);

    setRequestInput('');
    setIsRequestOpen(false);
  };

  /* -------------------------------------------------------------------------- */
  /*                                 RENDER PAGE                                */
  /* -------------------------------------------------------------------------- */

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* HEADER */}
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

          <div className="flex flex-col">
            <h2 className="font-semibold text-gray-900">{creator.name}</h2>
            <p className="text-xs text-green-600">En ligne</p>
            <p className="text-[11px] text-gray-500">
              Mode : <span className="font-medium">{getModeLabel()}</span>
            </p>
          </div>
        </div>

        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsModeOpen((v) => !v)}
          >
            <MoreVertical size={20} />
          </Button>

          {isModeOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white shadow-lg rounded-xl border p-2 z-50">
              <p className="px-4 pb-2 text-xs text-gray-500 uppercase">
                Mode de discussion
              </p>

              <button
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                onClick={() => {
                  setMode('girlfriend');
                  setIsModeOpen(false);
                }}
              >
                💕 Petite copine
              </button>
              <button
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                onClick={() => {
                  setMode('friend');
                  setIsModeOpen(false);
                }}
              >
                💛 Amie
              </button>
              <button
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                onClick={() => {
                  setMode('seductive');
                  setIsModeOpen(false);
                }}
              >
                😏 Séduisante
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MESSAGES */}
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
                  <div className="relative w-8 h-8 rounded-full overflow-hidden">
                    <Image
                      src={creator.avatar}
                      alt={creator.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                <div className="flex flex-col">
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-[#E31FC1] text-white'
                        : 'bg-white text-gray-900 shadow-sm'
                    }`}
                  >
                    {/* TEXTE AVEC LIEN MYM/OF UNIQUEMENT */}
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {linkifyMYMOF(message.content)}
                    </p>

                    <p
                      className={`text-xs mt-1 ${
                        message.role === 'user'
                          ? 'text-[#FFE4F7]'
                          : 'text-gray-400'
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  {/* BOUTON AUDIO */}
                  {message.role === 'assistant' && (
                    <button
                      onClick={() =>
                        playingMessageId === message.id
                          ? stopAudio()
                          : playAudio(
                              message.content,
                              message.id,
                              creator.id
                            )
                      }
                      className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg ${
                        playingMessageId === message.id
                          ? 'bg-[#FFE4F7] text-[#E31FC1]'
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
                <div className="relative w-8 h-8 rounded-full overflow-hidden">
                  <Image
                    src={creator.avatar}
                    alt={creator.name}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="bg-white rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-300"></div>
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
        <div className="max-w-3xl mx-auto flex flex-col gap-3 items-center">
          {/* Demande contenu privé */}
          {isRequestOpen && (
            <div className="flex gap-2">
              <input
                type="text"
                value={requestInput}
                onChange={(e) => setRequestInput(e.target.value)}
                placeholder="Ici, demande du contenu personnalisé..."
                className="flex-1 rounded-2xl border px-4 py-3 text-gray-900"
              />
              <Button onClick={sendRequest} disabled={!requestInput.trim()}>
                <Send size={20} />
              </Button>
            </div>
          )}

          <div className="flex gap-2 items-center w-full max-w-2xl justify-center">
            <button
              onClick={() => setIsRequestOpen((prev) => !prev)}
              className="w-11 h-11 rounded-full bg-gray-200 flex justify-center items-center text-2xl shrink-0"
            >
              +
            </button>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder={`Message à ${creator.name}...`}
              className="resize-none rounded-2xl border px-4 py-3 text-gray-900 flex-1"
              rows={1}
              disabled={isLoading}
            />

            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="px-6 shrink-0"
            >
              <Send size={20} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
