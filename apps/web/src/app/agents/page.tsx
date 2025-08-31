'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AgentList } from '@/components/agents/agent-list'
import { AgentForm } from '@/components/agents/agent-form'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Loader2 } from 'lucide-react'
import { useAgents, useRAG } from '@/lib/hooks'
import { Agent, CreateAgentRequest, UpdateAgentRequest } from '@/lib/api'

export default function AgentsPage() {
  const router = useRouter()
  const { 
    agents, 
    models, 
    tools, 
    loading, 
    error, 
    getAgents, 
    getModels, 
    getTools, 
    createAgent, 
    updateAgent, 
    deleteAgent 
  } = useAgents()
  const { stats: ragStats } = useRAG()
  
  const [showForm, setShowForm] = useState(false)
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    getAgents()
    getModels()
    getTools()
  }, [getAgents, getModels, getTools])

  const handleCreateAgent = async (agentData: CreateAgentRequest) => {
    setFormLoading(true)
    try {
      await createAgent(agentData)
      setShowForm(false)
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdateAgent = async (agentData: UpdateAgentRequest) => {
    setFormLoading(true)
    try {
      await updateAgent(agentData)
      setEditingAgent(null)
      setShowForm(false)
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteAgent = async (agentId: string) => {
    await deleteAgent(agentId)
  }

  const handleEditAgent = (agent: Agent) => {
    setEditingAgent(agent)
    setShowForm(true)
  }

  const handleChatWithAgent = (agent: Agent) => {
    router.push(`/chat?agent=${agent.id}`)
  }

  const handleSaveAgent = async (agentData: CreateAgentRequest | UpdateAgentRequest) => {
    if (editingAgent) {
      await handleUpdateAgent(agentData as UpdateAgentRequest)
    } else {
      await handleCreateAgent(agentData as CreateAgentRequest)
    }
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingAgent(null)
  }

  // Données simulées pour les packs de connaissances (en attendant l'API)
  const knowledgePacks = ['recettes', 'enseignement', 'general', 'pedagogie', 'ingredients']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agents</h1>
          <p className="text-muted-foreground">
            Gérez vos agents IA spécialisés
          </p>
        </div>
        
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouvel agent
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <AgentForm
              agent={editingAgent || undefined}
              onSave={handleSaveAgent}
              onCancel={handleCancelForm}
              loading={formLoading}
              models={models}
              tools={tools}
              knowledgePacks={knowledgePacks}
            />
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Erreur: {error}</p>
        </div>
      )}
      
      <AgentList
        agents={agents}
        onEdit={handleEditAgent}
        onDelete={handleDeleteAgent}
        onChat={handleChatWithAgent}
        loading={loading}
      />
    </div>
  )
}
