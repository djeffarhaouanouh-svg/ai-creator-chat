'use client';

import { useEffect, useState } from 'react';

interface ChatProgressBarBottomProps {
  currentCount: number;
  maxCount?: number;
  rewardUnlocked: boolean;
}

export default function ChatProgressBarBottom({
  currentCount,
  maxCount = 100,
  rewardUnlocked
}: ChatProgressBarBottomProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  const [prevCount, setPrevCount] = useState(currentCount);

  const progress = Math.min((currentCount / maxCount) * 100, 100);

  // Animation de célébration quand on atteint 100
  useEffect(() => {
    if (currentCount >= maxCount && prevCount < maxCount) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
    }
    setPrevCount(currentCount);
  }, [currentCount, maxCount, prevCount]);

  // Ne rien afficher si la récompense est débloquée
  if (rewardUnlocked) {
    return null;
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Barre épaisse */}
      <div className="relative w-full h-1 bg-gray-200 rounded-full overflow-hidden">
        {/* Fond animé */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 opacity-50"
          style={{
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s linear infinite'
          }}
        />

        {/* Progress fill */}
        <div
          className={`
            absolute inset-y-0 left-0 rounded-full
            bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb]
            transition-all duration-500 ease-out
            ${showCelebration ? 'animate-pulse' : ''}
          `}
          style={{
            width: `${progress}%`,
            boxShadow: rewardUnlocked
              ? '0 0 15px rgba(227, 31, 193, 0.5)'
              : '0 0 8px rgba(227, 31, 193, 0.4)'
          }}
        >
          {/* Shine effect */}
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            style={{
              animation: 'slide 2s ease-in-out infinite',
              transform: 'skewX(-20deg)'
            }}
          />
        </div>
      </div>

      {/* Animation de célébration */}
      {showCelebration && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="text-6xl animate-bounce">
            🎉
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        @keyframes slide {
          0% { transform: translateX(-100%) skewX(-20deg); }
          100% { transform: translateX(400%) skewX(-20deg); }
        }
      `}</style>
    </div>
  );
}
