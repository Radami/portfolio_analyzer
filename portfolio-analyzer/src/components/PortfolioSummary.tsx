import 'bootstrap/dist/css/bootstrap.min.css';
import { ArcElement, Chart as ChartJS, Legend } from 'chart.js';
import React, { useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { INSTRUMENT_TAGS, STRATEGY_TAGS, TAG_COLORS } from '../data/tagDefinitions';
import { Portfolio, StockMetadata } from '../types';

ChartJS.register(ArcElement, Legend);

interface PortfolioSummaryProps {
  portfolio: Portfolio;
  getMetadata: (ticker: string) => StockMetadata;
}

export const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({ portfolio, getMetadata }) => {

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD',
      minimumFractionDigits: 2, maximumFractionDigits: 2,
    }).format(value);

  const formatPercentage = (value: number) => `${value.toFixed(2)}%`;

  const totalCostBasis = portfolio.stocks.reduce((sum, s) => sum + s.costBasis, 0);
  const totalUnrealizedPL = portfolio.stocks.reduce(
    (sum, s) => sum + (s.marketValue - s.costBasis), 0
  );
  const totalUnrealizedPLPct = (totalUnrealizedPL / portfolio.totalValue) * 100;
  const plColor = (v: number) => (v >= 0 ? 'text-success' : 'text-danger');

  const doughnutOptions = {
    responsive: true,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
  };

  const renderLegend = (items: { label: string; value: number; pct: number; color: string }[]) => (
    <table className="mt-2" style={{ fontSize: '0.8rem', lineHeight: '1.3' }}>
      <tbody>
        {items.map(item => (
          <tr key={item.label}>
            <td style={{ width: '10px', paddingRight: '6px', paddingTop: '2px', paddingBottom: '2px' }}>
              <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', backgroundColor: item.color }} />
            </td>
            <td className="fw-medium">{item.label}</td>
            <td className="text-end text-muted">{item.pct.toFixed(1)}%</td>
            <td className="text-end ps-2">{formatCurrency(item.value)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const strategyData = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const stock of portfolio.stocks) {
      const tag = getMetadata(stock.ticker).typeTags.find(t => (STRATEGY_TAGS as readonly string[]).includes(t as string));
      if (!tag) continue;
      totals[tag] = (totals[tag] ?? 0) + stock.marketValue;
    }
    const labels = Object.keys(totals);
    const total = labels.reduce((s, l) => s + totals[l], 0);
    return {
      chartData: {
        labels,
        datasets: [{ data: labels.map(l => totals[l]), backgroundColor: labels.map(l => TAG_COLORS[l]?.bg ?? '#e9ecef'), borderWidth: 1 }],
      },
      legendItems: labels.map(l => ({ label: l, value: totals[l], pct: (totals[l] / total) * 100, color: TAG_COLORS[l]?.bg ?? '#e9ecef' })),
    };
  }, [portfolio.stocks, getMetadata]);

  const instrumentData = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const stock of portfolio.stocks) {
      const tag = getMetadata(stock.ticker).typeTags.find(t => (INSTRUMENT_TAGS as readonly string[]).includes(t));
      if (!tag) continue;
      totals[tag] = (totals[tag] ?? 0) + stock.marketValue;
    }
    const labels = Object.keys(totals);
    const total = labels.reduce((s, l) => s + totals[l], 0);
    return {
      chartData: {
        labels,
        datasets: [{ data: labels.map(l => totals[l]), backgroundColor: labels.map(l => TAG_COLORS[l]?.bg ?? '#e9ecef'), borderWidth: 1 }],
      },
      legendItems: labels.map(l => ({ label: l, value: totals[l], pct: (totals[l] / total) * 100, color: TAG_COLORS[l]?.bg ?? '#e9ecef' })),
    };
  }, [portfolio.stocks, getMetadata]);

  return (
    <div className="row g-3 align-items-stretch">

      <div className="col-md-3">
        <div className="card h-100">
          <div className="card-body d-flex flex-column justify-content-center gap-3 py-3">
            <div>
              <div className="fw-semibold">Total Value</div>
              <div className="fs-5">{formatCurrency(portfolio.totalValue)}</div>
            </div>
            <div>
              <div className="fw-semibold">Cost Basis</div>
              <div className="fs-5">{formatCurrency(totalCostBasis)}</div>
            </div>
            <div>
              <div className="fw-semibold">Unrealized P&L</div>
              <div className={`fs-5 ${plColor(totalUnrealizedPL)}`}>
                {formatCurrency(totalUnrealizedPL)}
              </div>
              <div className={`small ${plColor(totalUnrealizedPLPct)}`}>
                {formatPercentage(totalUnrealizedPLPct)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="col-md-9">
        <div className="card h-100">
          <div className="card-body d-flex gap-4">
            <div className="d-flex flex-column align-items-center flex-grow-1">
              <div className="text-muted small fw-semibold mb-2">Strategy</div>
              <div style={{ width: '130px' }}>
                <Doughnut data={strategyData.chartData} options={doughnutOptions} />
              </div>
              {renderLegend(strategyData.legendItems)}
            </div>
            <div className="vr" />
            <div className="d-flex flex-column align-items-center flex-grow-1">
              <div className="text-muted small fw-semibold mb-2">Instrument Type</div>
              <div style={{ width: '130px' }}>
                <Doughnut data={instrumentData.chartData} options={doughnutOptions} />
              </div>
              {renderLegend(instrumentData.legendItems)}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
