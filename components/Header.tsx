"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
     <nav className="bg-black fixed top-0 left-0 w-full z-[999999] border-b border-gray-900">
      <div className="flex items-center justify-between h-16 px-4">

        {/* MENU BURGER */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="text-white p-2"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {/* TITRE / LOGO CENTRÉ */}
        <Link href="/" className="text-white font-bold text-xl text-center flex-1 ml-10">
          MyDouble
        </Link>

        {/* BOUTON CONNEXION */}
        <Link
          href="/login"
           className="text-white border border-white px-3 py-1.5 text-sm rounded-md whitespace-nowrap"
        >
          Connexion
        </Link>
      </div>

      {/* MENU DÉROULANT */}
      {isMenuOpen && (
        <div className="bg-black border-t border-gray-900 py-2">
          <Link
            href="/dashboard"
            className="block text-white px-4 py-2"
            onClick={() => setIsMenuOpen(false)}
          >
            Mon compte
          </Link>
          <Link
  href="/"
  className="block text-white px-4 py-2"
  onClick={() => setIsMenuOpen(false)}
>
  Découvrir
</Link>
<Link
  href="/pourquoi-nous-rejoindre"
  className="block text-white px-4 py-2"
  onClick={() => setIsMenuOpen(false)}
>
  Pourquoi nous rejoindre ?
</Link>
        </div>
      )}
    </nav>
  );
}
