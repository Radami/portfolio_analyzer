import React, { useMemo, useState } from 'react';
import { Snapshot } from '../hooks/useSnapshots';
import { useSnapshotsByYear } from '../hooks/useSnapshotsByYear';

type ViewMode = 'monthly' | 'yearly';

export type PeriodSelection =
  | { mode: 'monthly'; snapshotIndex: number }
  | { mode: 'yearly'; year: number };

interface PeriodPickerProps {
  snapshots: Snapshot[];
  showViewToggle?: boolean;
  defaultViewMode?: ViewMode;
  yearLabel?: (year: number) => string;
  onChange: (selection: PeriodSelection) => void;
}

export const PeriodPicker: React.FC<PeriodPickerProps> = ({
  snapshots,
  showViewToggle = false,
  defaultViewMode = 'monthly',
  yearLabel = String,
  onChange,
}) => {
  const { years, byYear } = useSnapshotsByYear(snapshots);

  const [viewMode, setViewMode] = useState<ViewMode>(defaultViewMode);

  // Monthly state
  const [selectedSnapshotIndex, setSelectedSnapshotIndex] = useState<number | null>(null);
  const effectiveSnapshotIndex = selectedSnapshotIndex ?? snapshots.length - 1;
  const selectedSnapshot = snapshots[effectiveSnapshotIndex] ?? null;
  const selectedMonthYear: number | null = selectedSnapshot
    ? new Date(selectedSnapshot.date).getFullYear()
    : null;

  // Yearly state
  const CURRENT_YEAR = new Date().getFullYear();
  const defaultYear = useMemo(
    () => (years.includes(CURRENT_YEAR) ? CURRENT_YEAR : years[years.length - 1] ?? CURRENT_YEAR),
    [years, CURRENT_YEAR]
  );
  const [selectedYear, setSelectedYear] = useState<number>(defaultYear);

  const handleMonthlyYearSelect = (year: number) => {
    const entries = byYear.get(year);
    if (!entries?.length) return;
    const index = entries[entries.length - 1].index;
    setSelectedSnapshotIndex(index);
    onChange({ mode: 'monthly', snapshotIndex: index });
  };

  const handleMonthSelect = (index: number) => {
    setSelectedSnapshotIndex(index);
    onChange({ mode: 'monthly', snapshotIndex: index });
  };

  const handleYearlyYearSelect = (year: number) => {
    setSelectedYear(year);
    onChange({ mode: 'yearly', year });
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (mode === 'monthly') {
      onChange({ mode: 'monthly', snapshotIndex: effectiveSnapshotIndex });
    } else {
      onChange({ mode: 'yearly', year: selectedYear });
    }
  };

  return (
    <div className="d-flex flex-column gap-2">
      {showViewToggle && (
        <div className="d-flex align-items-center gap-2">
          <span className="text-muted me-1" style={{ minWidth: '70px' }}>View:</span>
          <div className="btn-group" role="group" aria-label="View mode">
            <button
              type="button"
              className={`btn ${viewMode === 'monthly' ? 'btn-secondary' : 'btn-outline-secondary'}`}
              onClick={() => handleViewModeChange('monthly')}
            >
              Monthly
            </button>
            <button
              type="button"
              className={`btn ${viewMode === 'yearly' ? 'btn-secondary' : 'btn-outline-secondary'}`}
              onClick={() => handleViewModeChange('yearly')}
            >
              Yearly
            </button>
          </div>
        </div>
      )}

      {viewMode === 'monthly' && (
        <>
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted me-1" style={{ minWidth: '70px' }}>Year:</span>
            <div className="btn-group flex-wrap" role="group" aria-label="Year">
              {years.map(year => (
                <button
                  key={year}
                  type="button"
                  className={`btn ${year === selectedMonthYear ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => handleMonthlyYearSelect(year)}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <span className="text-muted me-1" style={{ minWidth: '70px' }}>Month:</span>
            <div className="btn-group flex-wrap" role="group" aria-label="Month">
              {(selectedMonthYear !== null ? byYear.get(selectedMonthYear) ?? [] : []).map(({ snapshot: s, index: i }) => (
                <button
                  key={s.filename}
                  type="button"
                  className={`btn ${i === effectiveSnapshotIndex ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => handleMonthSelect(i)}
                >
                  {s.label.replace(/\s*\d{4}$/, '')}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {viewMode === 'yearly' && (
        <div className="d-flex align-items-center gap-2">
          <span className="text-muted me-1" style={{ minWidth: '70px' }}>Year:</span>
          <div className="btn-group flex-wrap" role="group" aria-label="Year">
            {years.map(year => (
              <button
                key={year}
                type="button"
                className={`btn ${year === selectedYear ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => handleYearlyYearSelect(year)}
              >
                {yearLabel(year)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
