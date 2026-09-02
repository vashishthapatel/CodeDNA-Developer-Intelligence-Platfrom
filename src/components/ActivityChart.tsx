import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { ActivityPoint } from '../lib/types'
import { axisTick, glassTooltip, luxe } from '../lib/palette'

interface Props {
  data: ActivityPoint[]
}

export default function ActivityChart({ data }: Props) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="commitsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={luxe.ember} stopOpacity={0.42} />
              <stop offset="95%" stopColor={luxe.ember} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="prsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={luxe.burnt} stopOpacity={0.38} />
              <stop offset="95%" stopColor={luxe.burnt} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={luxe.hairline} />
          <XAxis
            dataKey="date"
            tick={axisTick}
            axisLine={{ stroke: luxe.axis }}
            tickLine={false}
          />
          <YAxis tick={axisTick} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={glassTooltip} />
          <Area
            type="monotone"
            dataKey="commits"
            stroke={luxe.ember}
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#commitsGradient)"
          />
          <Area
            type="monotone"
            dataKey="prs"
            stroke={luxe.burnt}
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#prsGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
