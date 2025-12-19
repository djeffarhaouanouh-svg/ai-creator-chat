"use client";

import React from "react";
import { motion } from "framer-motion";

const Statsection = () => {
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

          {/* IMAGE METRICS - LEFT */}
          <div className="relative flex justify-center">
            <img
              src="/earning-metrics.png"
              alt="Earning metrics"
              className="w-full max-w-2xl rounded-2xl border border-gray-800 shadow-2xl"
            />

            {/* Glow */}
            <div className="absolute -top-6 -left-6 w-32 h-32 bg-pink-500/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-6 -right-6 w-36 h-36 bg-purple-500/20 rounded-full blur-3xl"></div>
          </div>

          {/* CONTENT - RIGHT */}
          <div className="space-y-10">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 2, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-bold leading-tight"
            >
              Contenus
              <br />
              <span className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-transparent">
                exclusifs
              </span>{" "}
              👀
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 2, delay: 0.4 }}
              viewport={{ once: true }}
              className="text-xl text-gray-300 leading-relaxed"
            >
              Via le Chat, tu peux échanger directement avec le Créateur,
              lui demander des contenus personnalisés à tes envies et
              recevoir ses nouveaux médias exclusifs.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 2, delay: 0.6 }}
              viewport={{ once: true }}
              className="flex flex-wrap justify-center gap-5 pt-6"
            >
              <button className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] text-white font-semibold px-6 py-3 md:px-8 md:py-4 rounded-full hover:shadow-2xl hover:shadow-[#e31fc1]/50 transition-all duration-300 hover:scale-105">
                Découvrir →
              </button>

              <button className="border-2 border-white hover:bg-white hover:text-black text-white font-semibold px-6 py-3 md:px-8 md:py-4 rounded-full transition-all duration-300">
                Connecte-toi
              </button>
            </motion.div>
          </div>

        </div>
      </div>
    </motion.section>
  );
};

export default Statsection;
