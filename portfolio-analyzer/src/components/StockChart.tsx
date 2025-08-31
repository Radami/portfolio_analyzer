import 'bootstrap/dist/css/bootstrap.min.css';
import {
    CategoryScale,
    Chart as ChartJS,
    Filler,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Title,
    Tooltip
} from 'chart.js';
import React from 'react';
import { Line } from 'react-chartjs-2';
import { Stock, StockData } from '../types';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface StockChartProps {
  stock: Stock;
  stockData: StockData | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
}

export const StockChart: React.FC<StockChartProps> = ({ stock, stockData, loading, error, onClose }) => {
  if (loading) {
    return (
      <div className="card h-100">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h6 className="mb-0">Loading...</h6>
          <button type="button" className="btn-close" onClick={onClose}></button>
        </div>
        <div className="card-body text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading chart data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card h-100">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h6 className="mb-0">Error</h6>
          <button type="button" className="btn-close" onClick={onClose}></button>
        </div>
        <div className="card-body">
          <div className="alert alert-danger" role="alert">
            Error loading chart data: {error}
          </div>
        </div>
      </div>
    );
  }

  if (!stockData) {
    return (
      <div className="card h-100">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h6 className="mb-0">No Data</h6>
          <button type="button" className="btn-close" onClick={onClose}></button>
        </div>
        <div className="card-body">
          <div className="alert alert-warning" role="alert">
            No chart data available for {stock.ticker}
          </div>
        </div>
      </div>
    );
  }

  const chartData = {
    labels: stockData.chartData.dates,
    datasets: [
      {
        label: 'Stock Price',
        data: stockData.chartData.prices,
        borderColor: 'black',
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.1
      },
      {
        label: 'Normal P/E Ratio',
        data: stockData.chartData.avgPE,
        borderColor: 'blue',
        backgroundColor: 'rgba(0, 123, 255, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.1
      },
      {
        label: 'Conservative P/E (15x)',
        data: stockData.chartData.conservativePE,
        borderColor: 'orange',
        backgroundColor: 'rgba(255, 165, 0, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.1
      },
      {
        label: 'Dividends',
        data: stockData.chartData.dividends,
        borderColor: 'yellow',
        backgroundColor: 'rgba(255, 255, 0, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.1
      },
      {
        label: 'Earnings',
        data: stockData.chartData.earnings,
        borderColor: 'green',
        backgroundColor: 'rgba(0, 128, 0, 0.3)',
        borderWidth: 0,
        fill: true,
        tension: 0.1
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 10,
          font: {
            size: 11
          }
        }
      },
      title: {
        display: true,
        text: `${stock.ticker} Analysis`,
        font: {
          size: 14,
          weight: 'bold' as const
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            if (label.includes('Price') || label.includes('P/E') || label.includes('Earnings')) {
              return `${label}: $${value.toFixed(2)}`;
            } else if (label.includes('Dividends')) {
              return `${label}: $${value.toFixed(2)}`;
            }
            return `${label}: ${value}`;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: false
        },
        ticks: {
          font: {
            size: 10
          }
        }
      },
      y: {
        display: true,
        title: {
          display: false
        },
        ticks: {
          font: {
            size: 10
          }
        },
        beginAtZero: false
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false
    }
  };

  return (
    <div className="card h-100">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h6 className="mb-0">{stock.ticker} Analysis</h6>
        <button type="button" className="btn-close" onClick={onClose}></button>
      </div>
      <div className="card-body">
        <div style={{ height: '300px' }}>
          <Line data={chartData} options={options} />
        </div>
        
        <div className="row mt-3 g-2">
          <div className="col-6">
            <div className="text-center">
              <h6 className="text-muted small">P/E Ratio</h6>
              <h6 className="fw-bold">{stockData.peRatio.toFixed(2)}</h6>
            </div>
          </div>
          <div className="col-6">
            <div className="text-center">
              <h6 className="text-muted small">Dividend Yield</h6>
              <h6 className="fw-bold">{stockData.dividendYield.toFixed(2)}%</h6>
            </div>
          </div>
          <div className="col-6">
            <div className="text-center">
              <h6 className="text-muted small">YTD</h6>
              <h6 className={`fw-bold ${stockData.ytdPerformance >= 0 ? 'text-success' : 'text-danger'}`}>
                {stockData.ytdPerformance >= 0 ? '+' : ''}{stockData.ytdPerformance.toFixed(1)}%
              </h6>
            </div>
          </div>
          <div className="col-6">
            <div className="text-center">
              <h6 className="text-muted small">vs S&P 500</h6>
              <h6 className={`fw-bold ${stockData.sp500Performance >= 0 ? 'text-success' : 'text-danger'}`}>
                {stockData.sp500Performance >= 0 ? '+' : ''}{stockData.sp500Performance.toFixed(1)}%
              </h6>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
