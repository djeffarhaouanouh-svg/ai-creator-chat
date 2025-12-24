"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* -----------------------------
 Typing effect BLOQUANT
------------------------------*/
const TypingText = ({
  text,
  speed = 55,
  onComplete,
}: {
  text: string;
  speed?: number;
  onComplete: () => void;
}) => {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    setDisplayed("");
    let i = 0;

    const interval = setInterval(() => {
      i++;
      if (i <= text.length) {
        setDisplayed(text.substring(0, i));
      } else {
        clearInterval(interval);
        onComplete();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, onComplete]);

  return <span>{displayed}</span>;
};

/* -----------------------------
 Messages du chat
------------------------------*/
const messages = [
  {
    from: "ai",
    author: "Emma",
    avatar: "/V.jpg",
    text: "Il est tard… J’aime bien ces moments-là, quand tout est plus calme.",
  },
  {
    from: "user",
    author: "FAN",
    avatar: "/K.png",
    text: "Ouais… On se dit des choses qu’on dirait pas en plein milieu de la journée",
  },
  {
    from: "ai",
    author: "Emma",
    avatar: "/V.jpg",
    text: "Exactement. Ici, on peut prendre le temps… sans pression.",
  },
  {
    from: "user",
    author: "FAN",
    avatar: "/K.png",
    text: "C'est cool, en vrai",
  },
];

export default function PrivateContentSection() {
  const [visibleIndex, setVisibleIndex] = useState(-1); // 👈 démarre à -1
  const [typingDone, setTypingDone] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  // 👇 lancement du premier message avec délai
  useEffect(() => {
    const start = setTimeout(() => {
      setVisibleIndex(0);
    }, 1500);

    return () => clearTimeout(start);
  }, []);

  useEffect(() => {
    if (typingDone) {
      const timeout = setTimeout(() => {
        setTypingDone(false);
        setVisibleIndex((i) => i + 1);

        chatRef.current?.scrollTo({
          top: chatRef.current.scrollHeight,
          behavior: "smooth",
        });
      }, 600);

      return () => clearTimeout(timeout);
    }
  }, [typingDone]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      viewport={{ once: true }}
      className="pt-12 pb-0 px-4 md:pt-20 md:pb-32 md:px-6 bg-black"
    >
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-32 md:gap-14 items-center">

        {/* 📱 CHAT */}
        <div className="flex justify-center mt-32 lg:mt-0">
          <div className="relative w-[300px] h-[520px] md:w-[340px] md:h-[600px] rounded-[32px] overflow-hidden bg-gradient-to-b from-[#1a2332] via-[#0f1419] to-black shadow-2xl">

            <div
              ref={chatRef}
              className="h-full overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4"
            >
              <AnimatePresence>
                {messages.slice(0, visibleIndex + 1).map((msg, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className={`flex gap-3 ${
                      msg.from === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    {/* Avatar gauche */}
                    {msg.from === "ai" && (
                      <img
                        src={msg.avatar}
                        className="w-7 h-7 md:w-8 md:h-8 rounded-full"
                      />
                    )}

                    {/* Bulle */}
                    <div
                      className={`max-w-[80%] rounded-2xl px-3 py-2 md:px-4 md:py-3 text-sm leading-relaxed ${
                        msg.from === "ai"
                          ? "bg-[#e235c2] text-white"
                          : "bg-white/10 text-white"
                      }`}
                    >
                      <p
                        className={`text-xs text-white/60 mb-1 ${
                          msg.from === "user" ? "text-right" : "text-left"
                        }`}
                      >
                        {msg.author}
                      </p>

                      {index === visibleIndex ? (
                        <TypingText
                          text={msg.text}
                          onComplete={() => setTypingDone(true)}
                        />
                      ) : (
                        <span>{msg.text}</span>
                      )}
                    </div>

                    {/* Avatar droite */}
                    {msg.from === "user" && (
                      <img
                        src={msg.avatar}
                        className="w-7 h-7 md:w-8 md:h-8 rounded-full"
                      />
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              <div className="h-12 md:h-20" />
            </div>
          </div>
        </div>

        {/* 📝 TEXTE À DROITE */}
        <div className="space-y-8">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 2, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold leading-tight"
          >
            Toujours disponible{" "}
            <span className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-transparent">
              pour toi
            </span>{" "}
            💬
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 2, delay: 0.4 }}
            viewport={{ once: true }}
            className="text-xl text-white/70 leading-relaxed"
          >
            Pas de délais, pas d'absence. Tu peux lui parler à n'importe quel moment,
            continuer votre histoire et renforcer votre connexion quand tu veux.
          </motion.p>

          {/* BOUTONS — COMME TON PREMIER CODE */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 2, delay: 0.6 }}
            viewport={{ once: true }}
            className="flex flex-wrap justify-center gap-5 pt-6"
          >
            <button
              className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] text-white font-semibold px-6 py-3 md:px-8 md:py-4 rounded-full hover:shadow-2xl hover:shadow-[#e31fc1]/50 hover:scale-105 transition-all duration-300"
            >
              Découvrir →
            </button>

            <button
              onClick={() => (window.location.href = "/login")}
              className="border-2 border-white hover:bg-white hover:text-black text-white font-semibold px-6 py-3 md:px-8 md:py-4 rounded-full transition-all duration-300"
            >
              Connecte-toi
            </button>
          </motion.div>
        </div>

      </div>

      {/* Trait blanc décoratif */}
      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        whileInView={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        viewport={{ once: true }}
        className="relative w-full flex justify-center mt-32 lg:mt-40"
      >
        <div className="h-[2px] w-48 md:w-80 lg:w-[520px] bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.6)]" />
      </motion.div>
    </motion.section>
  );
}

