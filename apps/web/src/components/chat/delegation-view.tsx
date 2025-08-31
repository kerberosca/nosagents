'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  GitBranch, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
  Eye,
  EyeOff,
  TrendingUp,
  Users,
  Activity
} from 'lucide-react';
import { DelegationInfo, WorkflowInfo } from './multi-agent-chat';

export interface DelegationViewProps {
  delegations: DelegationInfo[];
  activeWorkflow: WorkflowInfo | null;
}

export function DelegationView({ delegations, activeWorkflow }: DelegationViewProps) {
  const [showDetails, setShowDetails] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Auto-refresh delegations
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // TODO: Fetch updated delegations from API
    }, 2000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format timestamp
  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  // Calculate delegation statistics
  const stats = {
    total: delegations.length,
    completed: delegations.filter(d => d.status === 'completed').length,
    failed: delegations.filter(d => d.status === 'failed').length,
    processing: delegations.filter(d => d.status === 'processing').length,
    pending: delegations.filter(d => d.status === 'pending').length,
    successRate: delegations.length > 0 
      ? Math.round((delegations.filter(d => d.status === 'completed').length / delegations.length) * 100)
      : 0
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <GitBranch className="h-5 w-5" />
            <h3 className="font-medium">Délégations</h3>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="text-lg font-semibold">{stats.total}</div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
          <div className="text-center p-2 bg-green-50 rounded">
            <div className="text-lg font-semibold text-green-600">{stats.successRate}%</div>
            <div className="text-xs text-gray-600">Succès</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Progression</span>
            <span>{stats.completed}/{stats.total}</span>
          </div>
          <Progress value={stats.total > 0 ? (stats.completed / stats.total) * 100 : 0} />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Active Workflow */}
          {activeWorkflow && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <GitBranch className="h-4 w-4" />
                  <span>Workflow: {activeWorkflow.name}</span>
                  <Badge variant={activeWorkflow.status === 'running' ? 'default' : 'secondary'}>
                    {activeWorkflow.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Workflow progress */}
                <div>
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Étapes</span>
                    <span>{activeWorkflow.steps.filter(s => s.status === 'completed').length}/{activeWorkflow.steps.length}</span>
                  </div>
                  <Progress value={activeWorkflow.progress} />
                </div>

                {/* Current step */}
                {activeWorkflow.currentStep && (
                  <div className="text-sm">
                    <span className="text-gray-600">Étape actuelle:</span>
                    <div className="font-medium mt-1">{activeWorkflow.currentStep}</div>
                  </div>
                )}

                {/* Workflow steps */}
                {showDetails && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-gray-700">Étapes:</h4>
                    {activeWorkflow.steps.map((step, index) => (
                      <div
                        key={step.id}
                        className="flex items-center space-x-2 text-xs"
                      >
                        {getStatusIcon(step.status)}
                        <span className="flex-1">{step.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {step.agentId}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Recent Delegations */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Délégations récentes</h4>
              <Badge variant="secondary" className="text-xs">
                {delegations.length}
              </Badge>
            </div>

            {delegations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <GitBranch className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucune délégation</p>
                <p className="text-xs">Les délégations apparaîtront ici</p>
              </div>
            ) : (
              <div className="space-y-2">
                {delegations.slice(-10).reverse().map((delegation, index) => (
                  <Card key={index} className="text-sm">
                    <CardContent className="p-3">
                      <div className="flex items-start space-x-3">
                        {getStatusIcon(delegation.status)}
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium">{delegation.from}</span>
                            <span className="text-gray-400">→</span>
                            <span className="font-medium">{delegation.to}</span>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getStatusColor(delegation.status)}`}
                            >
                              {delegation.status}
                            </Badge>
                          </div>
                          
                          <p className="text-xs text-gray-600 truncate mb-2">
                            {delegation.message}
                          </p>
                          
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{formatTime(delegation.timestamp)}</span>
                            {delegation.confidence && (
                              <span>Confiance: {Math.round(delegation.confidence * 100)}%</span>
                            )}
                          </div>

                          {/* Response preview */}
                          {showDetails && delegation.response && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                              <div className="font-medium mb-1">Réponse:</div>
                              <p className="text-gray-600 line-clamp-2">
                                {delegation.response}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Delegation Statistics */}
          {showDetails && delegations.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Statistiques</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span>Complétées:</span>
                    <span className="font-medium text-green-600">{stats.completed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>En cours:</span>
                    <span className="font-medium text-blue-600">{stats.processing}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>En attente:</span>
                    <span className="font-medium text-yellow-600">{stats.pending}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Échouées:</span>
                    <span className="font-medium text-red-600">{stats.failed}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
