import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useMemo, useState } from 'react';
import { useSnapshotsByYear } from '../hooks/useSnapshotsByYear';
import { Snapshot } from '../hooks/useSnapshots';
import { DividendEntry } from '../types';
import { PeriodPicker, PeriodSelection } from './PeriodPicker';

interface DividendsDashboardProps {
  snapshots: Snapshot[];
}

type SortKey = 'ticker' | 'totalAmount' | 'payments' | 'latestPerShare';
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

const yearLabel = (year: number) => (year === CURRENT_YEAR ? 'Year-to-date' : String(year));

export const DividendsDashboard: React.FC<DividendsDashboardProps> = ({ snapshots }) => {
  const { years } = useSnapshotsByYear(snapshots);

  const defaultYear = useMemo(
    () => (years.includes(CURRENT_YEAR) ? CURRENT_YEAR : years[years.length - 1] ?? CURRENT_YEAR),
    [years]
  );

  const [selection, setSelection] = useState<PeriodSelection>({ mode: 'yearly', year: defaultYear });

  // --- Sorting ---
  const [sortKey, setSortKey] = useState<SortKey>('totalAmount');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // --- Derive dividends for the active view ---
  const dividends = useMemo<DividendEntry[]>(() => {
    if (selection.mode === 'monthly') {
      return snapshots[selection.snapshotIndex]?.portfolio.dividends ?? [];
    }
    return snapshots
      .filter(s => new Date(s.date).getFullYear() === selection.year)
      .flatMap(s => s.portfolio.dividends);
  }, [selection, snapshots]);

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
      else if (sortKey === 'totalAmount') cmp = a.totalAmount - b.totalAmount;
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

  const emptyMessage = selection.mode === 'monthly'
    ? 'No dividend data for this snapshot.'
    : `No monthly statements found for ${yearLabel(selection.year)} yet.`;

  return (
    <>
      {/* View mode toggle + period picker */}
      <div className="row mb-4">
        <div className="col-12">
          <PeriodPicker
            snapshots={snapshots}
            showViewToggle
            defaultViewMode="yearly"
            yearLabel={yearLabel}
            onChange={setSelection}
          />
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
                        <th style={{ cursor: 'pointer' }} className="text-end" onClick={() => handleSort('totalAmount')}>
                          % of Total {sortIcon('totalAmount')}
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
