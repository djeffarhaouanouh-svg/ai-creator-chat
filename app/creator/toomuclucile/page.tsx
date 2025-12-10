"use client";

import { useRouter } from "next/navigation";
import { getCreatorByUsername } from "@/data/creators";
import { MessageCircle, Users, Star } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import PaypalButton from "@/components/PaypalButton";

export default function LucilePage() {
  const router = useRouter();
  const creator = getCreatorByUsername("toomuclucile");

  // FAQ
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const faqData = [
    {
      question: "Les messages sont-ils illimités ?",
      answer: "Oui, une fois abonné, tu peux discuter sans limite 24h/24.",
    },
    {
      question: "Est-ce que Lucile est réelle ?",
      answer:
        "Lucile est une intelligence artificielle basée sur la personnalité de la créatrice.",
    },
    {
      question: "Comment se passe l’annulation ?",
      answer: "Tu peux annuler ton abonnement à tout moment en un clic.",
    },
    {
      question: "Que débloque l’abonnement ?",
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

  // 🔥 DONNÉES UNIQUES POUR LUCILE
  const price = 9.97;
  const audio = "/audio/lucile.mp3";
  const photos = ["/lucile-1.png", "/lucile-2.png", "/lucile-3.png"];
  const subscribers = 12500;
  const messagesCount = 8432;
  const rating = 4.8;

  // Vérifie abonnement dans le localStorage (comme Lauryn)
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (localStorage.getItem("subscribed") === "yes") {
        setIsSubscribed(true);
      }
    }
  }, []);

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
    router.push(`/chat/${creator.id}`);
  };

  return (
    <main className="bg-white min-h-screen pb-1">
      {/* HERO IMAGE (même structure que Lauryn) */}
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

        {/* GALERIE EN HAUT (position comme Lauryn) */}
        <div className="px-4 md:px-8 pb-16 mt-10">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
            Contenu exclusif
          </h2>

          <div className="grid grid-cols-3 gap-2 max-w-3xl mx-auto">
            {photos.map((photo, i) => (
              <div
                key={i}
                className="relative rounded-2xl overflow-hidden bg-gray-200 aspect-square"
              >
                <img
                  src={photo}
                  alt={`Photo ${i + 1}`}
                  className="w-full h-full object-cover blur-lg scale-110"
                />

                {/* overlay foncé */}
                <div className="absolute inset-0 bg-black/40"></div>

                {/* cadenas */}
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

                {/* bouton Débloquer sur la 2e photo */}
                {i === 1 && (
                  <div className="absolute inset-0 flex items-end justify-center pb-4">
                    <button className="bg-white/90 text-black px-3 py-1 rounded-full text-xs font-medium shadow-md transition backdrop-blur-sm">
                      Débloquer
                    </button>
                  </div>
                )}
              </div>
            ))}
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

        {/* CTA PAYPAL / CHAT — même logique que Lauryn */}
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
            <div className="w-full">
              <PaypalButton />
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
    </main>
  );
}
