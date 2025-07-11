'use client';

import React from 'react';
import PredictiveTradeForm from '@/components/assistant/PredictiveTradeForm';

const PredictiveAssistantPage: React.FC = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">Predictive Trade Assistant</h1>
      <p className="text-gray-600 mb-8">
        Enter the parameters of a potential trade to get an AI-powered
        prediction on its probability of success based on your historical data.
      </p>
      <PredictiveTradeForm />
    </div>
  );
};

export default PredictiveAssistantPage; 