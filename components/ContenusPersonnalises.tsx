"use client";

import React from "react";
import { motion } from "framer-motion";

const ContenusPersonnalises = () => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      viewport={{ once: true }}
      className="bg-black text-white pt-8 pb-24 md:pt-24 md:pb-32 px-8 md:px-16"
    >
      <div className="max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* MOCKUP */}
          <div className="relative">
            <div className="bg-gray-950 rounded-2xl p-6 shadow-2xl border border-gray-800 max-w-md">
              <p className="text-white text-sm">
                Exemple de discussion avec contenus personnalisés
              </p>
            </div>
          </div>

          {/* TEXTE */}
          <div className="space-y-10">
            <h2 className="text-4xl md:text-5xl font-bold">
              Demande des contenus{" "}
              <span className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-transparent">
                exclusifs
              </span>
            </h2>

            <p className="text-xl text-gray-300">
              Via le chat, tu peux demander des contenus personnalisés et recevoir
              des médias exclusifs.
            </p>

            <div className="flex gap-5">
              <button className="btn-primary">Découvrir →</button>
              <button className="btn-secondary">Connecte-toi</button>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default ContenusPersonnalises;
