'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiTag, FiX } from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.tradetaper.com/api/v1';

interface TagAutocompleteProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : '',
  };
};

export default function TagAutocomplete({
  tags,
  onTagsChange,
  placeholder = 'Add tags (e.g., fvg, sweep, ob)...',
  maxTags = 10,
}: TagAutocompleteProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fetch suggestions from backend
  const fetchSuggestions = useCallback(async (prefix: string) => {
    if (!prefix.trim()) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/backtesting/tags/suggestions?prefix=${encodeURIComponent(prefix)}`,
        { headers: getAuthHeaders() }
      );
      if (response.ok) {
        const data = await response.json();
        // Filter out already selected tags
        const filtered = data.filter((s: string) => !tags.includes(s));
        setSuggestions(filtered);
      }
    } catch (error) {
      console.error('Failed to fetch tag suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [tags]);

  // Debounced fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue.length >= 2) {
        fetchSuggestions(inputValue);
      } else {
        setSuggestions([]);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [inputValue, fetchSuggestions]);

  // Normalize tag locally (basic normalization)
  const normalizeTag = (tag: string): string => {
    return tag.toLowerCase().trim().replace(/\s+/g, '_');
  };

  // Add a tag
  const addTag = (tag: string) => {
    const normalized = normalizeTag(tag);
    if (normalized && !tags.includes(normalized) && tags.length < maxTags) {
      onTagsChange([...tags, normalized]);
    }
    setInputValue('');
    setSuggestions([]);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // Remove a tag
  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(t => t !== tagToRemove));
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        addTag(suggestions[selectedIndex]);
      } else if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      // Remove last tag on backspace when input is empty
      removeTag(tags[tags.length - 1]);
    }
  };

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      {/* Tags Display + Input */}
      <div className="flex flex-wrap gap-2 p-3 bg-gray-800/50 border border-gray-700 rounded-lg min-h-[48px] focus-within:border-blue-500 transition-colors">
        {/* Existing Tags */}
        {tags.map(tag => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-blue-600/30 text-blue-300 rounded-md"
          >
            <FiTag className="w-3 h-3" />
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-1 hover:text-red-400 transition-colors"
              aria-label={`Remove ${tag}`}
            >
              <FiX className="w-3 h-3" />
            </button>
          </span>
        ))}

        {/* Input */}
        {tags.length < maxTags && (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={e => {
              setInputValue(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            placeholder={tags.length === 0 ? placeholder : ''}
            className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-gray-200 placeholder-gray-500"
          />
        )}
      </div>

      {/* Helper Text */}
      <p className="text-xs text-gray-500 mt-1">
        Type and press Enter. Aliases like "fvg", "ob", "sweep" are auto-normalized.
      </p>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-48 overflow-y-auto"
        >
          {isLoading ? (
            <div className="p-3 text-gray-400 text-sm">Loading...</div>
          ) : (
            suggestions.map((suggestion, index) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => addTag(suggestion)}
                className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors ${
                  index === selectedIndex
                    ? 'bg-blue-600/30 text-blue-200'
                    : 'text-gray-300 hover:bg-gray-700/50'
                }`}
              >
                <FiTag className="w-4 h-4 text-gray-500" />
                {suggestion}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
