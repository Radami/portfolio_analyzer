import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useMemo, useState } from 'react';
import { Snapshot } from '../hooks/useSnapshots';
import { DividendEntry } from '../types';

interface DividendsDashboardProps {
  snapshots: Snapshot[];
}

type ViewMode = 'monthly' | 'yearly';
type SortKey = 'ticker' | 'totalAmount' | 'payments' | 'latestPerShare' | 'pct';
type SortDir = 'asc' | 'desc';

interface TickerSummary {
  ticker: string;
  totalAmount: number;
  payments: number;
  latestPerShare: number;
  latestDate: string;
}

const CURRENT_YEAR = new Date().getFullYear();

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value);

function buildTickerSummaries(dividends: DividendEntry[]): TickerSummary[] {
  const map = new Map<string, TickerSummary>();
  for (const d of dividends) {
    const existing = map.get(d.ticker);
    if (!existing) {
      map.set(d.ticker, {
        ticker: d.ticker,
        totalAmount: d.totalAmount,
        payments: 1,
        latestPerShare: d.amountPerShare,
        latestDate: d.date,
      });
    } else {
      existing.totalAmount += d.totalAmount;
      existing.payments += 1;
      if (d.date >= existing.latestDate) {
        existing.latestPerShare = d.amountPerShare;
        existing.latestDate = d.date;
      }
    }
  }
  return Array.from(map.values());
}

