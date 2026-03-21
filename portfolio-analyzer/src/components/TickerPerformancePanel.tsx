import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
import React from 'react';
import { Line } from 'react-chartjs-2';
import { Snapshot } from '../hooks/useSnapshots';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface TickerPerformancePanelProps {
  ticker: string;
  snapshots: Snapshot[];
  onClose: () => void;
}

export const TickerPerformancePanel: React.FC<TickerPerformancePanelProps> = ({ ticker, snapshots, onClose }) => {
  const dataPoints = snapshots
    .map(snapshot => {
      const stock = snapshot.portfolio.stocks.find(s => s.ticker === ticker);
      if (!stock) return null;
      return {
        label: snapshot.label,
        marketValue: stock.marketValue,
        costBasis: stock.costBasis,
      };
    })
    .filter(Boolean) as { label: string; marketValue: number; costBasis: number }[];

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

  const chartData = {
    labels: dataPoints.map(d => d.label),
    datasets: [
      {
        label: 'Market Value',
        data: dataPoints.map(d => d.marketValue),
        borderColor: '#0d6efd',
        backgroundColor: 'rgba(13, 110, 253, 0.1)',
        tension: 0.3,
        fill: false,
      },
      {
        label: 'Cost Basis',
        data: dataPoints.map(d => d.costBasis),
        borderColor: '#6c757d',
        backgroundColor: 'rgba(108, 117, 125, 0.1)',
        borderDash: [5, 5],
        tension: 0.3,
        fill: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      tooltip: {
        callbacks: {
          label: (ctx: any) => `${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}`,
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: (value: any) => formatCurrency(value),
        },
      },
    },
  };

  return (
    <div className="card h-100">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0">{ticker}</h5>
        <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
      </div>
      <div className="card-body">
        {dataPoints.length < 2 ? (
          <p className="text-muted text-center mt-4">Not enough snapshots to show performance for {ticker}.</p>
        ) : (
          <Line data={chartData} options={chartOptions} />
        )}
      </div>
    </div>
  );
};
