import { useState, useEffect } from 'react';
import { Settings } from '../types';
import { DEFAULT_SETTINGS } from '../constants/settings';
import { API_ENDPOINTS } from '../constants/api';
import { TIMING } from '../constants/timing';
import { logError } from '../utils/hook-logger';

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    fetch(API_ENDPOINTS.SETTINGS)
      .then(res => res.json())
      .then(data => {
        const settingsData = data as Partial<Settings>;
        setSettings({
          CLAUDE_MEM_MODEL: settingsData.CLAUDE_MEM_MODEL || DEFAULT_SETTINGS.CLAUDE_MEM_MODEL,
          CLAUDE_MEM_CONTEXT_OBSERVATIONS: settingsData.CLAUDE_MEM_CONTEXT_OBSERVATIONS || DEFAULT_SETTINGS.CLAUDE_MEM_CONTEXT_OBSERVATIONS,
          CLAUDE_MEM_WORKER_PORT: settingsData.CLAUDE_MEM_WORKER_PORT || DEFAULT_SETTINGS.CLAUDE_MEM_WORKER_PORT,
          CLAUDE_MEM_WORKER_HOST: settingsData.CLAUDE_MEM_WORKER_HOST || DEFAULT_SETTINGS.CLAUDE_MEM_WORKER_HOST,

          CLAUDE_MEM_CONTEXT_SHOW_READ_TOKENS: settingsData.CLAUDE_MEM_CONTEXT_SHOW_READ_TOKENS || DEFAULT_SETTINGS.CLAUDE_MEM_CONTEXT_SHOW_READ_TOKENS,
          CLAUDE_MEM_CONTEXT_SHOW_WORK_TOKENS: settingsData.CLAUDE_MEM_CONTEXT_SHOW_WORK_TOKENS || DEFAULT_SETTINGS.CLAUDE_MEM_CONTEXT_SHOW_WORK_TOKENS,
          CLAUDE_MEM_CONTEXT_SHOW_SAVINGS_AMOUNT: settingsData.CLAUDE_MEM_CONTEXT_SHOW_SAVINGS_AMOUNT || DEFAULT_SETTINGS.CLAUDE_MEM_CONTEXT_SHOW_SAVINGS_AMOUNT,
          CLAUDE_MEM_CONTEXT_SHOW_SAVINGS_PERCENT: settingsData.CLAUDE_MEM_CONTEXT_SHOW_SAVINGS_PERCENT || DEFAULT_SETTINGS.CLAUDE_MEM_CONTEXT_SHOW_SAVINGS_PERCENT,

          CLAUDE_MEM_CONTEXT_OBSERVATION_TYPES: settingsData.CLAUDE_MEM_CONTEXT_OBSERVATION_TYPES || DEFAULT_SETTINGS.CLAUDE_MEM_CONTEXT_OBSERVATION_TYPES,
          CLAUDE_MEM_CONTEXT_OBSERVATION_CONCEPTS: settingsData.CLAUDE_MEM_CONTEXT_OBSERVATION_CONCEPTS || DEFAULT_SETTINGS.CLAUDE_MEM_CONTEXT_OBSERVATION_CONCEPTS,

          CLAUDE_MEM_CONTEXT_FULL_COUNT: settingsData.CLAUDE_MEM_CONTEXT_FULL_COUNT || DEFAULT_SETTINGS.CLAUDE_MEM_CONTEXT_FULL_COUNT,
          CLAUDE_MEM_CONTEXT_FULL_FIELD: settingsData.CLAUDE_MEM_CONTEXT_FULL_FIELD || DEFAULT_SETTINGS.CLAUDE_MEM_CONTEXT_FULL_FIELD,
          CLAUDE_MEM_CONTEXT_SESSION_COUNT: settingsData.CLAUDE_MEM_CONTEXT_SESSION_COUNT || DEFAULT_SETTINGS.CLAUDE_MEM_CONTEXT_SESSION_COUNT,

          CLAUDE_MEM_CONTEXT_SHOW_LAST_SUMMARY: settingsData.CLAUDE_MEM_CONTEXT_SHOW_LAST_SUMMARY || DEFAULT_SETTINGS.CLAUDE_MEM_CONTEXT_SHOW_LAST_SUMMARY,
          CLAUDE_MEM_CONTEXT_SHOW_LAST_MESSAGE: settingsData.CLAUDE_MEM_CONTEXT_SHOW_LAST_MESSAGE || DEFAULT_SETTINGS.CLAUDE_MEM_CONTEXT_SHOW_LAST_MESSAGE,
        });
      })
      .catch(error => {
        logError('SETTINGS', 'Failed to load settings:', error);
      });
  }, []);

  const saveSettings = async (newSettings: Settings) => {
    setIsSaving(true);
    setSaveStatus('Saving...');

    try {
      const response = await fetch(API_ENDPOINTS.SETTINGS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });

      const result = (await response.json()) as { success?: boolean; error?: string };

      if (result.success) {
        setSettings(newSettings);
        setSaveStatus('✓ Saved');
        setTimeout(() => setSaveStatus(''), TIMING.SAVE_STATUS_DISPLAY_DURATION_MS);
      } else {
        setSaveStatus(`✗ Error: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      setSaveStatus(`✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return { settings, saveSettings, isSaving, saveStatus };
}
