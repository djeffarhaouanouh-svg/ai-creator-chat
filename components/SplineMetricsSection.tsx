"use client";

import React from "react";
import { motion } from "framer-motion";

export default function SplineMetricsSection() {
  return (
    <section className="bg-black py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">

          {/* -------- TEXTE (GAUCHE SUR ORDI) -------- */}
          <div className="space-y-8 order-2 lg:order-1">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-extrabold text-white leading-tight"
            >
              La duplication{" "}
              <span className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-transparent">
                conversationnel
              </span>{" "}
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
              viewport={{ once: true }}
              className="text-xl text-gray-300 leading-relaxed space-y-6"
            >
              <p>
                MyDouble repose sur une technologie développée en interne
                permettant de reproduire le comportement conversationnel
                d'une créatrice.
              </p>

              <p>
                Le système analyse sa manière d'écrire, ses habitudes,
                son ton de voix, ses réponses récurrentes et ses limites
                afin de créer un double capable d'interagir de façon
                cohérente et réaliste.
              </p>
            </motion.div>

             <div className="flex flex-wrap justify-center gap-5 pt-6">
                           <motion.button
                             initial={{ opacity: 0, y: 30 }}
                             whileInView={{ opacity: 1, y: 0 }}
                             transition={{ duration: 2, delay: 0.6, ease: "easeOut" }}
                             viewport={{ once: true }}
                             whileHover={{
                               scale: 1.07,
                               transition: { type: "spring", stiffness: 260, damping: 15 }
                             }}
                             whileTap={{
                               scale: 0.95,
                               transition: { type: "spring", stiffness: 300, damping: 20 }
                             }}
                             className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] text-white font-semibold px-6 py-3 md:px-8 md:py-4 rounded-full hover:shadow-2xl hover:shadow-[#e31fc1]/50 transition-all duration-300"
                           >
                             Découvrir →
                           </motion.button>
             
                           <motion.button
                             initial={{ opacity: 0, y: 30 }}
                             whileInView={{ opacity: 1, y: 0 }}
                             transition={{ duration: 2, delay: 0.7 }}
                             viewport={{ once: true }}
                             className="border-2 border-white hover:bg-white hover:text-black text-white font-semibold px-6 py-3 md:px-8 md:py-4 rounded-full transition-all duration-300"
                           >
                             Connecte-toi
                           </motion.button>
                         </div>
          </div>

          {/* -------- VIDÉO / SPLINE (DROITE SUR ORDI) -------- */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true }}
            className="
              relative
              w-full
              aspect-[16/9]
              rounded-3xl
              overflow-hidden
              border border-white/10
              shadow-2xl
              order-1 lg:order-2
            "
          >
            <iframe
              src="https://my.spline.design/retrofuturisticcircuitloop-5CAFD7lKZ1Rg0UyE15MRvfd4"
              frameBorder="0"
              width="100%"
              height="100%"
              className="absolute inset-0"
              allow="fullscreen"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

