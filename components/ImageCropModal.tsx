'use client'

import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'

type Point = { x: number; y: number }
type Area = { width: number; height: number; x: number; y: number }

interface ImageCropModalProps {
  image: string
  onComplete: (croppedImage: string) => void
  onCancel: () => void
  aspectRatio?: number
  title?: string
}

export default function ImageCropModal({
  image,
  onComplete,
  onCancel,
  aspectRatio = 1,
  title = 'Recadrer la photo'
}: ImageCropModalProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  const onCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels)
    },
    []
  )

  const handleComplete = async () => {
    try {
      if (!croppedAreaPixels) return

      // Créer un canvas pour recadrer l'image
      const img = new Image()
      img.src = image

      await new Promise((resolve) => {
        img.onload = resolve
      })

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      canvas.width = croppedAreaPixels.width
      canvas.height = croppedAreaPixels.height

      ctx.drawImage(
        img,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      )

      canvas.toBlob((blob) => {
        if (!blob) return
        const reader = new FileReader()
        reader.readAsDataURL(blob)
        reader.onloadend = () => {
          onComplete(reader.result as string)
        }
      }, 'image/jpeg', 0.95)
    } catch (error) {
      console.error('Erreur lors du recadrage:', error)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* En-tête simplifié */}
      <div className="bg-black p-4 flex items-center justify-between">
        <button
          onClick={onCancel}
          className="text-white hover:text-gray-300 font-semibold text-lg"
        >
          ✕
        </button>
        <h3 className="font-semibold text-white">{title}</h3>
        <div className="w-6"></div>
      </div>

      {/* Zone de recadrage */}
      <div className="flex-1 relative bg-black">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={aspectRatio}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          style={{
            containerStyle: {
              backgroundColor: '#000',
            },
          }}
        />
      </div>

      {/* Contrôles en bas */}
      <div className="bg-white p-6">
        {/* Slider de zoom */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Zoom</span>
            <span className="text-sm font-medium text-gray-900">
              {Math.round(zoom * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
          />
        </div>

        {/* Info */}
        <p className="text-xs text-gray-500 text-center mb-4">
          Pincez pour zoomer • Déplacez pour recadrer
        </p>

        {/* Boutons d'action */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all"
          >
            Annuler
          </button>
          <button
            onClick={handleComplete}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:opacity-90 transition-all"
          >
            Valider
          </button>
        </div>
      </div>
    </div>
  )
}
