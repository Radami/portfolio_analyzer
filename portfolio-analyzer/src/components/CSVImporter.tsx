import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState } from 'react';
import { Portfolio, Stock } from '../types';

interface CSVImporterProps {
  onPortfolioImport: (portfolio: Portfolio) => void;
}

export const CSVImporter: React.FC<CSVImporterProps> = ({ onPortfolioImport }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseCSV = (csvText: string): Stock[] => {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    console.log('CSV Headers:', headers); // Debug log
    
    // Find required column indices with more flexible matching
    const tickerIndex = headers.findIndex(h => 
      h.toLowerCase().includes('instrument') || h.toLowerCase().includes('ticker') || h.toLowerCase().includes('symbol')
    );

    if (tickerIndex == -1) {
        console.log(headers)
        throw new Error("ticker index doesn't work");
    }

    const positionIndex = headers.findIndex(h => 
      h.toLowerCase().includes('position') || h.toLowerCase().includes('shares')
    );
    const costBasisIndex = headers.findIndex(h => 
      h.toLowerCase().includes('cost basis') || h.toLowerCase().includes('costbasis') || h.toLowerCase().includes('cost')
    );
    const marketValueIndex = headers.findIndex(h => 
      h.toLowerCase().includes('market value') || h.toLowerCase().includes('marketvalue') || h.toLowerCase().includes('market')
    );
    const avgPriceIndex = headers.findIndex(h => 
      h.toLowerCase().includes('avg price') || h.toLowerCase().includes('avgprice') || h.toLowerCase().includes('average price') || h.toLowerCase().includes('avg')
    );
    
    // Find additional data columns
    const lastPriceIndex = headers.findIndex(h => 
      h.toLowerCase().includes('last') || h.toLowerCase().includes('current price')
    );
    const peRatioIndex = headers.findIndex(h => 
      h.toLowerCase().includes('p/e') || h.toLowerCase().includes('pe') || h.toLowerCase().includes('pe ratio') || h.toLowerCase().includes('p/e')
    );
    const dividendYieldIndex = headers.findIndex(h => 
      h.toLowerCase().includes('dividend') || h.toLowerCase().includes('div') || h.toLowerCase().includes('yield')
    );

    console.log('Column indices found:', {
      tickerIndex,
      positionIndex,
      costBasisIndex,
      marketValueIndex,
      avgPriceIndex,
      lastPriceIndex,
      peRatioIndex,
      dividendYieldIndex
    });

    if (tickerIndex === -1 || positionIndex === -1 || costBasisIndex === -1 || 
        marketValueIndex === -1 || avgPriceIndex === -1) {
      throw new Error(`Required columns not found. Found: ${headers.join(', ')}. Please ensure your CSV has: Instrument/Ticker, Position, Cost Basis, Market Value, and Average Price columns.`);
    }

    const stocks: Stock[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(',').map(v => v.trim());
      
      if (values.length < Math.max(tickerIndex, positionIndex, costBasisIndex, marketValueIndex, avgPriceIndex) + 1) {
        continue; // Skip incomplete lines
      }

      const ticker = values[tickerIndex];
      const position = parseFloat(values[positionIndex]) || 0;
      const costBasis = parseFloat(values[costBasisIndex]) || 0;
      const marketValue = parseFloat(values[marketValueIndex]) || 0;
      const avgPrice = parseFloat(values[avgPriceIndex]) || 0;
      
      // Extract additional data if available
      const lastPrice = lastPriceIndex !== -1 ? parseFloat(values[lastPriceIndex]) || 0 : 0;
      const peRatio = peRatioIndex !== -1 ? parseFloat(values[peRatioIndex]) || 0 : 0;
      const dividendYield = dividendYieldIndex !== -1 ? parseFloat(values[dividendYieldIndex]) || 0 : 0;

      if (ticker && position > 0) {
        stocks.push({
          ticker,
          position,
          costBasis,
          marketValue,
          avgPrice,
          currentPrice: lastPrice || marketValue / position,
          peRatio: peRatio > 0 ? peRatio : undefined,
          dividendYield: dividendYield > 0 ? dividendYield : undefined
        });
      }
    }

    return stocks;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setError(null);
    } else {
      setError('Please select a valid CSV file.');
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const text = await file.text();
      const stocks = parseCSV(text);
      
      if (stocks.length === 0) {
        throw new Error('No valid stock data found in the CSV file.');
      }

      const totalValue = stocks.reduce((sum, stock) => sum + stock.marketValue, 0);
      
      const portfolio: Portfolio = {
        stocks,
        totalValue,
        lastUpdated: new Date().toISOString()
      };

      onPortfolioImport(portfolio);
      setFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('csv-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV file.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h5 className="mb-0">Import Portfolio</h5>
      </div>
      <div className="card-body">
        <div className="mb-3">
          <label htmlFor="csv-file" className="form-label">
            Select CSV File
          </label>
          <input
            type="file"
            className="form-control"
            id="csv-file"
            accept=".csv"
            onChange={handleFileChange}
          />
          <div className="form-text">
            Upload a CSV file with columns: Instrument/Ticker, Position, Cost Basis, Market Value, Average Price, Last (current price), P/E Ratio, Dividend Yield
          </div>
        </div>
        
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        
        <button
          className="btn btn-primary"
          onClick={handleImport}
          disabled={!file || loading}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Importing...
            </>
          ) : (
            'Import Portfolio'
          )}
        </button>
        
        {file && (
          <div className="mt-2">
            <small className="text-muted">
              Selected file: {file.name}
            </small>
          </div>
        )}
      </div>
    </div>
  );
};
