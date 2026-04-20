import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  TooltipItem,
} from 'chart.js';
import React, { useMemo, useState, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import { Snapshot } from '../hooks/useSnapshots';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const METRICS = [
  { key: 'position' as const, label: 'Position', axis: 'y1', color: '#0dcaf0', format: 'shares' },
  { key: 'currentPrice' as const, label: 'Current Price', axis: 'y1', color: '#6f42c1', format: 'currency' },
  { key: 'marketValue' as const, label: 'Market Value', axis: 'y', color: '#0d6efd', format: 'currency' },
  { key: 'costBasis' as const, label: 'Cost Basis', axis: 'y', color: '#6c757d', format: 'currency', borderDash: [5, 5] as number[] },
  { key: 'unrealizedPnl' as const, label: 'Unrealized P&L', axis: 'y', color: '#198754', format: 'currency' },
  { key: 'portfolioPct' as const, label: '% of Portfolio', axis: 'y1', color: '#fd7e14', format: 'percent' },
];

type MetricKey = (typeof METRICS)[number]['key'];

interface DataPoint {
  label: string;
  position: number;
  currentPrice: number;
  marketValue: number;
  costBasis: number;
  unrealizedPnl: number;
  portfolioPct: number;
}

interface Props {
  snapshots: Snapshot[];
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);

const formatValue = (value: number, format: string) => {
  if (format === 'currency') return formatCurrency(value);
  if (format === 'percent') return `${value.toFixed(2)}%`;
  return value.toLocaleString('en-US', { maximumFractionDigits: 4 });
};

export const EvolutionDashboard: React.FC<Props> = ({ snapshots }) => {
  const allTickers = useMemo(() => {
    const set = new Set<string>();
    snapshots.forEach(s => s.portfolio.stocks.forEach(stock => set.add(stock.ticker)));
    return Array.from(set).sort();
  }, [snapshots]);

  const [selectedTicker, setSelectedTicker] = useState<string>(allTickers[0] ?? '');
  const [selectedMetrics, setSelectedMetrics] = useState<Set<MetricKey>>(
    new Set<MetricKey>(['marketValue', 'costBasis'])
  );
  const [fromDate, setFromDate] = useState<string>(snapshots[0]?.date ?? '');
  const [toDate, setToDate] = useState<string>(snapshots[snapshots.length - 1]?.date ?? '');

  const dataPoints = useMemo((): DataPoint[] => {
    return snapshots
      .filter(s => s.date >= fromDate && s.date <= toDate)
      .map(snapshot => {
        const stock = snapshot.portfolio.stocks.find(s => s.ticker === selectedTicker);
        if (!stock) return null;
        return {
          label: snapshot.label,
          position: stock.position,
          currentPrice: stock.currentPrice,
          marketValue: stock.marketValue,
          costBasis: stock.costBasis,
          unrealizedPnl: stock.marketValue - stock.costBasis,
          portfolioPct:
            snapshot.portfolio.totalValue > 0 ? (stock.marketValue / snapshot.portfolio.totalValue) * 100 : 0,
        };
      })
      .filter(Boolean) as DataPoint[];
  }, [snapshots, selectedTicker, fromDate, toDate]);

  const toggleMetric = (key: MetricKey) => {
    setSelectedMetrics(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const hasLeftAxis = useMemo(
    () => METRICS.some(m => m.axis === 'y' && selectedMetrics.has(m.key)),
    [selectedMetrics]
  );
  const hasRightAxis = useMemo(
    () => METRICS.some(m => m.axis === 'y1' && selectedMetrics.has(m.key)),
    [selectedMetrics]
  );

  const chartData = useMemo(() => ({
    labels: dataPoints.map(d => d.label),
    datasets: METRICS.filter(m => selectedMetrics.has(m.key)).map(m => ({
      label: m.label,
      data: dataPoints.map(d => d[m.key]),
      borderColor: m.color,
      backgroundColor: m.color + '20',
      tension: 0.3,
      fill: false,
      yAxisID: m.axis,
      borderDash: 'borderDash' in m ? m.borderDash : undefined,
      pointRadius: dataPoints.length > 24 ? 2 : 4,
      pointHoverRadius: 6,
    })),
  }), [dataPoints, selectedMetrics]);

  const tooltipLabel = useCallback((ctx: TooltipItem<'line'>) => {
    const metric = METRICS.find(m => m.label === ctx.dataset.label);
    const fmt = metric?.format ?? 'number';
    return ` ${ctx.dataset.label}: ${formatValue(ctx.parsed.y, fmt)}`;
  }, []);

  const rightAxisTick = useCallback((v: number | string) => {
    const rightMetrics = METRICS.filter(m => m.axis === 'y1' && selectedMetrics.has(m.key));
    if (rightMetrics.length === 1 && rightMetrics[0].format === 'percent') {
      return `${Number(v).toFixed(1)}%`;
    }
    return Number(v).toLocaleString('en-US', { maximumFractionDigits: 2 });
  }, [selectedMetrics]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: { position: 'top' as const },
      tooltip: {
        callbacks: { label: tooltipLabel },
      },
    },
    scales: {
      x: { ticks: { maxRotation: 45 } },
      y: {
        display: hasLeftAxis,
        position: 'left' as const,
        ticks: { callback: (v: number | string) => formatCurrency(Number(v)) },
        title: { display: true, text: 'USD Value' },
      },
      y1: {
        display: hasRightAxis,
        position: 'right' as const,
        grid: { drawOnChartArea: false },
        ticks: { callback: rightAxisTick },
        title: { display: true, text: 'Shares / Price / %' },
      },
    },
  }), [hasLeftAxis, hasRightAxis, tooltipLabel, rightAxisTick]);

  return (
    <div>
      <div className="row mb-3 align-items-end g-3">
        <div className="col-auto">
          <label className="form-label fw-semibold mb-1">Ticker</label>
          <select
            className="form-select"
            style={{ minWidth: 160 }}
            value={selectedTicker}
            onChange={e => setSelectedTicker(e.target.value)}
          >
            {allTickers.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="col-auto">
          <label className="form-label fw-semibold mb-1">From</label>
          <select
            className="form-select"
            value={fromDate}
            onChange={e => {
              const val = e.target.value;
              setFromDate(val);
              if (val > toDate) setToDate(val);
            }}
          >
            {snapshots.map(s => (
              <option key={s.date} value={s.date}>{s.label}</option>
            ))}
          </select>
        </div>

        <div className="col-auto">
          <label className="form-label fw-semibold mb-1">To</label>
          <select
            className="form-select"
            value={toDate}
            onChange={e => {
              const val = e.target.value;
              setToDate(val);
              if (val < fromDate) setFromDate(val);
            }}
          >
            {snapshots.map(s => (
              <option key={s.date} value={s.date}>{s.label}</option>
            ))}
          </select>
        </div>

        <div className="col">
          <label className="form-label fw-semibold mb-1">Metrics</label>
          <div className="d-flex flex-wrap gap-2">
            {METRICS.map(m => (
              <button
                key={m.key}
                type="button"
                className={`btn btn-sm ${selectedMetrics.has(m.key) ? 'btn-primary' : 'btn-outline-secondary'}`}
                style={selectedMetrics.has(m.key) ? { backgroundColor: m.color, borderColor: m.color } : {}}
                onClick={() => toggleMetric(m.key)}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {dataPoints.length === 0 ? (
        <div className="alert alert-warning">
          No data found for <strong>{selectedTicker}</strong> in any snapshot.
        </div>
      ) : (
        <>
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <span className="fw-semibold">{selectedTicker} — Evolution over time</span>
              <span className="text-muted small">{dataPoints.length} snapshot{dataPoints.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="card-body">
              {dataPoints.length < 2 ? (
                <p className="text-muted text-center py-4">
                  Only one snapshot available for {selectedTicker}. Add more snapshots to see trends.
                </p>
              ) : (
                <div style={{ height: 'calc(100vh - 220px)' }}>
                  <Line data={chartData} options={chartOptions} />
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
