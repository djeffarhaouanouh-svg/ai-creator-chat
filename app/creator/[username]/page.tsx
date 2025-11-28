'use client';

import { useParams, useRouter } from 'next/navigation';
import { getCreatorByUsername } from "@/data/creators";
import { MessageCircle, Users, Star } from 'lucide-react';
import { storage } from '@/lib/storage';
import { useState, useEffect } from 'react';
import PaypalButton from "@/components/PaypalButton";

export default function CreatorPage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;

  const creator = getCreatorByUsername(username);

  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (creator) {
      setIsSubscribed(storage.isSubscribed(creator.id));
    }
  }, [creator]);

  if (!creator) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Créatrice introuvable</h1>
          <p className="text-gray-600 mb-4">Cette créatrice n'existe pas ou plus.</p>
          <button 
            onClick={() => router.push('/')} 
            className="bg-[#e31fc1] hover:bg-[#c919a3] text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  const handleSubscribe = () => {
    storage.subscribe(creator.id);
    setIsSubscribed(true);
    router.push(`/chat/${creator.id}`);
  };

  const handleChat = () => {
    router.push(`/chat/${creator.id}`);
  };

  return (
    <main className="min-h-screen bg-white">

            {/* HAUT - IMAGE + FONDU + NOM */}
      <div className="w-full h-[28rem] md:h-[52rem] relative overflow-hidden">

        {/* Image dynamique */}
        <div
          className="absolute inset-0 flex z-0"
          style={{
            alignItems:
              creator.imageY === "top"
                ? "flex-start"
                : creator.imageY === "bottom"
                ? "flex-end"
                : "center",
          }}
        >
          <img
            src={creator.coverImage || creator.avatar || "/fallback.jpg"}
            alt={creator.name}
            className="w-full h-full object-cover"
            style={{
              objectPosition: `center ${creator.imageY || "50%"}`,
            }}
          />
        </div>

        {/* Fondu */}
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-white to-transparent z-10" />

        {/* Badge note */}
        <div className="relative z-20 flex justify-between items-start p-6">
          <div></div>
          <div className="bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
            <span className="text-gray-900 font-bold">5.0 ★ (57)</span>
          </div>
        </div>

        {/* Nom EN BAS du visuel */}
        <div className="absolute bottom-6 left-0 w-full z-20 flex justify-center">
          <h1 className="text-3xl md:text-4xl font-bold text-black drop-shadow-md">
            {creator.name}
          </h1>
        </div>
      </div>


      {/* ---------------------- */}
      {/*        INFOS BAS       */}
      {/* ---------------------- */}
      <div className="bg-white px-4 md:px-8 py-6">

        {/* Stats */}
        <div className="flex justify-center gap-6 md:gap-8 mb-8">

          {/* Abonnés */}
          <div className="text-center">
            <div className="flex items-center gap-2 justify-center mb-1">
              <Users size={20} className="text-gray-400" />
              <span className="text-xl md:text-2xl font-bold text-gray-900">
                {creator.subscribers?.toLocaleString()}
              </span>
            </div>
            <span className="text-gray-500 text-sm">abonnés</span>
          </div>

          {/* Messages */}
          <div className="text-center">
            <div className="flex items-center gap-2 justify-center mb-1">
              <MessageCircle size={20} className="text-gray-400" />
              <span className="text-xl md:text-2xl font-bold text-gray-900">
                {creator.messagesCount?.toLocaleString()}
              </span>
            </div>
            <span className="text-gray-500 text-sm">messages</span>
          </div>

          {/* Note */}
          <div className="text-center">
            <div className="flex items-center gap-2 justify-center mb-1">
              <Star size={20} className="text-yellow-400" fill="currentColor" />
              <span className="text-xl md:text-2xl font-bold text-gray-900">
                5.0
              </span>
            </div>
            <span className="text-gray-500 text-sm">note</span>
          </div>

        </div>

        {/* Bio */}
        <div className="max-w-2xl mx-auto mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">À propos</h2>

          <p className="text-gray-700 leading-relaxed text-center mb-6">
            {creator.bio}
          </p>

          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-2 text-center">Style de conversation</h3>
            <p className="text-gray-600 text-center">
              {creator.personality}
            </p>
          </div>
        </div>

        {/* Pricing */}
        <div className="max-w-md mx-auto">
          <div className="text-center mb-6">
            <div className="flex items-baseline justify-center gap-2 mb-2">
              <span className="text-4xl font-bold text-gray-900">{creator.price}€</span>
              <span className="text-gray-500">/mois</span>
            </div>
            <p className="text-gray-600">Messages illimités • Annulation à tout moment</p>
          </div>

          {/* CTA */}
          {isSubscribed ? (
            <button 
              onClick={handleChat}
              className="w-full px-8 py-4 rounded-xl font-semibold text-lg text-white bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] hover:opacity-90 transition flex items-center justify-center"
            >
              <MessageCircle size={20} className="mr-2" />
              Discutez gratuitement
            </button>
          ) : (
            <button 
              onClick={handleSubscribe}
              className="w-full bg-[#e31fc1] hover:bg-[#c919a3] text-white px-8 py-4 rounded-xl font-semibold text-lg transition"
            >
              Commencer à discuter
            </button>
          )}

          {/* PayPal */}
          <div className="mt-4">
            <PaypalButton />
          </div>
        </div>

      </div>
    </main>
  );
}
