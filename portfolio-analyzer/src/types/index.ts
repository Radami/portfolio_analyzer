export interface Stock {
  ticker: string;
  position: number;
  costBasis: number;
  marketValue: number;
  currentPrice: number;
  currency?: string;
  peRatio?: number;
  dividendYield?: number;
  tags?: string[];
}

export interface Portfolio {
  stocks: Stock[];
  totalValue: number;
  lastUpdated: string;
}

export interface StockTags {
    [ticker: string]: string[];
  }