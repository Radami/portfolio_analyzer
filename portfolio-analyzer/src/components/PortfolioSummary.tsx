import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import { Portfolio } from '../types';

interface PortfolioSummaryProps {
  portfolio: Portfolio;
}

export const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({ portfolio }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const calculateTotalUnrealizedPL = () => {
    return portfolio.stocks.reduce((sum, stock) => {
      const unrealizedPL = stock.marketValue - stock.costBasis;
      return sum + unrealizedPL;
    }, 0);
  };

  const calculateTotalUnrealizedPLPercentage = () => {
    const totalUnrealizedPL = calculateTotalUnrealizedPL();
    return (totalUnrealizedPL / portfolio.totalValue) * 100;
  };

  const getUnrealizedPLColor = (value: number) => {
    return value >= 0 ? 'text-success' : 'text-danger';
  };

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
              {formatCurrency(portfolio.stocks.reduce((sum, stock) => sum + stock.costBasis, 0))}
            </h4>
          </div>
        </div>
      </div>
      
      <div className="col-md-3">
        <div className="card text-center">
          <div className="card-body">
            <h6 className="card-title text-muted">Unrealized P&L</h6>
            <h4 className={`card-text fw-bold ${getUnrealizedPLColor(calculateTotalUnrealizedPL())}`}>
              {formatCurrency(calculateTotalUnrealizedPL())}
            </h4>
            <small className={getUnrealizedPLColor(calculateTotalUnrealizedPLPercentage())}>
              {formatPercentage(calculateTotalUnrealizedPLPercentage())}
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
      
      <div className="col-12 mt-3">
        <div className="card">
          <div className="card-header">
            <h6 className="mb-0">Portfolio Allocation</h6>
          </div>
          <div className="card-body">
            <div className="row">
              {portfolio.stocks.slice(0, 5).map((stock) => (
                <div key={stock.ticker} className="col-md-2 col-sm-4 col-6 mb-2">
                  <div className="d-flex justify-content-between">
                    <span className="fw-bold">{stock.ticker}</span>
                    <span className="text-muted">
                      {((stock.marketValue / portfolio.totalValue) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="progress" style={{ height: '4px' }}>
                    <div 
                      className="progress-bar" 
                      style={{ 
                        width: `${(stock.marketValue / portfolio.totalValue) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              ))}
              {portfolio.stocks.length > 5 && (
                <div className="col-md-2 col-sm-4 col-6 mb-2">
                  <div className="d-flex justify-content-between">
                    <span className="fw-bold">Others</span>
                    <span className="text-muted">
                      {((portfolio.stocks.slice(5).reduce((sum, stock) => sum + stock.marketValue, 0) / portfolio.totalValue) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="progress" style={{ height: '4px' }}>
                    <div 
                      className="progress-bar" 
                      style={{ 
                        width: `${(portfolio.stocks.slice(5).reduce((sum, stock) => sum + stock.marketValue, 0) / portfolio.totalValue) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              )}
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
