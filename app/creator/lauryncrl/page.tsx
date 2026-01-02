"use client";

import { useRouter } from "next/navigation";
import { getCreatorBySlug } from "@/data/creators-merged";
import { MessageCircle, Users, Star } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import PaypalButton from "@/components/PaypalButton";
import { storage } from "@/lib/storage";
import StoryViewer from "@/components/StoryViewer";

interface GalleryPhoto {
  id?: string;
  url: string;
  isLocked: boolean;
  order: number;
}

export default function LaurynPage() {
  const router = useRouter();
 const [creator, setCreator] = useState<any>(null);

useEffect(() => {
  async function load() {
    const res = await fetch("/api/creators/lauryncrl");
const data = await res.json();
    setCreator(data);
  }
  load();
}, []);

  // FAQ
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const faqData = [
    {
      question: "Est-ce que les messages sont vraiment illimités ?",
      answer: "Oui, une fois abonné, tu peux discuter sans limite, 24h/24.",
    },
    {
      question: "Est-ce que Lauryn est une vraie personne ?",
      answer: "Lauryn est une IA basée sur la personnalité de la créatrice.",
    },
    {
      question: "Puis-je annuler mon abonnement ?",
      answer: "Oui, tu peux annuler à tout moment en un clic.",
    },
    {
      question: "Que débloque l'abonnement ?",
      answer:
        "Messages illimités, vocaux personnalisés, mémoire, contenu exclusif.",
    },
  ];
  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? null : i);
  };

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Stories
  const [stories, setStories] = useState<any[]>([]);
  const [selectedStory, setSelectedStory] = useState<any>(null);
  const [storyIndex, setStoryIndex] = useState(0);

  // 🔥 DONNÉES UNIQUES POUR LAURYN
  const price = 5.97;
  const audio = "/audio/alice.mp3";
  const photosStatic = [
    "/laurin.png",
    "/laurin-4.png",
    "/laurin-2.png",
    "/laurin-5.png",
    "/laurin-3.png",
    "/laurin-6.png",
  ];
  // Utiliser les photos de galerie de la DB ou les photos statiques comme fallback
  const photos: GalleryPhoto[] = creator?.galleryPhotos && creator.galleryPhotos.length > 0
    ? creator.galleryPhotos
    : photosStatic.map((url, i) => ({ url, isLocked: i !== 0 && i !== 2, order: i }));
  const rating = 4.9;

  // Vérifie abonnement dans le localStorage
  useEffect(() => {
    if (creator && typeof window !== "undefined") {
      // Vérifier si l'utilisateur est la créatrice elle-même
      const creatorSlug = localStorage.getItem('creatorSlug');
      const isOwnProfile = creatorSlug === (creator.slug || creator.id);

      // Vérifier l'abonnement
      const isSubbed = storage.isSubscribed(creator.slug || creator.id);

      console.log('🔍 Debug subscription:', {
        creatorSlug,
        creatorId: creator.slug || creator.id,
        isOwnProfile,
        isSubbed,
        subscriptions: localStorage.getItem('subscriptions')
      });

      // Accorder l'accès si c'est la créatrice ou si l'utilisateur est abonné
      const hasAccess = isOwnProfile || isSubbed;
      setIsSubscribed(hasAccess);

      // Charger les stories
      loadStories(creator.slug || creator.id, hasAccess);
    }
  }, [creator]);

  const loadStories = async (creatorId: string, hasAccess: boolean) => {
    try {
      const response = await fetch(`/api/stories/list?creatorId=${creatorId}`);
      const data = await response.json();
      if (data.success) {
        setStories(data.stories);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des stories:', error);
    }
  };

  // Préparer l'audio
  useEffect(() => {
    audioRef.current = new Audio(audio);
  }, []);

  const toggleAudio = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsPlaying(true);
      audioRef.current.onended = () => setIsPlaying(false);
    }
  };

  if (!creator) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Créatrice introuvable</h1>
          <p className="mb-4">Cette créatrice n&apos;existe pas ou plus.</p>
          <button
            onClick={() => router.push("/")}
            className="bg-[#e31fc1] text-white px-6 py-2 rounded-lg"
          >
            Retour à l&apos;accueil
          </button>
        </div>
      </div>
    );
  }

  const handleChat = () => {
    router.push(`/chat/${creator.slug || creator.id}`);
  };

  return (
    <main className="bg-white min-h-screen pb-1">
      {/* HERO IMAGE (même structure que Lucile) */}
      <div className="w-full h-[28rem] md:h-[52rem] relative">
        <div className="absolute inset-0 flex z-0 items-center">
          <img
            src={creator.coverImage || creator.avatar || "/fallback.jpg"}
            alt={creator.name}
            className="w-full h-full object-cover"
            style={{ objectPosition: "center 30%" }}
          />
        </div>

        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-white to-transparent z-10" />

        <div className="absolute bottom-6 left-0 w-full z-20 flex justify-center">
          <h1 className="text-3xl md:text-4xl font-bold text-black drop-shadow-md">
            {creator.name}
          </h1>
        </div>
      </div>

      {/* CONTENU BAS */}
      <div className="px-4 md:px-8 py-10">
        {/* STATS */}
        <div className="flex justify-center gap-6 md:gap-10 mb-10">
          <div className="text-center">
            <div className="flex items-center gap-2 justify-center mb-1">
              <Users size={20} className="text-gray-400" />
              <span className="text-xl md:text-2xl font-bold text-gray-900">
                {creator.totalSubscribers?.toLocaleString() || 0}
              </span>
            </div>
            <span className="text-gray-500 text-sm">abonnés</span>
          </div>

          <div className="text-center">
            <div className="flex items-center gap-2 justify-center mb-1">
              <MessageCircle size={20} className="text-gray-400" />
              <span className="text-xl md:text-2xl font-bold text-gray-900">
                {creator.totalMessages?.toLocaleString() || 0}
              </span>
            </div>
            <span className="text-gray-500 text-sm">messages</span>
          </div>

          <div className="text-center">
            <div className="flex items-center gap-2 justify-center mb-1">
              <Star size={20} className="text-yellow-400" fill="currentColor" />
              <span className="text-xl md:text-2xl font-bold text-gray-900">
                {rating}
              </span>
            </div>
            <span className="text-gray-500 text-sm">note</span>
          </div>
        </div>

        {/* STORIES */}
        {stories.length > 0 && (
          <div className="px-4 md:px-8 pb-6 mt-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Stories</h2>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {stories.map((story, index) => {
                const canView = !story.is_locked || isSubscribed;
                return (
                  <div
                    key={story.id}
                    onClick={() => {
                      if (canView) {
                        setSelectedStory(story);
                        setStoryIndex(index);
                        // Enregistrer la vue
                        if (typeof window !== 'undefined') {
                          const userId = localStorage.getItem('userId');
                          if (userId) {
                            fetch('/api/stories/view', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ storyId: story.id, userId })
                            }).catch(console.error);
                          }
                        }
                      }
                    }}
                    className={`flex-shrink-0 ${canView ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                  >
                    <div className="relative">
                      <div className={`w-20 h-20 rounded-full overflow-hidden border-4 ${
                        canView ? 'border-gradient-to-r from-purple-500 to-pink-500' : 'border-gray-300'
                      } p-0.5 bg-gradient-to-r from-purple-500 to-pink-500`}>
                        <div className="w-full h-full rounded-full overflow-hidden bg-white">
                          {story.media_type === 'video' ? (
                            <video
                              src={story.media_url}
                              className={`w-full h-full object-cover ${!canView ? 'blur-sm' : ''}`}
                              muted
                            />
                          ) : (
                            <img
                              src={story.media_url}
                              alt="Story"
                              className={`w-full h-full object-cover ${!canView ? 'blur-sm' : ''}`}
                            />
                          )}
                        </div>
                      </div>
                      {!canView && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center">
                            🔒
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 text-center mt-1 max-w-[80px] truncate">
                      {story.title || 'Story'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* GALERIE EN HAUT (position comme Lucile) */}
        <div className="px-4 md:px-8 pb-16 mt-10">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
            Contenu exclusif
          </h2>

          <div className="grid grid-cols-3 gap-2 max-w-3xl mx-auto">
            {photos.map((photo: GalleryPhoto, i: number) => {
              const photoUrl = photo.url;
              const photoIsLocked = photo.isLocked;
              const isUnlocked = isSubscribed || !photoIsLocked;

              return (
                <div
                  key={photo.id || i}
                  className={`relative rounded-2xl overflow-hidden bg-gray-200 aspect-square ${
                    isUnlocked ? 'cursor-pointer hover:opacity-90 transition' : ''
                  }`}
                  onClick={() => isUnlocked && setSelectedPhoto(photoUrl)}
                >
                  <img
                    src={photoUrl}
                    alt={`Photo ${i + 1}`}
                    className={`w-full h-full object-cover ${isUnlocked ? '' : 'blur-lg scale-110'}`}
                  />

                  {!isUnlocked && (
                    <>
                      {/* overlay foncé */}
                      <div className="absolute inset-0 bg-black/40"></div>

                      {/* cadenas */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-xl">
                          🔒
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* STYLE DE CONVERSATION / BIO */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 max-w-2xl mx-auto mb-10">
          <h3 className="font-semibold text-gray-900 mb-4 text-center">
            Qui est {creator.name} ?
          </h3>
          <p className="text-gray-700 leading-relaxed text-center mb-6">
            {creator.bio}
          </p>

          <h3 className="font-semibold text-gray-900 mb-2 text-center">
            Comment elle parle avec toi 💕
          </h3>
          <p className="text-gray-700 text-center">{creator.personality}</p>
        </div>

        {/* AUDIO */}
        <div className="w-full flex justify-center mt-2 mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleAudio}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-[#e9edef] border border-gray-300"
            >
              {isPlaying ? (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="#4a4a4a">
                  <rect x="3" y="3" width="5" height="14" rx="2" />
                  <rect x="12" y="3" width="5" height="14" rx="2" />
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 20 20" fill="#4a4a4a">
                  <polygon points="3,2 17,10 3,18" />
                </svg>
              )}
            </button>

            <div className={`bespona-wave ${isPlaying ? "playing" : ""}`}>
              {Array.from({ length: 10 }).map((_, i) => (
                <span key={i}></span>
              ))}
            </div>
          </div>
        </div>

         {/* PRIX */}
<div className="text-center mb-6">
  <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
    {price.toFixed(2)}€
    <span className="text-lg font-medium text-gray-600"> /mois</span>
  </h2>
  <p className="text-gray-500 mt-2">
    Messages illimités • Annulation à tout moment
  </p>
</div>

{/* AVANTAGES */}
<div className="flex flex-col items-center gap-2 mb-8">
  <div className="flex items-center justify-center gap-2">
    <span className="text-transparent bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-2xl">
      ✓
    </span>
    <p className="text-gray-600 text-lg text-center">
      Réponses rapides 24h/24
    </p>
  </div>

  <div className="flex items-center justify-center gap-2">
    <span className="text-transparent bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-2xl">
      ✓
    </span>
    <p className="text-gray-600 text-lg text-center">
      Vocaux personnalisés
    </p>
  </div>
</div>

        {/* CTA PAYPAL / CHAT */}
        <div className="max-w-md mx-auto w-full mt-6">
          {isSubscribed ? (
            <button
              onClick={handleChat}
              className="w-full px-8 py-4 rounded-xl font-semibold text-lg text-white bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] hover:opacity-90 transition flex items-center justify-center"
            >
              <MessageCircle size={20} className="mr-2" />
              Discutez gratuitement
            </button>
          ) : (
            <div className="text-center">
              <p className="text-gray-600 mb-3">
                Abonnez-vous pour accéder au chat et aux photos exclusives
              </p>
              <PaypalButton
                creatorId={creator.slug || creator.id}
                price={price}
              />
            </div>
          )}
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto mt-12 mb-20 px-4">
        <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
          FAQ — Questions fréquentes
        </h2>

        <div className="space-y-3">
          {faqData.map((item, i) => (
            <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => toggle(i)}
                className="w-full px-4 py-3 flex justify-between items-center text-left"
              >
                <span className="font-medium text-gray-900">
                  {item.question}
                </span>
                <span className="text-gray-600 text-xl">
                  {openIndex === i ? "−" : "+"}
                </span>
              </button>

              <div
                className={`px-4 pb-3 text-gray-600 text-sm transition-all duration-300 ${
                  openIndex === i ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
                } overflow-hidden`}
              >
                {item.answer}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* LIGHTBOX MODALE POUR AGRANDIR LES PHOTOS */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative w-full max-w-sm sm:max-w-md md:max-w-lg">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-10 right-0 text-white text-3xl font-bold hover:text-gray-300 transition"
            >
              ✕
            </button>
            <img
              src={selectedPhoto}
              alt="Photo agrandie"
              className="w-full h-auto rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* STORY VIEWER */}
      {selectedStory && (
        <StoryViewer
          stories={stories}
          initialIndex={storyIndex}
          onClose={() => setSelectedStory(null)}
        />
      )}
    </main>
  );
}
