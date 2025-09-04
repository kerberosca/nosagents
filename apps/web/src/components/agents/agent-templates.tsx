'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Badge } from '../ui/badge'
import { 
  Bot, 
  Plus, 
  Copy, 
  Edit, 
  Trash2, 
  Download, 
  Upload,
  BookOpen,
  MessageSquare,
  Code,
  Database,
  FileText,
  Globe,
  Settings,
  Zap,
  Star
} from 'lucide-react'

interface AgentTemplate {
  id: string
  name: string
  description: string
  category: 'assistant' | 'specialist' | 'automation' | 'analysis' | 'custom'
  model: string
  systemPrompt: string
  tools: string[]
  knowledgePacks: string[]
  permissions: {
    file_access: boolean
    network_access: boolean
    system_access: boolean
    database_access: boolean
  }
  examples: string[]
  tags: string[]
  usageCount: number
  rating: number
  isBuiltin: boolean
  createdAt: Date
  updatedAt: Date
}

interface TemplateCategory {
  name: string
  icon: React.ReactNode
  description: string
  templates: AgentTemplate[]
}

export function AgentTemplates() {
  const [templates, setTemplates] = useState<AgentTemplate[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddingTemplate, setIsAddingTemplate] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<AgentTemplate | null>(null)
  const [newTemplate, setNewTemplate] = useState<Partial<AgentTemplate>>({})

  // Simulation des données
  useEffect(() => {
    const mockTemplates: AgentTemplate[] = [
      {
        id: 'template-assistant-general',
        name: 'Assistant Général',
        description: 'Assistant polyvalent pour des tâches générales et conversations',
        category: 'assistant',
        model: 'llama3.1:8b',
        systemPrompt: 'Tu es un assistant IA utile, honnête et concis. Tu aides les utilisateurs avec leurs questions et tâches.',
        tools: ['file-reader', 'web-scraper', 'database-query'],
        knowledgePacks: ['general-knowledge', 'faq'],
        permissions: {
          file_access: true,
          network_access: false,
          system_access: false,
          database_access: true
        },
        examples: [
          'Explique-moi un concept',
          'Aide-moi à organiser mes idées',
          'Résume ce document'
        ],
        tags: ['général', 'conversation', 'aide'],
        usageCount: 1250,
        rating: 4.8,
        isBuiltin: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date()
      },
      {
        id: 'template-chef-cuisinier',
        name: 'Chef Cuisinier',
        description: 'Spécialiste culinaire pour recettes, techniques et conseils gastronomiques',
        category: 'specialist',
        model: 'qwen2.5:7b',
        systemPrompt: 'Tu es un chef cuisinier expérimenté. Tu aides avec les recettes, techniques culinaires, substitutions d\'ingrédients et conseils gastronomiques.',
        tools: ['file-reader', 'web-scraper'],
        knowledgePacks: ['culinary-arts', 'recipes', 'ingredients'],
        permissions: {
          file_access: true,
          network_access: true,
          system_access: false,
          database_access: false
        },
        examples: [
          'Donne-moi une recette de ratatouille',
          'Comment remplacer les œufs dans une recette ?',
          'Explique la technique du braisage'
        ],
        tags: ['cuisine', 'recettes', 'gastronomie'],
        usageCount: 890,
        rating: 4.9,
        isBuiltin: true,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date()
      },
      {
        id: 'template-prof-enseignant',
        name: 'Professeur Enseignant',
        description: 'Assistant pédagogique pour l\'explication et l\'apprentissage',
        category: 'specialist',
        model: 'llama3.1:8b',
        systemPrompt: 'Tu es un professeur patient et pédagogue. Tu expliques les concepts de manière claire, adapte ton niveau à celui de l\'élève et donnes des exemples concrets.',
        tools: ['file-reader', 'web-scraper', 'database-query'],
        knowledgePacks: ['educational-content', 'curriculum'],
        permissions: {
          file_access: true,
          network_access: true,
          system_access: false,
          database_access: true
        },
        examples: [
          'Explique-moi la photosynthèse',
          'Aide-moi à résoudre cette équation',
          'Donne-moi des exercices de grammaire'
        ],
        tags: ['éducation', 'enseignement', 'apprentissage'],
        usageCount: 756,
        rating: 4.7,
        isBuiltin: true,
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date()
      },
      {
        id: 'template-data-analyzer',
        name: 'Analyseur de Données',
        description: 'Spécialiste en analyse et visualisation de données',
        category: 'analysis',
        model: 'qwen2.5:7b',
        systemPrompt: 'Tu es un expert en analyse de données. Tu aides à interpréter les données, créer des visualisations et tirer des insights pertinents.',
        tools: ['file-reader', 'database-query', 'system-monitor'],
        knowledgePacks: ['data-science', 'statistics', 'visualization'],
        permissions: {
          file_access: true,
          network_access: false,
          system_access: true,
          database_access: true
        },
        examples: [
          'Analyse ce dataset',
          'Crée un graphique pour ces données',
          'Trouve des corrélations dans ces chiffres'
        ],
        tags: ['données', 'analyse', 'statistiques'],
        usageCount: 432,
        rating: 4.6,
        isBuiltin: true,
        createdAt: new Date('2024-02-15'),
        updatedAt: new Date()
      },
      {
        id: 'template-workflow-automation',
        name: 'Automatisation de Workflows',
        description: 'Agent spécialisé dans l\'automatisation et l\'orchestration de tâches',
        category: 'automation',
        model: 'llama3.1:8b',
        systemPrompt: 'Tu es un expert en automatisation. Tu aides à concevoir, optimiser et exécuter des workflows automatisés.',
        tools: ['system-monitor', 'database-query', 'file-reader'],
        knowledgePacks: ['workflow-design', 'automation-patterns'],
        permissions: {
          file_access: true,
          network_access: false,
          system_access: true,
          database_access: true
        },
        examples: [
          'Conçois un workflow pour traiter des emails',
          'Optimise ce processus d\'entreprise',
          'Automatise cette tâche répétitive'
        ],
        tags: ['automatisation', 'workflows', 'optimisation'],
        usageCount: 298,
        rating: 4.5,
        isBuiltin: true,
        createdAt: new Date('2024-03-01'),
        updatedAt: new Date()
      }
    ]
    
    setTemplates(mockTemplates)
  }, [])

  const categories: TemplateCategory[] = [
    {
      name: 'assistant',
      icon: <MessageSquare className="h-4 w-4" />,
      description: 'Assistants polyvalents et généralistes',
      templates: templates.filter(t => t.category === 'assistant')
    },
    {
      name: 'specialist',
      icon: <BookOpen className="h-4 w-4" />,
      description: 'Spécialistes dans des domaines spécifiques',
      templates: templates.filter(t => t.category === 'specialist')
    },
    {
      name: 'analysis',
      icon: <Code className="h-4 w-4" />,
      description: 'Agents d\'analyse et de traitement',
      templates: templates.filter(t => t.category === 'analysis')
    },
    {
      name: 'automation',
      icon: <Zap className="h-4 w-4" />,
      description: 'Agents d\'automatisation et d\'orchestration',
      templates: templates.filter(t => t.category === 'automation')
    },
    {
      name: 'custom',
      icon: <Settings className="h-4 w-4" />,
      description: 'Templates personnalisés',
      templates: templates.filter(t => t.category === 'custom')
    }
  ]

  const handleCreateFromTemplate = (template: AgentTemplate) => {
    // Logique pour créer un agent à partir du template
    console.log('Création d\'agent depuis le template:', template.name)
  }

  const handleEditTemplate = (template: AgentTemplate) => {
    setEditingTemplate(template)
    setNewTemplate(template)
  }

  const handleSaveTemplate = () => {
    if (editingTemplate) {
      setTemplates(prev => prev.map(template => 
        template.id === editingTemplate.id ? { ...template, ...newTemplate } : template
      ))
      setEditingTemplate(null)
    } else {
      const template: AgentTemplate = {
        id: newTemplate.id || `template-${Date.now()}`,
        name: newTemplate.name || 'Nouveau template',
        description: newTemplate.description || '',
        category: (newTemplate.category as any) || 'custom',
        model: newTemplate.model || 'llama3.1:8b',
        systemPrompt: newTemplate.systemPrompt || '',
        tools: newTemplate.tools || [],
        knowledgePacks: newTemplate.knowledgePacks || [],
        permissions: newTemplate.permissions || {
          file_access: false,
          network_access: false,
          system_access: false,
          database_access: false
        },
        examples: newTemplate.examples || [],
        tags: newTemplate.tags || [],
        usageCount: 0,
        rating: 0,
        isBuiltin: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      setTemplates(prev => [...prev, template])
    }
    
    setNewTemplate({})
    setIsAddingTemplate(false)
  }

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const getCategoryIcon = (category: string) => {
    const cat = categories.find(c => c.name === category)
    return cat ? cat.icon : <Settings className="h-4 w-4" />
  }

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'assistant': return 'Assistant'
      case 'specialist': return 'Spécialiste'
      case 'analysis': return 'Analyse'
      case 'automation': return 'Automatisation'
      case 'custom': return 'Personnalisé'
      default: return category
    }
  }

  return (
    <div className="space-y-6">
      {/* Vue d'ensemble des catégories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bot className="h-5 w-5" />
            <span>Catégories de templates</span>
          </CardTitle>
          <CardDescription>
            Vue d&apos;ensemble des templates d&apos;agents disponibles par catégorie
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {categories.map((category) => (
              <Card key={category.name} className="p-4 text-center">
                <div className="flex justify-center mb-2">
                  {category.icon}
                </div>
                <h3 className="font-semibold mb-1">
                  {getCategoryName(category.name)}
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {category.templates.length} template{category.templates.length > 1 ? 's' : ''}
                </p>
                <Badge variant="outline" className="text-xs">
                  {category.templates.filter(t => t.isBuiltin).length} intégré{category.templates.filter(t => t.isBuiltin).length > 1 ? 's' : ''}
                </Badge>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Gestion des templates */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Templates d&apos;agents</CardTitle>
              <CardDescription>
                Parcourez et utilisez les templates prédéfinis ou créez les vôtres
              </CardDescription>
            </div>
            <Button onClick={() => setIsAddingTemplate(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtres */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="category-filter">Catégorie</Label>
              <select
                id="category-filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full mt-1 p-2 border rounded-md"
              >
                <option value="all">Toutes les catégories</option>
                {categories.map(category => (
                  <option key={category.name} value={category.name}>
                    {getCategoryName(category.name)}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex-1">
              <Label htmlFor="search">Rechercher</Label>
              <Input
                id="search"
                placeholder="Nom, description ou tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {/* Liste des templates */}
          <div className="space-y-4">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="flex items-center space-x-1">
                        {getCategoryIcon(template.category)}
                        <span className="text-sm text-muted-foreground capitalize">
                          {getCategoryName(template.category)}
                        </span>
                      </div>
                      {template.isBuiltin && (
                        <Badge variant="secondary">Intégré</Badge>
                      )}
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3 text-yellow-500" />
                        <span className="text-sm">{template.rating.toFixed(1)}</span>
                      </div>
                    </div>
                    
                    <h4 className="font-semibold text-lg mb-2">{template.name}</h4>
                    
                    <p className="text-muted-foreground mb-3">
                      {template.description}
                    </p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground mb-3">
                      <div>
                        <span className="font-medium">Modèle:</span> {template.model}
                      </div>
                      <div>
                        <span className="font-medium">Utilisations:</span> {template.usageCount}
                      </div>
                      <div>
                        <span className="font-medium">Outils:</span> {template.tools.length}
                      </div>
                      <div>
                        <span className="font-medium">Packs:</span> {template.knowledgePacks.length}
                      </div>
                    </div>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {template.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    
                    {/* Exemples */}
                    <div className="space-y-1">
                      <span className="text-sm font-medium">Exemples d&apos;utilisation:</span>
                      <div className="text-xs text-muted-foreground">
                        {template.examples.map((example, index) => (
                          <div key={index}>• {example}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2 ml-4">
                    <Button
                      size="sm"
                      onClick={() => handleCreateFromTemplate(template)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Utiliser
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditTemplate(template)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Modifier
                    </Button>
                    
                    <Button size="sm" variant="outline">
                      <Copy className="h-3 w-3 mr-1" />
                      Copier
                    </Button>
                    
                    <Button size="sm" variant="outline">
                      <Download className="h-3 w-3 mr-1" />
                      Exporter
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modal d'ajout/édition de template */}
      {(isAddingTemplate || editingTemplate) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {editingTemplate ? 'Modifier le template' : 'Nouveau template d&apos;agent'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="template-name">Nom</Label>
                  <Input
                    id="template-name"
                    value={newTemplate.name || editingTemplate?.name || ''}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    placeholder="Nom du template"
                  />
                </div>
                
                <div>
                  <Label htmlFor="template-category">Catégorie</Label>
                  <select
                    id="template-category"
                    value={newTemplate.category || editingTemplate?.category || 'custom'}
                    onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value as any })}
                    className="w-full mt-1 p-2 border rounded-md"
                  >
                    {categories.map(category => (
                      <option key={category.name} value={category.name}>
                        {getCategoryName(category.name)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="template-description">Description</Label>
                <Textarea
                  id="template-description"
                  value={newTemplate.description || editingTemplate?.description || ''}
                  onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                  placeholder="Description du template"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="template-model">Modèle IA</Label>
                <Input
                  id="template-model"
                  value={newTemplate.model || editingTemplate?.model || ''}
                  onChange={(e) => setNewTemplate({ ...newTemplate, model: e.target.value })}
                  placeholder="llama3.1:8b"
                />
              </div>
              
              <div>
                <Label htmlFor="template-prompt">Prompt système</Label>
                <Textarea
                  id="template-prompt"
                  value={newTemplate.systemPrompt || editingTemplate?.systemPrompt || ''}
                  onChange={(e) => setNewTemplate({ ...newTemplate, systemPrompt: e.target.value })}
                  placeholder="Instructions système pour l'agent..."
                  rows={5}
                />
              </div>
              
              <div>
                <Label>Permissions</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newTemplate.permissions?.file_access || editingTemplate?.permissions.file_access || false}
                      onChange={(e) => setNewTemplate({
                        ...newTemplate,
                        permissions: { 
                          file_access: e.target.checked,
                          network_access: newTemplate.permissions?.network_access ?? false,
                          system_access: newTemplate.permissions?.system_access ?? false,
                          database_access: newTemplate.permissions?.database_access ?? false
                        }
                      })}
                    />
                    <Label>Accès aux fichiers</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newTemplate.permissions?.network_access || editingTemplate?.permissions.network_access || false}
                      onChange={(e) => setNewTemplate({
                        ...newTemplate,
                        permissions: { 
                          file_access: newTemplate.permissions?.file_access ?? false,
                          network_access: e.target.checked,
                          system_access: newTemplate.permissions?.system_access ?? false,
                          database_access: newTemplate.permissions?.database_access ?? false
                        }
                      })}
                    />
                    <Label>Accès réseau</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newTemplate.permissions?.system_access || editingTemplate?.permissions.system_access || false}
                      onChange={(e) => setNewTemplate({
                        ...newTemplate,
                        permissions: { 
                          file_access: newTemplate.permissions?.file_access ?? false,
                          network_access: newTemplate.permissions?.network_access ?? false,
                          system_access: e.target.checked,
                          database_access: newTemplate.permissions?.database_access ?? false
                        }
                      })}
                    />
                    <Label>Accès système</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newTemplate.permissions?.database_access || editingTemplate?.permissions.database_access || false}
                      onChange={(e) => setNewTemplate({
                        ...newTemplate,
                        permissions: { 
                          file_access: newTemplate.permissions?.file_access ?? false,
                          network_access: newTemplate.permissions?.network_access ?? false,
                          system_access: newTemplate.permissions?.system_access ?? false,
                          database_access: e.target.checked
                        }
                      })}
                    />
                    <Label>Accès base de données</Label>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2 pt-4">
                <Button onClick={handleSaveTemplate} className="flex-1">
                  {editingTemplate ? 'Modifier' : 'Créer'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsAddingTemplate(false)
                    setEditingTemplate(null)
                    setNewTemplate({})
                  }}
                  className="flex-1"
                >
                  Annuler
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
