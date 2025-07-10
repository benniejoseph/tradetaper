# L2A1: Technical Design - AI Psychological Profiler

## 1. Feature Description

The AI Psychological Profiler will analyze a trader's journal entries (textual notes) to identify recurring psychological patterns and biases that influence their trading decisions. This includes detecting emotional states (e.g., anger, fear, greed), behavioral patterns (e.g., revenge trading, FOMO, overtrading, hesitation), and providing insights to the user to foster better emotional discipline and self-awareness.

## 2. Core Functionality

-   **Text Ingestion**: Securely retrieve textual content from user's trade journal notes.
-   **Sentiment Analysis**: Identify emotional tone and sentiment within the text (positive, negative, neutral, and specific emotions like anger, fear, excitement).
-   **Pattern Recognition**: Detect keywords, phrases, and contextual cues indicative of psychological biases (e.g., "I was angry after that loss and immediately re-entered," "Felt like I was missing out so I jumped in").
-   **Categorization**: Classify identified patterns into predefined psychological biases (e.g., Revenge Trading, FOMO, Overconfidence, Hesitation).
-   **Insight Generation**: Synthesize findings into actionable insights and personalized feedback for the user.
-   **Reporting**: Present a summary of identified patterns over time, highlighting trends and areas for improvement.

## 3. Technical Design

### 3.1. Data Flow

1.  **User Action**: User creates or updates a trade journal note in `tradetaper-frontend`.
2.  **API Call**: `tradetaper-frontend` sends the note content to `tradetaper-backend` via an API endpoint (e.g., `POST /notes/{id}/analyze-psychology`).
3.  **Backend Processing**: `tradetaper-backend` receives the note content.
4.  **AI Service Call**: `tradetaper-backend`'s `NotesService` (or a new dedicated `PsychologyService`) calls the `GeminiTextAnalysisService` (or a new `GeminiPsychologyService`) with the note content.
5.  **Gemini API Interaction**: The Gemini service sends the text to the Gemini Pro model with a carefully crafted prompt designed for psychological analysis.
6.  **Gemini Response**: Gemini Pro returns structured data (e.g., JSON) containing identified emotions, patterns, and confidence scores.
7.  **Backend Data Storage**: `tradetaper-backend` processes Gemini's response and stores the extracted psychological insights in the PostgreSQL database, linked to the original trade note and user.
8.  **Frontend Display**: `tradetaper-frontend` retrieves and displays the psychological insights to the user, potentially on a dedicated analytics dashboard or within the note details.

### 3.2. Proposed API Endpoints

-   `POST /notes/{id}/analyze-psychology`: Triggers psychological analysis for a specific note.
    -   **Request**: `{ noteId: string }`
    -   **Response**: `{ success: boolean, insights: PsychologicalInsight[] }`
-   `GET /users/{userId}/psychological-profile`: Retrieves a summary of psychological insights for a user.
    -   **Request**: `{ userId: string, startDate?: Date, endDate?: Date }`
    -   **Response**: `{ summary: PsychologicalSummary, trends: PsychologicalTrend[] }`

### 3.3. Database Changes

-   **New Table**: `psychological_insights`
    -   `id` (UUID, PK)
    -   `userId` (UUID, FK to `users` table)
    -   `noteId` (UUID, FK to `notes` table, nullable if insights can be generated independently)
    -   `insightType` (VARCHAR, e.g., 'FOMO', 'Revenge Trading', 'Overconfidence', 'Hesitation')
    -   `sentiment` (VARCHAR, e.g., 'positive', 'negative', 'neutral', 'anger', 'fear', 'greed')
    -   `confidenceScore` (FLOAT, 0.0-1.0)
    -   `extractedText` (TEXT, snippet from the note that triggered the insight)
    -   `analysisDate` (TIMESTAMP)
    -   `rawGeminiResponse` (JSONB, for debugging and future model improvements)

### 3.4. Gemini Prompt Engineering (Example Concept)

```
"Analyze the following trade journal entry for psychological patterns and emotional states. Identify instances of revenge trading, fear of missing out (FOMO), overtrading, or hesitation. For each identified pattern, provide a brief explanation, the exact text snippet that indicates the pattern, and a confidence score (0-1). Also, assess the overall sentiment of the entry. Return the output as a JSON array of objects, where each object represents an insight.

Example Input: 'After losing big on EURUSD, I immediately jumped back in with double the size, feeling angry and determined to get my money back. It was a clear revenge trade.'

Example Output:
[
  {
    "insightType": "Revenge Trading",
    "sentiment": "anger",
    "confidenceScore": 0.95,
    "extractedText": "I immediately jumped back in with double the size, feeling angry and determined to get my money back."
  },
  {
    "insightType": "Overall Sentiment",
    "sentiment": "negative",
    "confidenceScore": 0.80,
    "extractedText": "After losing big on EURUSD, I immediately jumped back in with double the size, feeling angry and determined to get my money back. It was a clear revenge trade."
  }
]

Trade Journal Entry: [USER_NOTE_CONTENT_HERE]
"
```

## 4. Frontend Integration

-   **Dashboard Component**: A new component to display the `PsychologicalSummary` and `PsychologicalTrend` data, possibly using charts (e.g., pie chart for distribution of biases, line chart for trends over time).
-   **Note Detail View**: Display individual psychological insights directly within the trade note view, highlighting the `extractedText`.
-   **User Feedback**: Allow users to provide feedback on the accuracy of the AI's insights to improve future models.

## 5. Future Considerations

-   **User Customization**: Allow users to define custom keywords or phrases for psychological pattern detection.
-   **Integration with Trade Data**: Correlate psychological insights with actual trade performance (profit/loss, win rate) to show the impact of biases.
-   **Real-time Analysis**: Provide real-time feedback during active trading sessions (more complex, requires integration with MT5 bridge).