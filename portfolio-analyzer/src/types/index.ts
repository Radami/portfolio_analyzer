export interface Stock {
  ticker: string;
  position: number;
  costBasis: number;
  marketValue: number;
  avgPrice: number;
  currentPrice: number;
  peRatio?: number;
  dividendYield?: number;
  ytdPerformance?: number;
  sp500Comparison?: number;
  lastPrice?: string;
  change?: string;
  dailyPL?: number;
  unrealizedPL?: number;
  percentOfNetLiq?: string;
}

export interface Portfolio {
  stocks: Stock[];
  totalValue: number;
  lastUpdated: string;
}

export interface ChartData {
  dates: string[];
  prices: number[];
  earnings: number[];
  dividends: number[];
  avgPE: number[];
  conservativePE: number[];
}

export interface StockData {
  ticker: string;
  currentPrice: number;
  peRatio: number;
  dividendYield: number;
  ytdPerformance: number;
  sp500Performance: number;
  chartData: ChartData;
}
