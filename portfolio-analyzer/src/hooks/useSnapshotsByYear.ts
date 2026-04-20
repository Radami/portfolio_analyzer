import { useMemo } from 'react';
import { Snapshot } from './useSnapshots';

interface SnapshotEntry {
  snapshot: Snapshot;
  index: number;
}

export const useSnapshotsByYear = (snapshots: Snapshot[]) => {
  return useMemo(() => {
    const map = new Map<number, SnapshotEntry[]>();
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
};
