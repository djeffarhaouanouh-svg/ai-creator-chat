// components/admin/StatsCard.tsx
interface StatsCardProps {
  title: string
  value: string | number
  icon: string
  trend?: {
    value: number
    isPositive: boolean
  }
  subtitle?: string
}

export default function StatsCard({ title, value, icon, trend, subtitle }: StatsCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="text-3xl">{icon}</div>
        {trend && (
          <span className={`text-sm font-semibold ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      
      <div className="space-y-1">
        <p className="text-gray-500 text-sm font-medium">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  )
}
