import React from "react";
import Image from "next/image";

const CreatorsSection = () => {
  return (
    <section className="section-default py-20">
      <div className="max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

           {/* 💻 VERSION ORDINATEUR — VERSION D'ORIGINE */}
<div className="order-1 lg:order-1 relative h-[500px] hidden lg:block">

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

          {/* 📱 VERSION MOBILE — DÉCALAGE AVEC EFFET AU CLIC & HOVER */}
<div className="lg:hidden mb-10 grid grid-cols-3 gap-4">

  {/* Image 1 — légèrement plus haute */}
  <div className="w-full h-64 -mt-4 rounded-2xl overflow-hidden border border-white/10 
                  cursor-pointer transition-transform duration-300 
                  hover:scale-105 active:scale-95">
    <Image
      src="/mon-chat.jpg"
      alt="Créateur 1"
      width={500}
      height={700}
      className="object-cover w-full h-full"
    />
  </div>

  {/* Image 2 — légèrement plus basse */}
  <div className="w-full h-64 mt-4 rounded-2xl overflow-hidden border border-white/10 
                  cursor-pointer transition-transform duration-300 
                  hover:scale-105 active:scale-95">
    <Image
      src="/images/creator2.jpg"
      alt="Créateur 2"
      width={500}
      height={700}
      className="object-cover w-full h-full"
    />
  </div>

  {/* Image 3 — même hauteur que la première */}
  <div className="w-full h-64 -mt-4 rounded-2xl overflow-hidden border border-white/10 
                  cursor-pointer transition-transform duration-300 
                  hover:scale-105 active:scale-95">
    <Image
      src="/images/creator3.jpg"
      alt="Créateur 3"
      width={500}
      height={700}
      className="object-cover w-full h-full"
    />
  </div>

</div>


          {/* 📝 TEXTE (droite sur ordi, sous les images sur mobile) */}
          <div className="space-y-10">
               <h2
  className="text-5xl md:text-6xl font-bold leading-tight"
  style={{
    fontSize: "38px",
  }}
>
  Ton expérience devient
  <br />
  <span className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-transparent">
    personnalisée
  </span>{" "}
  ✨
</h2>

            <p className="text-xl text-white/70 leading-relaxed">
               Ta manière de parler, tes goûts, tes émotions… la conversation s’ajuste à toi.
               Tu ressens une vraie proximité, comme si votre lien devenait naturel au fil du temps.
            </p>

            <div className="flex flex-wrap gap-5 pt-6">
              <button className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] text-white font-semibold px-8 py-4 rounded-full hover:shadow-2xl hover:shadow-[#e31fc1]/50 transition-all duration-300 hover:scale-105">
                Découvrir les Créateurs →
              </button>
               <button
                  onClick={() => window.location.href = "/login"}
                  className="border border-white hover:bg-white hover:text-black text-white font-semibold px-8 py-4 rounded-full transition-all duration-300"
                  >
                  Connecte-toi
               </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default CreatorsSection;
