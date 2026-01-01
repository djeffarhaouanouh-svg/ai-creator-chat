"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { Send } from "lucide-react";

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-gray-800 rounded-2xl bg-gradient-to-b from-gray-900 to-black overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center px-4 py-4 md:px-6 md:py-5 text-left"
      >
        <span className="text-base md:text-lg font-semibold pr-4">
          {question}
        </span>
        <span
          className={`text-xl md:text-2xl transition-transform duration-300 ${
            open ? "rotate-45 text-[#e31fc1]" : "text-gray-400"
          }`}
        >
          +
        </span>
      </button>

      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <p className="px-4 pb-4 md:px-6 md:pb-6 text-sm md:text-base text-gray-400">
            {answer}
          </p>
        </motion.div>
      )}
    </div>
  );
}

// Composant de typing effect
function TypingText({ text, onComplete }: { text: string; onComplete?: () => void }) {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 30);
      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, onComplete]);

  return <span>{displayedText}</span>;
}

// Composant de démo interactive
function InteractiveDemo() {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'ai'; text: string }>>([
    { role: 'ai', text: "Salut ! Je suis ton double IA. Pose-moi une question pour voir comment je fonctionne !" }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    { q: "Comment tu apprends mon style ?", a: "J'analyse tes messages, tes expressions favorites, ton ton et même ton humour ! Plus tu me donnes d'exemples, plus je deviens précis. C'est comme si tu me donnais un cours accéléré sur ta personnalité 😊" },
    { q: "Tu peux gérer mes DM Instagram ?", a: "Oui ! Je peux répondre à tes DM 24/7 avec ton style. Tu gardes toujours le contrôle et peux définir des limites sur ce que je peux dire ou ne pas dire." },
    { q: "C'est sécurisé ?", a: "Absolument ! Toutes tes données sont chiffrées et protégées. Tu peux modifier ou supprimer tes informations quand tu veux. Ta vie privée est notre priorité 🔒" },
    { q: "Je peux gagner de l'argent avec ?", a: "Oui ! Tu peux proposer un abonnement mensuel à tes fans pour discuter avec ton double IA. Tu touches une part sur chaque abonnement. Certains créateurs génèrent plusieurs milliers d'euros par mois 💰" }
  ];

  const handleQuestionClick = (question: string, answer: string) => {
    if (isTyping || selectedQuestion === question) return;

    setSelectedQuestion(question);
    setMessages(prev => [...prev, { role: 'user', text: question }]);
    setIsTyping(true);

    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'ai', text: answer }]);
      setIsTyping(false);
      setSelectedQuestion(null);

      // Scroll to bottom
      setTimeout(() => {
        if (chatRef.current) {
          chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
      }, 100);
    }, 1000);
  };

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Chat Interface */}
        <div className="order-2 md:order-1">
          <div className="bg-gradient-to-b from-gray-900 to-black border border-gray-800 rounded-2xl overflow-hidden">
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-2xl">
                  🤖
                </div>
                <div>
                  <p className="font-semibold text-white">Ton Double IA</p>
                  <p className="text-xs text-white/80">En ligne</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={chatRef}
              className="h-[400px] overflow-y-auto p-4 space-y-4"
            >
              <AnimatePresence>
                {messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        msg.role === 'ai'
                          ? 'bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] text-white'
                          : 'bg-gray-800 text-white'
                      }`}
                    >
                      {idx === messages.length - 1 && msg.role === 'ai' && isTyping ? (
                        <TypingText text={msg.text} />
                      ) : (
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isTyping && messages[messages.length - 1]?.role === 'user' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Suggested Questions */}
        <div className="order-1 md:order-2">
          <h3 className="text-xl font-semibold mb-4 text-white">
            Clique sur une question pour tester :
          </h3>
          <div className="space-y-3">
            {suggestedQuestions.map((item, idx) => (
              <motion.button
                key={idx}
                onClick={() => handleQuestionClick(item.q, item.a)}
                disabled={isTyping}
                whileHover={{ scale: isTyping ? 1 : 1.02 }}
                whileTap={{ scale: isTyping ? 1 : 0.98 }}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedQuestion === item.q
                    ? 'border-[#e31fc1] bg-[#e31fc1]/10'
                    : isTyping
                    ? 'border-gray-800 bg-gray-900/50 cursor-not-allowed opacity-50'
                    : 'border-gray-800 bg-gray-900 hover:border-[#e31fc1] hover:bg-[#e31fc1]/5'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Send className="w-5 h-5 text-[#e31fc1] flex-shrink-0 mt-0.5" />
                  <p className="text-white text-sm leading-relaxed">{item.q}</p>
                </div>
              </motion.button>
            ))}
          </div>

          <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-[#e31fc1]/10 via-[#ff6b9d]/10 to-[#ffc0cb]/10 border border-[#e31fc1]/20">
            <p className="text-xs text-gray-400 leading-relaxed">
              💡 Cette démo montre comment ton double IA pourrait répondre.
              Le vrai double sera personnalisé avec ton style unique !
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreerMonDoubleIA() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      {/* HERO SECTION */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full pt-24 pb-16 bg-black text-white"
      >
        <div className="max-w-5xl mx-auto px-6 text-center">
          {/* TITRE PRINCIPAL */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-4xl md:text-6xl font-bold leading-tight"
          >
            Crée ton{" "}
            <span className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-transparent">
              double IA
            </span>
            <br />
            gratuitement
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="mt-6 text-gray-300 text-lg md:text-xl max-w-2xl mx-auto"
          >
            Imagine un assistant IA qui parle comme toi, pense comme toi,
            et peut t'aider à gérer tes messages, créer du contenu et développer ton influence.
          </motion.p>

          {/* BOUTONS CTA */}
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            >
              <Link
                href="/onboarding-ia"
                className="inline-block px-8 py-4 rounded-lg text-white font-semibold bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] hover:scale-105 transition-transform"
              >
                Commencer gratuitement →
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
            >
              <Link
                href="/"
                className="inline-block px-8 py-4 rounded-lg text-white font-semibold border border-gray-700 hover:bg-gray-900 transition-colors"
              >
                Découvrir des exemples
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* MARQUEE */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="w-full bg-black py-10 overflow-hidden"
      >
        <div className="relative overflow-hidden">
          <div className="marquee-track gap-24 text-5xl md:text-7xl font-bold
                          bg-clip-text text-transparent
                          bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb]
                          drop-shadow-[0_0_20px_#e31fc1aa]"
          >
            <span>Simple • Gratuit • Personnalisé</span>
            <span>Simple • Gratuit • Personnalisé</span>
            <span>Simple • Gratuit • Personnalisé</span>
            <span>Simple • Gratuit • Personnalisé</span>
            <span>Simple • Gratuit • Personnalisé</span>
            <span>Simple • Gratuit • Personnalisé</span>
          </div>
        </div>
      </motion.section>

      {/* SECTION — COMMENT ÇA MARCHE */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="relative w-full py-20 bg-black text-white"
      >
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold leading-tight"
          >
            Comment ça marche ?
          </motion.h2>

          <div className="mt-12 space-y-12 text-left">
            {/* Étape 1 */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              viewport={{ once: true }}
              className="flex gap-6 items-start"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] flex items-center justify-center text-2xl font-bold">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Crée ton compte gratuitement</h3>
                <p className="text-gray-300 leading-relaxed">
                  Inscris-toi en quelques secondes. Aucune carte bancaire requise,
                  aucun engagement.
                </p>
              </div>
            </motion.div>

            {/* Étape 2 */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
              viewport={{ once: true }}
              className="flex gap-6 items-start"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] flex items-center justify-center text-2xl font-bold">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Entraîne ton IA avec ta personnalité</h3>
                <p className="text-gray-300 leading-relaxed">
                  Partage quelques messages vocaux et écris quelques phrases pour
                  que l'IA apprenne ton style, ton ton et tes expressions.
                </p>
              </div>
            </motion.div>

            {/* Étape 3 */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
              viewport={{ once: true }}
              className="flex gap-6 items-start"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] flex items-center justify-center text-2xl font-bold">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Ton double IA est prêt !</h3>
                <p className="text-gray-300 leading-relaxed">
                  Utilise ton double IA pour répondre aux messages,
                  créer du contenu ou simplement discuter comme si c'était toi.
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          whileInView={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true }}
          className="relative w-full flex justify-center my-10 overflow-visible"
        >
          <div
            className="
              h-[2px]
              w-48 md:w-80 lg:w-[520px]
              bg-white rounded-full
              shadow-[0_0_20px_rgba(255,255,255,0.6)]
              translate-y-[76px] md:translate-y-[80px]
            "
          />
        </motion.div>
      </motion.section>

      {/* SECTION — BÉNÉFICES */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="w-full pt-20 pb-16 bg-black text-white"
      >
        <div className="max-w-7xl mx-auto px-6">
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-center mb-12"
          >
            Pourquoi créer ton{" "}
            <span className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-transparent">
              double IA ?
            </span>
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Carte 1 */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
              viewport={{ once: true }}
              className="p-6 rounded-2xl bg-gradient-to-b from-gray-900 to-black border border-gray-800 hover:scale-105 transition-transform"
            >
              <div className="text-4xl mb-4">⏰</div>
              <h3 className="font-semibold text-xl mb-3">Gagne du temps</h3>
              <p className="text-gray-400">
                Ton IA répond pour toi pendant que tu te concentres sur ce qui compte vraiment.
              </p>
            </motion.div>

            {/* Carte 2 */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              viewport={{ once: true }}
              className="p-6 rounded-2xl bg-gradient-to-b from-gray-900 to-black border border-gray-800 hover:scale-105 transition-transform"
            >
              <div className="text-4xl mb-4">💬</div>
              <h3 className="font-semibold text-xl mb-3">Reste connecté 24/7</h3>
              <p className="text-gray-400">
                Ton audience peut te parler à tout moment, même quand tu dors.
              </p>
            </motion.div>

            {/* Carte 3 */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              viewport={{ once: true }}
              className="p-6 rounded-2xl bg-gradient-to-b from-gray-900 to-black border border-gray-800 hover:scale-105 transition-transform"
            >
              <div className="text-4xl mb-4">✨</div>
              <h3 className="font-semibold text-xl mb-3">100% personnalisé</h3>
              <p className="text-gray-400">
                L'IA apprend ton style, tes expressions, ton humour unique.
              </p>
            </motion.div>

            {/* Carte 4 */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
              viewport={{ once: true }}
              className="p-6 rounded-2xl bg-gradient-to-b from-gray-900 to-black border border-gray-800 hover:scale-105 transition-transform"
            >
              <div className="text-4xl mb-4">💰</div>
              <h3 className="font-semibold text-xl mb-3">Monétise ton influence</h3>
              <p className="text-gray-400">
                Transforme tes conversations en revenus passifs avec des abonnements.
              </p>
            </motion.div>

            {/* Carte 5 */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
              viewport={{ once: true }}
              className="p-6 rounded-2xl bg-gradient-to-b from-gray-900 to-black border border-gray-800 hover:scale-105 transition-transform"
            >
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="font-semibold text-xl mb-3">Sois innovant</h3>
              <p className="text-gray-400">
                Rejoins les premiers à avoir un double IA personnalisé.
              </p>
            </motion.div>

            {/* Carte 6 */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
              viewport={{ once: true }}
              className="p-6 rounded-2xl bg-gradient-to-b from-gray-900 to-black border border-gray-800 hover:scale-105 transition-transform"
            >
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="font-semibold text-xl mb-3">Contrôle total</h3>
              <p className="text-gray-400">
                Tu définis les règles, tu peux tout ajuster quand tu veux.
              </p>
            </motion.div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          whileInView={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true }}
          className="relative w-full flex justify-center my-10 overflow-visible"
        >
          <div
            className="
              h-[2px]
              w-48 md:w-80 lg:w-[520px]
              bg-white rounded-full
              shadow-[0_0_20px_rgba(255,255,255,0.6)]
              translate-y-[76px] md:translate-y-[114px]
            "
          />
        </motion.div>
      </motion.section>

      {/* SECTION — DÉMO INTERACTIVE */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="w-full py-20 bg-black text-white"
      >
        <div className="max-w-6xl mx-auto px-6">
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-center mb-4"
          >
            Teste ton{" "}
            <span className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-transparent">
              double IA
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            viewport={{ once: true }}
            className="text-gray-400 text-center text-base max-w-2xl mx-auto mb-12"
          >
            Interagis avec une démo pour voir comment ton double IA pourrait répondre
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            <InteractiveDemo />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          whileInView={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true }}
          className="relative w-full flex justify-center my-10 overflow-visible"
        >
          <div
            className="
              h-[2px]
              w-48 md:w-80 lg:w-[520px]
              bg-white rounded-full
              shadow-[0_0_20px_rgba(255,255,255,0.6)]
              translate-y-[76px] md:translate-y-[114px]
            "
          />
        </motion.div>
      </motion.section>

      {/* SECTION — FAQ */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="w-full pt-20 pb-16 bg-black text-white"
      >
        <div className="max-w-4xl mx-auto px-4 md:px-12">
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-center mb-4"
          >
            Questions{" "}
            <span className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-transparent">
              fréquentes
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            viewport={{ once: true }}
            className="text-gray-400 text-center text-sm md:text-base max-w-2xl mx-auto mb-10"
          >
            Tout ce que tu dois savoir avant de créer ton double IA.
          </motion.p>

          <div className="space-y-4">
            {[
              {
                q: "C'est vraiment gratuit ?",
                a: "Oui ! La création de ton double IA est 100% gratuite. Tu peux ensuite choisir de monétiser ton IA avec des abonnements payants, mais c'est totalement optionnel."
              },
              {
                q: "Combien de temps ça prend ?",
                a: "L'inscription prend moins de 2 minutes. L'entraînement de ton IA peut prendre quelques heures selon la quantité de données que tu fournis."
              },
              {
                q: "L'IA va-t-elle vraiment me ressembler ?",
                a: "Oui ! L'IA apprend de tes messages, de ton style d'écriture, de tes expressions favorites. Plus tu lui donnes d'exemples, plus elle sera précise."
              },
              {
                q: "Puis-je modifier mon IA après sa création ?",
                a: "Absolument ! Tu peux ajuster les règles, le ton, les sujets autorisés à tout moment depuis ton tableau de bord."
              },
              {
                q: "Mes données sont-elles en sécurité ?",
                a: "Oui. Toutes tes données sont chiffrées et sécurisées. Tu peux demander leur suppression à tout moment."
              },
              {
                q: "Que se passe-t-il si je veux arrêter ?",
                a: "Tu peux arrêter à tout moment et demander la suppression complète de ton compte et de tes données."
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
                viewport={{ once: true }}
              >
                <FAQItem question={item.q} answer={item.a} />
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* SECTION — CTA FINAL */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="w-full py-20 bg-black text-white"
      >
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold leading-tight mb-6"
          >
            Prêt à créer ton{" "}
            <span className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-transparent">
              double IA ?
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            viewport={{ once: true }}
            className="text-gray-300 text-lg mb-10"
          >
            Rejoins des milliers de créateurs qui utilisent déjà MyDouble.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            <Link
              href="/onboarding-ia"
              className="inline-block px-10 py-5 rounded-lg text-white text-lg font-bold bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] hover:scale-105 transition-transform"
            >
              Commencer gratuitement →
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
            viewport={{ once: true }}
            className="text-gray-500 text-sm mt-6"
          >
            Aucune carte bancaire requise • Gratuit pour toujours
          </motion.p>
        </div>
      </motion.section>
    </main>
  );
}
