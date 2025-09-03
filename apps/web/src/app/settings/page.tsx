import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Save, RefreshCw, Database, Shield, Bot } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground">
          Configurez votre plateforme Elavira Agents
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration des modèles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bot className="h-5 w-5" />
              <span>Modèles IA</span>
            </CardTitle>
            <CardDescription>
              Configuration des modèles Ollama et LocalAI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="ollama-url">URL Ollama</Label>
              <Input
                id="ollama-url"
                defaultValue="http://localhost:11434"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="default-model">Modèle par défaut</Label>
              <Input
                id="default-model"
                defaultValue="qwen2.5:7b"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="embed-model">Modèle d&apos;embeddings</Label>
              <Input
                id="embed-model"
                defaultValue="nomic-embed-text"
                className="mt-1"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="localai" />
              <Label htmlFor="localai">Utiliser LocalAI</Label>
            </div>
          </CardContent>
        </Card>

        {/* Configuration de la base de données */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Base de données</span>
            </CardTitle>
            <CardDescription>
              Configuration PostgreSQL et LanceDB
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="postgres-url">URL PostgreSQL</Label>
              <Input
                id="postgres-url"
                defaultValue="postgresql://user:pass@localhost:5432/elavira"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="rag-dir">Répertoire RAG</Label>
              <Input
                id="rag-dir"
                defaultValue="./data/vectors"
                className="mt-1"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Statut de la base</span>
              <Badge variant="default">Connecté</Badge>
            </div>
            <Button variant="outline" className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tester la connexion
            </Button>
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
            <div className="flex items-center justify-between">
              <div>
                <Label>Accès réseau</Label>
                <p className="text-sm text-muted-foreground">
                  Autoriser les agents à accéder à Internet
                </p>
              </div>
              <Switch id="network-access" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Accès fichiers</Label>
                <p className="text-sm text-muted-foreground">
                  Autoriser l&apos;accès au système de fichiers
                </p>
              </div>
              <Switch id="filesystem-access" defaultChecked />
            </div>
            <div>
              <Label htmlFor="allowed-domains">Domaines autorisés</Label>
              <Input
                id="allowed-domains"
                defaultValue="example.com,quebec.ca"
                className="mt-1"
                placeholder="Domaine1,Domaine2"
              />
            </div>
            <div>
              <Label htmlFor="sandbox-dir">Répertoire sandbox</Label>
              <Input
                id="sandbox-dir"
                defaultValue="./sandbox"
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Performance</CardTitle>
            <CardDescription>
              Optimisations et paramètres de performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="chunk-size">Taille des chunks</Label>
              <Input
                id="chunk-size"
                type="number"
                defaultValue="1000"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="chunk-overlap">Chevauchement des chunks</Label>
              <Input
                id="chunk-overlap"
                type="number"
                defaultValue="200"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="batch-size">Taille du batch</Label>
              <Input
                id="batch-size"
                type="number"
                defaultValue="10"
                className="mt-1"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Mode debug</Label>
                <p className="text-sm text-muted-foreground">
                  Activer les logs détaillés
                </p>
              </div>
              <Switch id="debug-mode" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Button>
              <Save className="h-4 w-4 mr-2" />
              Sauvegarder les paramètres
            </Button>
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Redémarrer les services
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
