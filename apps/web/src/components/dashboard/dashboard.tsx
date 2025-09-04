'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Bot, BookOpen, MessageSquare, Activity, AlertCircle, CheckCircle } from 'lucide-react'
import { useAgents, useRAG, useJobs } from '../../lib/hooks'
import { JobMonitor } from './job-monitor'
import { SystemMonitor } from './system-monitor'
import { Badge } from '../ui/badge'

export function Dashboard() {
  const { stats: agentStats, health: agentHealth, getStats: getAgentStats, checkHealth, getModels, models } = useAgents()
  const { stats: ragStats, getStats: getRAGStats } = useRAG()
  const { stats: jobStats, getStats: getJobStats } = useJobs()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      console.log('🔄 Dashboard: Chargement des statistiques...')
      setIsLoading(true)
      
      try {
        console.log('📊 Dashboard: Appel de getAgentStats()')
        await getAgentStats()
        
        console.log('📊 Dashboard: Appel de getModels()')
        await getModels()
        
        console.log('📊 Dashboard: Appel de getRAGStats()')
        await getRAGStats()
        
        console.log('📊 Dashboard: Appel de getJobStats()')
        await getJobStats()
        
        console.log('🏥 Dashboard: Appel de checkHealth()')
        await checkHealth()
        
        console.log('✅ Dashboard: Toutes les statistiques chargées')
      } catch (error) {
        console.error('❌ Dashboard: Erreur lors du chargement:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()
  }, [getAgentStats, getModels, getRAGStats, getJobStats, checkHealth])

  const stats = [
    {
      title: 'Agents actifs',
      value: agentStats?.totalAgents?.toString() || '0',
      description: 'Agents configurés et prêts',
      icon: Bot,
      color: 'text-blue-600',
    },
    {
      title: 'Documents indexés',
      value: ragStats?.totalDocuments?.toString() || '0',
      description: 'Documents dans la base RAG',
      icon: BookOpen,
      color: 'text-green-600',
    },
    {
      title: 'Jobs en cours',
      value: jobStats?.activeJobs?.toString() || '0',
      description: 'Tâches en cours d\'exécution',
      icon: MessageSquare,
      color: 'text-purple-600',
    },
    {
      title: 'Modèles disponibles',
      value: models?.length?.toString() || '0',
      description: 'Modèles Ollama disponibles',
      icon: Activity,
      color: 'text-orange-600',
    },
  ]

  // Debug: afficher les données reçues
  console.log('🔍 Dashboard - agentStats:', agentStats);
  console.log('🔍 Dashboard - ragStats:', ragStats);
  console.log('🔍 Dashboard - jobStats:', jobStats);

  // Fonction simple pour obtenir le statut d'un service
  const getServiceStatus = (service: string) => {
    // Mapping des noms d'affichage vers les noms réels de l'API
    const serviceMapping: { [key: string]: string } = {
      'agents': 'ollama',      // Les agents utilisent Ollama
      'rag': 'rag',            // RAG reste RAG
      'worker': 'jobQueue',    // Le worker gère la queue des jobs
      'system': 'database'     // Le système dépend de la base de données
    };
    
    const realServiceName = serviceMapping[service];
    if (!agentHealth || !agentHealth[realServiceName]) {
      return { text: 'Inconnu', color: 'bg-gray-100 text-gray-800' };
    }
    
    const health = agentHealth[realServiceName];
    if (health.status === 'healthy') {
      return { text: 'En ligne', color: 'bg-green-100 text-green-800' };
    } else if (health.status === 'unhealthy') {
      return { text: 'Hors ligne', color: 'bg-red-100 text-red-800' };
    } else {
      return { text: 'Inconnu', color: 'bg-gray-100 text-gray-800' };
    }
  };

  console.log('🔄 Dashboard - agentHealth:', agentHealth);

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? '...' : stat.value}
              </div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* État des services */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>État des services</span>
          </CardTitle>
          <CardDescription>
            Statut de santé des composants de la plateforme
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <Bot className="h-5 w-5 text-blue-600" />
              <div>
                <div className="font-medium text-sm">Agents</div>
                <Badge className={getServiceStatus('agents').color}>
                  {getServiceStatus('agents').text}
                </Badge>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <BookOpen className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium text-sm">RAG</div>
                <Badge className={getServiceStatus('rag').color}>
                  {getServiceStatus('rag').text}
                </Badge>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <MessageSquare className="h-5 w-5 text-purple-600" />
              <div>
                <div className="font-medium text-sm">Worker</div>
                <Badge className={getServiceStatus('worker').color}>
                  {getServiceStatus('worker').text}
                </Badge>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <Activity className="h-5 w-5 text-orange-600" />
              <div>
                <div className="font-medium text-sm">Système</div>
                <Badge className={getServiceStatus('system').color}>
                  {getServiceStatus('system').text}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Surveillance des jobs */}
      <JobMonitor />

      {/* Surveillance du système */}
      <SystemMonitor />
    </div>
  )
}
