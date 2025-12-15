interface ActivityMetrics {
  active_users_7d: number
  active_users_30d: number
  avg_sessions_per_user: string
  avg_messages_per_user: string
}

interface ValueMetrics {
  conversion_rate: string
  churn_rate: string
  avg_days_to_subscribe: string
  reactivated_users: number
}

interface MetricsGridProps {
  activityMetrics: ActivityMetrics
  valueMetrics: ValueMetrics
}

export default function MetricsGrid({ activityMetrics, valueMetrics }: MetricsGridProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ACTIVITY METRICS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Métriques d'activité</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-600">Utilisateurs actifs (7j)</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {activityMetrics.active_users_7d}
              </p>
            </div>
            <div className="text-4xl">📱</div>
          </div>

          <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-600">Utilisateurs actifs (30j)</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {activityMetrics.active_users_30d}
              </p>
            </div>
            <div className="text-4xl">👥</div>
          </div>

          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-600">Sessions moy. par utilisateur</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {activityMetrics.avg_sessions_per_user}
                <span className="text-sm text-gray-500 ml-1">jours</span>
              </p>
            </div>
            <div className="text-4xl">📊</div>
          </div>

          <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-600">Messages moy. par utilisateur</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {activityMetrics.avg_messages_per_user}
              </p>
            </div>
            <div className="text-4xl">💬</div>
          </div>
        </div>
      </div>

      {/* VALUE METRICS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">💰 Métriques de valeur</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-600">Taux de conversion</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {valueMetrics.conversion_rate}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                % d'utilisateurs qui s'abonnent
              </p>
            </div>
            <div className="text-4xl">✅</div>
          </div>

          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-600">Taux de churn</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {valueMetrics.churn_rate}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                % d'abonnés qui annulent
              </p>
            </div>
            <div className="text-4xl">⚠️</div>
          </div>

          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-600">Délai moy. avant abonnement</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {valueMetrics.avg_days_to_subscribe}
                <span className="text-sm text-gray-500 ml-1">jours</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Temps avant 1er abonnement
              </p>
            </div>
            <div className="text-4xl">⏱️</div>
          </div>

          <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-600">Utilisateurs réactivés</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {valueMetrics.reactivated_users}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Abonnés revenus après churn
              </p>
            </div>
            <div className="text-4xl">🔄</div>
          </div>
        </div>
      </div>
    </div>
  )
}
