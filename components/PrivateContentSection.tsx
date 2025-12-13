"use client";

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
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-center">
        {/* IMAGE */}
        <div className="flex justify-center">
          <Image
            src="/mockup_telephone.png"
            alt="Mockup"
            width={380}
            height={760}
          />
        </div>

        {/* TEXTE */}
        <div className="space-y-10">
          <h2 className="text-3xl md:text-5xl font-bold">
            Toujours disponible{" "}
            <span className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-transparent">
              pour discuter
            </span>
          </h2>

          <p className="text-xl text-white/70">
            Discute à tout moment, sans délai.
          </p>

          <div className="flex gap-5">
            <button className="btn-primary">Découvrir →</button>
            <button
              onClick={() => (window.location.href = "/login")}
              className="btn-secondary"
            >
              Connecte-toi
            </button>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default PrivateContentSection;
