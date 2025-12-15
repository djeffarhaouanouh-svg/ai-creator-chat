"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { MessageCircle } from "lucide-react";
import { storage } from "@/lib/storage";

export default function MesMessagesPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [creators, setCreators] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<string[]>([]);

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    const userId = localStorage.getItem("userId");
    setIsLoggedIn(!!userId);

    if (userId) {
      // Récupérer les abonnements
      const subs = storage.getSubscriptions();
      setSubscriptions(subs);

      // Charger les créatrices
      async function loadCreators() {
        const res = await fetch("/api/creators");
        const data = await res.json();
        setCreators(data || []);
      }
      loadCreators();
    }
  }, []);

  // Filtrer les créatrices auxquelles l'utilisateur est abonné
  const subscribedCreators = creators.filter((creator) =>
    subscriptions.includes(creator.slug || creator.id)
  );

  // Si pas connecté, afficher la page d'invitation
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
            const chatSession = storage.getChatSession(creator.slug || creator.id);
            const lastMessage = chatSession?.messages[chatSession.messages.length - 1];

            return (
              <Link
                key={creator.id}
                href={`/chat/${creator.slug || creator.id}`}
                className="group"
              >
                <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 hover:border-[#e31fc1] transition-all duration-300 hover:shadow-lg hover:shadow-[#e31fc1]/20">
                  {/* Header avec avatar et nom */}
                  <div className="flex items-center gap-4 mb-4">
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

                    <MessageCircle className="w-6 h-6 text-[#e31fc1]" />
                  </div>

                  {/* Dernier message ou état */}
                  {lastMessage ? (
                    <div className="bg-gray-800 rounded-lg p-3">
                      <p className="text-sm text-gray-300 line-clamp-2">
                        {lastMessage.role === 'user' ? "Toi: " : `${creator.name}: `}
                        {lastMessage.content}
                      </p>
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

                  {/* Badge si nouveaux messages */}
                  {chatSession && chatSession.messageCount > 0 && (
                    <div className="mt-3 flex justify-end">
                      <span className="text-xs bg-[#e31fc1] text-white px-3 py-1 rounded-full">
                        {chatSession.messageCount} message{chatSession.messageCount > 1 ? "s" : ""}
                      </span>
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
