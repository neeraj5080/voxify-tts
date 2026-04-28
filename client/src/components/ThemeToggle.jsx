import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle({ theme, onToggle }) {
  return (
    <button
      className="btn btn-icon"
      onClick={onToggle}
      data-tooltip={theme === 'dark' ? 'Light mode' : 'Dark mode'}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      id="btn-theme-toggle"
    >
      {theme === 'dark' ? <Sun size={15} strokeWidth={2} /> : <Moon size={15} strokeWidth={2} />}
    </button>
  );
}
