import { useCallback, useEffect, useState } from 'react';
import { STOCK_TAGS } from '../data/stockTags';
import { StockTags } from '../types';

const STORAGE_KEY = 'portfolio-analyzer-tags';

export const useStockTags = () => {
  const [stockTags, setStockTags] = useState<StockTags>(STOCK_TAGS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
   
      setStockTags(STOCK_TAGS);
    }, []);

  // Save tags to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stockTags));
  }, [stockTags]);

  const getTagsForTicker = useCallback((ticker: string): string[] => {
    return stockTags[ticker] || [];
  }, [stockTags]);

  const getAllTags = useCallback((): string[] => {
    const allTags = new Set<string>();
    Object.values(stockTags).forEach(tags => {
      tags.forEach(tag => allTags.add(tag));
    });
    return Array.from(allTags).sort();
  }, [stockTags]);

  return {
    stockTags,
    loading,
    error,
    getTagsForTicker,
    getAllTags
  };
};
