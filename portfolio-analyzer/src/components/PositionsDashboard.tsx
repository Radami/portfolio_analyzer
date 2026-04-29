import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState } from 'react';
import { Snapshot } from '../hooks/useSnapshots';
import { useStockMetadata } from '../hooks/useStockMetadata';
import { PeriodPicker } from './PeriodPicker';
import { PortfolioSummary } from './PortfolioSummary';
import { StockTable } from './StockTable';

interface PositionsDashboardProps {
  snapshots: Snapshot[];
}

export const PositionsDashboard: React.FC<PositionsDashboardProps> = ({ snapshots }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const { getMetadata, getAllTags } = useStockMetadata();

  const effectiveIndex = selectedIndex ?? snapshots.length - 1;
  const snapshot = snapshots[effectiveIndex] ?? null;

  return (
    <>
      <div className="row mb-4">
        <div className="col-12">
          <PeriodPicker
            snapshots={snapshots}
            onChange={selection => {
              if (selection.mode === 'monthly') setSelectedIndex(selection.snapshotIndex);
            }}
          />
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
