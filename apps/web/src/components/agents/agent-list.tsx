'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Bot, Edit, Trash2, MessageSquare, Settings, Plus, Loader2 } from 'lucide-react'
import { Agent } from '@/lib/api'

interface AgentListProps {
  agents: Agent[]
  onEdit: (agent: Agent) => void
  onDelete: (agentId: string) => Promise<void>
  onChat: (agent: Agent) => void
  loading?: boolean
}

export function AgentList({ agents, onEdit, onDelete, onChat, loading = false }: AgentListProps) {
  const [deletingAgent, setDeletingAgent] = useState<string | null>(null)

  const handleDelete = async (agentId: string) => {
    setDeletingAgent(agentId)
    try {
      await onDelete(agentId)
    } finally {
      setDeletingAgent(null)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement des agents...</span>
      </div>
    )
  }

  if (agents.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Bot className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Aucun agent configuré</h3>
          <p className="text-muted-foreground text-center mb-4">
            Créez votre premier agent pour commencer à utiliser la plateforme
          </p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Créer un agent
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {agents.map((agent) => (
        <Card key={agent.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="text-3xl">{getAgentAvatar(agent.role)}</div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold">{agent.name}</h3>
                    <Badge variant="outline">{agent.role}</Badge>
                  </div>
                  <p className="text-muted-foreground mb-3">{agent.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="secondary" className="text-xs">
                      {agent.model}
                    </Badge>
                    {agent.tools.slice(0, 3).map((tool) => (
                      <Badge key={tool} variant="outline" className="text-xs">
                        {tool}
                      </Badge>
                    ))}
                    {agent.tools.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{agent.tools.length - 3} autres
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span>Créé le {new Date(agent.createdAt).toLocaleDateString()}</span>
                    {agent.knowledgePacks.length > 0 && (
                      <span>{agent.knowledgePacks.length} pack(s) de connaissances</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onChat(agent)}
                  className="flex items-center space-x-1"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Chat</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(agent)}
                  className="flex items-center space-x-1"
                >
                  <Edit className="h-4 w-4" />
                  <span>Modifier</span>
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-1 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Supprimer</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer l&apos;agent</AlertDialogTitle>
                      <AlertDialogDescription>
                        Êtes-vous sûr de vouloir supprimer l&apos;agent &quot;{agent.name}&quot; ? 
                        Cette action est irréversible et supprimera toutes les données associées.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(agent.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={deletingAgent === agent.id}
                      >
                        {deletingAgent === agent.id && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Supprimer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
