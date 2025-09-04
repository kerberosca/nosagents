'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Switch } from '../ui/switch'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { 
  Bot, 
  Download, 
  Trash2, 
  RefreshCw, 
  Play, 
  Pause,
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  HardDrive,
  Network,
  Zap,
  Info
} from 'lucide-react'

interface AIModel {
  id: string
  name: string
  provider: 'ollama' | 'localai' | 'openai'
  status: 'available' | 'downloading' | 'error' | 'unavailable'
  size: number // en GB
  parameters: number // en millions
  context: number // en tokens
  downloadProgress?: number
  lastUsed?: Date
  tags: string[]
  description?: string
}

interface ModelProvider {
  name: string
  status: 'online' | 'offline' | 'error'
  baseUrl: string
  models: AIModel[]
  capabilities: {
    generation: boolean
    embeddings: boolean
    vision: boolean
    function_calling: boolean
  }
}

export function ModelManager() {
  const [providers, setProviders] = useState<ModelProvider[]>([])
  const [selectedProvider, setSelectedProvider] = useState<string>('ollama')
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterCapability, setFilterCapability] = useState<string>('all')

  // Simulation des données
  useEffect(() => {
    const mockProviders: ModelProvider[] = [
      {
        name: 'Ollama',
        status: 'online',
        baseUrl: 'http://localhost:11434',
        capabilities: {
          generation: true,
          embeddings: true,
          vision: true,
          function_calling: true
        },
        models: [
          {
            id: 'llama3.1:8b',
            name: 'Llama 3.1 8B',
            provider: 'ollama',
            status: 'available',
            size: 4.7,
            parameters: 8000,
            context: 8192,
            lastUsed: new Date(),
            tags: ['text', 'general', 'fast'],
            description: 'Modèle généraliste rapide et efficace'
          },
          {
            id: 'qwen2.5:7b',
            name: 'Qwen 2.5 7B',
            provider: 'ollama',
            status: 'available',
            size: 4.1,
            parameters: 7000,
            context: 32768,
            lastUsed: new Date(Date.now() - 86400000),
            tags: ['text', 'multilingual', 'reasoning'],
            description: 'Modèle multilingue avec bonnes capacités de raisonnement'
          },
          {
            id: 'nomic-embed-text',
            name: 'Nomic Embed Text',
            provider: 'ollama',
            status: 'available',
            size: 0.4,
            parameters: 137,
            context: 8192,
            lastUsed: new Date(Date.now() - 172800000),
            tags: ['embeddings', 'fast'],
            description: 'Modèle d\'embeddings rapide et efficace'
          },
          {
            id: 'llava:7b',
            name: 'LLaVA 7B',
            provider: 'ollama',
            status: 'downloading',
            size: 4.2,
            parameters: 7000,
            context: 4096,
            downloadProgress: 65,
            tags: ['vision', 'multimodal'],
            description: 'Modèle multimodal vision-langage'
          }
        ]
      },
      {
        name: 'LocalAI',
        status: 'offline',
        baseUrl: 'http://localhost:8080',
        capabilities: {
          generation: true,
          embeddings: false,
          vision: false,
          function_calling: false
        },
        models: []
      }
    ]
    
    setProviders(mockProviders)
  }, [])

  const handlePullModel = async (providerName: string, modelId: string) => {
    setIsLoading(true)
    // Simulation du téléchargement
    setTimeout(() => {
      setProviders(prev => prev.map(provider => 
        provider.name === providerName 
          ? {
              ...provider,
              models: provider.models.map(model =>
                model.id === modelId
                  ? { ...model, status: 'downloading', downloadProgress: 0 }
                  : model
              )
            }
          : provider
      ))
      setIsLoading(false)
    }, 1000)
  }

  const handleDeleteModel = async (providerName: string, modelId: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le modèle ${modelId} ?`)) {
      setProviders(prev => prev.map(provider => 
        provider.name === providerName 
          ? {
              ...provider,
              models: provider.models.filter(model => model.id !== modelId)
            }
          : provider
      ))
    }
  }

  const handleTestConnection = async (providerName: string) => {
    setIsLoading(true)
    // Simulation du test de connexion
    setTimeout(() => {
      setProviders(prev => prev.map(provider => 
        provider.name === providerName 
          ? { ...provider, status: 'online' }
          : provider
      ))
      setIsLoading(false)
    }, 2000)
  }

  const filteredModels = providers
    .find(p => p.name.toLowerCase() === selectedProvider.toLowerCase())
    ?.models.filter(model => {
      const matchesSearch = model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           model.id.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = filterStatus === 'all' || model.status === filterStatus
      const matchesCapability = filterCapability === 'all' || 
        (filterCapability === 'generation' && model.parameters > 1000) ||
        (filterCapability === 'embeddings' && model.parameters < 1000) ||
        (filterCapability === 'vision' && model.tags.includes('vision'))
      
      return matchesSearch && matchesStatus && matchesCapability
    }) || []

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'downloading': return <Download className="h-4 w-4 text-blue-500" />
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />
      case 'unavailable': return <XCircle className="h-4 w-4 text-gray-500" />
      default: return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getProviderStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'offline': return <XCircle className="h-4 w-4 text-red-500" />
      case 'error': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default: return <XCircle className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Vue d'ensemble des fournisseurs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bot className="h-5 w-5" />
            <span>Fournisseurs de modèles IA</span>
          </CardTitle>
          <CardDescription>
            Gérez vos fournisseurs de modèles et testez les connexions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {providers.map((provider) => (
              <Card key={provider.name} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getProviderStatusIcon(provider.status)}
                    <h3 className="font-semibold">{provider.name}</h3>
                  </div>
                  <Badge variant={provider.status === 'online' ? 'default' : 'secondary'}>
                    {provider.status}
                  </Badge>
                </div>
                
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>URL: {provider.baseUrl}</p>
                  <div className="flex space-x-4">
                    <span className={`flex items-center space-x-1 ${provider.capabilities.generation ? 'text-green-600' : 'text-gray-400'}`}>
                      <Zap className="h-3 w-3" />
                      <span>Génération</span>
                    </span>
                    <span className={`flex items-center space-x-1 ${provider.capabilities.embeddings ? 'text-green-600' : 'text-gray-400'}`}>
                      <Network className="h-3 w-3" />
                      <span>Embeddings</span>
                    </span>
                    <span className={`flex items-center space-x-1 ${provider.capabilities.vision ? 'text-green-600' : 'text-gray-400'}`}>
                      <HardDrive className="h-3 w-3" />
                      <span>Vision</span>
                    </span>
                  </div>
                </div>
                
                <div className="mt-3 flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTestConnection(provider.name)}
                    disabled={isLoading}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Tester
                  </Button>
                  <Button size="sm" variant="outline">
                    <Settings className="h-3 w-3 mr-1" />
                    Config
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sélecteur de fournisseur et filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Modèles disponibles</CardTitle>
          <CardDescription>
            Parcourez et gérez les modèles de votre fournisseur sélectionné
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="provider-select">Fournisseur</Label>
              <select
                id="provider-select"
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="w-full mt-1 p-2 border rounded-md"
              >
                {providers.map(provider => (
                  <option key={provider.name} value={provider.name.toLowerCase()}>
                    {provider.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex-1">
              <Label htmlFor="search">Rechercher</Label>
              <Input
                id="search"
                placeholder="Nom ou ID du modèle..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div className="flex-1">
              <Label htmlFor="status-filter">Statut</Label>
              <select
                id="status-filter"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full mt-1 p-2 border rounded-md"
              >
                <option value="all">Tous</option>
                <option value="available">Disponible</option>
                <option value="downloading">Téléchargement</option>
                <option value="error">Erreur</option>
                <option value="unavailable">Indisponible</option>
              </select>
            </div>
            
            <div className="flex-1">
              <Label htmlFor="capability-filter">Capacité</Label>
              <select
                id="capability-filter"
                value={filterCapability}
                onChange={(e) => setFilterCapability(e.target.value)}
                className="w-full mt-1 p-2 border rounded-md"
              >
                <option value="all">Toutes</option>
                <option value="generation">Génération</option>
                <option value="embeddings">Embeddings</option>
                <option value="vision">Vision</option>
              </select>
            </div>
          </div>

          {/* Liste des modèles */}
          <div className="space-y-3">
            {filteredModels.map((model) => (
              <Card key={model.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {getStatusIcon(model.status)}
                      <h4 className="font-semibold">{model.name}</h4>
                      <Badge variant="outline">{model.id}</Badge>
                      {model.status === 'downloading' && (
                        <Badge variant="secondary">
                          {model.downloadProgress}%
                        </Badge>
                      )}
                    </div>
                    
                    {model.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {model.description}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      {model.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">Taille:</span> {model.size} GB
                      </div>
                      <div>
                        <span className="font-medium">Paramètres:</span> {model.parameters}M
                      </div>
                      <div>
                        <span className="font-medium">Contexte:</span> {model.context.toLocaleString()}
                      </div>
                      {model.lastUsed && (
                        <div>
                          <span className="font-medium">Dernière utilisation:</span>
                          <br />
                          {model.lastUsed.toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    
                    {model.status === 'downloading' && (
                      <div className="mt-3">
                        <Progress value={model.downloadProgress} className="h-2" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col space-y-2 ml-4">
                    {model.status === 'unavailable' && (
                      <Button
                        size="sm"
                        onClick={() => handlePullModel(selectedProvider, model.id)}
                        disabled={isLoading}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Télécharger
                      </Button>
                    )}
                    
                    {model.status === 'available' && (
                      <Button size="sm" variant="outline">
                        <Play className="h-3 w-3 mr-1" />
                        Utiliser
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteModel(selectedProvider, model.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
            
            {filteredModels.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Info className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun modèle trouvé avec les critères sélectionnés</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistiques d'utilisation */}
      <Card>
        <CardHeader>
                      <CardTitle>Statistiques d&apos;utilisation</CardTitle>
            <CardDescription>
              Vue d&apos;ensemble de l&apos;utilisation des modèles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {providers.reduce((acc, p) => acc + p.models.length, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Modèles installés</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {providers.reduce((acc, p) => acc + p.models.filter(m => m.status === 'available').length, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Modèles disponibles</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {providers.reduce((acc, p) => acc + p.models.filter(m => m.status === 'downloading').length, 0)}
              </div>
              <div className="text-sm text-muted-foreground">En téléchargement</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {providers.reduce((acc, p) => acc + p.models.reduce((sum, m) => sum + m.size, 0), 0).toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">Espace total (GB)</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
