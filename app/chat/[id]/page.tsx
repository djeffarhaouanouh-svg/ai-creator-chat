'use client';

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { localCreators } from '@/data/creators';
import { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft, MoreVertical, Volume2, VolumeX, ImageIcon } from 'lucide-react';
import { storage } from '@/lib/storage';
import { Message } from '@/lib/types';
import Button from '@/components/ui/Button';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import PaypalContentButton from '@/components/PaypalContentButton';
import ChatProgressBarBottom from '@/components/ChatProgressBarBottom';
import VoiceCallButton from '@/components/VoiceCallButton';


async function saveMessageToDB(
  message: Message,
  creatorSlug: string
) {
  try {
    // Récupérer l'userId depuis localStorage
    const userId = localStorage.getItem('userId');

    console.log('🔍 saveMessageToDB called:', {
      userId: userId ? '✓ exists' : '✗ missing',
      creatorSlug,
      role: message.role,
      contentLength: message.content.length
    });

    // Si pas d'userId, on ne sauvegarde pas (utilisateur non connecté)
    if (!userId) {
      console.warn('⚠️ User not logged in, skipping DB save');
      return;
    }

    // ⛔ BLOQUER la sauvegarde de messages assistant si l'IA est désactivée
    if (message.role === 'assistant') {
      try {
        const response = await fetch(`/api/creator/conversation-settings?slug=${creatorSlug}&userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          const aiEnabled = data.ai_enabled !== false;
          console.log('🔍 saveMessageToDB: Vérification IA pour message assistant', { 
            ai_enabled: data.ai_enabled, 
            aiEnabled,
            willBlock: !aiEnabled 
          });
          
          if (!aiEnabled) {
            console.log('🚫 BLOQUAGE sauvegarde message assistant - IA désactivée (vérification côté client)');
            return; // Ne pas sauvegarder le message assistant
          }
        }
      } catch (error) {
        console.error('❌ Erreur vérification IA dans saveMessageToDB:', error);
        // En cas d'erreur, on laisse passer (le serveur bloquera si nécessaire)
      }
    }

    const payload = {
      userId,
      creatorId: creatorSlug,
      role: message.role,
      content: message.content,
      image_url: message.image_url,
      image_type: message.image_type
    };

    console.log('💾 Sending to API /api/messages:', {
      ...payload,
      content: payload.content.substring(0, 50) + '...'
    });

    const response = await fetch('/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ API Error Response:', {
        status: response.status,
        error: errorData
      });
      
      // Si c'est un 403 (IA désactivée), c'est normal, on ne fait rien
      if (response.status === 403) {
        console.log('🚫 Sauvegarde bloquée par le serveur - IA désactivée');
        return;
      }
      return;
    }

    const result = await response.json();
    console.log('✅ Message saved successfully:', result.message?.id);

  } catch (err) {
    console.error('❌ Exception in saveMessageToDB:', err);
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
  const [aiEnabled, setAiEnabled] = useState(true); // Par défaut activé
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { playingMessageId, playAudio, stopAudio } = useTextToSpeech();

  // États pour l'upload d'images
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isModeOpen, setIsModeOpen] = useState(false);
  const [mode, setMode] =
    useState<'friend' | 'girlfriend' | 'seductive'>('friend');

  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [requestInput, setRequestInput] = useState('');
  const [contentRequest, setContentRequest] = useState<{
    id: string;
    status: 'pending' | 'price_proposed' | 'paid' | 'delivered' | 'cancelled';
    price?: number | null;
    paypal_authorization_id?: string | null;
  } | null>(null);

  // États pour la barre de progression gamifiée
  const [userMessageCount, setUserMessageCount] = useState(0);
  const [rewardUnlocked, setRewardUnlocked] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [creatorAvatarUrl, setCreatorAvatarUrl] = useState<string | null>(null);
  const [isInVoiceCall, setIsInVoiceCall] = useState(false);

  if (!creator) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p>Créatrice introuvable</p>
      </div>
    );
  }

  // Fonction pour charger l'état de l'IA
  const loadAISetting = async (): Promise<boolean> => {
    if (!creator) {
      console.log('⚠️ loadAISetting: creator manquant');
      return true;
    }

    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        console.log('⚠️ loadAISetting: userId manquant, par défaut activé');
        return true; // Par défaut activé si pas de userId
      }

      const creatorSlug = creator.slug || creator.id;
      console.log('🔍 loadAISetting: Vérification état IA', { userId, creatorSlug });

      const response = await fetch(`/api/creator/conversation-settings?slug=${creatorSlug}&userId=${userId}`, {
        cache: 'no-store' // Force la requête à ne jamais utiliser le cache
      });

      if (response.ok) {
        const data = await response.json();
        const enabled = data.ai_enabled !== false; // Par défaut true
        console.log('✅ loadAISetting: État IA récupéré', {
          ai_enabled: data.ai_enabled,
          enabled,
          userId,
          creatorSlug
        });
        setAiEnabled(enabled);
        return enabled;
      }
      console.warn('⚠️ loadAISetting: Réponse non OK', response.status);
      return true; // Par défaut activé
    } catch (error) {
      console.error('❌ Erreur chargement setting IA:', error);
      return true; // Par défaut activé
    }
  };

  /* ---------------------------- Charger avatar créatrice --------------------------- */
  useEffect(() => {
    async function loadCreatorAvatar() {
      try {
        const response = await fetch(`/api/creators/${creatorId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.avatar_url || data.avatar) {
            setCreatorAvatarUrl(data.avatar_url || data.avatar);
          }
        }
      } catch (error) {
        console.error('Erreur chargement avatar créatrice:', error);
      }
    }
    loadCreatorAvatar();
  }, [creatorId]);

  /* ---------------------------- Charger avatar utilisateur --------------------------- */
  useEffect(() => {
    async function loadUserAvatar() {
      const userId = localStorage.getItem('userId');
      if (!userId) return;

      try {
        const response = await fetch(`/api/user/stats?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.user?.avatar_url) {
            setUserAvatar(data.user.avatar_url);
          }
        }
      } catch (error) {
        console.error('Error loading user avatar:', error);
      }
    }

    loadUserAvatar();
  }, []);

  /* ---------------------------- Chargement session --------------------------- */
  useEffect(() => {
    if (!creator) return;

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

    // Charger les messages depuis la base de données
    async function loadMessages() {
      if (!creator) return;

      try {
        const userId = localStorage.getItem('userId');

        // Charger l'état de l'IA
        const aiIsEnabled = await loadAISetting();

        if (!userId) {
          // Pas connecté, fallback sur localStorage
          const session = storage.getChatSession(creator.slug || creator.id);
          if (session && session.messages?.length > 0) {
            setMessages(session.messages);
          } else if (aiIsEnabled) {
            showWelcomeMessage(aiIsEnabled);
          }
          return;
        }

        // Récupérer les messages depuis la DB
        const response = await fetch(`/api/messages?userId=${userId}&creatorId=${creator.slug || creator.id}`);

        if (response.ok) {
          const data = await response.json();

          if (data.messages && data.messages.length > 0) {
            // Convertir les timestamps en Date objects
            const dbMessages = data.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }));
            setMessages(dbMessages);
          } else if (aiIsEnabled) {
            showWelcomeMessage(aiIsEnabled);
          }
        } else {
          // Erreur API, fallback sur localStorage
          const session = storage.getChatSession(creator.slug || creator.id);
          if (session && session.messages?.length > 0) {
            setMessages(session.messages);
          } else if (aiIsEnabled) {
            showWelcomeMessage(aiIsEnabled);
          }
        }
      } catch (error) {
        console.error('Error loading messages:', error);
        // Fallback sur localStorage en cas d'erreur
        const session = storage.getChatSession(creator.slug || creator.id);
        if (session && session.messages?.length > 0) {
          setMessages(session.messages);
        } else if (aiEnabled) {
          showWelcomeMessage(aiEnabled);
        }
      }
    }

    function showWelcomeMessage(isEnabled: boolean) {
      if (!creator || !isEnabled) {
        console.log('🚫 Message de bienvenue bloqué - IA désactivée');
        return;
      }

      const welcomeMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Salut ! C'est ${creator.name} 😊 Ravie de discuter avec toi ! Tu veux commencer par quoi ?`,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
      storage.addMessage(creator.slug || creator.id, welcomeMessage);

      // Sauvegarder aussi en DB (la route API bloquera si l'IA est désactivée)
      saveMessageToDB(welcomeMessage, creator.slug || creator.id);
    }

    loadMessages();

    // Marquer cette conversation comme vue (pour les notifications non lues)
    if (creator) {
      const creatorSlug = creator.slug || creator.id;
      localStorage.setItem(`lastViewed_${creatorSlug}`, new Date().toISOString());
    }
  }, [creator, router]);

  // Polling automatique pour les nouveaux messages (toutes les 3 secondes)
  useEffect(() => {
    if (!creator || !isSubscribed) return;

    const userId = localStorage.getItem('userId');
    if (!userId) return; // Pas de polling si pas connecté

    const pollNewMessages = async () => {
      try {
        const response = await fetch(`/api/messages?userId=${userId}&creatorId=${creator.slug || creator.id}`);

        if (response.ok) {
          const data = await response.json();

          if (data.messages && data.messages.length > 0) {
            const dbMessages = data.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }));

            // Vérifier s'il y a de nouveaux messages
            setMessages(prevMessages => {
              const lastMessageId = prevMessages[prevMessages.length - 1]?.id;
              const lastDbMessageId = dbMessages[dbMessages.length - 1]?.id;

              // Si le dernier message de la DB est différent, mettre à jour
              if (lastMessageId !== lastDbMessageId || dbMessages.length !== prevMessages.length) {
                console.log('📨 Nouveaux messages détectés, mise à jour...');
                return dbMessages;
              }

              return prevMessages;
            });
          }
        }
      } catch (error) {
        console.error('❌ Error polling messages:', error);
      }
    };

    // Polling toutes les 3 secondes
    const intervalId = setInterval(pollNewMessages, 3000);

    // Cleanup
    return () => clearInterval(intervalId);
  }, [creator, isSubscribed]);

  // Charger la dernière demande de contenu (si elle existe déjà)
  useEffect(() => {
    async function loadContentRequest() {
      if (!creator) return;

      const userId = localStorage.getItem('userId');
      if (!userId) return;

      try {
        const res = await fetch(
          `/api/content-request/current?userId=${userId}&creatorSlug=${creator.slug || creator.id}`
        );
        if (!res.ok) return;

        const data = await res.json();
        if (data?.success && data.request) {
          // Convertir le prix en nombre si c'est une chaîne ou Decimal
          const price = data.request.price 
            ? (typeof data.request.price === 'number' 
                ? data.request.price 
                : parseFloat(String(data.request.price)))
            : null;
          
          setContentRequest({
            id: data.request.id,
            status: data.request.status,
            price: price && !isNaN(price) ? price : null,
            paypal_authorization_id: data.request.paypal_authorization_id,
          });
        }
      } catch (error) {
        console.error('Error loading content request:', error);
      }
    }

    loadContentRequest();
  }, [creator]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Marquer les messages comme lus quand on voit les messages
  useEffect(() => {
    if (!creator || messages.length === 0) return;

    const lastReadKey = `lastRead_${creator.slug || creator.id}`;
    localStorage.setItem(lastReadKey, new Date().toISOString());
  }, [messages, creator]);

  // Recharger l'état de l'IA quand la fenêtre reprend le focus
  useEffect(() => {
    if (!creator) return;

    const handleFocus = () => {
      loadAISetting();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [creator]);

  // Charger la progression depuis le localStorage au montage
  useEffect(() => {
    if (!creator) return;

    const userId = localStorage.getItem('userId');
    if (!userId) return;

    const progressKey = `chat_progress_${userId}_${creator.slug || creator.id}`;
    const savedProgress = localStorage.getItem(progressKey);

    if (savedProgress) {
      try {
        const { count, unlocked } = JSON.parse(savedProgress);
        setUserMessageCount(count || 0);
        setRewardUnlocked(unlocked || false);
      } catch (error) {
        console.error('Error loading progress:', error);
      }
    }
  }, [creator]);

  // Compter les messages utilisateur existants et mettre à jour le compteur
  useEffect(() => {
    if (!creator || messages.length === 0) return;

    const userMessagesCount = messages.filter(msg => msg.role === 'user').length;

    // Toujours synchroniser avec le nombre réel de messages
    setUserMessageCount(userMessagesCount);

    // Vérifier si on a atteint 100 messages
    if (userMessagesCount >= 100 && !rewardUnlocked) {
      setRewardUnlocked(true);
    }
  }, [messages, creator]);

  // Sauvegarder la progression dans le localStorage à chaque changement
  useEffect(() => {
    if (!creator) return;

    const userId = localStorage.getItem('userId');
    if (!userId) return;

    const progressKey = `chat_progress_${userId}_${creator.slug || creator.id}`;
    const progressData = {
      count: userMessageCount,
      unlocked: rewardUnlocked
    };

    localStorage.setItem(progressKey, JSON.stringify(progressData));
  }, [userMessageCount, rewardUnlocked, creator]);

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
    if ((!input.trim() && !uploadedImageUrl) || !creator || isLoading || isUploading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim() || 'Regarde cette image',
      timestamp: new Date(),
      image_url: uploadedImageUrl || undefined,
      image_type: uploadedImageUrl ? 'user_upload' : undefined
    };

    // Reset image state
    setUploadedImageUrl(null);
    setPreviewUrl(null);

    setMessages((prev) => [...prev, userMessage]);
    storage.addMessage(creator.slug || creator.id, userMessage);
    saveMessageToDB(userMessage, creator.slug || creator.id);

    // Incrémenter le compteur de messages utilisateur pour la barre de progression
    setUserMessageCount(prev => {
      const newCount = prev + 1;
      // Débloquer la récompense à 100 messages
      if (newCount >= 100 && !rewardUnlocked) {
        setRewardUnlocked(true);
      }
      return newCount;
    });

    setInput('');
    setIsLoading(true);

    console.log('🔍 Creator info:', {
      slug: creator.slug,
      id: creator.id,
      name: creator.name,
      sending: creator.slug || creator.id
    });

    try {
      // Récupérer le userId pour vérifier si l'IA est activée
      const userId = localStorage.getItem('userId')
      
      if (!userId) {
        console.warn('⚠️ userId manquant dans localStorage')
      }

      // ⛔ Recharger l'état de l'IA AVANT chaque envoi pour être sûr
      const currentAiEnabled = await loadAISetting();
      console.log('🔍 État IA avant envoi:', { currentAiEnabled, aiEnabled });
      
      // ⛔ Vérifier si l'IA est activée AVANT d'envoyer la requête
      if (!currentAiEnabled) {
        console.log('🚫 IA désactivée - requête bloquée côté client', { currentAiEnabled, userId, creatorId: creator.slug || creator.id });
        setIsLoading(false)
        return // Pas de réponse automatique, on attend la réponse manuelle
      }
      
      console.log('✅ IA activée, envoi de la requête autorisé');
      
      console.log('📤 Envoi requête chat:', { 
        creatorId: creator.slug || creator.id, 
        userId: userId ? 'présent' : 'manquant',
        mode,
        aiEnabled: currentAiEnabled 
      })
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: creator.slug || creator.id,
          userId: userId,
          mode: mode,
          messages: [...messages, userMessage]
            .filter((m) => m.content) // Filtrer les messages sans content
            .map((m) => ({
              role: m.role,
              content: m.content,
              image_url: m.image_url, // ✅ INCLURE image_url pour GPT-4o vision
            })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.log('❌ Réponse API non OK:', { status: response.status, errorData });
        
        // Si l'IA est désactivée, ne pas afficher de message - la créatrice répondra manuellement
        if (response.status === 403) {
          console.log('🚫 Réponse 403 - IA désactivée, blocage côté serveur');
          setIsLoading(false)
          return // Pas de réponse automatique, on attend la réponse manuelle
        }
        
        // Autre erreur
        throw new Error(errorData.error || 'Erreur lors de l\'envoi')
      }

      const data = await response.json();
      console.log('✅ Réponse API reçue:', { messageLength: data.message?.length });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        image_url: data.imageUrl,
        image_type: data.imageUrl ? 'ai_generated' : undefined
      };

      setMessages((prev) => [...prev, assistantMessage]);
      storage.addMessage(creator.slug || creator.id, assistantMessage);
      saveMessageToDB(assistantMessage, creator.slug || creator.id);
    } catch (error: any) {
      // Ne pas créer de message d'erreur si l'IA est désactivée
      // (le 403 est déjà géré plus haut)
      if (error.message?.includes('403') || error.message?.includes('désactivée')) {
        console.log('🚫 Message d\'erreur bloqué - IA désactivée');
        return;
      }
      
      // Seulement créer un message d'erreur pour les autres erreurs
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

  /* ------------ Envoi demande de contenu personnalisé (réelle) ------------- */
  const sendRequest = async () => {
    if (!requestInput.trim() || !creator) return;

    const userId = localStorage.getItem('userId');
    if (!userId) {
      alert("Tu dois être connecté pour envoyer une demande personnalisée.");
      return;
    }

    try {
      const res = await fetch('/api/content-request/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          creatorSlug: creator.slug || creator.id,
          message: requestInput.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error || 'Erreur lors de la demande');
      }

      // Convertir le prix en nombre
      const price = data.request.price 
        ? (typeof data.request.price === 'number' 
            ? data.request.price 
            : parseFloat(String(data.request.price)))
        : null;

      setContentRequest({
        id: data.request.id,
        status: 'pending',
        price: price && !isNaN(price) ? price : null,
        paypal_authorization_id: data.request.paypal_authorization_id,
      });

      // La demande est déjà envoyée dans le chat via l'API
      // Pas besoin de message système supplémentaire

      setRequestInput('');
      setIsRequestOpen(false);
      
      // Recharger les messages pour voir la demande
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Error sending content request:', error);
      const errMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content:
          "Oups, impossible d'envoyer la demande pour le moment. Réessaie dans un instant 😅",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
      storage.addMessage(creator.slug || creator.id, errMsg);
      saveMessageToDB(errMsg, creator.slug || creator.id);
    }
  };

  /* ------------------ Gestion du paiement PayPal ---------------- */
  const handlePaymentSuccess = async (orderId: string) => {
    if (!contentRequest) return;
    
    // Recharger la demande pour avoir le nouveau statut
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    try {
      const res = await fetch(
        `/api/content-request/current?userId=${userId}&creatorSlug=${creator.slug || creator.id}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data?.success && data.request) {
          // Convertir le prix en nombre
          const price = data.request.price 
            ? (typeof data.request.price === 'number' 
                ? data.request.price 
                : parseFloat(String(data.request.price)))
            : null;
          
          setContentRequest({
            id: data.request.id,
            status: data.request.status,
            price: price && !isNaN(price) ? price : null,
            paypal_authorization_id: data.request.paypal_authorization_id,
          });
        }
      }
      
      // Recharger les messages pour voir le message de paiement
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Error reloading after payment:', error);
    }
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    // Le message d'erreur sera géré par le composant PayPal
  };

  /* ------------------ Annulation de la demande ---------------- */
  const handleCancelRequest = async () => {
    if (!contentRequest) return;

    if (!confirm('Es-tu sûr de vouloir annuler cette demande ?')) {
      return;
    }

    try {
      const res = await fetch('/api/content-request/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: contentRequest.id }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error || 'Erreur lors de l\'annulation');
      }

      setContentRequest(null);
      
      // Recharger les messages pour voir le message d'annulation
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Error cancelling request:', error);
      alert('Erreur lors de l\'annulation de la demande');
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                                 RENDER PAGE                                */
  /* -------------------------------------------------------------------------- */

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* HEADER */}
      <div className="bg-white border-b px-3 py-1.5 shadow-sm">
        {/* Ligne 1 : Profil + 3 points */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/')}
              className="p-1.5"
            >
              <ArrowLeft size={18} />
            </Button>

            <div
              className="relative w-9 h-9 rounded-full overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80 transition"
              onClick={() => router.push(`/creator/${creator.slug || creator.username}`)}
            >
              <Image
                src={creatorAvatarUrl || creator.avatar}
                alt={creator.name}
                fill
                className="object-cover"
              />
            </div>

            <div className="flex flex-col">
              <h2 className="font-semibold text-gray-900 text-sm leading-tight">{creator.name}</h2>
              <p className="text-[10px] text-green-600 leading-tight">En ligne</p>
              <p className="text-[10px] text-gray-500 leading-tight">
                Mode : <span className="font-medium">{getModeLabel()}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsModeOpen((v) => !v)}
                className="p-1.5"
              >
                <MoreVertical size={18} />
              </Button>

            {isModeOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white shadow-lg rounded-xl border p-2 z-50">
                <p className="px-4 pb-2 text-xs text-gray-500 uppercase">
                  Mode de discussion
                </p>

                <button
                  className="w-full text-left px-4 py-2 text-sm text-black hover:bg-gray-100"
                  onClick={() => {
                    setMode('girlfriend');
                    setIsModeOpen(false);
                  }}
                >
                  💕 Petite copine
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm text-black hover:bg-gray-100"
                  onClick={() => {
                    setMode('friend');
                    setIsModeOpen(false);
                  }}
                >
                  💛 Amie
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm text-black hover:bg-gray-100"
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
        </div>

        {/* Ligne 2 : Barre de progression */}
        <ChatProgressBarBottom
          currentCount={userMessageCount}
          maxCount={100}
          rewardUnlocked={rewardUnlocked}
        />
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <div className="max-w-3xl mx-auto space-y-2">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div className="flex gap-2 max-w-[70%]">
                {message.role === 'assistant' && (
                  <div
                    className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80 transition"
                    onClick={() => router.push(`/creator/${creator.slug || creator.username}`)}
                  >
                    <Image
                      src={creatorAvatarUrl || creator.avatar}
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
                    {/* AFFICHAGE IMAGE/VIDÉO SI PRÉSENTE */}
                    {message.image_url && (
                      <div className="mb-2">
                        {message.image_type?.startsWith('video/') ? (
                          <video
                            src={message.image_url.startsWith('http')
                              ? message.image_url
                              : `${window.location.origin}${message.image_url}`}
                            controls
                            preload="metadata"
                            playsInline
                            className="max-w-full rounded-lg shadow-md"
                            style={{ maxHeight: '400px', maxWidth: '100%' }}
                            onError={(e) => {
                              console.error('Erreur chargement vidéo:', message.image_url);
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <img
                            src={message.image_url.startsWith('http')
                              ? message.image_url
                              : `${window.location.origin}${message.image_url}`}
                            alt={message.image_type === 'user_upload' ? 'Image envoyée' : 'Image générée'}
                            className="max-w-full rounded-lg shadow-md"
                            style={{ maxHeight: '400px', maxWidth: '100%' }}
                            onError={(e) => {
                              console.error('Erreur chargement image:', message.image_url);
                              e.currentTarget.style.display = 'none';
                            }}
                            loading="lazy"
                          />
                        )}
                      </div>
                    )}

                    {/* TEXTE AVEC AFFICHAGE IMAGES MARKDOWN */}
                    <div className="text-sm whitespace-pre-wrap break-words">
                      {(() => {
                        const content = message.content;
                        // Détecter les images markdown ![alt](url)
                        const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
                        const parts = [];
                        let lastIndex = 0;
                        let match;

                        while ((match = imageRegex.exec(content)) !== null) {
                          // Ajouter le texte avant l'image
                          if (match.index > lastIndex) {
                            parts.push(
                              <span key={`text-${lastIndex}`}>
                                {content.substring(lastIndex, match.index)}
                              </span>
                            );
                          }

                          // Normaliser l'URL (relative ou absolue)
                          let imageUrl = match[2];
                          if (imageUrl.startsWith('/uploads/')) {
                            // URL relative, la rendre absolue
                            imageUrl = `${window.location.origin}${imageUrl}`;
                          }

                          // Ajouter l'image avec gestion d'erreur
                          parts.push(
                            <div key={`img-${match.index}`} className="my-2">
                              <img
                                src={imageUrl}
                                alt={match[1] || 'Contenu personnalisé'}
                                className="max-w-full rounded-lg shadow-md"
                                style={{ maxHeight: '500px', maxWidth: '100%' }}
                                onError={(e) => {
                                  console.error('Erreur chargement image:', imageUrl);
                                  e.currentTarget.style.display = 'none';
                                }}
                                loading="lazy"
                              />
                            </div>
                          );

                          lastIndex = match.index + match[0].length;
                        }

                        // Ajouter le texte restant
                        if (lastIndex < content.length) {
                          parts.push(
                            <span key={`text-${lastIndex}`}>
                              {content.substring(lastIndex)}
                            </span>
                          );
                        }

                        // Si pas d'images, afficher normalement
                        if (parts.length === 0) {
                          return content;
                        }

                        return parts;
                      })()}
                    </div>

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

                {message.role === 'user' && userAvatar && (
                  <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border-2 border-[#E31FC1]">
                    <Image
                      src={userAvatar}
                      alt="Votre avatar"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-2 max-w-[70%]">
                <div
                  className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80 transition"
                  onClick={() => router.push(`/creator/${creator.slug || creator.username}`)}
                >
                  <Image
                    src={creatorAvatarUrl || creator.avatar}
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

      {/* Bouton Demande un média privé - Flottant au-dessus des messages */}
      {!isRequestOpen && (!contentRequest || contentRequest.status === 'delivered' || contentRequest.status === 'cancelled') && (
        <div className="fixed bottom-20 left-0 right-0 flex justify-center z-50 px-3 pointer-events-none">
          <button
            onClick={() => setIsRequestOpen(true)}
            className="max-w-xs px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] hover:from-[#d11fb1] hover:via-[#ff5b8d] hover:to-[#ffb0bb] transition-all flex items-center justify-center gap-2 shadow-lg pointer-events-auto"
          >
            📸 Demande un média privé
          </button>
        </div>
      )}

      {/* INPUT */}
      <div className="bg-transparent px-3 py-1">
        <div className="max-w-3xl mx-auto flex flex-col gap-2 items-center">
          {/* Infos sur la demande de contenu personnalisée */}
          {contentRequest && contentRequest.status !== 'cancelled' && contentRequest.status !== 'delivered' && (
            <div className="w-full max-w-xs text-xs text-gray-600 bg-gray-100 border border-gray-200 rounded-xl px-3 py-2">
              {contentRequest.status === 'pending' && (
                <p>
                  Ta demande personnalisée est <span className="font-semibold">en attente</span> de validation
                  par la créatrice.
                </p>
              )}
              {contentRequest.status === 'price_proposed' && (
                <div className="flex items-center justify-between">
                  <p>
                    La créatrice a accepté ta demande –{" "}
                    <span className="font-semibold">
                      Prix : {(() => {
                        const price = typeof contentRequest.price === 'number' 
                          ? contentRequest.price 
                          : parseFloat(String(contentRequest.price || '0'));
                        return isNaN(price) ? '0.00' : price.toFixed(2);
                      })()} €
                    </span>
                  </p>
                  <button
                    onClick={handleCancelRequest}
                    className="ml-2 text-red-600 hover:text-red-700 text-xs underline"
                  >
                    Annuler
                  </button>
                </div>
              )}
              {contentRequest.status === 'paid' && (
                <p>
                  💳 Paiement sécurisé effectué. La créatrice va t'envoyer le contenu.
                </p>
              )}
            </div>
          )}

          {/* Demande contenu privé - Textarea pour la demande */}
          {isRequestOpen && (
            <div className="w-full max-w-xs flex flex-col gap-2">
              <textarea
                value={requestInput}
                onChange={(e) => setRequestInput(e.target.value)}
                placeholder="Ici, demande du contenu personnalisé..."
                className="w-full rounded-2xl border px-4 py-3 text-gray-900 resize-none"
                rows={2}
              />
              <div className="flex gap-2">
                <Button 
                  onClick={sendRequest} 
                  disabled={!requestInput.trim()}
                  className="flex-1"
                >
                  Envoyer
                </Button>
                <Button 
                  onClick={() => {
                    setIsRequestOpen(false);
                    setRequestInput('');
                  }}
                  variant="ghost"
                >
                  Annuler
                </Button>
              </div>
            </div>
          )}

          {/* Bouton PayPal quand un prix est proposé */}
          {!isRequestOpen && contentRequest?.status === 'price_proposed' && contentRequest.price && (
            <div className="w-full max-w-2xl">
              <div className="mb-2 text-xs text-gray-500 text-center">
                Cliquez sur le bouton PayPal ci-dessous pour payer
              </div>
              <PaypalContentButton
                requestId={contentRequest.id}
                price={typeof contentRequest.price === 'number' ? contentRequest.price : parseFloat(String(contentRequest.price))}
                onPaymentSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </div>
          )}

          {/* Textarea principale pour les messages normaux */}
          {!isRequestOpen && (
            <div className="w-full max-w-xs">
              {/* Preview image si sélectionnée */}
              {previewUrl && (
                <div className="mb-3 relative inline-block">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className={`w-24 h-24 object-cover rounded-lg border-2 ${isUploading ? 'border-yellow-500 opacity-50' : 'border-[#E31FC1]'}`}
                  />
                  {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                      <div className="text-white text-xs">Upload...</div>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setUploadedImageUrl(null);
                      setPreviewUrl(null);
                    }}
                    disabled={isUploading}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold hover:bg-red-600 disabled:opacity-50"
                  >
                    ×
                  </button>
                </div>
              )}

              <div className="flex gap-2 items-center w-full justify-center">
                {/* Input file caché */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    // Afficher preview immédiatement
                    setPreviewUrl(URL.createObjectURL(file));
                    setIsUploading(true);

                    // Upload automatique
                    const formData = new FormData();
                    formData.append('file', file);

                    try {
                      const uploadResponse = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData
                      });

                      if (uploadResponse.ok) {
                        const uploadData = await uploadResponse.json();
                        setUploadedImageUrl(uploadData.relativeUrl);
                        console.log('✅ Image uploadée:', uploadData.relativeUrl);
                      } else {
                        console.error('❌ Upload échoué');
                        setPreviewUrl(null); // Retirer preview si échec
                      }
                    } catch (error) {
                      console.error('❌ Erreur upload:', error);
                      setPreviewUrl(null);
                    } finally {
                      setIsUploading(false);
                      // Reset input pour permettre re-sélection du même fichier
                      e.target.value = '';
                    }
                  }}
                  className="hidden"
                />

                <VoiceCallButton onCallStateChange={setIsInVoiceCall} />

                {/* Bouton upload image */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading || isUploading || isInVoiceCall}
                  className="shrink-0 p-1.5"
                  title={isInVoiceCall ? "Appel vocal actif" : "Ajouter une image"}
                >
                  <ImageIcon size={18} />
                </Button>

                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder={isInVoiceCall ? "Appel vocal actif..." : `Message à ${creator.name}...`}
                  className="resize-none rounded-2xl border px-3 py-2 text-sm text-gray-900 flex-1 bg-white focus:outline-none"
                  rows={1}
                  disabled={isLoading || isUploading || isInVoiceCall}
                />

                <Button
                  onClick={sendMessage}
                  disabled={(!input.trim() && !uploadedImageUrl) || isLoading || isUploading || isInVoiceCall}
                  className="px-3 py-1.5 shrink-0"
                  title={isInVoiceCall ? "Appel vocal actif" : "Envoyer"}
                >
                  <Send size={18} />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Texte de progression en bas */}
        {!rewardUnlocked && (
          <div className="mt-1.5 flex items-center justify-center gap-1">
            <span className="text-xs">🎁</span>
            <span className="text-[10px] font-medium text-gray-600">
              Encore {100 - userMessageCount} messages pour débloquer un média privé
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
