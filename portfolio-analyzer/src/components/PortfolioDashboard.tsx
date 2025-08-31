import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState } from 'react';
import { usePortfolio } from '../hooks/usePortfolio';
import { useStockData } from '../hooks/useStockData';
import { Stock } from '../types';
import { CSVImporter } from './CSVImporter';
import { PortfolioSummary } from './PortfolioSummary';
import { StockChart } from './StockChart';
import { StockTable } from './StockTable';

export const PortfolioDashboard: React.FC = () => {
  const { portfolio, updatePortfolio } = usePortfolio();
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const { stockData, loading, error } = useStockData(selectedStock?.ticker || '');

  const handlePortfolioImport = (newPortfolio: any) => {
    updatePortfolio(newPortfolio);
    setSelectedStock(null); // Reset selected stock when importing new portfolio
  };

  const handleStockSelect = (stock: Stock) => {
    setSelectedStock(stock);
  };

  const handleCloseChart = () => {
    setSelectedStock(null);
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1 className="h2 mb-0">Portfolio Analyzer</h1>
            <div className="d-flex gap-2">
              {portfolio.stocks.length > 0 && (
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => window.location.reload()}
                >
                  Refresh Data
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {portfolio.stocks.length === 0 ? (
        // Show import section when no portfolio
        <div className="row">
          <div className="col-lg-8 mx-auto">
            <div className="text-center mb-4">
              <h3>Welcome to Portfolio Analyzer</h3>
              <p className="text-muted">
                Import your portfolio CSV file to get started with detailed analysis and charts.
              </p>
            </div>
            <CSVImporter onPortfolioImport={handlePortfolioImport} />
          </div>
        </div>
      ) : (
        // Show portfolio with optional right panel
        <div className="row">
          {/* Main content area */}
          <div className={`${selectedStock ? 'col-lg-8' : 'col-12'}`}>
            <div className="mb-4">
              <CSVImporter onPortfolioImport={handlePortfolioImport} />
            </div>
            
            <div className="mb-4">
              <PortfolioSummary portfolio={portfolio} />
            </div>
            
            <div>
              <StockTable
                stocks={portfolio.stocks}
                onStockSelect={handleStockSelect}
              />
            </div>
          </div>
          
          {/* Right panel for stock chart */}
          {selectedStock && (
            <div className="col-lg-4">
              <div className="sticky-top" style={{ top: '1rem' }}>
                <StockChart
                  stock={selectedStock}
                  stockData={stockData}
                  loading={loading}
                  error={error}
                  onClose={handleCloseChart}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
