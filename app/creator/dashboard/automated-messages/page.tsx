'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CreateMessageModal from './CreateMessageModal';

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

export default function AutomatedMessagesPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<AutomatedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMessage, setEditingMessage] = useState<AutomatedMessage | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const creatorSlug = typeof window !== 'undefined' ? localStorage.getItem('creatorSlug') : null;

  useEffect(() => {
    if (creatorSlug) {
      loadMessages();
    }
  }, [creatorSlug]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/creator/automated-messages?creatorSlug=${creatorSlug}`);
      const data = await response.json();

      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error loading automated messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingMessage(null);
    setShowModal(true);
  };

  const handleEdit = (message: AutomatedMessage) => {
    setEditingMessage(message);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce message automatique ?')) {
      return;
    }

    try {
      setDeleting(id);
      const response = await fetch(`/api/creator/automated-messages/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadMessages();
      } else {
        alert('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Erreur lors de la suppression');
    } finally {
      setDeleting(null);
    }
  };

  const handleModalClose = async (saved: boolean) => {
    setShowModal(false);
    setEditingMessage(null);
    if (saved) {
      await loadMessages();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculer les stats
  const totalMessages = messages.length;
  const activeMessages = messages.filter(m => m.is_active).length;
  const totalSends = messages.reduce((sum, m) => sum + parseInt(m.send_count || '0'), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/creator/dashboard')}
            className="text-purple-600 hover:text-purple-800 mb-4 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour au dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Messages Automatiques</h1>
          <p className="text-gray-600 mt-2">Planifiez des messages personnalisés pour vos abonnés</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total messages</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{totalMessages}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Messages actifs</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{activeMessages}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total envois</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{totalSends}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Create Button */}
        <div className="mb-6">
          <button
            onClick={handleCreate}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Créer un message automatique
          </button>
        </div>

        {/* Messages List */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600"></div>
            <p className="text-gray-600 mt-4">Chargement...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <p className="text-gray-600 text-lg">Aucun message automatique</p>
            <p className="text-gray-500 mt-2">Créez votre premier message automatique pour engager vos abonnés</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Content Preview */}
                    <p className="text-gray-900 font-medium mb-3 line-clamp-2">
                      {message.content}
                    </p>

                    {/* Trigger Info */}
                    {message.trigger_type === 'scheduled' ? (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Envoi prévu le {formatDate(message.scheduled_at!)}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                        <span>Après {message.message_count_threshold} messages de l'utilisateur</span>
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Envoyé à {message.send_count} personne{parseInt(message.send_count) > 1 ? 's' : ''}</span>
                      {!message.is_active && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">Inactif</span>
                      )}
                    </div>

                    {/* Media Preview */}
                    {message.image_url && (
                      <div className="mt-3">
                        {message.image_type?.startsWith('video/') ? (
                          <video
                            src={message.image_url}
                            controls
                            preload="metadata"
                            playsInline
                            className="w-48 h-32 object-cover rounded-lg"
                          />
                        ) : (
                          <img
                            src={message.image_url}
                            alt="Preview"
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(message)}
                      className="px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(message.id)}
                      disabled={deleting === message.id}
                      className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {deleting === message.id ? 'Suppression...' : 'Supprimer'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <CreateMessageModal
          message={editingMessage}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
