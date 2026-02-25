'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Strategy, UpdateStrategyDto, ChecklistItem } from '@/types/strategy';
import { strategiesService } from '@/services/strategiesService';
// Simple content header component
function ContentHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
      {description && (
        <p className="text-gray-600 dark:text-gray-400 mt-1">{description}</p>
      )}
    </div>
  );
}
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { MdDragIndicator } from 'react-icons/md';

export default function EditStrategyPage() {
  const params = useParams();
  const router = useRouter();
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newChecklistItem, setNewChecklistItem] = useState('');

  useEffect(() => {
    if (params.id) {
      loadStrategy(params.id as string);
    }
  }, [params.id]);

  const loadStrategy = async (id: string) => {
    try {
      setLoading(true);
      const data = await strategiesService.getStrategy(id);
      setStrategy(data);
    } catch (err) {
      setError('Failed to load strategy');
      console.error('Error loading strategy:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!strategy) return;
    
    setSaving(true);
    
    try {
      const updateData: UpdateStrategyDto = {
        name: strategy.name,
        description: strategy.description,
        checklist: strategy.checklist,
        tradingSession: strategy.tradingSession || undefined,
        isActive: strategy.isActive,
        color: strategy.color,
        tags: strategy.tags,
      };
      
      await strategiesService.updateStrategy(strategy.id, updateData);
      router.push(`/strategies/${strategy.id}`);
    } catch (error) {
      console.error('Error updating strategy:', error);
    } finally {
      setSaving(false);
    }
  };

  const addChecklistItem = () => {
    if (newChecklistItem.trim() && strategy) {
      const newItem: ChecklistItem = {
        id: Date.now().toString(),
        text: newChecklistItem.trim(),
        completed: false,
        order: strategy.checklist?.length || 0,
      };
      
      setStrategy(prev => prev ? {
        ...prev,
        checklist: [...(prev.checklist || []), newItem],
      } : null);
      
      setNewChecklistItem('');
    }
  };

  const removeChecklistItem = (id: string) => {
    setStrategy(prev => prev ? {
      ...prev,
      checklist: prev.checklist?.filter(item => item.id !== id) || [],
    } : null);
  };

  const updateChecklistItem = (id: string, text: string) => {
    setStrategy(prev => prev ? {
      ...prev,
      checklist: prev.checklist?.map(item => 
        item.id === id ? { ...item, text } : item
      ) || [],
    } : null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !strategy) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 dark:text-red-400 mb-4">{error || 'Strategy not found'}</div>
        <button 
          onClick={() => router.back()}
          className="text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <ContentHeader 
        title="Edit Strategy"
        description={`Modify your ${strategy.name} strategy`}
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
                value={strategy.name}
                onChange={(e) => setStrategy(prev => prev ? { ...prev, name: e.target.value } : null)}
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
                value={strategy.description || ''}
                onChange={(e) => setStrategy(prev => prev ? { ...prev, description: e.target.value } : null)}
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
                  value={strategy.tradingSession || ''}
                  onChange={(e) => setStrategy(prev => prev ? { 
                    ...prev, 
                    tradingSession: e.target.value as any || null 
                  } : null)}
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
                  value={strategy.color}
                  onChange={(e) => setStrategy(prev => prev ? { ...prev, color: e.target.value } : null)}
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
                value={strategy.tags || ''}
                onChange={(e) => setStrategy(prev => prev ? { ...prev, tags: e.target.value } : null)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="scalping, momentum, reversal (comma separated)"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={strategy.isActive}
                onChange={(e) => setStrategy(prev => prev ? { ...prev, isActive: e.target.checked } : null)}
                className="h-4 w-4 text-emerald-600 focus:ring-blue-500 border-gray-300 rounded"
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
            {strategy.checklist?.map((item, index) => (
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
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center"
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
            disabled={saving || !strategy.name.trim()}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}