"use client";

import { useState } from "react";

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  return (
    <div className="max-w-3xl mx-auto px-6 py-20">
      <h1 className="text-3xl font-bold mb-6">Contact</h1>
      <p className="text-white/70 mb-8">
        Une question ? Un problème ? Contactez-nous via ce formulaire.
      </p>

      {!sent ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
          className="space-y-6"
        >
          {/* Nom */}
          <div>
            <label className="block text-sm mb-2">Nom</label>
            <input
              type="text"
              className="w-full px-4 py-2 rounded-lg bg-white/10 outline-none"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm mb-2">Email</label>
            <input
              type="email"
              className="w-full px-4 py-2 rounded-lg bg-white/10 outline-none"
              required
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm mb-2">Message</label>
            <textarea
              rows={5}
              className="w-full px-4 py-2 rounded-lg bg-white/10 outline-none"
              required
            ></textarea>
          </div>

          {/* Bouton */}
          <button
            type="submit"
            className="w-full bg-white text-black font-semibold py-3 rounded-xl hover:bg-white/80 transition"
          >
            Envoyer
          </button>
        </form>
      ) : (
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold mb-4">Message envoyé ✔️</h2>
          <p className="text-white/60">
            Merci ! Nous vous répondrons dans les plus brefs délais.
          </p>
        </div>
      )}
    </div>
  );
}
