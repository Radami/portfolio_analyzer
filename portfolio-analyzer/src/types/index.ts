export interface Stock {
  ticker: string;
  position: number;
  costBasis: number;
  marketValue: number;
  currentPrice: number;
  currency?: string;
}

export interface StockMetadata {
  companyName?: string;
  industryTags: string[];
  typeTags: string[];
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
