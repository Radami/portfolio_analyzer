import 'bootstrap/dist/css/bootstrap.min.css';
import { ArcElement, Chart as ChartJS, Legend } from 'chart.js';
import React, { useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { TAG_COLORS } from '../data/tagDefinitions';
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

  const totalUnrealizedPL = portfolio.stocks.reduce(
    (sum, s) => sum + (s.marketValue - s.costBasis), 0
  );
  const totalUnrealizedPLPct = (totalUnrealizedPL / portfolio.totalValue) * 100;
  const plColor = (v: number) => (v >= 0 ? 'text-success' : 'text-danger');

  const buildDoughnutData = (tagExtractor: (m: StockMetadata) => string | undefined) => {
    const totals: Record<string, number> = {};
    for (const stock of portfolio.stocks) {
      const tag = tagExtractor(getMetadata(stock.ticker));
      if (!tag) continue;
      totals[tag] = (totals[tag] ?? 0) + stock.marketValue;
    }
    const labels = Object.keys(totals);
    const total = labels.reduce((s, l) => s + totals[l], 0);
    return {
      chartData: {
        labels,
        datasets: [{
          data: labels.map(l => totals[l]),
          backgroundColor: labels.map(l => TAG_COLORS[l]?.bg ?? '#e9ecef'),
          borderWidth: 1,
        }],
      },
      legendItems: labels.map(l => ({
        label: l,
        value: totals[l],
        pct: (totals[l] / total) * 100,
        color: TAG_COLORS[l]?.bg ?? '#e9ecef',
      })),
    };
  };

  const doughnutOptions = {
    responsive: true,
    hover: { mode: null as any },
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
  };

  const renderLegend = (items: { label: string; value: number; pct: number; color: string }[]) => (
    <table className="w-100 mt-3" style={{ fontSize: '0.85rem' }}>
      <tbody>
        {items.map(item => (
          <tr key={item.label}>
            <td style={{ width: '12px', paddingRight: '8px' }}>
              <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '2px', backgroundColor: item.color }} />
            </td>
            <td className="fw-medium">{item.label}</td>
            <td className="text-end text-muted">{item.pct.toFixed(1)}%</td>
            <td className="text-end ps-3">{formatCurrency(item.value)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const strategyData = useMemo(
    () => buildDoughnutData(m => m.typeTags.find(t => ['Growth', 'Value', 'Income'].includes(t))),
    [portfolio.stocks, getMetadata]
  );
  const instrumentData = useMemo(
    () => buildDoughnutData(m => m.typeTags.find(t => ['Stock', 'ETF', 'REIT', 'Bond'].includes(t))),
    [portfolio.stocks, getMetadata]
  );

  return (
    <div className="row">
      <div className="col-md-3">
        <div className="card text-center">
          <div className="card-body">
            <h6 className="card-title text-muted">Total Value</h6>
            <h4 className="card-text fw-bold">{formatCurrency(portfolio.totalValue)}</h4>
          </div>
        </div>
      </div>

      <div className="col-md-3">
        <div className="card text-center">
          <div className="card-body">
            <h6 className="card-title text-muted">Total Cost Basis</h6>
            <h4 className="card-text fw-bold">
              {formatCurrency(portfolio.stocks.reduce((sum, s) => sum + s.costBasis, 0))}
            </h4>
          </div>
        </div>
      </div>

      <div className="col-md-3">
        <div className="card text-center">
          <div className="card-body">
            <h6 className="card-title text-muted">Unrealized P&L</h6>
            <h4 className={`card-text fw-bold ${plColor(totalUnrealizedPL)}`}>
              {formatCurrency(totalUnrealizedPL)}
            </h4>
            <small className={plColor(totalUnrealizedPLPct)}>
              {formatPercentage(totalUnrealizedPLPct)}
            </small>
          </div>
        </div>
      </div>

      <div className="col-md-3">
        <div className="card text-center">
          <div className="card-body">
            <h6 className="card-title text-muted">Number of Stocks</h6>
            <h4 className="card-text fw-bold">{portfolio.stocks.length}</h4>
          </div>
        </div>
      </div>

      <div className="col-md-6 mt-3">
        <div className="card h-100">
          <div className="card-header"><h6 className="mb-0">Strategy</h6></div>
          <div className="card-body d-flex justify-content-center">
            <div className="d-flex gap-4 align-items-center">
              <div style={{ width: '160px', flexShrink: 0 }}>
                <Doughnut data={strategyData.chartData} options={doughnutOptions} />
              </div>
              <div className="flex-grow-1">{renderLegend(strategyData.legendItems)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="col-md-6 mt-3">
        <div className="card h-100">
          <div className="card-header"><h6 className="mb-0">Instrument Type</h6></div>
          <div className="card-body d-flex justify-content-center">
            <div className="d-flex gap-4 align-items-center">
              <div>
                <Doughnut data={instrumentData.chartData} options={doughnutOptions} />
              </div>
              <div style={{ width: '160px', flexShrink: 0 }}>{renderLegend(instrumentData.legendItems)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="col-12 mt-2">
        <small className="text-muted">
          Last updated: {new Date(portfolio.lastUpdated).toLocaleString()}
        </small>
      </div>
    </div>
  );
};
