'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Progress } from '../ui/progress'
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Play, 
  Pause, 
  RefreshCw,
  Trash2,
  Eye
} from 'lucide-react'
import { useJobs } from '../../lib/hooks'
import type { JobResult } from '../../lib/types'

interface JobStats {
  totalJobs: number
  pendingJobs: number
  runningJobs: number
  completedJobs: number
  failedJobs: number
  cancelledJobs: number
  averageProcessingTime: number
}

export function JobMonitor() {
  const { stats, jobs, loading, error, getStats, getJobsList, cancelJob, getJob } = useJobs()
  const [selectedJobType, setSelectedJobType] = useState<string>('all')
  const [jobDetails, setJobDetails] = useState<JobResult | null>(null)

  useEffect(() => {
    getStats()
    getJobsList() // Charger la liste des jobs
  }, [getStats, getJobsList])

  const handleCancelJob = async (jobId: string) => {
    if (confirm('Êtes-vous sûr de vouloir annuler ce job ?')) {
      await cancelJob(jobId)
      getStats() // Recharger les stats
      getJobsList() // Recharger la liste des jobs
    }
  }

  const handleViewJobDetails = async (jobId: string) => {
    const job = await getJob(jobId)
    if (job) {
      setJobDetails(job)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'running':
        return 'bg-blue-100 text-blue-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'running':
        return <Play className="h-4 w-4" />
      case 'failed':
        return <XCircle className="h-4 w-4" />
      case 'cancelled':
        return <Pause className="h-4 w-4" />
      case 'pending':
        return <Clock className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime)
    const end = endTime ? new Date(endTime) : new Date()
    const duration = end.getTime() - start.getTime()
    
    if (duration < 1000) return '< 1s'
    if (duration < 60000) return `${Math.round(duration / 1000)}s`
    return `${Math.round(duration / 60000)}m ${Math.round((duration % 60000) / 1000)}s`
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Surveillance des Jobs</CardTitle>
          <CardDescription>Chargement...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalJobs || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Tous types confondus
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En cours</CardTitle>
            <Play className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats?.runningJobs || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Jobs en exécution
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats?.pendingJobs || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Jobs en queue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temps moyen</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.averageProcessingTime ? 
                `${Math.round(stats.averageProcessingTime / 1000)}s` : 
                'N/A'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Traitement moyen
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Détails des jobs par type */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Détails des Jobs</CardTitle>
              <CardDescription>
                Surveillance en temps réel des queues de traitement
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                getStats()
                getJobsList()
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filtre par type */}
            <div className="flex space-x-2">
              <Button
                variant={selectedJobType === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedJobType('all')}
              >
                Tous
              </Button>
              <Button
                variant={selectedJobType === 'agent_execution' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedJobType('agent_execution')}
              >
                Agents
              </Button>
              <Button
                variant={selectedJobType === 'rag_indexing' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedJobType('rag_indexing')}
              >
                RAG
              </Button>
              <Button
                variant={selectedJobType === 'workflow_execution' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedJobType('workflow_execution')}
              >
                Workflows
              </Button>
            </div>

            {/* Liste des jobs */}
            <div className="space-y-2">
              {jobs
                .filter(job => selectedJobType === 'all' || job.type === selectedJobType)
                .map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(job.status)}
                      <div>
                        <div className="font-medium text-sm">
                          Job #{job.id.slice(0, 8)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ID: {job.id.slice(0, 8)}... | 
                          Créé: {new Date(job.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {job.status === 'running' && (
                        <Progress value={job.progress || 0} className="w-20" />
                      )}
                      
                      <Badge className={getStatusColor(job.status)}>
                        {job.status}
                      </Badge>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewJobDetails(job.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      {['pending', 'running'].includes(job.status) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelJob(job.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

              {jobs.filter(job => selectedJobType === 'all' || job.type === selectedJobType).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun job trouvé pour ce type
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de détails du job */}
      {jobDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Détails du Job</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setJobDetails(null)}
              >
                ✕
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <strong>ID:</strong> {jobDetails.id}
              </div>
              <div>
                <strong>Statut:</strong> 
                <Badge className={`ml-2 ${getStatusColor(jobDetails.status)}`}>
                  {jobDetails.status}
                </Badge>
              </div>
              <div>
                <strong>Créé:</strong> {new Date(jobDetails.createdAt).toLocaleString()}
              </div>
              <div>
                <strong>Mis à jour:</strong> {new Date(jobDetails.updatedAt).toLocaleString()}
              </div>
              {jobDetails.progress !== undefined && (
                <div>
                  <strong>Progression:</strong> {jobDetails.progress}%
                </div>
              )}
              {jobDetails.error && (
                <div>
                  <strong>Erreur:</strong>
                  <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                    {jobDetails.error}
                  </div>
                </div>
              )}
              {jobDetails.result && (
                <div>
                  <strong>Résultat:</strong>
                  <pre className="mt-1 p-2 bg-muted rounded text-sm overflow-x-auto">
                    {JSON.stringify(jobDetails.result, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
