import React, { useMemo, useState } from 'react';
import { Snapshot } from '../hooks/useSnapshots';
import { useSnapshotsByYear } from '../hooks/useSnapshotsByYear';

type ViewMode = 'monthly' | 'yearly';

// Discriminated union returned to the parent on every selection change.
// - monthly: the parent receives the index into the flat snapshots array
// - yearly:  the parent receives the calendar year as a number
export type PeriodSelection =
  | { mode: 'monthly'; snapshotIndex: number }
  | { mode: 'yearly'; year: number };

// Props:
// - snapshots:       the full flat snapshots array (same one passed to dashboards)
// - showViewToggle:  render the Monthly / Yearly toggle row (default false — monthly only)
// - defaultViewMode: which mode to start in (default 'monthly')
// - yearLabel:       optional formatter for year buttons, e.g. to render "Year-to-date"
// - onChange:        called whenever the user changes the selection; also fires when the
//                    view mode toggle is switched so the parent always has a consistent value
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

  // --- Monthly mode state ---
  const [selectedSnapshotIndex, setSelectedSnapshotIndex] = useState<number>(snapshots.length - 1);
  const selectedSnapshot = snapshots[selectedSnapshotIndex] ?? null;
  // Derived from the active snapshot so the correct year button stays highlighted.
  const selectedMonthYear: number | null = selectedSnapshot
    ? new Date(selectedSnapshot.date).getFullYear()
    : null;

  // --- Yearly mode state ---
  // Default to the current calendar year if it has any data, otherwise the most recent year.
  const CURRENT_YEAR = new Date().getFullYear();
  const defaultYear = useMemo(
    () => (years.includes(CURRENT_YEAR) ? CURRENT_YEAR : years[years.length - 1] ?? CURRENT_YEAR),
    [years, CURRENT_YEAR]
  );
  const [selectedYear, setSelectedYear] = useState<number>(defaultYear);

  // Clicking a year in monthly mode jumps to the last snapshot of that year so the month
  // row immediately shows something meaningful rather than clearing the selection.
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

  // When the toggle switches mode we fire onChange immediately so the parent doesn't need to
  // wait for a secondary button click to get a valid selection.
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (mode === 'monthly') {
      onChange({ mode: 'monthly', snapshotIndex: selectedSnapshotIndex });
    } else {
      onChange({ mode: 'yearly', year: selectedYear });
    }
  };

  return (
    <div className="d-flex flex-wrap align-items-center gap-3">
      {showViewToggle && (
        <div className="d-flex align-items-center gap-2">
          <span className="text-muted me-1">View:</span>
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

      {/* Monthly mode: two-level picker — choose a year, then a month within that year */}
      {viewMode === 'monthly' && (
        <>
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted me-1">Year:</span>
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
            <span className="text-muted me-1">Month:</span>
            <div className="btn-group flex-wrap" role="group" aria-label="Month">
              {/* Only show months that belong to the currently selected year */}
              {(selectedMonthYear !== null ? byYear.get(selectedMonthYear) ?? [] : []).map(({ snapshot: s, index: i }) => (
                <button
                  key={s.filename}
                  type="button"
                  className={`btn ${i === selectedSnapshotIndex ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => handleMonthSelect(i)}
                >
                  {/* Strip the year suffix from labels like "March 2024" → "March" */}
                  {s.label.replace(/\s*\d{4}$/, '')}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Yearly mode: single row of year buttons; labels can be customised via yearLabel */}
      {viewMode === 'yearly' && (
        <div className="d-flex align-items-center gap-2">
          <span className="text-muted me-1">Year:</span>
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
