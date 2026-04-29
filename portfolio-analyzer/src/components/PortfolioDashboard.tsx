import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState } from 'react';
import { useSnapshots } from '../hooks/useSnapshots';
import { DividendsDashboard } from './DividendsDashboard';
import { EvolutionDashboard } from './EvolutionDashboard';
import { PositionsDashboard } from './PositionsDashboard';

type Page = 'Positions' | 'Dividends' | 'Evolution';

export const PortfolioDashboard: React.FC = () => {
  const { snapshots, loading, error } = useSnapshots();
  const [activePage, setActivePage] = useState<Page>('Positions');

  return (
    <div>
      {/* Top navbar with inline pills */}
      <nav className="navbar navbar-dark bg-dark px-4 gap-4">
        <span className="navbar-brand fw-semibold mb-0">Portfolio Analyzer</span>
        <ul className="nav nav-pills gap-1">
          {(['Positions', 'Dividends', 'Evolution'] as Page[]).map(page => (
            <li className="nav-item" key={page}>
              <button
                className={`nav-link ${activePage === page ? 'active' : 'text-secondary'}`}
                onClick={() => setActivePage(page)}
              >
                {page}
              </button>
            </li>
          ))}
        </ul>
        {snapshots.length > 0 && (
          <small className="text-secondary ms-auto">
            Updated {new Date(snapshots[snapshots.length - 1].date).toLocaleDateString()}
          </small>
        )}
      </nav>

      <div className="container-fluid pt-4">

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
          {activePage === 'Positions' && <PositionsDashboard snapshots={snapshots} />}
          {activePage === 'Dividends' && <DividendsDashboard snapshots={snapshots} />}
          {activePage === 'Evolution' && <EvolutionDashboard snapshots={snapshots} />}
        </>
      )}
      </div>
    </div>
  );
};
