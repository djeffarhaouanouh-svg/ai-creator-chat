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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
       <head>
       {/* HOTJAR */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(h,o,t,j,a,r){
              h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
              h._hjSettings={hjid: VOTRE_ID_HOTJAR , hjsv: 6};
              a=o.getElementsByTagName('head')[0];
              r=o.createElement('script');r.async=1;
              r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
              a.appendChild(r);
            })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');`,
          }}
        />
        </head>
      <body className={`${inter.className} bg-black text-white`}>
    
        {/* WRAPPER CONTENU — padding pour compenser le header */}
        <div className="pt-20">
          {children}
        </div>

        {/* FOOTER */}
        <footer className="bg-black border-t border-white/10 mt-20">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="grid md:grid-cols-3 gap-8">

              {/* Colonne 1 */}
              <div>
                <h3 className="text-xl font-bold text-white mb-4">MyDouble</h3>
                <p className="text-white/60 text-sm">
                  Conversations personnalisées avec vos créatrices préférées, alimentées par l'IA.
                </p>
              </div>

              {/* Colonne 2 */}
              <div>
                <ul className="space-y-2 text-sm">
  <li>
    <a href="/mentions-legales" className="text-white/60 hover:text-white transition-colors">
      Mentions légales
    </a>
  </li>
  <li>
    <a href="/cgv" className="text-white/60 hover:text-white transition-colors">
      CGV
    </a>
  </li>
  <li>
    <a href="/confidentialite" className="text-white/60 hover:text-white transition-colors">
      Confidentialité
    </a>
  </li>
  <li>
    <a href="/cookies" className="text-white/60 hover:text-white transition-colors">
      Cookies
    </a>
  </li>
</ul>
              </div>
              {/* Colonne 3 */}
              <div>
                <h4 className="text-white font-semibold mb-4">Support</h4>
                <ul className="space-y-2 text-sm">
                  <li>
  <a href="/contact" className="text-white/60 hover:text-white transition-colors">
    Contact
  </a>
</li>
<li>
  <a href="/Faq" className="text-white/60 hover:text-white transition-colors">
    Faq
  </a>
</li>
                </ul>
              </div>

            </div>

            <div className="border-t border-white/10 mt-8 pt-8 text-center text-white/40 text-sm">
              © 2025 MyDouble. Tous droits réservés.
            </div>
          </div>
        </footer>

      </body>
    </html>
  );
}
