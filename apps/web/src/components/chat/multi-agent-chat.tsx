'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  MessageSquare, 
  Users, 
  GitBranch, 
  Play, 
  Pause, 
  RotateCcw,
  Settings,
  Eye,
  EyeOff,
  AlertCircle,
  Send
} from 'lucide-react';
import { AgentSelector } from './agent-selector';
import { DelegationView } from './delegation-view';
import { WorkflowSelector } from './workflow-selector';
import { useChat } from '@/lib/hooks';
import { Agent } from '@/lib/types';
import { AgentMessage, AgentResponse } from '@/lib/types';

export interface MultiAgentChatProps {
  className?: string;
}

interface WorkflowInfo {
  id: string
  name: string
  description: string
  agents: string[]
}

interface DelegationInfo {
  id: string
  from: string
  to: string
  message: string
  status: 'pending' | 'completed' | 'failed'
  timestamp: Date
}

interface ExtendedMessage extends AgentMessage {
  response?: AgentResponse
}

// Exporter WorkflowInfo et DelegationInfo pour les autres composants
export type { WorkflowInfo, DelegationInfo }

export function MultiAgentChat({ className }: MultiAgentChatProps) {
  const [messages, setMessages] = useState<Array<ExtendedMessage>>([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedAgents, setSelectedAgents] = useState<Agent[]>([]);
  const [delegations, setDelegations] = useState<DelegationInfo[]>([]);
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowInfo | null>(null);
  const [isOrchestrationMode, setIsOrchestrationMode] = useState(false);
  const [showDelegations, setShowDelegations] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { sendMessage, isTyping } = useChat();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return;

    const userMessage: AgentMessage = {
      id: `msg-${Date.now()}`,
      content: inputValue,
      sender: 'user',
      role: 'user',
      timestamp: new Date(),
      conversationId: 'multi-agent-chat'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);

    try {
      if (isOrchestrationMode) {
        // Use orchestration mode with coordinator
        await sendOrchestratedMessage(userMessage);
      } else {
        // Use selected agents directly
        await sendToSelectedAgents(userMessage);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        ...userMessage,
        response: {
          id: `error-${Date.now()}`,
          content: 'Erreur lors de l\'envoi du message',
          toolCalls: [],
          thoughts: [],
          metadata: { error: true },
          timestamp: new Date()
        }
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Send message through orchestration
  const sendOrchestratedMessage = async (message: AgentMessage) => {
    // TODO: Implement orchestration API call
    const response = await fetch('/api/orchestration/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        workflowId: activeWorkflow?.id
      })
    });

    if (response.ok) {
      const result = await response.json();
      setMessages(prev => [...prev, {
        ...message,
        response: result.response
      }]);
      
      if (result.delegations) {
        setDelegations(prev => [...prev, ...result.delegations]);
      }
    }
  };

  // Send message to selected agents
  const sendToSelectedAgents = async (message: ExtendedMessage) => {
    const agentResponses = await Promise.allSettled(
      selectedAgents.map(agent => 
        sendMessage(agent.id, message.content)
      )
    )

    const responses = agentResponses.map((result, index) => {
      if (result.status === 'fulfilled') {
        return {
          agentId: selectedAgents[index].id,
          agentName: selectedAgents[index].name,
          response: result.value
        }
      } else {
        return {
          agentId: selectedAgents[index].id,
          agentName: selectedAgents[index].name,
          error: 'Erreur de communication'
        }
      }
    })

    // Add responses to messages
    responses.forEach((response: any) => {
      if (response.response) {
        setMessages(prev => [...prev, {
          id: `response-${Date.now()}-${response.agentId}`,
          content: response.response.content,
          sender: 'agent',
          role: 'assistant',
          timestamp: new Date(),
          conversationId: 'multi-agent-chat',
          metadata: { agentId: response.agentId, agentName: response.agentName }
        }])
      } else if (response.error) {
        setMessages(prev => [...prev, {
          id: `error-${Date.now()}-${response.agentId}`,
          content: response.error,
          sender: 'agent',
          role: 'assistant',
          timestamp: new Date(),
          conversationId: 'multi-agent-chat',
          metadata: { agentId: response.agentId, agentName: response.agentName, error: true }
        }])
      }
    })
  };

  // Handle workflow selection
  const handleWorkflowSelect = (workflow: WorkflowInfo) => {
    setActiveWorkflow(workflow);
    setIsOrchestrationMode(true);
  };

  // Clear conversation
  const handleClearConversation = () => {
    setMessages([]);
    setDelegations([]);
    setActiveWorkflow(null);
  };

  // Toggle orchestration mode
  const toggleOrchestrationMode = () => {
    setIsOrchestrationMode(!isOrchestrationMode);
    if (!isOrchestrationMode) {
      setActiveWorkflow(null);
    }
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Chat Multi-Agents</h2>
          <Badge variant={isOrchestrationMode ? "default" : "secondary"}>
            {isOrchestrationMode ? "Orchestration" : "Direct"}
          </Badge>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleOrchestrationMode}
          >
            <GitBranch className="h-4 w-4 mr-2" />
            {isOrchestrationMode ? "Mode Direct" : "Mode Orchestration"}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDelegations(!showDelegations)}
          >
            {showDelegations ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearConversation}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main chat area */}
        <div className="flex-1 flex flex-col">
          {/* Agent selection and workflow */}
          <div className="p-4 border-b">
            {isOrchestrationMode ? (
              <WorkflowSelector
                onWorkflowSelect={handleWorkflowSelect}
                activeWorkflow={activeWorkflow}
              />
            ) : (
              <AgentSelector
                selectedAgents={selectedAgents}
                onAgentsChange={setSelectedAgents}
              />
            )}
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100'} rounded-lg p-3`}>
                    <div className="flex items-center space-x-2 mb-2">
                      {message.role === 'assistant' && message.metadata?.agentName && (
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {message.metadata.agentName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <span className="text-sm font-medium">
                        {message.role === 'user' ? 'Vous' : message.metadata?.agentName || 'Assistant'}
                      </span>
                      {message.metadata?.error && (
                        <Badge variant="destructive" className="text-xs">Erreur</Badge>
                      )}
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={
                  isOrchestrationMode 
                    ? "Envoyez un message au coordinateur..." 
                    : `Envoyez un message à ${selectedAgents.length} agent(s)...`
                }
                className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isProcessing || (isOrchestrationMode ? false : selectedAgents.length === 0)}
              />
              <Button
                onClick={handleSendMessage}
                disabled={isProcessing || !inputValue.trim()}
              >
                {isProcessing ? <AlertCircle className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                {isProcessing ? 'Envoi...' : 'Envoyer'}
              </Button>
            </div>
          </div>
        </div>

        {/* Delegation sidebar */}
        {showDelegations && (
          <div className="border-l pl-4">
            <h4 className="font-medium mb-2">Délégations</h4>
            <div className="space-y-2">
              {delegations.map((delegation) => (
                <div key={delegation.id} className="text-sm p-2 bg-muted rounded">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{delegation.from} → {delegation.to}</span>
                    <Badge variant={delegation.status === 'completed' ? 'default' : 'secondary'}>
                      {delegation.status}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">{delegation.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
