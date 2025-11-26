import React from 'react';
import Image from 'next/image';

const PrivateContentSection = () => {
  return (
     <section className="section-default">
      <div className="max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

          {/* Texte */}
          <div className="order-2 lg:order-1 space-y-10">
            <h2 className="text-4xl md:text-5xl font-bold leading-tight">
              Accède à des contenus à la demande et à des lives{' '}
              <span className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-transparent">
                privés
              </span>
            </h2>

            <p className="text-xl text-white/70 leading-relaxed">
              Abonne-toi à tes Créateurs préférés pour accéder à leurs catalogues exclusifs
              et participer à des sessions live privées rien que pour toi.
            </p>

            <div className="flex flex-wrap gap-5 pt-6">
              {/* BOUTON GRADIENT */}
              <button className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] text-white font-semibold px-8 py-4 rounded-full hover:shadow-2xl hover:shadow-[#e31fc1]/50 transition-all duration-300 hover:scale-105">
                Découvrir les Créateurs →
              </button>

              {/* BOUTON OUTLINE */}
              <button className="border border-white hover:bg-white hover:text-black text-white font-semibold px-8 py-4 rounded-full transition-all duration-300">
                Connecte-toi
              </button>
            </div>
          </div>

          {/* Image téléphone */}
          <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
            <div className="relative w-80 lg:w-96">
              <Image src="/mockup_telephone.png" alt="Mockup iPhone" width={380} height={760} className="w-full h-auto"/>

              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-[#e31fc1]/20 via-[#ff6b9d]/20 to-[#ffc0cb]/20 rounded-full blur-3xl -z-10" />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default PrivateContentSection;

