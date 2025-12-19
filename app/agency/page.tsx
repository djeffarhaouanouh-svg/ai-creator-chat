"use client";

import ContenusPersonnalises from "@/components/ContenusPersonnalises";
import ComparisonSection from "@/components/ComparisonSection";
import SplineMetricsSection from "@/components/SplineMetricsSection";
import Statsection from "@/components/Statsection";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

/* ================= FAQ ITEM ================= */

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-gray-800 rounded-2xl bg-gradient-to-b from-gray-900 to-black overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center px-4 py-4 md:px-6 md:py-5 text-left"
      >
        <span className="text-base md:text-lg font-semibold pr-4">{question}</span>
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

/* ================= PAGE ================= */

export default function Page() {
  // ✅ OPTION 2 : parallax mobile au scroll (subtil + safe)
  useEffect(() => {
    const onScroll = () => {
      document.documentElement.style.setProperty("--scrollY", String(window.scrollY));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <main className="bg-black min-h-screen text-white">
      {/* ================= HERO (TEXTE OVERLAY + VIDÉO À DROITE) ================= */}
       <section className="relative w-full bg-black pt-32 pb-[55vh] md:pt-40 md:pb-56 overflow-hidden">
        {/* VIDÉO / SPLINE À DROITE (BACKGROUND) */}
        <div className="absolute top-0 right-[-6%] h-full w-full md:w-[62%]">
          {/* Desktop : interactif */}
          <iframe
            src="https://my.spline.design/voiceinteractionanimation-QUJyCPMhJhwyByTcqGiFA4da/"
            className="absolute inset-0 w-full h-full hidden md:block"
            frameBorder="0"
            allow="autoplay; fullscreen"
          />

          {/* ================= MOBILE : PARALLAX (OPTION 2) ================= */}
          <div
            className="md:hidden absolute top-0 right-[-20%] w-[150%] h-[55vh] overflow-hidden will-change-transform"
            style={{
              transform: "translateY(calc(var(--scrollY, 0) * 0.12px))",
            }}
          >
            <iframe
              src="https://my.spline.design/tel-vqqdfLxshMoI1350uh94e4aM/"
              className="w-full h-full pointer-events-none"
              frameBorder="0"
              allow="autoplay; fullscreen"
            />
          </div>

          {/* Fade à gauche pour lisibilité du texte */}
            <div className="absolute inset-0 pointer-events-none bg-black/20 md:bg-transparent"></div>
        </div>

        {/* CONTENU (par-dessus, à gauche) */}
        <div className="relative max-w-none px-8 md:px-20">
          <div className="max-w-2xl mt-40 md:mt-16 text-center md:text-left">
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
              MyDouble pour les{" "}
              <span className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-transparent">
                agences
              </span>
            </h1>

            <p className="mt-6 text-white/70 text-lg md:text-xl">
              Faux texte pour vérifier que le texte passe au-dessus de la vidéo,
              tout en restant aligné à gauche comme sur ta capture.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <button className="btn-primary px-10 py-4 text-lg">Fake CTA</button>
              <button className="btn-secondary px-10 py-4 text-lg">Fake bouton</button>
            </div>
          </div>
        </div>
      </section>

      {/* ================= AUTRES SECTIONS ================= */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="space-y-16 md:space-y-32"
      >
        <ContenusPersonnalises />
        <SplineMetricsSection />
        <Statsection />
        <ComparisonSection />
      </motion.div>

      {/* ================= TESTIMONIALS ================= */}
      <section className="bg-black text-white py-24 px-6 md:px-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 text-center">
            <div className="flex flex-col items-center">
              <img
                src="/mon-chat.jpg"
                alt="Jade"
                className="w-52 h-52 rounded-full object-cover mb-8"
              />
              <p className="text-base md:text-lg leading-relaxed max-w-md">
                "Fake testimonial : on valide juste le style et l’espacement. Après on mettra un
                vrai texte orienté bénéfices agence."
              </p>
              <span className="mt-6 text-sm text-gray-400">Jade</span>
            </div>

            <div className="flex flex-col items-center">
              <img
                src="/bella.jpg"
                alt="Bella"
                className="w-52 h-52 rounded-full object-cover mb-8"
              />
              <p className="text-base md:text-lg leading-relaxed max-w-md">
                "Fake testimonial : même objectif, on teste le rendu. Ensuite on remplace par du
                vrai copy MyDouble."
              </p>
              <span className="mt-6 text-sm text-gray-400">Bella</span>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FAQ ================= */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        viewport={{ once: true }}
        className="w-full mt-10 py-16 md:py-24 px-4 bg-black text-white"
      >
        <div className="max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-center"
          >
            Questions{" "}
            <span className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-transparent">
              fréquentes
            </span>{" "}
            🤔
          </motion.h2>

          <p className="mt-4 text-gray-400 text-center max-w-2xl mx-auto">
            Tout ce que vous voulez savoir sur MyDouble.
          </p>

          <div className="mt-10 space-y-4">
            {[
              { q: "Comment ça marche ?", a: "MyDouble utilise l'IA pour créer un double virtuel." },
              { q: "Est-ce vraiment la créatrice qui répond ?", a: "Non, c'est une IA entraînée." },
              { q: "Puis-je annuler à tout moment ?", a: "Oui, sans engagement." },
            ].map((item, index) => (
              <FAQItem key={index} question={item.q} answer={item.a} />
            ))}
          </div>
        </div>
      </motion.section>
    </main>
  );
}
