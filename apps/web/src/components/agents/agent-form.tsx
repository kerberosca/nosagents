'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X, Plus, Save, Loader2 } from 'lucide-react'
import { Agent, CreateAgentRequest, UpdateAgentRequest } from '@/lib/api'

interface AgentFormProps {
  agent?: Agent
  onSave: (agent: CreateAgentRequest | UpdateAgentRequest) => Promise<void>
  onCancel: () => void
  loading?: boolean
  models: string[]
  tools: string[]
  knowledgePacks: string[]
}

export function AgentForm({ 
  agent, 
  onSave, 
  onCancel, 
  loading = false,
  models,
  tools,
  knowledgePacks
}: AgentFormProps) {
  const [formData, setFormData] = useState<CreateAgentRequest>({
    name: agent?.name || '',
    description: agent?.description || '',
    role: agent?.role || '',
    model: agent?.model || '',
    systemPrompt: agent?.systemPrompt || '',
    tools: agent?.tools || [],
    permissions: {
      network: agent?.permissions?.network || false,
      filesystem: agent?.permissions?.filesystem || false,
      tools: agent?.permissions?.tools || [],
    },
    knowledgePacks: agent?.knowledgePacks || [],
  })

  const [selectedTool, setSelectedTool] = useState('')
  const [selectedKnowledgePack, setSelectedKnowledgePack] = useState('')

  const handleInputChange = (field: keyof CreateAgentRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const handlePermissionChange = (field: keyof typeof formData.permissions, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [field]: value,
      },
    }))
  }

  const addTool = () => {
    if (selectedTool && !formData.tools.includes(selectedTool)) {
      setFormData(prev => ({
        ...prev,
        tools: [...prev.tools, selectedTool],
      }))
      setSelectedTool('')
    }
  }

  const removeTool = (tool: string) => {
    setFormData(prev => ({
      ...prev,
      tools: prev.tools.filter(t => t !== tool),
    }))
  }

  const addKnowledgePack = () => {
    if (selectedKnowledgePack && !formData.knowledgePacks.includes(selectedKnowledgePack)) {
      setFormData(prev => ({
        ...prev,
        knowledgePacks: [...prev.knowledgePacks, selectedKnowledgePack],
      }))
      setSelectedKnowledgePack('')
    }
  }

  const removeKnowledgePack = (pack: string) => {
    setFormData(prev => ({
      ...prev,
      knowledgePacks: prev.knowledgePacks.filter(p => p !== pack),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (agent) {
      await onSave({ ...formData, id: agent.id })
    } else {
      await onSave(formData)
    }
  }

  const isFormValid = formData.name && formData.description && formData.role && formData.model && formData.systemPrompt

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>{agent ? 'Modifier l\'agent' : 'Créer un nouvel agent'}</CardTitle>
        <CardDescription>
          Configurez les paramètres de votre agent IA
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations de base */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de l'agent *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Ex: Assistant, Chef, Prof..."
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Rôle *</Label>
              <Input
                id="role"
                value={formData.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
                placeholder="Ex: Assistant général, Cuisinier, Enseignant..."
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Décrivez les capacités et spécialités de cet agent..."
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="model">Modèle IA *</Label>
              <Select value={formData.model} onValueChange={(value) => handleInputChange('model', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un modèle" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="systemPrompt">Prompt système *</Label>
            <Textarea
              id="systemPrompt"
              value={formData.systemPrompt}
              onChange={(e) => handleInputChange('systemPrompt', e.target.value)}
              placeholder="Instructions système pour définir le comportement de l'agent..."
              rows={6}
              required
            />
          </div>

          {/* Outils */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Outils disponibles</Label>
              <div className="flex items-center space-x-2">
                <Select value={selectedTool} onValueChange={setSelectedTool}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Sélectionner un outil" />
                  </SelectTrigger>
                  <SelectContent>
                    {tools.map((tool) => (
                      <SelectItem key={tool} value={tool}>
                        {tool}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" onClick={addTool} size="sm" variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tools.map((tool) => (
                <Badge key={tool} variant="secondary" className="flex items-center space-x-1">
                  <span>{tool}</span>
                  <button
                    type="button"
                    onClick={() => removeTool(tool)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Packs de connaissances */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Packs de connaissances</Label>
              <div className="flex items-center space-x-2">
                <Select value={selectedKnowledgePack} onValueChange={setSelectedKnowledgePack}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Sélectionner un pack" />
                  </SelectTrigger>
                  <SelectContent>
                    {knowledgePacks.map((pack) => (
                      <SelectItem key={pack} value={pack}>
                        {pack}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" onClick={addKnowledgePack} size="sm" variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.knowledgePacks.map((pack) => (
                <Badge key={pack} variant="outline" className="flex items-center space-x-1">
                  <span>{pack}</span>
                  <button
                    type="button"
                    onClick={() => removeKnowledgePack(pack)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Permissions */}
          <div className="space-y-4">
            <Label>Permissions</Label>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="network">Accès réseau</Label>
                  <p className="text-sm text-muted-foreground">
                    Permettre à l'agent d'accéder à Internet
                  </p>
                </div>
                <Switch
                  id="network"
                  checked={formData.permissions.network}
                  onCheckedChange={(checked) => handlePermissionChange('network', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="filesystem">Accès système de fichiers</Label>
                  <p className="text-sm text-muted-foreground">
                    Permettre à l'agent de lire/écrire des fichiers
                  </p>
                </div>
                <Switch
                  id="filesystem"
                  checked={formData.permissions.filesystem}
                  onCheckedChange={(checked) => handlePermissionChange('filesystem', checked)}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
            <Button type="submit" disabled={!isFormValid || loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {agent ? 'Mettre à jour' : 'Créer'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
