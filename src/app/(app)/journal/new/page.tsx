import TradeForm from '@/components/trades/TradeForm';
import ChartUploadButton from '@/components/trades/ChartUploadButton';
import { useState } from 'react';

export default function NewTradePage() {
  const [selectedChart, setSelectedChart] = useState<string | null>(null);

  const handleChartUpload = (chart: string) => {
    setSelectedChart(chart);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">New Trade</h1>
      <TradeForm />
      <ChartUploadButton onChartUpload={handleChartUpload} />
      {selectedChart && (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
          <h2 className="text-xl font-bold mb-2">Selected Chart:</h2>
          <p>{selectedChart}</p>
        </div>
      )}
    </div>
  );
} 