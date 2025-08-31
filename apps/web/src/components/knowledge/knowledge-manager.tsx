'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BookOpen, FileText, Search, Settings, Trash2, Upload, AlertCircle, CheckCircle } from 'lucide-react'
import { useRAG } from '@/lib/hooks'

// Données simulées des packs de connaissances (en attendant la vraie API)
const defaultKnowledgePacks = [
  {
    id: '1',
    name: 'Recettes',
    description: 'Base de connaissances culinaires avec recettes et techniques',
    path: './data/knowledge/recettes',
    documents: 15,
    size: '2.3 MB',
    agents: ['Chef'],
    status: 'indexed',
    lastUpdated: new Date(Date.now() - 86400000), // 1 jour
  },
  {
    id: '2',
    name: 'Enseignement',
    description: 'Contenu pédagogique et ressources éducatives',
    path: './data/knowledge/enseignement',
    documents: 8,
    size: '1.7 MB',
    agents: ['Prof'],
    status: 'indexed',
    lastUpdated: new Date(Date.now() - 172800000), // 2 jours
  },
]

export function KnowledgeManager() {
  const { stats, extensions, loading, error, indexFile, getStats, getExtensions } = useRAG()
  const [knowledgePacks, setKnowledgePacks] = useState(defaultKnowledgePacks)
  const [searchQuery, setSearchQuery] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getStats()
    getExtensions()
  }, [getStats, getExtensions])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        await indexFile(file)
      }
      // Recharger les stats après l'upload
      await getStats()
    } catch (err) {
      console.error('Erreur lors de l\'upload:', err)
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    // TODO: Implémenter la recherche RAG
    console.log('Recherche:', searchQuery)
  }

  return (
    <div className="space-y-6">
      {/* Vue d'ensemble */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents indexés</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
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
            <CardTitle className="text-sm font-medium">Chunks</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats?.totalChunks || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Chunks de texte indexés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Extensions supportées</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : extensions?.length || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Types de fichiers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Statut</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {error ? (
                <AlertCircle className="h-5 w-5 text-red-500" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              <span className="text-sm font-medium">
                {error ? 'Erreur' : 'Opérationnel'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Service RAG
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Upload de fichiers */}
      <Card>
        <CardHeader>
          <CardTitle>Importer des documents</CardTitle>
          <CardDescription>
            Ajoutez des fichiers à votre base de connaissances RAG
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={extensions?.map(ext => `.${ext}`).join(',') || '.pdf,.docx,.txt,.md'}
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center space-x-2"
              >
                <Upload className="h-4 w-4" />
                <span>{uploading ? 'Upload en cours...' : 'Sélectionner des fichiers'}</span>
              </Button>
              <span className="text-sm text-muted-foreground">
                Extensions supportées: {extensions?.join(', ') || 'pdf, docx, txt, md'}
              </span>
            </div>
            {error && (
              <div className="flex items-center space-x-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recherche RAG */}
      <Card>
        <CardHeader>
          <CardTitle>Recherche dans les connaissances</CardTitle>
          <CardDescription>
            Recherchez dans vos documents indexés
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Entrez votre recherche..."
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={!searchQuery.trim()}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des packs */}
      <Card>
        <CardHeader>
          <CardTitle>Packs de connaissances</CardTitle>
          <CardDescription>
            Gérez vos bases de connaissances et leurs documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {knowledgePacks.map((pack) => (
              <div
                key={pack.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{pack.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {pack.description}
                    </div>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-xs text-muted-foreground">
                        {pack.documents} documents
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {pack.size}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Mis à jour {pack.lastUpdated.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Badge variant={pack.status === 'indexed' ? 'default' : 'secondary'}>
                    {pack.status === 'indexed' ? 'Indexé' : 'En cours'}
                  </Badge>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="sm">
                      <Search className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Agents liés */}
      <Card>
        <CardHeader>
          <CardTitle>Agents liés</CardTitle>
          <CardDescription>
            Agents qui utilisent ces packs de connaissances
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {knowledgePacks.map((pack) => (
              <div key={pack.id} className="p-4 border rounded-lg">
                <div className="font-medium mb-2">{pack.name}</div>
                <div className="flex flex-wrap gap-1">
                  {pack.agents.map((agent) => (
                    <Badge key={agent} variant="outline">
                      {agent}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
