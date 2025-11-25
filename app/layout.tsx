// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Creator Chat - Discutez avec vos créatrices préférées",
  description: "Conversations personnalisées avec des créatrices via IA",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={`${inter.className} bg-black text-white pt-20`}>
        {/* HEADER FIXÉ */}
        <Header />

        {/* CONTENU */}
        {children}

        {/* FOOTER */}
        <footer className="bg-black border-t border-white/10 mt-20">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="grid md:grid-cols-3 gap-8">

              {/* Colonne 1 */}
              <div>
                <h3 className="text-xl font-bold text-white mb-4">AI Creator Chat</h3>
                <p className="text-white/60 text-sm">
                  Conversations personnalisées avec vos créatrices préférées, alimentées par l'IA.
                </p>
              </div>

              {/* Colonne 2 */}
              <div>
                <h4 className="text-white font-semibold mb-4">Pages légales</h4>
                <ul className="space-y-2 text-sm">
                  <li><a className="text-white/60 hover:text-white transition-colors">Mentions légales</a></li>
                  <li><a className="text-white/60 hover:text-white transition-colors">CGV</a></li>
                  <li><a className="text-white/60 hover:text-white transition-colors">Confidentialité</a></li>
                </ul>
              </div>

              {/* Colonne 3 */}
              <div>
                <h4 className="text-white font-semibold mb-4">Support</h4>
                <ul className="space-y-2 text-sm">
                  <li><a className="text-white/60 hover:text-white transition-colors">Contact</a></li>
                  <li><a className="text-white/60 hover:text-white transition-colors">FAQ</a></li>
                </ul>
              </div>

            </div>

            <div className="border-t border-white/10 mt-8 pt-8 text-center text-white/40 text-sm">
              © 2025 AI Creator Chat. Tous droits réservés.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
