// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MyDouble - Discutez avec vos créatrices préférées",
  description: "Conversations personnalisées avec des créatrices via IA",
};

 export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={`${inter.className} bg-black text-white`}>
        <Header />

        {/* WRAPPER GLOBAL */}
        <div className="pt-20 min-h-screen flex flex-col">
          <main className="flex-1">
            {children}
          </main>

          {/* FOOTER */}
          <footer className="bg-black border-t border-white/10">
            <div className="max-w-7xl mx-auto px-4 py-12">
              <div className="grid md:grid-cols-3 gap-8">
                <div>
                  <h3 className="text-xl font-bold mb-4">MyDouble</h3>
                  <p className="text-white/60 text-sm">
                    Conversations personnalisées avec vos créatrices préférées, alimentées par l'IA.
                  </p>
                </div>

                <div>
                  <ul className="space-y-2 text-sm">
                    <li><a href="/mentions-legales" className="text-white/60 hover:text-white">Mentions légales</a></li>
                    <li><a href="/cgv" className="text-white/60 hover:text-white">CGV</a></li>
                    <li><a href="/confidentialite" className="text-white/60 hover:text-white">Confidentialité</a></li>
                    <li><a href="/cookies" className="text-white/60 hover:text-white">Cookies</a></li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-4">Support</h4>
                  <ul className="space-y-2 text-sm">
                    <li><a href="/contact" className="text-white/60 hover:text-white">Contact</a></li>
                    <li><a href="/Faq" className="text-white/60 hover:text-white">FAQ</a></li>
                  </ul>
                </div>
              </div>

              <div className="border-t border-white/10 mt-8 pt-8 text-center text-white/40 text-sm">
                © 2025 MyDouble. Tous droits réservés.
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
