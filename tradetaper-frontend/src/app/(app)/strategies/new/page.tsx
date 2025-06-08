'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreateStrategyDto, ChecklistItem } from '@/types/strategy';
import { strategiesService } from '@/services/strategiesService';
import { ContentHeader } from '@/components/layout/ContentHeader';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { MdDragIndicator } from 'react-icons/md';

export default function NewStrategyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateStrategyDto>({
    name: '',
    description: '',
    checklist: [],
    tradingSession: undefined,
    isActive: true,
    color: '#3B82F6',
    tags: '',
  });

  const [newChecklistItem, setNewChecklistItem] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await strategiesService.createStrategy(formData);
      router.push('/strategies');
    } catch (error) {
      console.error('Error creating strategy:', error);
    } finally {
      setLoading(false);
    }
  };

  const addChecklistItem = () => {
    if (newChecklistItem.trim()) {
      const newItem: ChecklistItem = {
        id: Date.now().toString(),
        text: newChecklistItem.trim(),
        completed: false,
        order: formData.checklist?.length || 0,
      };
      
      setFormData(prev => ({
        ...prev,
        checklist: [...(prev.checklist || []), newItem],
      }));
      
      setNewChecklistItem('');
    }
  };

  const removeChecklistItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      checklist: prev.checklist?.filter(item => item.id !== id) || [],
    }));
  };

  const updateChecklistItem = (id: string, text: string) => {
    setFormData(prev => ({
      ...prev,
      checklist: prev.checklist?.map(item => 
        item.id === id ? { ...item, text } : item
      ) || [],
    }));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <ContentHeader 
        title="Create New Strategy"
        description="Define your trading strategy with rules and performance tracking"
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Strategy Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="e.g., Breakout Scalping, Trend Following"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Describe your strategy, rules, and methodology..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Trading Session
                </label>
                <select
                  value={formData.tradingSession || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    tradingSession: e.target.value as any || undefined 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select session</option>
                  <option value="london">London</option>
                  <option value="newyork">New York</option>
                  <option value="asia">Asia</option>
                  <option value="sydney">Sydney</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Color
                </label>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tags
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="scalping, momentum, reversal (comma separated)"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Strategy is active
              </label>
            </div>
          </div>
        </div>

        {/* Checklist Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Trading Checklist</h3>
          
          <div className="space-y-3">
            {formData.checklist?.map((item, index) => (
              <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <MdDragIndicator className="text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={item.text}
                  onChange={(e) => updateChecklistItem(item.id, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Checklist item..."
                />
                <button
                  type="button"
                  onClick={() => removeChecklistItem(item.id)}
                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            
            <div className="flex gap-3">
              <input
                type="text"
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addChecklistItem())}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Add checklist item..."
              />
              <button
                type="button"
                onClick={addChecklistItem}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <FiPlus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !formData.name.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Creating...' : 'Create Strategy'}
          </button>
        </div>
      </form>
    </div>
  );
}