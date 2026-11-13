import { useState } from 'react'
import { getSalesReport } from '../../api/admin.js'
import ColumnChart from '../../components/admin/ColumnChart.jsx'
import { Card, ErrorBox, Loading, PageHeader } from '../../components/admin/ui.jsx'
import useLoad from '../../hooks/useLoad.js'
import formatPrice from '../../utils/formatPrice.js'

/** Words and labels for each period. */
const PERIODS = {
  DAY: {
    tab: 'Daily', current: 'Today', previous: 'yesterday', range: 'Last 30 days', labelEvery: 5,
    label: (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    long: (d) => d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
  },
  WEEK: {
    tab: 'Weekly', current: 'This week', previous: 'last week', range: 'Last 12 weeks', labelEvery: 2,
    label: (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    long: (d) => `Week of ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`,
  },
  MONTH: {
    tab: 'Monthly', current: 'This month', previous: 'last month', range: 'Last 12 months', labelEvery: 1,
    label: (d) => d.toLocaleDateString('en-GB', { month: 'short' }),
    long: (d) => d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
  },
}

/** "2026-11-09" -> a date (read as a plain calendar day, no time-zone shift) */
const toDate = (iso) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const compactMoney = (v) => (v >= 1000 ? `$${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}K` : `$${Math.round(v)}`)

export default function Reports() {
  const [period, setPeriod] = useState('DAY')
  const [measure, setMeasure] = useState('sales') // 'sales' or 'orders'
  const { data: report, error, loading } = useLoad(() => getSalesReport(period), [period])
  const words = PERIODS[period]

  const chartData = (report?.buckets ?? []).map((b) => {
    const date = toDate(b.start)
    return {
      key: b.start,
      label: words.label(date),
      tooltipLabel: `${words.long(date)} · ${b.orders} ${b.orders === 1 ? 'order' : 'orders'}`,
      value: measure === 'sales' ? Number(b.sales) : b.orders,
    }
  })

  return (
    <>
      <PageHeader title="Sales report" subtitle="Only shipped and delivered orders are counted · times in Lebanon time" />

      {/* Filters: one row, above everything */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Toggle options={Object.entries(PERIODS).map(([k, v]) => [k, v.tab])} value={period} onChange={setPeriod} />
        <Toggle options={[['sales', 'Sales ($)'], ['orders', 'Orders']]} value={measure} onChange={setMeasure} />
      </div>

      <ErrorBox message={error} />
      {loading && !report && <Loading />}

      {report && (
        <div className={loading ? 'opacity-60 transition-opacity' : ''}>
          {/* This period vs the previous one */}
          <div className="grid gap-4 sm:grid-cols-3">
            <StatTile label={`Sales · ${words.current.toLowerCase()}`} value={formatPrice(report.current.sales)}
              now={Number(report.current.sales)} before={Number(report.previous.sales)} vs={words.previous} />
            <StatTile label={`Orders · ${words.current.toLowerCase()}`} value={report.current.orders}
              now={report.current.orders} before={report.previous.orders} vs={words.previous} />
            <StatTile label={`Average order · ${words.current.toLowerCase()}`} value={formatPrice(report.current.averageOrder)}
              now={Number(report.current.averageOrder)} before={Number(report.previous.averageOrder)} vs={words.previous} />
          </div>

          {/* Chart */}
          <Card className="mt-6">
            <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-2xl">
                {measure === 'sales' ? 'Sales' : 'Orders'} <span className="text-mulberry/50">· {words.range.toLowerCase()}</span>
              </h2>
              <p className="text-sm text-mulberry/70">
                Total: <strong>{formatPrice(report.total.sales)}</strong> · {report.total.orders} orders · {report.total.items} pieces
              </p>
            </div>
            <ColumnChart
              data={chartData}
              labelEvery={words.labelEvery}
              formatValue={measure === 'sales' ? (v) => formatPrice(v) : (v) => `${v} ${v === 1 ? 'order' : 'orders'}`}
              formatTick={measure === 'sales' ? compactMoney : (v) => (Number.isInteger(v) ? String(v) : '')}
            />
          </Card>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
            {/* The same numbers as a table (newest first) */}
            <Card className="overflow-x-auto p-0">
              <table className="w-full min-w-[420px] text-left text-sm">
                <thead className="border-b border-gold-light/70 text-xs uppercase tracking-wider text-mulberry/60">
                  <tr>
                    <th className="px-5 py-3">{period === 'DAY' ? 'Day' : period === 'WEEK' ? 'Week' : 'Month'}</th>
                    <th className="px-5 py-3 text-right">Orders</th>
                    <th className="px-5 py-3 text-right">Pieces</th>
                    <th className="px-5 py-3 text-right">Sales</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold-light/50">
                  {[...report.buckets].reverse().map((b) => (
                    <tr key={b.start} className={b.orders === 0 ? 'text-mulberry/40' : ''}>
                      <td className="px-5 py-2.5">{words.long(toDate(b.start))}</td>
                      <td className="px-5 py-2.5 text-right">{b.orders}</td>
                      <td className="px-5 py-2.5 text-right">{b.items}</td>
                      <td className="px-5 py-2.5 text-right font-medium">{formatPrice(b.sales)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            {/* Best sellers in the whole range */}
            <Card className="h-fit">
              <h2 className="font-display text-2xl">Best sellers</h2>
              <p className="text-xs text-mulberry/60">{words.range} · by pieces sold</p>
              {report.topProducts.length === 0 ? (
                <p className="mt-4 text-sm text-mulberry/60">No sales in this period yet.</p>
              ) : (
                <ol className="mt-4 space-y-3 text-sm">
                  {report.topProducts.map((p, i) => (
                    <li key={p.name} className="flex items-baseline gap-3">
                      <span className="w-4 text-mulberry/40">{i + 1}</span>
                      <span className="flex-1">{p.name}</span>
                      <span className="text-right">
                        <span className="font-medium">{p.quantity} pcs</span>
                        <span className="block text-xs text-mulberry/60">{formatPrice(p.sales)}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </Card>
          </div>
        </div>
      )}
    </>
  )
}

/** A row of connected buttons, one selected. */
function Toggle({ options, value, onChange }) {
  return (
    <div className="inline-flex rounded-full border border-gold-light bg-white/70 p-1">
      {options.map(([key, label]) => (
        <button key={key} type="button" onClick={() => onChange(key)}
          className={`rounded-full px-4 py-1.5 text-sm transition ${
            value === key ? 'bg-mulberry text-cream' : 'text-mulberry hover:text-gold'
          }`}>
          {label}
        </button>
      ))}
    </div>
  )
}

/** A big number with "+12% vs last week" underneath. */
function StatTile({ label, value, now, before, vs }) {
  let change = null
  if (before > 0) {
    const pct = Math.round(((now - before) / before) * 100)
    change = { text: `${pct > 0 ? '▲ +' : pct < 0 ? '▼ ' : ''}${pct}% vs ${vs}`, up: pct > 0, down: pct < 0 }
  } else if (now > 0) {
    change = { text: `▲ new vs ${vs} (0)`, up: true, down: false }
  }
  return (
    <Card>
      <p className="text-xs uppercase tracking-wider text-mulberry/60">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold">{value}</p>
      <p className={`mt-1 text-xs ${change?.up ? 'text-green-800' : change?.down ? 'text-red-700' : 'text-mulberry/50'}`}>
        {change ? change.text : `No change vs ${vs}`}
      </p>
    </Card>
  )
}
