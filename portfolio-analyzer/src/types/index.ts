export interface Stock {
  ticker: string;
  position: number;
  costBasis: number;
  marketValue: number;
  currentPrice: number;
  currency?: string;
  tags?: string[];
}

export interface DividendEntry {
  date: string;
  ticker: string;
  amountPerShare: number;
  totalAmount: number;
  currency: string;
}

export interface Portfolio {
  stocks: Stock[];
  dividends: DividendEntry[];
  totalValue: number;
  lastUpdated: string;
}

export interface StockTags {
    [ticker: string]: string[];
  }