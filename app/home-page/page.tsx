"use client";

export default function PaypalReviewPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Container */}
      <div className="max-w-5xl mx-auto px-6 py-20">

        {/* Header */}
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          Plateforme IA pour créateurs de contenu
        </h1>

        <p className="text-gray-300 text-lg leading-relaxed max-w-3xl">
          Notre plateforme fournit des outils d’intelligence artificielle 
          destinés aux créateurs de contenu (sport, lifestyle, divertissement, coaching).
          Elle leur permet d’améliorer l’engagement avec leur communauté grâce 
          à un assistant conversationnel automatisé, configurable et sécurisé.
        </p>

        {/* Section 1 */}
        <div className="mt-16 space-y-6">
          <h2 className="text-2xl font-semibold text-[#E31FC1]">
            Fonctionnalités principales
          </h2>

          <div className="grid md:grid-cols-2 gap-8 mt-8">

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h3 className="text-xl font-semibold mb-3">Assistant IA</h3>
              <p className="text-gray-400">
                Les créateurs peuvent configurer un assistant IA pour répondre
                automatiquement aux messages de leur communauté.
              </p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h3 className="text-xl font-semibold mb-3">Gestion d’abonnements</h3>
              <p className="text-gray-400">
                Les créateurs peuvent proposer un accès premium à leurs fans
                pour débloquer des fonctionnalités avancées ou un support prioritaire.
              </p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h3 className="text-xl font-semibold mb-3">Panel créateur</h3>
              <p className="text-gray-400">
                Interface simple permettant de personnaliser l’assistant IA, 
                suivre l’engagement, et gérer la communauté.
              </p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h3 className="text-xl font-semibold mb-3">Sécurité & Conformité</h3>
              <p className="text-gray-400">
                Aucune fonctionnalité adulte. Aucun contenu explicite. 
                Le service est strictement professionnel.
              </p>
            </div>

          </div>
        </div>

        {/* Section 2 */}
        <div className="mt-20">
          <h2 className="text-2xl font-semibold text-[#E31FC1] mb-6">
            Utilisation prévue des paiements PayPal
          </h2>

          {/* INTRO TEXTE */}
          <p className="text-gray-300 max-w-3xl leading-relaxed mb-4">
            Les paiements PayPal sont exclusivement utilisés pour :
          </p>

          {/* LISTE (PLUS DANS UN <p>) */}
          <ul className="list-disc list-inside space-y-2 text-gray-300">
            <li>Les abonnements premium mensuels</li>
            <li>L’accès à des fonctionnalités avancées de l’outil IA</li>
            <li>Aucun service émotionnel ou contenu sensible</li>
            <li>Plateforme professionnelle pour créateurs</li>
          </ul>
        </div>

        {/* CTA */}
        <div className="mt-20 bg-gray-900 p-10 rounded-2xl border border-gray-800">
          <h3 className="text-2xl font-semibold mb-4">
            À propos de notre service
          </h3>
          <p className="text-gray-400 leading-relaxed">
            Nous opérons un outil SaaS destiné aux créateurs de contenu.
            Notre mission est d’automatiser la gestion communautaire grâce 
            à l’intelligence artificielle. Aucune fonctionnalité ne viole 
            les politiques d’utilisation de PayPal.
          </p>
        </div>

      </div>
    </div>
  );
}
