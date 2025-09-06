// Configuration API pour communiquer avec le worker
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Importer les types unifiés
import type {
  ApiResponse,
  JobRequest,
  JobResult,
  AgentExecutionRequest,
  Agent,
  CreateAgentRequest,
  UpdateAgentRequest,
  RAGSearchRequest,
  RAGIndexRequest,
  SystemConfig
} from './types';

// Ré-exporter les types pour compatibilité
export type {
  ApiResponse,
  JobRequest,
  JobResult,
  AgentExecutionRequest,
  Agent,
  CreateAgentRequest,
  UpdateAgentRequest,
  RAGSearchRequest,
  RAGIndexRequest,
  SystemConfig
};

// Classe pour gérer les appels API
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  // Jobs API
  async createJob(jobRequest: JobRequest): Promise<ApiResponse<JobResult>> {
    return this.request<JobResult>('/api/jobs', {
      method: 'POST',
      body: JSON.stringify(jobRequest),
    });
  }

  async getJob(jobId: string): Promise<ApiResponse<JobResult>> {
    return this.request<JobResult>(`/api/jobs/${jobId}`);
  }

  async cancelJob(jobId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/jobs/${jobId}/cancel`, {
      method: 'POST',
    });
  }

  async getQueueStats(): Promise<ApiResponse<any>> {
    return this.request<any>('/api/jobs/stats');
  }

  async getJobs(type?: string, status?: string, limit?: number): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (status) params.append('status', status);
    if (limit) params.append('limit', limit.toString());
    
    const queryString = params.toString();
    const endpoint = queryString ? `/api/jobs?${queryString}` : '/api/jobs';
    
    return this.request<any[]>(endpoint);
  }

  // Agents API
  async executeAgent(request: AgentExecutionRequest): Promise<ApiResponse<any>> {
    return this.request<any>('/api/agents/execute', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getAgentStats(): Promise<ApiResponse<any>> {
    return this.request<any>('/api/agents/stats');
  }

  async getAvailableModels(): Promise<ApiResponse<string[]>> {
    return this.request<string[]>('/api/agents/models');
  }

  async checkAgentHealth(): Promise<ApiResponse<any>> {
    return this.request<any>('/api/agents/health');
  }

  // Agent CRUD operations
  async getAgents(): Promise<ApiResponse<Agent[]>> {
    return this.request<Agent[]>('/api/agents');
  }

  async getAgent(agentId: string): Promise<ApiResponse<Agent>> {
    return this.request<Agent>(`/api/agents/${agentId}`);
  }

  async createAgent(agent: CreateAgentRequest): Promise<ApiResponse<Agent>> {
    return this.request<Agent>('/api/agents', {
      method: 'POST',
      body: JSON.stringify(agent),
    });
  }

  async updateAgent(agent: UpdateAgentRequest): Promise<ApiResponse<Agent>> {
    return this.request<Agent>(`/api/agents/${agent.id}`, {
      method: 'PUT',
      body: JSON.stringify(agent),
    });
  }

  async deleteAgent(agentId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/agents/${agentId}`, {
      method: 'DELETE',
    });
  }

  async getAvailableTools(): Promise<ApiResponse<string[]>> {
    return this.request<string[]>('/api/agents/tools');
  }

  // RAG API
  async indexFile(file: File, options?: any): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);
    if (options) {
      formData.append('options', JSON.stringify(options));
    }

    return this.request<any>('/api/rag/index', {
      method: 'POST',
      body: formData,
    });
  }

  async indexDirectory(directory: string, options?: any): Promise<ApiResponse<any>> {
    return this.request<any>('/api/rag/index-directory', {
      method: 'POST',
      body: JSON.stringify({ directory, options }),
    });
  }

  async searchRAG(request: RAGSearchRequest): Promise<ApiResponse<any>> {
    return this.request<any>('/api/rag/search', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getRAGStats(): Promise<ApiResponse<any>> {
    return this.request<any>('/api/rag/stats');
  }

  async getSupportedExtensions(): Promise<ApiResponse<string[]>> {
    return this.request<string[]>('/api/rag/extensions');
  }

  async deleteDocument(docId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/rag/documents/${docId}`, {
      method: 'DELETE',
    });
  }

  async clearRAGIndex(): Promise<ApiResponse<void>> {
    return this.request<void>('/api/rag/clear', {
      method: 'POST',
    });
  }

  // ========================================
  // SYSTEM CONFIG API
  // ========================================

  async getSystemConfig(): Promise<ApiResponse<SystemConfig>> {
    return this.request<SystemConfig>('/api/system-config');
  }

  async updateSystemConfig(config: Partial<SystemConfig>): Promise<ApiResponse<SystemConfig>> {
    return this.request<SystemConfig>('/api/system-config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  async getSystemConfigSection(section: keyof SystemConfig): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/system-config/${section}`);
  }

  async updateSystemConfigSection(section: keyof SystemConfig, updates: any): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/system-config/${section}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async resetSystemConfig(): Promise<ApiResponse<SystemConfig>> {
    return this.request<SystemConfig>('/api/system-config/reset', {
      method: 'POST',
    });
  }
}

// Instance singleton
export const apiClient = new ApiClient();

// Hooks utilitaires pour React
export const useApi = () => {
  return {
    jobs: {
      create: apiClient.createJob.bind(apiClient),
      get: apiClient.getJob.bind(apiClient),
      cancel: apiClient.cancelJob.bind(apiClient),
      getStats: apiClient.getQueueStats.bind(apiClient),
    },
    agents: {
      execute: apiClient.executeAgent.bind(apiClient),
      getStats: apiClient.getAgentStats.bind(apiClient),
      getModels: apiClient.getAvailableModels.bind(apiClient),
      checkHealth: apiClient.checkAgentHealth.bind(apiClient),
      getAgents: apiClient.getAgents.bind(apiClient),
      getAgent: apiClient.getAgent.bind(apiClient),
      createAgent: apiClient.createAgent.bind(apiClient),
      updateAgent: apiClient.updateAgent.bind(apiClient),
      deleteAgent: apiClient.deleteAgent.bind(apiClient),
      getTools: apiClient.getAvailableTools.bind(apiClient),
    },
    rag: {
      indexFile: apiClient.indexFile.bind(apiClient),
      indexDirectory: apiClient.indexDirectory.bind(apiClient),
      search: apiClient.searchRAG.bind(apiClient),
      getStats: apiClient.getRAGStats.bind(apiClient),
      getExtensions: apiClient.getSupportedExtensions.bind(apiClient),
      deleteDocument: apiClient.deleteDocument.bind(apiClient),
      clear: apiClient.clearRAGIndex.bind(apiClient),
    },
    systemConfig: {
      get: apiClient.getSystemConfig.bind(apiClient),
      update: apiClient.updateSystemConfig.bind(apiClient),
      getSection: apiClient.getSystemConfigSection.bind(apiClient),
      updateSection: apiClient.updateSystemConfigSection.bind(apiClient),
      reset: apiClient.resetSystemConfig.bind(apiClient),
    },
  };
};
