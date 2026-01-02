"use client";

import { useState } from "react";

export default function RecoverPaymentPage() {
  const [paypalOrderId, setPaypalOrderId] = useState("");
  const [userId, setUserId] = useState("");
  const [creatorSlug, setCreatorSlug] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/subscriptions/recover", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paypalOrderId: paypalOrderId.trim(),
          userId: userId.trim() || undefined,
          creatorSlug: creatorSlug.trim() || undefined,
          amount: amount ? parseFloat(amount) : undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || "Une erreur est survenue");
        setResult(data);
      }
    } catch (err: any) {
      setError(err.message || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
          <h1 className="text-3xl font-bold mb-2">Récupérer un paiement PayPal</h1>
          <p className="text-gray-400 mb-6">
            Utilisez cette page pour récupérer un paiement PayPal qui n'a pas été enregistré en base de données.
          </p>

          <form onSubmit={handleRecover} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                PayPal Order ID <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={paypalOrderId}
                onChange={(e) => setPaypalOrderId(e.target.value)}
                placeholder="Ex: 5O190127TN364715T"
                required
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                Vous pouvez trouver cet ID dans votre email de confirmation PayPal ou dans votre compte PayPal.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                User ID (UUID)
              </label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Ex: 123e4567-e89b-12d3-a456-426614174000"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                Optionnel si le paiement existe déjà. Requis pour créer un nouvel abonnement.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Creator Slug
              </label>
              <input
                type="text"
                value={creatorSlug}
                onChange={(e) => setCreatorSlug(e.target.value)}
                placeholder="Ex: lauryncrl"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                Optionnel si le paiement existe déjà. Requis pour créer un nouvel abonnement.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Montant (EUR)
              </label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Ex: 9.99"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              <p className="text-xs text-gray-400 mt-1">Optionnel</p>
            </div>

            <button
              type="submit"
              disabled={loading || !paypalOrderId}
              className="w-full px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Récupération en cours..." : "Récupérer le paiement"}
            </button>
          </form>

          {error && (
            <div className="mt-6 p-4 bg-red-900/50 border border-red-500 rounded-lg">
              <p className="text-red-200 font-semibold">Erreur</p>
              <p className="text-red-300">{error}</p>
            </div>
          )}

          {result && !error && (
            <div className="mt-6 p-4 bg-green-900/50 border border-green-500 rounded-lg">
              <p className="text-green-200 font-semibold mb-2">✅ Succès</p>
              <p className="text-green-300 mb-3">{result.message}</p>
              {result.paymentId && (
                <div className="text-sm text-gray-300 space-y-1">
                  <p>
                    <span className="font-semibold">Payment ID:</span> {result.paymentId}
                  </p>
                  {result.subscriptionId && (
                    <p>
                      <span className="font-semibold">Subscription ID:</span> {result.subscriptionId}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {result && result.error && (
            <div className="mt-6 p-4 bg-yellow-900/50 border border-yellow-500 rounded-lg">
              <p className="text-yellow-200 font-semibold mb-2">⚠️ Information</p>
              <p className="text-yellow-300">{result.message || result.error}</p>
              {result.paymentId && (
                <div className="text-sm text-gray-300 mt-2">
                  <p>
                    <span className="font-semibold">Payment ID existant:</span> {result.paymentId}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-700">
            <h2 className="text-lg font-semibold mb-3">Comment trouver le PayPal Order ID ?</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
              <li>Vérifiez votre email de confirmation PayPal</li>
              <li>Connectez-vous à votre compte PayPal</li>
              <li>Allez dans "Activité" ou "Historique des transactions"</li>
              <li>Cliquez sur la transaction concernée</li>
              <li>L'Order ID se trouve dans les détails de la transaction</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

