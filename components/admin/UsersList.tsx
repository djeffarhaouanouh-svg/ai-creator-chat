interface User {
  id: string
  email: string
  name: string
  created_at: string
  is_active: boolean
  last_login: string | null
  last_message_at: string | null
  total_subscriptions: number
  total_messages: number
  total_spent: number
  active_days: number
  days_since_signup: number
  days_since_last_activity: number | null
  retention_rate: string
}

interface UsersListProps {
  users: User[]
  currentPage: number
  onPageChange: (page: number) => void
}

export default function UsersList({ users, currentPage, onPageChange }: UsersListProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">👥 Liste des utilisateurs</h3>
        <p className="text-sm text-gray-600 mt-1">Gérez tous les utilisateurs de la plateforme</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Utilisateur
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Abonnements
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Messages
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Dépenses
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Jours actifs
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Rétention
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Dernière activité
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Statut
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => {
              const daysSinceActivity = user.days_since_last_activity
              const isInactive = daysSinceActivity !== null && daysSinceActivity > 7
              const retentionValue = parseFloat(user.retention_rate)

              return (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4">
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      {user.total_subscriptions}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      {user.total_messages}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      {user.total_spent.toFixed(2)} €
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      {user.active_days}
                      <span className="text-xs text-gray-500 ml-1">
                        / {user.days_since_signup}j
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div
                        className={`text-sm font-bold ${
                          retentionValue >= 50
                            ? 'text-green-600'
                            : retentionValue >= 20
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}
                      >
                        {user.retention_rate}%
                      </div>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            retentionValue >= 50
                              ? 'bg-green-500'
                              : retentionValue >= 20
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(retentionValue, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {daysSinceActivity !== null ? (
                      <div className={`text-sm ${isInactive ? 'text-red-600 font-semibold' : 'text-gray-700'}`}>
                        Il y a {daysSinceActivity}j
                        {isInactive && (
                          <div className="text-xs text-red-500">⚠️ Inactif</div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500">Jamais</div>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {user.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-sm">Aucun utilisateur trouvé</p>
        </div>
      )}

      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Page {currentPage}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Précédent
          </button>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  )
}
