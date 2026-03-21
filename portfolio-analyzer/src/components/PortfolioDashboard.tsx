import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState } from 'react';
import { useSnapshots } from '../hooks/useSnapshots';
import { PortfolioSummary } from './PortfolioSummary';
import { StockTable } from './StockTable';
import { TickerPerformancePanel } from './TickerPerformancePanel';

export const PortfolioDashboard: React.FC = () => {
  const { snapshots, loading, error } = useSnapshots();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);

  // Default to the latest snapshot; respect manual selection after that
  const effectiveIndex = selectedIndex ?? snapshots.length - 1;
  const snapshot = snapshots[effectiveIndex] ?? null;

  return (
    <div className="container-fluid">
      <div className="row mb-4">
        <div className="col-12">
          <h1 className="h2 mb-0">Portfolio Analyzer</h1>
        </div>
      </div>

      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" aria-hidden="true" />
          <p className="mt-2 text-muted">Loading snapshots...</p>
        </div>
      )}

      {error && (
        <div className="alert alert-danger">{error}</div>
      )}

      {!loading && snapshots.length === 0 && !error && (
        <div className="text-center py-5">
          <h3>No snapshots found</h3>
          <p className="text-muted">
            Add CSV files to <code>public/data/</code> and restart the app.
          </p>
        </div>
      )}

      {!loading && snapshots.length > 0 && (
        <>
          <div className="row mb-4">
            <div className="col-12">
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <span className="text-muted me-1">Snapshot:</span>
                <div className="btn-group flex-wrap" role="group" aria-label="Portfolio snapshots">
                  {snapshots.map((s, i) => (
                    <button
                      key={s.filename}
                      type="button"
                      className={`btn ${i === effectiveIndex ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setSelectedIndex(i)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {snapshot && (
            <div className="row">
              <div className="col-12 mb-4">
                <PortfolioSummary portfolio={snapshot.portfolio} />
              </div>
              <div className={selectedTicker ? 'col-8' : 'col-12'}>
                <StockTable
                  stocks={snapshot.portfolio.stocks}
                  selectedTicker={selectedTicker ?? undefined}
                  onStockSelect={setSelectedTicker}
                />
              </div>
              {selectedTicker && (
                <div className="col-4" style={{ position: 'sticky', top: '1rem', alignSelf: 'flex-start' }}>
                  <TickerPerformancePanel
                    ticker={selectedTicker}
                    snapshots={snapshots}
                    onClose={() => setSelectedTicker(null)}
                  />
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
