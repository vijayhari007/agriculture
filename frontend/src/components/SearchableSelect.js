import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';

/**
 * SearchableSelect
 * Props:
 * - items: [{ label, value }]
 * - value: string
 * - onChange: (value) => void
 * - placeholder?: string
 * - minChars?: number (default: 1)
 */
const SearchableSelect = ({ items = [], value, onChange, placeholder = 'Search...', minChars = 1 }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);

  const selectedLabel = useMemo(() => {
    const found = items.find(i => i.value === value);
    return found ? found.label : '';
  }, [items, value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < minChars) return [];
    return items.filter(i => i.label.toLowerCase().includes(q) || i.value.toLowerCase().includes(q)).slice(0, 20);
  }, [items, query, minChars]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  // Show suggestions even when query is empty (when minChars is 0). Do not auto-close on empty query.

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
  };

  const clearSelection = () => {
    onChange('');
    setQuery('');
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex items-center">
        <div className="relative flex-1">
          <input
            type="text"
            value={query || (value ? selectedLabel : '')}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            className="input-field pr-16"
          />
          {/* Right controls */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
            {value && (
              <button type="button" onClick={clearSelection} className="p-1 text-gray-500 hover:text-gray-700" aria-label="Clear">
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}
            <button type="button" onClick={() => setOpen(o => !o)} className="p-1 text-gray-500 hover:text-gray-700" aria-label="Toggle">
              <ChevronDownIcon className={`w-5 h-5 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {query.trim().length < minChars ? (
            <div className="px-3 py-2 text-sm text-gray-500">Type at least {minChars} character(s) to see suggestions</div>
          ) : filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">No matches</div>
          ) : (
            filtered.map((item) => (
              <button
                type="button"
                key={item.value}
                onClick={() => handleSelect(item.value)}
                className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${value === item.value ? 'bg-primary-50 text-primary-700' : 'text-gray-700'}`}
              >
                {item.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
