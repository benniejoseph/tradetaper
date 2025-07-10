# L2A1: Technical Design - Automated Chart-to-Journal Entry

## 1. Feature Description

The Automated Chart-to-Journal Entry feature will allow traders to upload a screenshot of a trading chart. A Vision AI model (Gemini Pro Vision) will analyze the image to extract key trade-related information, such as entry/exit points, instrument, timeframe, indicators, and patterns. This extracted information will then be used to automatically draft a structured trade journal entry, significantly reducing manual data entry and improving the consistency and richness of journal records.

## 2. Core Functionality

-   **Image Upload**: User uploads a chart screenshot via the `tradetaper-frontend`.
-   **Image Pre-processing**: (Optional) Resize, crop, or enhance the image for optimal AI analysis.
-   **Vision AI Analysis**: Send the image to Gemini Pro Vision with a prompt to extract specific trade-related data points.
-   **Data Extraction**: Identify and extract:
    -   **Instrument**: e.g., EUR/USD, BTC/USD, AAPL
    -   **Timeframe**: e.g., M15, H1, D1
    -   **Entry/Exit Points**: Price levels, potentially with timestamps if visible.
    -   **Indicators**: Identify common indicators (e.g., Moving Averages, RSI, MACD) and their values/positions.
    -   **Chart Patterns**: Recognize basic chart patterns (e.g., head and shoulders, double top/bottom, triangles).
    -   **Trade Direction**: Buy/Sell based on visual cues.
    -   **Date/Time**: If visible on the chart.
-   **Journal Entry Drafting**: Use the extracted data to populate fields in a new trade journal entry (e.g., instrument, entry price, exit price, notes section for patterns/indicators).
-   **User Review & Edit**: Present the drafted entry to the user for review, modification, and final saving.

## 3. Technical Design

### 3.1. Data Flow

1.  **User Upload**: User uploads an image file (e.g., PNG, JPG) from `tradetaper-frontend`.
2.  **Frontend to Backend**: `tradetaper-frontend` sends the image file (e.g., as a `multipart/form-data` or base64 encoded) to `tradetaper-backend` via a new API endpoint (e.g., `POST /trades/analyze-chart`).
3.  **Backend Processing**: `tradetaper-backend` receives the image.
4.  **Image Storage (Temporary)**: Temporarily store the image if needed for processing or logging.
5.  **Gemini Vision Service Call**: `tradetaper-backend`'s `TradesService` (or a new `ChartAnalysisService`) calls the `GeminiVisionService` with the image data and a detailed prompt.
6.  **Gemini API Interaction**: The Gemini Vision service sends the image and prompt to the Gemini Pro Vision model.
7.  **Gemini Response**: Gemini Pro Vision returns structured data (e.g., JSON) containing the extracted trade details.
8.  **Backend Data Mapping**: `tradetaper-backend` maps the extracted data from Gemini's response to the `CreateTradeDto` or a similar DTO for a new trade entry.
9.  **API Response**: `tradetaper-backend` sends the drafted trade entry data back to `tradetaper-frontend`.
10. **Frontend Display**: `tradetaper-frontend` populates a new trade entry form with the received data, allowing the user to review and save.

### 3.2. Proposed API Endpoints

-   `POST /trades/analyze-chart`: Analyzes an uploaded chart image and returns drafted trade data.
    -   **Request**: `multipart/form-data` containing the image file.
    -   **Response**: `{ instrument: string, timeframe: string, entryPrice: number, exitPrice: number, tradeDirection: 'buy' | 'sell', notes: string, chartImageUrl: string }` (simplified example)

### 3.3. Database Changes

-   **Existing `trades` table**: The extracted data will populate existing fields in the `trades` table (e.g., `instrument`, `entryPrice`, `exitPrice`, `tradeDirection`).
-   **New field in `trades` table**: `chart_image_url` (VARCHAR) to store the URL of the uploaded chart image (if stored in Cloud Storage).
-   **New field in `notes` table**: `chart_analysis_data` (JSONB, nullable) to store the raw structured data returned by Gemini Vision for a note, if the note is associated with a chart analysis.

### 3.4. Gemini Prompt Engineering (Example Concept)

```
"Analyze the provided trading chart image. Identify the following information and return it as a JSON object:
-   `instrument`: The trading pair or asset (e.g., EUR/USD, BTC/USD, AAPL).
-   `timeframe`: The chart timeframe (e.g., M15, H1, D1, W1).
-   `entryPrice`: The approximate entry price if visible.
-   `exitPrice`: The approximate exit price if visible.
-   `tradeDirection`: 'buy' or 'sell' based on the overall trade movement.
-   `notes`: A brief description of any visible indicators, chart patterns (e.g., 'double top', 'head and shoulders', 'triangle'), or significant price action.

If any information is not clearly visible or cannot be confidently extracted, return null or an empty string for that field.

Example Output:
{
  "instrument": "EUR/USD",
  "timeframe": "H1",
  "entryPrice": 1.0850,
  "exitPrice": 1.0920,
  "tradeDirection": "buy",
  "notes": "Identified a bullish engulfing pattern near support. RSI was oversold."
}"
```

## 4. Frontend Integration

-   **Upload Component**: A new UI component for uploading images, possibly with drag-and-drop functionality.
-   **Form Pre-population**: Automatically populate the trade entry form fields with the data received from the backend.
-   **Image Preview**: Display the uploaded image for user reference.
-   **Edit & Confirm**: Allow users to easily edit the AI-drafted information before saving the final trade entry.

## 5. Future Considerations

-   **Advanced Pattern Recognition**: Train custom models for more complex or user-defined chart patterns.
-   **Multi-image Analysis**: Allow uploading multiple images for a single trade (e.g., entry, mid-trade, exit screenshots).
-   **Direct MT5 Integration**: Integrate directly with MT5 to capture screenshots automatically.
-   **Indicator Customization**: Allow users to specify which indicators they want the AI to focus on.