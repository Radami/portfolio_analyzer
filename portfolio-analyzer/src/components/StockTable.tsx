import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState } from 'react';
import { getTagColor } from '../data/tagDefinitions';
import { useStockMetadata } from '../hooks/useStockMetadata';
import { Stock } from '../types';

interface StockTableProps {
  stocks: Stock[];
}

type SortField = 'ticker' | 'position' | 'marketValue' | 'costBasis' | 'unrealizedPL' | 'percentOfPortfolio' | 'currentPrice';
type SortDirection = 'asc' | 'desc';

export const StockTable: React.FC<StockTableProps> = ({ stocks }) => {
  const [sortField, setSortField] = useState<SortField>('ticker');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const { getMetadata, getAllTags } = useStockMetadata();

  const renderTagBadge = (tag: string) => {
    const { bg, color } = getTagColor(tag);
    return (
      <span key={tag} className="badge" style={{ backgroundColor: bg, color, fontWeight: 500 }}>
        {tag}
      </span>
    );
  };

  const formatCurrency = (price: number, currency?: string) => {
    if (!price) return 'N/A';
    if (currency === 'JPY') {
      return new Intl.NumberFormat('ja-JP', {
        style: 'currency', currency: 'JPY',
        minimumFractionDigits: 0, maximumFractionDigits: 0,
      }).format(price);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD',
      minimumFractionDigits: 2, maximumFractionDigits: 2,
    }).format(price);
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

  const filteredStocks = selectedTags.length === 0
    ? stocks
    : stocks.filter(stock => {
        const m = getMetadata(stock.ticker);
        const allTags = new Set([...m.industryTags, ...m.typeTags, ]);
        return selectedTags.every(tag => allTags.has(tag));
      });

  const totalValue = filteredStocks.reduce((sum, stock) => sum + stock.marketValue, 0);

  const sortedStocks = [...filteredStocks].sort((a, b) => {
    let aValue: any, bValue: any;
    switch (sortField) {
      case 'ticker':       aValue = a.ticker; bValue = b.ticker; break;
      case 'position':     aValue = a.position; bValue = b.position; break;
      case 'marketValue':  aValue = a.marketValue; bValue = b.marketValue; break;
      case 'costBasis':    aValue = a.costBasis; bValue = b.costBasis; break;
      case 'unrealizedPL': aValue = a.marketValue - a.costBasis; bValue = b.marketValue - b.costBasis; break;
      case 'percentOfPortfolio':
        aValue = (a.marketValue / totalValue) * 100;
        bValue = (b.marketValue / totalValue) * 100;
        break;
      case 'currentPrice': aValue = a.currentPrice || 0; bValue = b.currentPrice || 0; break;
      default: return 0;
    }
    if (typeof aValue === 'string') { aValue = aValue.toLowerCase(); bValue = bValue.toLowerCase(); }
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const allTags = getAllTags();
  const isTagSelected = (tag: string) => selectedTags.includes(tag);
  const toggleTag = (tag: string) =>
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  const clearTags = () => setSelectedTags([]);

  return (
    <div className="card">
      <div className="card-header">
        <div className="d-flex flex-wrap align-items-center gap-2">
          <h5 className="mb-0 me-2">Portfolio Holdings</h5>
          {allTags.length > 0 && (
            <div className="d-flex flex-wrap align-items-center gap-2">
              {allTags.map(tag => {
                const { bg, color } = getTagColor(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    className="btn btn-sm"
                    onClick={() => toggleTag(tag)}
                    style={{
                      border: isTagSelected(tag) ? '2px solid #212529' : '1px solid #dee2e6',
                      backgroundColor: bg,
                      color,
                      fontWeight: 500,
                    }}
                    aria-pressed={isTagSelected(tag)}
                  >
                    {tag}
                  </button>
                );
              })}
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
                <th className="cursor-pointer" style={{ width: '1%' }} onClick={() => handleSort('ticker')}>
                  Ticker {getSortIcon('ticker')}
                </th>
                <th>Tags</th>
                <th className="cursor-pointer" onClick={() => handleSort('position')}>
                  Position {getSortIcon('position')}
                </th>
                <th className="cursor-pointer" onClick={() => handleSort('currentPrice')}>
                  Current Price {getSortIcon('currentPrice')}
                </th>
                <th className="cursor-pointer" onClick={() => handleSort('marketValue')}>
                  Market Value {getSortIcon('marketValue')}
                </th>
                <th className="cursor-pointer" onClick={() => handleSort('costBasis')}>
                  Cost Basis {getSortIcon('costBasis')}
                </th>
                <th className="cursor-pointer" onClick={() => handleSort('unrealizedPL')}>
                  Unrealized P&L {getSortIcon('unrealizedPL')}
                </th>
                <th className="cursor-pointer" onClick={() => handleSort('percentOfPortfolio')}>
                  % of Portfolio {getSortIcon('percentOfPortfolio')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedStocks.map(stock => {
                const unrealizedPL = stock.marketValue - stock.costBasis;
                const percentOfPortfolio = (stock.marketValue / totalValue) * 100;
                const meta = getMetadata(stock.ticker);
                const allStockTags = [...meta.industryTags, ...meta.typeTags];
                return (
                  <tr key={stock.ticker} className="cursor-pointer">
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div className="fw-bold">{stock.ticker}</div>
                      {meta.companyName && (
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                          {meta.companyName}
                        </div>
                      )}
                    </td>
                    <td>
                      {allStockTags.length > 0 ? (
                        <div className="d-flex flex-wrap gap-1">
                          {allStockTags.map(tag => renderTagBadge(tag))}
                        </div>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td>{stock.position.toLocaleString()}</td>
                    <td className="fw-bold">{formatCurrency(stock.currentPrice, stock.currency)}</td>
                    <td>{formatCurrency(stock.marketValue, 'USD')}</td>
                    <td>{formatCurrency(stock.costBasis, 'USD')}</td>
                    <td className={unrealizedPL >= 0 ? 'text-success' : 'text-danger'}>
                      {formatCurrency(unrealizedPL, 'USD')}
                    </td>
                    <td>{formatPercentage(percentOfPortfolio)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredStocks.length === 0 && stocks.length > 0 && (
          <div className="text-center py-4">
            <p className="text-muted">No stocks match all selected tags.</p>
          </div>
        )}

        {stocks.length === 0 && (
          <div className="text-center py-4">
            <p className="text-muted">No stocks in portfolio. Import a CSV file to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};
