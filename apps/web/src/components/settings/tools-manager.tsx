'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Switch } from '../ui/switch'
import { Badge } from '../ui/badge'
import { 
  Wrench, 
  Plus, 
  Trash2, 
  Edit, 
  Play, 
  Pause,
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Code,
  Database,
  Network,
  FileText,
  Globe,
  Shield,
  Zap
} from 'lucide-react'

interface Tool {
  id: string
  name: string
  description: string
  category: 'file' | 'web' | 'database' | 'system' | 'custom'
  status: 'enabled' | 'disabled' | 'error'
  version: string
  author: string
  permissions: {
    file_access: boolean
    network_access: boolean
    system_access: boolean
    database_access: boolean
  }
  config: Record<string, any>
  lastUsed?: Date
  usageCount: number
  isBuiltin: boolean
}

interface ToolCategory {
  name: string
  icon: React.ReactNode
  description: string
  tools: Tool[]
}

export function ToolsManager() {
  const [tools, setTools] = useState<Tool[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddingTool, setIsAddingTool] = useState(false)
  const [editingTool, setEditingTool] = useState<Tool | null>(null)
  const [newTool, setNewTool] = useState<Partial<Tool>>({})

  // Simulation des données
  useEffect(() => {
    const mockTools: Tool[] = [
      {
        id: 'file-reader',
        name: 'File Reader',
        description: 'Lecture et analyse de fichiers texte, PDF, et documents',
        category: 'file',
        status: 'enabled',
        version: '1.2.0',
        author: 'Elavira Team',
        permissions: {
          file_access: true,
          network_access: false,
          system_access: false,
          database_access: false
        },
        config: {
          max_file_size: '10MB',
          supported_formats: ['txt', 'pdf', 'docx', 'md']
        },
        lastUsed: new Date(),
        usageCount: 156,
        isBuiltin: true
      },
      {
        id: 'web-scraper',
        name: 'Web Scraper',
        description: 'Extraction d\'informations depuis des pages web',
        category: 'web',
        status: 'enabled',
        version: '1.0.5',
        author: 'Elavira Team',
        permissions: {
          file_access: false,
          network_access: true,
          system_access: false,
          database_access: false
        },
        config: {
          timeout: 30,
          max_depth: 2,
          user_agent: 'Elavira Bot'
        },
        lastUsed: new Date(Date.now() - 3600000),
        usageCount: 89,
        isBuiltin: true
      },
      {
        id: 'database-query',
        name: 'Database Query',
        description: 'Exécution de requêtes SQL sécurisées',
        category: 'database',
        status: 'enabled',
        version: '1.1.2',
        author: 'Elavira Team',
        permissions: {
          file_access: false,
          network_access: false,
          system_access: false,
          database_access: true
        },
        config: {
          max_rows: 1000,
          allowed_tables: ['users', 'products', 'orders'],
          read_only: true
        },
        lastUsed: new Date(Date.now() - 86400000),
        usageCount: 234,
        isBuiltin: true
      },
      {
        id: 'system-monitor',
        name: 'System Monitor',
        description: 'Surveillance des ressources système',
        category: 'system',
        status: 'enabled',
        version: '1.0.0',
        author: 'Elavira Team',
        permissions: {
          file_access: false,
          network_access: false,
          system_access: true,
          database_access: false
        },
        config: {
          metrics: ['cpu', 'memory', 'disk', 'network'],
          interval: 60
        },
        lastUsed: new Date(),
        usageCount: 45,
        isBuiltin: true
      },
      {
        id: 'custom-calculator',
        name: 'Custom Calculator',
        description: 'Calculatrice avancée avec fonctions mathématiques',
        category: 'custom',
        status: 'disabled',
        version: '0.9.1',
        author: 'User',
        permissions: {
          file_access: false,
          network_access: false,
          system_access: false,
          database_access: false
        },
        config: {
          precision: 10,
          functions: ['sin', 'cos', 'log', 'exp']
        },
        lastUsed: new Date(Date.now() - 172800000),
        usageCount: 12,
        isBuiltin: false
      }
    ]
    
    setTools(mockTools)
  }, [])

  const categories: ToolCategory[] = [
    {
      name: 'file',
      icon: <FileText className="h-4 w-4" />,
      description: 'Outils de manipulation de fichiers',
      tools: tools.filter(t => t.category === 'file')
    },
    {
      name: 'web',
      icon: <Globe className="h-4 w-4" />,
      description: 'Outils d\'accès web et réseau',
      tools: tools.filter(t => t.category === 'web')
    },
    {
      name: 'database',
      icon: <Database className="h-4 w-4" />,
      description: 'Outils de base de données',
      tools: tools.filter(t => t.category === 'database')
    },
    {
      name: 'system',
      icon: <Code className="h-4 w-4" />,
      description: 'Outils système et monitoring',
      tools: tools.filter(t => t.category === 'system')
    },
    {
      name: 'custom',
      icon: <Wrench className="h-4 w-4" />,
      description: 'Outils personnalisés',
      tools: tools.filter(t => t.category === 'custom')
    }
  ]

  const handleToggleTool = (toolId: string) => {
    setTools(prev => prev.map(tool => 
      tool.id === toolId 
        ? { ...tool, status: tool.status === 'enabled' ? 'disabled' : 'enabled' }
        : tool
    ))
  }

  const handleDeleteTool = (toolId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet outil ?')) {
      setTools(prev => prev.filter(tool => tool.id !== toolId))
    }
  }

  const handleSaveTool = () => {
    if (editingTool) {
      setTools(prev => prev.map(tool => 
        tool.id === editingTool.id ? { ...tool, ...newTool } : tool
      ))
      setEditingTool(null)
    } else {
      const tool: Tool = {
        id: newTool.id || `custom-${Date.now()}`,
        name: newTool.name || 'Nouvel outil',
        description: newTool.description || '',
        category: (newTool.category as any) || 'custom',
        status: 'disabled',
        version: '1.0.0',
        author: 'User',
        permissions: newTool.permissions || {
          file_access: false,
          network_access: false,
          system_access: false,
          database_access: false
        },
        config: newTool.config || {},
        usageCount: 0,
        isBuiltin: false
      }
      setTools(prev => [...prev, tool])
    }
    
    setNewTool({})
    setIsAddingTool(false)
  }

  const filteredTools = tools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'enabled': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'disabled': return <XCircle className="h-4 w-4 text-gray-500" />
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />
      default: return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getCategoryIcon = (category: string) => {
    const cat = categories.find(c => c.name === category)
    return cat ? cat.icon : <Wrench className="h-4 w-4" />
  }

  return (
    <div className="space-y-6">
      {/* Vue d'ensemble des catégories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wrench className="h-5 w-5" />
            <span>Catégories d&apos;outils</span>
          </CardTitle>
          <CardDescription>
                          Vue d&apos;ensemble des outils disponibles par catégorie
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {categories.map((category) => (
              <Card key={category.name} className="p-4 text-center">
                <div className="flex justify-center mb-2">
                  {category.icon}
                </div>
                <h3 className="font-semibold capitalize mb-1">
                  {category.name === 'file' ? 'Fichiers' :
                   category.name === 'web' ? 'Web' :
                   category.name === 'database' ? 'Base de données' :
                   category.name === 'system' ? 'Système' :
                   'Personnalisés'}
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {category.tools.length} outil{category.tools.length > 1 ? 's' : ''}
                </p>
                <Badge variant="outline" className="text-xs">
                  {category.tools.filter(t => t.status === 'enabled').length} actif{category.tools.filter(t => t.status === 'enabled').length > 1 ? 's' : ''}
                </Badge>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Gestion des outils */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestion des outils</CardTitle>
              <CardDescription>
                Activez, désactivez et configurez vos outils
              </CardDescription>
            </div>
            <Button onClick={() => setIsAddingTool(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un outil
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
                    {category.name === 'file' ? 'Fichiers' :
                     category.name === 'web' ? 'Web' :
                     category.name === 'database' ? 'Base de données' :
                     category.name === 'system' ? 'Système' :
                     'Personnalisés'}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex-1">
              <Label htmlFor="search">Rechercher</Label>
              <Input
                id="search"
                placeholder="Nom ou description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {/* Liste des outils */}
          <div className="space-y-3">
            {filteredTools.map((tool) => (
              <Card key={tool.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {getStatusIcon(tool.status)}
                      <h4 className="font-semibold">{tool.name}</h4>
                      <Badge variant="outline">{tool.version}</Badge>
                      {tool.isBuiltin && (
                        <Badge variant="secondary">Intégré</Badge>
                      )}
                      <div className="flex items-center space-x-1">
                        {getCategoryIcon(tool.category)}
                        <span className="text-sm text-muted-foreground capitalize">
                          {tool.category === 'file' ? 'Fichiers' :
                           tool.category === 'web' ? 'Web' :
                           tool.category === 'database' ? 'Base de données' :
                           tool.category === 'system' ? 'Système' :
                           'Personnalisé'}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">
                      {tool.description}
                    </p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground mb-3">
                      <div>
                        <span className="font-medium">Auteur:</span> {tool.author}
                      </div>
                      <div>
                        <span className="font-medium">Utilisations:</span> {tool.usageCount}
                      </div>
                      {tool.lastUsed && (
                        <div>
                          <span className="font-medium">Dernière utilisation:</span>
                          <br />
                          {tool.lastUsed.toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    
                    {/* Permissions */}
                    <div className="flex space-x-4 mb-3">
                      <span className={`flex items-center space-x-1 text-xs ${tool.permissions.file_access ? 'text-green-600' : 'text-gray-400'}`}>
                        <FileText className="h-3 w-3" />
                        <span>Fichiers</span>
                      </span>
                      <span className={`flex items-center space-x-1 text-xs ${tool.permissions.network_access ? 'text-green-600' : 'text-gray-400'}`}>
                        <Network className="h-3 w-3" />
                        <span>Réseau</span>
                      </span>
                      <span className={`flex items-center space-x-1 text-xs ${tool.permissions.system_access ? 'text-green-600' : 'text-gray-400'}`}>
                        <Code className="h-3 w-3" />
                        <span>Système</span>
                      </span>
                      <span className={`flex items-center space-x-1 text-xs ${tool.permissions.database_access ? 'text-green-600' : 'text-gray-400'}`}>
                        <Database className="h-3 w-3" />
                        <span>Base</span>
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2 ml-4">
                    <Switch
                      checked={tool.status === 'enabled'}
                      onCheckedChange={() => handleToggleTool(tool.id)}
                    />
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingTool(tool)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Config
                    </Button>
                    
                    {!tool.isBuiltin && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteTool(tool.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Supprimer
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modal d'ajout/édition d'outil */}
      {(isAddingTool || editingTool) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {editingTool ? 'Modifier l\'outil' : 'Ajouter un nouvel outil'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="tool-name">Nom</Label>
                <Input
                  id="tool-name"
                  value={newTool.name || editingTool?.name || ''}
                  onChange={(e) => setNewTool({ ...newTool, name: e.target.value })}
                  placeholder="Nom de l'outil"
                />
              </div>
              
              <div>
                <Label htmlFor="tool-description">Description</Label>
                <Textarea
                  id="tool-description"
                  value={newTool.description || editingTool?.description || ''}
                  onChange={(e) => setNewTool({ ...newTool, description: e.target.value })}
                  placeholder="Description de l'outil"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="tool-category">Catégorie</Label>
                <select
                  id="tool-category"
                  value={newTool.category || editingTool?.category || 'custom'}
                  onChange={(e) => setNewTool({ ...newTool, category: e.target.value as any })}
                  className="w-full mt-1 p-2 border rounded-md"
                >
                  {categories.map(category => (
                    <option key={category.name} value={category.name}>
                      {category.name === 'file' ? 'Fichiers' :
                       category.name === 'web' ? 'Web' :
                       category.name === 'database' ? 'Base de données' :
                       category.name === 'system' ? 'Système' :
                       'Personnalisés'}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label>Permissions</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={newTool.permissions?.file_access || editingTool?.permissions.file_access || false}
                      onCheckedChange={(checked) => setNewTool({
                        ...newTool,
                        permissions: { 
                          file_access: checked,
                          network_access: newTool.permissions?.network_access ?? false,
                          system_access: newTool.permissions?.system_access ?? false,
                          database_access: newTool.permissions?.database_access ?? false
                        }
                      })}
                    />
                    <Label>Accès aux fichiers</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={newTool.permissions?.network_access || editingTool?.permissions.network_access || false}
                      onCheckedChange={(checked) => setNewTool({
                        ...newTool,
                        permissions: { 
                          file_access: newTool.permissions?.file_access ?? false,
                          network_access: checked,
                          system_access: newTool.permissions?.system_access ?? false,
                          database_access: newTool.permissions?.database_access ?? false
                        }
                      })}
                    />
                    <Label>Accès réseau</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={newTool.permissions?.system_access || editingTool?.permissions.system_access || false}
                      onCheckedChange={(checked) => setNewTool({
                        ...newTool,
                        permissions: { 
                          file_access: newTool.permissions?.file_access ?? false,
                          network_access: newTool.permissions?.network_access ?? false,
                          system_access: checked,
                          database_access: newTool.permissions?.database_access ?? false
                        }
                      })}
                    />
                    <Label>Accès système</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={newTool.permissions?.database_access || editingTool?.permissions.database_access || false}
                      onCheckedChange={(checked) => setNewTool({
                        ...newTool,
                        permissions: { 
                          file_access: newTool.permissions?.file_access ?? false,
                          network_access: newTool.permissions?.network_access ?? false,
                          system_access: newTool.permissions?.system_access ?? false,
                          database_access: checked
                        }
                      })}
                    />
                    <Label>Accès base de données</Label>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2 pt-4">
                <Button onClick={handleSaveTool} className="flex-1">
                  {editingTool ? 'Modifier' : 'Ajouter'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsAddingTool(false)
                    setEditingTool(null)
                    setNewTool({})
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

      {/* Statistiques d'utilisation */}
      <Card>
        <CardHeader>
                      <CardTitle>Statistiques d&apos;utilisation</CardTitle>
            <CardDescription>
              Vue d&apos;ensemble de l&apos;utilisation des outils
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {tools.length}
              </div>
              <div className="text-sm text-muted-foreground">Outils installés</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {tools.filter(t => t.status === 'enabled').length}
              </div>
              <div className="text-sm text-muted-foreground">Outils actifs</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {tools.filter(t => !t.isBuiltin).length}
              </div>
              <div className="text-sm text-muted-foreground">Outils personnalisés</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {tools.reduce((acc, t) => acc + t.usageCount, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Utilisations totales</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
