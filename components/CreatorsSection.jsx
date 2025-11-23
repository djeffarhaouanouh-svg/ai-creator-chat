import React from 'react';
import Image from 'next/image';

const CreatorsSection = () => {
  return (
    <section className="bg-black text-white min-h-screen flex items-center px-8 md:px-16">
      <div className="max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Texte */}
          <div className="order-2 lg:order-1 space-y-10">
            <h2 className="text-5xl md:text-6xl font-bold leading-tight">
              Accède aux contenus{' '}
              <span className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-transparent">
                exclusifs
              </span>{' '}
              de tes Créateurs
            </h2>

            <p className="text-xl text-white/70 leading-relaxed">
              Rejoins la plateforme et accède aux profils de milliers de Créateurs
              partageant du contenu exclusif disponible uniquement ici.
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

          {/* Images */}
          <div className="order-1 lg:order-2 relative h-[500px] hidden lg:block">

            <div className="absolute left-0 top-8 w-60 h-80 rounded-2xl overflow-hidden border border-white/10 bg-black transition-transform duration-300 hover:scale-105">
              <Image src="/mon-chat.jpg" alt="Créateur" fill className="object-cover"/>
            </div>

            <div className="absolute left-40 top-0 w-60 h-80 rounded-2xl overflow-hidden border border-white/10 bg-black transition-transform duration-300 hover:scale-105 z-20">
              <Image src="/images/creator2.jpg" alt="Créateur 2" fill className="object-cover"/>
            </div>

            <div className="absolute right-0 top-16 w-52 h-72 rounded-2xl overflow-hidden border border-white/10 bg-black transition-transform duration-300 hover:scale-105 z-10">
              <Image src="/images/creator3.jpg" alt="Créateur 3" fill className="object-cover"/>
            </div>

          </div>

          {/* Mobile */}
          <div className="order-1 lg:hidden grid grid-cols-3 gap-4">
            {["/mon-chat.jpg", "/images/creator2.jpg", "/images/creator3.jpg"].map((src, i) => (
              <div key={i} className="aspect-[3/4] rounded-xl overflow-hidden border border-white/10 bg-black transition-transform duration-300 hover:scale-105">
                <Image src={src} alt="Créateur" width={200} height={300} className="object-cover w-full h-full"/>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};

export default CreatorsSection;
