'use client'

import { useEffect, useState } from 'react'

interface Story {
  id: string
  media_url: string
  media_type: 'image' | 'video'
  title?: string
  caption?: string
  created_at: string
  expires_at: string
}

interface StoryViewerProps {
  stories: Story[]
  initialIndex: number
  onClose: () => void
}

export default function StoryViewer({ stories, initialIndex, onClose }: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const currentStory = stories[currentIndex]
  const duration = currentStory.media_type === 'video' ? 15000 : 5000 // 15s pour vidéo, 5s pour image

  useEffect(() => {
    if (isPaused) return

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Passer à la story suivante
          if (currentIndex < stories.length - 1) {
            setCurrentIndex(currentIndex + 1)
            return 0
          } else {
            // Fermer le viewer si c'est la dernière story
            onClose()
            return 100
          }
        }
        return prev + (100 / (duration / 100))
      })
    }, 100)

    return () => clearInterval(interval)
  }, [currentIndex, isPaused, duration, stories.length, onClose])

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setProgress(0)
    }
  }

  const goToNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setProgress(0)
    } else {
      onClose()
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'ArrowLeft') goToPrevious()
    if (e.key === 'ArrowRight') goToNext()
  }

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex])

  const getTimeAgo = (dateString: string) => {
    const now = new Date()
    const created = new Date(dateString)
    const diff = now.getTime() - created.getTime()

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 0) return `Il y a ${hours}h`
    if (minutes > 0) return `Il y a ${minutes}min`
    return 'À l\'instant'
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black flex items-center justify-center">
      {/* Barres de progression */}
      <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 p-2">
        {stories.map((_, index) => (
          <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-100"
              style={{
                width: index < currentIndex ? '100%' : index === currentIndex ? `${progress}%` : '0%'
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-4 left-0 right-0 z-10 flex items-center justify-between px-4 pt-4">
        <div className="flex items-center gap-2 text-white">
          <div className="text-sm font-semibold">{currentStory.title || 'Story'}</div>
          <div className="text-xs opacity-75">{getTimeAgo(currentStory.created_at)}</div>
        </div>
        <button
          onClick={onClose}
          className="text-white text-2xl font-bold hover:opacity-75 transition"
        >
          ✕
        </button>
      </div>

      {/* Navigation zones */}
      <div className="absolute inset-0 flex">
        <div className="flex-1 cursor-pointer" onClick={goToPrevious} />
        <div className="flex-1 cursor-pointer" onClick={goToNext} />
      </div>

      {/* Contenu de la story */}
      <div
        className="relative w-full max-w-md h-full flex items-center justify-center"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {currentStory.media_type === 'video' ? (
          <video
            key={currentStory.id}
            src={currentStory.media_url}
            className="w-full h-full object-contain"
            autoPlay
            loop={false}
            muted
          />
        ) : (
          <img
            key={currentStory.id}
            src={currentStory.media_url}
            alt={currentStory.title || 'Story'}
            className="w-full h-full object-contain"
          />
        )}

        {/* Caption */}
        {currentStory.caption && (
          <div className="absolute bottom-20 left-0 right-0 px-4">
            <div className="bg-black/50 backdrop-blur-sm text-white px-4 py-3 rounded-lg">
              {currentStory.caption}
            </div>
          </div>
        )}
      </div>

      {/* Boutons de navigation mobile */}
      <div className="absolute bottom-20 left-0 right-0 flex justify-center gap-4 px-4 md:hidden">
        <button
          onClick={goToPrevious}
          disabled={currentIndex === 0}
          className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white disabled:opacity-30"
        >
          ←
        </button>
        <button
          onClick={goToNext}
          className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white"
        >
          →
        </button>
      </div>
    </div>
  )
}
