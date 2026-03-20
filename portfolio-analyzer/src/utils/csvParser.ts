import { Stock } from '../types';

// Returns the USD/JPY rate (how many JPY per 1 USD) from the statement,
// using the Mark-to-Market Performance Summary end-of-period current price.
function extractUsdJpyRate(lines: string[]): number | null {
  // Mark-to-Market Performance Summary,Data,Forex,USD,<prior qty>,<current qty>,<prior price>,<current price>,...
  // Current Price is at index 5 after slice(2).
  const mtmLine = lines.find(l => l.startsWith('Mark-to-Market Performance Summary,Data,Forex,USD,'));
  if (mtmLine) {
    const fields = mtmLine.split(',').slice(2);
    const rate = parseFloat(fields[5]);
    if (!isNaN(rate) && rate > 0) return rate;
  }

  return null;
}

export function parseIBStatement(csvText: string): Stock[] {
  const lines = csvText.split('\n');

  const headerLineIndex = lines.findIndex(l => l.startsWith('Open Positions,Header,'));
  if (headerLineIndex === -1) {
    throw new Error('Could not find Open Positions section in Interactive Brokers statement.');
  }

  const headerFields = lines[headerLineIndex].split(',').map(h => h.trim());
  const colNames = headerFields.slice(2);

  const currencyIdx = colNames.findIndex(h => h.toLowerCase() === 'currency');
  const symbolIdx = colNames.findIndex(h => h.toLowerCase() === 'symbol');
  const quantityIdx = colNames.findIndex(h => h.toLowerCase() === 'quantity');
  const costPriceIdx = colNames.findIndex(h => h.toLowerCase() === 'cost price');
  const costBasisIdx = colNames.findIndex(h => h.toLowerCase() === 'cost basis');
  const closePriceIdx = colNames.findIndex(h => h.toLowerCase() === 'close price');
  const valueIdx = colNames.findIndex(h => h.toLowerCase() === 'value');

  if (symbolIdx === -1 || quantityIdx === -1 || costBasisIdx === -1 || valueIdx === -1) {
    throw new Error('Required columns not found in Open Positions section.');
  }

  const usdJpyRate = extractUsdJpyRate(lines);

  const stocks: Stock[] = [];

  for (const line of lines) {
    if (!line.startsWith('Open Positions,Data,')) continue;

    const values = line.split(',').map(v => v.trim());
    const fields = values.slice(2);

    const ticker = fields[symbolIdx];
    const currency = currencyIdx !== -1 ? fields[currencyIdx] : 'USD';
    const position = parseFloat(fields[quantityIdx]);
    const rawCostBasis = parseFloat(fields[costBasisIdx]);
    const rawMarketValue = parseFloat(fields[valueIdx]);
    const rawAvgPrice = costPriceIdx !== -1 ? parseFloat(fields[costPriceIdx]) : NaN;
    const rawCurrentPrice = closePriceIdx !== -1 ? parseFloat(fields[closePriceIdx]) : NaN;

    if (!ticker || isNaN(position) || position <= 0 || isNaN(rawCostBasis) || isNaN(rawMarketValue)) {
      continue;
    }

    const isJpy = currency === 'JPY';

    if (isJpy && usdJpyRate === null) {
      console.warn(`Skipping JPY position ${ticker}: no USD/JPY rate found in statement.`);
      continue;
    }

    stocks.push({
      ticker,
      currency,
      position,
      // Monetary values always stored in USD
      costBasis: isJpy ? rawCostBasis / usdJpyRate! : rawCostBasis,
      marketValue: isJpy ? rawMarketValue / usdJpyRate! : rawMarketValue,
      avgPrice: isJpy ? rawAvgPrice / usdJpyRate! : rawAvgPrice,
      // Current price kept in the original currency for display;
      // rawMarketValue / position gives price per share in the native currency for both cases
      currentPrice: isNaN(rawCurrentPrice) ? rawMarketValue / position : rawCurrentPrice,
    });
  }

  return stocks;
}

export function extractSnapshotDate(csvText: string, filename: string): { date: string; label: string } {
  const periodMatch = csvText.match(/Statement,Data,Period,"([^"]+)"/);
  if (periodMatch) {
    const parts = periodMatch[1].split(' - ');
    const endDateStr = parts[parts.length - 1].trim();
    const date = new Date(endDateStr);
    if (!isNaN(date.getTime())) {
      return {
        date: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
      };
    }
  }

  return { date: filename, label: filename.replace('.csv', '') };
}
