import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { tradesService } from '../../../services/tradesService';
import { toast } from 'react-hot-toast';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface ChartUploadButtonProps {
  onChartAnalyzed: (data: any) => void;
}

export const ChartUploadButton: React.FC<ChartUploadButtonProps> = ({ onChartAnalyzed }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const analyzeChartMutation = useMutation({
    mutationFn: tradesService.analyzeChart,
    onSuccess: (data) => {
      toast.success('Chart analyzed successfully!');
      onChartAnalyzed(data);
      setSelectedFile(null); // Clear selected file after successful upload
    },
    onError: (error: any) => {
      toast.error(`Failed to analyze chart: ${error.message || 'Unknown error'}`);
      setSelectedFile(null); // Clear selected file on error
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      analyzeChartMutation.mutate(selectedFile);
    } else {
      toast.error('Please select a file to upload.');
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="block w-full text-sm text-gray-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-full file:border-0
          file:text-sm file:font-semibold
          file:bg-blue-50 file:text-blue-700
          hover:file:bg-blue-100"
      />
      <button
        onClick={handleUpload}
        disabled={!selectedFile || analyzeChartMutation.isPending}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {analyzeChartMutation.isPending ? (
          <LoadingSpinner size="small" />
        ) : (
          'Analyze Chart'
        )}
      </button>
      {selectedFile && (
        <p className="text-sm text-gray-500">Selected file: {selectedFile.name}</p>
      )}
    </div>
  );
};