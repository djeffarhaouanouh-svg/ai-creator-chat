"use client";

import Link from "next/link";
import Image from "next/image";
import { creators } from "@/data/creators";
import { Users, MessageCircle } from "lucide-react";
import ContenusPersonnalises from "@/components/ContenusPersonnalises";
import PrivateContentSection from "@/components/PrivateContentSection";
import CreatorsSection from "@/components/CreatorsSection";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

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

  const duplicatedCreators = [...creators, ...creators];

  const handleNext = () =>
    setCurrentIndex((prev) => (prev + 1) % creators.length);

  const handlePrev = () =>
    setCurrentIndex((prev) => (prev - 1 + creators.length) % creators.length);

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
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance) handleNext();
    if (distance < -minSwipeDistance) handlePrev();
  };

  return (
    <main className="pt-6 md:pt-16 bg-black min-h-screen text-white">
      {/* ================= CREATRICES ================= */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">

          {/* TITRE */}
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true }}
            className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-transparent"
          >
            Créatrices disponibles
          </motion.h2>

          {/* DESKTOP GRID */}
          <div className="hidden md:block">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {creators.map((creator, i) => (
                <motion.div
                  key={creator.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: i * 0.08 }}
                  viewport={{ once: true }}
                >
                  <Link href={`/creator/${creator.username}`}>
                    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer text-black">
                      <div className="relative h-48 w-full">
                        <Image
                          src={creator.coverImage}
                          alt={creator.name}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute -bottom-10 left-6">
                          <div className="relative w-20 h-20 rounded-full border-4 border-white overflow-hidden">
                            <Image
                              src={creator.avatar}
                              alt={creator.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-12 px-6 pb-6">
                        <h3 className="text-xl font-bold mb-1">{creator.name}</h3>
                        <p className="text-sm text-gray-600 mb-3">
                          @{creator.username}
                        </p>

                        <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                          {creator.bio}
                        </p>

                        <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                          <div className="flex items-center gap-1">
                            <Users size={16} />
                            {creator.subscribers.toLocaleString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle size={16} />
                            {(creator.messagesCount / 1000).toFixed(0)}k
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-bold">
                            {creator.price}€
                            <span className="text-sm text-gray-600">/mois</span>
                          </span>
                          <button className="px-6 py-2 rounded-lg text-white font-semibold bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb]">
                            Discuter
                          </button>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>

          {/* MOBILE CAROUSEL */}
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
                <div key={index} className="w-full flex-shrink-0 px-4">
                  <div className="bg-white rounded-2xl shadow-md overflow-hidden max-w-sm mx-auto text-black">
                    <div className="relative h-40 w-full">
                      <Image
                        src={creator.coverImage}
                        alt={creator.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="p-4">
                      <h3 className="text-lg font-bold">{creator.name}</h3>
                      <p className="text-xs text-gray-600 mb-2">
                        @{creator.username}
                      </p>

                      <div className="flex items-center justify-between mt-4">
                        <span className="font-bold">
                          {creator.price}€/mois
                        </span>
                        <Link
                          href={`/creator/${creator.username}`}
                          className="px-5 py-2 rounded-lg text-white font-semibold bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb]"
                        >
                          Discuter
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* AUTRES SECTIONS */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="space-y-24"
      >
        <ContenusPersonnalises />
        <CreatorsSection />
        <PrivateContentSection />
      </motion.div>
    </main>
  );
}

