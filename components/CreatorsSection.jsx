"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const CreatorsSection = () => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      viewport={{ once: true }}
      className="section-default pt-24 pb-20"
    >
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        {/* IMAGES */}
        <div className="relative h-[500px] hidden lg:block">
          <Image src="/mon-chat.jpg" alt="" fill className="object-cover rounded-xl" />
        </div>

        {/* TEXTE */}
        <div className="space-y-10">
          <h2 className="text-4xl md:text-6xl font-bold">
            Ton expérience devient{" "}
            <span className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-transparent">
              personnalisée
            </span>
          </h2>

          <p className="text-xl text-white/70">
            La conversation s’adapte à toi et devient plus naturelle.
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

export default CreatorsSection;
