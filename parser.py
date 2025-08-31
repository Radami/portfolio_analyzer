import csv
import yfinance as yf
from datetime import datetime, timedelta

# --- Configuration ---
INPUT_CSV_PATH = "input.csv"
OUTPUT_CSV_PATH = "output_enhanced.csv"
SP500_TICKER = "^GSPC"  # Ticker symbol for the S&P 500 index
CSV_ENCODING = "UTF-8"

data = []
processed_data = []


# --- Helper Function to Calculate YTD Performance ---
def get_ytd_performance(ticker_symbol, start_date, end_date):
    """
    Fetches historical data and calculates YTD performance for a given ticker.
    Returns the YTD performance percentage or None if data is insufficient.
    """
    try:
        ticker = yf.Ticker(ticker_symbol)
        # Fetch data from start_date to end_date + 1 day to ensure we get the end_date close
        hist = ticker.history(start=start_date, end=end_date)

        if hist.empty or len(hist) < 2:
            # Try fetching with slightly earlier start date if first day data is missing
            alt_start = (datetime.strptime(start_date, "%Y-%m-%d") - timedelta(days=5)).strftime(
                "%Y-%m-%d"
            )
            hist = ticker.history(start=alt_start, end=end_date)
            if hist.empty:
                print(f"Warning: No data for {ticker_symbol} between {start_date} and {end_date}.")
                return None, None  # Return None for both values

        # Find the closest available start and end prices
        start_price = hist["Close"].iloc[0]  # First available closing price in the period
        end_price = hist["Close"].iloc[-1]  # Last available closing price in the period

        if start_price is None or end_price is None or start_price == 0:
            print(f"Warning: Could not determine start/end price for {ticker_symbol}.")
            return None, None

        ytd_performance = ((end_price - start_price) / start_price) * 100
        return ytd_performance, end_price  # Return performance and the last price used

    except Exception as e:
        print(f"Error fetching data for {ticker_symbol}: {e}")
        return None, None


# Determine date range for YTD calculation
today = datetime.today()
start_of_year = datetime(today.year, 1, 1).strftime("%Y-%m-%d")
today_str = today.strftime("%Y-%m-%d")  # Format for yfinance

print(f"Calculating YTD Performance from {start_of_year} to {today_str}")

# --- Calculate S&P 500 YTD Performance ---
sp500_ytd_perf, sp500_last_price = get_ytd_performance(SP500_TICKER, start_of_year, today_str)

if sp500_ytd_perf is not None:
    print(f"S&P 500 ({SP500_TICKER}) YTD Performance: {sp500_ytd_perf:.2f}%")
else:
    print(
        f"""Warning: Could not calculate S&P 500 ({SP500_TICKER}) YTD performance.
            Relative performance will be unavailable."""
    )

with open("input.csv", newline="", encoding="UTF-16") as csvfile:

    reader = csv.reader(csvfile, delimiter=",")

    # Add header row sepparately
    header = next(reader)
    header.extend(["YTD Perf (%)", "Perf vs S&P500 (%)", "YTD End Price"])  # Add new headers
    processed_data.append(header)

    for row in reader:
        # Handle potential short rows (like the empty separator lines)
        if len(row) < 2 or row[1] == "":
            # Add empty placeholders for new columns in separator rows
            data.append(row + [""] * (len(header) - len(row)))
            continue

        ticker = "".join(
            filter(lambda x: x.isalnum() or x == ".", row[0].strip())
        )  # Allow letters, numbers, dots

        if not ticker:
            print(
                f"""Warning: Could not extract a valid ticker from '{row[0]}'.
                    Skipping performance calculation."""
            )
            # Add placeholders for the new columns
            processed_data.append(row + ["N/A", "N/A", "N/A"])
            continue

        print(f"Processing {ticker}...")

        # Get YTD performance for the stock
        stock_ytd_perf, stock_last_price = get_ytd_performance(ticker, start_of_year, today_str)

        ytd_perf_str = "N/A"
        relative_perf_str = "N/A"
        last_price_str = "N/A"

        if stock_ytd_perf is not None:
            ytd_perf_str = f"{stock_ytd_perf:.2f}"
            last_price_str = f"{stock_last_price:.2f}"
            # Calculate relative performance only if both stock and S&P500 data are available
            if sp500_ytd_perf is not None:
                relative_perf = stock_ytd_perf - sp500_ytd_perf
                relative_perf_str = f"{relative_perf:.2f}"
            else:
                relative_perf_str = "N/A (S&P Err)"  # Indicate S&P data was missing

        # Append the original row data plus the new performance data
        processed_data.append(row + [ytd_perf_str, relative_perf_str, last_price_str])

csvfile.close()


# Not used
columns = data[0]
port = {}
for i in range(1, len(data)):
    row = data[i]
    row[0] = "".join(filter(lambda x: x.isupper(), row[0]))
    port[row[0]] = {}
    for c in range(1, len(columns)):
        port[row[0]][columns[c]] = row[c]

# --- Write Enhanced Data to Output CSV ---
print(f"\nWriting enhanced data to {OUTPUT_CSV_PATH}...")
with open(OUTPUT_CSV_PATH, mode="w", newline="", encoding=CSV_ENCODING) as outfile:
    writer = csv.writer(outfile, delimiter=",")
    writer.writerows(processed_data)

print("Processing complete.")
