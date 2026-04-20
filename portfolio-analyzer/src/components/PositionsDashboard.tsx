import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState } from 'react';
import { useSnapshotsByYear } from '../hooks/useSnapshotsByYear';
import { useStockMetadata } from '../hooks/useStockMetadata';
import { Snapshot } from '../hooks/useSnapshots';
import { PortfolioSummary } from './PortfolioSummary';
import { StockTable } from './StockTable';

interface PositionsDashboardProps {
  snapshots: Snapshot[];
}

export const PositionsDashboard: React.FC<PositionsDashboardProps> = ({ snapshots }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const { getMetadata, getAllTags } = useStockMetadata();
  const { years, byYear } = useSnapshotsByYear(snapshots);

  const effectiveIndex = selectedIndex ?? snapshots.length - 1;
  const snapshot = snapshots[effectiveIndex] ?? null;

  const selectedYear: number | null = snapshot ? new Date(snapshot.date).getFullYear() : null;

  const handleYearSelect = (year: number) => {
    const entries = byYear.get(year);
    if (!entries?.length) return;
    setSelectedIndex(entries[entries.length - 1].index);
  };

  return (
    <>
      <div className="row mb-4">
        <div className="col-12 d-flex flex-column gap-2">

          {/* Year row */}
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted me-1" style={{ minWidth: '70px' }}>Year:</span>
            <div className="btn-group flex-wrap" role="group" aria-label="Year">
              {years.map(year => (
                <button
                  key={year}
                  type="button"
                  className={`btn ${year === selectedYear ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => handleYearSelect(year)}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>

          {/* Month row — only shows months for the selected year */}
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted me-1" style={{ minWidth: '70px' }}>Month:</span>
            <div className="btn-group flex-wrap" role="group" aria-label="Month">
              {(selectedYear !== null ? byYear.get(selectedYear) ?? [] : []).map(({ snapshot: s, index: i }) => (
                <button
                  key={s.filename}
                  type="button"
                  className={`btn ${i === effectiveIndex ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setSelectedIndex(i)}
                >
                  {s.label.replace(/\s*\d{4}$/, '')}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {snapshot && (
        <div className="row">
          <div className="col-12 mb-4">
            <PortfolioSummary portfolio={snapshot.portfolio} getMetadata={getMetadata} />
          </div>
          <div className="col-12">
            <StockTable stocks={snapshot.portfolio.stocks} getMetadata={getMetadata} getAllTags={getAllTags} />
          </div>
        </div>
      )}
    </>
  );
};
