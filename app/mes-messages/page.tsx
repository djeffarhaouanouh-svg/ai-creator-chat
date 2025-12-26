"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { MessageCircle } from "lucide-react";
import { storage } from "@/lib/storage";

interface ConversationSummary {
  creatorSlug: string;
  lastMessage: {
    id: string;
    role: string;
    content: string;
    timestamp: string;
  } | null;
  unreadCount: number;
  totalMessages: number;
}

export default function MesMessagesPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [creators, setCreators] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [conversations, setConversations] = useState<Map<string, ConversationSummary>>(new Map());

  // Charger les derniers messages de toutes les conversations
  const loadConversations = async (userId: string, allCreators: any[]) => {
    console.log('🔄 Loading conversations for', allCreators.length, 'creators');
    const conversationsMap = new Map<string, ConversationSummary>();

    for (const creator of allCreators) {
      const creatorSlug = creator.slug || creator.id;

      try {
        const response = await fetch(`/api/messages?userId=${userId}&creatorId=${creatorSlug}`);

        if (response.ok) {
          const data = await response.json();
          const messages = data.messages || [];

          // Trouver le dernier message
          const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;

          // Compter les messages non lus (depuis localStorage)
          const lastViewedKey = `lastViewed_${creatorSlug}`;
          const lastViewedTimestamp = localStorage.getItem(lastViewedKey);

          let unreadCount = 0;
          if (messages.length > 0) {
            if (lastViewedTimestamp) {
              // Si déjà visité, compter les messages plus récents que lastViewed
              const lastViewed = new Date(lastViewedTimestamp);
              unreadCount = messages.filter((msg: any) => {
                const msgTime = new Date(msg.timestamp);
                return msgTime > lastViewed && msg.role === 'assistant';
              }).length;
            } else {
              // Si jamais visité, compter TOUS les messages assistant
              unreadCount = messages.filter((msg: any) => msg.role === 'assistant').length;
            }
          }

          console.log(`💬 ${creatorSlug}: ${messages.length} messages, ${unreadCount} unread`);

          conversationsMap.set(creatorSlug, {
            creatorSlug,
            lastMessage: lastMsg,
            unreadCount,
            totalMessages: messages.length
          });
        }
      } catch (error) {
        console.error(`Error loading conversation for ${creatorSlug}:`, error);
      }
    }

    console.log('✅ Conversations loaded:', conversationsMap.size);
    setConversations(conversationsMap);
  };

  useEffect(() => {
    // Si compte créatrice => rediriger vers le dashboard créatrice "Mes messages"
    const accountType = localStorage.getItem("accountType");
    if (accountType === "creator") {
      router.replace("/creator/dashboard/messages");
      return;
    }

    // Sinon : parcours abonné classique
    const userId = localStorage.getItem("userId");
    setIsLoggedIn(!!userId);

    if (userId) {
      const subs = storage.getSubscriptions();
      setSubscriptions(subs);

      async function loadCreators() {
        const res = await fetch("/api/creators");
        const data = await res.json();
        setCreators(data || []);

        // Charger les conversations pour chaque créatrice
        if (userId) {
          await loadConversations(userId, data || []);
        }

        setInitialized(true);
      }
      loadCreators();
    } else {
      setInitialized(true);
    }
  }, [router]);

  // Polling pour mettre à jour les conversations toutes les 5 secondes
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId || creators.length === 0) {
      console.log('⏸️ Polling paused:', { userId: !!userId, creatorsCount: creators.length });
      return;
    }

    console.log('🔄 Starting polling for', creators.length, 'creators');

    const interval = setInterval(() => {
      console.log('⏰ Polling tick - refreshing conversations');
      loadConversations(userId, creators);
    }, 5000);

    return () => {
      console.log('🛑 Stopping polling');
      clearInterval(interval);
    };
  }, [creators, loadConversations]);

  // Filtrer les créatrices auxquelles l'utilisateur est abonné
  const subscribedCreators = creators.filter((creator) =>
    subscriptions.includes(creator.slug || creator.id)
  );

  // État de chargement initial (évite les flashs)
  if (!initialized) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#e31fc1] mx-auto"></div>
        </div>
      </main>
    );
  }

  // Si pas connecté, afficher la page d'invitation (abonné)
  if (!isLoggedIn) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-8">
            <MessageCircle className="w-20 h-20 mx-auto text-[#e31fc1]" />
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Mes <span className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-transparent">Messages</span>
          </h1>

          <p className="text-gray-300 mb-8 text-lg">
            Connecte-toi pour accéder à tes conversations avec tes créatrices préférées
          </p>

          <div className="space-y-4">
            <Link
              href="/login"
              className="block w-full py-3 px-6 rounded-lg text-white font-semibold bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] hover:opacity-90 transition-opacity"
            >
              Se connecter
            </Link>

            <Link
              href="/signup"
              className="block w-full py-3 px-6 rounded-lg text-white font-semibold border-2 border-white hover:bg-white hover:text-black transition-all"
            >
              Créer un compte
            </Link>
          </div>

          <p className="mt-8 text-gray-400 text-sm">
            Pas encore abonné ?{" "}
            <Link href="/" className="text-[#e31fc1] hover:underline">
              Découvre nos créatrices
            </Link>
          </p>
        </div>
      </main>
    );
  }

  // Si connecté mais aucun abonnement
  if (subscribedCreators.length === 0) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-8">
            <MessageCircle className="w-20 h-20 mx-auto text-[#e31fc1]" />
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Mes <span className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-transparent">Messages</span>
          </h1>

          <p className="text-gray-300 mb-8 text-lg">
            Tu n'as pas encore d'abonnement actif. Découvre nos créatrices et commence à discuter !
          </p>

          <Link
            href="/"
            className="inline-block py-3 px-8 rounded-lg text-white font-semibold bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] hover:opacity-90 transition-opacity"
          >
            Découvrir les créatrices
          </Link>
        </div>
      </main>
    );
  }

  // Si connecté avec des abonnements
  return (
    <main className="min-h-screen bg-black text-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-center">
          Mes <span className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-transparent">Messages</span>
        </h1>

        <p className="text-gray-400 text-center mb-12">
          Discute avec tes créatrices préférées
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {subscribedCreators.map((creator) => {
            const creatorSlug = creator.slug || creator.id;
            const conversation = conversations.get(creatorSlug);
            const lastMessage = conversation?.lastMessage;
            const unreadCount = conversation?.unreadCount || 0;

            return (
              <Link
                key={creator.id}
                href={`/chat/${creatorSlug}`}
                className="group"
              >
                <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 hover:border-[#e31fc1] transition-all duration-300 hover:shadow-lg hover:shadow-[#e31fc1]/20">
                  {/* Header avec avatar et nom */}
                  <div className="flex items-center gap-4 mb-3">
                    <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-[#e31fc1]">
                      <Image
                        src={creator.avatar || "/default-avatar.png"}
                        alt={creator.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white group-hover:text-[#e31fc1] transition-colors">
                        {creator.name}
                      </h3>
                      <p className="text-sm text-gray-400">@{creator.slug}</p>
                    </div>
                  </div>

                  {/* Bouton Accéder au profil */}
                  <Link
                    href={`/creator/${creator.slug || creator.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="block mb-4"
                  >
                    <button className="w-full px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] hover:opacity-90 transition-opacity">
                      Accéder au profil
                    </button>
                  </Link>

                  {/* Dernier message ou état */}
                  {lastMessage ? (
                    <div className={`rounded-lg p-3 ${unreadCount > 0 ? 'bg-green-900/20 border border-green-500/30' : 'bg-gray-800'}`}>
                      {unreadCount > 0 ? (
                        <p className="text-sm font-semibold text-green-400">
                          {unreadCount} message{unreadCount > 1 ? 's' : ''} non lu{unreadCount > 1 ? 's' : ''}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-300 line-clamp-2">
                          <span className="font-semibold">
                            {lastMessage.role === 'user' ? "Toi: " : `${creator.name}: `}
                          </span>
                          {lastMessage.content}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(lastMessage.timestamp).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-gray-800 rounded-lg p-3">
                      <p className="text-sm text-gray-400">
                        Aucun message. Commence la conversation ! 💬
                      </p>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
