'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Bot, Send, Settings, MessageSquare, AlertCircle } from 'lucide-react'
import { useAgents, useChat } from '@/lib/hooks'

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
  const { agents, models, getAgents, getModels, executeAgent, error: agentError } = useAgents()
  const { messages, isTyping, sendMessage, clearMessages } = useChat()
  const [selectedAgent, setSelectedAgent] = useState<any>(null)
  const [inputValue, setInputValue] = useState('')
  const [localMessages, setLocalMessages] = useState(initialMessages)
  const [error, setError] = useState<string | null>(null)

  // Charger les agents et modèles disponibles
  useEffect(() => {
    getAgents()
    getModels()
  }, [getAgents, getModels])

  // Sélectionner le premier agent disponible
  useEffect(() => {
    if (agents.length > 0 && !selectedAgent) {
      setSelectedAgent(agents[0])
    }
  }, [agents, selectedAgent])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !selectedAgent) return

    const userMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      content: inputValue,
      agent: 'Vous',
      timestamp: new Date(),
    }

    setLocalMessages(prev => [...prev, userMessage])
    const currentInput = inputValue
    setInputValue('')

    try {
      // Utiliser le hook de chat pour envoyer le message
      await sendMessage(selectedAgent.id, currentInput)
      
      // Ajouter la réponse de l'agent aux messages locaux
      const lastMessage = messages[messages.length - 1]
      if (lastMessage && lastMessage.type === 'agent') {
        const agentMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant' as const,
          content: lastMessage.content,
          agent: selectedAgent.name,
          timestamp: new Date(),
        }
        setLocalMessages(prev => [...prev, agentMessage])
      }
    } catch (err) {
      setError((err as Error).message)
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        type: 'error' as const,
        content: (err as Error).message,
        agent: 'Système',
        timestamp: new Date(),
      }
      setLocalMessages(prev => [...prev, errorMessage])
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
                <Settings className="h-4 w-4 mr-2" />
                Configuration
              </Button>
              <Button variant="outline" size="sm" className="w-full">
                <MessageSquare className="h-4 w-4 mr-2" />
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
                      {message.agent}
                    </div>
                    <div className="text-sm">{message.content}</div>
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
