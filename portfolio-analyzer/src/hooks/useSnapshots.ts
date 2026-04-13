import { useEffect, useState } from 'react';
import { Portfolio } from '../types';
import { parseIBStatement, extractSnapshotDate, parseDividends } from '../utils/csvParser';

export interface Snapshot {
  filename: string;
  date: string;
  label: string;
  portfolio: Portfolio;
}

export const useSnapshots = () => {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const load = async () => {
      try {
        const manifestRes = await fetch('/data/manifest.json', { signal });
        if (!manifestRes.ok) throw new Error('Could not load snapshot manifest.');
        const { files } = await manifestRes.json() as { files: string[] };

        const results = await Promise.all(
          files.map(async (filename): Promise<Snapshot | null> => {
            try {
              const csvRes = await fetch(`/data/${filename}`, { signal });
              if (!csvRes.ok) return null;
              const csvText = await csvRes.text();
              const stocks = parseIBStatement(csvText);
              if (stocks.length === 0) return null;
              const dividends = parseDividends(csvText);
              const { date, label } = extractSnapshotDate(csvText, filename);
              return {
                filename,
                date,
                label,
                portfolio: {
                  stocks,
                  dividends,
                  totalValue: stocks.reduce((sum, s) => sum + s.marketValue, 0),
                  lastUpdated: date,
                },
              };
            } catch (e) {
              if ((e as DOMException).name !== 'AbortError') {
                console.error(`Failed to load ${filename}:`, e);
              }
              return null;
            }
          })
        );

        const loaded = (results.filter(Boolean) as Snapshot[])
          .sort((a, b) => a.date.localeCompare(b.date));

        if (!signal.aborted) {
          setSnapshots(loaded);
        }
      } catch (e) {
        if ((e as DOMException).name !== 'AbortError') {
          setError(e instanceof Error ? e.message : 'Failed to load snapshots.');
        }
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    };

    load();
    return () => controller.abort();
  }, []);

  return { snapshots, loading, error };
};
