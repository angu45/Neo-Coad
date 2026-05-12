import { useState, useEffect } from 'react';
import { EditorSettings } from '../types';

const SETTINGS_KEY = 'neoncode_settings_v1';

const DEFAULT_SETTINGS: EditorSettings = {
  fontSize: 14,
  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  theme: 'vs-dark',
  wordWrap: 'on',
  minimap: true,
  autoSave: true,
  tabSize: 2,
  lineHeight: 1.5,
  accentColor: '#38bdf8' // neon blue
};

export function useSettings() {
  const [settings, setSettings] = useState<EditorSettings>(() => {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved settings', e);
      }
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    document.documentElement.style.setProperty('--accent-color', settings.accentColor);
  }, [settings]);

  const updateSettings = (updates: Partial<EditorSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  return { settings, updateSettings };
}
