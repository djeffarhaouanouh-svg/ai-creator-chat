"use client";

import { useParams, useRouter } from "next/navigation";
import { getCreatorByUsername } from "@/data/creators";
import { MessageCircle, Users, Star } from "lucide-react";
import { storage } from "@/lib/storage";
import { useState, useEffect, useRef } from "react";
import PaypalButton from "@/components/PaypalButton";

export default function CreatorPage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;

  const creator = getCreatorByUsername(username);

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (creator) {
      setIsSubscribed(storage.isSubscribed(creator.id));
    }
  }, [creator]);

  useEffect(() => {
    audioRef.current = new Audio("/audio/sarah-voice.mp3");
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Créatrice introuvable
          </h1>
          <p className="text-gray-600 mb-4">
            Cette créatrice n&apos;existe pas ou plus.
          </p>
          <button
            onClick={() => router.push("/")}
            className="bg-[#e31fc1] hover:bg-[#c919a3] text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            Retour à l&apos;accueil
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
      {/* HAUT */}
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

        {/* Fondu bas */}
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-white to-transparent z-10" />

        {/* Nom */}
        <div className="absolute bottom-6 left-0 w-full z-20 flex justify-center">
          <h1 className="text-3xl md:text-4xl font-bold text-black drop-shadow-md">
            {creator.name}
          </h1>
        </div>
      </div>

      {/* BAS */}
      <div className="px-4 md:px-8 py-10">
        {/* Stats */}
        <div className="flex justify-center gap-6 md:gap-10 mb-10">
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

        {/* Bio + style de conversation */}
        <div className="max-w-2xl mx-auto mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">
            À propos
          </h2>

          <p className="text-gray-700 leading-relaxed text-center mb-6">
            {creator.bio}
          </p>

          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-2 text-center">
              Style de conversation
            </h3>
            <p className="text-gray-600 text-center">{creator.personality}</p>
          </div>
        </div>

        {/* AUDIO – on le laisse comme il est, sous le bloc style */}
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
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 20 20"
                  fill="#4a4a4a"
                >
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

        {/* Prix */}
        <div className="text-center mb-6">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
            9.99€
            <span className="text-lg font-medium text-gray-600"> /mois</span>
          </h2>
          <p className="text-gray-500 mt-2">
            Messages illimités • Annulation à tout moment
          </p>
        </div>

        {/* CTA + PayPal centrés comme avant */}
        <div className="max-w-md mx-auto w-full">
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

          <div className="mt-4">
            <PaypalButton />
          </div>
        </div>
      </div>
    </main>
  );
}
