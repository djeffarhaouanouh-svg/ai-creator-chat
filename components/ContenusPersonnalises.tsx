import React from 'react';

const ContenusPersonnalises = () => {
  return (
    <section className="bg-black text-white min-h-screen flex items-center px-8 md:px-16">

      <div className="max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Chat Mockup - Left Side */}
          <div className="relative">
            <div className="bg-gray-950 rounded-2xl p-6 shadow-2xl border border-gray-800 max-w-md">
              
              {/* Message - Girl (NO MEDIA) */}
              <div className="flex items-start gap-3 mb-5">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex-shrink-0 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" 
                    alt="User" 
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex-1">
                  <div className="bg-gray-800 rounded-xl rounded-tl-sm p-4 inline-block">
                    <p className="text-white text-sm">
                      Regarde ce que je viens de faire !
                    </p>
                  </div>
                </div>
              </div>

              {/* Message - Man */}
              <div className="flex items-start gap-3 mb-4 flex-row-reverse">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex-shrink-0 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" 
                    alt="Creator" 
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex-1 flex justify-end">
                  <div className="bg-[#e31fc1] rounded-xl rounded-tr-sm p-4 inline-block max-w-[80%]">
                    <p className="text-white text-sm">
                      Wow c’est superbe ! Magnifique 😍
                    </p>
                  </div>
                </div>
              </div>

              {/* Emoji Reaction - Girl */}
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex-shrink-0 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" 
                    alt="User" 
                    className="w-full h-full object-cover"
                  />
                </div>
                  <div className="flex-1">
                 <div className="bg-gray-800 rounded-full w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-xl"> 😘 </div>
                </div>
              </div>

            </div>

            {/* Decorative Elements */}
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-pink-500/20 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-4 -right-4 w-28 h-28 bg-purple-500/20 rounded-full blur-2xl"></div>
          </div>

          {/* Content - Right Side */}
          <div className="space-y-10">
             <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                Discute et crée un lien que ton créateur
             <br />
             <span className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-transparent">
                peut suivre
           </span>{" "}
                👀
            </h2>

            <p className="text-xl text-gray-300 leading-relaxed">
                Échange librement : ton Créateur peut lire vos messages et suivre l’évolution de votre relation.
                Tu n’es pas juste un fan, Tu deviens un ami!
            </p>

            <div className="flex flex-wrap gap-5 pt-6">
              <button className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] text-white font-semibold px-8 py-4 rounded-full hover:shadow-2xl hover:shadow-[#e31fc1]/50 transition-all duration-300 hover:scale-105">
                Découvrir les Créateurs →
              </button>
              
              <button className="border-2 border-white hover:bg-white hover:text-black text-white font-semibold px-8 py-4 rounded-full transition-all duration-300">
                Connecte-toi
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default ContenusPersonnalises;

