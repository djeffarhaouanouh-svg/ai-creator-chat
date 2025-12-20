"use client";

import { useState, useRef, useEffect } from 'react';
import { X, Instagram, Camera } from 'lucide-react';

interface ShareToStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: {
    content: string;
    fan_nickname: string;
    created_at?: Date | string;
  };
  creatorName?: string;
  creatorUsername?: string;
}

export default function ShareToStoryModal({
  isOpen,
  onClose,
  message,
  creatorName = 'MyDouble',
  creatorUsername,
}: ShareToStoryModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const isMobile = typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      generateSticker();
    }
  }, [isOpen]);

  const generateSticker = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Taille optimale pour les stories (9:16)
    const width = 1080;
    const height = 1920;
    canvas.width = width;
    canvas.height = height;

    // Fond dégradé rose clair vers blanc (comme dans l'image)
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#fce7f3'); // Rose très clair
    gradient.addColorStop(0.3, '#fdf2f8');
    gradient.addColorStop(1, '#ffffff'); // Blanc
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Nom de l'utilisateur en noir (sans header rose séparé pour le sticker)
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 60px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(message.fan_nickname, width / 2, 250);

    // Date si disponible
    if (message.created_at) {
      const date = new Date(message.created_at);
      ctx.fillStyle = '#666666';
      ctx.font = '36px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        date.toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
        width / 2,
        350
      );
    }

    // Message avec gestion du retour à la ligne
    ctx.fillStyle = '#111827';
    ctx.font = '44px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const maxWidth = width - 200; // Marges plus grandes
    const x = width / 2;
    let y = 500; // Position après la date
    const words = message.content.split(' ');
    let line = '';
    const lineHeight = 70;

    words.forEach((word) => {
      const testLine = line + word + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;

      if (testWidth > maxWidth && line.length > 0) {
        ctx.fillText(line.trim(), x, y);
        line = word + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    });
    // Afficher la dernière ligne
    if (line.trim()) {
      ctx.fillText(line.trim(), x, y);
    }

    // Watermark en bas (plus discret)
    ctx.fillStyle = '#9ca3af';
    ctx.font = '28px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('mydouble', width / 2, height - 80);
  };

  const downloadSticker = () => {
    if (!canvasRef.current) return;

    canvasRef.current.toBlob((blob) => {
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `story-${message.fan_nickname}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
  };

  const shareToInstagram = async () => {
    if (!canvasRef.current) return;

    setIsGenerating(true);
    canvasRef.current.toBlob(async (blob) => {
      if (!blob) {
        setIsGenerating(false);
        return;
      }

      // Télécharger le sticker d'abord
      downloadSticker();

      if (isMobile && creatorUsername) {
        // Sur mobile, ouvrir Instagram avec le username du créateur
        const appLink = `instagram://user?username=${creatorUsername}`;
        const webLink = `https://www.instagram.com/${creatorUsername}/`;

        // Tentative d'ouverture de l'app
        window.location.href = appLink;

        // Fallback web après 600ms si l'app ne s'ouvre pas
        setTimeout(() => {
          window.location.href = webLink;
        }, 600);
      } else {
        // Sur desktop, juste télécharger
        setIsGenerating(false);
        setTimeout(() => {
          onClose();
        }, 300);
      }
    });
  };

  const shareToSnapchat = () => {
    if (!canvasRef.current) return;

    setIsGenerating(true);
    canvasRef.current.toBlob((blob) => {
      if (!blob) {
        setIsGenerating(false);
        return;
      }

      // Sur mobile et desktop, télécharger le sticker
      // L'utilisateur pourra l'importer dans Snapchat depuis sa galerie
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `snapchat-story-${message.fan_nickname}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => {
        URL.revokeObjectURL(url);
        setIsGenerating(false);
        onClose();
      }, 300);
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full relative overflow-hidden shadow-xl">
        {/* Header rose avec le nom du créateur (comme dans l'image) */}
        <div className="bg-pink-500 px-6 py-4 flex items-center justify-center relative">
          <h3 className="text-2xl font-bold text-white">
            {creatorName}
          </h3>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-200"
          >
            <X size={24} />
          </button>
        </div>

        {/* Contenu de la modal */}
        <div className="p-6">
          {/* Aperçu du sticker avec fond dégradé rose/blanc */}
          <div className="mb-6 rounded-xl overflow-hidden bg-gradient-to-b from-pink-100 via-pink-50 to-white p-4 flex justify-center shadow-inner">
            <div className="relative">
              <canvas 
                ref={canvasRef} 
                className="rounded-lg shadow-lg"
                style={{ 
                  width: '200px',
                  height: '355px',
                  imageRendering: 'high-quality'
                }}
              />
            </div>
          </div>

          {/* Boutons de partage */}
          <div className="space-y-3">
            <button
              onClick={shareToInstagram}
              disabled={isGenerating}
              className="w-full px-4 py-3 rounded-xl border-2 border-purple-500 text-purple-600 font-semibold hover:bg-purple-50 transition-all disabled:opacity-50 flex items-center justify-center gap-2 bg-white"
            >
              <Instagram size={20} />
              Instagram
            </button>

            <button
              onClick={shareToSnapchat}
              disabled={isGenerating}
              className="w-full px-4 py-3 rounded-xl border-2 border-yellow-400 text-yellow-600 font-semibold hover:bg-yellow-50 transition-all disabled:opacity-50 flex items-center justify-center gap-2 bg-white"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
              </svg>
              Snapchat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

