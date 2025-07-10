# L2A2: Database Modification Plan

This document outlines the proposed modifications to the PostgreSQL database schema to support the new AI Psychological Profiler, Predictive Trade Assistant, and Automated Chart-to-Journal Entry features.

## 1. Existing Schema (Assumed Relevant Tables)

Based on the project summary and codebase analysis, the following tables are assumed to be present and relevant:

-   `users`: Stores user information.
-   `accounts`: Stores trading account details.
-   `trades`: Stores individual trade records.
-   `notes`: Stores trade journal notes.
-   `tags`: Stores tags associated with notes or trades.
-   `strategies`: Stores trading strategies.
-   `subscriptions`: Stores user subscription details.
-   `usage`: Tracks user feature usage.
-   `mt5_accounts`: Stores MetaTrader 5 account connections.

## 2. Proposed Database Modifications

### 2.1. For AI Psychological Profiler

**New Table: `psychological_insights`**

-   **Purpose**: To store structured psychological insights extracted by the AI from trade notes. This table will enable historical tracking, trend analysis, and reporting of a user's psychological profile over time.
-   **Columns**:
    -   `id` (UUID, Primary Key): Unique identifier for each psychological insight.
    -   `user_id` (UUID, Foreign Key to `users.id`, NOT NULL): Links the insight to a specific user.
    -   `note_id` (UUID, Foreign Key to `notes.id`, NULLABLE): Links the insight to a specific trade note. It is nullable to allow for insights that might be derived from aggregated data or not directly tied to a single note.
    -   `insight_type` (VARCHAR, NOT NULL): Categorization of the psychological bias or pattern (e.g., 'FOMO', 'Revenge Trading', 'Overconfidence', 'Hesitation', 'Emotional Bias').
    -   `sentiment` (VARCHAR, NULLABLE): The detected emotional tone or sentiment (e.g., 'anger', 'fear', 'greed', 'positive', 'negative', 'neutral').
    -   `confidence_score` (FLOAT, NULLABLE): A numerical score (0.0-1.0) indicating the AI's confidence in the identified insight.
    -   `extracted_text` (TEXT, NULLABLE): The specific snippet of text from the note that triggered the insight, for context and verification.
    -   `analysis_date` (TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP): Timestamp when the analysis was performed.
    -   `raw_gemini_response` (JSONB, NULLABLE): Stores the raw JSON response from the Gemini API. Useful for debugging, auditing, and potential re-processing with improved models.

### 2.2. For Predictive Trade Assistant

**Optional New Table: `ml_model_metadata`**

-   **Purpose**: To track metadata about the machine learning models used for trade predictions. This is crucial for MLOps, versioning, and monitoring model performance.
-   **Columns**:
    -   `id` (UUID, Primary Key): Unique identifier for the model metadata record.
    -   `model_name` (VARCHAR, NOT NULL): A human-readable name for the model (e.g., 'PredictiveTradeClassifier', 'PnLRegressor').
    -   `version` (VARCHAR, NOT NULL): Version string of the model (e.g., '1.0.0', '2025-07-10-v1').
    -   `training_date` (TIMESTAMP, NOT NULL, DEFAULT CURRENT_TIMESTAMP): Date and time when the model was last trained.
    -   `performance_metrics` (JSONB, NULLABLE): Stores key performance indicators (e.g., accuracy, precision, recall, F1-score for classification; RMSE, MAE, R-squared for regression).
    -   `user_id` (UUID, Foreign Key to `users.id`, NULLABLE): If the model is trained specifically for a user, links to that user. Nullable for global models.
    -   `model_path` (VARCHAR, NULLABLE): Path or identifier to the stored model artifact (e.g., S3 bucket URL, GCS path).

### 2.3. For Automated Chart-to-Journal Entry

**Modification to Existing Table: `trades`**

-   **New Column**: `chart_image_url` (VARCHAR, NULLABLE)
    -   **Purpose**: To store the URL of the uploaded chart image associated with a trade. This allows the frontend to display the image directly within the trade details.
    -   **Constraint**: Max length should be sufficient for a URL (e.g., 2048 characters).

**Modification to Existing Table: `notes`**

-   **New Column**: `chart_analysis_data` (JSONB, NULLABLE)
    -   **Purpose**: To store the raw structured data extracted by Gemini Vision from a chart image, specifically when a note is generated or enriched by chart analysis. This provides a detailed, machine-readable record of the visual analysis.
    -   **Note**: This column is added to the `notes` table because chart analysis directly informs the content of a journal note.

## 3. Rationale for Changes

-   **Data Normalization & Structure**: Creating `psychological_insights` and `ml_model_metadata` tables ensures that new, distinct types of data are stored in a normalized and easily queryable format, preventing data redundancy and improving database performance.
-   **Enhanced Data Context**: Adding `chart_image_url` to `trades` and `chart_analysis_data` to `notes` enriches existing records with valuable visual and AI-extracted context, without requiring a complete overhaul of the core data models.
-   **Scalability & Maintainability**: Separating concerns into new tables and adding specific columns for AI-related data makes the schema more scalable and easier to maintain as new AI features are introduced or existing ones evolve.
-   **Debugging & Auditing**: `raw_gemini_response` and `performance_metrics` columns are crucial for debugging AI model outputs, auditing their behavior, and facilitating future model retraining and improvements.

## 4. Migration Strategy

Database migrations will be required to add these new tables and columns. TypeORM migrations will be generated and executed to ensure a smooth and reversible update process.