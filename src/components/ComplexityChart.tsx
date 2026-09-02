import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { ComplexityBar } from '../lib/types'
import { axisTick, glassTooltip, luxe } from '../lib/palette'

interface Props {
  data: ComplexityBar[]
}

export default function ComplexityChart({ data }: Props) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barGap={8}>
          <defs>
            <linearGradient id="complexityBar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={luxe.burnt} stopOpacity={0.95} />
              <stop offset="100%" stopColor={luxe.burnt} stopOpacity={0.35} />
            </linearGradient>
            <linearGradient id="maintainabilityBar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={luxe.emberPale} stopOpacity={0.95} />
              <stop offset="100%" stopColor={luxe.emberDeep} stopOpacity={0.35} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={luxe.hairline} />
          <XAxis
            dataKey="repo"
            tick={{ fill: luxe.inkMuted, fontSize: 11 }}
            axisLine={{ stroke: luxe.axis }}
            tickLine={false}
          />
          <YAxis domain={[0, 100]} tick={axisTick} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={glassTooltip} cursor={{ fill: 'rgba(255,140,52,0.06)' }} />
          <Legend
            iconType="circle"
            iconSize={10}
            formatter={(value: string) => (
              <span className="text-sm text-ink-muted">{value}</span>
            )}
          />
          <Bar dataKey="complexity" fill="url(#complexityBar)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="maintainability" fill="url(#maintainabilityBar)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
