import { useState, useEffect, useRef } from 'react';
import { Observation, Summary, UserPrompt, StreamEvent } from '../types';
import { API_ENDPOINTS } from '../constants/api';
import { TIMING } from '../constants/timing';
import { uiLogger } from '../utils/ui-logger';

export function useSSE() {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [prompts, setPrompts] = useState<UserPrompt[]>([]);
  const [projects, setProjects] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [queueDepth, setQueueDepth] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const connect = () => {
      // Clean up existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const eventSource = new EventSource(API_ENDPOINTS.STREAM);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        uiLogger.info('SSE', 'Connection opened');
        setIsConnected(true);
        // Clear any pending reconnect
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
      };

      eventSource.onerror = (error) => {
        uiLogger.error('SSE', 'Connection error:', error);
        setIsConnected(false);
        eventSource.close();

        // Reconnect after delay
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectTimeoutRef.current = undefined; // Clear before reconnecting
          uiLogger.info('SSE', 'Attempting to reconnect...');
          connect();
        }, TIMING.SSE_RECONNECT_DELAY_MS);
      };

      eventSource.onmessage = (event) => {
        try {
          const data: StreamEvent = JSON.parse(event.data);

          switch (data.type) {
            case 'initial_load':
              uiLogger.info('SSE', 'Initial load:', {
                projects: data.projects?.length || 0
              });
              // Only load projects list - data will come via pagination
              setProjects(data.projects || []);
              break;

            case 'new_observation':
              if (data.observation) {
                uiLogger.info('SSE', 'New observation:', data.observation.id);
                const obs = data.observation as Observation;
                setObservations(prev => [obs, ...prev]);
              }
              break;

            case 'new_summary':
              if (data.summary) {
                const summary = data.summary as Summary;
                uiLogger.info('SSE', 'New summary:', summary.id);
                setSummaries(prev => [summary, ...prev]);
              }
              break;

            case 'new_prompt':
              if (data.prompt) {
                const prompt = data.prompt as UserPrompt;
                uiLogger.info('SSE', 'New prompt:', prompt.id);
                setPrompts(prev => [prompt, ...prev]);
              }
              break;

            case 'processing_status':
              if (typeof data.isProcessing === 'boolean') {
                uiLogger.info('SSE', 'Processing status:', data.isProcessing);
                setIsProcessing(data.isProcessing);
                setQueueDepth((data as any).queueDepth || 0);
              }
              break;
          }
        } catch (error) {
          uiLogger.error('SSE', 'Failed to parse message:', error);
        }
      };
    };

    connect();

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return { observations, summaries, prompts, projects, isProcessing, queueDepth, isConnected };
}
