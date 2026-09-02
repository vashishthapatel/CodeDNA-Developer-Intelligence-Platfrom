import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { QualityPoint } from '../lib/types'
import { axisTick, glassTooltip, luxe } from '../lib/palette'

interface Props {
  data: QualityPoint[]
}

export default function QualityChart({ data }: Props) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={luxe.hairline} />
          <XAxis
            dataKey="date"
            tick={axisTick}
            axisLine={{ stroke: luxe.axis }}
            tickLine={false}
          />
          <YAxis domain={[0, 100]} tick={axisTick} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={glassTooltip} />
          <Legend
            iconType="circle"
            iconSize={10}
            formatter={(value: string) => (
              <span className="text-sm text-ink-muted">{value}</span>
            )}
          />
          <Line
            type="monotone"
            dataKey="quality"
            stroke={luxe.ember}
            strokeWidth={2}
            dot={{ fill: luxe.ember, strokeWidth: 0, r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="coverage"
            stroke={luxe.apricot}
            strokeWidth={2}
            dot={{ fill: luxe.apricot, strokeWidth: 0, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
