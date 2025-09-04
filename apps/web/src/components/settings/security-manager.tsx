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
  Shield, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Settings,
  User,
  Users,
  Globe,
  HardDrive,
  Network,
  Database,
  FileText,
  Zap,
  RefreshCw
} from 'lucide-react'

interface SecurityPolicy {
  id: string
  name: string
  description: string
  type: 'network' | 'file' | 'system' | 'agent' | 'user'
  status: 'enabled' | 'disabled' | 'warning'
  priority: 'low' | 'medium' | 'high' | 'critical'
  rules: SecurityRule[]
  lastModified: Date
  createdBy: string
}

interface SecurityRule {
  id: string
  action: 'allow' | 'deny' | 'log'
  resource: string
  conditions: {
    user?: string
    agent?: string
    time?: string
    ip?: string
    method?: string
  }
  description: string
}

interface AgentPermission {
  agentId: string
  agentName: string
  permissions: {
    file_access: boolean
    network_access: boolean
    system_access: boolean
    database_access: boolean
    tool_execution: boolean
  }
  restrictions: {
    max_file_size: number
    allowed_domains: string[]
    blocked_ips: string[]
    rate_limit: number
  }
  lastUpdated: Date
}

interface SecurityEvent {
  id: string
  timestamp: Date
  level: 'info' | 'warning' | 'error' | 'critical'
  category: 'access' | 'permission' | 'network' | 'file' | 'system'
  description: string
  source: string
  user?: string
  agent?: string
  ip?: string
  resolved: boolean
}

