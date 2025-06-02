"use client";
import React, { useState } from 'react';
import { TradeStatus, TradeDirection, AssetType } from '@/types/trade';
import { FaFilter, FaTimes, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export interface FilterOptions {
  status?: TradeStatus[];
  direction?: TradeDirection[];
  assetType?: AssetType[];
  symbols?: string[];
  dateRange?: {
    from?: Date;
    to?: Date;
  };
  profitRange?: {
    min?: number;
    max?: number;
  };
  rMultipleRange?: {
    min?: number;
    max?: number;
  };
  isStarred?: boolean;
  sessions?: string[];
  ictConcepts?: string[];
  tags?: string[];
}

interface AdvancedFiltersProps {
  isOpen: boolean;
  onToggle: () => void;
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  onClearFilters: () => void;
  // Commented out unused props for now - can be used later when implementing symbol/session filters
  // availableSymbols: string[];
  // availableSessions: string[];
  // availableIctConcepts: string[];
  // availableTags: string[];
}

export default function AdvancedFilters({
  isOpen,
  onToggle,
  filters,
  onFiltersChange,
  onClearFilters,
  // Commented out unused props for now - can be used later when implementing symbol/session filters
  // availableSymbols,
  // availableSessions,
  // availableIctConcepts,
  // availableTags
}: AdvancedFiltersProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basic']));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const updateFilters = (updates: Partial<FilterOptions>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const hasActiveFilters = Object.values(filters).some(value => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(v => v !== undefined && v !== null);
    }
    return value !== undefined && value !== null;
  });

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className={`flex items-center space-x-2 px-4 py-2 rounded-md border transition-colors ${
          hasActiveFilters
            ? 'bg-accent-blue text-white border-accent-blue'
            : 'bg-[var(--color-light-primary)] dark:bg-dark-secondary border-[var(--color-light-border)] dark:border-dark-border hover:bg-[var(--color-light-hover)] dark:hover:bg-dark-hover'
        }`}
      >
        <FaFilter className="h-4 w-4" />
        <span>Filters</span>
        {hasActiveFilters && (
          <span className="bg-white text-accent-blue rounded-full px-2 py-1 text-xs font-medium">
            {Object.values(filters).filter(value => {
              if (Array.isArray(value)) return value.length > 0;
              if (typeof value === 'object' && value !== null) {
                return Object.values(value).some(v => v !== undefined && v !== null);
              }
              return value !== undefined && value !== null;
            }).length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="bg-[var(--color-light-primary)] dark:bg-dark-secondary border border-[var(--color-light-border)] dark:border-dark-border rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-[var(--color-text-dark-primary)] dark:text-text-light-primary">
          Advanced Filters
        </h3>
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Clear All
            </button>
          )}
          <button
            onClick={onToggle}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            <FaTimes className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Basic Filters */}
      <div className="space-y-3">
        <button
          onClick={() => toggleSection('basic')}
          className="flex items-center justify-between w-full text-left"
        >
          <span className="font-medium text-[var(--color-text-dark-primary)] dark:text-text-light-primary">
            Basic Filters
          </span>
          {expandedSections.has('basic') ? (
            <FaChevronUp className="h-4 w-4" />
          ) : (
            <FaChevronDown className="h-4 w-4" />
          )}
        </button>

        {expandedSections.has('basic') && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pl-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary mb-2">
                Status
              </label>
              <div className="space-y-1">
                {Object.values(TradeStatus).map(status => (
                  <label key={status} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.status?.includes(status) || false}
                      onChange={(e) => {
                        const currentStatus = filters.status || [];
                        if (e.target.checked) {
                          updateFilters({ status: [...currentStatus, status] });
                        } else {
                          updateFilters({ status: currentStatus.filter(s => s !== status) });
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-accent-blue focus:ring-accent-blue"
                    />
                    <span className="ml-2 text-sm">{status}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Direction Filter */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary mb-2">
                Direction
              </label>
              <div className="space-y-1">
                {Object.values(TradeDirection).map(direction => (
                  <label key={direction} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.direction?.includes(direction) || false}
                      onChange={(e) => {
                        const currentDirection = filters.direction || [];
                        if (e.target.checked) {
                          updateFilters({ direction: [...currentDirection, direction] });
                        } else {
                          updateFilters({ direction: currentDirection.filter(d => d !== direction) });
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-accent-blue focus:ring-accent-blue"
                    />
                    <span className="ml-2 text-sm">{direction}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Asset Type Filter */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary mb-2">
                Asset Type
              </label>
              <div className="space-y-1">
                {Object.values(AssetType).map(assetType => (
                  <label key={assetType} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.assetType?.includes(assetType) || false}
                      onChange={(e) => {
                        const currentAssetType = filters.assetType || [];
                        if (e.target.checked) {
                          updateFilters({ assetType: [...currentAssetType, assetType] });
                        } else {
                          updateFilters({ assetType: currentAssetType.filter(a => a !== assetType) });
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-accent-blue focus:ring-accent-blue"
                    />
                    <span className="ml-2 text-sm">{assetType}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Date Range */}
      <div className="space-y-3">
        <button
          onClick={() => toggleSection('dates')}
          className="flex items-center justify-between w-full text-left"
        >
          <span className="font-medium text-[var(--color-text-dark-primary)] dark:text-text-light-primary">
            Date Range
          </span>
          {expandedSections.has('dates') ? (
            <FaChevronUp className="h-4 w-4" />
          ) : (
            <FaChevronDown className="h-4 w-4" />
          )}
        </button>

        {expandedSections.has('dates') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary mb-2">
                From Date
              </label>
              <DatePicker
                selected={filters.dateRange?.from}
                onChange={(date) => updateFilters({
                  dateRange: { ...filters.dateRange, from: date || undefined }
                })}
                isClearable
                placeholderText="Select start date"
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-[var(--color-light-secondary)] dark:bg-dark-tertiary"
                dateFormat="yyyy-MM-dd"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary mb-2">
                To Date
              </label>
              <DatePicker
                selected={filters.dateRange?.to}
                onChange={(date) => updateFilters({
                  dateRange: { ...filters.dateRange, to: date || undefined }
                })}
                isClearable
                placeholderText="Select end date"
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-[var(--color-light-secondary)] dark:bg-dark-tertiary"
                dateFormat="yyyy-MM-dd"
              />
            </div>
          </div>
        )}
      </div>

      {/* Performance Filters */}
      <div className="space-y-3">
        <button
          onClick={() => toggleSection('performance')}
          className="flex items-center justify-between w-full text-left"
        >
          <span className="font-medium text-[var(--color-text-dark-primary)] dark:text-text-light-primary">
            Performance
          </span>
          {expandedSections.has('performance') ? (
            <FaChevronUp className="h-4 w-4" />
          ) : (
            <FaChevronDown className="h-4 w-4" />
          )}
        </button>

        {expandedSections.has('performance') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4">
            {/* Profit Range */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary mb-2">
                Profit/Loss Range
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.profitRange?.min || ''}
                  onChange={(e) => updateFilters({
                    profitRange: {
                      ...filters.profitRange,
                      min: e.target.value ? Number(e.target.value) : undefined
                    }
                  })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-[var(--color-light-secondary)] dark:bg-dark-tertiary"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.profitRange?.max || ''}
                  onChange={(e) => updateFilters({
                    profitRange: {
                      ...filters.profitRange,
                      max: e.target.value ? Number(e.target.value) : undefined
                    }
                  })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-[var(--color-light-secondary)] dark:bg-dark-tertiary"
                />
              </div>
            </div>

            {/* R-Multiple Range */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-dark-secondary)] dark:text-text-light-secondary mb-2">
                R-Multiple Range
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  step="0.1"
                  placeholder="Min"
                  value={filters.rMultipleRange?.min || ''}
                  onChange={(e) => updateFilters({
                    rMultipleRange: {
                      ...filters.rMultipleRange,
                      min: e.target.value ? Number(e.target.value) : undefined
                    }
                  })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-[var(--color-light-secondary)] dark:bg-dark-tertiary"
                />
                <input
                  type="number"
                  step="0.1"
                  placeholder="Max"
                  value={filters.rMultipleRange?.max || ''}
                  onChange={(e) => updateFilters({
                    rMultipleRange: {
                      ...filters.rMultipleRange,
                      max: e.target.value ? Number(e.target.value) : undefined
                    }
                  })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-[var(--color-light-secondary)] dark:bg-dark-tertiary"
                />
              </div>
            </div>

            {/* Starred Filter */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.isStarred || false}
                  onChange={(e) => updateFilters({ isStarred: e.target.checked || undefined })}
                  className="h-4 w-4 rounded border-gray-300 text-accent-blue focus:ring-accent-blue"
                />
                <span className="ml-2 text-sm">Show only starred trades</span>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 