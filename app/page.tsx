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
      <div
        key={`${creator.id}-${index}`}
        className="w-full flex-shrink-0 px-4"               // 🔹 un peu plus de marge
      >
        <div
          className="bg-white rounded-2xl shadow-md overflow-hidden max-w-sm mx-auto" 
          // 🔹 carte plus petite et centrée
        >
          {/* IMAGE */}
          <div className="relative h-40 w-full">           {/* 🔹 moins haute (48 -> 40) */}
            <Image
              src={creator.coverImage}
              alt={creator.name}
              fill
              className="object-cover"
              style={{ objectPosition: `center ${creator.imageY || "50%"}` }}
            />
            <div className="absolute -bottom-8 left-4">    {/* 🔹 avatar un peu plus haut et plus petit */}
              <div className="relative w-16 h-16 rounded-full border-4 border-white overflow-hidden">
                <Image src={creator.avatar} alt={creator.name} fill className="object-cover" />
              </div>
            </div>
          </div>

          {/* CONTENT MOBILE */}
          <div className="pt-10 px-4 pb-4 text-black">     {/* 🔹 moins de padding */}
            <h3 className="text-lg font-bold mb-1">{creator.name}</h3>   {/* 🔹 texte plus petit */}
            <p className="text-xs text-gray-600 mb-2">@{creator.username}</p>

            <p className="text-gray-700 text-xs mb-3 line-clamp-2">
              {creator.bio}
            </p>

            {/* TAGS */}
            <div className="flex flex-wrap gap-2 mb-3">
              {creator.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-gray-100 text-[#e31fc1] text-[10px] rounded-full font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* STATS */}
            <div className="flex items-center justify-between text-[11px] text-gray-600 mb-3">
              <div className="flex items-center gap-1">
                <Users size={14} />
                <span>{creator.subscribers.toLocaleString()} abonnés</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle size={14} />
                <span>{(creator.messagesCount / 1000).toFixed(0)}k messages</span>
              </div>
            </div>

            {/* PRICE + CTA */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xl font-bold text-gray-900">
                  {creator.price}€
                </span>
                <span className="text-gray-600 text-xs">/mois</span>
              </div>

              {/* BTN MOBILE — CLICKABLE */}
              <Link
                href={`/creator/${creator.username}`}
                onClick={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
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

  {/* DOTS */}
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

        {/* MARQUEE ULTRA FLUIDE */}
<section className="w-full bg-black py-10 overflow-hidden">

  {/* Marquee wrapper */}
  <div className="relative overflow-hidden">

    {/* Track animé */}
    <div className="marquee-track gap-24 text-5xl md:text-7xl font-bold 
                    bg-clip-text text-transparent 
                    bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb]
                    drop-shadow-[0_0_20px_#e31fc1aa]"
    >
      {/* 2 groupes identiques pour scroll infini */}
      <span>Toi aussi ! Crée ton double IA</span>
      <span>Toi aussi ! Crée ton double IA</span>
      <span>Toi aussi ! Crée ton double IA</span>
      <span>Toi aussi ! Crée ton double IA</span>

      <span>Toi aussi ! Crée ton double IA</span>
      <span>Toi aussi ! Crée ton double IA</span>
      <span>Toi aussi ! Crée ton double IA</span>
      <span>Toi aussi ! Crée ton double IA</span>
    </div>

  </div>
</section>

 {/* SECTION 1— COMMENT ÇA MARCHE */}
<section className="w-full py-20 md:py-32 bg-black text-white">
  <div className="
      max-w-4xl mx-auto px-6 
      flex flex-col items-center text-center
      md:px-0
  ">

     {/* TITRE CENTRÉ */}
<motion.h2
  initial={{ opacity: 0, y: 40 }}
  whileInView={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.8, ease: "easeOut" }}
  viewport={{ once: true }}
  className="text-4xl md:text-6xl font-bold leading-tight text-center"
>
  Ton double IA<br />
  <span className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-transparent">
    en 3 étapes simples
  </span>
  {" "}
  <span className="inline-block">⚡</span>
</motion.h2>


    {/* LISTE DES ÉTAPES */}
    <div className="mt-12 space-y-12 text-left md:text-center">

      {/* Étape 1 */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 2, delay: 0.2, ease: "easeOut" }}
        viewport={{ once: true }}
        className="space-y-2"
      >
        <h3 className="text-xl font-semibold">1. Tu envoies quelques vocaux</h3>
        <p className="text-gray-300 leading-relaxed max-w-xl mx-auto">
          Pas besoin d'accès à tes DM. Juste 2–3 vocaux + quelques phrases
          pour apprendre ton style, ton énergie et tes expressions.
        </p>
      </motion.div>

      {/* Étape 2 */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 2, delay: 0.4, ease: "easeOut" }}
        viewport={{ once: true }}
        className="space-y-2"
      >
        <h3 className="text-xl font-semibold">2. On crée ta page IA</h3>
        <p className="text-gray-300 leading-relaxed max-w-xl mx-auto">
          Une page “Parler à mon IA” personnalisée, avec ton univers,
          prête à mettre en story, en bio ou en swipe-up.
        </p>
      </motion.div>

      {/* Étape 3 */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 2, delay: 0.6, ease: "easeOut" }}
        viewport={{ once: true }}
        className="space-y-2"
      >
        <h3 className="text-xl font-semibold">3. Tes abonnés discutent → tu gagnes</h3>
        <p className="text-gray-300 leading-relaxed max-w-xl mx-auto">
          L’IA répond pour toi 24/24, ton audience adore, et tu touches ta part
          sur chaque abonnement généré.
        </p>
      </motion.div>
    </div>

    {/* BOUTONS CENTRÉS */}
    <div className="mt-14 flex flex-wrap justify-center gap-5">

       <motion.button
  initial={{ opacity: 0, y: 30 }}
  whileInView={{ opacity: 1, y: 0 }}
  transition={{ duration: 2, delay: 0.8, ease: "easeOut" }}
  viewport={{ once: true }}

  whileHover={{
    scale: 1.07,
    transition: { type: "spring", stiffness: 260, damping: 15 }
  }}

  whileTap={{
    scale: 0.95,
    transition: { type: "spring", stiffness: 300, damping: 20 }
  }}

   className="btn-primary"
   
