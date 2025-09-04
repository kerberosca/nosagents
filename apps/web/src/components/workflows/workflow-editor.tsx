'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Badge } from '../ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { 
  Plus, 
  Trash2, 
  Save, 
  Play, 
  Settings, 
  ArrowRight,
  Bot,
  GitBranch,
  Clock,
  AlertCircle
} from 'lucide-react'
import { useAgents } from '../../lib/hooks'

interface WorkflowStep {
  id: string
  agentId: string
  action: string
  input?: string
  dependsOn?: string[]
  timeout?: number
  order: number
}

interface Workflow {
  id?: string
  name: string
  description: string
  steps: WorkflowStep[]
  maxConcurrentExecutions: number
  timeout: number
  isActive: boolean
}

export function WorkflowEditor() {
  const { agents } = useAgents()
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [currentWorkflow, setCurrentWorkflow] = useState<Workflow>({
    name: '',
    description: '',
    steps: [],
    maxConcurrentExecutions: 1,
    timeout: 300,
    isActive: true
  })
  const [editingStep, setEditingStep] = useState<WorkflowStep | null>(null)
  const [showStepForm, setShowStepForm] = useState(false)

  // Actions disponibles pour les agents
  const availableActions = [
    'execute',
    'delegate',
    'wait_for_response',
    'conditional_execution',
    'parallel_execution',
    'retry_on_failure'
  ]

  const addStep = () => {
    const newStep: WorkflowStep = {
      id: `step_${Date.now()}`,
      agentId: '',
      action: 'execute',
      input: '',
      dependsOn: [],
      timeout: 60,
      order: currentWorkflow.steps.length
    }
    
    setCurrentWorkflow(prev => ({
      ...prev,
      steps: [...prev.steps, newStep]
    }))
    setEditingStep(newStep)
    setShowStepForm(true)
  }

  const updateStep = (stepId: string, updates: Partial<WorkflowStep>) => {
    setCurrentWorkflow(prev => ({
      ...prev,
      steps: prev.steps.map(step => 
        step.id === stepId ? { ...step, ...updates } : step
      )
    }))
  }

  const removeStep = (stepId: string) => {
    setCurrentWorkflow(prev => ({
      ...prev,
      steps: prev.steps.filter(step => step.id !== stepId)
    }))
  }

  const saveWorkflow = async () => {
    if (!currentWorkflow.name.trim()) {
      alert('Le nom du workflow est requis')
      return
    }

    if (currentWorkflow.steps.length === 0) {
      alert('Le workflow doit contenir au moins une étape')
      return
    }

    try {
      // TODO: Appeler l'API pour sauvegarder le workflow
      const savedWorkflow = {
        ...currentWorkflow,
        id: currentWorkflow.id || `workflow_${Date.now()}`
      }

      if (currentWorkflow.id) {
        // Mise à jour
        setWorkflows(prev => prev.map(w => 
          w.id === currentWorkflow.id ? savedWorkflow : w
        ))
      } else {
        // Nouveau
        setWorkflows(prev => [...prev, savedWorkflow])
      }

      // Réinitialiser le formulaire
      setCurrentWorkflow({
        name: '',
        description: '',
        steps: [],
        maxConcurrentExecutions: 1,
        timeout: 300,
        isActive: true
      })

      alert('Workflow sauvegardé avec succès !')
    } catch (error) {
      alert('Erreur lors de la sauvegarde du workflow')
      console.error(error)
    }
  }

  const executeWorkflow = async (workflowId: string) => {
    try {
      // TODO: Appeler l'API pour exécuter le workflow
      alert('Workflow démarré !')
    } catch (error) {
      alert('Erreur lors de l\'exécution du workflow')
      console.error(error)
    }
  }

  const getStepDependencies = (stepId: string) => {
    return currentWorkflow.steps
      .filter(step => step.id !== stepId)
      .map(step => ({
        value: step.id,
        label: `${step.order + 1}. ${step.action} (${agents.find(a => a.id === step.agentId)?.name || 'Agent inconnu'})`
      }))
  }

  return (
    <div className="space-y-6">
      {/* Formulaire principal du workflow */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <GitBranch className="h-5 w-5" />
            <span>Configuration du Workflow</span>
          </CardTitle>
          <CardDescription>
            Définissez les étapes et la logique d&apos;orchestration de vos agents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informations de base */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="workflow-name">Nom du workflow *</Label>
              <Input
                id="workflow-name"
                value={currentWorkflow.name}
                onChange={(e) => setCurrentWorkflow(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Planification de menu"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workflow-timeout">Timeout (secondes)</Label>
              <Input
                id="workflow-timeout"
                type="number"
                value={currentWorkflow.timeout}
                onChange={(e) => setCurrentWorkflow(prev => ({ ...prev, timeout: parseInt(e.target.value) || 300 }))}
                min="60"
                max="3600"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="workflow-description">Description</Label>
            <Textarea
              id="workflow-description"
              value={currentWorkflow.description}
              onChange={(e) => setCurrentWorkflow(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Décrivez l'objectif et le fonctionnement de ce workflow..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-concurrent">Exécutions simultanées max</Label>
            <Input
              id="max-concurrent"
              type="number"
              value={currentWorkflow.maxConcurrentExecutions}
              onChange={(e) => setCurrentWorkflow(prev => ({ ...prev, maxConcurrentExecutions: parseInt(e.target.value) || 1 }))}
              min="1"
              max="10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Étapes du workflow */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Bot className="h-5 w-5" />
                <span>Étapes du Workflow</span>
              </CardTitle>
              <CardDescription>
                Définissez la séquence d&apos;exécution de vos agents
              </CardDescription>
            </div>
            <Button onClick={addStep}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une étape
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {currentWorkflow.steps.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune étape définie</p>
              <p className="text-sm">Commencez par ajouter une étape pour orchestrer vos agents</p>
            </div>
          ) : (
            <div className="space-y-4">
              {currentWorkflow.steps.map((step, index) => (
                <div key={step.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline">{index + 1}</Badge>
                      <div>
                        <div className="font-medium">
                          {step.action.replace('_', ' ').toUpperCase()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Agent: {agents.find(a => a.id === step.agentId)?.name || 'Non sélectionné'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingStep(step)
                          setShowStepForm(true)
                        }}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStep(step.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {step.dependsOn && step.dependsOn.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      Dépend de: {step.dependsOn.map(depId => {
                        const depStep = currentWorkflow.steps.find(s => s.id === depId)
                        return depStep ? `${depStep.order + 1}. ${depStep.action}` : depId
                      }).join(', ')}
                    </div>
                  )}

                  {index < currentWorkflow.steps.length - 1 && (
                    <div className="flex justify-center mt-3">
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={() => setCurrentWorkflow({
          name: '',
          description: '',
          steps: [],
          maxConcurrentExecutions: 1,
          timeout: 300,
          isActive: true
        })}>
          Réinitialiser
        </Button>
        <Button onClick={saveWorkflow}>
          <Save className="h-4 w-4 mr-2" />
          Sauvegarder le Workflow
        </Button>
      </div>

      {/* Modal d'édition d'étape */}
      {showStepForm && editingStep && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Éditer l&apos;étape</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowStepForm(false)
                  setEditingStep(null)
                }}
              >
                ✕
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Agent</Label>
                  <Select
                    value={editingStep.agentId}
                    onValueChange={(value) => updateStep(editingStep.id, { agentId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Action</Label>
                  <Select
                    value={editingStep.action}
                    onValueChange={(value) => updateStep(editingStep.id, { action: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une action" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableActions.map((action) => (
                        <SelectItem key={action} value={action}>
                          {action.replace('_', ' ').toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Input/Paramètres</Label>
                <Textarea
                  value={editingStep.input || ''}
                  onChange={(e) => updateStep(editingStep.id, { input: e.target.value })}
                  placeholder="Paramètres ou instructions pour cette étape..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Dépendances</Label>
                  <Select
                    value=""
                    onValueChange={(value) => {
                      const currentDeps = editingStep.dependsOn || []
                      if (!currentDeps.includes(value)) {
                        updateStep(editingStep.id, { dependsOn: [...currentDeps, value] })
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Ajouter une dépendance" />
                    </SelectTrigger>
                    <SelectContent>
                      {getStepDependencies(editingStep.id).map((dep) => (
                        <SelectItem key={dep.value} value={dep.value}>
                          {dep.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {editingStep.dependsOn && editingStep.dependsOn.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {editingStep.dependsOn.map((depId) => {
                        const depStep = currentWorkflow.steps.find(s => s.id === depId)
                        return (
                          <Badge
                            key={depId}
                            variant="secondary"
                            className="cursor-pointer"
                            onClick={() => {
                              const newDeps = editingStep.dependsOn?.filter(d => d !== depId) || []
                              updateStep(editingStep.id, { dependsOn: newDeps })
                            }}
                          >
                            {depStep ? `${depStep.order + 1}. ${depStep.action}` : depId}
                            <span className="ml-1">×</span>
                          </Badge>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Timeout (secondes)</Label>
                  <Input
                    type="number"
                    value={editingStep.timeout}
                    onChange={(e) => updateStep(editingStep.id, { timeout: parseInt(e.target.value) || 60 })}
                    min="10"
                    max="600"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowStepForm(false)
                  setEditingStep(null)
                }}
              >
                Annuler
              </Button>
              <Button
                onClick={() => {
                  setShowStepForm(false)
                  setEditingStep(null)
                }}
              >
                Valider
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Liste des workflows existants */}
      {workflows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Workflows existants</CardTitle>
            <CardDescription>
              Vos workflows sauvegardés et prêts à l&apos;exécution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {workflows.map((workflow) => (
                <div key={workflow.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">{workflow.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {workflow.description}
                    </div>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                      <span>{workflow.steps.length} étapes</span>
                      <span>Timeout: {workflow.timeout}s</span>
                      <span>Max concurrent: {workflow.maxConcurrentExecutions}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={workflow.isActive ? 'default' : 'secondary'}>
                      {workflow.isActive ? 'Actif' : 'Inactif'}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => executeWorkflow(workflow.id!)}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Exécuter
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
