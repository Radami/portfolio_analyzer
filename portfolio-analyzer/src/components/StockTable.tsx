import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useEffect, useState } from 'react';
import { Stock } from '../types';

interface StockTableProps {
  stocks: Stock[];
  onStockSelect: (stock: Stock) => void;
}

type SortField = 'ticker' | 'position' | 'marketValue' | 'costBasis' | 'unrealizedPL' | 'percentOfPortfolio' | 'currentPrice' | 'peRatio' | 'dividendYield';
type SortDirection = 'asc' | 'desc';

export const StockTable: React.FC<StockTableProps> = ({ stocks, onStockSelect }) => {
  const [sortField, setSortField] = useState<SortField>('ticker');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [enrichedStocks, setEnrichedStocks] = useState<Stock[]>(stocks);

  // Update stocks when props change
  useEffect(() => {
    setEnrichedStocks(stocks);
  }, [stocks]);

  const formatCurrency = (value: number) => {
    if (!value || value <= 0) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    if (!value || !isFinite(value)) return 'N/A';
    return `${value.toFixed(2)}%`;
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const sortedStocks = [...enrichedStocks].sort((a, b) => {
    let aValue: any, bValue: any;

    switch (sortField) {
      case 'ticker':
        aValue = a.ticker;
        bValue = b.ticker;
        break;
      case 'position':
        aValue = a.position;
        bValue = b.position;
        break;
      case 'marketValue':
        aValue = a.marketValue;
        bValue = b.marketValue;
        break;
      case 'costBasis':
        aValue = a.costBasis;
        bValue = b.costBasis;
        break;
      case 'unrealizedPL':
        aValue = a.marketValue - a.costBasis;
        bValue = b.marketValue - b.costBasis;
        break;
      case 'percentOfPortfolio':
        const totalValue = enrichedStocks.reduce((sum, stock) => sum + stock.marketValue, 0);
        aValue = (a.marketValue / totalValue) * 100;
        bValue = (b.marketValue / totalValue) * 100;
        break;
      case 'currentPrice':
        aValue = a.currentPrice || 0;
        bValue = b.currentPrice || 0;
        break;
      case 'peRatio':
        aValue = a.peRatio || 0;
        bValue = b.peRatio || 0;
        break;
      case 'dividendYield':
        aValue = a.dividendYield || 0;
        bValue = b.dividendYield || 0;
        break;
      default:
        return 0;
    }

    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const totalValue = enrichedStocks.reduce((sum, stock) => sum + stock.marketValue, 0);

  return (
    <div className="card">
      <div className="card-header">
        <h5 className="mb-0">Portfolio Holdings</h5>
      </div>
      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th 
                  className="cursor-pointer"
                  onClick={() => handleSort('ticker')}
                >
                  Ticker {getSortIcon('ticker')}
                </th>
                <th 
                  className="cursor-pointer"
                  onClick={() => handleSort('position')}
                >
                  Position {getSortIcon('position')}
                </th>
                <th 
                  className="cursor-pointer"
                  onClick={() => handleSort('currentPrice')}
                >
                  Current Price {getSortIcon('currentPrice')}
                </th>
                <th 
                  className="cursor-pointer"
                  onClick={() => handleSort('marketValue')}
                >
                  Market Value {getSortIcon('marketValue')}
                </th>
                <th 
                  className="cursor-pointer"
                  onClick={() => handleSort('costBasis')}
                >
                  Cost Basis {getSortIcon('costBasis')}
                </th>
                <th 
                  className="cursor-pointer"
                  onClick={() => handleSort('unrealizedPL')}
                >
                  Unrealized P&L {getSortIcon('unrealizedPL')}
                </th>
                <th 
                  className="cursor-pointer"
                  onClick={() => handleSort('peRatio')}
                >
                  P/E Ratio {getSortIcon('peRatio')}
                </th>
                <th 
                  className="cursor-pointer"
                  onClick={() => handleSort('dividendYield')}
                >
                  Dividend Yield {getSortIcon('dividendYield')}
                </th>
                <th 
                  className="cursor-pointer"
                  onClick={() => handleSort('percentOfPortfolio')}
                >
                  % of Portfolio {getSortIcon('percentOfPortfolio')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedStocks.map((stock) => {
                const unrealizedPL = stock.marketValue - stock.costBasis;
                const percentOfPortfolio = (stock.marketValue / totalValue) * 100;
                const currentPrice = stock.currentPrice || stock.marketValue / stock.position;
                
                return (
                  <tr key={stock.ticker} className="cursor-pointer">
                    <td className="fw-bold">{stock.ticker}</td>
                    <td>{stock.position.toLocaleString()}</td>
                    <td className="fw-bold">
                      {formatCurrency(currentPrice)}
                    </td>
                    <td>{formatCurrency(stock.marketValue)}</td>
                    <td>{formatCurrency(stock.costBasis)}</td>
                    <td className={unrealizedPL >= 0 ? 'text-success' : 'text-danger'}>
                      {formatCurrency(unrealizedPL)}
                    </td>
                    <td>
                      {stock.peRatio && stock.peRatio > 0 ? stock.peRatio.toFixed(2) : 'N/A'}
                    </td>
                    <td>
                      {stock.dividendYield && stock.dividendYield > 0 ? formatPercentage(stock.dividendYield) : 'N/A'}
                    </td>
                    <td>{formatPercentage(percentOfPortfolio)}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => onStockSelect(stock)}
                      >
                        View Chart
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {stocks.length === 0 && (
          <div className="text-center py-4">
            <p className="text-muted">No stocks in portfolio. Import a CSV file to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};
