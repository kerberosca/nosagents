'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Progress } from '../ui/progress'
import { 
  BookOpen, 
  FileText, 
  Search, 
  Settings, 
  Trash2, 
  Upload, 
  AlertCircle, 
  CheckCircle,
  Clock,
  Play,
  Pause,
  RefreshCw,
  FolderOpen,
  Database,
  BarChart3,
  Plus
} from 'lucide-react'
import { useRAG, useJobs } from '../../lib/hooks'
import type { JobResult } from '../../lib/types'

interface KnowledgePack {
  id: string
  name: string
  description: string
  path: string
  version: string
  tags: string[]
  documents: number
  size: string
  status: 'indexed' | 'indexing' | 'error' | 'pending'
  lastUpdated: Date
  agents: string[]
}

interface RAGJob {
  id: string
  type: 'rag_indexing'
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  progress: number
  data: {
    filePath?: string
    directoryPath?: string
    knowledgePackId?: string
  }
  createdAt: string
  startedAt?: string
  completedAt?: string
  error?: string
}

export function AdvancedKnowledgeManager() {
  const { stats, extensions, loading, error, indexFile, getStats, getExtensions } = useRAG()
  const { jobs, getStats: getJobStats, cancelJob } = useJobs()
  const [knowledgePacks, setKnowledgePacks] = useState<KnowledgePack[]>([])
  const [ragJobs, setRagJobs] = useState<JobResult[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [uploading, setUploading] = useState(false)
  const [showCreatePack, setShowCreatePack] = useState(false)
  const [newPack, setNewPack] = useState({
    name: '',
    description: '',
    path: '',
    tags: [] as string[],
    agents: [] as string[]
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const directoryInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getStats()
    getExtensions()
    getJobStats()
    loadKnowledgePacks()
    loadRAGJobs()
  }, [getStats, getExtensions, getJobStats])

  const loadKnowledgePacks = () => {
    // TODO: Charger depuis l'API
    const packs: KnowledgePack[] = [
      {
        id: '1',
        name: 'Recettes',
        description: 'Base de connaissances culinaires avec recettes et techniques',
        path: './data/knowledge/recettes',
        version: '1.0.0',
        tags: ['cuisine', 'recettes', 'techniques'],
        documents: 15,
        size: '2.3 MB',
        status: 'indexed',
        lastUpdated: new Date(Date.now() - 86400000),
        agents: ['Chef']
      },
      {
        id: '2',
        name: 'Enseignement',
        description: 'Contenu pédagogique et ressources éducatives',
        path: './data/knowledge/enseignement',
        version: '1.0.0',
        tags: ['éducation', 'pédagogie', 'curriculum'],
        documents: 8,
        size: '1.7 MB',
        status: 'indexed',
        lastUpdated: new Date(Date.now() - 172800000),
        agents: ['Prof']
      }
    ]
    setKnowledgePacks(packs)
  }

  const loadRAGJobs = () => {
    // Utiliser tous les jobs disponibles (JobResult n'a pas de propriété type)
    // TODO: Implémenter un vrai filtrage RAG quand l'API le supporte
    setRagJobs(jobs)
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        await indexFile(file)
      }
      await getStats()
      await getJobStats()
    } catch (err) {
      console.error('Erreur lors de l\'upload:', err)
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDirectoryIndex = async () => {
    const directoryPath = directoryInputRef.current?.value
    if (!directoryPath) return

    try {
      // TODO: Appeler l'API pour indexer un répertoire
      console.log('Indexation du répertoire:', directoryPath)
      await getJobStats()
    } catch (err) {
      console.error('Erreur lors de l\'indexation:', err)
    }
  }

  const createKnowledgePack = async () => {
    if (!newPack.name.trim() || !newPack.path.trim()) {
      alert('Le nom et le chemin sont requis')
      return
    }

    try {
      const pack: KnowledgePack = {
        id: `pack_${Date.now()}`,
        name: newPack.name,
        description: newPack.description,
        path: newPack.path,
        version: '1.0.0',
        tags: newPack.tags,
        documents: 0,
        size: '0 MB',
        status: 'pending',
        lastUpdated: new Date(),
        agents: newPack.agents
      }

      setKnowledgePacks(prev => [...prev, pack])
      setNewPack({ name: '', description: '', path: '', tags: [], agents: [] })
      setShowCreatePack(false)
    } catch (error) {
      console.error('Erreur lors de la création du pack:', error)
    }
  }

  const deleteKnowledgePack = async (packId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce pack de connaissances ?')) {
      setKnowledgePacks(prev => prev.filter(pack => pack.id !== packId))
    }
  }

  const cancelRAGJob = async (jobId: string) => {
    try {
      await cancelJob(jobId)
      await getJobStats()
      loadRAGJobs()
    } catch (error) {
      console.error('Erreur lors de l\'annulation du job:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'indexed':
        return 'bg-green-100 text-green-800'
      case 'indexing':
        return 'bg-blue-100 text-blue-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'indexed':
        return <CheckCircle className="h-4 w-4" />
      case 'indexing':
        return <Play className="h-4 w-4" />
      case 'error':
        return <AlertCircle className="h-4 w-4" />
      case 'pending':
        return <Clock className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Vue d'ensemble */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Packs de connaissances</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {knowledgePacks.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Packs configurés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents indexés</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats?.totalDocuments || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Documents dans la base RAG
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jobs RAG actifs</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {ragJobs.filter(job => ['pending', 'running'].includes(job.status)).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Indexation en cours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taille totale</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats?.totalSize ? `${(stats.totalSize / (1024 * 1024)).toFixed(1)} MB` : '0 MB'}
            </div>
            <p className="text-xs text-muted-foreground">
              Espace utilisé
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>
            Gérer vos connaissances et lancer des indexations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Upload de fichiers</Label>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.docx,.txt,.md,.html,.htm"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Upload en cours...' : 'Sélectionner des fichiers'}
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Indexer un répertoire</Label>
              <div className="flex space-x-2">
                <Input
                  ref={directoryInputRef}
                  placeholder="Chemin du répertoire"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={handleDirectoryIndex}
                  size="sm"
                >
                  <FolderOpen className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nouveau pack</Label>
              <Button
                onClick={() => setShowCreatePack(true)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer un pack
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Packs de connaissances */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Packs de connaissances</CardTitle>
              <CardDescription>
                Gérer vos bases de connaissances spécialisées
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                loadKnowledgePacks()
                loadRAGJobs()
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {knowledgePacks.map((pack) => (
              <div key={pack.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(pack.status)}
                    <div>
                      <div className="font-medium">{pack.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {pack.description}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(pack.status)}>
                      {pack.status === 'indexed' ? 'Indexé' :
                       pack.status === 'indexing' ? 'Indexation' :
                       pack.status === 'error' ? 'Erreur' : 'En attente'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteKnowledgePack(pack.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Chemin:</span>
                    <div className="font-mono text-xs">{pack.path}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Documents:</span>
                    <div>{pack.documents}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Taille:</span>
                    <div>{pack.size}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Version:</span>
                    <div>{pack.version}</div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1">
                  {pack.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="mt-3 text-xs text-muted-foreground">
                  Dernière mise à jour: {pack.lastUpdated.toLocaleDateString()}
                </div>
              </div>
            ))}

            {knowledgePacks.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun pack de connaissances configuré</p>
                <p className="text-sm">Commencez par créer un pack ou importer des documents</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Jobs RAG en cours */}
      {ragJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Jobs RAG en cours</CardTitle>
            <CardDescription>
              Surveillance des tâches d&apos;indexation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ragJobs.map((job) => (
                <div key={job.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {job.status === 'running' && <Play className="h-4 w-4 text-blue-600" />}
                      {job.status === 'pending' && <Clock className="h-4 w-4 text-yellow-600" />}
                      {job.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-600" />}
                      {job.status === 'failed' && <AlertCircle className="h-4 w-4 text-red-600" />}
                      {job.status === 'cancelled' && <Pause className="h-4 w-4 text-gray-600" />}
                      
                      <div>
                        <div className="font-medium">
                          Job #{job.id.slice(0, 8)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          ID: {job.id.slice(0, 8)}...
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(job.status)}>
                        {job.status === 'pending' ? 'En attente' :
                         job.status === 'running' ? 'En cours' :
                         job.status === 'completed' ? 'Terminé' :
                         job.status === 'failed' ? 'Échoué' : 'Annulé'}
                      </Badge>

                      {['pending', 'running'].includes(job.status) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => cancelRAGJob(job.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Pause className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {job.status === 'running' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progression</span>
                        <span>{job.progress}%</span>
                      </div>
                      <Progress value={job.progress} className="h-2" />
                    </div>
                  )}

                  {job.error && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                      <strong>Erreur:</strong> {job.error}
                    </div>
                  )}

                  <div className="mt-3 text-xs text-muted-foreground">
                    Créé: {new Date(job.createdAt).toLocaleString()}
                    | Mis à jour: {new Date(job.updatedAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de création de pack */}
      {showCreatePack && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Nouveau pack de connaissances</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreatePack(false)}
              >
                ✕
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nom du pack *</Label>
                <Input
                  value={newPack.name}
                  onChange={(e) => setNewPack(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Recettes de cuisine"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newPack.description}
                  onChange={(e) => setNewPack(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description du contenu de ce pack..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Chemin du répertoire *</Label>
                <Input
                  value={newPack.path}
                  onChange={(e) => setNewPack(prev => ({ ...prev, path: e.target.value }))}
                  placeholder="./data/knowledge/nom-du-pack"
                />
              </div>

              <div className="space-y-2">
                <Label>Tags (séparés par des virgules)</Label>
                <Input
                  value={newPack.tags.join(', ')}
                  onChange={(e) => setNewPack(prev => ({ 
                    ...prev, 
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                  }))}
                  placeholder="tag1, tag2, tag3"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowCreatePack(false)}
              >
                Annuler
              </Button>
              <Button onClick={createKnowledgePack}>
                Créer le pack
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
