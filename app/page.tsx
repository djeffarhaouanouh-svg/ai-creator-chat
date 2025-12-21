"use client";

import Link from "next/link";
import Image from "next/image";
import { Users, MessageCircle } from "lucide-react";
import ContenusPersonnalises from "@/components/ContenusPersonnalises";
import PrivateContentSection from "@/components/PrivateContentSection";
import CreatorsSection from "@/components/CreatorsSection";
import ComparisonSection from "@/components/ComparisonSection";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

// 🔥 FIX : On ne peut PAS appeler getCreators() directement côté client.
// Donc on crée une route API serveur : /api/creators

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-gray-800 rounded-2xl bg-gradient-to-b from-gray-900 to-black overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center px-4 py-4 md:px-6 md:py-5 text-left"
      >
        <span className="text-base md:text-lg font-semibold pr-4">
          {question}
        </span>
        <span
          className={`text-xl md:text-2xl transition-transform duration-300 ${
            open ? "rotate-45 text-[#e31fc1]" : "text-gray-400"
          }`}
        >
          +
        </span>
      </button>

      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <p className="px-4 pb-4 md:px-6 md:pb-6 text-sm md:text-base text-gray-400">
            {answer}
          </p>
        </motion.div>
      )}
    </div>
  );
}

export default function Home() {
  const [isMobile, setIsMobile] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const carouselRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // ⭐ AFFICHE ENFIN LES CRÉATRICES
  const [creators, setCreators] = useState<any[]>([]);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/creators");
      const data = await res.json();
      setCreators(data || []);
      // Petit délai pour laisser les images priority se charger
      setTimeout(() => setImagesLoaded(true), 800);
    }
    load();
  }, []);

  const duplicatedCreators = [...creators, ...creators];

  const handleNext = () => {
    if (creators.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % creators.length);
  };

  const handlePrev = () => {
    if (creators.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + creators.length) % creators.length);
  };

  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (touchStart === null || touchEnd === null) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance) handleNext();
    if (distance < -minSwipeDistance) handlePrev();
  };

  useEffect(() => {
    if (!isMobile) return;
    const interval = setInterval(handleNext, 4000);
    return () => clearInterval(interval);
  }, [isMobile, currentIndex]);


  return (
    <main className="pt-6 md:pt-16 bg-black min-h-screen">

      {/* ================= TITRE ================= */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold mb-8 text-center bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-transparent"
          >
            Créatrices disponibles
          </motion.h2>

          {/* ================= DESKTOP ================= */}
          <div className="hidden md:block">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {creators.map((creator, index) => (
                <div
                  key={creator.id || index}
                >
                  <Link href={`/creator/${creator.slug}`}>
                    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer">

                      {/* IMAGE */}
                      <div className="relative h-48 w-full">
                        <Image
                          src={creator.coverImage || "/default-cover.jpg"}
                          alt={creator.name}
                          fill
                          priority
                          className="object-cover"
                          style={{ objectPosition: `center ${creator.imageY || "30%"}` }}
                        />
                        <div className="absolute -bottom-10 left-6">
                          <div className="relative w-20 h-20 rounded-full border-4 border-white overflow-hidden">
                            <Image
                              src={creator.avatar || creator.avatar_url || "/default-avatar.png"}
                              alt={creator.name}
                              fill
                              priority
                              className="object-cover"
                            />
                          </div>
                        </div>
                      </div>

                      {/* CONTENT */}
                      <div className="pt-12 px-6 pb-6 text-black">
                        <h3 className="text-xl font-bold mb-1">{creator.name}</h3>
                        <p className="text-sm text-gray-600 mb-3">@{creator.slug}</p>
                        <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                          {creator.bio || ""}
                            </p>
                            
                        <div className="flex flex-wrap gap-2 mb-4">
                          {(creator.tags || []).map((tag: string) => (
                            <span
                              key={tag}
                              className="px-3 py-1 bg-gray-100 text-[#e31fc1] text-xs rounded-full font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                          <div className="flex items-center gap-1">
                            <Users size={16} />
                            <span>{(creator.subscribers || 0).toLocaleString()} abonnés</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle size={16} />
                            <span>{((creator.messagesCount || 0) / 1000).toFixed(0)}k messages</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-2xl font-bold text-gray-900">
                              {creator.price || 6.97}€
                            </span>
                            <span className="text-gray-600 text-sm">/mois</span>
                          </div>

                          <button className="px-6 py-2 rounded-lg text-white font-semibold bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb]">
                            Discuter
                          </button>
                        </div>
                      </div>

                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* ================= MOBILE ================= */}
          <div
            className="md:hidden relative overflow-hidden"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div
              ref={carouselRef}
              className="flex transition-transform duration-500"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {duplicatedCreators.map((creator, index) => (
                <div key={`${creator.id}-${index}`} className="w-full flex-shrink-0 px-4">

                  <div
                    className="bg-white rounded-2xl shadow-md overflow-hidden max-w-sm mx-auto"
                  >
                    {/* IMAGE */}
                    <div className="relative h-40 w-full">
                      <Image
                        src={creator.coverImage || "/default-cover.jpg"}
                        alt={creator.name}
                        fill
                        priority
                        className="object-cover"
                        style={{ objectPosition: `center ${creator.imageY || "20%"}` }}
                      />
                      <div className="absolute -bottom-8 left-4">
                        <div className="relative w-16 h-16 rounded-full border-4 border-white overflow-hidden">
                          <Image
                            src={creator.avatar || creator.avatar_url || "/default-avatar.png"}
                            alt={creator.name}
                            fill
                            priority
                            className="object-cover"
                          />
                        </div>
                      </div>
                    </div>

                    {/* CONTENT */}
                    <div className="pt-10 px-4 pb-4 text-black">
                      <h3 className="text-lg font-bold mb-1">{creator.name}</h3>
                      <p className="text-xs text-gray-600 mb-2">@{creator.slug}</p>

                      <p className="text-gray-700 text-xs mb-3 line-clamp-2">
                        {creator.bio || ""}
                      </p>

                      <div className="flex flex-wrap gap-2 mb-3">
                        {(creator.tags || []).map((tag: string) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-gray-100 text-[#e31fc1] text-[10px] rounded-full font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                          <Users size={14} />
                          <span>{(creator.subscribers || 0).toLocaleString()} abonnés</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle size={14} />
                          <span>{((creator.messagesCount || 0) / 1000).toFixed(0)}k messages</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xl font-bold text-gray-900">
                            {creator.price || 6.97}€
                          </span>
                          <span className="text-gray-600 text-xs">/mois</span>
                        </div>

                        <Link
                          href={`/creator/${creator.slug}`}
                          className="inline-flex items-center justify-center px-5 py-2 rounded-lg text-sm text-white font-semibold bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb]"
                        >
                          Discuter
                        </Link>
                      </div>
                    </div>
                  </div>

                </div>
              ))}
            </div>

            {/* BULLETS */}
            <div className="flex justify-center mt-4 gap-2">
              {creators.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-2 h-2 rounded-full ${
                    idx === currentIndex ? "bg-[#e31fc1]" : "bg-gray-500"
                  }`}
                />
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ================= AUTRES SECTIONS ================= */}
      {imagesLoaded && (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="space-y-16 md:space-y-32"
      >
        <ContenusPersonnalises />
        <CreatorsSection />
        <PrivateContentSection />
      </motion.div>
      )}

      {/* ================= FAQ SECTION ================= */}
      {imagesLoaded && (
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        viewport={{ once: true }}
        className="w-full mt-32 md:mt-0 py-16 md:py-24 px-4 bg-black text-white"
      >
        <div className="max-w-4xl mx-auto">
          {/* TITRE */}
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-center"
          >
            Questions{" "}
            <span className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-transparent">
              fréquentes
            </span>{" "}
            🤔
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            viewport={{ once: true }}
            className="mt-3 md:mt-4 text-gray-400 text-center text-sm md:text-base max-w-2xl mx-auto"
          >
            Tout ce que vous voulez savoir sur MyDouble.
          </motion.p>

          {/* FAQ ITEMS */}
          <div className="mt-10 md:mt-16 space-y-3 md:space-y-4">
            {[
              {
                q: "Comment ça marche ?",
                a: "MyDouble utilise l'IA pour créer un double virtuel de ta créatrice préférée. Tu peux discuter avec elle 24/7."
              },
              {
                q: "Est-ce vraiment la créatrice qui répond ?",
                a: "Non, c'est une IA entraînée sur sa personnalité. C'est clairement indiqué et transparent."
              },
              {
                q: "Combien ça coûte ?",
                a: "L'abonnement mensuel démarre à 6.97€/mois pour un accès illimité aux discussions."
              },
              {
                q: "Puis-je annuler à tout moment ?",
                a: "Oui, tu peux annuler ton abonnement quand tu veux, sans engagement."
              },
              {
                q: "Mes données sont-elles sécurisées ?",
                a: "Absolument. Toutes les conversations sont chiffrées et nous ne partageons jamais tes données."
              },
              {
                q: "Comment puis-je devenir créatrice sur MyDouble ?",
                a: "Contacte-nous via la page 'Pourquoi nous rejoindre' et nous t'expliquerons tout le processus."
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
                viewport={{ once: true }}
              >
                <FAQItem question={item.q} answer={item.a} />
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>
      )}
    </main>
  );
}
