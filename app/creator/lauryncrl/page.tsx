"use client";

import { useRouter } from "next/navigation";
import { getCreatorBySlug } from "@/data/creators-merged";
import { MessageCircle, Users, Star } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import PaypalButton from "@/components/PaypalButton";

export default function Page({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const [creator, setCreator] = useState<any>(null);

  // CHARGEMENT DYNAMIQUE
  useEffect(() => {
    async function load() {
      const data = await getCreatorBySlug(params.slug);
      setCreator(data);
    }
    load();
  }, [params.slug]);

  // ⚠️ CHARGEMENT
  if (!creator) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Chargement...</p>
      </div>
    );
  }

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

  // Vérifie abonnement dans le localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (localStorage.getItem("subscribed") === "yes") {
        setIsSubscribed(true);
      }
    }
  }, []);

  // Données Lauryn
  const price = 6.97;
  const audio = "/audio/alice.mp3";
  const photos = [
    "/laurin.png",
    "/laurin-4.png",
    "/laurin-2.png",
    "/laurin-5.png",
    "/laurin-3.png",
    "/laurin-6.png",
  ];
  const subscribers = 4200;
  const messagesCount = 28000;
  const rating = 4.9;

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

  const handleChat = () => {
    router.push(`/chat/${creator.id}`);
  };

  return (
    <main className="bg-white min-h-screen pb-1">
      {/* HERO IMAGE */}
      <div className="w-full h-[28rem] md:h-[52rem] relative">
        <div className="absolute inset-0 flex z-0 items-center">
          <img
            src={creator.coverImage || creator.avatar || "/fallback.jpg"}
            alt={creator.name}
            className="w-full h-full object-cover"
            style={{ objectPosition: "center 13%" }}
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
                {subscribers.toLocaleString()}
              </span>
            </div>
            <span className="text-gray-500 text-sm">abonnés</span>
          </div>

          <div className="text-center">
            <div className="flex items-center gap-2 justify-center mb-1">
              <MessageCircle size={20} className="text-gray-400" />
              <span className="text-xl md:text-2xl font-bold text-gray-900">
                {messagesCount.toLocaleString()}
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

        {/* GALERIE 2x3 */}
        <div className="px-4 md:px-8 pb-16 mt-10">
          <div className="grid grid-cols-3 gap-2 max-w-3xl mx-auto">
            {photos.map((photo, i) => {
              // 🟩 1ère et 3ème visibles (index 0 et 2)
              const isUnlocked = i === 0 || i === 2;

              return (
                <div
                  key={i}
                  onClick={() => {
                    if (isUnlocked) {
                      setSelectedPhoto(photo);
                    }
                  }}
                  className={`relative rounded-2xl overflow-hidden bg-gray-200 aspect-square ${
                    isUnlocked ? "cursor-pointer" : "cursor-default"
                  }`}
                >
                  <img
                    src={photo}
                    alt={`Photo ${i + 1}`}
                    className={`w-full h-full object-cover ${
                      isUnlocked ? "" : "blur-lg scale-110"
                    }`}
                  />

                  {/* Overlay + cadenas uniquement si verrouillé */}
                  {!isUnlocked && (
                    <>
                      <div className="absolute inset-0 bg-black/40" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-xl">
                          <svg
                            width="28"
                            height="28"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="black"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <rect x="3" y="11" width="18" height="11" rx="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

<div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 max-w-2xl mx-auto mb-10">

  {/* LIGNE 1 */}
  <p className="text-gray-900 font-semibold text-center text-lg mb-1">
    T’en as marre de parler à des agences de chatting❗️
  </p>

  {/* LIGNE 2 */}
  <p className="text-gray-700 text-center text-base mb-3">
    et d’attendre des heures pour une réponse ?
  </p>

  {/* LIGNE 3 */}
  <p className="text-gray-600 text-center leading-relaxed mb-6 text-[15px]">
  Découvre l’IA inspirée de ta créatrice : sa façon d’écrire,<br />
  ses souvenirs et sa voix, dispo 24h/24.
</p>

  {/* TITRE ORIGINAL */}
  <h3 className="font-semibold text-gray-900 mb-4 text-center text-lg">
    Comment Lauryn parle avec toi 💕
  </h3>

  <ul className="space-y-2 text-gray-700 text-[15px]">
    <li>• Elle te répond comme une vraie copine</li>
    <li>• Elle se souvient de ce que tu lui racontes</li>
    <li>• Elle t’envoie des vocaux personnalisés</li>
    <li>• Elle peut être douce, taquine ou coquine selon tes envies</li>
  </ul>
</div>

          <div className="bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 max-w-2xl mx-auto mt-8 mb-10">
  <div className="flex items-center justify-center gap-5">

    {/* BOUTON PLAY */}
    <button
      onClick={toggleAudio}
      className="w-10 h-10 flex items-center justify-center rounded-full bg-[#e9edef] border border-gray-300"
    >
      {isPlaying ? (
        <svg width="18" height="18" viewBox="0 0 20 20" fill="#4a4a4a">
          <rect x="3" y="3" width="5" height="14" rx="2" />
          <rect x="12" y="3" width="5" height="14" rx="2" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="#4a4a4a">
          <polygon points="3,2 17,10 3,18" />
        </svg>
      )}
    </button>

    {/* WAVEFORM */}
    <div className="flex items-center">
      <div className={`bespona-wave ${isPlaying ? "playing" : ""}`}>
        {Array.from({ length: 18 }).map((_, i) => (
          <span key={i}></span>
        ))}
      </div>
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

        <div className="flex flex-col items-center gap-2 mt-4">

  <div className="flex items-center gap-2">
    <span className="text-transparent bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-2xl">
      ✓
    </span>
    <p className="text-gray-600 text-lg">Réponses rapides 24h/24</p>
  </div>

  <div className="flex items-center gap-2">
    <span className="text-transparent bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-2xl">
      ✓
    </span>
    <p className="text-gray-600 text-lg">Vocaux personnalisés</p>
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
          )  : (
  <button
    onClick={() =>
      window.location.href =
        "https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=P-0MJ608195A3341825NE57WBY"
    }
    className="w-full px-8 py-4 rounded-xl font-semibold text-lg text-white
    bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb]
    hover:opacity-90 transition"
  >
    S’abonner pour discuter
  </button>
)
}
        </div>
      </div>

      {/* ZOOM IMAGE (uniquement sur les photos débloquées) */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999]"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="max-w-3xl w-[90vw] md:w-auto max-h-[90vh]">
            <img
              src={selectedPhoto}
              alt="Photo agrandie"
              className="w-full h-auto max-h-[90vh] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}

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
                <span className="font-medium text-gray-900">{item.question}</span>
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
    </main>
  );
}
