"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";

export default function GoPage() {
  const params = useParams();
  const username = params.username as string;

  useEffect(() => {
    if (!username) return;

    const appLink = `instagram://user?username=${username}`;
    const webLink = `https://www.instagram.com/${username}/`;

    // Tentative ouverture app (comme Spotify)
    window.location.href = appLink;

    // Fallback web
    setTimeout(() => {
      window.location.href = webLink;
    }, 600);
  }, [username]);

  return (
    <div className="h-screen w-full bg-black flex items-center justify-center text-white">
      Redirection vers Instagram…
    </div>
  );
}




