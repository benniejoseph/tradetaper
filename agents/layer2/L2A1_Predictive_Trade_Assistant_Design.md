
# L2A1: Technical Design - Predictive Trade Assistant

## 1. Feature Description

The Predictive Trade Assistant will leverage a trader's historical trade data to model and predict the probability of success (e.g., profitability, win rate) for new trade setups. Users will input criteria for a potential trade, and the AI will provide a probabilistic assessment based on similar past trades and their outcomes.

## 2. Core Functionality

-   **Historical Data Ingestion**: Utilize existing trade data (entry/exit, instrument, direction, P/L, duration, etc.) from the `trades` table.
-   **Feature Engineering**: Extract relevant features from historical data (e.g., time of day, day of week, instrument volatility, previous trade outcome).
-   **Model Training (Offline/Batch)**: Develop and train a machine learning model (e.g., classification for win/loss, regression for P/L) using the aggregated historical data. This training would likely occur periodically or on demand.
-   **Trade Setup Input**: Allow users to define parameters for a hypothetical new trade (e.g., instrument, direction, expected duration, entry price, stop loss, take profit).
-   **Prediction Generation**: The trained model will take the user's input and generate a prediction, such as:
    -   Probability of a profitable trade (e.g., 70% chance of profit).
    -   Expected P/L range.
    -   Predicted win/loss outcome.
-   **Confidence Score**: Provide a confidence score for the prediction.
-   **Visualization**: Present the prediction in an intuitive way (e.g., a gauge, a simple statement, a chart).

## 3. Technical Design

### 3.1. Data Flow

1.  **User Input**: User defines a hypothetical trade setup in `tradetaper-frontend`.
2.  **API Call**: `tradetaper-frontend` sends the trade setup parameters to `tradetaper-backend` via a new API endpoint (e.g., `POST /predictive-trades/predict`).
3.  **Backend Processing**: `tradetaper-backend` receives the trade setup.
4.  **Data Retrieval**: `PredictiveTradeService` retrieves relevant historical trade data for the user from the `trades` table.
5.  **Model Inference**: The `PredictiveTradeService` (or a dedicated ML inference module) feeds the user's trade setup and relevant historical context into the pre-trained ML model.
6.  **Prediction Output**: The ML model returns the prediction (e.g., probability of profit, expected P/L).
7.  **API Response**: `tradetaper-backend` sends the prediction back to `tradetaper-frontend`.
8.  **Frontend Display**: `tradetaper-frontend` displays the prediction to the user.

### 3.2. Proposed API Endpoints

-   `POST /predictive-trades/predict`: Generates a prediction for a hypothetical trade setup.
    -   **Request**: `{ userId: string, instrument: string, direction: 'buy' | 'sell', entryPrice: number, stopLoss: number, takeProfit: number, expectedDurationHours?: number }`
    -   **Response**: `{ probabilityOfProfit: number, expectedPnL: { min: number, max: number }, predictedOutcome: 'win' | 'loss' | 'neutral', confidence: number }`
-   `POST /predictive-trades/train-model` (Admin/Internal): Triggers retraining of the ML model for a specific user or globally.
    -   **Request**: `{ userId?: string }`
    -   **Response**: `{ status: 'training' | 'completed', message: string }`

### 3.3. Database Changes

-   **No new tables are strictly required** for the core prediction functionality, as it primarily uses existing `trades` data.
-   **Potential new table**: `ml_model_metadata` (for tracking model versions, training dates, performance metrics).
    -   `id` (UUID, PK)
    -   `modelName` (VARCHAR)
    -   `version` (VARCHAR)
    -   `trainingDate` (TIMESTAMP)
    -   `performanceMetrics` (JSONB, e.g., accuracy, precision, recall)
    -   `userId` (UUID, FK to `users` table, nullable for global models)

### 3.4. Machine Learning Model (Conceptual)

-   **Type**: Could start with a simple logistic regression or a Random Forest classifier for win/loss prediction. For P/L prediction, a regression model (e.g., Linear Regression, Gradient Boosting Regressor).
-   **Implementation**: Python-based (e.g., scikit-learn) for model training, potentially exposed via a microservice or integrated into the NestJS backend using a library like `child_process` to run Python scripts (though a dedicated microservice is preferred for scalability and maintainability).
-   **Features**: Instrument, trade direction, entry/exit price difference, duration, time of day, day of week, volume, volatility (derived).

## 4. Frontend Integration

-   **Prediction Form**: A new form in `tradetaper-frontend` where users can input hypothetical trade parameters.
-   **Results Display**: A dedicated section to display the prediction results, including probability, expected P/L, and confidence score, possibly with visual elements like a progress bar or gauge.
-   **Historical Context**: Optionally, display similar past trades that the AI used for its prediction.

## 5. Future Considerations

-   **External Data Integration**: Incorporate external market data (e.g., news sentiment, economic indicators) to enhance prediction accuracy.
-   **User Feedback Loop**: Allow users to provide feedback on prediction accuracy to continuously improve the model.
-   **Model Explainability**: Provide explanations for why a particular prediction was made (e.g., "Similar trades on this instrument during this time of day have historically been profitable").
