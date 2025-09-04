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
  Save, 
  RefreshCw, 
  Database, 
  Shield, 
  Bot, 
  Server,
  Network,
  HardDrive,
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface SystemConfig {
  ollama: {
    baseUrl: string
    defaultModel: string
    embedModel: string
    timeout: number
    maxTokens: number
    temperature: number
  }
  database: {
    postgresUrl: string
    redisUrl: string
    connectionPool: number
    timeout: number
  }
  security: {
    allowNetwork: boolean
    allowedDomains: string[]
    sandboxDir: string
    maxFileSize: number
    enableAudit: boolean
  }
  performance: {
    chunkSize: number
    chunkOverlap: number
    batchSize: number
    maxConcurrentJobs: number
    jobTimeout: number
    enableRateLimit: boolean
    rateLimitWindow: number
    rateLimitMax: number
  }
  logging: {
    level: string
    enableFileLogging: boolean
    logDir: string
    maxLogSize: number
    maxLogFiles: number
    enableDebug: boolean
  }
}

interface ServiceStatus {
  name: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  lastCheck: string
  responseTime: number
  details?: string
}

export function AdvancedSettings() {
  const [config, setConfig] = useState<SystemConfig>({
    ollama: {
      baseUrl: 'http://localhost:11434',
      defaultModel: 'qwen2.5:7b',
      embedModel: 'nomic-embed-text',
      timeout: 30000,
      maxTokens: 4096,
      temperature: 0.7
    },
    database: {
      postgresUrl: 'postgresql://elavira:password@localhost:5432/elavira',
      redisUrl: 'redis://localhost:6379',
      connectionPool: 10,
      timeout: 5000
    },
    security: {
      allowNetwork: false,
      allowedDomains: ['example.com', 'quebec.ca'],
      sandboxDir: './sandbox',
      maxFileSize: 50 * 1024 * 1024, // 50MB
      enableAudit: true
    },
    performance: {
      chunkSize: 1000,
      chunkOverlap: 200,
      batchSize: 10,
      maxConcurrentJobs: 5,
      jobTimeout: 300000, // 5 minutes
      enableRateLimit: true,
      rateLimitWindow: 900000, // 15 minutes
      rateLimitMax: 100
    },
    logging: {
      level: 'info',
      enableFileLogging: true,
      logDir: './logs',
      maxLogSize: 10 * 1024 * 1024, // 10MB
      maxLogFiles: 5,
      enableDebug: false
    }
  })

  const [services, setServices] = useState<ServiceStatus[]>([])
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    loadServiceStatus()
  }, [])

  const loadServiceStatus = async () => {
    // TODO: Charger depuis l'API
    const mockServices: ServiceStatus[] = [
      {
        name: 'PostgreSQL',
        status: 'healthy',
        lastCheck: new Date().toISOString(),
        responseTime: 45,
        details: 'Connecté avec succès'
      },
      {
        name: 'Redis',
        status: 'healthy',
        lastCheck: new Date().toISOString(),
        responseTime: 12,
        details: 'Queue opérationnelle'
      },
      {
        name: 'Ollama',
        status: 'healthy',
        lastCheck: new Date().toISOString(),
        responseTime: 89,
        details: 'Modèles disponibles: qwen2.5:7b, llama3.1'
      },
      {
        name: 'LanceDB',
        status: 'healthy',
        lastCheck: new Date().toISOString(),
        responseTime: 23,
        details: 'Index vectoriel opérationnel'
      }
    ]
    setServices(mockServices)
  }

  const updateConfig = (section: keyof SystemConfig, field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }

  const saveConfig = async () => {
    setSaving(true)
    try {
      // TODO: Appeler l'API pour sauvegarder la configuration
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulation
      alert('Configuration sauvegardée avec succès !')
    } catch (error) {
      alert('Erreur lors de la sauvegarde de la configuration')
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const testConnections = async () => {
    setTesting(true)
    try {
      // TODO: Tester les connexions via l'API
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulation
      await loadServiceStatus()
      alert('Tests de connexion terminés !')
    } catch (error) {
      alert('Erreur lors des tests de connexion')
      console.error(error)
    } finally {
      setTesting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800'
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800'
      case 'unhealthy':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4" />
      case 'degraded':
        return <AlertTriangle className="h-4 w-4" />
      case 'unhealthy':
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Configuration Ollama */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bot className="h-5 w-5" />
            <span>Configuration Ollama</span>
          </CardTitle>
          <CardDescription>
            Paramètres des modèles IA locaux
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>URL de base Ollama</Label>
              <Input
                value={config.ollama.baseUrl}
                onChange={(e) => updateConfig('ollama', 'baseUrl', e.target.value)}
                placeholder="http://localhost:11434"
              />
            </div>
            <div className="space-y-2">
              <Label>Modèle par défaut</Label>
              <Input
                value={config.ollama.defaultModel}
                onChange={(e) => updateConfig('ollama', 'defaultModel', e.target.value)}
                placeholder="qwen2.5:7b"
              />
            </div>
            <div className="space-y-2">
              <Label>Modèle d&apos;embeddings</Label>
              <Input
                value={config.ollama.embedModel}
                onChange={(e) => updateConfig('ollama', 'embedModel', e.target.value)}
                placeholder="nomic-embed-text"
              />
            </div>
            <div className="space-y-2">
              <Label>Timeout (ms)</Label>
              <Input
                type="number"
                value={config.ollama.timeout}
                onChange={(e) => updateConfig('ollama', 'timeout', parseInt(e.target.value))}
                min="5000"
                max="120000"
              />
            </div>
            <div className="space-y-2">
              <Label>Tokens max</Label>
              <Input
                type="number"
                value={config.ollama.maxTokens}
                onChange={(e) => updateConfig('ollama', 'maxTokens', parseInt(e.target.value))}
                min="512"
                max="8192"
              />
            </div>
            <div className="space-y-2">
              <Label>Température</Label>
              <Input
                type="number"
                step="0.1"
                value={config.ollama.temperature}
                onChange={(e) => updateConfig('ollama', 'temperature', parseFloat(e.target.value))}
                min="0"
                max="2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration base de données */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Base de données</span>
          </CardTitle>
          <CardDescription>
            Configuration PostgreSQL et Redis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>URL PostgreSQL</Label>
              <Input
                value={config.database.postgresUrl}
                onChange={(e) => updateConfig('database', 'postgresUrl', e.target.value)}
                placeholder="postgresql://user:pass@localhost:5432/db"
              />
            </div>
            <div className="space-y-2">
              <Label>URL Redis</Label>
              <Input
                value={config.database.redisUrl}
                onChange={(e) => updateConfig('database', 'redisUrl', e.target.value)}
                placeholder="redis://localhost:6379"
              />
            </div>
            <div className="space-y-2">
              <Label>Pool de connexions</Label>
              <Input
                type="number"
                value={config.database.connectionPool}
                onChange={(e) => updateConfig('database', 'connectionPool', parseInt(e.target.value))}
                min="1"
                max="50"
              />
            </div>
            <div className="space-y-2">
              <Label>Timeout connexion (ms)</Label>
              <Input
                type="number"
                value={config.database.timeout}
                onChange={(e) => updateConfig('database', 'timeout', parseInt(e.target.value))}
                min="1000"
                max="30000"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sécurité */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Sécurité</span>
          </CardTitle>
          <CardDescription>
            Paramètres de sécurité et autorisations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Accès réseau</Label>
                <p className="text-sm text-muted-foreground">
                  Autoriser les agents à accéder à Internet
                </p>
              </div>
              <Switch
                checked={config.security.allowNetwork}
                onCheckedChange={(checked) => updateConfig('security', 'allowNetwork', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Audit des actions</Label>
                <p className="text-sm text-muted-foreground">
                  Enregistrer toutes les actions des agents
                </p>
              </div>
              <Switch
                checked={config.security.enableAudit}
                onCheckedChange={(checked) => updateConfig('security', 'enableAudit', checked)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Domaines autorisés (séparés par des virgules)</Label>
            <Input
              value={config.security.allowedDomains.join(', ')}
              onChange={(e) => updateConfig('security', 'allowedDomains', e.target.value.split(',').map(d => d.trim()))}
              placeholder="example.com, quebec.ca"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Répertoire sandbox</Label>
              <Input
                value={config.security.sandboxDir}
                onChange={(e) => updateConfig('security', 'sandboxDir', e.target.value)}
                placeholder="./sandbox"
              />
            </div>
            <div className="space-y-2">
              <Label>Taille max fichier (MB)</Label>
              <Input
                type="number"
                value={config.security.maxFileSize / (1024 * 1024)}
                onChange={(e) => updateConfig('security', 'maxFileSize', parseInt(e.target.value) * 1024 * 1024)}
                min="1"
                max="1000"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Server className="h-5 w-5" />
            <span>Performance</span>
          </CardTitle>
          <CardDescription>
            Optimisations et paramètres de performance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Taille des chunks</Label>
              <Input
                type="number"
                value={config.performance.chunkSize}
                onChange={(e) => updateConfig('performance', 'chunkSize', parseInt(e.target.value))}
                min="100"
                max="5000"
              />
            </div>
            <div className="space-y-2">
              <Label>Chevauchement des chunks</Label>
              <Input
                type="number"
                value={config.performance.chunkOverlap}
                onChange={(e) => updateConfig('performance', 'chunkOverlap', parseInt(e.target.value))}
                min="0"
                max="1000"
              />
            </div>
            <div className="space-y-2">
              <Label>Taille du batch</Label>
              <Input
                type="number"
                value={config.performance.batchSize}
                onChange={(e) => updateConfig('performance', 'batchSize', parseInt(e.target.value))}
                min="1"
                max="100"
              />
            </div>
            <div className="space-y-2">
              <Label>Jobs simultanés max</Label>
              <Input
                type="number"
                value={config.performance.maxConcurrentJobs}
                onChange={(e) => updateConfig('performance', 'maxConcurrentJobs', parseInt(e.target.value))}
                min="1"
                max="20"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Limitation de débit</Label>
              <p className="text-sm text-muted-foreground">
                Activer la limitation de débit pour les API
              </p>
            </div>
            <Switch
              checked={config.performance.enableRateLimit}
              onCheckedChange={(checked) => updateConfig('performance', 'enableRateLimit', checked)}
            />
          </div>

          {config.performance.enableRateLimit && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fenêtre de limitation (ms)</Label>
                <Input
                  type="number"
                  value={config.performance.rateLimitWindow}
                  onChange={(e) => updateConfig('performance', 'rateLimitWindow', parseInt(e.target.value))}
                  min="60000"
                  max="3600000"
                />
              </div>
              <div className="space-y-2">
                <Label>Limite max par fenêtre</Label>
                <Input
                  type="number"
                  value={config.performance.rateLimitMax}
                  onChange={(e) => updateConfig('performance', 'rateLimitMax', parseInt(e.target.value))}
                  min="10"
                  max="1000"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Logging */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <HardDrive className="h-5 w-5" />
            <span>Logging</span>
          </CardTitle>
          <CardDescription>
            Configuration des logs et traces
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Niveau de log</Label>
              <select
                value={config.logging.level}
                onChange={(e) => updateConfig('logging', 'level', e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="debug">Debug</option>
                <option value="info">Info</option>
                <option value="warn">Warning</option>
                <option value="error">Error</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Répertoire des logs</Label>
              <Input
                value={config.logging.logDir}
                onChange={(e) => updateConfig('logging', 'logDir', e.target.value)}
                placeholder="./logs"
              />
            </div>
            <div className="space-y-2">
              <Label>Taille max log (MB)</Label>
              <Input
                type="number"
                value={config.logging.maxLogSize / (1024 * 1024)}
                onChange={(e) => updateConfig('logging', 'maxLogSize', parseInt(e.target.value) * 1024 * 1024)}
                min="1"
                max="100"
              />
            </div>
            <div className="space-y-2">
              <Label>Nombre max de fichiers</Label>
              <Input
                type="number"
                value={config.logging.maxLogFiles}
                onChange={(e) => updateConfig('logging', 'maxLogFiles', parseInt(e.target.value))}
                min="1"
                max="20"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Logs dans fichiers</Label>
              <p className="text-sm text-muted-foreground">
                Enregistrer les logs dans des fichiers
              </p>
            </div>
            <Switch
              checked={config.logging.enableFileLogging}
              onCheckedChange={(checked) => updateConfig('logging', 'enableFileLogging', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Mode debug</Label>
              <p className="text-sm text-muted-foreground">
                Activer les logs détaillés
              </p>
            </div>
            <Switch
              checked={config.logging.enableDebug}
              onCheckedChange={(checked) => updateConfig('logging', 'enableDebug', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* État des services */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Network className="h-5 w-5" />
                <span>État des services</span>
              </CardTitle>
              <CardDescription>
                Statut de santé des composants du système
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={testConnections}
              disabled={testing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${testing ? 'animate-spin' : ''}`} />
              Tester les connexions
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((service) => (
              <div key={service.name} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(service.status)}
                  <div>
                    <div className="font-medium">{service.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {service.details}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={getStatusColor(service.status)}>
                    {service.status === 'healthy' ? 'En ligne' :
                     service.status === 'degraded' ? 'Dégradé' : 'Hors ligne'}
                  </Badge>
                  <div className="text-xs text-muted-foreground mt-1">
                    {service.responseTime}ms
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Button onClick={saveConfig} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Sauvegarde...' : 'Sauvegarder la configuration'}
            </Button>
            <Button variant="outline" onClick={testConnections} disabled={testing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${testing ? 'animate-spin' : ''}`} />
              {testing ? 'Test en cours...' : 'Tester les connexions'}
            </Button>
            <Button variant="outline">
              Réinitialiser aux valeurs par défaut
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
