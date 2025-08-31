'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { 
  GitBranch, 
  Play, 
  Pause, 
  RotateCcw,
  Search,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  Settings,
  Info
} from 'lucide-react';
import { WorkflowInfo } from './multi-agent-chat';

export interface WorkflowSelectorProps {
  onWorkflowSelect: (workflow: WorkflowInfo) => void;
  activeWorkflow: WorkflowInfo | null;
}

// Predefined workflows
const PREDEFINED_WORKFLOWS = [
  {
    id: 'support-client',
    name: 'Support Client',
    description: 'Workflow pour le support client avec analyse, recherche et réponse',
    category: 'Support',
    estimatedTime: '5-10 min',
    agents: ['support-analyst', 'knowledge-agent', 'support-writer', 'technical-expert'],
    steps: [
      { id: 'analyze-request', name: 'Analyser la demande', agentId: 'support-analyst' },
      { id: 'search-knowledge', name: 'Rechercher solutions', agentId: 'knowledge-agent' },
      { id: 'generate-response', name: 'Générer réponse', agentId: 'support-writer' },
      { id: 'technical-escalation', name: 'Escalade technique', agentId: 'technical-expert' },
      { id: 'final-review', name: 'Révision finale', agentId: 'support-manager' }
    ]
  },
  {
    id: 'document-analysis',
    name: 'Document Analysis',
    description: 'Workflow pour l\'analyse complète de documents avec extraction, analyse et synthèse',
    category: 'Analyse',
    estimatedTime: '10-15 min',
    agents: ['document-processor', 'document-classifier', 'nlp-agent', 'sentiment-analyzer'],
    steps: [
      { id: 'extract-content', name: 'Extraire contenu', agentId: 'document-processor' },
      { id: 'classify-document', name: 'Classifier document', agentId: 'document-classifier' },
      { id: 'extract-entities', name: 'Extraire entités', agentId: 'nlp-agent' },
      { id: 'analyze-sentiment', name: 'Analyser sentiment', agentId: 'sentiment-analyzer' },
      { id: 'research-context', name: 'Rechercher contexte', agentId: 'research-agent' },
      { id: 'generate-summary', name: 'Générer résumé', agentId: 'content-writer' },
      { id: 'create-insights', name: 'Créer insights', agentId: 'insights-analyst' },
      { id: 'final-report', name: 'Rapport final', agentId: 'report-writer' }
    ]
  },
  {
    id: 'research-assistant',
    name: 'Research Assistant',
    description: 'Workflow pour l\'assistance à la recherche avec collecte, analyse et synthèse d\'informations',
    category: 'Recherche',
    estimatedTime: '15-20 min',
    agents: ['research-planner', 'data-collector', 'fact-checker', 'data-analyst'],
    steps: [
      { id: 'define-research', name: 'Définir recherche', agentId: 'research-planner' },
      { id: 'collect-information', name: 'Collecter données', agentId: 'data-collector' },
      { id: 'validate-sources', name: 'Valider sources', agentId: 'fact-checker' },
      { id: 'analyze-data', name: 'Analyser données', agentId: 'data-analyst' },
      { id: 'synthesize-findings', name: 'Synthétiser résultats', agentId: 'synthesis-writer' },
      { id: 'generate-recommendations', name: 'Générer recommandations', agentId: 'recommendations-expert' },
      { id: 'create-presentation', name: 'Créer présentation', agentId: 'presentation-writer' },
      { id: 'quality-review', name: 'Révision qualité', agentId: 'research-reviewer' }
    ]
  }
];

