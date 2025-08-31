import { useEffect, useState } from 'react';
import { Stock, StockData } from '../types';

// Generate chart data from CSV portfolio data
const generateChartData = (stock: Stock): StockData => {
  // Create historical-like data based on current values
  const currentPrice = stock.currentPrice;
  const peRatio = stock.peRatio || 15; // Default P/E if not provided
  
  // Generate 12 months of historical data
  const dates = [];
  const prices = [];
  const earnings = [];
  const dividends = [];
  const avgPE = [];
  const conservativePE = [];
  
  const today = new Date();
  for (let i = 11; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    dates.push(date.toLocaleDateString());
    
    // Simulate price variation (±10% from current price)
    const variation = 0.9 + (Math.random() * 0.2);
    const historicalPrice = currentPrice * variation;
    prices.push(historicalPrice);
    
    // Calculate earnings based on P/E ratio
    const historicalEarnings = historicalPrice / peRatio;
    earnings.push(historicalEarnings);
    
    // Estimate dividends (if dividend yield is provided)
    const dividendAmount = stock.dividendYield ? (historicalPrice * stock.dividendYield / 100) / 4 : 0;
    dividends.push(dividendAmount);
    
    // Use provided P/E ratio or default
    avgPE.push(peRatio);
    conservativePE.push(15); // Conservative 15x P/E
  }
  
  // Calculate YTD performance (simplified)
  const ytdPerformance = ((currentPrice - prices[0]) / prices[0]) * 100;
  
  return {
    ticker: stock.ticker,
    currentPrice,
    peRatio: peRatio || 0,
    dividendYield: stock.dividendYield || 0,
    ytdPerformance,
    sp500Performance: ytdPerformance - 8.5, // Assume S&P 500 returned 8.5% YTD
    chartData: {
      dates,
      prices,
      earnings,
      dividends,
      avgPE,
      conservativePE
    }
  };
};

export const useStockData = (ticker: string) => {
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticker) return;

    const fetchStockData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Get stock data from localStorage (portfolio data)
        const savedPortfolio = localStorage.getItem('portfolio-analyzer-portfolio');
        if (!savedPortfolio) {
          throw new Error('No portfolio data found. Please import a CSV file first.');
        }

        const portfolio = JSON.parse(savedPortfolio);
        const stock = portfolio.stocks.find((s: Stock) => s.ticker === ticker);
        
        if (!stock) {
          throw new Error(`Stock ${ticker} not found in portfolio.`);
        }

        // Generate chart data from CSV data
        const stockData = generateChartData(stock);
        setStockData(stockData);

      } catch (err) {
        console.error('Error processing stock data:', err);
        setError(err instanceof Error ? err.message : 'Failed to process stock data');
        setStockData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStockData();
  }, [ticker]);

  return { stockData, loading, error };
};

// Hook for processing multiple stocks data
export const useMultipleStockData = (tickers: string[]) => {
  const [stocksData, setStocksData] = useState<{ [key: string]: StockData }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tickers.length === 0) return;

    const processAllStockData = async () => {
      setLoading(true);
      setError(null);

      try {
        const data: { [key: string]: StockData } = {};
        
        // Get portfolio data from localStorage
        const savedPortfolio = localStorage.getItem('portfolio-analyzer-portfolio');
        if (!savedPortfolio) {
          throw new Error('No portfolio data found. Please import a CSV file first.');
        }

        const portfolio = JSON.parse(savedPortfolio);
        
        // Process each ticker
        for (const ticker of tickers) {
          try {
            const stock = portfolio.stocks.find((s: Stock) => s.ticker === ticker);
            
            if (stock) {
              // Generate chart data from CSV data
              data[ticker] = generateChartData(stock);
            } else {
              // Create minimal data for missing stocks
              data[ticker] = {
                ticker,
                currentPrice: 0,
                peRatio: 0,
                dividendYield: 0,
                ytdPerformance: 0,
                sp500Performance: 0,
                chartData: {
                  dates: [],
                  prices: [],
                  earnings: [],
                  dividends: [],
                  avgPE: [],
                  conservativePE: []
                }
              };
            }
          } catch (err) {
            console.error(`Error processing data for ${ticker}:`, err);
            // Create minimal data for failed stocks
            data[ticker] = {
              ticker,
              currentPrice: 0,
              peRatio: 0,
              dividendYield: 0,
              ytdPerformance: 0,
              sp500Performance: 0,
              chartData: {
                dates: [],
                prices: [],
                earnings: [],
                dividends: [],
                avgPE: [],
                conservativePE: []
              }
            };
          }
        }

        setStocksData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to process stock data');
      } finally {
        setLoading(false);
      }
    };

    processAllStockData();
  }, [tickers]);

  return { stocksData, loading, error };
};
