"use client";

import Link from "next/link";
import Image from "next/image";
import { creators } from "@/data/creators";
import { Users, MessageCircle } from "lucide-react";
import ContenusPersonnalises from "@/components/ContenusPersonnalises";
import PrivateContentSection from "@/components/PrivateContentSection";
import CreatorsSection from "@/components/CreatorsSection";
import { useState, useEffect, useRef } from "react";

export default function Home() {
  const [isMobile, setIsMobile] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const carouselRef = useRef<HTMLDivElement>(null);

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const duplicatedCreators = [...creators, ...creators];

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % creators.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + creators.length) % creators.length);
  };

  // --- Swipe Mobile avec désactivation sur le bouton ---
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
    <main className="min-h-screen bg-black text-white">

      {/* Titre section */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-transparent">
            Créatrices disponibles
          </h2>

          {/* Desktop Grid */}
          <div className="hidden md:block">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {creators.map((creator) => (
                <Link key={creator.id} href={`/creator/${creator.username}`}>
                  <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer">
                              {/* IMAGE */}
            <div className="relative h-48 w-full">
                      <Image src={creator.coverImage} alt={creator.name} fill className="object-cover"
                     style={{ objectPosition: `center ${creator.imageY || "50%"}`,}}
                     />
            <div className="absolute -bottom-10 left-6">
            <div className="relative w-20 h-20 rounded-full border-4 border-white overflow-hidden">
                      <Image src={creator.avatar} alt={creator.name} fill className="object-cover" />
                     </div>
                   </div>
                 </div>   
                    {/* CONTENT */}
                    <div className="pt-12 px-6 pb-6 text-black">
                      <h3 className="text-xl font-bold mb-1">{creator.name}</h3>
                      <p className="text-sm text-gray-600 mb-3">@{creator.username}</p>

                      <p className="text-gray-700 text-sm mb-4 line-clamp-2">{creator.bio}</p>

                      {/* TAGS */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {creator.tags.map((tag) => (
                          <span key={tag} className="px-3 py-1 bg-gray-100 text-[#e31fc1] text-xs rounded-full font-medium">
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* STATS */}
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-1">
                          <Users size={16} />
                          <span>{creator.subscribers.toLocaleString()} abonnés</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle size={16} />
                          <span>{(creator.messagesCount / 1000).toFixed(0)}k messages</span>
                        </div>
                      </div>

                      {/* PRICE + CTA */}
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-2xl font-bold text-gray-900">{creator.price}€</span>
                          <span className="text-gray-600 text-sm">/mois</span>
                        </div>
                        <button className="px-6 py-2 rounded-lg text-white font-semibold bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb]">
                          Discuter
                        </button>
                      </div>
                    </div>

                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* --------------------- MOBILE CAROUSEL --------------------- */}
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
                <div key={`${creator.id}-${index}`} className="w-full flex-shrink-0 px-2">
                  <div className="bg-white rounded-xl shadow-md overflow-hidden">

                    {/* IMAGE */}
            <div className="relative h-48 w-full">
                      <Image src={creator.coverImage} alt={creator.name} fill className="object-cover"
                     style={{ objectPosition: `center ${creator.imageY || "50%"}`,}}
                     />
            <div className="absolute -bottom-10 left-6">
            <div className="relative w-20 h-20 rounded-full border-4 border-white overflow-hidden">
                      <Image src={creator.avatar} alt={creator.name} fill className="object-cover" />
                     </div>
                   </div>
                 </div>
                    {/* CONTENT MOBILE */}
                    <div className="pt-12 px-6 pb-6 text-black">
                      <h3 className="text-xl font-bold mb-1">{creator.name}</h3>
                      <p className="text-sm text-gray-600 mb-3">@{creator.username}</p>

                      <p className="text-gray-700 text-sm mb-4 line-clamp-2">{creator.bio}</p>

                      {/* TAGS */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {creator.tags.map((tag) => (
                          <span key={tag} className="px-3 py-1 bg-gray-100 text-[#e31fc1] text-xs rounded-full font-medium">
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* STATS */}
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-1">
                          <Users size={16} />
                          <span>{creator.subscribers.toLocaleString()} abonnés</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle size={16} />
                          <span>{(creator.messagesCount / 1000).toFixed(0)}k messages</span>
                        </div>
                      </div>

                      {/* PRICE + CTA */}
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-2xl font-bold text-gray-900">{creator.price}€</span>
                          <span className="text-gray-600 text-sm">/mois</span>
                        </div>

                        {/* BTN MOBILE — CLICKABLE */}
                         <Link
  href={`/creator/${creator.username}`}
  onClick={(e) => e.stopPropagation()}
  onTouchStart={(e) => e.stopPropagation()}
  onTouchEnd={(e) => e.stopPropagation()}
  className="inline-flex items-center justify-center px-6 py-2 rounded-lg text-white font-semibold bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb]"
>
  Discuter
</Link>
                      </div>

                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* DOTS */}
            <div className="flex justify-center mt-4 gap-2">
              {creators.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-2 h-2 rounded-full ${idx === currentIndex ? "bg-[#e31fc1]" : "bg-gray-500"}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTIONS AFTER */}
      <div className="space-y-20">
        <ContenusPersonnalises />
        <CreatorsSection />
        <PrivateContentSection />
      </div>

    </main>
  );
}