>
  Rejoindre la bêta →
</motion.button>

      {/* CTA secondaire */}
      <motion.button
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 2, delay: 1, ease: "easeOut" }}
        viewport={{ once: true }}
         className="btn-secondary"
>
   Voir une démo
      </motion.button>

    </div>
  </div>
  
</section>

{/* SECTION2— BENEFICES */}
 <section className="w-full pt-20 pb-4 md:py-32 bg-black text-white">
  <div className="max-w-7xl mx-auto px-6 md:px-12 grid md:grid-cols-2 gap-16 items-start">

    {/* COLONNE GAUCHE — TEXTE + BOUTONS */}
    <div className="flex flex-col justify-center">

       {/* TITRE */}
<motion.h2
  initial={{ opacity: 0, y: 40 }}
  whileInView={{ opacity: 1, y: 0 }}
  transition={{ duration: 2, delay: 0.2, ease: "easeOut" }}
  viewport={{ once: true }}
  className="text-4xl md:text-5xl font-bold leading-tight"
>
  Pourquoi les créateurs<br />
  <span className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-transparent">
    utilisent MyDouble
  </span>
</motion.h2>

{/* TEXTE */}
<motion.p
  initial={{ opacity: 0, y: 40 }}
  whileInView={{ opacity: 1, y: 0 }}
  transition={{ duration: 2, delay: 0.4, ease: "easeOut" }}
  viewport={{ once: true }}
  className="mt-6 text-gray-300 text-lg max-w-md"
>
  Ton IA ne remplace pas ton image : elle la multiplie.
  MyDouble t’aide à gagner du temps, de l’argent et à renforcer ta communauté.
