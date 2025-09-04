'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient, ApiResponse, JobResult, AgentExecutionRequest, RAGSearchRequest, Agent, CreateAgentRequest, UpdateAgentRequest } from './api';

// Hook pour gérer l'état de chargement et les erreurs
export function useAsyncState<T>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (asyncFn: () => Promise<ApiResponse<T>>) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await asyncFn();
      if (response.success) {
        setData(response.data || null);
      } else {
        setError(response.error || 'Une erreur est survenue');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, execute };
}

// Hook pour les jobs
export function useJobs() {
  const [jobs, setJobs] = useState<JobResult[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createJob = useCallback(async (type: string, data: any, priority?: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.createJob({ type, data, priority });
      if (response.success && response.data) {
        setJobs(prev => [response.data!, ...prev]);
        return response.data;
      } else {
        setError(response.error || 'Erreur lors de la création du job');
        return null;
      }
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getJob = useCallback(async (jobId: string) => {
    try {
      const response = await apiClient.getJob(jobId);
      if (response.success && response.data) {
        setJobs(prev => prev.map(job => 
          job.id === jobId ? response.data! : job
        ));
        return response.data;
      }
      return null;
    } catch (err) {
      console.error('Erreur lors de la récupération du job:', err);
      return null;
    }
  }, []);

  const cancelJob = useCallback(async (jobId: string) => {
    try {
      const response = await apiClient.cancelJob(jobId);
      if (response.success) {
        setJobs(prev => prev.map(job => 
          job.id === jobId ? { ...job, status: 'cancelled' as const } : job
        ));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Erreur lors de l\'annulation du job:', err);
      return false;
    }
  }, []);

  const getStats = useCallback(async () => {
    try {
      const response = await apiClient.getQueueStats();
      if (response.success) {
        setStats(response.stats || response.data);
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des stats:', err);
    }
  }, []);

  // Polling pour les jobs en cours
  useEffect(() => {
    const interval = setInterval(() => {
      jobs.forEach(job => {
        if (job.status === 'pending' || job.status === 'running') {
          getJob(job.id);
        }
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [jobs, getJob]);

  return {
    jobs,
    stats,
    loading,
    error,
    createJob,
    getJob,
    cancelJob,
    getStats,
  };
}

// Hook pour les agents
export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [tools, setTools] = useState<string[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeAgent = useCallback(async (request: AgentExecutionRequest) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.executeAgent(request);
      if (response.success) {
        return response.data;
      } else {
        setError(response.error || 'Erreur lors de l\'exécution de l\'agent');
        return null;
      }
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAgents = useCallback(async () => {
    try {
      const response = await apiClient.getAgents();
      if (response.success) {
        setAgents(response.data || []);
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des agents:', err);
    }
  }, []);

  const getAgent = useCallback(async (agentId: string) => {
    try {
      const response = await apiClient.getAgent(agentId);
      if (response.success) {
        return response.data;
      }
      return null;
    } catch (err) {
      console.error('Erreur lors de la récupération de l\'agent:', err);
      return null;
    }
  }, []);

  const createAgent = useCallback(async (agent: CreateAgentRequest) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.createAgent(agent);
      if (response.success && response.data) {
        setAgents(prev => [...prev, response.data!]);
        return response.data;
      } else {
        setError(response.error || 'Erreur lors de la création de l\'agent');
        return null;
      }
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateAgent = useCallback(async (agent: UpdateAgentRequest) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.updateAgent(agent);
      if (response.success && response.data) {
        setAgents(prev => prev.map(a => a.id === agent.id ? response.data! : a));
        return response.data;
      } else {
        setError(response.error || 'Erreur lors de la mise à jour de l\'agent');
        return null;
      }
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteAgent = useCallback(async (agentId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.deleteAgent(agentId);
      if (response.success) {
        setAgents(prev => prev.filter(a => a.id !== agentId));
        return true;
      } else {
        setError(response.error || 'Erreur lors de la suppression de l\'agent');
        return false;
      }
    } catch (err) {
      setError((err as Error).message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const getModels = useCallback(async () => {
    try {
      const response = await apiClient.getAvailableModels();
      if (response.success) {
        setModels(response.models || response.data || []);
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des modèles:', err);
    }
  }, []);

  const getTools = useCallback(async () => {
    try {
      const response = await apiClient.getAvailableTools();
      if (response.success) {
        setTools(response.data || []);
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des outils:', err);
    }
  }, []);

  const getStats = useCallback(async () => {
    try {
      const response = await apiClient.getAgentStats();
      if (response.success) {
        setStats(response.stats);
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des stats:', err);
    }
  }, []);

  const checkHealth = useCallback(async () => {
    try {
      const response = await apiClient.checkAgentHealth();
      console.log('🏥 Réponse API reçue:', response);
      console.log('🏥 response.health:', response.health);
      
      if (response.success && response.health) {
        console.log('🏥 Mise à jour health avec:', response.health);
        setHealth(response.health);
        console.log('🏥 État health après setHealth:', response.health);
        return response.health;
      } else {
        console.log('🏥 Pas de mise à jour - conditions non remplies');
        return null;
      }
    } catch (err) {
      console.error('Erreur checkHealth:', err);
      return null;
    }
  }, []);

  return {
    agents,
    models,
    tools,
    stats,
    health,
    loading,
    error,
    executeAgent,
    getAgents,
    getAgent,
    createAgent,
    updateAgent,
    deleteAgent,
    getModels,
    getTools,
    getStats,
    checkHealth,
  };
}

// Hook pour le RAG
export function useRAG() {
  const [stats, setStats] = useState<any>(null);
  const [extensions, setExtensions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const indexFile = useCallback(async (file: File, options?: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.indexFile(file, options);
      if (response.success) {
        return response.data;
      } else {
        setError(response.error || 'Erreur lors de l\'indexation du fichier');
        return null;
      }
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const indexDirectory = useCallback(async (directory: string, options?: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.indexDirectory(directory, options);
      if (response.success) {
        return response.data;
      } else {
        setError(response.error || 'Erreur lors de l\'indexation du répertoire');
        return null;
      }
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const search = useCallback(async (request: RAGSearchRequest) => {
    try {
      const response = await apiClient.searchRAG(request);
      if (response.success) {
        return response.data;
      } else {
        setError(response.error || 'Erreur lors de la recherche');
        return null;
      }
    } catch (err) {
      setError((err as Error).message);
      return null;
    }
  }, []);

  const getStats = useCallback(async () => {
    try {
      const response = await apiClient.getRAGStats();
      if (response.success) {
        setStats(response.stats || response.data);
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des stats RAG:', err);
    }
  }, []);

  const getExtensions = useCallback(async () => {
    try {
      const response = await apiClient.getSupportedExtensions();
      if (response.success) {
        setExtensions(response.data || []);
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des extensions:', err);
    }
  }, []);

  const deleteDocument = useCallback(async (docId: string) => {
    try {
      const response = await apiClient.deleteDocument(docId);
      if (response.success) {
        return true;
      } else {
        setError(response.error || 'Erreur lors de la suppression');
        return false;
      }
    } catch (err) {
      setError((err as Error).message);
      return false;
    }
  }, []);

  const clear = useCallback(async () => {
    try {
      const response = await apiClient.clearRAGIndex();
      if (response.success) {
        return true;
      } else {
        setError(response.error || 'Erreur lors du nettoyage');
        return false;
      }
    } catch (err) {
      setError((err as Error).message);
      return false;
    }
  }, []);

  return {
    stats,
    extensions,
    loading,
    error,
    indexFile,
    indexDirectory,
    search,
    getStats,
    getExtensions,
    deleteDocument,
    clear,
  };
}

// Hook pour le chat en temps réel
export function useChat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = useCallback(async (agentId: string, message: string, context?: any) => {
    // Ajouter le message utilisateur
    const userMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const response = await apiClient.executeAgent({
        agentId,
        message,
        context,
      });

      if (response.success) {
        const agentMessage = {
          id: (Date.now() + 1).toString(),
          type: 'agent',
          content: response.data?.response || 'Pas de réponse',
          timestamp: new Date().toISOString(),
          metadata: response.data,
        };
        
        setMessages(prev => [...prev, agentMessage]);
      } else {
        const errorMessage = {
          id: (Date.now() + 1).toString(),
          type: 'error',
          content: response.error || 'Erreur lors de l\'exécution',
          timestamp: new Date().toISOString(),
        };
        
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (err) {
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        type: 'error',
        content: (err as Error).message,
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isTyping,
    sendMessage,
    clearMessages,
  };
}
