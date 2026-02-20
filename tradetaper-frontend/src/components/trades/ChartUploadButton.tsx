import { useState, ChangeEvent } from 'react';
import { FaUpload, FaTimesCircle, FaBrain } from 'react-icons/fa';
import { authApiClient } from '@/services/api';
import { useTheme } from '@/context/ThemeContext';

interface ChartUploadButtonProps {
  onChartAnalyzed: (data: any) => void;
  initialImageUrl?: string;
}

export default function ChartUploadButton({ onChartAnalyzed, initialImageUrl }: ChartUploadButtonProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(initialImageUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const { theme } = useTheme();

  const labelClasses = "block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2";
  const sectionContainerClasses = "bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-8 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-200";
  const sectionTitleClasses = "text-2xl font-bold text-gray-900 dark:text-white mb-6 pb-3 border-b border-gray-200/30 dark:border-gray-700/30 flex items-center space-x-3";
  const buttonBaseClasses = "flex items-center justify-center space-x-2 px-6 py-3 font-semibold rounded-xl transition-all duration-200 shadow-lg focus:outline-none focus:ring-2 focus:ring-opacity-70";
  const primaryButtonClasses = `bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white focus:ring-blue-500 hover:scale-105 hover:shadow-xl`;
  const secondaryButtonClasses = 
    `bg-gray-100/80 dark:bg-gray-800/80 hover:bg-gray-500 dark:hover:bg-gray-500 text-gray-600 dark:text-gray-400 hover:text-white focus:ring-gray-500 hover:scale-105 backdrop-blur-sm`;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    setAnalysisError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) { // 5MB
        setUploadError("File is too large (max 5MB).");
        return;
      }
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setUploadError("Invalid file type. Please select an image (PNG, JPG, GIF, WEBP).");
        return;
      }

      setSelectedFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
    } else {
      setSelectedFile(null);
      setImagePreviewUrl(initialImageUrl || null);
    }
  };

  const handleAnalyzeChart = async () => {
    if (!selectedFile) {
      setAnalysisError("Please select a chart image first.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    const formData = new FormData();
    formData.append('chartImage', selectedFile);

    try {
      const response = await authApiClient.post(
        '/notes/ai/chart-to-journal', 
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      onChartAnalyzed(response.data);
    } catch (err: any) {
      setAnalysisError(err.response?.data?.message || err.message || "Failed to analyze chart.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setImagePreviewUrl(null);
    setUploadError(null);
    setAnalysisError(null);
  };

  return (
    <div className={sectionContainerClasses}>
      <h2 className={sectionTitleClasses}>
        <div className="p-2 bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 rounded-xl">
          <FaUpload className="w-5 h-5 text-indigo-600 dark:text-emerald-400" />
        </div>
        <span>Chart Snapshot & AI Analysis</span>
      </h2>
      <div className="flex flex-col items-center space-y-6">
        <label htmlFor="file-upload" 
          className={`w-full max-w-md flex flex-col items-center px-6 py-8 rounded-xl shadow-lg tracking-wide uppercase border-2 border-dashed cursor-pointer transition-all duration-200 backdrop-blur-sm
                      ${selectedFile || imagePreviewUrl ? 'border-blue-500 bg-emerald-50/80 dark:bg-emerald-900/20' : 'border-gray-300 dark:border-gray-600 bg-gray-50/80 dark:bg-gray-800/40'} 
                      text-gray-700 dark:text-gray-300 
                      hover:bg-gray-100/80 dark:hover:bg-gray-700/40 
                      hover:border-blue-400 dark:hover:border-emerald-500`}>
          <FaUpload className={`text-4xl mb-3 ${selectedFile || imagePreviewUrl ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}`} />
          <span className="text-sm font-medium leading-normal">{selectedFile ? selectedFile.name : (imagePreviewUrl ? "Change Chart" : "Upload Chart")}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">PNG, JPG, GIF up to 5MB</span>
          <input id="file-upload" name="chartImage" type="file" className="hidden" onChange={handleFileChange} accept="image/png, image/jpeg, image/jpg, image/gif, image/webp"/>
        </label>

        {uploadError && (
          <div className="p-3 bg-red-50/90 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/50 text-red-700 dark:text-red-400 rounded-xl text-sm w-full max-w-md">
            {uploadError}
          </div>
        )}

        {imagePreviewUrl && (
          <div className="relative group max-w-md w-full">
            <img src={imagePreviewUrl} alt="Selected chart preview" className="w-full h-auto rounded-2xl shadow-lg object-contain max-h-96 border border-gray-200/50 dark:border-gray-700/50" />
            <button 
              type="button" 
              onClick={handleRemoveImage}
              className="absolute top-3 right-3 p-2 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-red-500 hover:bg-opacity-90 transition-all duration-200 opacity-0 group-hover:opacity-100 shadow-lg"
              aria-label="Remove image">
              <FaTimesCircle className="h-5 w-5" />
            </button>
          </div>
        )}

        {imagePreviewUrl && !uploadError && (
          <button 
            type="button" 
            onClick={handleAnalyzeChart}
            disabled={isAnalyzing}
            className={`${buttonBaseClasses} ${primaryButtonClasses} disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {isAnalyzing ? 'Analyzing...' : <><FaBrain className="mr-2" /> Analyze Chart with AI</>}
          </button>
        )}

        {analysisError && (
          <div className="p-3 bg-red-50/90 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/50 text-red-700 dark:text-red-400 rounded-xl text-sm w-full max-w-md">
            {analysisError}
          </div>
        )}
      </div>
    </div>
  );
}
