"use client";
import React from "react";
import { motion } from "framer-motion";

type Row = {
  ok: boolean;
  text: string;
};

function Check({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="text-green-500 text-xl">✔</span>
  ) : (
    <span className="text-pink-500 text-xl">✖</span>
  );
}

function CompareCard({
  title,
  rows,
}: {
  title: string;
  rows: Row[];
}) {
  return (
    // 👉 CONTOUR ROSE DÉGRADÉ
    <div className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] p-[5px] rounded-[40px]">
      
      {/* 👉 CARTE BLANCHE */}
      <div className="bg-white rounded-[36px] px-10 py-12">
        <h3 className="text-3xl font-bold text-black mb-8">
          {title}
        </h3>

        <ul className="space-y-5">
          {rows.map((row, i) => (
            <li key={i} className="flex items-center gap-4">
              <Check ok={row.ok} />
              <span className="text-black font-medium">
                {row.text}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function ComparisonSection() {
  return (
    <section className="bg-black py-24">
      <div className="max-w-6xl mx-auto px-6">

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true }}
          className="text-center text-5xl font-extrabold text-white mb-16"
        >
          Ce qui change{" "}
          <span className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-transparent">
            vraiment
          </span>
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <CompareCard
            title="Avant"
            rows={[
              { ok: false, text: "Coûts humains élevés" },
              { ok: false, text: "Dépendance totale au chatting manuel" },
              { ok: false, text: "Scalabilité limitée par les équipes" },
              { ok: false, text: "Marges qui se dégradent avec le volume" },
              { ok: false, text: "Croissance linéaire, difficile à maintenir" },
              { ok: false, text: "Peu de visibilité sur la performance réelle" },
            ]}
          />

          <CompareCard
            title="Avec MyDouble"
            rows={[
              { ok: true, text: "Réduction des coûts opérationnels" },
              { ok: true, text: "Couche IA qui absorbe le volume" },
              { ok: true, text: "Scalabilité sans recruter" },
              { ok: true, text: "Meilleur revenu net par créatrice" },
              { ok: true, text: "Pilotage et données centralisées" },
              { ok: true, text: "Croissance maîtrisée et durable" },
            ]}
          />
        </div>
      </div>
    </section>
  );
}
