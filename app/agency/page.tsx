"use client";

import ContenusPersonnalises from "@/components/ContenusPersonnalises";
import ComparisonSection from "@/components/ComparisonSection";
import SplineMetricsSection from "@/components/SplineMetricsSection";
import Statsection from "@/components/Statsection";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

/* ================= TESTIMONIALS SECTION ================= */

function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const testimonials = [
    {
      img: "/lau.png",
      alt: "Jade",
      text: "Fake testimonial : on valide juste le style et l'espacement. Après on mettra un vrai texte orienté bénéfices agence.",
      name: "Jade",
    },
    {
      img: "/Lia.jpg",
      alt: "Bella",
      text: "Fake testimonial : même objectif, on teste le rendu. Ensuite on remplace par du vrai copy MyDouble.",
      name: "Bella",
    },
  ];

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const paginate = (newDirection: number) => {
    setCurrentIndex((prevIndex) => {
      let nextIndex = prevIndex + newDirection;
      if (nextIndex < 0) nextIndex = testimonials.length - 1;
      if (nextIndex >= testimonials.length) nextIndex = 0;
      return nextIndex;
    });
  };

  return (
    <section className="bg-black text-white py-24 px-6 md:px-16">
      <div className="max-w-6xl mx-auto">
        {/* Desktop: Grid */}
        <div className="hidden md:grid grid-cols-2 gap-16 text-center">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.15, ease: "easeOut" }}
              viewport={{ once: true }}
              className="flex flex-col items-center"
            >
              <img
                src={testimonial.img}
                alt={testimonial.alt}
                className="w-52 h-52 rounded-full object-cover mb-8"
              />
              <p className="text-base md:text-lg leading-relaxed max-w-md">
                "{testimonial.text}"
              </p>
              <span className="mt-6 text-sm text-gray-400">{testimonial.name}</span>
            </motion.div>
          ))}
        </div>

        {/* Mobile: Carousel */}
        <div className="md:hidden relative overflow-hidden">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = swipePower(offset.x, velocity.x);

              if (swipe < -swipeConfidenceThreshold) {
                paginate(1);
              } else if (swipe > swipeConfidenceThreshold) {
                paginate(-1);
              }
            }}
            className="flex flex-col items-center text-center cursor-grab active:cursor-grabbing"
          >
            <img
              src={testimonials[currentIndex].img}
              alt={testimonials[currentIndex].alt}
              className="w-52 h-52 rounded-full object-cover mb-8"
            />
            <p className="text-base leading-relaxed max-w-md px-4">
              "{testimonials[currentIndex].text}"
            </p>
            <span className="mt-6 text-sm text-gray-400">{testimonials[currentIndex].name}</span>
          </motion.div>

          {/* Dots indicators */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "bg-[#e31fc1] w-8"
                    : "bg-gray-600 hover:bg-gray-400"
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

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
  // Parallax mobile au scroll (inchangé)
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
      <section className="relative w-full bg-black pt-32 pb-[10vh] md:pt-40 md:pb-56 overflow-hidden">
        {/* VIDÉO / SPLINE À DROITE (BACKGROUND) */}
        <div className="absolute top-0 right-[-6%] h-full w-full md:w-[62%]">
          {/* Desktop : interactif */}
          <iframe
            src="https://my.spline.design/voiceinteractionanimation-QUJyCPMhJhwyByTcqGiFA4da/"
            className="absolute inset-0 w-full h-full hidden md:block"
            frameBorder="0"
            allow="autoplay; fullscreen"
          />

          {/* Mobile : parallax */}
          <div
            className="md:hidden absolute top-0 right-[-20%] w-[150%] h-[55vh] overflow-hidden will-change-transform"
            style={{
              transform: "translateY(calc(var(--scrollY, 0) * 0.12px))",
            }}
          >
            <iframe
              src="https://my.spline.design/tel2-X7wB0o0DgnnSejMjVHYzoSOD/"
              className="w-full h-full pointer-events-none"
              frameBorder="0"
              allow="autoplay; fullscreen"
            />
          </div>

          {/* Fade à gauche pour lisibilité du texte */}
          <div className="absolute inset-0 pointer-events-none bg-black/20 md:bg-transparent" />
        </div>

        {/* CONTENU (par-dessus, à gauche) — animations comme pourquoi-nous-rejoindre */}
        <div className="relative max-w-none px-8 md:px-20">
          <div className="max-w-2xl mt-44 md:mt-16 text-center md:text-left">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-4xl md:text-6xl font-extrabold leading-tight"
            >
              MyDouble pour les{" "}
              <span className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-transparent">
                agences
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
              className="mt-6 text-white/70 text-lg md:text-xl">
            </motion.p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4 items-center md:items-start">
              <motion.button
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 2, delay: 0.3 }}
                viewport={{ once: true }}
                className="btn-secondary px-10 py-4 text-lg w-auto"
              >
                Découvrir
              </motion.button>
            </div>
          </div>
        </div>
      </section>

      {/* ================= WHO WE ARE ================= */}
      <section className="relative bg-black text-white py-20 md:py-32 px-6 md:px-16 overflow-hidden">
        {/* Décorations roses */}
        <span className="absolute top-10 left-10 text-[#ff6b9d] text-3xl md:text-4xl opacity-80 pointer-events-none">
          ♥
        </span>
        <span className="absolute top-16 right-16 text-[#e31fc1] text-5xl md:text-6xl opacity-60 pointer-events-none">
          ❝
        </span>
        <span className="absolute bottom-16 left-20 text-[#ff9acb] text-5xl md:text-6xl opacity-60 pointer-events-none">
          ❞
        </span>
        <span className="absolute bottom-10 right-16 text-[#ff6b9d] text-3xl md:text-4xl opacity-80 pointer-events-none">
          ♥
        </span>

        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold mb-8"
          >
            Optimisation des coûts pour les agences OnlyFans
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
            viewport={{ once: true }}
            className="text-lg md:text-xl text-white/80 leading-relaxed mb-8"
          >
            Aujourd'hui, une grande partie du revenu généré par une créatrice est absorbée par les
            frais de plateforme et les coûts opérationnels liés au chatting humain.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            viewport={{ once: true }}
            className="text-lg md:text-xl text-white/80 leading-relaxed"
          >
            MyDouble permet aux agences de réduire significativement ces coûts en automatisant une
            partie des conversations, tout en maintenant un haut niveau d'engagement et de cohérence.
          </motion.p>
        </div>
      </section>

      {/* ================= AUTRES SECTIONS ================= */}
      <section className="space-y-16 md:space-y-32">
         
        <SplineMetricsSection />
        <Statsection />

        <div className="max-w-4xl mx-auto text-center px-6 md:px-0">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold mb-8"
          >
            comment ça fonctionne?
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
            viewport={{ once: true }}
            className="text-lg md:text-xl text-white/80 leading-relaxed mb-8"
          >
            Chaque créatrice est dupliquée individuellement à partir de données spécifiques : style
            d'écriture, ton de voix, règles, historique et préférences.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            viewport={{ once: true }}
            className="text-lg md:text-xl text-white/80 leading-relaxed"
          >
            Le double IA est ensuite capable de gérer des conversations continues, tout en respectant
            strictement le cadre défini par l'agence et la créatrice.
          </motion.p>
        </div>

        <ComparisonSection />
      </section>

      {/* ================= TESTIMONIALS ================= */}
      <TestimonialsSection />

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
            initial={{ opacity: 0, y: 30 }}
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
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
            viewport={{ once: true }}
            className="mt-4 text-gray-400 text-center max-w-2xl mx-auto"
          >
            Tout ce que vous voulez savoir sur MyDouble.
          </motion.p>

          <div className="mt-10 space-y-4">
            {[
              {
                q: "Est-ce que vous gardons le contrôle total sur nos créatrices ?",
                a: "Oui. L'agence et la créatrice définissent les règles, les limites, le ton et les sujets autorisés. L'IA agit strictement dans ce cadre. Vous pouvez ajuster ou désactiver le clone à tout moment.",
              },
              {
                q: "Est-ce que MyDouble remplace notre équipe de chatting ?",
                a: "Non. MyDouble est une couche complémentaire. L'IA gère le volume et la continuité, tandis que vos équipes se concentrent sur les conversations à forte valeur et les demandes premium.",
              },
              {
                q: "Combien de temps faut-il pour mettre en place un clone ?",
                a: "La mise en place est rapide. Une fois les informations fournies, un clone peut être opérationnel en quelques heures. Aucun changement lourd dans votre organisation n'est nécessaire.",
              },
              {
                q: "Est-ce compatible avec notre manière actuelle de travailler ?",
                a: "Oui. MyDouble a été conçu pour s'intégrer aux process existants des agences. Vous conservez votre structure, vos équipes et votre stratégie.",
              },
              {
                q: "Où se situent les économies réalisées ?",
                a: "Les économies proviennent principalement de la réduction du volume de chatting manuel. L'IA absorbe une partie importante des conversations, ce qui permet de gérer plus de fans à coût maîtrisé.",
              },
              {
                q: "Y a-t-il un engagement long terme ?",
                a: "Non. Il n'y a pas d'engagement imposé. Le modèle est présenté lors d'un échange privé, et vous restez libre d'arrêter à tout moment.",
              },
              {
                q: "Les fans savent-ils qu'ils parlent à une IA ?",
                a: "La communication est définie avec l'agence et la créatrice. L'objectif est de maintenir une expérience cohérente, naturelle et respectueuse du cadre établi.",
              },
              {
                q: "Quel est le modèle financier ?",
                a: "Le modèle est conçu pour améliorer le revenu net par créatrice. Les conditions exactes sont expliquées lors d'un échange privé avec l'agence.",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1, ease: "easeOut" }}
                viewport={{ once: true }}
              >
                <FAQItem question={item.q} answer={item.a} />
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>
    </main>
  );
}
