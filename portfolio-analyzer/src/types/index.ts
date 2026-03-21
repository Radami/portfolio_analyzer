export interface Stock {
  ticker: string;
  position: number;
  costBasis: number;
  marketValue: number;
  currentPrice: number;
  currency?: string;
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