'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { AlertCircle, Send, Bot } from 'lucide-react'
import { useChat, useAgents } from '../../lib/hooks'
import type { Agent, AgentMessage } from '../../lib/types'

interface LocalMessage {
  id: string
  type: 'user' | 'assistant' | 'error'
  content: string
  agent: string
  timestamp: Date
}

// Agents par défaut (en attendant la vraie API)
const defaultAgents = [
  {
    id: 'assistant',
    name: 'Assistant',
    role: 'Assistant général',
    description: 'Assistant polyvalent pour toutes vos questions',
    avatar: '🤖',
  },
  {
    id: 'chef',
    name: 'Chef',
    role: 'Cuisinier',
    description: 'Planifie des menus et adapte les recettes',
    avatar: '👨‍🍳',
  },
  {
    id: 'prof',
    name: 'Prof',
    role: 'Enseignant',
    description: 'Aide à la création de contenu pédagogique',
    avatar: '👨‍🏫',
  },
]

// Messages initiaux
const initialMessages = [
  {
    id: '1',
    type: 'assistant' as const,
    content: 'Bonjour ! Je suis votre assistant. Comment puis-je vous aider aujourd\'hui ?',
    agent: 'Assistant',
    timestamp: new Date(Date.now() - 60000),
  },
]

