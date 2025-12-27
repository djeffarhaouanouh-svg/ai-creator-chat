// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import NavBar from "@/components/NavBar";

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
        <div className="pt-20 pb-20 min-h-screen flex flex-col">
          <main className="flex-1">
            {children}
          </main>
        </div>
        <NavBar />
      </body>
    </html>
  );
}