</motion.p>

    </div>

    {/* COLONNE DROITE — CARTES */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

      {/* CARTE 1 */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        viewport={{ once: true }}
        whileHover={{ scale: 1.03, transition: { duration: 0.15 } }}
        whileTap={{ scale: 1.05, transition: { duration: 0.12 } }}
        className="p-5 rounded-2xl bg-gradient-to-b from-gray-900 to-black border border-gray-800"
      >
        <div className="text-3xl mb-3">💸</div>
        <h3 className="font-semibold text-xl mb-2">+ de revenus automatiques</h3>
        <p className="text-gray-400 text-sm">
          Tes abonnés peuvent parler à ton IA via un abonnement mensuel.
        </p>
      </motion.div>

      {/* CARTE 2 */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        viewport={{ once: true }}
        whileHover={{ scale: 1.03, transition: { duration: 0.15 } }}
        whileTap={{ scale: 1.05, transition: { duration: 0.12 } }}
        className="p-5 rounded-2xl bg-gradient-to-b from-gray-900 to-black border border-gray-800"
      >
        <div className="text-3xl mb-3">⏳</div>
        <h3 className="font-semibold text-xl mb-2">– de charge mentale</h3>
        <p className="text-gray-400 text-sm">
          Ton IA répond pour toi, même quand tu dors ou voyages.
        </p>
      </motion.div>

      {/* CARTE 3 */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        viewport={{ once: true }}
        whileHover={{ scale: 1.03, transition: { duration: 0.15 } }}
        whileTap={{ scale: 1.05, transition: { duration: 0.12 } }}
        className="p-5 rounded-2xl bg-gradient-to-b from-gray-900 to-black border border-gray-800"
      >
        <div className="text-3xl mb-3">💬</div>
        <h3 className="font-semibold text-xl mb-2">+ de proximité</h3>
        <p className="text-gray-400 text-sm">
          L’IA reprend ton style, tes expressions, ton humour, ta personnalité.
        </p>
      </motion.div>

      {/* CARTE 4 */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        viewport={{ once: true }}
        whileHover={{ scale: 1.03, transition: { duration: 0.15 } }}
        whileTap={{ scale: 1.05, transition: { duration: 0.12 } }}
        className="p-5 rounded-2xl bg-gradient-to-b from-gray-900 to-black border border-gray-800"
      >
        <div className="text-3xl mb-3">🚀</div>
        <h3 className="font-semibold text-xl mb-2">Tu deviens innovant</h3>
        <p className="text-gray-400 text-sm">
          Tu fais partie des premiers créateurs à avoir un double IA officiel.
        </p>
      </motion.div>

    </div>
  </div>
</section>

{/* SECTION3— CE QUE LA COMMUNAUTÉ Y GAGNE */}
<section className="w-full py-32 bg-black text-white">
  <div className="max-w-6xl mx-auto px-8 md:px-16 grid md:grid-cols-2 gap-16 items-center">

    {/* TEXTES */}
    <div>

       {/* TITRE */}
<motion.h2
  initial={{ opacity: 0, y: 40 }}
  whileInView={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.8, ease: "easeOut" }}
  viewport={{ once: true }}
  className="text-3xl md:text-4xl font-bold leading-tight"
>
  Une meilleure expérience<br />
  <span className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-transparent">
    pour ta communauté
  </span>
  {" "}
  <span className="inline-block">💖</span>
</motion.h2>

      <div className="mt-8 space-y-10">

        {/* BÉNÉFICE 1 */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 2, delay: 0.2, ease: "easeOut" }}
          viewport={{ once: true }}
          className="space-y-2"
        >
          <h3 className="text-xl font-semibold">Discuter avec toi 24/24</h3>
          <p className="text-gray-300 max-w-md leading-relaxed">
            Même quand tu dors ou voyages, ton double IA garde le lien vivant.
            Ton audience se sent plus proche et plus écoutée.
          </p>
        </motion.div>

        {/* BÉNÉFICE 2 */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 2, delay: 0.4, ease: "easeOut" }}
          viewport={{ once: true }}
          className="space-y-2"
        >
          <h3 className="text-xl font-semibold">Une relation personnalisée</h3>
          <p className="text-gray-300 max-w-md leading-relaxed">
            L’IA mémorise leurs préférences, leur prénom,
            leurs envies, leurs messages précédents.  
            Tes abonnés vivent une expérience unique!
          </p>
        </motion.div>

      </div>

      {/* BOUTONS */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 2, delay: 0.6, ease: "easeOut" }}
        viewport={{ once: true }}
        className="mt-12 flex flex-wrap gap-5"
      >
         {/* CTA PRINCIPAL */}
<button className="btn-primary">
  Je veux offrir →
</button>

{/* CTA SECONDAIRE */}
<button className="btn-secondary">
  En savoir plus
</button>

      </motion.div>

    </div>

    {/* VISUEL — MOCKUP TÉLÉPHONE */}
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 2, delay: 0.3, ease: "easeOut" }}
      viewport={{ once: true }}
      className="flex justify-center"
    >
      <img
        src="/mockup_telephone1.png"
        alt="Mockup téléphone"
        className="w-[350px] md:w-[400px] drop-shadow-2xl"
      />
    </motion.div>

  </div>
</section>

 

    </main>
  );
}
