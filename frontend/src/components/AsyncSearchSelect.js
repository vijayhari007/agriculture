import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import axios from 'axios';

/**
 * AsyncSearchSelect
 * Props:
 * - searchUrl: string (e.g., http://localhost:5000/api/soils)
 * - onSelect: (item) => void  // item is an object returned by the API
 * - placeholder?: string
 * - minChars?: number
 * - labelKey?: string  // key to display for each result, default 'label'
 */
const AsyncSearchSelect = ({ searchUrl, onSelect, placeholder = 'Search...', minChars = 2, labelKey = 'label' }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const containerRef = useRef(null);

  // Debounce query
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(id);
  }, [query]);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    const fetchItems = async () => {
      if (debouncedQuery.trim().length < minChars) {
        setItems([]);
        return;
      }
      try {
        setLoading(true);
        const res = await axios.get(searchUrl, { params: { q: debouncedQuery, limit: 15 } });
        if (res.data && res.data.success) {
          setItems(res.data.results || []);
        } else if (Array.isArray(res.data)) {
          setItems(res.data);
        } else {
          setItems([]);
        }
      } catch (e) {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [debouncedQuery, searchUrl, minChars]);

  const handleSelect = (item) => {
    onSelect?.(item);
    setOpen(false);
    setQuery('');
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="input-field pr-10"
        />
        <ChevronDownIcon className={`w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 transition-transform ${open ? 'rotate-180' : ''}`} />
      </div>

      {open && (
        <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {query.trim().length < minChars ? (
            <div className="px-3 py-2 text-sm text-gray-500">Type at least {minChars} character(s) to search</div>
          ) : loading ? (
            <div className="px-3 py-2 text-sm text-gray-500">Searching...</div>
          ) : items.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">No results</div>
          ) : (
            items.map((item, idx) => (
              <button
                type="button"
                key={item.id || item.soil_id || idx}
                onClick={() => handleSelect(item)}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700"
              >
                {item[labelKey] ?? JSON.stringify(item)}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default AsyncSearchSelect;
