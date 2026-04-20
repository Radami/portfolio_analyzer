import { useCallback, useEffect, useState } from 'react';
import { StockMetadata } from '../types';

const EMPTY: StockMetadata = { industryTags: [], typeTags: [] };

export const useStockMetadata = () => {
  const [metadata, setMetadata] = useState<Record<string, StockMetadata>>({});

  useEffect(() => {
    fetch('/data/stock-metadata.json')
      .then(r => r.json())
      .then(setMetadata)
      .catch(console.error);
  }, []);

  const getMetadata = useCallback(
    (ticker: string): StockMetadata => metadata[ticker] ?? EMPTY,
    [metadata]
  );

  const getAllTags = useCallback((): string[] => {
    const all = new Set<string>();
    Object.values(metadata).forEach(m => {
      [...m.industryTags, ...m.typeTags].forEach(t => all.add(t));
    });
    return Array.from(all).sort();
  }, [metadata]);

  return { getMetadata, getAllTags };
};
