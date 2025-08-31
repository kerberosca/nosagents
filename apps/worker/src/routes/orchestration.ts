import { Router } from 'express';
import { AgentService } from '../services/agent-service';
import { RAGService } from '../services/rag-service';
import { JobQueue } from '../services/job-queue';
import { logger } from '../utils/logger';
import { 
  Coordinator, 
  CoordinatorConfig, 
  DelegationPolicy,
  DelegationManager,
  ConversationContext,
  Agent,
  AgentMessage,
  AgentResponse
} from '@elavira/core';

const router = Router();

// Initialize coordinator
let coordinator: Coordinator | null = null;
let delegationManager: DelegationManager | null = null;
let delegationPolicy: DelegationPolicy | null = null;

// Initialize orchestration services
async function initializeOrchestration() {
  try {
    const agentService = new AgentService();
    const ragService = new RAGService();
    const jobQueue = new JobQueue();

    // Initialize delegation components
    delegationPolicy = new DelegationPolicy();
    delegationManager = new DelegationManager(
      agentService.getModelProvider(),
      agentService.getToolRegistry(),
      agentService.getMemoryManager()
    );

    // Create coordinator configuration
    const coordinatorConfig: CoordinatorConfig = {
      name: 'Elavira Coordinator',
      description: 'Coordinateur principal pour l\'orchestration multi-agents',
      model: process.env.COORDINATOR_MODEL || 'qwen2.5:7b',
      systemPrompt: `Tu es le coordinateur principal d'Elavira Agents. 
      Tu es responsable de l'orchestration des conversations multi-agents.
      Tu analyses les messages et décides de la meilleure délégation possible.
      Tu gères les workflows et coordonnes la collaboration entre agents spécialisés.`,
      delegationPolicy: delegationPolicy,
      maxDelegations: 10,
      timeoutMs: 30000
    };

    // Initialize coordinator
    coordinator = new Coordinator(
      coordinatorConfig,
      agentService.getModelProvider(),
      agentService.getToolRegistry(),
      agentService.getMemoryManager(),
      delegationManager
    );

    // Add available agents to coordinator
    const availableAgents = await agentService.getAvailableAgents();
    availableAgents.forEach(agent => {
      coordinator!.addAgent(agent);
    });

    // Load predefined workflows
    await loadPredefinedWorkflows();

    logger.info('Orchestration services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize orchestration services:', error);
    throw error;
  }
}

// Load predefined workflows
async function loadPredefinedWorkflows() {
  if (!coordinator) return;

  try {
    const fs = require('fs').promises;
    const path = require('path');
    const workflowsDir = path.join(process.cwd(), 'data', 'workflows');

    const workflowFiles = await fs.readdir(workflowsDir);
    
    for (const file of workflowFiles) {
      if (file.endsWith('.yaml') || file.endsWith('.yml')) {
        const workflowPath = path.join(workflowsDir, file);
        const workflowContent = await fs.readFile(workflowPath, 'utf8');
        
        // Parse YAML workflow
        const yaml = require('js-yaml');
        const workflow = yaml.load(workflowContent);
        
        // Add workflow to coordinator
        coordinator.addWorkflow(workflow);
        logger.info(`Loaded workflow: ${workflow.name}`);
      }
    }
  } catch (error) {
    logger.error('Failed to load predefined workflows:', error);
  }
}

// Initialize orchestration on startup
initializeOrchestration().catch(logger.error);

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    coordinator: coordinator ? 'initialized' : 'not_initialized',
    delegationManager: delegationManager ? 'initialized' : 'not_initialized',
    delegationPolicy: delegationPolicy ? 'initialized' : 'not_initialized'
  });
});

// Get orchestration status
router.get('/status', (req, res) => {
  if (!coordinator) {
    return res.status(503).json({ error: 'Orchestration not initialized' });
  }

  const stats = coordinator.getDelegationStats();
  const availableAgents = coordinator.getAvailableAgents();
  const activeWorkflows = coordinator.getActiveWorkflows();

  res.json({
    coordinator: {
      name: coordinator['config'].name,
      description: coordinator['config'].description,
      model: coordinator['config'].model
    },
    stats,
    availableAgents: availableAgents.map(agent => ({
      id: agent.id,
      name: agent.name,
      role: agent.role,
      tools: agent.tools.length
    })),
    activeWorkflows: activeWorkflows.map(workflow => ({
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      steps: workflow.steps.length
    }))
  });
});

