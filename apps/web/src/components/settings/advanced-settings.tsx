'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
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
  XCircle,
  Clock
} from 'lucide-react'
import { apiClient } from '../../lib/api'
import type { SystemConfig } from '../../lib/types'


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
      chatTimeout: 120000, // 2 minutes - NOUVEAU PARAMÈTRE
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
    loadSystemConfig()
    loadServiceStatus()
  }, [])

  const loadSystemConfig = async () => {
    try {
      const response = await apiClient.getSystemConfig()
      if (response.success && response.data) {
        setConfig(response.data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la configuration système:', error)
    }
  }

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
      const response = await apiClient.updateSystemConfig(config)
      if (response.success) {
        alert('Configuration sauvegardée avec succès !')
        // Recharger la configuration pour s'assurer qu'elle est synchronisée
        await loadSystemConfig()
      } else {
        alert(`Erreur lors de la sauvegarde: ${response.error}`)
      }
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

  const resetConfig = async () => {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser la configuration aux valeurs par défaut ?')) {
      setSaving(true)
      try {
        const response = await apiClient.resetSystemConfig()
        if (response.success && response.data) {
          setConfig(response.data)
          alert('Configuration réinitialisée avec succès !')
        } else {
          alert(`Erreur lors de la réinitialisation: ${response.error}`)
        }
      } catch (error) {
        alert('Erreur lors de la réinitialisation de la configuration')
        console.error(error)
      } finally {
        setSaving(false)
      }
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
              <Label>Timeout Ollama (ms)</Label>
              <Input
                type="number"
                value={config.ollama.timeout}
                onChange={(e) => updateConfig('ollama', 'timeout', parseInt(e.target.value))}
                min="5000"
                max="120000"
              />
              <p className="text-xs text-muted-foreground">
                Timeout pour les requêtes vers Ollama (génération de texte)
              </p>
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

      {/* Performance - Section avec le nouveau paramètre chatTimeout */}
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
            <div className="space-y-2">
              <Label>Timeout des jobs (ms)</Label>
              <Input
                type="number"
                value={config.performance.jobTimeout}
                onChange={(e) => updateConfig('performance', 'jobTimeout', parseInt(e.target.value))}
                min="30000"
                max="600000"
              />
              <p className="text-xs text-muted-foreground">
                Timeout pour l&apos;exécution des jobs en arrière-plan
              </p>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Timeout du chat (ms)</span>
              </Label>
              <Input
                type="number"
                value={config.performance.chatTimeout}
                onChange={(e) => updateConfig('performance', 'chatTimeout', parseInt(e.target.value))}
                min="10000"
                max="300000"
              />
              <p className="text-xs text-muted-foreground">
                ⭐ Timeout pour attendre la réponse complète de l&apos;agent dans le chat
              </p>
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
            <Button variant="outline" onClick={resetConfig} disabled={saving}>
              Réinitialiser aux valeurs par défaut
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
