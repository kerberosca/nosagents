'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Progress } from '../ui/progress'
import { 
  Activity, 
  Database, 
  Server, 
  Bot, 
  HardDrive, 
  Network, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'
import { useAgents } from '../../lib/hooks'

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  services: {
    database: boolean
    redis: boolean
    ollama: boolean
    rag: boolean
  }
  errors?: string[]
  uptime: number
  responseTime: number
}

interface PerformanceMetrics {
  cpuUsage: number
  memoryUsage: number
  diskUsage: number
  activeConnections: number
  requestsPerMinute: number
  averageResponseTime: number
}

export function SystemMonitor() {
  const { agents, checkHealth, health } = useAgents()
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null)
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const checkSystemHealth = async () => {
    setLoading(true)
    try {
      console.log('🔍 Début de checkSystemHealth')
      await checkHealth()
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Erreur lors de la vérification de la santé:', error)
    } finally {
      setLoading(false)
    }
  }

  const getHealthStatusColor = (status: string) => {
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

  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4" />
      case 'degraded':
        return <AlertTriangle className="h-4 w-4" />
      case 'unhealthy':
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (days > 0) return `${days}j ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  useEffect(() => {
    checkSystemHealth()
    // Vérifier la santé toutes les 2 minutes (pour éviter le rate limiting)
    const interval = setInterval(checkSystemHealth, 120000)
    return () => clearInterval(interval)
  }, [])

  // Données simulées pour les performances (en attendant l'API)
  useEffect(() => {
    const mockPerformance = {
      cpuUsage: Math.random() * 100,
      memoryUsage: Math.random() * 100,
      diskUsage: Math.random() * 100,
      activeConnections: Math.floor(Math.random() * 50),
      requestsPerMinute: Math.floor(Math.random() * 100),
      averageResponseTime: Math.random() * 1000
    }
    setPerformance(mockPerformance)
  }, [])

  return (
    <div className="space-y-6">
      {/* État de santé global */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>État de santé du système</span>
              </CardTitle>
              <CardDescription>
                Surveillance en temps réel des services et composants
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              {lastUpdate && (
                <span className="text-sm text-muted-foreground">
                  Dernière mise à jour: {lastUpdate.toLocaleTimeString()}
                </span>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={checkSystemHealth}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {health ? (
            <div className="space-y-4">
              {/* Statut global */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                                 <div className="flex items-center space-x-3">
                   {getHealthStatusIcon(health.status)}
                                     <div>
                     <div className="font-medium">État global du système</div>
                     <div className="text-sm text-muted-foreground">
                       Dernière vérification: {health.timestamp ? new Date(health.timestamp).toLocaleString() : 'N/A'}
                     </div>
                   </div>
                 </div>
                 <Badge className={getHealthStatusColor(health.status)}>
                   {health.status === 'healthy' ? 'En bonne santé' :
                    health.status === 'degraded' ? 'Dégradé' : 'Problème détecté'}
                 </Badge>
              </div>

              {/* Services individuels */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                 <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <Database className={`h-5 w-5 ${health?.database?.status === 'healthy' ? 'text-green-600' : 'text-red-600'}`} />
                  <div>
                    <div className="font-medium text-sm">Base de données</div>
                    <Badge variant={health?.database?.status === 'healthy' ? 'default' : 'destructive'} className="text-xs">
                      {health?.database?.status === 'healthy' ? 'En ligne' : 'Hors ligne'}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <Server className={`h-5 w-5 ${health?.jobQueue?.status === 'healthy' ? 'text-green-600' : 'text-red-600'}`} />
                  <div>
                    <div className="font-medium text-sm">Job Queue</div>
                    <Badge variant={health?.jobQueue?.status === 'healthy' ? 'default' : 'destructive'} className="text-xs">
                      {health?.jobQueue?.status === 'healthy' ? 'En ligne' : 'Hors ligne'}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <Bot className={`h-5 w-5 ${health?.ollama?.status === 'healthy' ? 'text-green-600' : 'text-red-600'}`} />
                  <div>
                    <div className="font-medium text-sm">Ollama</div>
                    <Badge variant={health?.ollama?.status === 'healthy' ? 'default' : 'destructive'} className="text-xs">
                      {health?.ollama?.status === 'healthy' ? 'En ligne' : 'Hors ligne'}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center space-x-5 p-3 border rounded-lg">
                  <HardDrive className={`h-5 w-5 ${health?.rag?.status === 'healthy' ? 'text-green-600' : 'text-red-600'}`} />
                  <div>
                    <div className="font-medium text-sm">Système RAG</div>
                    <Badge variant={health?.rag?.status === 'healthy' ? 'default' : 'destructive'} className="text-xs">
                      {health?.rag?.status === 'healthy' ? 'En ligne' : 'Hors ligne'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Métriques système */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                 <div className="text-center p-3 border rounded-lg">
                   <div className="text-2xl font-bold text-blue-600">
                     {formatUptime(health.uptime || 0)}
                   </div>
                   <div className="text-sm text-muted-foreground">Temps de fonctionnement</div>
                 </div>

                 <div className="text-center p-3 border rounded-lg">
                   <div className="text-2xl font-bold text-green-600">
                     {health.responseTime || 0}ms
                   </div>
                   <div className="text-sm text-muted-foreground">Temps de réponse</div>
                 </div>

                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {agents.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Agents actifs</div>
                </div>
              </div>

                             {/* Erreurs détectées */}
               {health.errors && health.errors.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="font-medium text-red-800">Erreurs détectées</span>
                  </div>
                                    <ul className="text-sm text-red-700 space-y-1">
                    {health.errors.map((error: string, index: number) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {loading ? 'Vérification de la santé...' : 'Aucune information de santé disponible'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Métriques de performance */}
      {performance && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Network className="h-5 w-5" />
              <span>Métriques de performance</span>
            </CardTitle>
            <CardDescription>
              Surveillance des ressources système et des performances
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* CPU */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Utilisation CPU</span>
                  <span className="text-sm text-muted-foreground">
                    {performance.cpuUsage.toFixed(1)}%
                  </span>
                </div>
                <Progress value={performance.cpuUsage} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  {performance.cpuUsage < 50 ? 'Normal' : 
                   performance.cpuUsage < 80 ? 'Élevé' : 'Critique'}
                </div>
              </div>

              {/* Mémoire */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Utilisation mémoire</span>
                  <span className="text-sm text-muted-foreground">
                    {performance.memoryUsage.toFixed(1)}%
                  </span>
                </div>
                <Progress value={performance.memoryUsage} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  {performance.memoryUsage < 70 ? 'Normal' : 
                   performance.memoryUsage < 90 ? 'Élevé' : 'Critique'}
                </div>
              </div>

              {/* Disque */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Utilisation disque</span>
                  <span className="text-sm text-muted-foreground">
                    {performance.diskUsage.toFixed(1)}%
                  </span>
                </div>
                <Progress value={performance.diskUsage} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  {performance.diskUsage < 80 ? 'Normal' : 
                   performance.diskUsage < 95 ? 'Élevé' : 'Critique'}
                </div>
              </div>

              {/* Connexions actives */}
              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {performance.activeConnections}
                </div>
                <div className="text-sm text-muted-foreground">Connexions actives</div>
              </div>

              {/* Requêtes par minute */}
              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {performance.requestsPerMinute}
                </div>
                <div className="text-sm text-muted-foreground">Requêtes/min</div>
              </div>

              {/* Temps de réponse moyen */}
              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {performance.averageResponseTime.toFixed(0)}ms
                </div>
                <div className="text-sm text-muted-foreground">Temps de réponse moyen</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
