interface CohortData {
  cohort_week: string
  cohort_size: number
  retention: {
    day_1: { count: number; rate: string }
    day_7: { count: number; rate: string }
    day_14: { count: number; rate: string }
    day_30: { count: number; rate: string }
  }
}

interface CohortAnalysisProps {
  cohorts: CohortData[]
  retentionType: string
  onRetentionTypeChange: (type: 'classic' | 'rolling') => void
}

export default function CohortAnalysis({ cohorts, retentionType, onRetentionTypeChange }: CohortAnalysisProps) {
  const getColorForRate = (rate: string) => {
    const value = parseFloat(rate)
    if (value >= 40) return 'bg-green-100 text-green-800'
    if (value >= 20) return 'bg-yellow-100 text-yellow-800'
    if (value >= 10) return 'bg-orange-100 text-orange-800'
    return 'bg-red-100 text-red-800'
  }

  const getBarWidth = (rate: string) => {
    const value = parseFloat(rate)
    return Math.min(value, 100)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">📊 Analyse de cohortes - Rétention</h3>
            <p className="text-sm text-gray-600 mt-1">
              Taux de rétention par semaine d'inscription (12 dernières semaines)
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onRetentionTypeChange('classic')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                retentionType === 'classic'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Classic Retention
            </button>
            <button
              onClick={() => onRetentionTypeChange('rolling')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                retentionType === 'rolling'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Rolling Retention
            </button>
          </div>
        </div>

        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600">
            {retentionType === 'classic' ? (
              <>
                <strong>Classic Retention:</strong> Utilisateurs actifs exactement le jour J+N (ex: exactement 7 jours après l'inscription)
              </>
            ) : (
              <>
                <strong>Rolling Retention:</strong> Utilisateurs actifs au moins une fois à partir de J+N (plus stable et réaliste)
              </>
            )}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                Semaine d'inscription
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Taille cohorte
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                D+1
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                D+7
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                D+14
              </th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                D+30
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {cohorts.map((cohort, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-white hover:bg-gray-50 z-10">
                  <div className="text-sm font-medium text-gray-900">
                    {new Date(cohort.cohort_week).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="text-sm font-bold text-gray-900">{cohort.cohort_size}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col items-center gap-1">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getColorForRate(cohort.retention.day_1.rate)}`}>
                      {cohort.retention.day_1.rate}%
                    </span>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 max-w-[80px]">
                      <div
                        className="bg-purple-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${getBarWidth(cohort.retention.day_1.rate)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">
                      {cohort.retention.day_1.count}/{cohort.cohort_size}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col items-center gap-1">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getColorForRate(cohort.retention.day_7.rate)}`}>
                      {cohort.retention.day_7.rate}%
                    </span>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 max-w-[80px]">
                      <div
                        className="bg-purple-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${getBarWidth(cohort.retention.day_7.rate)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">
                      {cohort.retention.day_7.count}/{cohort.cohort_size}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col items-center gap-1">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getColorForRate(cohort.retention.day_14.rate)}`}>
                      {cohort.retention.day_14.rate}%
                    </span>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 max-w-[80px]">
                      <div
                        className="bg-purple-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${getBarWidth(cohort.retention.day_14.rate)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">
                      {cohort.retention.day_14.count}/{cohort.cohort_size}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col items-center gap-1">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getColorForRate(cohort.retention.day_30.rate)}`}>
                      {cohort.retention.day_30.rate}%
                    </span>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 max-w-[80px]">
                      <div
                        className="bg-purple-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${getBarWidth(cohort.retention.day_30.rate)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">
                      {cohort.retention.day_30.count}/{cohort.cohort_size}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {cohorts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-sm">Aucune donnée de cohorte disponible</p>
        </div>
      )}
    </div>
  )
}
