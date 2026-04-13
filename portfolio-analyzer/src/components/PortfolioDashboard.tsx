import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState } from 'react';
import { useSnapshots } from '../hooks/useSnapshots';
import { DividendsDashboard } from './DividendsDashboard';
import { PositionsDashboard } from './PositionsDashboard';

type Page = 'positions' | 'dividends';

export const PortfolioDashboard: React.FC = () => {
  const { snapshots, loading, error } = useSnapshots();
  const [activePage, setActivePage] = useState<Page>('positions');

  return (
    <div className="container-fluid">
      <div className="row mb-3">
        <div className="col-12 d-flex align-items-center gap-3">
          <h1 className="h2 mb-0 me-2">Portfolio Analyzer</h1>
          <ul className="nav nav-tabs border-0">
            <li className="nav-item">
              <button
                className={`nav-link ${activePage === 'positions' ? 'active' : ''}`}
                onClick={() => setActivePage('positions')}
              >
                Positions
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activePage === 'dividends' ? 'active' : ''}`}
                onClick={() => setActivePage('dividends')}
              >
                Dividends
              </button>
            </li>
          </ul>
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
          {activePage === 'positions' && <PositionsDashboard snapshots={snapshots} />}
          {activePage === 'dividends' && <DividendsDashboard snapshots={snapshots} />}
        </>
      )}
    </div>
  );
};
