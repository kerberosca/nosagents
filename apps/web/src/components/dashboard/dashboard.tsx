'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Bot, BookOpen, MessageSquare, Activity, AlertCircle, CheckCircle } from 'lucide-react'
import { useAgents, useRAG, useJobs } from '../../lib/hooks'

export function Dashboard() {
  const { stats: agentStats, health: agentHealth, getStats: getAgentStats, checkHealth } = useAgents()
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
  }, [getAgentStats, getRAGStats, getJobStats, checkHealth])

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
      value: agentStats?.availableModels?.length?.toString() || '0',
      description: 'Modèles Ollama disponibles',
      icon: Activity,
      color: 'text-orange-600',
    },
  ]

  // Fonction simple pour obtenir le statut d'un service
  const getServiceStatus = (service: string) => {
    if (!agentHealth || !agentHealth[service]) {
      return { text: 'Inconnu', color: 'bg-gray-100 text-gray-800' };
    }
    
    const health = agentHealth[service];
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>État des services</CardTitle>
            <CardDescription>
              Statut des composants de la plateforme
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
                             <div className="flex items-center justify-between">
                 <span className="text-sm font-medium">Ollama</span>
                 <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getServiceStatus('ollama').color}`}>
                   {getServiceStatus('ollama').text}
                 </span>
               </div>
               <div className="flex items-center justify-between">
                 <span className="text-sm font-medium">PostgreSQL</span>
                 <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getServiceStatus('database').color}`}>
                   {getServiceStatus('database').text}
                 </span>
               </div>
               <div className="flex items-center justify-between">
                 <span className="text-sm font-medium">Job Queue</span>
                 <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getServiceStatus('jobQueue').color}`}>
                   {getServiceStatus('jobQueue').text}
                 </span>
               </div>
               <div className="flex items-center justify-between">
                 <span className="text-sm font-medium">RAG Service</span>
                 <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getServiceStatus('rag').color}`}>
                   {getServiceStatus('rag').text}
                 </span>
               </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
            <CardDescription>
              Dernières actions des agents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {jobStats?.recentJobs?.length > 0 ? (
                jobStats.recentJobs.slice(0, 3).map((job: any, index: number) => (
                  <div key={job.id} className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      job.status === 'completed' ? 'bg-green-600' :
                      job.status === 'running' ? 'bg-blue-600' :
                      job.status === 'failed' ? 'bg-red-600' :
                      'bg-gray-600'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{job.type}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(job.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-sm text-muted-foreground py-4">
                  Aucune activité récente
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
          <CardDescription>
            Accédez rapidement aux fonctionnalités principales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:bg-muted transition-colors">
              <Bot className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Nouvel agent</span>
            </button>
            <button className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:bg-muted transition-colors">
              <MessageSquare className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Nouvelle conversation</span>
            </button>
            <button className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:bg-muted transition-colors">
              <BookOpen className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Ajouter des connaissances</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
