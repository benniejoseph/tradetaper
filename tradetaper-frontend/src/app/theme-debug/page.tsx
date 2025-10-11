"use client";

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { FaSun, FaMoon } from 'react-icons/fa';

export default function ThemeDebugPage() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, systemTheme, resolvedTheme } = useTheme();

  // When mounted on client, now we can show the UI
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="min-h-screen p-8 bg-white dark:bg-gray-900 transition-colors duration-300">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
            Loading Theme Debug...
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-white dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
          Theme Debug Page
        </h1>
        
        <div className="grid gap-6">
          {/* Theme Status */}
          <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Theme Status
            </h2>
            <div className="space-y-2 text-gray-700 dark:text-gray-300">
              <p><strong>Current Theme:</strong> {theme}</p>
              <p><strong>Resolved Theme:</strong> {resolvedTheme}</p>
              <p><strong>System Theme:</strong> {systemTheme}</p>
              <p><strong>Is Mounted:</strong> Yes</p>
              <p><strong>HTML Classes:</strong> {typeof window !== 'undefined' ? document.documentElement.className : 'N/A'}</p>
            </div>
          </div>

          {/* Theme Toggle Buttons */}
          <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Theme Controls
            </h2>
            <div className="flex gap-4 flex-wrap">
              <button
                onClick={() => setTheme('light')}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors duration-200"
              >
                <FaSun className="w-4 h-4" />
                <span>Light</span>
              </button>
              
              <button
                onClick={() => setTheme('dark')}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors duration-200"
              >
                <FaMoon className="w-4 h-4" />
                <span>Dark</span>
              </button>
              
              <button
                onClick={() => setTheme('system')}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors duration-200"
              >
                <span>System</span>
              </button>
            </div>
          </div>

          {/* Visual Test */}
          <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Visual Test
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                <h3 className="font-bold text-gray-900 dark:text-white">Card 1</h3>
                <p className="text-gray-600 dark:text-gray-300">This should change colors with theme</p>
              </div>
              <div className="p-4 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                <h3 className="font-bold text-gray-900 dark:text-white">Card 2</h3>
                <p className="text-gray-600 dark:text-gray-300">Dark mode should make this darker</p>
              </div>
              <div className="p-4 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                <h3 className="font-bold text-gray-900 dark:text-white">Card 3</h3>
                <p className="text-gray-600 dark:text-gray-300">Light mode should make this lighter</p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="p-6 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <h2 className="text-2xl font-semibold text-yellow-800 dark:text-yellow-200 mb-4">
              Debug Instructions
            </h2>
            <ol className="space-y-2 text-yellow-700 dark:text-yellow-300">
              <li>1. Click the Light/Dark/System buttons above</li>
              <li>2. Check if the theme status changes</li>
              <li>3. Observe if the colors change visually</li>
              <li>4. Open browser dev tools and check console for errors</li>
              <li>5. Inspect the HTML element to see if 'dark' class is applied</li>
              <li>6. Test System mode to verify it follows your OS preference</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
} 