'use client';

import { useState, useEffect } from 'react';

interface AutomatedMessage {
  id: string;
  content: string;
  image_url?: string;
  image_type?: string;
  trigger_type: 'scheduled' | 'message_count';
  scheduled_at?: string;
  message_count_threshold?: number;
  is_active: boolean;
  send_count: string;
}

interface CreateMessageModalProps {
  message?: AutomatedMessage | null;
  onClose: (saved: boolean) => void;
}

export default function CreateMessageModal({ message, onClose }: CreateMessageModalProps) {
  const [triggerType, setTriggerType] = useState<'scheduled' | 'message_count'>(
    message?.trigger_type || 'scheduled'
  );
  const [content, setContent] = useState(message?.content || '');
  const [scheduledAt, setScheduledAt] = useState('');
  const [messageCount, setMessageCount] = useState(message?.message_count_threshold || 1);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(message?.image_url || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const creatorSlug = typeof window !== 'undefined' ? localStorage.getItem('creatorSlug') : null;

  useEffect(() => {
    // Format scheduled_at for datetime-local input
    if (message?.scheduled_at) {
      const date = new Date(message.scheduled_at);
      const localDatetime = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setScheduledAt(localDatetime);
    }
  }, [message]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isVideo = file.type.startsWith('video/');
      const maxSize = isVideo ? 200 * 1024 * 1024 : 50 * 1024 * 1024; // 200MB pour vidéos, 50MB pour images

      if (file.size > maxSize) {
        const maxSizeMB = isVideo ? '200MB' : '50MB';
        setError(`Le fichier ne doit pas dépasser ${maxSizeMB}`);
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<{ url: string; type: string } | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.url) {
        return {
          url: data.url,
          type: file.type
        };
      }
      return null;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!content.trim()) {
      setError('Le contenu du message est requis');
      return;
    }

    if (triggerType === 'scheduled') {
      if (!scheduledAt) {
        setError('La date et l\'heure sont requises pour un message planifié');
        return;
      }

      const scheduledDate = new Date(scheduledAt);
      if (scheduledDate <= new Date()) {
        setError('La date doit être dans le futur');
        return;
      }
    }

    if (triggerType === 'message_count') {
      if (messageCount <= 0) {
        setError('Le nombre de messages doit être supérieur à 0');
        return;
      }
    }

    try {
      setSaving(true);

      // Upload image if new file selected
      let imageUrl = message?.image_url;
      let imageType = message?.image_type;

      if (imageFile) {
        const uploadResult = await uploadImage(imageFile);
        if (uploadResult) {
          imageUrl = uploadResult.url;
          imageType = uploadResult.type;
        } else {
          setError('Erreur lors de l\'upload de l\'image (le message sera sauvegardé sans image)');
        }
      }

      // Prepare request body
      const body = {
        creatorSlug,
        content: content.trim(),
        imageUrl,
        imageType,
        triggerType,
        scheduledAt: triggerType === 'scheduled' ? new Date(scheduledAt).toISOString() : undefined,
        messageCountThreshold: triggerType === 'message_count' ? messageCount : undefined,
      };

      // Create or update
      const url = message
        ? `/api/creator/automated-messages/${message.id}`
        : '/api/creator/automated-messages';

      const method = message ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        onClose(true);
      } else {
        setError(data.error || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Error saving message:', error);
      setError('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {message ? 'Modifier le message' : 'Créer un message automatique'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Trigger Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Quand envoyer ce message ?
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setTriggerType('scheduled')}
                className={`p-4 border-2 rounded-xl transition-all ${
                  triggerType === 'scheduled'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-semibold text-gray-900">À une date précise</span>
                  <span className="text-xs text-gray-500">Envoi unique à une date/heure</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTriggerType('message_count')}
                className={`p-4 border-2 rounded-xl transition-all ${
                  triggerType === 'message_count'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  <span className="font-semibold text-gray-900">Après X messages</span>
                  <span className="text-xs text-gray-500">Basé sur le nombre de messages</span>
                </div>
              </button>
            </div>
          </div>

          {/* Conditional Fields */}
          {triggerType === 'scheduled' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date et heure d'envoi
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required={triggerType === 'scheduled'}
              />
            </div>
          )}

          {triggerType === 'message_count' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de messages
              </label>
              <input
                type="number"
                min="1"
                value={messageCount}
                onChange={(e) => setMessageCount(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required={triggerType === 'message_count'}
              />
              <p className="text-xs text-gray-500 mt-1">
                Le message sera envoyé après que l'utilisateur ait envoyé {messageCount} message{messageCount > 1 ? 's' : ''}
              </p>
            </div>
          )}

          {/* Message Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contenu du message
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              placeholder="Écrivez votre message ici..."
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {content.length} caractères
            </p>
          </div>

          {/* Image/Video Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image ou vidéo (optionnel)
            </label>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleImageSelect}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Images: max 50MB (JPG, PNG, GIF) • Vidéos: max 200MB (MP4, MOV, etc.)
            </p>

            {imagePreview && (
              <div className="mt-3">
                {message?.image_type?.startsWith('video/') || imageFile?.type.startsWith('video/') ? (
                  <video
                    src={imagePreview}
                    controls
                    preload="metadata"
                    playsInline
                    className="max-w-xs rounded-lg shadow-md"
                  />
                ) : (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-w-xs rounded-lg shadow-md"
                  />
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Sauvegarde...' : (message ? 'Mettre à jour' : 'Créer')}
            </button>
            <button
              type="button"
              onClick={() => onClose(false)}
              disabled={saving}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
