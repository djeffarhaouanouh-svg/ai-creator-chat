"use client";

import React from "react";
import { motion } from "framer-motion";

const Statsection = () => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      viewport={{ once: true }}
      className="bg-black text-white pt-8 pb-24 md:pt-20 md:pb-32 px-8 md:px-16"
    >
      <div className="max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* IMAGE METRICS - LEFT */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true }}
            className="relative flex justify-center"
          >
            <img
              src="/earning-metrics.png"
              alt="Earning metrics"
              className="w-full max-w-2xl rounded-2xl border border-gray-800 shadow-2xl"
            />

            {/* Glow */}
            <div className="absolute -top-6 -left-6 w-32 h-32 bg-pink-500/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-6 -right-6 w-36 h-36 bg-purple-500/20 rounded-full blur-3xl"></div>
          </motion.div>

          {/* CONTENT - RIGHT */}
          <div className="space-y-10">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-bold leading-tight"
            >
              Les agences perdent
              <br />
              <span className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-transparent">
                de l'argent
              </span>{" "}
              👀
            </motion.h2>

             <motion.div
  initial={{ opacity: 0, y: 30 }}
  whileInView={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
  viewport={{ once: true }}
  className="text-xl text-gray-300 leading-relaxed space-y-6"
>
  <p className="font-semibold">
    1 000 000 € généré
  </p>

  <ul className="list-disc list-inside space-y-2">
    <li>~20 % prélevés par la plateforme</li>
    <li>~20 % absorbés par le chatting / l'opérationnel</li>
  </ul>

  <p>
    👉 Une part importante du revenu disparaît avant même d'optimiser la performance.
  </p>

  <p>
    MyDouble prend que 10% tout en automatisant le chatting.
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

        </div>
      </div>
    </motion.section>
  );
};

export default Statsection;
