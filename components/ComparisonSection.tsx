"use client";
import React from "react";

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

        <h2 className="text-center text-5xl font-extrabold text-white mb-16">
          Ce qui change{" "}
          <span className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-transparent">
            vraiment
          </span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <CompareCard
            title="Avant"
            rows={[
              { ok: false, text: "Agences traditionnelles" },
              { ok: false, text: "Contrats verrouillés" },
              { ok: false, text: "Frais cachés" },
              { ok: false, text: "Aucune transparence" },
              { ok: false, text: "Pas de données" },
              { ok: false, text: "Créatrice dépendante" },
            ]}
          />

          <CompareCard
            title="Avec MyDouble"
            rows={[
              { ok: true, text: "Créatrice aux commandes" },
              { ok: true, text: "Sans engagement" },
              { ok: true, text: "Zéro frais de départ" },
              { ok: true, text: "Accès total aux stats" },
              { ok: true, text: "Revenus directs" },
              { ok: true, text: "IA disponible 24/7" },
            ]}
          />
        </div>
      </div>
    </section>
  );
}
