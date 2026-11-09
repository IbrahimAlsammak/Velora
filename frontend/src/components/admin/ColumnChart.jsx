import { useState } from 'react'

/**
 * A simple column chart (one series), drawn with plain HTML - no chart library needed.
 *   data:        [{ key, label, tooltipLabel, value }]
 *   formatValue: how to show a number (e.g. "$120.00" or "3 orders")
 * Hover (or keyboard focus) on a column shows its exact value.
 */
export default function ColumnChart({ data, formatValue, formatTick = formatValue, labelEvery = 1, height = 240 }) {
  const [active, setActive] = useState(null)
  const max = niceMax(Math.max(0, ...data.map((d) => d.value)))
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => max * f)

  return (
    <div className="relative">
      <div className="flex">
        {/* Y axis labels */}
        <div className="relative mr-2 w-14 shrink-0 text-right text-[11px] text-mulberry/50" style={{ height }}>
          {ticks.map((t) => (
            <span key={t} className="absolute right-0 -translate-y-1/2" style={{ bottom: `${(t / max) * 100}%` }}>
              {formatTick(t)}
            </span>
          ))}
        </div>

        {/* Plot area */}
        <div className="relative flex-1" style={{ height }}>
          {/* Hairline gridlines */}
          {ticks.map((t) => (
            <div key={t} className="absolute inset-x-0 border-t border-mulberry/10" style={{ bottom: `${(t / max) * 100}%` }} />
          ))}

          {/* Columns */}
          <div className="absolute inset-0 flex items-end">
            {data.map((d, i) => {
              const pct = max === 0 ? 0 : (d.value / max) * 100
              const isActive = active === i
              return (
                <button
                  key={d.key}
                  type="button"
                  aria-label={`${d.tooltipLabel}: ${formatValue(d.value)}`}
                  onPointerEnter={() => setActive(i)}
                  onPointerLeave={() => setActive(null)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  className="group relative flex h-full flex-1 items-end justify-center outline-none"
                >
                  {/* Column: max 24px wide, 4px rounded top, square at the bottom */}
                  <span
                    className={`block w-[60%] max-w-6 rounded-t transition-colors ${
                      isActive ? 'bg-gold' : 'bg-mulberry'
                    } ${d.value > 0 ? 'min-h-0.5' : ''}`}
                    style={{ height: `${pct}%` }}
                  />
                </button>
              )
            })}
          </div>

          {/* Tooltip */}
          {active !== null && (
            <div
              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-gold-light bg-white px-3 py-2 text-xs shadow-sm"
              style={{
                left: `${((active + 0.5) / data.length) * 100}%`,
                bottom: `${Math.min(100, max === 0 ? 0 : (data[active].value / max) * 100)}%`,
                marginBottom: 8,
              }}
            >
              <p className="whitespace-nowrap text-sm font-semibold text-mulberry">{formatValue(data[active].value)}</p>
              <p className="whitespace-nowrap text-mulberry/60">{data[active].tooltipLabel}</p>
            </div>
          )}
        </div>
      </div>

      {/* X axis labels (only every Nth, so they don't overlap) */}
      <div className="ml-16 mt-2 flex text-[11px] text-mulberry/50">
        {data.map((d, i) => (
          <span key={d.key} className="flex-1 text-center">
            {i % labelEvery === 0 || i === data.length - 1 ? d.label : ''}
          </span>
        ))}
      </div>
    </div>
  )
}

/** A clean top for the axis: 0-1, 2, 5, 10, 20, 50, 100, 200... (never 0, so the chart can be drawn). */
function niceMax(value) {
  if (value <= 0) return 1
  const power = 10 ** Math.floor(Math.log10(value))
  const step = [1, 2, 2.5, 5, 10].find((s) => s * power >= value)
  return step * power
}
