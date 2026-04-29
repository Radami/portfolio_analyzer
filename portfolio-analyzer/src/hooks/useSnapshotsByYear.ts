import { useMemo } from 'react';
import { Snapshot } from './useSnapshots';

interface SnapshotEntry {
  snapshot: Snapshot;
  index: number;
}

// Derives two structures from the flat snapshots array for use by the year/month picker:
// - years: sorted list of distinct years present in the data
// - byYear: map from year → [{snapshot, index}], where index is the position in the original
//   array so the picker can set selectedIndex without searching.
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
