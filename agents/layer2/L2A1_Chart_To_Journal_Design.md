# L2A1: Automated Chart-to-Journal Entry Feature Design

## 1. Feature Overview
This feature allows users to upload a screenshot of a trading chart. The system will use Google Gemini Vision AI to analyze the image, extract key trading information (e.g., instrument, entry/exit points, date, time, patterns, indicators), and automatically generate a draft trade journal entry. The user can then review, edit, and save this draft.

## 2. Technical Design

### 2.1. Frontend (tradetaper-frontend)

*   **UI Component:** A new React component (e.g., `ChartUploadComponent.tsx`) will be created, likely integrated into the existing journal creation flow or as a standalone entry point.
*   **Image Upload:**
    *   Drag-and-drop area for image files (PNG, JPG).
    *   Standard file input (`<input type="file">`) as an alternative.
    *   Client-side image validation (file type, size limits).
*   **User Feedback:**
    *   Loading spinner/progress indicator during AI processing.
    *   Display of the drafted journal entry in a rich-text editor (similar to existing note editor).
    *   Error messages for failed uploads or processing.
*   **Data Flow:**
    *   User selects/drops image.
    *   Image is converted to Base64 string (or Blob/FormData for larger files, to be determined during implementation based on API limits).
    *   Frontend sends a POST request to a new backend API endpoint (e.g., `/api/notes/chart-to-journal`).
    *   Receives drafted journal entry (JSON) from the backend.
    *   Populates the journal entry form with the received data.
*   **Dependencies:** `axios` for API calls, potentially a library for image handling/resizing if needed.

### 2.2. Backend (tradetaper-backend)

*   **New API Endpoint:**
    *   `POST /api/notes/chart-to-journal`
    *   **Request Body:** `multipart/form-data` containing the image file, or JSON with Base64 encoded image string.
    *   **Response:** `NoteResponseDto` (or a similar DTO for a draft note).
*   **Controller (`notes/ai.controller.ts` or new `chart-analysis.controller.ts`):**
    *   Receives the image file.
    *   Calls a new service (e.g., `ChartAnalysisService`).
    *   Handles authentication and authorization.
    *   Returns the drafted note data to the frontend.
*   **New Service (`notes/chart-analysis.service.ts`):**
    *   **Responsibility:** Orchestrates the image analysis process.
    *   Receives the image data.
    *   Calls `GeminiVisionService.analyzeImage` with the image and a specific prompt.
    *   Parses the Gemini Vision response into a structured format.
    *   Maps the extracted data to a `CreateNoteDto` (or directly to a `Note` entity if saving immediately).
    *   Potentially interacts with `NotesService` to save the draft note.
*   **Error Handling:** Implement robust error handling for API calls, Gemini Vision failures, and data parsing issues.

### 2.3. Gemini Vision API Interaction (`notes/gemini-vision.service.ts`)

*   **Method:** A new method `analyzeChartImage(imageBuffer: Buffer, prompt: string)` will be added or an existing one extended.
*   **Image Format:** The Gemini Vision API accepts image data as `Buffer` or `Uint8Array`. The frontend will send Base64, which the backend will convert to a Buffer.
*   **Prompt Engineering:**
    *   The prompt will be crucial for accurate extraction. It needs to instruct Gemini Vision to identify specific elements from a trading chart.
    *   **Example Prompt Structure:**
        ```
        "Analyze this trading chart image. Identify the following:
        - Trading Instrument (e.g., EUR/USD, BTC/USD, Apple Stock)
        - Timeframe (e.g., 1-hour, Daily, 5-minute)
        - Entry Price (if visible)
        - Exit Price (if visible)
        - Stop Loss (if visible)
        - Take Profit (if visible)
        - Date and Time of the trade (if visible)
        - Key chart patterns (e.g., Head and Shoulders, Double Top/Bottom, Trendlines)
        - Relevant indicators and their values (e.g., RSI, MACD, Moving Averages)
        - Overall market sentiment (bullish, bearish, neutral)
        - Any other significant observations.

        Format the output as a JSON object with clear keys for each piece of information. If a piece of information is not visible or applicable, use 'N/A'.
        Example:
        {
          "instrument": "EUR/USD",
          "timeframe": "1-hour",
          "entryPrice": "1.0850",
          "exitPrice": "1.0920",
          "stopLoss": "1.0820",
          "takeProfit": "1.0950",
          "tradeDate": "2023-10-26",
          "tradeTime": "14:30 UTC",
          "chartPatterns": ["Ascending Triangle"],
          "indicators": [{"name": "RSI", "value": "70"}],
          "sentiment": "Bullish",
          "observations": "Price broke above resistance after a period of consolidation."
        }
        "
        ```
*   **Response Parsing:** The `ChartAnalysisService` will parse the JSON output from Gemini Vision and map it to the `Note` entity or a `CreateNoteDto`.

## 3. Data Model Considerations

*   The extracted chart data will primarily populate fields within the existing `Note` entity (e.g., `content` field for the narrative, and potentially new custom fields if specific structured data points are deemed necessary for future analytics).
*   Consider adding a `chartImageUrl` field to the `Note` entity to store a reference to the uploaded image in Google Cloud Storage.

## 4. Future Enhancements (Out of Scope for initial implementation)

*   Integration with actual trade data (from MT5 import) to cross-reference chart analysis with executed trades.
*   Advanced image processing (e.g., OCR for text on charts, object detection for specific chart elements).
*   User-defined templates for journal entries based on extracted chart data.
