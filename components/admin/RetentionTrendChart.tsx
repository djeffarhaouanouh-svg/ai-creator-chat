interface RetentionTrend {
  week: string
  signups: number
  retention_d7: string
}

interface RetentionTrendChartProps {
  data: RetentionTrend[]
}

export default function RetentionTrendChart({ data }: RetentionTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Tendance de rétention D+7</h3>
        <div className="text-center py-12">
          <p className="text-gray-500 text-sm">Aucune donnée disponible</p>
        </div>
      </div>
    )
  }

  const maxSignups = Math.max(...data.map(d => d.signups))
  const maxRetention = Math.max(...data.map(d => parseFloat(d.retention_d7)))

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Tendance de rétention D+7</h3>
      <p className="text-sm text-gray-600 mb-6">
        Évolution de la rétention à J+7 et nombre d'inscriptions par semaine
      </p>

      <div className="relative h-64">
        {/* Axe Y - Rétention */}
        <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-gray-500">
          <span>{maxRetention.toFixed(0)}%</span>
          <span>{(maxRetention * 0.75).toFixed(0)}%</span>
          <span>{(maxRetention * 0.5).toFixed(0)}%</span>
          <span>{(maxRetention * 0.25).toFixed(0)}%</span>
          <span>0%</span>
        </div>

        {/* Axe Y secondaire - Inscriptions */}
        <div className="absolute right-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-gray-500 text-right">
          <span>{maxSignups}</span>
          <span>{Math.floor(maxSignups * 0.75)}</span>
          <span>{Math.floor(maxSignups * 0.5)}</span>
          <span>{Math.floor(maxSignups * 0.25)}</span>
          <span>0</span>
        </div>

        {/* Zone du graphique */}
        <div className="absolute left-16 right-16 top-0 bottom-8 border-l border-b border-gray-200">
          {/* Lignes de grille horizontales */}
          <div className="absolute inset-0">
            {[0, 25, 50, 75, 100].map((percent) => (
              <div
                key={percent}
                className="absolute w-full border-t border-gray-100"
                style={{ bottom: `${percent}%` }}
              />
            ))}
          </div>

          {/* Barres d'inscriptions */}
          <div className="absolute inset-0 flex items-end justify-around gap-1 px-2">
            {data.map((item, index) => {
              const barHeight = (item.signups / maxSignups) * 100
              return (
                <div
                  key={index}
                  className="flex-1 bg-purple-200 rounded-t hover:bg-purple-300 transition-colors relative group"
                  style={{ height: `${barHeight}%` }}
                >
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {item.signups} inscriptions
                  </div>
                </div>
              )
            })}
          </div>

          {/* Ligne de rétention */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <polyline
              points={data
                .map((item, index) => {
                  const x = ((index + 0.5) / data.length) * 100
                  const y = 100 - (parseFloat(item.retention_d7) / maxRetention) * 100
                  return `${x}%,${y}%`
                })
                .join(' ')}
              fill="none"
              stroke="#e31fc1"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {data.map((item, index) => {
              const x = ((index + 0.5) / data.length) * 100
              const y = 100 - (parseFloat(item.retention_d7) / maxRetention) * 100
              return (
                <g key={index}>
                  <circle
                    cx={`${x}%`}
                    cy={`${y}%`}
                    r="4"
                    fill="#e31fc1"
                    className="hover:r-6 transition-all cursor-pointer"
                  />
                </g>
              )
            })}
          </svg>
        </div>

        {/* Axe X - Dates */}
        <div className="absolute left-16 right-16 bottom-0 h-8 flex justify-around text-xs text-gray-500">
          {data.map((item, index) => (
            <span key={index} className="transform -rotate-45 origin-top-left whitespace-nowrap">
              {new Date(item.week).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'short'
              })}
            </span>
          ))}
        </div>
      </div>

      {/* Légende */}
      <div className="flex items-center justify-center gap-6 mt-8 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-purple-200 rounded"></div>
          <span className="text-sm text-gray-700">Inscriptions</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-pink-600 rounded"></div>
          <span className="text-sm text-gray-700">Rétention D+7</span>
        </div>
      </div>
    </div>
  )
}
