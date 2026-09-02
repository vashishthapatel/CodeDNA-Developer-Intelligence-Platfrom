import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts'
import type { Skill } from '../lib/types'
import { luxe } from '../lib/palette'

interface Props {
  data: Skill[]
}

export default function DnaRadar({ data }: Props) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <defs>
            <linearGradient id="radarFill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={luxe.emberPale} stopOpacity={0.45} />
              <stop offset="100%" stopColor={luxe.burnt} stopOpacity={0.22} />
            </linearGradient>
          </defs>
          <PolarGrid stroke="rgba(255,255,255,0.08)" />
          <PolarAngleAxis
            dataKey="name"
            tick={{ fill: luxe.inkMuted, fontSize: 11, fontWeight: 500 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fill: luxe.inkFaint, fontSize: 9 }}
            tickCount={4}
          />
          <Radar
            name="Skill"
            dataKey="value"
            stroke={luxe.ember}
            fill="url(#radarFill)"
            fillOpacity={1}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
