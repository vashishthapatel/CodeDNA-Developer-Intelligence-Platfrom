import { useMemo } from 'react'
import type { HeatCell } from '../lib/types'
import { heatRamp } from '../lib/palette'

interface Props {
  /** One year of real contribution days, oldest first, from GitHub's calendar. */
  cells: HeatCell[]
}

/**
 * 'YYYY-MM-DD' as a *local* date. `new Date('2026-01-05')` is parsed as UTC
 * midnight, which lands on the previous day west of Greenwich and shifts the
 * whole grid by one row.
 */
function localDay(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function ActivityHeatmap({ cells }: Props) {
  const { weeks, labels } = useMemo(() => {
    const weeks: HeatCell[][] = []
    let week: HeatCell[] = []

    cells.forEach((cell, i) => {
      const date = localDay(cell.date)
      if (i === 0) {
        // Pad the first column so every row is a fixed weekday.
        for (let j = 0; j < date.getDay(); j++) week.push({ date: '', count: 0, level: 0 })
      }
      week.push(cell)
      if (date.getDay() === 6) {
        weeks.push(week)
        week = []
      }
    })
    if (week.length) weeks.push(week)

    // One label per column, blank unless that column opens a new month.
    let previous = -1
    const labels = weeks.map((w) => {
      const first = w.find((c) => c.date)
      if (!first) return ''
      const month = localDay(first.date).getMonth()
      if (month === previous) return ''
      previous = month
      return MONTHS[month]
    })

    return { weeks, labels }
  }, [cells])

  if (!cells.length) {
    return (
      <p className="text-sm text-ink-muted">
        GitHub returned no contribution calendar for this account.
      </p>
    )
  }

  return (
    <div className="h-scroll">
      <div className="min-w-max">
        <div className="flex gap-1 mb-2">
          {labels.map((label, i) => (
            <div
              key={i}
              className="w-[0.9rem] shrink-0 text-[0.55rem] uppercase tracking-luxe text-ink-faint"
            >
              {label}
            </div>
          ))}
        </div>
        <div className="flex gap-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1 shrink-0">
              {week.map((cell, di) => (
                <div
                  key={`${wi}-${di}`}
                  className="heat-cell"
                  style={{
                    backgroundColor: heatRamp[cell.level],
                    boxShadow:
                      cell.level >= 3 ? `0 0 10px -2px ${heatRamp[cell.level]}` : undefined,
                    transitionDelay: `${(wi % 12) * 12}ms`,
                  }}
                  title={
                    cell.date
                      ? `${cell.date}: ${cell.count} contribution${cell.count === 1 ? '' : 's'}`
                      : ''
                  }
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
