import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useEffect, useState } from 'react';
import { useStockTags } from '../hooks/useStockTags';
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
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  const { stockTags, getTagsForTicker, getAllTags } = useStockTags();

  // Predefined colors for specific tags
  const tagColorMap: Record<string, { bg: string; color: string; border?: string }> = {
    Growth: { bg: '#FFD54F', color: '#3C2F00' },       // yellow
    ETF: { bg: '#A5D6A7', color: '#0F3D18' },          // green
    Value: { bg: '#64B5F6', color: '#0D2A40' },        // blue
    Income: { bg: '#FFB74D', color: '#3C2200' },       // orange
    Stock: { bg: '#B39DDB', color: '#2A1B47' }         // purple
  };

  const renderTagBadge = (tag: string) => {
    const style = tagColorMap[tag] || { bg: '#e9ecef', color: '#212529', border: '1px solid #dee2e6' };
    return (
      <span
        key={tag}
        className="badge"
        style={{
          backgroundColor: style.bg,
          color: style.color,
          border: style.border,
          fontWeight: 500
        }}
      >
        {tag}
      </span>
    );
  };

  // Update stocks when props change and enrich with tags
  useEffect(() => {
    const enriched = stocks.map(stock => ({
      ...stock,
      tags: getTagsForTicker(stock.ticker)
    }));
    setEnrichedStocks(enriched);
  }, [stocks, getTagsForTicker]);

  const formatCurrency = (price: number, currency?: string) => {
    if (!price) return 'N/A';
    if (currency === 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(price);
    }
    if (currency === 'JPY') {
      
      return new Intl.NumberFormat('ja-JP', {
        style: 'currency',
        currency: 'JPY',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(price);
    }
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

  // Filter stocks by selected tags (AND logic: must include all selected tags)
  const filteredStocks = selectedTags.length === 0
    ? enrichedStocks
    : enrichedStocks.filter(stock => {
        const stockTagsSet = new Set(stock.tags || []);
        return selectedTags.every(tag => stockTagsSet.has(tag));
      });

  const sortedStocks = [...filteredStocks].sort((a, b) => {
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
        const totalValue = filteredStocks.reduce((sum, stock) => sum + stock.marketValue, 0);
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

  const totalValue = filteredStocks.reduce((sum, stock) => sum + stock.marketValue, 0);
  const allTags = getAllTags();

  const isTagSelected = (tag: string) => selectedTags.includes(tag);
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => (
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    ));
  };
  const clearTags = () => setSelectedTags([]);

  return (
    <div className="card">
      <div className="card-header">
        <div className="d-flex flex-wrap align-items-center gap-2">
          <h5 className="mb-0 me-2">Portfolio Holdings</h5>
          {allTags.length > 0 && (
            <div className="d-flex flex-wrap align-items-center gap-2">
              {allTags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  className="btn btn-sm"
                  onClick={() => toggleTag(tag)}
                  style={{
                    border: isTagSelected(tag) ? '2px solid #212529' : '1px solid #dee2e6',
                    backgroundColor: (tagColorMap[tag]?.bg) || '#f8f9fa',
                    color: (tagColorMap[tag]?.color) || '#212529',
                    fontWeight: 500
                  }}
                  aria-pressed={isTagSelected(tag)}
                >
                  {tag}
                </button>
              ))}
              {selectedTags.length > 0 && (
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={clearTags}>
                  Clear
                </button>
              )}
            </div>
          )}
        </div>
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
                <th>Tags</th>
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
                
              </tr>
            </thead>
            <tbody>
              {sortedStocks.map((stock) => {
                const unrealizedPL = stock.marketValue - stock.costBasis;
                const percentOfPortfolio = (stock.marketValue / totalValue) * 100;
                const currentPrice = stock.currentPrice;
                
                return (
                  <tr key={stock.ticker} className="cursor-pointer">
                    <td className="fw-bold">{stock.ticker}</td>
                    <td>
                        {stock.tags && stock.tags.length > 0 ? (
                        <div className="d-flex flex-wrap gap-1">
                            {stock.tags.map(tag => renderTagBadge(tag))}
                        </div>
                        ) : (
                        <span className="text-muted">No tags</span>
                        )}
                    </td>
                    <td>{stock.position.toLocaleString()}</td>
                    <td className="fw-bold">
                      {formatCurrency(currentPrice, stock.currency)}
                    </td>
                    <td>{formatCurrency(stock.marketValue, 'USD')}</td>
                    <td>{formatCurrency(stock.costBasis, 'USD')}</td>
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
                
                {filteredStocks.length === 0 && enrichedStocks.length > 0 && (
                  <div className="text-center py-4">
                    <p className="text-muted">No stocks match all selected tags.</p>
                  </div>
                )}
                
                {enrichedStocks.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-muted">No stocks in portfolio. Import a CSV file to get started.</p>
                  </div>
                )}
      </div>
    </div>
  );
};
