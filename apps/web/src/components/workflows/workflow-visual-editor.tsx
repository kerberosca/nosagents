'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Badge } from '../ui/badge'
import { 
  Plus, 
  Trash2, 
  Save, 
  Play, 
  Settings, 
  ArrowRight,
  Bot,
  GitBranch,
  Clock,
  AlertCircle,
  Move,
  Link,
  Unlink,
  Eye,
  EyeOff,
  Download,
  Upload
} from 'lucide-react'

interface WorkflowNode {
  id: string
  type: 'start' | 'agent' | 'condition' | 'action' | 'end'
  position: { x: number; y: number }
  data: {
    label: string
    description?: string
    agentId?: string
    action?: string
    input?: string
    timeout?: number
    condition?: string
  }
  connections: string[] // IDs des connexions sortantes
}

interface WorkflowConnection {
  id: string
  source: string
  target: string
  label?: string
  condition?: string
}

interface Workflow {
  id: string
  name: string
  description: string
  nodes: WorkflowNode[]
  connections: WorkflowConnection[]
  timeout: number
  maxConcurrent: number
  status: 'draft' | 'active' | 'paused' | 'archived'
  createdAt: Date
  updatedAt: Date
}

export function WorkflowVisualEditor() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null)
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null)
  const [isAddingNode, setIsAddingNode] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionSource, setConnectionSource] = useState<string | null>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 800 })
  const canvasRef = useRef<HTMLDivElement>(null)

  // Simulation des données
  useEffect(() => {
    const mockWorkflows: Workflow[] = [
      {
        id: 'wf-001',
        name: 'Analyse de documents',
        description: 'Workflow pour analyser et traiter des documents',
        timeout: 3600,
        maxConcurrent: 3,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        nodes: [
          {
            id: 'start-1',
            type: 'start',
            position: { x: 100, y: 200 },
            data: { label: 'Début' },
            connections: ['agent-1']
          },
          {
            id: 'agent-1',
            type: 'agent',
            position: { x: 300, y: 200 },
            data: {
              label: 'Analyseur de documents',
              agentId: 'file-analyzer',
              action: 'analyze_document',
              input: 'document_path',
              timeout: 300
            },
            connections: ['condition-1']
          },
          {
            id: 'condition-1',
            type: 'condition',
            position: { x: 500, y: 200 },
            data: {
              label: 'Document valide ?',
              condition: 'document.isValid'
            },
            connections: ['agent-2', 'end-1']
          },
          {
            id: 'agent-2',
            type: 'agent',
            position: { x: 700, y: 100 },
            data: {
              label: 'Assistant Général',
              agentId: 'assistant-general',
              action: 'process_document',
              input: 'document.analysis',
              timeout: 600
            },
            connections: ['end-2']
          },
          {
            id: 'end-1',
            type: 'end',
            position: { x: 700, y: 300 },
            data: { label: 'Document rejeté' },
            connections: []
          },
          {
            id: 'end-2',
            type: 'end',
            position: { x: 900, y: 100 },
            data: { label: 'Document traité' },
            connections: []
          }
        ],
        connections: [
          {
            id: 'conn-1',
            source: 'start-1',
            target: 'agent-1'
          },
          {
            id: 'conn-2',
            source: 'agent-1',
            target: 'condition-1'
          },
          {
            id: 'conn-3',
            source: 'condition-1',
            target: 'agent-2',
            label: 'Oui'
          },
          {
            id: 'conn-4',
            source: 'condition-1',
            target: 'end-1',
            label: 'Non'
          },
          {
            id: 'conn-5',
            source: 'agent-2',
            target: 'end-2'
          }
        ]
      }
    ]
    
    setWorkflows(mockWorkflows)
    setSelectedWorkflow(mockWorkflows[0])
  }, [])

  const handleAddNode = (type: WorkflowNode['type'], position: { x: number; y: number }) => {
    if (!selectedWorkflow) return

    const newNode: WorkflowNode = {
      id: `node-${Date.now()}`,
      type,
      position,
      data: {
        label: type === 'start' ? 'Début' : 
               type === 'end' ? 'Fin' : 
               type === 'condition' ? 'Condition' : 'Action',
        description: '',
        timeout: 300
      },
      connections: []
    }

    setSelectedWorkflow({
      ...selectedWorkflow,
      nodes: [...selectedWorkflow.nodes, newNode]
    })
  }

  const handleDeleteNode = (nodeId: string) => {
    if (!selectedWorkflow) return

    // Supprimer les connexions associées
    const updatedConnections = selectedWorkflow.connections.filter(
      conn => conn.source !== nodeId && conn.target !== nodeId
    )

    // Supprimer le nœud
    const updatedNodes = selectedWorkflow.nodes.filter(node => node.id !== nodeId)

    setSelectedWorkflow({
      ...selectedWorkflow,
      nodes: updatedNodes,
      connections: updatedConnections
    })
  }

  const handleNodeMove = (nodeId: string, newPosition: { x: number; y: number }) => {
    if (!selectedWorkflow) return

    const updatedNodes = selectedWorkflow.nodes.map(node =>
      node.id === nodeId ? { ...node, position: newPosition } : node
    )

    setSelectedWorkflow({
      ...selectedWorkflow,
      nodes: updatedNodes
    })
  }

  const handleStartConnection = (nodeId: string) => {
    setIsConnecting(true)
    setConnectionSource(nodeId)
  }

  const handleCompleteConnection = (targetNodeId: string) => {
    if (!connectionSource || !selectedWorkflow) return

    const newConnection: WorkflowConnection = {
      id: `conn-${Date.now()}`,
      source: connectionSource,
      target: targetNodeId
    }

    setSelectedWorkflow({
      ...selectedWorkflow,
      connections: [...selectedWorkflow.connections, newConnection]
    })

    setIsConnecting(false)
    setConnectionSource(null)
  }

  const handleDeleteConnection = (connectionId: string) => {
    if (!selectedWorkflow) return

    const updatedConnections = selectedWorkflow.connections.filter(
      conn => conn.id !== connectionId
    )

    setSelectedWorkflow({
      ...selectedWorkflow,
      connections: updatedConnections
    })
  }

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'start': return <Play className="h-4 w-4" />
      case 'end': return <AlertCircle className="h-4 w-4" />
      case 'agent': return <Bot className="h-4 w-4" />
      case 'condition': return <GitBranch className="h-4 w-4" />
      case 'action': return <Settings className="h-4 w-4" />
      default: return <Settings className="h-4 w-4" />
    }
  }

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'start': return 'bg-green-500'
      case 'end': return 'bg-red-500'
      case 'agent': return 'bg-blue-500'
      case 'condition': return 'bg-yellow-500'
      case 'action': return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  const renderNode = (node: WorkflowNode) => {
    const isSelected = selectedNode?.id === node.id
    const isConnectionSource = connectionSource === node.id

    return (
      <div
        key={node.id}
        className={`absolute p-3 border-2 rounded-lg cursor-move min-w-[150px] ${
          isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-300'
        } ${isConnectionSource ? 'border-green-500' : ''}`}
        style={{
          left: node.position.x,
          top: node.position.y,
          backgroundColor: 'white'
        }}
        onClick={() => setSelectedNode(node)}
        onMouseDown={(e) => {
          if (e.button === 0) { // Clic gauche pour déplacer
            const startPos = { x: e.clientX, y: e.clientY }
            const startNodePos = { ...node.position }
            
            const handleMouseMove = (e: MouseEvent) => {
              const deltaX = e.clientX - startPos.x
              const deltaY = e.clientY - startPos.y
              handleNodeMove(node.id, {
                x: startNodePos.x + deltaX,
                y: startNodePos.y + deltaY
              })
            }
            
            const handleMouseUp = () => {
              document.removeEventListener('mousemove', handleMouseMove)
              document.removeEventListener('mouseup', handleMouseUp)
            }
            
            document.addEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseup', handleMouseUp)
          }
        }}
      >
        <div className="flex items-center space-x-2 mb-2">
          <div className={`p-1 rounded ${getNodeColor(node.type)}`}>
            {getNodeIcon(node.type)}
          </div>
          <span className="font-medium text-sm">{node.data.label}</span>
        </div>
        
        {node.data.description && (
          <p className="text-xs text-muted-foreground mb-2">
            {node.data.description}
          </p>
        )}
        
        {node.type === 'agent' && (
          <div className="space-y-1 text-xs">
            <div>Agent: {node.data.agentId}</div>
            <div>Action: {node.data.action}</div>
            <div>Timeout: {node.data.timeout}s</div>
          </div>
        )}
        
        {node.type === 'condition' && (
          <div className="text-xs text-muted-foreground">
            {node.data.condition}
          </div>
        )}
        
        <div className="flex space-x-1 mt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation()
              if (isConnecting && connectionSource !== node.id) {
                handleCompleteConnection(node.id)
              } else if (!isConnecting) {
                handleStartConnection(node.id)
              }
            }}
            className="h-6 px-2 text-xs"
          >
            {isConnecting && connectionSource !== node.id ? (
              <Link className="h-3 w-3" />
            ) : (
              <Unlink className="h-3 w-3" />
            )}
          </Button>
          
          {node.type !== 'start' && node.type !== 'end' && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                handleDeleteNode(node.id)
              }}
              className="h-6 px-2 text-xs text-red-600"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    )
  }

  const renderConnection = (connection: WorkflowConnection) => {
    const sourceNode = selectedWorkflow?.nodes.find(n => n.id === connection.source)
    const targetNode = selectedWorkflow?.nodes.find(n => n.id === connection.target)
    
    if (!sourceNode || !targetNode) return null

    const startX = sourceNode.position.x + 150 // Largeur du nœud
    const startY = sourceNode.position.y + 25 // Centre du nœud
    const endX = targetNode.position.x
    const endY = targetNode.position.y + 25

    return (
      <svg
        key={connection.id}
        className="absolute pointer-events-none"
        style={{
          left: 0,
          top: 0,
          width: canvasSize.width,
          height: canvasSize.height
        }}
      >
        <defs>
          <marker
            id={`arrow-${connection.id}`}
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <polygon points="0,0 0,6 9,3" fill="#666" />
          </marker>
        </defs>
        
        <line
          x1={startX}
          y1={startY}
          x2={endX}
          y2={endY}
          stroke="#666"
          strokeWidth="2"
          markerEnd={`url(#arrow-${connection.id})`}
        />
        
        {connection.label && (
          <text
            x={(startX + endX) / 2}
            y={(startY + endY) / 2 - 5}
            textAnchor="middle"
            className="text-xs fill-gray-600 pointer-events-auto"
          >
            {connection.label}
          </text>
        )}
        
        <Button
          size="sm"
          variant="outline"
          className="absolute h-6 px-2 text-xs bg-white"
          style={{
            left: (startX + endX) / 2 - 20,
            top: (startY + endY) / 2 - 10
          }}
          onClick={() => handleDeleteConnection(connection.id)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </svg>
    )
  }

  if (!selectedWorkflow) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Aucun workflow sélectionné</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête du workflow */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{selectedWorkflow.name}</CardTitle>
              <CardDescription>{selectedWorkflow.description}</CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Aperçu
              </Button>
              <Button>
                <Play className="h-4 w-4 mr-2" />
                Exécuter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 text-sm">
            <div>
              <span className="font-medium">Timeout:</span> {selectedWorkflow.timeout}s
            </div>
            <div>
              <span className="font-medium">Concurrent:</span> {selectedWorkflow.maxConcurrent}
            </div>
            <div>
              <span className="font-medium">Statut:</span>
              <Badge variant="outline" className="ml-2">
                {selectedWorkflow.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Barre d'outils */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium">Ajouter un nœud:</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAddNode('agent', { x: 200, y: 200 })}
            >
              <Bot className="h-4 w-4 mr-2" />
              Agent
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAddNode('condition', { x: 200, y: 200 })}
            >
              <GitBranch className="h-4 w-4 mr-2" />
              Condition
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAddNode('action', { x: 200, y: 200 })}
            >
              <Settings className="h-4 w-4 mr-2" />
              Action
            </Button>
            
            <div className="ml-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsConnecting(!isConnecting)}
                className={isConnecting ? 'bg-green-100' : ''}
              >
                <Link className="h-4 w-4 mr-2" />
                {isConnecting ? 'Connecter...' : 'Connecter'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Éditeur visuel */}
      <Card>
        <CardHeader>
          <CardTitle>Éditeur de workflow</CardTitle>
          <CardDescription>
            Glissez-déposez les nœuds et connectez-les pour créer votre workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            ref={canvasRef}
            className="relative border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 overflow-hidden"
            style={{
              width: canvasSize.width,
              height: canvasSize.height
            }}
          >
            {/* Connexions */}
            {selectedWorkflow.connections.map(renderConnection)}
            
            {/* Nœuds */}
            {selectedWorkflow.nodes.map(renderNode)}
            
            {/* Grille de fond */}
            <div className="absolute inset-0 opacity-20">
              <svg width="100%" height="100%">
                <defs>
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#ccc" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Panneau de propriétés */}
      {selectedNode && (
        <Card>
          <CardHeader>
            <CardTitle>Propriétés du nœud</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="node-label">Label</Label>
                <Input
                  id="node-label"
                  value={selectedNode.data.label}
                  onChange={(e) => {
                    if (!selectedWorkflow) return
                    const updatedNodes = selectedWorkflow.nodes.map(node =>
                      node.id === selectedNode.id
                        ? { ...node, data: { ...node.data, label: e.target.value } }
                        : node
                    )
                    setSelectedWorkflow({ ...selectedWorkflow, nodes: updatedNodes })
                    setSelectedNode({ ...selectedNode, data: { ...selectedNode.data, label: e.target.value } })
                  }}
                />
              </div>
              
              <div>
                <Label htmlFor="node-description">Description</Label>
                <Textarea
                  id="node-description"
                  value={selectedNode.data.description || ''}
                  onChange={(e) => {
                    if (!selectedWorkflow) return
                    const updatedNodes = selectedWorkflow.nodes.map(node =>
                      node.id === selectedNode.id
                        ? { ...node, data: { ...node.data, description: e.target.value } }
                        : node
                    )
                    setSelectedWorkflow({ ...selectedWorkflow, nodes: updatedNodes })
                    setSelectedNode({ ...selectedNode, data: { ...selectedNode.data, description: e.target.value } })
                  }}
                  rows={3}
                />
              </div>
              
              {selectedNode.type === 'agent' && (
                <>
                  <div>
                    <Label htmlFor="node-agent">Agent</Label>
                    <Input
                      id="node-agent"
                      value={selectedNode.data.agentId || ''}
                      onChange={(e) => {
                        if (!selectedWorkflow) return
                        const updatedNodes = selectedWorkflow.nodes.map(node =>
                          node.id === selectedNode.id
                            ? { ...node, data: { ...node.data, agentId: e.target.value } }
                            : node
                        )
                        setSelectedWorkflow({ ...selectedWorkflow, nodes: updatedNodes })
                        setSelectedNode({ ...selectedNode, data: { ...selectedNode.data, agentId: e.target.value } })
                      }}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="node-action">Action</Label>
                    <Input
                      id="node-action"
                      value={selectedNode.data.action || ''}
                      onChange={(e) => {
                        if (!selectedWorkflow) return
                        const updatedNodes = selectedWorkflow.nodes.map(node =>
                          node.id === selectedNode.id
                            ? { ...node, data: { ...node.data, action: e.target.value } }
                            : node
                        )
                        setSelectedWorkflow({ ...selectedWorkflow, nodes: updatedNodes })
                        setSelectedNode({ ...selectedNode, data: { ...selectedNode.data, action: e.target.value } })
                      }}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="node-timeout">Timeout (secondes)</Label>
                    <Input
                      id="node-timeout"
                      type="number"
                      value={selectedNode.data.timeout || 300}
                      onChange={(e) => {
                        if (!selectedWorkflow) return
                        const updatedNodes = selectedWorkflow.nodes.map(node =>
                          node.id === selectedNode.id
                            ? { ...node, data: { ...node.data, timeout: parseInt(e.target.value) || 300 } }
                            : node
                        )
                        setSelectedWorkflow({ ...selectedWorkflow, nodes: updatedNodes })
                        setSelectedNode({ ...selectedNode, data: { ...selectedNode.data, timeout: parseInt(e.target.value) || 300 } })
                      }}
                    />
                  </div>
                </>
              )}
              
              {selectedNode.type === 'condition' && (
                <div>
                  <Label htmlFor="node-condition">Condition</Label>
                  <Input
                    id="node-condition"
                    value={selectedNode.data.condition || ''}
                    onChange={(e) => {
                      if (!selectedWorkflow) return
                      const updatedNodes = selectedWorkflow.nodes.map(node =>
                        node.id === selectedNode.id
                          ? { ...node, data: { ...node.data, condition: e.target.value } }
                          : node
                      )
                      setSelectedWorkflow({ ...selectedWorkflow, nodes: updatedNodes })
                      setSelectedNode({ ...selectedNode, data: { ...selectedNode.data, condition: e.target.value } })
                    }}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

