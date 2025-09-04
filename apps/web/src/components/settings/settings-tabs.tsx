'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { 
  Bot, 
  Wrench, 
  Shield, 
  Settings as SettingsIcon,
  Database,
  Network,
  HardDrive,
  Zap
} from 'lucide-react'
import { ModelManager } from './model-manager'
import { ToolsManager } from './tools-manager'
import { SecurityManager } from './security-manager'
import { AdvancedSettings } from './advanced-settings'

interface Tab {
  id: string
  name: string
  icon: React.ReactNode
  description: string
  component: React.ReactNode
  badge?: string
}

export function SettingsTabs() {
  const [activeTab, setActiveTab] = useState('models')

  const tabs: Tab[] = [
    {
      id: 'models',
      name: 'Modèles IA',
      icon: <Bot className="h-4 w-4" />,
      description: 'Gérez vos modèles Ollama et LocalAI',
      component: <ModelManager />,
      badge: '4 modèles'
    },
    {
      id: 'tools',
      name: 'Outils & Plugins',
      icon: <Wrench className="h-4 w-4" />,
      description: 'Configurez les outils et permissions',
      component: <ToolsManager />,
      badge: '5 outils'
    },
    {
      id: 'security',
      name: 'Sécurité',
      icon: <Shield className="h-4 w-4" />,
      description: 'Politiques de sécurité et autorisations',
      component: <SecurityManager />,
      badge: '3 politiques'
    },
    {
      id: 'system',
      name: 'Système',
      icon: <SettingsIcon className="h-4 w-4" />,
      description: 'Configuration générale du système',
      component: <AdvancedSettings />
    }
  ]

  const activeTabData = tabs.find(tab => tab.id === activeTab)

  return (
    <div className="space-y-6">
      {/* En-tête avec navigation par onglets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <SettingsIcon className="h-6 w-6" />
            <span>Paramètres de la plateforme</span>
          </CardTitle>
          <CardDescription>
            Configurez tous les aspects de votre plateforme Elavira Agents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Navigation par onglets */}
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'outline'}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center space-x-2"
              >
                {tab.icon}
                <span>{tab.name}</span>
                {tab.badge && (
                  <Badge variant="secondary" className="ml-1">
                    {tab.badge}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Vue d'ensemble rapide */}
      <Card>
        <CardHeader>
          <CardTitle>Vue d&apos;ensemble du système</CardTitle>
          <CardDescription>
            État général des composants de la plateforme
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="flex justify-center mb-2">
                <Bot className="h-8 w-8 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-600">4</div>
              <div className="text-sm text-muted-foreground">Modèles IA</div>
              <div className="text-xs text-green-600 mt-1">3 actifs</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="flex justify-center mb-2">
                <Wrench className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-600">5</div>
              <div className="text-sm text-muted-foreground">Outils</div>
              <div className="text-xs text-green-600 mt-1">4 actifs</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="flex justify-center mb-2">
                <Shield className="h-8 w-8 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-orange-600">3</div>
              <div className="text-sm text-muted-foreground">Politiques</div>
              <div className="text-xs text-green-600 mt-1">3 actives</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="flex justify-center mb-2">
                <Database className="h-8 w-8 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-purple-600">100%</div>
              <div className="text-sm text-muted-foreground">Système</div>
              <div className="text-xs text-green-600 mt-1">Opérationnel</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contenu de l'onglet actif */}
      <div className="min-h-[600px]">
        {activeTabData?.component}
      </div>

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
          <CardDescription>
            Accès rapide aux fonctions essentielles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <Zap className="h-6 w-6" />
              <span>Test de connexion</span>
            </Button>
            
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <Network className="h-6 w-6" />
              <span>Vérifier la santé</span>
            </Button>
            
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <HardDrive className="h-6 w-6" />
              <span>Sauvegarder config</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
