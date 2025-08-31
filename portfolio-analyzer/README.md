# Portfolio Analyzer

A web-based portfolio analysis tool built with React and Bootstrap that allows users to import CSV portfolios and visualize key financial metrics with interactive charts similar to FASTgraphs.

## Features

- **CSV Portfolio Import**: Import your portfolio from CSV files with current prices and financial metrics
- **Portfolio Analysis**: Comprehensive overview with allocation and performance metrics
- **Interactive Charts**: FASTgraphs-style charts with multiple data series
- **Responsive Design**: Mobile-friendly interface using Bootstrap
- **No External Dependencies**: Works entirely with your CSV data

## Installation

1. Clone or download this repository
2. Navigate to the project directory:
   ```bash
   cd portfolio-analyzer
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

## Running the Application

Start the React development server:

```bash
npm start
```

The application will open in your browser at http://localhost:3000

## CSV Format Requirements

Your CSV file should include the following columns:

### Required Columns:
- **Instrument/Ticker**: Stock symbol (e.g., AAPL, MSFT)
- **Position**: Number of shares
- **Cost Basis**: Total cost of the position
- **Market Value**: Current market value
- **Average Price**: Average price per share

### Optional Columns (for enhanced analysis):
- **Last**: Current stock price (if different from calculated price)
- **P/E Ratio**: Price-to-earnings ratio
- **Dividend Yield**: Dividend yield percentage

## CSV Format Example

```csv
Instrument,Position,Cost Basis,Market Value,Average Price,Last,P/E Ratio,Dividend Yield
AAPL,100,15000,16000,150.00,160.00,25.5,0.6
MSFT,50,12000,12500,240.00,250.00,28.3,0.8
GOOGL,25,8000,8500,320.00,340.00,22.1,0.0
```

## Usage

### Importing a Portfolio

1. Prepare a CSV file with the required columns
2. Click "Choose File" and select your CSV file
3. Click "Import Portfolio" to load your data

### Viewing Portfolio Analysis

- **Portfolio Summary**: Overview of total value, cost basis, and unrealized P&L
- **Stock Table**: Sortable table of all holdings with key metrics
- **Individual Stock Charts**: Click "View Chart" for detailed analysis in the right panel

### Chart Features

Each stock chart displays:
- **Black Line**: Historical and current stock price (simulated from CSV data)
- **Blue Line**: Stock price at historical average P/E ratio
- **Orange Line**: Conservative valuation line (15x P/E ratio)
- **Yellow Line**: Dividend payments over time
- **Green Shaded Area**: Historical earnings transitioning to analyst forecasts

## Technology Stack

- **Frontend**: React 19 with TypeScript
- **UI Framework**: Bootstrap 5
- **Charts**: Chart.js with react-chartjs-2
- **Data Source**: CSV file import only
- **State Management**: React Hooks with localStorage persistence

## Data Processing

### Chart Data Generation
- **Historical Simulation**: Creates 12 months of historical data based on current values
- **Price Variation**: Simulates realistic price movements (±10% from current price)
- **Earnings Calculation**: Calculates earnings based on P/E ratios from CSV
- **Dividend Estimation**: Estimates quarterly dividends from dividend yield data

### Performance Metrics
- **YTD Performance**: Calculated from simulated historical data
- **S&P 500 Comparison**: Assumes 8.5% S&P 500 return for comparison
- **Unrealized P&L**: Real-time calculation from cost basis and market value

## Benefits of CSV-Only Approach

- **No Rate Limiting**: Works entirely offline with your data
- **No API Keys**: No need to register for external services
- **Data Privacy**: All data stays on your local machine
- **Reliable**: No dependency on external API availability
- **Fast**: Instant data loading and chart generation

## Building for Production

```bash
npm run build
```

This creates a `build` folder with optimized production files that can be deployed to any static hosting service.

## Deployment

The app can be deployed to:
- GitHub Pages
- Netlify
- Vercel
- Any static hosting service

**Note**: No server required - this is a pure client-side application.

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [ISC License](LICENSE).

## Support

For issues or questions, please open an issue in the repository.
