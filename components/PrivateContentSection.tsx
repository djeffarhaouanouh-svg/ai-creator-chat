"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";

const PrivateContentSection = () => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      viewport={{ once: true }}
      className="pt-16 pb-32 md:pt-28 md:pb-40 px-6 md:px-16 bg-black"
    >
      <div className="max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

          {/* Image téléphone */}
          <div className="order-1 lg:order-1 flex justify-center lg:justify-start">
            <div className="relative w-80 lg:w-96">
              <Image
                src="/mockup_telephone.png"
                alt="Mockup iPhone"
                width={380}
                height={760}
                className="w-full h-auto"
              />

              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-[#e31fc1]/20 via-[#ff6b9d]/20 to-[#ffc0cb]/20 rounded-full blur-3xl -z-10" />
            </div>
          </div>

          {/* Texte */}
          <div className="order-2 lg:order-2 space-y-10">
            <h2
              className="text-3xl md:text-5xl font-bold leading-tight"
              style={{ fontSize: "42px" }}
            >
              Toujours disponible pour discuter
              <br />
              <span className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-transparent">
                avec toi
              </span>{" "}
              💬
            </h2>

            <p className="text-xl text-white/70 leading-relaxed">
              Pas de délais, pas d’absence.
              Tu peux lui parler à n’importe quel moment, continuer votre histoire et renforcer votre connexion quand tu veux.
            </p>

            <div className="flex flex-wrap gap-5 pt-6">
              <button className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] text-white font-semibold px-8 py-4 rounded-full hover:shadow-2xl hover:shadow-[#e31fc1]/50 transition-all duration-300 hover:scale-105">
                Découvrir →
              </button>
              <button
                onClick={() => (window.location.href = "/login")}
                className="border border-white hover:bg-white hover:text-black text-white font-semibold px-8 py-4 rounded-full transition-all duration-300"
              >
                Connecte-toi
              </button>
            </div>
          </div>

        </div>
      </div>
    </motion.section>
  );
};

export default PrivateContentSection;
