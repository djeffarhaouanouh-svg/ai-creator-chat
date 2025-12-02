import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ - AI Creator Chat",
  description: "Questions fréquentes sur les paiements et le fonctionnement d’AI Creator Chat",
};

export default function FAQPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl md:text-4xl font-bold mb-6">
        ❓ FAQ – Questions fréquentes
      </h1>

      <p className="text-white/70 mb-10">
        Bienvenue dans la FAQ d’<span className="font-semibold">AI Creator Chat</span>.
        Tu trouveras ici les réponses aux questions les plus courantes concernant
        les paiements, la sécurité et le fonctionnement du service.
      </p>

      <div className="space-y-10 text-sm md:text-base">
        {/* 1. Paiement sécurisé */}
        <section>
          <h2 className="text-xl font-semibold mb-2">
            1. Le paiement est-il sécurisé ?
          </h2>
          <p className="text-white/70">
            Oui. Tous les paiements effectués sur AI Creator Chat sont{" "}
            <span className="font-semibold">sécurisés</span> via notre partenaire
            de paiement. Nous ne stockons <span className="font-semibold">aucune donnée
            bancaire complète</span> : les cartes sont chiffrées et traitées par
            notre prestataire de paiement certifié.
          </p>
        </section>

        {/* 2. Qu’est-ce que j’achète exactement ? */}
        <section>
          <h2 className="text-xl font-semibold mb-2">
            2. Qu’est-ce que j’achète exactement ?
          </h2>
          <p className="text-white/70">
            Tu achètes l’accès à :
          </p>
          <ul className="list-disc list-inside text-white/70 mt-2 space-y-1">
            <li>des <span className="font-semibold">chatbots IA personnalisés</span> inspirés d’influenceuses,</li>
            <li>des <span className="font-semibold">contenus numériques soft</span> (photos, audios, messages exclusifs, etc.),</li>
            <li>des fonctionnalités premium dans le chat (messages illimités selon l’offre, réponses plus poussées, etc.).</li>
          </ul>
        </section>

        {/* 3. Est-ce un abonnement ou un achat unique ? */}
        <section>
          <h2 className="text-xl font-semibold mb-2">
            3. Est-ce un abonnement ou un achat unique ?
          </h2>
          <p className="text-white/70">
            Selon l’offre choisie, il peut s’agir :
          </p>
          <ul className="list-disc list-inside text-white/70 mt-2 space-y-1">
            <li>d’un <span className="font-semibold">abonnement récurrent</span> (mensuel / autre durée),</li>
            <li>ou d’un <span className="font-semibold">achat ponctuel</span> de contenu numérique.</li>
          </ul>
          <p className="text-white/70 mt-2">
            Avant de payer, le type d’offre (abonnement ou achat unique), la durée
            et le prix sont toujours indiqués clairement sur la page de paiement.
          </p>
        </section>

        {/* 4. Stockez-vous mes données bancaires ? */}
        <section>
          <h2 className="text-xl font-semibold mb-2">
            4. Stockez-vous mes données bancaires ?
          </h2>
          <p className="text-white/70">
            Non. AI Creator Chat ne stocke pas les numéros complets de ta carte.
            Les paiements sont traités et sécurisés par notre prestataire de paiement
            qui est spécialisé dans la gestion des transactions en ligne.
          </p>
        </section>

        {/* 5. Les influenceuses sont-elles réelles ? */}
        <section>
          <h2 className="text-xl font-semibold mb-2">
            5. Les influenceuses sont-elles réelles ?
          </h2>
          <p className="text-white/70">
            Les personnages avec lesquels tu discutes sont des{" "}
            <span className="font-semibold">chatbots IA</span> inspirés de vraies
            créatrices. Les réponses sont générées par l’intelligence artificielle
            en respectant la personnalité et le style définis pour chaque profil.
            Il ne s’agit pas d’une discussion en temps réel avec la personne physique.
          </p>
        </section>
      </div>
    </main>
  );
}
