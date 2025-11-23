 'use client';

import { useParams, useRouter } from 'next/navigation';
import { getCreatorByUsername } from '@/data/creators';
import { MessageCircle, Users, Star } from 'lucide-react';
import { storage } from '@/lib/storage';
import { useState, useEffect } from 'react';

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
      <div className="w-full h-[28rem] md:h-[52rem] bg-gradient-to-b from-orange-400 to-orange-600 flex flex-col justify-between text-white relative overflow-hidden">
        
        {/* Photo en fond */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <img
            src="/mon-chat.jpg"
            alt={creator.name}
            className="w-full h-full object-cover object-top"
          />

          {/* Fondu blanc */}
          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-white to-transparent"></div>
        </div>

        {/* Badges en haut */}
        <div className="relative z-10 flex justify-between items-start p-6">
          <div></div>
          <div className="bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
            <span className="text-gray-900 font-bold">5.0 ★ (57)</span>
          </div>
        </div>

        {/* NOM AU CENTRE - OPTION 1A */}
        <div className="relative z-10 mb-10 flex justify-center">
          <h1 className="text-3xl md:text-4xl font-bold text-black drop-shadow-md">
            {creator.name}
          </h1>
        </div>
      </div>

      {/* BAS - INCHANGÉ */}
      <div className="bg-white px-4 md:px-8 py-6">
        
        {/* Stats */}
        <div className="flex justify-center gap-6 md:gap-8 mb-8">
          <div className="text-center">
            <div className="flex items-center gap-2 justify-center mb-1">
              <Users size={20} className="text-gray-400" />
              <span className="text-xl md:text-2xl font-bold text-gray-900">2.5k</span>
            </div>
            <span className="text-gray-500 text-sm">abonnés</span>
          </div>
          <div className="text-center">
            <div className="flex items-center gap-2 justify-center mb-1">
              <MessageCircle size={20} className="text-gray-400" />
              <span className="text-xl md:text-2xl font-bold text-gray-900">15k</span>
            </div>
            <span className="text-gray-500 text-sm">messages</span>
          </div>
          <div className="text-center">
            <div className="flex items-center gap-2 justify-center mb-1">
              <Star size={20} className="text-yellow-400" fill="currentColor" />
              <span className="text-xl md:text-2xl font-bold text-gray-900">4.9</span>
            </div>
            <span className="text-gray-500 text-sm">note</span>
          </div>
        </div>

        {/* Bio Section */}
        <div className="max-w-2xl mx-auto mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">À propos</h2>
          <p className="text-gray-700 leading-relaxed text-center mb-6">
            Coach de vie et experte en bien-être. Je vous aide à atteindre vos objectifs et à trouver l'équilibre parfait dans votre vie.
          </p>
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-2 text-center">Style de conversation</h3>
            <p className="text-gray-600 text-center">
              Bienveillante, motivante et à l'écoute. Je suis là pour vous soutenir dans votre parcours de développement personnel.
            </p>
          </div>
        </div>

        {/* Pricing and CTA */}
        <div className="max-w-md mx-auto">
          <div className="text-center mb-6">
            <div className="flex items-baseline justify-center gap-2 mb-2">
              <span className="text-4xl font-bold text-gray-900">9.99€</span>
              <span className="text-gray-500">/mois</span>
            </div>
            <p className="text-gray-600">Messages illimités • Annulation à tout moment</p>
          </div>
          
          {isSubscribed ? (
             <button 
  onClick={handleChat} 
  className="w-full px-8 py-4 rounded-xl font-semibold text-lg text-white bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] hover:opacity-90 transition duration-200 flex items-center justify-center"
>
  <MessageCircle size={20} className="mr-2" />
  Discutez gratuitement
</button>

          ) : (
            <button 
              onClick={handleSubscribe} 
              className="w-full bg-[#e31fc1] hover:bg-[#c919a3] text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors duration-200"
            >
              S'abonner et commencer à discuter
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
