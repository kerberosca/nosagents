import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Play, Settings, Trash2 } from 'lucide-react'

export default function WorkflowsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workflows</h1>
          <p className="text-muted-foreground">
            Orchestrez vos agents pour des tâches complexes
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau workflow
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Planification de menu</CardTitle>
              <Badge variant="default">Actif</Badge>
            </div>
            <CardDescription>
              Assistant → Chef pour la création de menus
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Déclenché par une demande de menu, l'Assistant délègue au Chef pour créer un plan de repas personnalisé.
            </div>
            <div className="flex items-center justify-between">
              <div className="flex space-x-1">
                <Badge variant="outline" className="text-xs">Assistant</Badge>
                <Badge variant="outline" className="text-xs">Chef</Badge>
              </div>
              <div className="flex space-x-1">
                <Button variant="ghost" size="sm">
                  <Play className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Création d'exercice</CardTitle>
              <Badge variant="secondary">Inactif</Badge>
            </div>
            <CardDescription>
              Assistant → Prof pour la création d'exercices
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              L'Assistant reçoit une demande d'exercice et délègue au Prof pour créer du contenu pédagogique adapté.
            </div>
            <div className="flex items-center justify-between">
              <div className="flex space-x-1">
                <Badge variant="outline" className="text-xs">Assistant</Badge>
                <Badge variant="outline" className="text-xs">Prof</Badge>
              </div>
              <div className="flex space-x-1">
                <Button variant="ghost" size="sm">
                  <Play className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Analyse de documents</CardTitle>
              <Badge variant="default">Actif</Badge>
            </div>
            <CardDescription>
              Multi-agents pour l'analyse complexe
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Workflow complexe utilisant plusieurs agents pour analyser et résumer des documents.
            </div>
            <div className="flex items-center justify-between">
              <div className="flex space-x-1">
                <Badge variant="outline" className="text-xs">Assistant</Badge>
                <Badge variant="outline" className="text-xs">Prof</Badge>
                <Badge variant="outline" className="text-xs">Chef</Badge>
              </div>
              <div className="flex space-x-1">
                <Button variant="ghost" size="sm">
                  <Play className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