// Multi-agent chat endpoint
router.post('/chat', async (req, res) => {
  if (!coordinator) {
    return res.status(503).json({ error: 'Orchestration not initialized' });
  }

  try {
    const { message, workflowId, conversationId } = req.body;

    if (!message || !message.content) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    // Create agent message
    const agentMessage: AgentMessage = {
      id: `msg-${Date.now()}`,
      content: message.content,
      role: 'user',
      timestamp: new Date(),
      conversationId: conversationId || `conv-${Date.now()}`
    };

    // Handle multi-agent conversation
    const response = await coordinator.handleMultiAgentConversation(
      agentMessage,
      agentMessage.conversationId,
      workflowId
    );

    // Get delegation information
    const context = coordinator['getOrCreateContext'](agentMessage.conversationId);
    const delegationHistory = context.getDelegationHistory();

    // Format delegations for response
    const delegations = delegationHistory.map(delegation => ({
      from: delegation.from,
      to: delegation.to,
      message: delegation.message.content,
      timestamp: delegation.timestamp,
      status: delegation.success ? 'completed' : 'failed',
      response: delegation.response?.content,
      confidence: 0.85 // TODO: Calculate actual confidence
    }));

    res.json({
      response,
      delegations,
      conversationId: agentMessage.conversationId,
      metadata: {
        workflowId,
        totalDelegations: delegations.length,
        successfulDelegations: delegations.filter(d => d.status === 'completed').length
      }
    });

  } catch (error) {
    logger.error('Error in multi-agent chat:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get available workflows
router.get('/workflows', (req, res) => {
  if (!coordinator) {
    return res.status(503).json({ error: 'Orchestration not initialized' });
  }

  const workflows = coordinator.getActiveWorkflows();
  
  res.json({
    workflows: workflows.map(workflow => ({
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      entryPoint: workflow.entryPoint,
      exitConditions: workflow.exitConditions,
      steps: workflow.steps.map(step => ({
        id: step.id,
        agentId: step.agentId,
        task: step.task,
        dependencies: step.dependencies,
        requiredTools: step.requiredTools,
        expectedOutput: step.expectedOutput
      }))
    }))
  });
});

// Execute specific workflow
router.post('/workflows/:workflowId/execute', async (req, res) => {
  if (!coordinator) {
    return res.status(503).json({ error: 'Orchestration not initialized' });
  }

  try {
    const { workflowId } = req.params;
    const { message, conversationId } = req.body;

    if (!message || !message.content) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    // Create agent message
    const agentMessage: AgentMessage = {
      id: `msg-${Date.now()}`,
      content: message.content,
      role: 'user',
      timestamp: new Date(),
      conversationId: conversationId || `conv-${Date.now()}`
    };

    // Execute workflow
    const response = await coordinator.executeWorkflow(
      workflowId,
      agentMessage,
      agentMessage.conversationId
    );

    // Get workflow execution details
    const context = coordinator['getOrCreateContext'](agentMessage.conversationId);
    const delegationHistory = context.getDelegationHistory();

    const delegations = delegationHistory.map(delegation => ({
      from: delegation.from,
      to: delegation.to,
      message: delegation.message.content,
      timestamp: delegation.timestamp,
      status: delegation.success ? 'completed' : 'failed',
      response: delegation.response?.content,
      confidence: 0.85
    }));

    res.json({
      response,
      delegations,
      workflowId,
      conversationId: agentMessage.conversationId,
      metadata: {
        workflowExecuted: true,
        totalDelegations: delegations.length,
        successfulDelegations: delegations.filter(d => d.status === 'completed').length
      }
    });

  } catch (error) {
    logger.error('Error executing workflow:', error);
    res.status(500).json({ 
      error: 'Failed to execute workflow',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get delegation statistics
router.get('/delegations/stats', (req, res) => {
  if (!coordinator) {
    return res.status(503).json({ error: 'Orchestration not initialized' });
  }

  const stats = coordinator.getDelegationStats();
  res.json(stats);
});

// Get conversation context
router.get('/conversations/:conversationId/context', (req, res) => {
  if (!coordinator) {
    return res.status(503).json({ error: 'Orchestration not initialized' });
  }

  try {
    const { conversationId } = req.params;
    const context = coordinator['getOrCreateContext'](conversationId);
    
    const contextData = {
      conversationId,
      summary: context.getContextSummary(),
      stats: context.getConversationStats(),
      fullContext: context.getFullContext()
    };

    res.json(contextData);
  } catch (error) {
    logger.error('Error getting conversation context:', error);
    res.status(500).json({ 
      error: 'Failed to get conversation context',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Clear conversation context
router.delete('/conversations/:conversationId', (req, res) => {
  if (!coordinator) {
    return res.status(503).json({ error: 'Orchestration not initialized' });
  }

  try {
    const { conversationId } = req.params;
    const context = coordinator['getOrCreateContext'](conversationId);
    context.reset();
    
    res.json({ message: 'Conversation context cleared successfully' });
  } catch (error) {
    logger.error('Error clearing conversation context:', error);
    res.status(500).json({ 
      error: 'Failed to clear conversation context',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Add custom delegation rule
router.post('/delegation/rules', (req, res) => {
  if (!delegationPolicy) {
    return res.status(503).json({ error: 'Delegation policy not initialized' });
  }

  try {
    const rule = req.body;
    delegationPolicy.addRule(rule);
    
    res.json({ message: 'Delegation rule added successfully', rule });
  } catch (error) {
    logger.error('Error adding delegation rule:', error);
    res.status(500).json({ 
      error: 'Failed to add delegation rule',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get delegation rules
router.get('/delegation/rules', (req, res) => {
  if (!delegationPolicy) {
    return res.status(503).json({ error: 'Delegation policy not initialized' });
  }

  const rules = delegationPolicy.getRules();
  res.json({ rules });
});

// Remove delegation rule
router.delete('/delegation/rules/:ruleId', (req, res) => {
  if (!delegationPolicy) {
    return res.status(503).json({ error: 'Delegation policy not initialized' });
  }

  try {
    const { ruleId } = req.params;
    delegationPolicy.removeRule(ruleId);
    
    res.json({ message: 'Delegation rule removed successfully' });
  } catch (error) {
    logger.error('Error removing delegation rule:', error);
    res.status(500).json({ 
      error: 'Failed to remove delegation rule',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
