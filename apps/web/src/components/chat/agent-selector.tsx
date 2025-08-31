'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Search, 
  Filter,
  Plus,
  X,
  Zap,
  Brain,
  Code,
  BookOpen,
  Calculator,
  MessageSquare
} from 'lucide-react';
import { useAgents } from '@/lib/hooks';
import { Agent } from '@elavira/core';

export interface AgentSelectorProps {
  selectedAgents: Agent[];
  onAgentsChange: (agents: Agent[]) => void;
  maxAgents?: number;
}

export function AgentSelector({ 
  selectedAgents, 
  onAgentsChange, 
  maxAgents = 5 
}: AgentSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('');
  const [showAllAgents, setShowAllAgents] = useState(false);
  
  const { agents, loading, error } = useAgents();

  // Filter agents based on search and role
  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.role.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = !filterRole || agent.role.toLowerCase().includes(filterRole.toLowerCase());
    
    return matchesSearch && matchesRole;
  });

  // Get unique roles for filtering
  const uniqueRoles = [...new Set(agents.map(agent => agent.role))];

  // Handle agent selection
  const handleAgentToggle = (agent: Agent) => {
    const isSelected = selectedAgents.some(a => a.id === agent.id);
    
    if (isSelected) {
      onAgentsChange(selectedAgents.filter(a => a.id !== agent.id));
    } else {
      if (selectedAgents.length < maxAgents) {
        onAgentsChange([...selectedAgents, agent]);
      }
    }
  };

  // Get agent icon based on role
  const getAgentIcon = (role: string) => {
    const roleLower = role.toLowerCase();
    if (roleLower.includes('developer') || roleLower.includes('programmer')) return <Code className="h-4 w-4" />;
    if (roleLower.includes('researcher') || roleLower.includes('analyst')) return <Brain className="h-4 w-4" />;
    if (roleLower.includes('writer') || roleLower.includes('content')) return <BookOpen className="h-4 w-4" />;
    if (roleLower.includes('mathematician') || roleLower.includes('calculator')) return <Calculator className="h-4 w-4" />;
    if (roleLower.includes('support') || roleLower.includes('assistant')) return <MessageSquare className="h-4 w-4" />;
    return <Zap className="h-4 w-4" />;
  };

  // Get agent color based on role
  const getAgentColor = (role: string) => {
    const roleLower = role.toLowerCase();
    if (roleLower.includes('developer')) return 'bg-blue-100 text-blue-800';
    if (roleLower.includes('researcher')) return 'bg-green-100 text-green-800';
    if (roleLower.includes('writer')) return 'bg-purple-100 text-purple-800';
    if (roleLower.includes('mathematician')) return 'bg-orange-100 text-orange-800';
    if (roleLower.includes('support')) return 'bg-pink-100 text-pink-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        <span className="ml-2">Chargement des agents...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Erreur lors du chargement des agents: {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <h3 className="font-medium">Sélection d'agents</h3>
          <Badge variant="secondary">
            {selectedAgents.length}/{maxAgents}
          </Badge>
        </div>
        
        {selectedAgents.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAgentsChange([])}
          >
            <X className="h-4 w-4 mr-1" />
            Effacer
          </Button>
        )}
      </div>

      {/* Selected agents */}
      {selectedAgents.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Agents sélectionnés:</h4>
          <div className="flex flex-wrap gap-2">
            {selectedAgents.map(agent => (
              <div
                key={agent.id}
                className="flex items-center space-x-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2"
              >
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {agent.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{agent.name}</span>
                <Badge variant="outline" className="text-xs">
                  {agent.role}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAgentToggle(agent)}
                  className="h-4 w-4 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search and filters */}
      <div className="space-y-2">
        <div className="flex space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher des agents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAllAgents(!showAllAgents)}
          >
            <Filter className="h-4 w-4 mr-1" />
            {showAllAgents ? 'Réduire' : 'Étendre'}
          </Button>
        </div>

        {showAllAgents && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filterRole === '' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterRole('')}
            >
              Tous
            </Button>
            {uniqueRoles.map(role => (
              <Button
                key={role}
                variant={filterRole === role ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterRole(filterRole === role ? '' : role)}
              >
                {role}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Available agents */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">
          Agents disponibles ({filteredAgents.length})
        </h4>
        
        <ScrollArea className="h-64">
          <div className="space-y-2">
            {filteredAgents.map(agent => {
              const isSelected = selectedAgents.some(a => a.id === agent.id);
              const isDisabled = !isSelected && selectedAgents.length >= maxAgents;
              
              return (
                <Card
                  key={agent.id}
                  className={`cursor-pointer transition-colors ${
                    isSelected ? 'border-blue-500 bg-blue-50' : 
                    isDisabled ? 'opacity-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => !isDisabled && handleAgentToggle(agent)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={isSelected}
                        disabled={isDisabled}
                        onChange={() => !isDisabled && handleAgentToggle(agent)}
                      />
                      
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-sm">
                          {agent.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h5 className="font-medium text-sm truncate">
                            {agent.name}
                          </h5>
                          {isSelected && (
                            <Badge variant="default" className="text-xs">
                              Sélectionné
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-xs text-gray-600 truncate">
                          {agent.description}
                        </p>
                        
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getAgentColor(agent.role)}`}
                          >
                            <span className="mr-1">{getAgentIcon(agent.role)}</span>
                            {agent.role}
                          </Badge>
                          
                          <span className="text-xs text-gray-500">
                            {agent.tools.length} outil(s)
                          </span>
                        </div>
                      </div>
                      
                      {isDisabled && (
                        <Badge variant="secondary" className="text-xs">
                          Max atteint
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Quick selection */}
      {selectedAgents.length === 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Sélection rapide:</h4>
          <div className="flex flex-wrap gap-2">
            {uniqueRoles.slice(0, 4).map(role => {
              const roleAgents = agents.filter(agent => agent.role === role);
              const bestAgent = roleAgents[0]; // Take the first agent of this role
              
              if (!bestAgent) return null;
              
              return (
                <Button
                  key={role}
                  variant="outline"
                  size="sm"
                  onClick={() => handleAgentToggle(bestAgent)}
                  disabled={selectedAgents.length >= maxAgents}
                  className="flex items-center space-x-2"
                >
                  {getAgentIcon(role)}
                  <span>{role}</span>
                  <Plus className="h-3 w-3" />
                </Button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
