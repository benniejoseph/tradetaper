"use client";

import { useTheme } from "@/context/ThemeContext";
import { FaSun, FaMoon } from "react-icons/fa";

export const ThemeToggleButton = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full transition-colors duration-200 
                 text-text-light-secondary dark:text-text-light-secondary 
                 hover:bg-dark-secondary dark:hover:bg-gray-700 
                 focus:outline-none focus:ring-2 focus:ring-accent-green focus:ring-opacity-50"
      aria-label={theme === 'dark' ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === 'dark' ? (
        <FaSun className="h-5 w-5 text-yellow-400" />
      ) : (
        <FaMoon className="h-5 w-5 text-slate-500" />
      )}
    </button>
  );
}; 