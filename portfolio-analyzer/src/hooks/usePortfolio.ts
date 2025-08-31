import { useEffect, useState } from 'react';
import { Portfolio, Stock } from '../types';

const STORAGE_KEY = 'portfolio-analyzer-portfolio';

export const usePortfolio = () => {
  const [portfolio, setPortfolio] = useState<Portfolio>({
    stocks: [],
    totalValue: 0,
    lastUpdated: new Date().toISOString()
  });

  // Load portfolio from localStorage on mount
  useEffect(() => {
    const savedPortfolio = localStorage.getItem(STORAGE_KEY);
    if (savedPortfolio) {
      try {
        setPortfolio(JSON.parse(savedPortfolio));
      } catch (error) {
        console.error('Error loading portfolio from localStorage:', error);
      }
    }
  }, []);

  // Save portfolio to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolio));
  }, [portfolio]);

  const updatePortfolio = (newPortfolio: Portfolio) => {
    setPortfolio(newPortfolio);
  };

  const addStock = (stock: Stock) => {
    setPortfolio(prev => ({
      ...prev,
      stocks: [...prev.stocks, stock],
      totalValue: prev.totalValue + stock.marketValue
    }));
  };

  const removeStock = (ticker: string) => {
    setPortfolio(prev => {
      const stockToRemove = prev.stocks.find(s => s.ticker === ticker);
      return {
        ...prev,
        stocks: prev.stocks.filter(s => s.ticker !== ticker),
        totalValue: prev.totalValue - (stockToRemove?.marketValue || 0)
      };
    });
  };

  const updateStock = (ticker: string, updates: Partial<Stock>) => {
    setPortfolio(prev => ({
      ...prev,
      stocks: prev.stocks.map(stock => 
        stock.ticker === ticker ? { ...stock, ...updates } : stock
      )
    }));
  };

  const clearPortfolio = () => {
    setPortfolio({
      stocks: [],
      totalValue: 0,
      lastUpdated: new Date().toISOString()
    });
  };

  return {
    portfolio,
    updatePortfolio,
    addStock,
    removeStock,
    updateStock,
    clearPortfolio
  };
};