export function WorkflowSelector({ onWorkflowSelect, activeWorkflow }: WorkflowSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showDetails, setShowDetails] = useState(false);

  // Filter workflows
  const filteredWorkflows = PREDEFINED_WORKFLOWS.filter(workflow => {
    const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workflow.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || workflow.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = [...new Set(PREDEFINED_WORKFLOWS.map(w => w.category))];

  // Handle workflow selection
  const handleWorkflowSelect = (workflow: any) => {
    const workflowInfo: WorkflowInfo = {
      id: workflow.id,
      name: workflow.name,
      status: 'idle',
      progress: 0,
      steps: workflow.steps.map((step: any) => ({
        ...step,
        status: 'pending' as const
      }))
    };
    
    onWorkflowSelect(workflowInfo);
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Support':
        return <Users className="h-4 w-4" />;
      case 'Analyse':
        return <AlertCircle className="h-4 w-4" />;
      case 'Recherche':
        return <Search className="h-4 w-4" />;
      default:
        return <GitBranch className="h-4 w-4" />;
    }
  };

  // Get category color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Support':
        return 'bg-blue-100 text-blue-800';
      case 'Analyse':
        return 'bg-green-100 text-green-800';
      case 'Recherche':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <GitBranch className="h-5 w-5" />
          <h3 className="font-medium">Sélection de workflow</h3>
          {activeWorkflow && (
            <Badge variant="default">
              Actif: {activeWorkflow.name}
            </Badge>
          )}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? 'Réduire' : 'Détails'}
        </Button>
      </div>

      {/* Search and filters */}
      <div className="space-y-2">
        <div className="flex space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher des workflows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === '' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('')}
          >
            Tous
          </Button>
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(selectedCategory === category ? '' : category)}
              className="flex items-center space-x-1"
            >
              {getCategoryIcon(category)}
              <span>{category}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Workflows */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">
          Workflows disponibles ({filteredWorkflows.length})
        </h4>
        
        <ScrollArea className="h-64">
          <div className="space-y-2">
            {filteredWorkflows.map(workflow => {
              const isActive = activeWorkflow?.id === workflow.id;
              
              return (
                <Card
                  key={workflow.id}
                  className={`cursor-pointer transition-colors ${
                    isActive ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleWorkflowSelect(workflow)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h5 className="font-medium">{workflow.name}</h5>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getCategoryColor(workflow.category)}`}
                          >
                            {getCategoryIcon(workflow.category)}
                            <span className="ml-1">{workflow.category}</span>
                          </Badge>
                          {isActive && (
                            <Badge variant="default" className="text-xs">
                              Actif
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">
                          {workflow.description}
                        </p>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{workflow.estimatedTime}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="h-3 w-3" />
                            <span>{workflow.agents.length} agent(s)</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <GitBranch className="h-3 w-3" />
                            <span>{workflow.steps.length} étape(s)</span>
                          </div>
                        </div>

                        {/* Workflow steps */}
                        {showDetails && (
                          <div className="mt-3 space-y-2">
                            <h6 className="text-xs font-medium text-gray-700">Étapes:</h6>
                            <div className="space-y-1">
                              {workflow.steps.map((step, index) => (
                                <div
                                  key={step.id}
                                  className="flex items-center space-x-2 text-xs"
                                >
                                  <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-xs">
                                    {index + 1}
                                  </div>
                                  <span className="flex-1">{step.name}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {step.agentId}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <Button
                        variant={isActive ? "secondary" : "default"}
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWorkflowSelect(workflow);
                        }}
                      >
                        {isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Active workflow info */}
      {activeWorkflow && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center space-x-2">
              <Info className="h-4 w-4" />
              <span>Workflow actif: {activeWorkflow.name}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span>Statut:</span>
              <Badge variant={activeWorkflow.status === 'running' ? 'default' : 'secondary'}>
                {activeWorkflow.status}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span>Progression:</span>
              <span>{Math.round(activeWorkflow.progress)}%</span>
            </div>
            {activeWorkflow.currentStep && (
              <div className="text-xs">
                <span className="text-gray-600">Étape actuelle:</span>
                <div className="font-medium mt-1">{activeWorkflow.currentStep}</div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick actions */}
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => {
            // TODO: Show workflow creation dialog
          }}
        >
          <Settings className="h-4 w-4 mr-2" />
          Créer workflow
        </Button>
        
        {activeWorkflow && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // TODO: Stop active workflow
            }}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