export const DividendsDashboard: React.FC<DividendsDashboardProps> = ({ snapshots }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('yearly');

  // --- Shared: group snapshots by year ---
  const { years, byYear } = useMemo(() => {
    const map = new Map<number, { snapshot: Snapshot; index: number }[]>();
    snapshots.forEach((s, i) => {
      const year = new Date(s.date).getFullYear();
      if (!map.has(year)) map.set(year, []);
      map.get(year)!.push({ snapshot: s, index: i });
    });
    return {
      years: Array.from(map.keys()).sort((a, b) => a - b),
      byYear: map,
    };
  }, [snapshots]);

  // --- Yearly state ---
  const defaultYear = useMemo(
    () => (years.includes(CURRENT_YEAR) ? CURRENT_YEAR : years[years.length - 1] ?? CURRENT_YEAR),
    [years]
  );
  const [selectedYear, setSelectedYear] = useState<number>(defaultYear);

  // --- Monthly state ---
  const [selectedSnapshotIndex, setSelectedSnapshotIndex] = useState<number | null>(null);
  const effectiveSnapshotIndex = selectedSnapshotIndex ?? snapshots.length - 1;
  const selectedSnapshot = snapshots[effectiveSnapshotIndex] ?? null;
  const selectedMonthYear: number | null = selectedSnapshot
    ? new Date(selectedSnapshot.date).getFullYear()
    : null;

  const handleMonthlyYearSelect = (year: number) => {
    const entries = byYear.get(year);
    if (!entries?.length) return;
    setSelectedSnapshotIndex(entries[entries.length - 1].index);
  };

  // --- Sorting ---
  const [sortKey, setSortKey] = useState<SortKey>('totalAmount');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // --- Derive dividends for the active view ---
  const dividends = useMemo<DividendEntry[]>(() => {
    if (viewMode === 'monthly') {
      return selectedSnapshot?.portfolio.dividends ?? [];
    }
    return snapshots
      .filter(s => new Date(s.date).getFullYear() === selectedYear)
      .flatMap(s => s.portfolio.dividends);
  }, [viewMode, selectedSnapshot, snapshots, selectedYear]);

  const perTicker = useMemo(() => buildTickerSummaries(dividends), [dividends]);

  const totalDividends = useMemo(
    () => dividends.reduce((sum, d) => sum + d.totalAmount, 0),
    [dividends]
  );

  const topPayer = useMemo(
    () => perTicker.reduce<TickerSummary | null>(
      (best, t) => (!best || t.totalAmount > best.totalAmount ? t : best),
      null
    ),
    [perTicker]
  );

  const sorted = useMemo(() => {
    return [...perTicker].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'ticker') cmp = a.ticker.localeCompare(b.ticker);
      else if (sortKey === 'totalAmount' || sortKey === 'pct') cmp = a.totalAmount - b.totalAmount;
      else if (sortKey === 'payments') cmp = a.payments - b.payments;
      else if (sortKey === 'latestPerShare') cmp = a.latestPerShare - b.latestPerShare;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [perTicker, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sortIcon = (key: SortKey) => {
    if (key !== sortKey) return <span className="text-muted ms-1">↕</span>;
    return <span className="ms-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  const yearLabel = (year: number) => (year === CURRENT_YEAR ? 'Year-to-date' : String(year));

  const emptyMessage = viewMode === 'monthly'
    ? 'No dividend data for this snapshot.'
    : `No monthly statements found for ${yearLabel(selectedYear)} yet.`;

  return (
    <>
      {/* View mode toggle + period picker */}
      <div className="row mb-4">
        <div className="col-12 d-flex flex-column gap-2">

          {/* Toggle — always on its own row so it never shifts */}
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted me-1" style={{ minWidth: '70px' }}>View:</span>
            <div className="btn-group" role="group" aria-label="View mode">
              <button
                type="button"
                className={`btn ${viewMode === 'monthly' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                onClick={() => setViewMode('monthly')}
              >
                Monthly
              </button>
              <button
                type="button"
                className={`btn ${viewMode === 'yearly' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                onClick={() => setViewMode('yearly')}
              >
                Yearly
              </button>
            </div>
          </div>

          {/* Period picker — changes per mode but toggle above is unaffected */}
          {viewMode === 'monthly' && (
            <>
              <div className="d-flex align-items-center gap-2">
                <span className="text-muted me-1" style={{ minWidth: '70px' }}>Year:</span>
                <div className="btn-group flex-wrap" role="group" aria-label="Month view year">
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
                <div className="btn-group flex-wrap" role="group" aria-label="Month picker">
                  {(selectedMonthYear !== null ? byYear.get(selectedMonthYear) ?? [] : []).map(({ snapshot: s, index: i }) => (
                    <button
                      key={s.filename}
                      type="button"
                      className={`btn ${i === effectiveSnapshotIndex ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setSelectedSnapshotIndex(i)}
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
              <div className="btn-group flex-wrap" role="group" aria-label="Year picker">
                {years.map(year => (
                  <button
                    key={year}
                    type="button"
                    className={`btn ${year === selectedYear ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setSelectedYear(year)}
                  >
                    {yearLabel(year)}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {dividends.length === 0 ? (
        <div className="text-center py-5">
          <h5 className="text-muted">{emptyMessage}</h5>
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="row mb-4">
            <div className="col-md-4">
              <div className="card text-center">
                <div className="card-body">
                  <h6 className="card-title text-muted">Total Dividends</h6>
                  <h4 className="card-text fw-bold">{formatCurrency(totalDividends)}</h4>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card text-center">
                <div className="card-body">
                  <h6 className="card-title text-muted">Payments</h6>
                  <h4 className="card-text fw-bold">{dividends.length}</h4>
                  <small className="text-muted">across {perTicker.length} stocks</small>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card text-center">
                <div className="card-body">
                  <h6 className="card-title text-muted">Top Payer</h6>
                  <h4 className="card-text fw-bold">{topPayer?.ticker ?? '—'}</h4>
                  {topPayer && (
                    <small className="text-muted">{formatCurrency(topPayer.totalAmount)}</small>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-header">
                  <h6 className="mb-0">Dividends by Stock</h6>
                </div>
                <div className="card-body p-0">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th style={{ cursor: 'pointer' }} onClick={() => handleSort('ticker')}>
                          Ticker {sortIcon('ticker')}
                        </th>
                        <th style={{ cursor: 'pointer' }} className="text-end" onClick={() => handleSort('totalAmount')}>
                          Total Received {sortIcon('totalAmount')}
                        </th>
                        <th style={{ cursor: 'pointer' }} className="text-end" onClick={() => handleSort('pct')}>
                          % of Total {sortIcon('pct')}
                        </th>
                        <th style={{ cursor: 'pointer' }} className="text-end" onClick={() => handleSort('payments')}>
                          Payments {sortIcon('payments')}
                        </th>
                        <th style={{ cursor: 'pointer' }} className="text-end" onClick={() => handleSort('latestPerShare')}>
                          Per Share {sortIcon('latestPerShare')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.map(t => (
                        <tr key={t.ticker}>
                          <td className="fw-medium">{t.ticker}</td>
                          <td className="text-end">{formatCurrency(t.totalAmount)}</td>
                          <td className="text-end text-muted">
                            {((t.totalAmount / totalDividends) * 100).toFixed(1)}%
                          </td>
                          <td className="text-end">{t.payments}</td>
                          <td className="text-end">
                            {t.latestPerShare > 0 ? formatCurrency(t.latestPerShare) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};
