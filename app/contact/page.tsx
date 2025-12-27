"use client";

import { useState } from "react";

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white max-w-3xl mx-auto px-6 py-20">
      <h1 className="text-3xl font-bold mb-6">
        Contact{" "}
        <span className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-transparent">
          MyDouble
        </span>
      </h1>
      <p className="text-gray-400 mb-8">
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
            <label className="block text-sm mb-2 text-gray-300">Nom</label>
            <input
              type="text"
              className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-[#e31fc1] focus:border-transparent outline-none"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm mb-2 text-gray-300">Email</label>
            <input
              type="email"
              className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-[#e31fc1] focus:border-transparent outline-none"
              required
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm mb-2 text-gray-300">Message</label>
            <textarea
              rows={5}
              className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-[#e31fc1] focus:border-transparent outline-none"
              required
            ></textarea>
          </div>

          {/* Bouton */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] text-white font-semibold py-3 rounded-xl hover:shadow-2xl hover:shadow-[#e31fc1]/50 transition-all"
          >
            Envoyer
          </button>
        </form>
      ) : (
        <div className="text-center py-20 bg-gradient-to-b from-gray-900 to-black border border-gray-800 rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-4">
            Message envoyé{" "}
            <span className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-transparent">
              ✔️
            </span>
          </h2>
          <p className="text-gray-400">
            Merci ! Nous vous répondrons dans les plus brefs délais.
          </p>
        </div>
      )}
    </div>
  );
}
