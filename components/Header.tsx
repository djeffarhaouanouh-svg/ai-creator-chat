 "use client";

import { useState } from "react";
import Link from "next/link";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-black border-b border-gray-900 sticky top-0 z-50">
      {/* BARRE TOP */}
      <div className="flex justify-between items-center h-16 px-4">

        {/* BURGER */}
        <button
          onClick={() => setIsMenuOpen((s) => !s)}
          className="text-white p-2"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {/* LOGO */}
        <Link href="/" className="text-2xl font-bold text-white">
          AI Creator Chat
        </Link>

        {/* BOUTON CONNEXION */}
        <Link
          href="/login"
          className="text-white border border-white px-4 py-2 rounded-md"
        >
          Connexion
        </Link>
      </div>

      {/* MENU FULL WIDTH */}
      <div
        className={`
          overflow-hidden transition-all duration-300 bg-black border-t border-gray-900
          ${isMenuOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}
        `}
      >
        <div className="px-4 py-3 space-y-2">

          <Link
            href="/dashboard"
            className="block text-white w-full px-3 py-2"
            onClick={() => setIsMenuOpen(false)}
          >
            Mon compte
          </Link>

          <Link
            href="/"
            className="block text-white w-full px-3 py-2"
            onClick={() => setIsMenuOpen(false)}
          >
            Explorer
          </Link>

        </div>
      </div>
    </nav>
  );
}
