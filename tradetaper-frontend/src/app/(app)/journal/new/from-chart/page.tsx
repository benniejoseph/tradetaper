'use client';

import React from 'react';
import ChartUploadComponent from '@/components/journal/ChartUploadComponent';

const NewJournalFromChartPage: React.FC = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">Create Journal Entry from Chart</h1>
      <p className="text-gray-600 mb-8">
        Upload a screenshot of your trading chart, and our AI will analyze it to
        create a draft journal entry for you.
      </p>
      <ChartUploadComponent />
    </div>
  );
};

export default NewJournalFromChartPage; 