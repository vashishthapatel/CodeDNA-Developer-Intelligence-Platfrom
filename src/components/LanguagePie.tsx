import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import type { LanguageSlice } from '../lib/types'
import { glassTooltip, series } from '../lib/palette'

interface Props {
  data: LanguageSlice[]
}

export default function LanguagePie({ data }: Props) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || series[index % series.length]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={glassTooltip}
            formatter={(value: number) => [`${value}%`, 'Share']}
          />
          <Legend
            verticalAlign="middle"
            align="right"
            layout="vertical"
            iconType="circle"
            iconSize={10}
            formatter={(value: string) => (
              <span className="text-sm text-ink-muted">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