export function SecurityManager() {
  const [policies, setPolicies] = useState<SecurityPolicy[]>([])
  const [agentPermissions, setAgentPermissions] = useState<AgentPermission[]>([])
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([])
  const [selectedPolicy, setSelectedPolicy] = useState<string>('all')
  const [isAddingPolicy, setIsAddingPolicy] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<SecurityPolicy | null>(null)
  const [newPolicy, setNewPolicy] = useState<Partial<SecurityPolicy>>({})

  // Simulation des données
  useEffect(() => {
    const mockPolicies: SecurityPolicy[] = [
      {
        id: 'network-isolation',
        name: 'Isolation réseau',
        description: 'Empêche l\'accès réseau sortant par défaut',
        type: 'network',
        status: 'enabled',
        priority: 'high',
        rules: [
          {
            id: 'block-all-outbound',
            action: 'deny',
            resource: 'outbound-network',
            conditions: {},
            description: 'Bloque tout trafic sortant'
          },
          {
            id: 'allow-local',
            action: 'allow',
            resource: 'localhost',
            conditions: {},
            description: 'Autorise l\'accès localhost'
          }
        ],
        lastModified: new Date(),
        createdBy: 'System'
      },
      {
        id: 'file-access-control',
        name: 'Contrôle d\'accès aux fichiers',
        description: 'Limite l\'accès aux fichiers système sensibles',
        type: 'file',
        status: 'enabled',
        priority: 'critical',
        rules: [
          {
            id: 'block-system-files',
            action: 'deny',
            resource: '/system/*',
            conditions: {},
            description: 'Bloque l\'accès aux fichiers système'
          },
          {
            id: 'allow-user-files',
            action: 'allow',
            resource: '/data/knowledge/*',
            conditions: {},
            description: 'Autorise l\'accès aux fichiers de connaissances'
          }
        ],
        lastModified: new Date(Date.now() - 86400000),
        createdBy: 'Admin'
      },
      {
        id: 'agent-sandbox',
        name: 'Sandbox des agents',
        description: 'Isole l\'exécution des agents dans un environnement sécurisé',
        type: 'agent',
        status: 'enabled',
        priority: 'high',
        rules: [
          {
            id: 'restrict-system-calls',
            action: 'deny',
            resource: 'system-calls',
            conditions: {},
            description: 'Bloque les appels système directs'
          }
        ],
        lastModified: new Date(Date.now() - 172800000),
        createdBy: 'System'
      }
    ]

    const mockAgentPermissions: AgentPermission[] = [
      {
        agentId: 'assistant-general',
        agentName: 'Assistant Général',
        permissions: {
          file_access: true,
          network_access: false,
          system_access: false,
          database_access: true,
          tool_execution: true
        },
        restrictions: {
          max_file_size: 10 * 1024 * 1024, // 10MB
          allowed_domains: [],
          blocked_ips: [],
          rate_limit: 100
        },
        lastUpdated: new Date()
      },
      {
        agentId: 'web-researcher',
        agentName: 'Chercheur Web',
        permissions: {
          file_access: false,
          network_access: true,
          system_access: false,
          database_access: false,
          tool_execution: true
        },
        restrictions: {
          max_file_size: 0,
          allowed_domains: ['wikipedia.org', 'github.com', 'stackoverflow.com'],
          blocked_ips: ['192.168.1.100'],
          rate_limit: 50
        },
        lastUpdated: new Date(Date.now() - 3600000)
      }
    ]

    const mockSecurityEvents: SecurityEvent[] = [
      {
        id: 'evt-001',
        timestamp: new Date(),
        level: 'warning',
        category: 'access',
        description: 'Tentative d\'accès à un fichier système bloquée',
        source: 'agent:assistant-general',
        agent: 'assistant-general',
        ip: '127.0.0.1',
        resolved: false
      },
      {
        id: 'evt-002',
        timestamp: new Date(Date.now() - 1800000),
        level: 'info',
        category: 'permission',
        description: 'Modification des permissions d\'un agent',
        source: 'user:admin',
        user: 'admin',
        ip: '192.168.1.50',
        resolved: true
      },
      {
        id: 'evt-003',
        timestamp: new Date(Date.now() - 3600000),
        level: 'error',
        category: 'network',
        description: 'Tentative de connexion réseau non autorisée',
        source: 'agent:web-researcher',
        agent: 'web-researcher',
        ip: '127.0.0.1',
        resolved: false
      }
    ]

    setPolicies(mockPolicies)
    setAgentPermissions(mockAgentPermissions)
    setSecurityEvents(mockSecurityEvents)
  }, [])

  const handleTogglePolicy = (policyId: string) => {
    setPolicies(prev => prev.map(policy => 
      policy.id === policyId 
        ? { ...policy, status: policy.status === 'enabled' ? 'disabled' : 'enabled' }
        : policy
    ))
  }

  const handleSavePolicy = () => {
    if (editingPolicy) {
      setPolicies(prev => prev.map(policy => 
        policy.id === editingPolicy.id ? { ...policy, ...newPolicy } : policy
      ))
      setEditingPolicy(null)
    } else {
      const policy: SecurityPolicy = {
        id: newPolicy.id || `policy-${Date.now()}`,
        name: newPolicy.name || 'Nouvelle politique',
        description: newPolicy.description || '',
        type: (newPolicy.type as any) || 'network',
        status: 'disabled',
        priority: (newPolicy.priority as any) || 'medium',
        rules: newPolicy.rules || [],
        lastModified: new Date(),
        createdBy: 'User'
      }
      setPolicies(prev => [...prev, policy])
    }
    
    setNewPolicy({})
    setIsAddingPolicy(false)
  }

  const handleUpdateAgentPermission = (agentId: string, permission: string, value: boolean) => {
    setAgentPermissions(prev => prev.map(agent => 
      agent.agentId === agentId 
        ? {
            ...agent,
            permissions: { ...agent.permissions, [permission]: value }
          }
        : agent
    ))
  }

  const handleResolveEvent = (eventId: string) => {
    setSecurityEvents(prev => prev.map(event => 
      event.id === eventId ? { ...event, resolved: true } : event
    ))
  }

  const filteredPolicies = policies.filter(policy => 
    selectedPolicy === 'all' || policy.type === selectedPolicy
  )

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'enabled': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'disabled': return <XCircle className="h-4 w-4 text-gray-500" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default: return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getPriorityBadge = (priority: string) => {
    const variants = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    }
    return variants[priority as keyof typeof variants] || variants.medium
  }

  const getEventLevelIcon = (level: string) => {
    switch (level) {
      case 'info': return <CheckCircle className="h-4 w-4 text-blue-500" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />
      default: return <CheckCircle className="h-4 w-4 text-blue-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Vue d'ensemble de la sécurité */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>État de la sécurité</span>
          </CardTitle>
          <CardDescription>
                          Vue d&apos;ensemble de la sécurité du système
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {policies.filter(p => p.status === 'enabled').length}
              </div>
              <div className="text-sm text-muted-foreground">Politiques actives</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {agentPermissions.length}
              </div>
              <div className="text-sm text-muted-foreground">Agents configurés</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {securityEvents.filter(e => !e.resolved).length}
              </div>
              <div className="text-sm text-muted-foreground">Événements non résolus</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {policies.filter(p => p.priority === 'critical').length}
              </div>
              <div className="text-sm text-muted-foreground">Politiques critiques</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Politiques de sécurité */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Politiques de sécurité</CardTitle>
              <CardDescription>
                Gérez les règles de sécurité du système
              </CardDescription>
            </div>
            <Button onClick={() => setIsAddingPolicy(true)}>
              <Shield className="h-4 w-4 mr-2" />
              Nouvelle politique
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtres */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="policy-filter">Type de politique</Label>
              <select
                id="policy-filter"
                value={selectedPolicy}
                onChange={(e) => setSelectedPolicy(e.target.value)}
                className="w-full mt-1 p-2 border rounded-md"
              >
                <option value="all">Tous les types</option>
                <option value="network">Réseau</option>
                <option value="file">Fichiers</option>
                <option value="system">Système</option>
                <option value="agent">Agents</option>
                <option value="user">Utilisateurs</option>
              </select>
            </div>
          </div>

          {/* Liste des politiques */}
          <div className="space-y-3">
            {filteredPolicies.map((policy) => (
              <Card key={policy.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {getStatusIcon(policy.status)}
                      <h4 className="font-semibold">{policy.name}</h4>
                      <Badge className={getPriorityBadge(policy.priority)}>
                        {policy.priority}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {policy.type}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">
                      {policy.description}
                    </p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground mb-3">
                      <div>
                        <span className="font-medium">Créé par:</span> {policy.createdBy}
                      </div>
                      <div>
                        <span className="font-medium">Modifié:</span> {policy.lastModified.toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium">Règles:</span> {policy.rules.length}
                      </div>
                    </div>
                    
                    {/* Règles */}
                    <div className="space-y-2">
                      <h5 className="font-medium text-sm">Règles:</h5>
                      {policy.rules.map(rule => (
                        <div key={rule.id} className="flex items-center space-x-2 text-xs bg-gray-50 p-2 rounded">
                          <Badge variant={rule.action === 'allow' ? 'default' : 'destructive'}>
                            {rule.action}
                          </Badge>
                          <span className="font-medium">{rule.resource}</span>
                          <span className="text-muted-foreground">{rule.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2 ml-4">
                    <Switch
                      checked={policy.status === 'enabled'}
                      onCheckedChange={() => handleTogglePolicy(policy.id)}
                    />
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingPolicy(policy)}
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      Config
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Permissions des agents */}
      <Card>
        <CardHeader>
          <CardTitle>Permissions des agents</CardTitle>
          <CardDescription>
            Configurez les permissions et restrictions des agents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {agentPermissions.map((agent) => (
              <Card key={agent.agentId} className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold">{agent.agentName}</h4>
                  <Badge variant="outline">
                    Modifié: {agent.lastUpdated.toLocaleDateString()}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Permissions */}
                  <div>
                    <h5 className="font-medium mb-3">Permissions</h5>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Accès aux fichiers</span>
                        <Switch
                          checked={agent.permissions.file_access}
                          onCheckedChange={(checked) => handleUpdateAgentPermission(agent.agentId, 'file_access', checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Accès réseau</span>
                        <Switch
                          checked={agent.permissions.network_access}
                          onCheckedChange={(checked) => handleUpdateAgentPermission(agent.agentId, 'network_access', checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Accès système</span>
                        <Switch
                          checked={agent.permissions.system_access}
                          onCheckedChange={(checked) => handleUpdateAgentPermission(agent.agentId, 'system_access', checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Accès base de données</span>
                        <Switch
                          checked={agent.permissions.database_access}
                          onCheckedChange={(checked) => handleUpdateAgentPermission(agent.agentId, 'database_access', checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Exécution d&apos;outils</span>
                        <Switch
                          checked={agent.permissions.tool_execution}
                          onCheckedChange={(checked) => handleUpdateAgentPermission(agent.agentId, 'tool_execution', checked)}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Restrictions */}
                  <div>
                    <h5 className="font-medium mb-3">Restrictions</h5>
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="font-medium">Taille max fichier:</span> {agent.restrictions.max_file_size / (1024 * 1024)} MB
                      </div>
                      
                      <div>
                        <span className="font-medium">Domaines autorisés:</span>
                        {agent.restrictions.allowed_domains.length > 0 ? (
                          <div className="mt-1 space-y-1">
                            {agent.restrictions.allowed_domains.map(domain => (
                              <Badge key={domain} variant="outline" className="text-xs mr-1">
                                {domain}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground ml-2">Aucun</span>
                        )}
                      </div>
                      
                      <div>
                        <span className="font-medium">IPs bloquées:</span>
                        {agent.restrictions.blocked_ips.length > 0 ? (
                          <div className="mt-1 space-y-1">
                            {agent.restrictions.blocked_ips.map(ip => (
                              <Badge key={ip} variant="destructive" className="text-xs mr-1">
                                {ip}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground ml-2">Aucune</span>
                        )}
                      </div>
                      
                      <div>
                        <span className="font-medium">Limite de taux:</span> {agent.restrictions.rate_limit}/min
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Événements de sécurité */}
      <Card>
        <CardHeader>
          <CardTitle>Événements de sécurité</CardTitle>
          <CardDescription>
            Surveillez les événements de sécurité en temps réel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {securityEvents.map((event) => (
              <Card key={event.id} className={`p-4 ${event.resolved ? 'opacity-60' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {getEventLevelIcon(event.level)}
                      <h4 className="font-semibold">{event.description}</h4>
                      <Badge variant={event.resolved ? 'secondary' : 'default'}>
                        {event.resolved ? 'Résolu' : 'Non résolu'}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {event.category}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">Source:</span> {event.source}
                      </div>
                      {event.user && (
                        <div>
                          <span className="font-medium">Utilisateur:</span> {event.user}
                        </div>
                      )}
                      {event.agent && (
                        <div>
                          <span className="font-medium">Agent:</span> {event.agent}
                        </div>
                      )}
                      {event.ip && (
                        <div>
                          <span className="font-medium">IP:</span> {event.ip}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Heure:</span> {event.timestamp.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  {!event.resolved && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResolveEvent(event.id)}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Résoudre
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modal d'ajout/édition de politique */}
      {(isAddingPolicy || editingPolicy) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {editingPolicy ? 'Modifier la politique' : 'Nouvelle politique de sécurité'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="policy-name">Nom</Label>
                <Input
                  id="policy-name"
                  value={newPolicy.name || editingPolicy?.name || ''}
                  onChange={(e) => setNewPolicy({ ...newPolicy, name: e.target.value })}
                  placeholder="Nom de la politique"
                />
              </div>
              
              <div>
                <Label htmlFor="policy-description">Description</Label>
                <Textarea
                  id="policy-description"
                  value={newPolicy.description || editingPolicy?.description || ''}
                  onChange={(e) => setNewPolicy({ ...newPolicy, description: e.target.value })}
                  placeholder="Description de la politique"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="policy-type">Type</Label>
                  <select
                    id="policy-type"
                    value={newPolicy.type || editingPolicy?.type || 'network'}
                    onChange={(e) => setNewPolicy({ ...newPolicy, type: e.target.value as any })}
                    className="w-full mt-1 p-2 border rounded-md"
                  >
                    <option value="network">Réseau</option>
                    <option value="file">Fichiers</option>
                    <option value="system">Système</option>
                    <option value="agent">Agents</option>
                    <option value="user">Utilisateurs</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="policy-priority">Priorité</Label>
                  <select
                    id="policy-priority"
                    value={newPolicy.priority || editingPolicy?.priority || 'medium'}
                    onChange={(e) => setNewPolicy({ ...newPolicy, priority: e.target.value as any })}
                    className="w-full mt-1 p-2 border rounded-md"
                  >
                    <option value="low">Faible</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Élevée</option>
                    <option value="critical">Critique</option>
                  </select>
                </div>
              </div>
              
              <div className="flex space-x-2 pt-4">
                <Button onClick={handleSavePolicy} className="flex-1">
                  {editingPolicy ? 'Modifier' : 'Créer'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsAddingPolicy(false)
                    setEditingPolicy(null)
                    setNewPolicy({})
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
