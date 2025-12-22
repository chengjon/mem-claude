import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { Feed } from './components/Feed';
import { ContextSettingsModal } from './components/ContextSettingsModal';
import { useSSE } from './hooks/useSSE';
import { useSettings } from './hooks/useSettings';
import { useStats } from './hooks/useStats';
import { usePagination } from './hooks/usePagination';
import { useTheme } from './hooks/useTheme';
import { Observation, Summary, UserPrompt, AiResponse, ToolExecution } from './types';
import { mergeAndDeduplicateByProject } from './utils/data';

export function App() {
  const [currentFilter, setCurrentFilter] = useState('');
  const [contextPreviewOpen, setContextPreviewOpen] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [logic, setLogic] = useState<'AND' | 'OR'>('AND');
  const [paginatedObservations, setPaginatedObservations] = useState<Observation[]>([]);
  const [paginatedSummaries, setPaginatedSummaries] = useState<Summary[]>([]);
  const [paginatedPrompts, setPaginatedPrompts] = useState<UserPrompt[]>([]);
  const [paginatedAiResponses, setPaginatedAiResponses] = useState<AiResponse[]>([]);
  const [paginatedToolExecutions, setPaginatedToolExecutions] = useState<ToolExecution[]>([]);

  const { observations, summaries, prompts, projects, isProcessing, queueDepth, isConnected } = useSSE();
  const { settings, saveSettings, isSaving, saveStatus } = useSettings();
  const { stats, refreshStats } = useStats();
  const { preference, resolvedTheme, setThemePreference } = useTheme();
  const pagination = usePagination(currentFilter, keywords, logic);

  // When filtering by project: ONLY use paginated data (API-filtered)
  // When showing all projects: merge SSE live data with paginated data
  const allObservations = useMemo(() => {
    if (currentFilter) {
      // Project filter active: API handles filtering, ignore SSE items
      return paginatedObservations;
    }
    // No filter: merge SSE + paginated, deduplicate by ID
    return mergeAndDeduplicateByProject(observations, paginatedObservations);
  }, [observations, paginatedObservations, currentFilter]);

  const allSummaries = useMemo(() => {
    if (currentFilter) {
      return paginatedSummaries;
    }
    return mergeAndDeduplicateByProject(summaries, paginatedSummaries);
  }, [summaries, paginatedSummaries, currentFilter]);

  const allPrompts = useMemo(() => {
    if (currentFilter) {
      return paginatedPrompts;
    }
    return mergeAndDeduplicateByProject(prompts, paginatedPrompts);
  }, [prompts, paginatedPrompts, currentFilter]);

  // New data types for AI responses and tool executions
  const allAiResponses = useMemo(() => {
    if (currentFilter) {
      return paginatedAiResponses;
    }
    // For now, AI responses and tool executions are loaded separately via API
    return paginatedAiResponses;
  }, [paginatedAiResponses, currentFilter]);

  const allToolExecutions = useMemo(() => {
    if (currentFilter) {
      return paginatedToolExecutions;
    }
    return paginatedToolExecutions;
  }, [paginatedToolExecutions, currentFilter]);

  // Toggle context preview modal
  const toggleContextPreview = useCallback(() => {
    setContextPreviewOpen(prev => !prev);
  }, []);

  // Handle loading more data
  const handleLoadMore = useCallback(async () => {
    try {
      const [newObservations, newSummaries, newPrompts, newAiResponses, newToolExecutions] = await Promise.all([
        pagination.observations.loadMore(),
        pagination.summaries.loadMore(),
        pagination.prompts.loadMore(),
        pagination.aiResponses.loadMore(),
        pagination.toolExecutions.loadMore()
      ]);

      if (newObservations.length > 0) {
        setPaginatedObservations(prev => [...prev, ...newObservations]);
      }
      if (newSummaries.length > 0) {
        setPaginatedSummaries(prev => [...prev, ...newSummaries]);
      }
      if (newPrompts.length > 0) {
        setPaginatedPrompts(prev => [...prev, ...newPrompts]);
      }
      if (newAiResponses.length > 0) {
        setPaginatedAiResponses(prev => [...prev, ...newAiResponses]);
      }
      if (newToolExecutions.length > 0) {
        setPaginatedToolExecutions(prev => [...prev, ...newToolExecutions]);
      }
    } catch (error) {
      console.error('Failed to load more data:', error);
    }
  }, [currentFilter, pagination.observations, pagination.summaries, pagination.prompts, pagination.aiResponses, pagination.toolExecutions]);

  // Reset paginated data and load first page when filter or keywords change
  useEffect(() => {
    setPaginatedObservations([]);
    setPaginatedSummaries([]);
    setPaginatedPrompts([]);
    setPaginatedAiResponses([]);
    setPaginatedToolExecutions([]);
    handleLoadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFilter, keywords, logic]);

  return (
    <>
      <Header
        isConnected={isConnected}
        projects={projects}
        currentFilter={currentFilter}
        onFilterChange={setCurrentFilter}
        keywords={keywords}
        logic={logic}
        onKeywordsChange={setKeywords}
        onLogicChange={setLogic}
        isProcessing={isProcessing}
        queueDepth={queueDepth}
        themePreference={preference}
        onThemeChange={setThemePreference}
        onContextPreviewToggle={toggleContextPreview}
      />

      <Feed
        observations={allObservations}
        summaries={allSummaries}
        prompts={allPrompts}
        aiResponses={allAiResponses}
        toolExecutions={allToolExecutions}
        onLoadMore={handleLoadMore}
        isLoading={pagination.observations.isLoading || pagination.summaries.isLoading || pagination.prompts.isLoading || pagination.aiResponses.isLoading || pagination.toolExecutions.isLoading}
        hasMore={pagination.observations.hasMore || pagination.summaries.hasMore || pagination.prompts.hasMore || pagination.aiResponses.hasMore || pagination.toolExecutions.hasMore}
      />

      <ContextSettingsModal
        isOpen={contextPreviewOpen}
        onClose={toggleContextPreview}
        settings={settings}
        onSave={saveSettings}
        isSaving={isSaving}
        saveStatus={saveStatus}
      />
    </>
  );
}
