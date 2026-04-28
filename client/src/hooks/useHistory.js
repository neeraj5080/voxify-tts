import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'voxify_history';
const MAX_ENTRIES = 20;

export function useHistory() {
  const [history, setHistory] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch {
      // localStorage full — ignore
    }
  }, [history]);

  const addEntry = useCallback((text) => {
    if (!text?.trim() || text.trim().length < 10) return;
    const entry = {
      id: Date.now(),
      text: text.trim(),
      preview: text.trim().slice(0, 80) + (text.trim().length > 80 ? '…' : ''),
      wordCount: text.trim().split(/\s+/).filter(Boolean).length,
      createdAt: new Date().toISOString(),
    };
    setHistory(prev => {
      const filtered = prev.filter(h => h.text !== text.trim());
      return [entry, ...filtered].slice(0, MAX_ENTRIES);
    });
  }, []);

  const removeEntry = useCallback((id) => {
    setHistory(prev => prev.filter(h => h.id !== id));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return { history, addEntry, removeEntry, clearHistory };
}
