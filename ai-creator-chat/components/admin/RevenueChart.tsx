// components/admin/RevenueChart.tsx
'use client'

interface RevenueChartProps {
  data: Array<{
    date: string
    amount: number
  }>
}

export default function RevenueChart({ data }: RevenueChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">📈 Revenus (30 derniers jours)</h3>
        <p className="text-gray-400 text-center py-8">Aucune donnée disponible</p>
      </div>
    )
  }

  const maxAmount = Math.max(...data.map(d => d.amount))
  const total = data.reduce((sum, d) => sum + d.amount, 0)

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">📈 Revenus (30 derniers jours)</h3>
          <p className="text-2xl font-bold text-green-600 mt-1">{total.toFixed(2)} €</p>
        </div>
        <div className="text-sm text-gray-500">
          Moyenne: {(total / data.length).toFixed(2)} €/jour
        </div>
      </div>

      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="w-24 text-xs text-gray-500 font-medium">
              {item.date}
            </div>
            <div className="flex-1">
              <div className="bg-gray-100 rounded-full h-8 relative overflow-hidden">
                <div
                  className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full flex items-center justify-end pr-3 transition-all duration-500"
                  style={{ width: `${(item.amount / maxAmount) * 100}%` }}
                >
                  <span className="text-white text-xs font-semibold">
                    {item.amount.toFixed(2)} €
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