export function ChatInterface() {
  const { messages, isTyping, sendMessage } = useChat()
  const { agents, getAgents, error: agentError } = useAgents()
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([])
  const [error, setError] = useState<string | null>(null)

  // Charger les agents et modèles disponibles
  useEffect(() => {
    getAgents()
  }, [getAgents])

  // Sélectionner le premier agent disponible
  useEffect(() => {
    if (agents.length > 0 && !selectedAgent) {
      setSelectedAgent(agents[0])
    }
  }, [agents, selectedAgent])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !selectedAgent) return

    const userMessage: LocalMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      agent: 'Vous',
      timestamp: new Date(),
    }

    setLocalMessages(prev => [...prev, userMessage])
    const currentInput = inputValue
    setInputValue('')

    // Ajouter un message "En train de réfléchir..."
    const thinkingMessage: LocalMessage = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: 'En train de réfléchir...',
      agent: selectedAgent.name,
      timestamp: new Date(),
    }
    setLocalMessages(prev => [...prev, thinkingMessage])

    try {
      // Appeler directement l'API au lieu d'utiliser le hook useChat
      const response = await fetch('http://localhost:3001/api/agents/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId: selectedAgent.id,
          message: currentInput,
          sessionId: `chat-session-${Date.now()}`,
          context: {
            timestamp: new Date().toISOString()
          }
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Réponse API:', result)

        // Mettre à jour le message "En train de réfléchir..." avec le job ID
        setLocalMessages(prev => prev.map(msg =>
          msg.id === thinkingMessage.id
            ? {
                ...msg,
                content: `Traitement en cours... Job ID: ${result.jobId}`,
                type: 'assistant' as const
              }
            : msg
        ))

        // Attendre la réponse de l'agent avec timeout de 30 secondes
        const jobId = result.jobId
        let attempts = 0
        const maxAttempts = 30 // 30 secondes

        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000)) // Attendre 1 seconde
          attempts++

          try {
            const jobResponse = await fetch(`http://localhost:3001/api/jobs/agent_execution/${jobId}`)
            if (jobResponse.ok) {
              const jobResult = await jobResponse.json()
              if (jobResult.success && jobResult.job) {
                const job = jobResult.job
                console.log(`État du job (${attempts}s):`, job.status)

                if (job.status === 'completed') {
                  // Remplacer le message par la réponse de l'agent
                  let responseContent = 'Réponse reçue mais vide';
                  
                  if (job.result) {
                    // Fonction pour extraire le texte du stream Ollama
                    const extractTextFromOllamaStream = (streamContent: string) => {
                      try {
                        const lines = streamContent.split('\n').filter(line => line.trim());
                        let extractedText = '';
                        
                        for (const line of lines) {
                          try {
                            const parsed = JSON.parse(line);
                            if (parsed.response && typeof parsed.response === 'string') {
                              extractedText += parsed.response;
                            }
                          } catch (e) {
                            continue;
                          }
                        }
                        
                        return extractedText.trim();
                      } catch (error) {
                        return streamContent;
                      }
                    };
                    
                    if (job.result.response && job.result.response.content) {
                      if (typeof job.result.response.content === 'string' && (job.result.response.content.includes('"model":"tinyllama"') || job.result.response.content.includes('"model":"phi3:mini"'))) {
                        // C'est un stream Ollama, extraire le texte
                        responseContent = extractTextFromOllamaStream(job.result.response.content);
                      } else {
                        responseContent = job.result.response.content;
                      }
                    } else if (typeof job.result === 'string') {
                      responseContent = job.result;
                    } else {
                      responseContent = JSON.stringify(job.result, null, 2);
                    }
                  }
                  
                  setLocalMessages(prev => prev.map(msg =>
                    msg.id === thinkingMessage.id
                      ? {
                          ...msg,
                          content: responseContent,
                          type: 'assistant' as const
                        }
                      : msg
                  ))
                  return // Sortir de la fonction
                } else if (job.status === 'failed') {
                  // Afficher l'erreur
                  setLocalMessages(prev => prev.map(msg =>
                    msg.id === thinkingMessage.id
                      ? {
                          ...msg,
                          content: `Erreur: ${job.failedReason || 'Job échoué'}`,
                          type: 'error' as const
                        }
                      : msg
                  ))
                  return
                }
              }
            }
          } catch (jobError) {
            console.log(`Erreur lors de la vérification du job (${attempts}s):`, jobError)
          }
        }

        // Si l'API des jobs ne fonctionne pas, afficher un message d'information
        setLocalMessages(prev => prev.map(msg =>
          msg.id === thinkingMessage.id
            ? {
                ...msg,
                content: `✅ Message envoyé avec succès ! Job ID: ${jobId}\n\nL'agent a probablement répondu (vérifiez les logs du worker).\nL'API de récupération des jobs ne fonctionne pas actuellement.`,
                type: 'assistant' as const
              }
            : msg
        ))
      } else {
        throw new Error(`Erreur HTTP: ${response.status}`)
      }
    } catch (err) {
      setError((err as Error).message)

      // Remplacer le message "En train de réfléchir..." par l'erreur
      setLocalMessages(prev => prev.map(msg =>
        msg.id === thinkingMessage.id
          ? {
              ...msg,
              content: `Erreur: ${(err as Error).message}`,
              type: 'error' as const
            }
          : msg
      ))
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const getAgentAvatar = (role: string) => {
    switch (role.toLowerCase()) {
      case 'chef':
      case 'cuisinier':
        return '👨‍🍳'
      case 'prof':
      case 'enseignant':
      case 'teacher':
        return '👨‍🏫'
      case 'assistant':
      case 'assistant général':
        return '🤖'
      case 'développeur':
      case 'developer':
        return '👨‍💻'
      case 'analyste':
      case 'analyst':
        return '📊'
      default:
        return '🤖'
    }
  }

  // Afficher les erreurs
  if (agentError) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600 mb-4">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Erreur de connexion</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Impossible de se connecter au service des agents. Vérifiez que le worker est démarré.
            </p>
            <Button onClick={() => getAgents()} variant="outline" className="w-full">
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Afficher un message si aucun agent n'est disponible
  if (!selectedAgent) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-muted-foreground mb-4">
              <Bot className="h-5 w-5" />
              <span className="font-medium">Aucun agent disponible</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Créez un agent dans la section Agents pour commencer à discuter.
            </p>
            <Button onClick={() => window.location.href = '/agents'} variant="outline" className="w-full">
              Aller aux agents
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex h-full space-x-6">
      {/* Sélection d'agent */}
      <div className="w-80 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bot className="h-5 w-5" />
              <span>Agents disponibles</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedAgent?.id === agent.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted'
                }`}
                onClick={() => setSelectedAgent(agent)}
              >
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{getAgentAvatar(agent.role)}</div>
                  <div className="flex-1">
                    <div className="font-medium">{agent.name}</div>
                    <div className="text-sm text-muted-foreground">{agent.role}</div>
                  </div>
                  {selectedAgent?.id === agent.id && (
                    <Badge variant="default" className="text-xs">
                      Actif
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {agent.description}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Informations de l'agent sélectionné */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Agent actuel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-3 mb-4">
              <div className="text-3xl">{getAgentAvatar(selectedAgent.role)}</div>
              <div>
                <div className="font-semibold">{selectedAgent.name}</div>
                <div className="text-sm text-muted-foreground">{selectedAgent.role}</div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {selectedAgent.description}
            </p>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full">
                {/* <Settings className="h-4 w-4 mr-2" /> */}
                Configuration
              </Button>
              <Button variant="outline" size="sm" className="w-full">
                {/* <MessageSquare className="h-4 w-4 mr-2" /> */}
                Historique
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interface de chat */}
      <div className="flex-1 flex flex-col">
        <Card className="flex-1 flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>{getAgentAvatar(selectedAgent.role)}</span>
              <span>Chat avec {selectedAgent.name}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {localMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] p-3 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : message.type === 'error'
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <div className="text-sm font-medium mb-1">
                      {typeof message.agent === 'string' ? message.agent : 'Agent'}
                    </div>
                    <div className="text-sm">
                      {(() => {
                        if (typeof message.content === 'string') {
                          return message.content;
                        }
                        
                        // Si c'est un objet, essayer d'extraire le contenu
                        if (message.content && typeof message.content === 'object') {
                          const contentObj = message.content as any;
                          
                          // Fonction pour extraire le texte du stream Ollama
                          const extractTextFromOllamaStream = (streamContent: string) => {
                            try {
                              const lines = streamContent.split('\n').filter(line => line.trim());
                              let extractedText = '';
                              
                              for (const line of lines) {
                                try {
                                  const parsed = JSON.parse(line);
                                  if (parsed.response && typeof parsed.response === 'string') {
                                    extractedText += parsed.response;
                                  }
                                } catch (e) {
                                  continue;
                                }
                              }
                              
                              return extractedText.trim();
                            } catch (error) {
                              return streamContent;
                            }
                          };
                          
                          // Si c'est une réponse d'agent avec une propriété content
                          if (contentObj.content) {
                            if (typeof contentObj.content === 'string' && (contentObj.content.includes('"model":"tinyllama"') || contentObj.content.includes('"model":"phi3:mini"'))) {
                              // C'est un stream Ollama, extraire le texte
                              return extractTextFromOllamaStream(contentObj.content);
                            }
                            return contentObj.content;
                          }
                          // Si c'est une réponse d'agent avec une propriété response
                          if (contentObj.response) {
                            return contentObj.response;
                          }
                          // Sinon, afficher l'objet formaté
                          return JSON.stringify(message.content, null, 2);
                        }
                        
                        return String(message.content);
                      })()}
                    </div>
                    <div className="text-xs opacity-70 mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-muted text-muted-foreground p-3 rounded-lg">
                    <div className="text-sm font-medium mb-1">{selectedAgent?.name}</div>
                    <div className="text-sm">En train de réfléchir...</div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="flex space-x-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Posez une question à ${selectedAgent?.name}...`}
                disabled={isTyping}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
