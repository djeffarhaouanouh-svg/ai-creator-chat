"use client";

import React from "react";
import { motion } from "framer-motion";

export default function SplineMetricsSection() {
  return (
    <section className="bg-black py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">

          {/* -------- GAUCHE : SPLINE -------- */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="
              relative 
              w-full 
              aspect-[16/9] 
              rounded-3xl 
              overflow-hidden 
              border border-white/10 
              shadow-2xl
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

          {/* -------- DROITE : TEXTE -------- */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-4xl md:text-5xl font-extrabold text-white leading-tight">
              Suis tes{" "}
              <span className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-transparent">
                performances
              </span>{" "}
              en temps réel
            </h2>

            <p className="text-xl text-gray-300 leading-relaxed">
              Accède à un dashboard clair pour suivre les revenus générés,
              l’engagement des fans et la croissance de ton double IA,
              sans dépendre d’une agence.
            </p>

            <button className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] text-white font-bold px-8 py-4 rounded-full hover:scale-105 transition">
              Voir le dashboard →
            </button>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
