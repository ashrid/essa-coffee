"use client";

import { useState, useEffect, useCallback } from "react";
import { Search } from "lucide-react";

interface SearchBarProps {
  value: string;
  onSearch: (value: string) => void;
}

export default function SearchBar({ value, onSearch }: SearchBarProps) {
  const [inputValue, setInputValue] = useState(value);

  // Sync with external value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue !== value) {
        onSearch(inputValue);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [inputValue, onSearch, value]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  }, []);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sage-500" />
      <input
        type="text"
        placeholder="Search plants..."
        value={inputValue}
        onChange={handleChange}
        className="w-full pl-10 pr-4 py-2.5 bg-white border border-cream-200 rounded-lg text-forest-900 placeholder:text-sage-400 focus:outline-none focus:ring-2 focus:ring-forest-600/20 focus:border-forest-600 transition-colors"
      />
    </div>
  );
}
